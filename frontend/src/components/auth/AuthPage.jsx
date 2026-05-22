import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';

export default function AuthPage({ initialMode = 'login', redirectTo = '/', onAuthenticated }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const action = mode === 'login' ? authAPI.login : authAPI.register;
      const payload = mode === 'login' ? { email: form.email, password: form.password } : form;
      const response = await action(payload);

      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));

      if (onAuthenticated) {
        onAuthenticated(response.data.data.user);
      }

      navigate(redirectTo);
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to authenticate');
    } finally {
      setLoading(false);
    }
  };

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
        <div className="tabs" aria-label="Authentication mode">
          <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>
            Login
          </button>
          <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>
            Register
          </button>
        </div>

        <form onSubmit={submit}>
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

          <label>
            Email
            <input name="email" type="email" value={form.email} onChange={update} required />
          </label>
          <label>
            Password
            <input name="password" type="password" value={form.password} onChange={update} minLength={8} required />
          </label>

          {error && <p className="error">{error}</p>}

          <button className="primary-btn" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create account'}
          </button>
        </form>
      </section>
    </main>
  );
}