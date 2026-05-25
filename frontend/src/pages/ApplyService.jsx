import React, { useState } from 'react';

export default function ApplyService({ services, onSubmit, loading }) {
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
            type="button"
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
