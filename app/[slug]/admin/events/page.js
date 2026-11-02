'use client';
import { useState, useEffect } from 'react';
import { useCC } from '../layout';

const NAV = '#1e3a5f';
const GOLD = '#f59e0b';
const BLANK = { name: '', eventType: 'service', eventDate: '', startTime: '', endTime: '', description: '' };

export default function Events() {
  const ctx = useCC();
  const [tab, setTab] = useState('events');
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [rsvpCounts, setRsvpCounts] = useState({});
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [filterEvent, setFilterEvent] = useState('');
  const [filterAttended, setFilterAttended] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  const load = () => {
    if (!ctx) return;
    const { church, token } = ctx;
    const h = { 'Authorization': `Bearer ${token}` };
    fetch(`/api/events?churchId=${church.id}`, { headers: h }).then(r => r.json()).then(d => {
      const sorted = (d.events || []).sort((a, b) => new Date(b.event_date) - new Date(a.event_date));
      setEvents(sorted);
      sorted.forEach(ev => {
        fetch(`/api/event-registrations?churchId=${church.id}&eventId=${ev.id}`, { headers: h })
          .then(r => r.json()).then(a => setRsvpCounts(prev => ({ ...prev, [ev.id]: (a.registrations || []).length })));
      });
    });
  };

  const loadRegistrations = () => {
    if (!ctx) return;
    setRegLoading(true);
    const { church, token } = ctx;
    fetch(`/api/event-registrations?churchId=${church.id}`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json()).then(d => {
        setRegistrations(d.registrations || []);
        setRegLoading(false);
      });
  };

  useEffect(() => { load(); }, [ctx]);

  useEffect(() => {
    if (tab === 'registrations') loadRegistrations();
  }, [tab, ctx]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const openAdd = () => { setForm({ ...BLANK, eventDate: new Date().toISOString().split('T')[0] }); setModal('add'); };
  const openEdit = (e) => { setForm({ name: e.name, eventType: e.event_type, eventDate: e.event_date, startTime: e.start_time || '', endTime: e.end_time || '', description: e.description || '' }); setModal(e); };

  const save = async () => {
    setSaving(true);
    const { church, token } = ctx;
    const h = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
    const body = { churchId: church.id, name: form.name, eventType: form.eventType, eventDate: form.eventDate, startTime: form.startTime, endTime: form.endTime, description: form.description };
    if (modal === 'add') await fetch('/api/events', { method: 'POST', headers: h, body: JSON.stringify(body) });
    else await fetch('/api/events', { method: 'PUT', headers: h, body: JSON.stringify({ ...body, id: modal.id }) });
    setSaving(false); setModal(null); load();
  };

  const remove = async (id) => {
    if (!confirm('Delete this event?')) return;
    await fetch(`/api/events?id=${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${ctx.token}` } });
    load();
  };

  const exportCSV = () => {
    const rows = [['Name', 'Email', 'Phone', 'Event', 'Event Date', 'Registered', 'Attended']];
    filtered.forEach(r => {
      const ev = events.find(e => e.id === r.event_id);
      rows.push([
        r.name || '',
        r.email || '',
        r.phone || '',
        ev?.name || '',
        ev?.event_date || '',
        new Date(r.created_at).toLocaleDateString('en-GB'),
        r.attended_at ? 'Yes' : 'No',
      ]);
    });
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '\\"')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = 'event-registrations.csv';
    a.click();
  };

  const inp = { padding: '10px 12px', border: '1.5px solid #dde3f0', borderRadius: 10, fontSize: '0.95rem', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' };
  const lbl = { fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 3 };
  const typeColor = { service: '#3b82f6', meeting: GOLD, event: '#22c55e', youth: '#8b5cf6', kids: '#f97316' };

  const filtered = registrations.filter(r => {
    const ev = events.find(e => e.id === r.event_id);
    if (filterEvent && ev?.name.toLowerCase().indexOf(filterEvent.toLowerCase()) === -1) return false;
    if (filterAttended === 'yes' && !r.attended_at) return false;
    if (filterAttended === 'no' && r.attended_at) return false;
    return true;
  });

  const thStyle = { padding: '10px 16px', textAlign: 'left', color: '#94a3b8', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap', borderBottom: '2px solid #f1f5f9' };
  const tdStyle = { padding: '12px 16px', fontSize: '0.875rem', color: '#1e293b', borderBottom: '1px solid #f8fafc', verticalAlign: 'middle' };

  if (!ctx) return null;

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1060 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: NAV }}>Events</h1>
        {tab === 'events' && (
          <button onClick={openAdd} style={{ background: NAV, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>
            <i className="fas fa-plus" style={{ marginRight: 6 }} />Add event
          </button>
        )}
        {tab === 'registrations' && filtered.length > 0 && (
          <button onClick={exportCSV} style={{ background: '#f1f5f9', color: NAV, border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '9px 16px', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>
            <i className="fas fa-download" style={{ marginRight: 6 }} />Export CSV
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid #f1f5f9', paddingBottom: 0 }}>
        {[
          { key: 'events', label: 'Events' },
          { key: 'registrations', label: `Registrations${registrations.length > 0 ? ` (${registrations.length})` : ''}` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ padding: '10px 20px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem', background: 'none',
              color: tab === t.key ? NAV : '#94a3b8',
              borderBottom: tab === t.key ? `3px solid ${NAV}` : '3px solid transparent',
              marginBottom: -2 }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* EVENTS TAB */}
      {tab === 'events' && (
        <>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <i className="fas fa-link" style={{ color: '#16a34a', fontSize: 14 }} />
            <span style={{ color: '#166534', fontSize: '0.85rem' }}>Public events page: </span>
            <code style={{ color: '#15803d', fontSize: '0.8rem', background: '#dcfce7', padding: '2px 8px', borderRadius: 6 }}>
              {typeof window !== 'undefined' ? window.location.origin : 'https://churchcompass.elmorilx.com'}/{ctx.slug}/events
            </code>
            <button onClick={() => window.open(`${window.location.origin}/${ctx.slug}/events`, '_blank')}
              style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
              Open ↗
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {events.length === 0 && <div style={{ background: '#fff', borderRadius: 14, padding: 24, textAlign: 'center', color: '#94a3b8', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>No events yet.</div>}
            {events.map(ev => (
              <div key={ev.id} style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', borderLeft: `4px solid ${typeColor[ev.event_type] || NAV}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ textAlign: 'center', minWidth: 48 }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: NAV }}>{new Date(ev.event_date + 'T00:00:00').getDate()}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>{new Date(ev.event_date + 'T00:00:00').toLocaleString('en-GB', { month: 'short' })}</div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>{ev.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      <span style={{ background: (typeColor[ev.event_type] || NAV) + '20', color: typeColor[ev.event_type] || NAV, padding: '2px 8px', borderRadius: 20, fontWeight: 600, textTransform: 'capitalize', marginRight: 8 }}>{ev.event_type}</span>
                      {ev.start_time && `${ev.start_time}${ev.end_time ? ' – ' + ev.end_time : ''}`}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {rsvpCounts[ev.id] > 0 && (
                    <span style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 8, padding: '5px 10px', fontSize: '0.75rem', fontWeight: 700 }}>
                      {rsvpCounts[ev.id]} RSVP{rsvpCounts[ev.id] !== 1 ? 's' : ''}
                    </span>
                  )}
                  <button onClick={() => window.open(`/${ctx.slug}/admin/events/${ev.id}/checkin`, '_blank')}
                    style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>
                    <i className="fas fa-check-circle" style={{ marginRight: 5 }} />Check-in
                  </button>
                  <button onClick={() => openEdit(ev)} style={{ background: '#f1f5f9', color: NAV, border: 'none', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Edit</button>
                  <button onClick={() => remove(ev.id)} style={{ background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* REGISTRATIONS TAB */}
      {tab === 'registrations' && (
        <>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <input
              value={filterEvent}
              onChange={e => setFilterEvent(e.target.value)}
              placeholder="Filter by event name…"
              style={{ padding: '9px 14px', border: '1.5px solid #dde3f0', borderRadius: 10, fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none', minWidth: 220 }}
            />
            <select value={filterAttended} onChange={e => setFilterAttended(e.target.value)}
              style={{ padding: '9px 14px', border: '1.5px solid #dde3f0', borderRadius: 10, fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none', background: '#fff' }}>
              <option value="">All attendees</option>
              <option value="yes">Attended</option>
              <option value="no">Not yet attended</option>
            </select>
          </div>

          <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            {regLoading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading registrations…</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No registrations found.</div>
            ) : (
              <>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                  {filtered.length} registration{filtered.length !== 1 ? 's' : ''}
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={thStyle}>Name</th>
                        <th style={thStyle}>Phone</th>
                        <th style={thStyle}>Email</th>
                        <th style={thStyle}>Event</th>
                        <th style={thStyle}>Event Date</th>
                        <th style={thStyle}>Registered</th>
                        <th style={{ ...thStyle, textAlign: 'center' }}>Attended</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(r => {
                        const ev = events.find(e => e.id === r.event_id);
                        const attended = !!r.attended_at;
                        return (
                          <tr key={r.id} style={{ background: attended ? '#f0fdf4' : '#fff' }}>
                            <td style={{ ...tdStyle, fontWeight: 600 }}>{r.name || '—'}</td>
                            <td style={tdStyle}>{r.phone || <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                            <td style={tdStyle}>{r.email || <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                            <td style={tdStyle}>{ev?.name || '—'}</td>
                            <td style={{ ...tdStyle, color: '#64748b', whiteSpace: 'nowrap' }}>
                              {ev ? new Date(ev.event_date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                            </td>
                            <td style={{ ...tdStyle, color: '#64748b', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                              {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                              <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700,
                                background: attended ? '#dcfce7' : '#f1f5f9', color: attended ? '#16a34a' : '#94a3b8' }}>
                                {attended ? 'Yes' : 'No'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '28px 24px', width: '100%', maxWidth: 460 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: NAV, marginBottom: 20 }}>{modal === 'add' ? 'Add event' : 'Edit event'}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div><label style={lbl}>Event name *</label><input style={inp} value={form.name} onChange={e => set('name', e.target.value)} /></div>
              <div><label style={lbl}>Type</label>
                <select style={inp} value={form.eventType} onChange={e => set('eventType', e.target.value)}>
                  {['service', 'meeting', 'event', 'youth', 'kids'].map(t => <option key={t} value={t} style={{ textTransform: 'capitalize' }}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div><label style={lbl}>Date *</label><input style={inp} type="date" value={form.eventDate} onChange={e => set('eventDate', e.target.value)} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div><label style={lbl}>Start time</label><input style={inp} type="time" value={form.startTime} onChange={e => set('startTime', e.target.value)} /></div>
                <div><label style={lbl}>End time</label><input style={inp} type="time" value={form.endTime} onChange={e => set('endTime', e.target.value)} /></div>
              </div>
              <div><label style={lbl}>Description</label><textarea rows={2} style={{ ...inp, resize: 'vertical' }} value={form.description} onChange={e => set('description', e.target.value)} /></div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setModal(null)} style={{ flex: 1, background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={save} disabled={saving || !form.name || !form.eventDate}
                style={{ flex: 1, background: saving ? '#94a3b8' : NAV, color: '#fff', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
