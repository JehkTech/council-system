const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT a.*, s.name as service_name, s.category
       FROM applications a JOIN services s ON a.service_id=s.id
       WHERE a.user_id=? AND a.deleted_at IS NULL ORDER BY a.submitted_at DESC`,
      [req.user.id]);
    res.json({ data: rows });
  } catch(e){ next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const { service_id, applicant_notes } = req.body;
    const id  = uuidv4();
    const [c] = await db.query('SELECT COUNT(*)+1 AS n FROM applications');
    const ref = `LCS-${new Date().getFullYear()}-${String(c[0].n).padStart(4,'0')}`;
    await db.query(
      'INSERT INTO applications (id,reference_no,user_id,service_id,applicant_notes) VALUES(?,?,?,?,?)',
      [id, ref, req.user.id, service_id, applicant_notes||null]);
    await db.query(
      'INSERT INTO app_status_logs (id,application_id,changed_by,new_status) VALUES(UUID(),?,?,?)',
      [id, req.user.id, 'submitted']);
    res.status(201).json({ data: { id, reference_no: ref } });
  } catch(e){ next(e); }
});

router.get('/:id/timeline', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM app_status_logs WHERE application_id=? ORDER BY created_at ASC',
      [req.params.id]);
    res.json({ data: rows });
  } catch(e){ next(e); }
});

module.exports = router;
