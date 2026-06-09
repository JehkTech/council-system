import React from 'react';
import { useEffect, useState } from 'react';
import { adminAPI, applicationsAPI, servicesAPI } from './services/api';
import Dashboard from './pages/Dashboard.jsx';
import ApplyService from './pages/ApplyService.jsx';
import AdminPanel from './pages/admin/AdminPanel.jsx';
import AuthPage from './components/auth/AuthPage.jsx';

function readSession() {
  try {
    return JSON.parse(localStorage.getItem('user')) || null;
  } catch {
    return null;
  }
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

  if (!user) return <AuthPage onAuthenticated={setUser} />;

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
