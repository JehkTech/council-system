const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const db = require('../db');

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT id, code, name, category, description
       FROM services
       WHERE is_active = 1
       ORDER BY FIELD(category, 'permit', 'certificate', 'registration'), name`
    );

    res.json({ data: rows });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
