const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const multer = require('multer');
const path   = require('path');
const db     = require('../db');
const { sendMail } = require('../utils/mailer');

const upload = multer({
  dest: path.join(__dirname, '../uploads'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    cb(null, file.mimetype === 'application/pdf');
  },
});

router.use(authenticate, authorize('officer', 'admin'));

router.get('/applications', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT a.*, u.full_name, u.email, s.name as service_name
       FROM applications a
       JOIN users u ON a.user_id=u.id
       JOIN services s ON a.service_id=s.id
       WHERE a.deleted_at IS NULL ORDER BY a.submitted_at DESC`);
    res.json({ data: rows });
  } catch(e){ next(e); }
});

router.patch('/applications/:id', upload.single('document'), async (req, res, next) => {
  try {
    const { status, officer_notes } = req.body;
    const allowed = ['under_review','pending_info','approved','rejected'];
    if (!allowed.includes(status)) return res.status(400).json({ error: 'INVALID_STATUS' });
    const docPath = req.file ? `/uploads/${req.file.filename}` : null;
    const [cur]   = await db.query(
      `SELECT a.status, a.reference_no, a.document_path, a.document_name, u.full_name, u.email, s.name as service_name
       FROM applications a
       JOIN users u ON a.user_id = u.id
       JOIN services s ON a.service_id = s.id
       WHERE a.id = ?`,
      [req.params.id]
    );
    if (!cur[0]) return res.status(404).json({ error: 'NOT_FOUND' });
    await db.query(
      `UPDATE applications SET status=?, officer_notes=?, reviewed_by=?, reviewed_at=NOW()
       ${docPath ? ', document_path=?, document_name=?' : ''} WHERE id=?`,
      docPath
        ? [status, officer_notes, req.user.id, docPath, req.file.originalname, req.params.id]
        : [status, officer_notes, req.user.id, req.params.id]
    );
    await db.query(
      'INSERT INTO app_status_logs (id,application_id,changed_by,old_status,new_status,note) VALUES(UUID(),?,?,?,?,?)',
      [req.params.id, req.user.id, cur[0].status, status, officer_notes||null]);

    const downloadUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/applications/${req.params.id}/document`;
    const subjectMap = {
      under_review: 'Your application is under review',
      pending_info: 'Additional information required for your application',
      approved: 'Your application has been approved',
      rejected: 'Your application has been rejected',
    };
    const messageMap = {
      under_review: `Your application ${cur[0].reference_no} for ${cur[0].service_name} is now under review.`,
      pending_info: `Your application ${cur[0].reference_no} for ${cur[0].service_name} needs additional information.`,
      approved: `Your application ${cur[0].reference_no} for ${cur[0].service_name} has been approved. You can download the approved document here: ${downloadUrl}`,
      rejected: `Your application ${cur[0].reference_no} for ${cur[0].service_name} has been rejected.${officer_notes ? ` Reason: ${officer_notes}` : ''}`,
    };

    sendMail({
      to: cur[0].email,
      subject: subjectMap[status],
      text: messageMap[status],
      html: `<p>${messageMap[status]}</p>`,
    }).catch((error) => console.error('Application status email failed:', error.message));

    res.json({ data: { updated: true } });
  } catch(e){ next(e); }
});

module.exports = router;
