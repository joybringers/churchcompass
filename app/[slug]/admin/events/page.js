'use client';
import { useState, useEffect } from 'react';
import { useCC } from '../layout';

const NAV = '#1e3a5f';
const GOLD = '#f59e0b';
const BLANK = { name: '', eventType: 'service', eventDate: '', startTime: '', endTime: '', description: '' };

export default function Events() {
  const ctx = useCC();
  const [events, setEvents] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);

  const load = () => {
    if (!ctx) return;
    const { church, token } = ctx;
    fetch(`/api/events?churchId=${church.id}`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()).then(d => setEvents((d.events || []).sort((a, b) => new Date(b.event_date) - new Date(a.event_date))));
  };

  useEffect(() => { load(); }, [ctx]);

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

  const inp = { padding: '10px 12px', border: '1.5px solid #dde3f0', borderRadius: 10, fontSize: '0.95rem', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' };
  const lbl = { fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 3 };

  const typeColor = { service: '#3b82f6', meeting: GOLD, event: '#22c55e', youth: '#8b5cf6', kids: '#f97316' };

  if (!ctx) return null;

  return (
    <div style={{ padding: '32px 28px', maxWidth: 900 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: NAV }}>Events</h1>
        <button onClick={openAdd} style={{ background: NAV, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>
          <i className="fas fa-plus" style={{ marginRight: 6 }} />Add event
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
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => openEdit(ev)} style={{ background: '#f1f5f9', color: NAV, border: 'none', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Edit</button>
              <button onClick={() => remove(ev.id)} style={{ background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Delete</button>
            </div>
          </div>
        ))}
      </div>

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
