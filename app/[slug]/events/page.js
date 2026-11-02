'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

const NAV = '#1e3a5f';
const GOLD = '#f59e0b';

const TYPE_COLORS = {
  service: '#3b82f6',
  meeting: GOLD,
  event: '#22c55e',
  youth: '#8b5cf6',
  kids: '#f97316',
};

const TYPE_LABELS = {
  service: 'Sunday Service',
  meeting: 'Meeting',
  event: 'Event',
  youth: 'Youth',
  kids: 'Kids',
};

function fmtDate(d) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function fmtTime(t) {
  if (!t) return null;
  const [h, m] = t.split(':');
  const hr = parseInt(h, 10);
  return `${hr % 12 || 12}:${m} ${hr < 12 ? 'AM' : 'PM'}`;
}

export default function PublicEvents() {
  const { slug } = useParams();
  const [church, setChurch] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/churches?slug=${slug}`).then(r => r.json()).then(d => {
      setChurch(d.church || null);
      if (d.church) {
        fetch(`/api/events?churchId=${d.church.id}`).then(r => r.json()).then(ev => {
          const today = new Date().toISOString().split('T')[0];
          const upcoming = (ev.events || []).filter(e => e.event_date >= today).sort((a, b) => a.event_date.localeCompare(b.event_date));
          setEvents(upcoming);
          setLoading(false);
        });
      }
    });
  }, [slug]);

  const openRsvp = (event) => {
    setSelected(event);
    setForm({ firstName: '', lastName: '', email: '', phone: '' });
    setDone(false);
    setError('');
  };

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true); setError('');
    try {
      const res = await fetch('/api/event-registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          churchId: church.id,
          eventId: selected.id,
          name: `${form.firstName} ${form.lastName}`.trim(),
          email: form.email,
          phone: form.phone,
        }),
      });
      if (!res.ok) throw new Error('Registration failed');
      setDone(true);
    } catch {
      setError('Something went wrong. Please try again.');
    }
    setSubmitting(false);
  };

  const inp = { padding: '10px 14px', border: '1.5px solid #dde3f0', borderRadius: 10, fontSize: '0.95rem', fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box' };
  const primary = church?.primary_color || NAV;

  if (!church && !loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#dc2626' }}>Church not found.</p>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <header style={{ background: primary, padding: '20px 32px' }}>
        <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.2rem' }}>{church?.name || '…'}</div>
        <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.8rem', marginTop: 2 }}>Upcoming events & services</div>
      </header>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 16px' }}>

        {/* RSVP form overlay */}
        {selected && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div style={{ background: '#fff', borderRadius: 16, padding: '32px 28px', maxWidth: 460, width: '100%', boxShadow: '0 8px 40px rgba(0,0,0,0.18)', maxHeight: '90vh', overflowY: 'auto' }}>
              {done ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: primary, marginBottom: 8 }}>You're registered!</h2>
                  <p style={{ color: '#64748b', lineHeight: 1.6 }}>
                    We've saved your place at <strong>{selected.name}</strong> on {fmtDate(selected.event_date)}.
                    {fmtTime(selected.start_time) && ` Doors open at ${fmtTime(selected.start_time)}.`}
                  </p>
                  <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 10 }}>We look forward to seeing you there.</p>
                  <button onClick={() => setSelected(null)}
                    style={{ marginTop: 24, background: primary, color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>
                    Back to events
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                    <div>
                      <div style={{ display: 'inline-block', background: (TYPE_COLORS[selected.event_type] || '#64748b') + '22', color: TYPE_COLORS[selected.event_type] || '#64748b', borderRadius: 6, padding: '2px 8px', fontSize: '0.75rem', fontWeight: 700, marginBottom: 6 }}>{TYPE_LABELS[selected.event_type] || selected.event_type}</div>
                      <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: primary, margin: 0 }}>{selected.name}</h2>
                      <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 4 }}>
                        {fmtDate(selected.event_date)}
                        {fmtTime(selected.start_time) && ` · ${fmtTime(selected.start_time)}`}
                        {fmtTime(selected.end_time) && ` – ${fmtTime(selected.end_time)}`}
                      </p>
                    </div>
                    <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 20, cursor: 'pointer', padding: '0 0 0 8px', lineHeight: 1 }}>✕</button>
                  </div>

                  {selected.description && (
                    <p style={{ color: '#374151', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: 20, padding: '12px 14px', background: '#f8fafc', borderRadius: 8 }}>{selected.description}</p>
                  )}

                  <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>First name <span style={{ color: '#dc2626' }}>*</span></label>
                        <input style={inp} value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} required />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Last name <span style={{ color: '#dc2626' }}>*</span></label>
                        <input style={inp} value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} required />
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Email</label>
                      <input type="email" style={inp} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Phone</label>
                      <input type="tel" style={inp} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                    </div>
                    {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px', color: '#dc2626', fontSize: '0.85rem' }}>{error}</div>}
                    <button type="submit" disabled={submitting}
                      style={{ background: submitting ? '#94a3b8' : primary, color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontWeight: 700, fontSize: '1rem', cursor: submitting ? 'not-allowed' : 'pointer', marginTop: 4 }}>
                      {submitting ? 'Registering…' : 'Confirm Registration'}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        )}

        {/* Event list */}
        {loading ? (
          <p style={{ color: '#94a3b8', textAlign: 'center', padding: 40 }}>Loading events…</p>
        ) : events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📅</div>
            <p style={{ color: '#64748b', fontSize: '1rem' }}>No upcoming events at the moment. Check back soon!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {events.map(ev => (
              <div key={ev.id} style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', boxShadow: '0 1px 8px rgba(0,0,0,0.07)', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ width: 56, height: 56, background: primary + '15', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: primary, lineHeight: 1 }}>{new Date(ev.event_date + 'T12:00:00').getDate()}</div>
                  <div style={{ fontSize: '0.65rem', color: primary, fontWeight: 600, textTransform: 'uppercase' }}>{new Date(ev.event_date + 'T12:00:00').toLocaleString('en-GB', { month: 'short' })}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ background: (TYPE_COLORS[ev.event_type] || '#64748b') + '22', color: TYPE_COLORS[ev.event_type] || '#64748b', borderRadius: 6, padding: '2px 8px', fontSize: '0.7rem', fontWeight: 700 }}>{TYPE_LABELS[ev.event_type] || ev.event_type}</span>
                  </div>
                  <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '1rem' }}>{ev.name}</div>
                  <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: 2 }}>
                    {fmtDate(ev.event_date)}
                    {fmtTime(ev.start_time) && ` · ${fmtTime(ev.start_time)}`}
                    {fmtTime(ev.end_time) && ` – ${fmtTime(ev.end_time)}`}
                  </div>
                  {ev.description && <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.description}</div>}
                </div>
                <button onClick={() => openRsvp(ev)}
                  style={{ background: primary, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem', flexShrink: 0 }}>
                  Register
                </button>
              </div>
            ))}
          </div>
        )}

        <p style={{ textAlign: 'center', color: '#cbd5e1', fontSize: '0.75rem', marginTop: 40 }}>
          Powered by ChurchCompass · by Elmoril
        </p>
      </div>
    </div>
  );
}
