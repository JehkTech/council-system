const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const db = require('../db');

const sign = (user) => jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

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
    const [rows] = await db.query('SELECT id FROM users WHERE email=?', [req.body.email]);
    if (rows[0]) {
      const raw = crypto.randomBytes(32).toString('hex');
      const hashed = crypto.createHash('sha256').update(raw).digest('hex');
      await db.query(
        'INSERT INTO password_reset_tokens (id,user_id,token_hash,expires_at) VALUES(UUID(),?,?,DATE_ADD(NOW(),INTERVAL 1 HOUR))',
        [rows[0].id, hashed]);
    }
    res.json({ data: { message: 'If that email exists, a reset link was sent.' } });
  } catch(e){ next(e); }
});

module.exports = router;
