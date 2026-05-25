import React, { useState } from 'react';

const statusLabels = {
  submitted: 'Submitted',
  under_review: 'Under Review',
  pending_info: 'Pending Info',
  approved: 'Approved',
  rejected: 'Rejected',
};

export default function AdminPanel({ applications, onRefresh, onUpdate }) {
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
            {applications.map((application) => (
              <tr key={application.id}>
                <td>{application.reference_no}</td>
                <td>{application.full_name}<br /><span className="muted">{application.email}</span></td>
                <td>{application.service_name}</td>
                <td><span className={`status ${application.status}`}>{statusLabels[application.status] || application.status}</span></td>
                <td className="row-actions">
                  <button disabled={updatingId === application.id} onClick={() => update(application.id, 'under_review')}>Review</button>
                  <button disabled={updatingId === application.id} onClick={() => update(application.id, 'approved')}>Approve</button>
                  <button disabled={updatingId === application.id} onClick={() => update(application.id, 'rejected')}>Reject</button>
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
