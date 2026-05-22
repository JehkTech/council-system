import React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { adminAPI, applicationsAPI, authAPI, servicesAPI } from './services/api';

const statusLabels = {
  submitted: 'Submitted',
  under_review: 'Under Review',
  pending_info: 'Pending Info',
  approved: 'Approved',
  rejected: 'Rejected',
};

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

function Dashboard({ applications, onRefresh, onApply }) {
  const counts = useMemo(() => {
    return applications.reduce(
      (acc, app) => {
        acc.total += 1;
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
      },
      { total: 0 }
    );
  }, [applications]);

  return (
    <section className="workspace">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Citizen dashboard</p>
          <h2>Your applications</h2>
        </div>
        <div className="actions">
          <button className="secondary-btn" onClick={onRefresh}>Refresh</button>
          <button className="primary-btn compact" onClick={onApply}>Apply for Service</button>
        </div>
      </div>

      <div className="stats-grid">
        <article>
          <span>Total</span>
          <strong>{counts.total}</strong>
        </article>
        <article>
          <span>Submitted</span>
          <strong>{counts.submitted || 0}</strong>
        </article>
        <article>
          <span>Approved</span>
          <strong>{counts.approved || 0}</strong>
        </article>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Reference</th>
              <th>Service</th>
              <th>Status</th>
              <th>Submitted</th>
              <th>Document</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => (
              <tr key={app.id}>
                <td>{app.reference_no}</td>
                <td>{app.service_name}</td>
                <td><span className={`status ${app.status}`}>{statusLabels[app.status] || app.status}</span></td>
                <td>{new Date(app.submitted_at).toLocaleDateString()}</td>
                <td>
                  {app.status === 'approved' && app.document_path ? (
                    <a className="text-link" href={`http://localhost:3000${app.document_path}`} target="_blank" rel="noreferrer">
                      Download
                    </a>
                  ) : (
                    <span className="muted">Not available</span>
                  )}
                </td>
              </tr>
            ))}
            {!applications.length && (
              <tr>
                <td colSpan="5" className="empty">No applications yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ApplyService({ services, onSubmit, loading }) {
  const [selected, setSelected] = useState('');
  const [notes, setNotes] = useState('');

  return (
    <section className="workspace">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Apply for service</p>
          <h2>Choose a council service</h2>
        </div>
      </div>

      <div className="service-grid">
        {services.map((service) => (
          <button
            key={service.id}
            className={`service-card ${selected === service.id ? 'selected' : ''}`}
            onClick={() => setSelected(service.id)}
          >
            <span>{service.category}</span>
            <strong>{service.name}</strong>
            <small>{service.code.replaceAll('_', ' ')}</small>
          </button>
        ))}
      </div>

      <form
        className="notes-panel"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit({ service_id: selected, applicant_notes: notes });
          setSelected('');
          setNotes('');
        }}
      >
        <label>
          Applicant notes
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows="4" />
        </label>
        <button className="primary-btn compact" disabled={!selected || loading}>
          {loading ? 'Submitting...' : 'Submit application'}
        </button>
      </form>
    </section>
  );
}

function AdminPanel({ applications, onRefresh, onUpdate }) {
  const [updatingId, setUpdatingId] = useState('');

  const update = async (id, status) => {
    setUpdatingId(id);
    await onUpdate(id, { status, officer_notes: `Marked ${status} from admin panel.` });
    setUpdatingId('');
  };

  return (
    <section className="workspace">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Admin panel</p>
          <h2>All applications</h2>
        </div>
        <button className="secondary-btn" onClick={onRefresh}>Refresh</button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Reference</th>
              <th>Citizen</th>
              <th>Service</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => (
              <tr key={app.id}>
                <td>{app.reference_no}</td>
                <td>{app.full_name}<br /><span className="muted">{app.email}</span></td>
                <td>{app.service_name}</td>
                <td><span className={`status ${app.status}`}>{statusLabels[app.status] || app.status}</span></td>
                <td className="row-actions">
                  <button disabled={updatingId === app.id} onClick={() => update(app.id, 'under_review')}>Review</button>
                  <button disabled={updatingId === app.id} onClick={() => update(app.id, 'approved')}>Approve</button>
                  <button disabled={updatingId === app.id} onClick={() => update(app.id, 'rejected')}>Reject</button>
                </td>
              </tr>
            ))}
            {!applications.length && (
              <tr>
                <td colSpan="5" className="empty">No applications found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
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
