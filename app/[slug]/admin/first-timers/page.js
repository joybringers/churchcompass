'use client';
import { useState, useEffect } from 'react';
import { useCC } from '../layout';

const NAV = '#1e3a5f';
const GOLD = '#f59e0b';

const STATUS_COLORS = { pending: GOLD, contacted: '#3b82f6', 'follow-up': '#8b5cf6', closed: '#22c55e' };

export default function FirstTimers() {
  const ctx = useCC();
  const [list, setList] = useState([]);
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('pending');
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all');

  const load = () => {
    if (!ctx) return;
    const { church, token } = ctx;
    fetch(`/api/first-timers?churchId=${church.id}`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()).then(d => setList(d.firstTimers || []));
  };

  useEffect(() => { load(); }, [ctx]);

  const open = (ft) => { setSelected(ft); setNotes(ft.follow_up_notes || ''); setStatus(ft.follow_up_status || 'pending'); };

  const saveFollowUp = async () => {
    setSaving(true);
    await fetch('/api/first-timers', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ctx.token}` }, body: JSON.stringify({ id: selected.id, followUpStatus: status, followUpNotes: notes }) });
    setSaving(false); setSelected(null); load();
  };

  const filtered = filter === 'all' ? list : list.filter(ft => ft.follow_up_status === filter);

  if (!ctx) return null;

  return (
    <div style={{ padding: '32px 28px', maxWidth: 900 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: NAV }}>First Timers</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {['all', 'pending', 'contacted', 'follow-up', 'closed'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              style={{ padding: '7px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, background: filter === s ? NAV : '#f1f5f9', color: filter === s ? '#fff' : '#64748b', textTransform: 'capitalize' }}>
              {s === 'all' ? `All (${list.length})` : `${s.charAt(0).toUpperCase() + s.slice(1)} (${list.filter(x => x.follow_up_status === s).length})`}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length === 0 && <div style={{ background: '#fff', borderRadius: 14, padding: 24, textAlign: 'center', color: '#94a3b8', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>No first timers in this category.</div>}
        {filtered.map(ft => (
          <div key={ft.id} onClick={() => open(ft)}
            style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', transition: 'box-shadow 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 6px rgba(0,0,0,0.05)'}>
            <div>
              <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: 3 }}>{ft.first_name} {ft.last_name}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                {ft.visited_date} · {ft.email || ft.phone || 'No contact info'}
                {ft.would_like_contact && <span style={{ marginLeft: 8, color: '#8b5cf6', fontWeight: 600 }}>Wants follow-up</span>}
              </div>
            </div>
            <span style={{ background: (STATUS_COLORS[ft.follow_up_status] || GOLD) + '20', color: STATUS_COLORS[ft.follow_up_status] || GOLD, padding: '4px 12px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
              {ft.follow_up_status}
            </span>
          </div>
        ))}
      </div>

      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '28px 24px', width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: NAV, marginBottom: 4 }}>{selected.first_name} {selected.last_name}</h2>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: 20 }}>Visited {selected.visited_date}</p>
            <div style={{ background: '#f8fafc', borderRadius: 12, padding: '16px', marginBottom: 20, fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {selected.email && <div><span style={{ color: '#64748b' }}>Email: </span>{selected.email}</div>}
              {selected.phone && <div><span style={{ color: '#64748b' }}>Phone: </span>{selected.phone}</div>}
              {selected.how_heard && <div><span style={{ color: '#64748b' }}>How heard: </span>{selected.how_heard}</div>}
              {selected.prayer_request && <div><span style={{ color: '#64748b' }}>Prayer request: </span>{selected.prayer_request}</div>}
              {selected.would_like_contact && <div style={{ color: '#8b5cf6', fontWeight: 600 }}>Requested follow-up contact</div>}
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Follow-up status</label>
              <select value={status} onChange={e => setStatus(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #dde3f0', borderRadius: 10, fontSize: '0.95rem', fontFamily: 'inherit', outline: 'none' }}>
                {['pending', 'contacted', 'follow-up', 'closed'].map(s => <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Notes</label>
              <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #dde3f0', borderRadius: 10, fontSize: '0.95rem', fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
            {selected.email && (
              <button onClick={() => {
                const { church } = ctx;
                const body = `Hi ${selected.first_name},%0A%0AIt was wonderful having you at ${encodeURIComponent(church.name)} on ${selected.visited_date}.%0A%0AWe'd love to stay in touch and welcome you into our community.%0A%0AFeel free to reach out if you have any questions.%0A%0ABlessings,%0AThe ${encodeURIComponent(church.name)} Team`;
                window.open(`mailto:${selected.email}?subject=Welcome to ${encodeURIComponent(church.name)}!&body=${body}`);
              }} style={{ width: '100%', background: '#22c55e', color: '#fff', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 700, cursor: 'pointer', marginBottom: 10 }}>
                <i className="fas fa-envelope" style={{ marginRight: 8 }} />Send Welcome Email
              </button>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setSelected(null)} style={{ flex: 1, background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={saveFollowUp} disabled={saving}
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
