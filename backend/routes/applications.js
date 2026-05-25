const router = require('express').Router();
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { authenticate } = require('../middleware/auth');
const db = require('../db');
const { sendMail } = require('../utils/mailer');

router.use(authenticate);

async function loadApplication(id, user) {
  const [rows] = await db.query(
    `SELECT a.*, s.name as service_name, s.category, u.full_name, u.email
     FROM applications a
     JOIN services s ON a.service_id = s.id
     JOIN users u ON a.user_id = u.id
     WHERE a.id = ? AND a.deleted_at IS NULL`,
    [id]
  );

  const application = rows[0];
  if (!application) return null;

  if (!['admin', 'officer'].includes(user.role) && application.user_id !== user.id) {
    return null;
  }

  return application;
}

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT a.*, s.name as service_name, s.category
       FROM applications a JOIN services s ON a.service_id = s.id
       WHERE a.user_id = ? AND a.deleted_at IS NULL ORDER BY a.submitted_at DESC`,
      [req.user.id]
    );
    res.json({ data: rows });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const application = await loadApplication(req.params.id, req.user);
    if (!application) return res.status(404).json({ error: 'NOT_FOUND' });
    res.json({ data: application });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { service_id, applicant_notes } = req.body;
    const id = uuidv4();
    const [countRows] = await db.query('SELECT COUNT(*) + 1 AS n FROM applications');
    const referenceNo = `LCS-${new Date().getFullYear()}-${String(countRows[0].n).padStart(4, '0')}`;
    const [userRows] = await db.query('SELECT full_name, email FROM users WHERE id = ?', [req.user.id]);
    const [serviceRows] = await db.query('SELECT name FROM services WHERE id = ?', [service_id]);

    await db.query(
      'INSERT INTO applications (id, reference_no, user_id, service_id, applicant_notes) VALUES (?,?,?,?,?)',
      [id, referenceNo, req.user.id, service_id, applicant_notes || null]
    );
    await db.query(
      'INSERT INTO app_status_logs (id, application_id, changed_by, new_status) VALUES (UUID(), ?, ?, ?)',
      [id, req.user.id, 'submitted']
    );

    if (userRows[0] && serviceRows[0]) {
      sendMail({
        to: userRows[0].email,
        subject: `Application submitted - ${referenceNo}`,
        text: `Hello ${userRows[0].full_name},\n\nYour application for ${serviceRows[0].name} has been submitted successfully. Your reference number is ${referenceNo}.`,
        html: `<p>Hello ${userRows[0].full_name},</p><p>Your application for <strong>${serviceRows[0].name}</strong> has been submitted successfully.</p><p>Your reference number is <strong>${referenceNo}</strong>.</p>`,
      }).catch((error) => console.error('Application submission email failed:', error.message));
    }

    res.status(201).json({ data: { id, reference_no: referenceNo } });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/timeline', async (req, res, next) => {
  try {
    const application = await loadApplication(req.params.id, req.user);
    if (!application) return res.status(404).json({ error: 'NOT_FOUND' });

    const [rows] = await db.query(
      'SELECT * FROM app_status_logs WHERE application_id = ? ORDER BY created_at ASC',
      [req.params.id]
    );
    res.json({ data: rows });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/document', async (req, res, next) => {
  try {
    const application = await loadApplication(req.params.id, req.user);
    if (!application) return res.status(404).json({ error: 'NOT_FOUND' });
    if (application.status !== 'approved') return res.status(403).json({ error: 'DOCUMENT_NOT_AVAILABLE' });
    if (!application.document_path) return res.status(404).json({ error: 'DOCUMENT_NOT_FOUND' });

    const filePath = path.join(__dirname, '..', application.document_path.replace(/^\//, ''));
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'DOCUMENT_NOT_FOUND' });

    return res.download(filePath, application.document_name || path.basename(filePath));
  } catch (error) {
    next(error);
  }
});

module.exports = router;
