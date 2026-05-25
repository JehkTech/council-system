import React, { useMemo } from 'react';

const statusLabels = {
  submitted: 'Submitted',
  under_review: 'Under Review',
  pending_info: 'Pending Info',
  approved: 'Approved',
  rejected: 'Rejected',
};

export default function Dashboard({ applications, onRefresh, onApply }) {
  const counts = useMemo(() => {
    return applications.reduce(
      (acc, application) => {
        acc.total += 1;
        acc[application.status] = (acc[application.status] || 0) + 1;
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
            {applications.map((application) => (
              <tr key={application.id}>
                <td>{application.reference_no}</td>
                <td>{application.service_name}</td>
                <td><span className={`status ${application.status}`}>{statusLabels[application.status] || application.status}</span></td>
                <td>{new Date(application.submitted_at).toLocaleDateString()}</td>
                <td>
                  {application.status === 'approved' && application.document_path ? (
                    <a className="text-link" href={`http://localhost:3000${application.document_path}`} target="_blank" rel="noreferrer">
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
