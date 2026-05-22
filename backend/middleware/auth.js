const jwt = require('jsonwebtoken');
const db  = require('../db');

exports.authenticate = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer '))
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  try {
    const payload = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    const [rows]  = await db.query(
      'SELECT id, role, is_active FROM users WHERE id = ? AND deleted_at IS NULL', [payload.id]
    );
    if (!rows[0] || !rows[0].is_active) return res.status(401).json({ error: 'UNAUTHORIZED' });
    req.user = rows[0];
    next();
  } catch { res.status(401).json({ error: 'TOKEN_INVALID' }); }
};

exports.authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) return res.status(403).json({ error: 'FORBIDDEN' });
  next();
};
