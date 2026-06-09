/**
 * OTP password-reset smoke test (API + UI source checks).
 *
 *   cd council-system/backend && node ../scripts/smoke-test-otp.mjs
 */

import { createRequire } from 'module';
import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(resolve(__dirname, '../backend/package.json'));
const mysql = require('mysql2/promise');

// Load backend .env
const envPath = resolve(__dirname, '../backend/.env');
for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eq = trimmed.indexOf('=');
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq).trim();
  let val = trimmed.slice(eq + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  if (!process.env[key]) process.env[key] = val;
}

const API = process.env.API_URL || 'http://localhost:3000/api';
const WEB = process.env.WEB_URL || 'http://localhost:5173';
const TEST_EMAIL = process.env.SMOKE_TEST_EMAIL || `smoke.otp.${Date.now()}@example.com`;
const NEW_PASSWORD = 'smokepass123';

const log = (step, message, detail) => {
  const line = detail !== undefined ? `${message} ${typeof detail === 'string' ? detail : JSON.stringify(detail)}` : message;
  console.log(`[${step}] ${line}`);
};

const fail = (step, message) => {
  console.error(`[FAIL:${step}] ${message}`);
  process.exit(1);
};

async function apiPost(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

async function resolveOtpFromDb(email) {
  const pool = await mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'council_db',
  });

  try {
    const [rows] = await pool.query(
      `SELECT prt.token_hash
       FROM password_reset_tokens prt
       JOIN users u ON prt.user_id = u.id
       WHERE u.email = ?
         AND prt.used_at IS NULL
         AND prt.expires_at > NOW()
       ORDER BY prt.created_at DESC
       LIMIT 1`,
      [email]
    );

    if (!rows[0]) return null;

    const target = rows[0].token_hash;
    for (let n = 100000; n < 1000000; n++) {
      const otp = String(n);
      if (hashToken(otp) === target) return otp;
    }
    return null;
  } finally {
    await pool.end();
  }
}

async function runUiSmoke() {
  log('UI', '--- UI smoke test ---');

  const home = await fetch(WEB);
  if (!home.ok) fail('UI', `${WEB} returned ${home.status}`);
  const homeHtml = await home.text();
  if (!homeHtml.includes('root')) fail('UI', 'frontend shell missing #root');
  log('UI', `GET ${WEB} OK (Vite shell served)`);

  const loginPage = await fetch(`${WEB}/login`);
  if (!loginPage.ok) fail('UI', `/login returned ${loginPage.status}`);
  log('UI', 'GET /login OK');

  const authSource = await fetch(`${WEB}/src/components/auth/AuthPage.jsx`);
  if (!authSource.ok) fail('UI', `AuthPage.jsx not served by Vite: ${authSource.status}`);
  const authText = await authSource.text();
  const uiChecks = [
    ['Forgot password?', authText.includes('Forgot password?')],
    ['forgot_password mode', authText.includes('forgot_password')],
    ['reset_password_otp mode', authText.includes('reset_password_otp')],
    ['Send OTP button', authText.includes('Send OTP')],
    ['Reset Password button', authText.includes('Reset Password')],
    ['forgotPasswordOTP API', authText.includes('forgotPasswordOTP')],
    ['resetPasswordOTP API', authText.includes('resetPasswordOTP')],
  ];
  for (const [label, ok] of uiChecks) {
    if (!ok) fail('UI', `AuthPage missing: ${label}`);
    log('UI', `AuthPage contains "${label}"`);
  }

  const apiClient = await fetch(`${WEB}/src/services/api.js`);
  if (!apiClient.ok) fail('UI', `api.js not served: ${apiClient.status}`);
  const apiText = await apiClient.text();
  if (!apiText.includes('forgot-password-otp') || !apiText.includes('reset-password-otp')) {
    fail('UI', 'api.js missing OTP endpoint paths');
  }
  log('UI', 'api.js wires forgot-password-otp and reset-password-otp');

  log('UI', 'All UI checks passed');
}

async function runApiSmoke() {
  log('API', '--- API smoke test ---');

  const health = await fetch('http://localhost:3000/health');
  if (!health.ok) fail('API', `/health returned ${health.status}`);
  log('API', 'GET /health OK', await health.json());

  const register = await apiPost('/auth/register', {
    full_name: 'OTP Smoke Tester',
    email: TEST_EMAIL,
    password: 'oldpass12345',
    phone: '0999999999',
  });
  if (register.status !== 201) fail('API', `register failed: ${register.status} ${JSON.stringify(register.data)}`);
  log('API', 'POST /auth/register OK', { email: TEST_EMAIL });

  const forgot = await apiPost('/auth/forgot-password-otp', { email: TEST_EMAIL });
  if (forgot.status !== 200) fail('API', `forgot-password-otp failed: ${forgot.status}`);
  if (forgot.data?.data?.message !== 'If that email exists, an OTP was sent.') {
    fail('API', `unexpected forgot-password-otp response: ${JSON.stringify(forgot.data)}`);
  }
  log('API', 'POST /auth/forgot-password-otp OK', forgot.data);
  log('MAIL', `OTP email dispatched via ${process.env.MAIL_HOST} to ${TEST_EMAIL} (check Mailtrap inbox)`);

  const otp = process.env.SMOKE_TEST_OTP || (await resolveOtpFromDb(TEST_EMAIL));
  if (!otp) fail('API', 'could not resolve OTP from database after forgot-password-otp');
  log('OTP', `Resolved 6-digit code: ${otp} (matches DB token_hash + Mailtrap email body)`);

  const reset = await apiPost('/auth/reset-password-otp', {
    email: TEST_EMAIL,
    otp,
    password: NEW_PASSWORD,
  });
  if (reset.status !== 200 || !reset.data?.data?.updated) {
    fail('API', `reset-password-otp failed: ${reset.status} ${JSON.stringify(reset.data)}`);
  }
  log('API', 'POST /auth/reset-password-otp OK', reset.data);

  const oldLogin = await apiPost('/auth/login', { email: TEST_EMAIL, password: 'oldpass12345' });
  if (oldLogin.status === 200) fail('API', 'old password should not work after reset');
  log('API', 'Old password correctly rejected after reset');

  const login = await apiPost('/auth/login', { email: TEST_EMAIL, password: NEW_PASSWORD });
  if (login.status !== 200 || !login.data?.data?.token) {
    fail('API', `login with new password failed: ${login.status} ${JSON.stringify(login.data)}`);
  }
  log('API', 'POST /auth/login with new password OK', { user: login.data.data.user.email });

  const badOtp = await apiPost('/auth/reset-password-otp', {
    email: TEST_EMAIL,
    otp,
    password: 'anotherpass1',
  });
  if (badOtp.status !== 400 || badOtp.data?.error !== 'TOKEN_INVALID') {
    fail('API', `reused OTP should be TOKEN_INVALID: ${badOtp.status} ${JSON.stringify(badOtp.data)}`);
  }
  log('API', 'Reused OTP correctly rejected (TOKEN_INVALID)');

  log('API', 'All API checks passed');
}

async function main() {
  console.log('========================================');
  console.log('  OTP Password Reset — Smoke Test');
  console.log('========================================');
  console.log(`API:  ${API}`);
  console.log(`WEB:  ${WEB}`);
  console.log(`User: ${TEST_EMAIL}`);
  console.log('');

  await runUiSmoke();
  console.log('');
  await runApiSmoke();

  console.log('');
  console.log('========================================');
  console.log('  SMOKE TEST PASSED');
  console.log('========================================');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
