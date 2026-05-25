import React from 'react';
import { useEffect, useState } from 'react';
import { adminAPI, applicationsAPI, authAPI, servicesAPI } from './services/api';
import Dashboard from './pages/Dashboard.jsx';
import ApplyService from './pages/ApplyService.jsx';
import AdminPanel from './pages/admin/AdminPanel.jsx';

function readSession() {
  try {
    return JSON.parse(localStorage.getItem('user')) || null;
  } catch {
    return null;
  }
}

function AuthPanel({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
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
      const payload =
        mode === 'login'
          ? { email: form.email, password: form.password }
          : form;
      const { data } = await action(payload);

      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      onAuthenticated(data.data.user);
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
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>
            Login
          </button>
          <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>
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

export default function App() {
  const [user, setUser] = useState(readSession);
  const [view, setView] = useState('dashboard');
  const [applications, setApplications] = useState([]);
  const [adminApplications, setAdminApplications] = useState([]);
  const [services, setServices] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'officer';

  const loadApplications = async () => {
    if (!user) return;
    const { data } = isAdmin ? await adminAPI.getAll() : await applicationsAPI.getAll();
    if (isAdmin) setAdminApplications(data.data);
    else setApplications(data.data);
  };

  const loadServices = async () => {
    if (!user || isAdmin) return;
    const { data } = await servicesAPI.getAll();
    setServices(data.data);
  };

  useEffect(() => {
    loadApplications().catch(() => setMessage('Could not load applications.'));
    loadServices().catch(() => setMessage('Could not load services.'));
  }, [user]);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setApplications([]);
    setAdminApplications([]);
    setServices([]);
  };

  const submitApplication = async (payload) => {
    setLoading(true);
    setMessage('');
    try {
      const { data } = await applicationsAPI.create(payload);
      setMessage(`Application submitted: ${data.data.reference_no}`);
      setView('dashboard');
      await loadApplications();
    } catch (error) {
      setMessage(error.response?.data?.error || 'Could not submit application.');
    } finally {
      setLoading(false);
    }
  };

  const updateApplication = async (id, payload) => {
    setMessage('');
    try {
      await adminAPI.update(id, payload);
      setMessage('Application updated.');
      await loadApplications();
    } catch (error) {
      setMessage(error.response?.data?.error || 'Could not update application.');
    }
  };

  if (!user) return <AuthPanel onAuthenticated={setUser} />;

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Council System</p>
          <h1>{isAdmin ? 'Officer Workspace' : 'Citizen Workspace'}</h1>
        </div>
        <nav>
          {!isAdmin && (
            <>
              <button className={view === 'dashboard' ? 'active' : ''} onClick={() => setView('dashboard')}>Dashboard</button>
              <button className={view === 'apply' ? 'active' : ''} onClick={() => setView('apply')}>Apply</button>
            </>
          )}
          <button onClick={logout}>Logout</button>
        </nav>
      </header>

      <div className="welcome">
        <span>{user.full_name}</span>
        <small>{user.email} · {user.role}</small>
      </div>

      {message && <p className="notice">{message}</p>}

      {isAdmin ? (
        <AdminPanel applications={adminApplications} onRefresh={loadApplications} onUpdate={updateApplication} />
      ) : view === 'apply' ? (
        <ApplyService services={services} onSubmit={submitApplication} loading={loading} />
      ) : (
        <Dashboard applications={applications} onRefresh={loadApplications} onApply={() => setView('apply')} />
      )}
    </main>
  );
}
