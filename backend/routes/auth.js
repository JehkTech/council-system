const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const db = require('../db');
const { sendMail } = require('../utils/mailer');

const sign = (user) => jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

router.post('/register', [
  body('full_name').trim().notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
], async (req, res, next) => {
  const err = validationResult(req);
  if (!err.isEmpty()) return res.status(400).json({ error: err.array()[0].msg });
  try {
    const { full_name, email, password, phone } = req.body;
    const [ex] = await db.query('SELECT id FROM users WHERE email=?', [email]);
    if (ex.length) return res.status(409).json({ error: 'EMAIL_IN_USE' });
    const hash = await bcrypt.hash(password, 12);
    const id   = uuidv4();
    await db.query('INSERT INTO users (id,full_name,email,password_hash,phone) VALUES(?,?,?,?,?)',
      [id, full_name, email, hash, phone||null]);
    res.status(201).json({ data: { token: sign({id,role:'citizen'}), user: {id,full_name,email,role:'citizen'} } });
  } catch(e){ next(e); }
});

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res, next) => {
  if (!validationResult(req).isEmpty()) return res.status(400).json({ error: 'INVALID_INPUT' });
  try {
    const { email, password } = req.body;
    const [rows] = await db.query(
      'SELECT id,full_name,email,password_hash,role,is_active FROM users WHERE email=? AND deleted_at IS NULL', [email]);
    const user = rows[0];
    if (!user || !user.is_active || !(await bcrypt.compare(password, user.password_hash)))
      return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
    const { password_hash, ...safe } = user;
    res.json({ data: { token: sign(user), user: safe } });
  } catch(e){ next(e); }
});

router.post('/forgot-password-otp', [
  body('email').isEmail().normalizeEmail(),
], async (req, res, next) => {
  const err = validationResult(req);
  if (!err.isEmpty()) return res.status(400).json({ error: 'INVALID_INPUT' });

  try {
    const { email } = req.body;
    const [rows] = await db.query('SELECT id,email FROM users WHERE email=? AND deleted_at IS NULL', [email]);
    if (rows[0]) {
      // Invalidate (delete) any previous reset tokens for this user
      await db.query('DELETE FROM password_reset_tokens WHERE user_id = ?', [rows[0].id]);

      let inserted = false;
      let otp;
      let hashed;
      let attempts = 0;
      // Retry loop to handle rare global OTP collisions
      while (!inserted && attempts < 5) {
        attempts++;
        otp = crypto.randomInt(100000, 1000000).toString();
        hashed = hashToken(otp);
        try {
          await db.query(
            'INSERT INTO password_reset_tokens (id,user_id,token_hash,expires_at) VALUES(UUID(),?,?,DATE_ADD(NOW(),INTERVAL 15 MINUTE))',
            [rows[0].id, hashed]
          );
          inserted = true;
        } catch (dbErr) {
          if (dbErr.code === 'ER_DUP_ENTRY') {
            continue;
          }
          throw dbErr;
        }
      }

      if (!inserted) {
        throw new Error('Failed to generate a unique OTP after multiple attempts');
      }

      await sendMail({
        to: rows[0].email,
        subject: 'Reset your Local Council Services password',
        text: `Your password reset OTP is: ${otp}\n\nThis OTP is valid for 15 minutes.`,
        html: `<p>Your password reset OTP is:</p><h2 style="font-size: 24px; letter-spacing: 2px;">${otp}</h2><p>This OTP is valid for 15 minutes.</p>`,
      });

      if (process.env.NODE_ENV !== 'production') {
        console.log(`[password-reset] OTP sent to ${rows[0].email}: ${otp} (expires in 15 minutes)`);
      }
    }

    res.json({ data: { message: 'If that email exists, an OTP was sent.' } });
  } catch (e) {
    next(e);
  }
});

router.post('/reset-password-otp', [
  body('email').isEmail().normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 }).isNumeric(),
  body('password').isLength({ min: 8 }),
], async (req, res, next) => {
  const err = validationResult(req);
  if (!err.isEmpty()) return res.status(400).json({ error: 'INVALID_INPUT' });

  const conn = await db.getConnection();
  try {
    const { email, otp, password } = req.body;
    const otpHash = hashToken(otp);

    // Look up the active token using the OTP hash and email
    const [rows] = await conn.query(
      `SELECT prt.id, prt.user_id
       FROM password_reset_tokens prt
       JOIN users u ON prt.user_id = u.id
       WHERE prt.token_hash = ?
         AND u.email = ?
         AND prt.used_at IS NULL
         AND prt.expires_at > NOW()
         AND u.deleted_at IS NULL
       LIMIT 1`,
      [otpHash, email]
    );

    if (!rows[0]) return res.status(400).json({ error: 'TOKEN_INVALID' });

    const passwordHash = await bcrypt.hash(password, 12);

    await conn.beginTransaction();
    await conn.query('UPDATE users SET password_hash=? WHERE id=?', [passwordHash, rows[0].user_id]);
    await conn.query('UPDATE password_reset_tokens SET used_at=NOW() WHERE id=?', [rows[0].id]);
    await conn.commit();

    res.json({ data: { updated: true } });
  } catch (e) {
    await conn.rollback();
    next(e);
  } finally {
    conn.release();
  }
});

module.exports = router;
