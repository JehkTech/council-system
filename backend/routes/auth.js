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
const publicResetBaseUrl = () => process.env.RESET_BASE_URL || process.env.CLIENT_URL || 'http://localhost:5173';

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

router.post('/forgot-password', [body('email').isEmail().normalizeEmail()], async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT id,email FROM users WHERE email=? AND deleted_at IS NULL', [req.body.email]);
    if (rows[0]) {
      const raw = crypto.randomBytes(32).toString('hex');
      const hashed = hashToken(raw);
      const resetUrl = `${publicResetBaseUrl().replace(/\/$/, '')}/reset-password?token=${raw}`;

      await db.query(
        'INSERT INTO password_reset_tokens (id,user_id,token_hash,expires_at) VALUES(UUID(),?,?,DATE_ADD(NOW(),INTERVAL 1 HOUR))',
        [rows[0].id, hashed]);

      await sendMail({
        to: rows[0].email,
        subject: 'Reset your Local Council Services password',
        text: `Use this link to reset your password: ${resetUrl}\n\nThis link expires in 1 hour.`,
        html: `<p>Use this link to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 1 hour.</p>`,
      });
    }

    res.json({ data: { message: 'If that email exists, a reset link was sent.' } });
  } catch(e){ next(e); }
});

router.post('/reset-password', [
  body('token').isLength({ min: 64, max: 64 }),
  body('password').isLength({ min: 8 }),
], async (req, res, next) => {
  const err = validationResult(req);
  if (!err.isEmpty()) return res.status(400).json({ error: 'INVALID_INPUT' });

  const conn = await db.getConnection();
  try {
    const tokenHash = hashToken(req.body.token);
    const [rows] = await conn.query(
      `SELECT id, user_id
       FROM password_reset_tokens
       WHERE token_hash = ?
         AND used_at IS NULL
         AND expires_at > NOW()
       LIMIT 1`,
      [tokenHash]
    );

    if (!rows[0]) return res.status(400).json({ error: 'TOKEN_INVALID' });

    const passwordHash = await bcrypt.hash(req.body.password, 12);

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
