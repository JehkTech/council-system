const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { sendMail } = require('../utils/mailer');

router.use(authenticate);

router.post('/email', async (req, res, next) => {
  try {
    const { to, subject, text, html } = req.body;

    if (!to || !subject || (!text && !html)) {
      return res.status(400).json({ error: 'INVALID_INPUT' });
    }

    const result = await sendMail({ to, subject, text, html });
    res.status(202).json({ data: { messageId: result.messageId } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
