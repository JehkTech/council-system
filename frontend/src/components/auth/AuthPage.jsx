import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';

export default function AuthPage({ initialMode = 'login', redirectTo = '/', onAuthenticated }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '', otp: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const switchMode = (newMode) => {
    setError('');
    setSuccess('');
    setMode(newMode);
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'forgot_password') {
        await authAPI.forgotPasswordOTP(form.email);
        setSuccess('OTP sent to your email. Check your inbox.');
        setMode('reset_password_otp');
      } else if (mode === 'reset_password_otp') {
        await authAPI.resetPasswordOTP(form.email, form.otp, form.password);
        setSuccess('Password reset successful! You can now log in.');
        setForm({ full_name: '', email: '', phone: '', password: '', otp: '' });
        setMode('login');
      } else {
        const action = mode === 'login' ? authAPI.login : authAPI.register;
        const payload = mode === 'login' ? { email: form.email, password: form.password } : form;
        const response = await action(payload);

        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));

        if (onAuthenticated) {
          onAuthenticated(response.data.data.user);
        } else {
          navigate(redirectTo);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const showTabs = mode === 'login' || mode === 'register';

  return (
    <main className="auth-page">
      <section className="auth-copy">
        <p className="eyebrow">Digital Local Council</p>
        <h1>Service applications, approvals, and documents in one place.</h1>
        <p>
          Citizens can register, apply for local services, and track every
          status update from submission to approval.
        </p>
      </section>

      <section className="auth-card">
        {showTabs && (
          <div className="tabs" aria-label="Authentication mode">
            <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => switchMode('login')}>
              Login
            </button>
            <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => switchMode('register')}>
              Register
            </button>
          </div>
        )}

        {mode === 'forgot_password' && (
          <div className="tabs" aria-label="Forgot password">
            <button type="button" className="active">Forgot Password</button>
          </div>
        )}

        {mode === 'reset_password_otp' && (
          <div className="tabs" aria-label="Reset password">
            <button type="button" className="active">Reset Password</button>
          </div>
        )}

        <form onSubmit={submit}>
          {/* ── Register fields ── */}
          {mode === 'register' && (
            <>
              <label>
                Full name
                <input name="full_name" value={form.full_name} onChange={update} required />
              </label>
              <label>
                Phone
                <input name="phone" value={form.phone} onChange={update} />
              </label>
            </>
          )}

          {/* ── Login / Register shared fields ── */}
          {(mode === 'login' || mode === 'register') && (
            <>
              <label>
                Email
                <input name="email" type="email" value={form.email} onChange={update} required />
              </label>
              <label>
                Password
                <input name="password" type="password" value={form.password} onChange={update} minLength={8} required />
              </label>

              {mode === 'login' && (
                <p style={{ margin: '0.25rem 0 0.5rem', textAlign: 'right' }}>
                  <button type="button" className="text-link" onClick={() => switchMode('forgot_password')}>
                    Forgot password?
                  </button>
                </p>
              )}
            </>
          )}

          {/* ── Forgot password field ── */}
          {mode === 'forgot_password' && (
            <label>
              Email address
              <input name="email" type="email" value={form.email} onChange={update} required />
            </label>
          )}

          {/* ── Reset password OTP fields ── */}
          {mode === 'reset_password_otp' && (
            <>
              <label>
                Email
                <input name="email" type="email" value={form.email} readOnly />
              </label>
              <label>
                6-digit OTP
                <input
                  name="otp"
                  value={form.otp}
                  onChange={update}
                  required
                  maxLength={6}
                  pattern="[0-9]{6}"
                  placeholder="Enter 6-digit code"
                  autoComplete="one-time-code"
                />
              </label>
              <label>
                New Password
                <input name="password" type="password" value={form.password} onChange={update} minLength={8} required />
              </label>
            </>
          )}

          {/* ── Messages ── */}
          {error && <p className="error">{error}</p>}
          {success && <p className="notice">{success}</p>}

          {/* ── Submit button ── */}
          <button className="primary-btn" disabled={loading}>
            {loading
              ? 'Please wait...'
              : mode === 'login'
                ? 'Login'
                : mode === 'register'
                  ? 'Create account'
                  : mode === 'forgot_password'
                    ? 'Send OTP'
                    : 'Reset Password'}
          </button>

          {/* ── Back to login link ── */}
          {(mode === 'forgot_password' || mode === 'reset_password_otp') && (
            <p style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button type="button" className="text-link" onClick={() => switchMode('login')}>
                ← Back to Login
              </button>
            </p>
          )}
        </form>
      </section>
    </main>
  );
}