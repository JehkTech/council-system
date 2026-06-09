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

const net = require('net');

const BASE_PORT = Number(process.env.PORT) || 3000;
const MAX_PORT_TRIES = 5;

function isPortFree(port) {
  return new Promise((resolve) => {
    const probe = net.createServer();
    probe.once('error', () => resolve(false));
    probe.once('listening', () => probe.close(() => resolve(true)));
    probe.listen(port);
  });
}

async function resolvePort(start) {
  for (let i = 0; i < MAX_PORT_TRIES; i++) {
    const port = start + i;
    if (await isPortFree(port)) return port;
    if (i < MAX_PORT_TRIES - 1) {
      console.log(`Port ${port} is in use, trying ${port + 1}...`);
    }
  }
  return null;
}

function printPortInUseHelp(blockedPort) {
  const suggested = blockedPort + 1;
  console.error(`\nPort ${blockedPort} is already in use (EADDRINUSE).`);
  console.error(`Ports ${blockedPort}–${blockedPort + MAX_PORT_TRIES - 1} are unavailable.`);
  console.error('Free the existing process, or start on another port:');
  console.error(`  PowerShell:  $env:PORT=${suggested}; npm start`);
  console.error(`  Cmd:         set PORT=${suggested} && npm start`);
  console.error(`Then set VITE_API_URL=http://localhost:${suggested}/api in frontend/.env\n`);
}

(async () => {
  const port = await resolvePort(BASE_PORT);
  if (!port) {
    printPortInUseHelp(BASE_PORT);
    process.exit(1);
  }

  if (port !== BASE_PORT) {
    console.log(`Port ${BASE_PORT} is in use — starting on port ${port} instead.`);
    console.log(`Update frontend VITE_API_URL to http://localhost:${port}/api if needed.`);
  }

  const server = app.listen(port, () => console.log(`Council API running on port ${port}`));
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      printPortInUseHelp(port);
      process.exit(1);
    }
    throw err;
  });
})();
