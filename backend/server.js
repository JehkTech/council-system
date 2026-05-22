require('dotenv').config();
const express = require('express');
const helmet  = require('helmet');
const cors    = require('cors');
const rateLimit = require('express-rate-limit');
const path    = require('path');

const authRoutes         = require('./routes/auth');
const applicationRoutes  = require('./routes/applications');
const adminRoutes        = require('./routes/admin');
const notificationRoutes = require('./routes/notifications');
const serviceRoutes      = require('./routes/services');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '10kb' }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true });
app.use('/api', limiter);

app.use('/api/auth',         authRoutes);
app.use('/api/services',     serviceRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/admin',        adminRoutes);
app.use('/api/notify',       notificationRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/health', (_, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'INTERNAL_SERVER_ERROR' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Council API running on port ${PORT}`));
