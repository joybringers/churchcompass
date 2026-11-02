'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useCC } from '../../../layout';

const NAV = '#1e3a5f';
const GOLD = '#f59e0b';

export default function EventCheckin() {
  const ctx = useCC();
  const { eventId } = useParams();

  const [event, setEvent] = useState(null);
  const [rsvps, setRsvps] = useState([]);
  const [walkIns, setWalkIns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(null);
  const [walkInName, setWalkInName] = useState('');
  const [addingWalkIn, setAddingWalkIn] = useState(false);
  const [tab, setTab] = useState('registered');

  const load = async () => {
    if (!ctx) return;
    const { church, token } = ctx;
    const h = { 'Authorization': `Bearer ${token}` };

    const [evRes, regRes, walkRes] = await Promise.all([
      fetch(`/api/events?churchId=${church.id}`, { headers: h }).then(r => r.json()),
      fetch(`/api/event-registrations?churchId=${church.id}&eventId=${eventId}`, { headers: h }).then(r => r.json()),
      fetch(`/api/attendance?churchId=${church.id}&eventId=${eventId}`, { headers: h }).then(r => r.json()),
    ]);

    const ev = (evRes.events || []).find(e => e.id === eventId);
    setEvent(ev || null);
    setRsvps(regRes.registrations || []);
    setWalkIns(walkRes.records || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [ctx, eventId]);

  const toggleAttended = async (record) => {
    setToggling(record.id);
    await fetch('/api/event-registrations', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ctx.token}` },
      body: JSON.stringify({ id: record.id, attended: !record.attended_at }),
    });
    setToggling(null);
    load();
  };

  const addWalkIn = async () => {
    if (!walkInName.trim()) return;
    setAddingWalkIn(true);
    await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ctx.token}` },
      body: JSON.stringify({ churchId: ctx.church.id, visitorName: walkInName.trim(), visitorType: 'visitor', eventId }),
    });
    setWalkInName('');
    setAddingWalkIn(false);
    load();
  };

  if (!ctx || loading) return <div style={{ padding: '32px 28px', color: '#64748b' }}>Loading…</div>;

  const attended = rsvps.filter(r => r.attended_at).length;
  const registered = rsvps.length;
  const noShow = registered - attended;
  const eventDate = event ? new Date(event.event_date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '';

  const thStyle = { padding: '10px 16px', textAlign: 'left', color: '#94a3b8', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap', borderBottom: '2px solid #f1f5f9' };
  const tdStyle = { padding: '13px 16px', fontSize: '0.875rem', color: '#1e293b', borderBottom: '1px solid #f8fafc', verticalAlign: 'middle' };

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1000 }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: NAV, marginBottom: 4 }}>
          {event ? event.name : 'Event'} — Check-in
        </h1>
        {event && <div style={{ color: '#64748b', fontSize: '0.875rem' }}>{eventDate}{event.start_time ? ` · ${event.start_time}` : ''}</div>}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
        {[
          { label: 'Registered', value: registered, color: '#3b82f6', bg: '#eff6ff' },
          { label: 'Attended', value: attended, color: '#16a34a', bg: '#f0fdf4' },
          { label: 'No-show', value: noShow, color: '#dc2626', bg: '#fef2f2' },
          { label: 'Walk-ins', value: walkIns.length, color: '#d97706', bg: '#fffbeb' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, border: `1.5px solid ${s.color}33`, borderRadius: 12, padding: '16px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: s.color, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {[
          { key: 'registered', label: `Registered (${registered})` },
          { key: 'walkins', label: `Walk-ins (${walkIns.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem',
              background: tab === t.key ? NAV : '#f1f5f9', color: tab === t.key ? '#fff' : '#64748b' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Registered tab */}
      {tab === 'registered' && (
        <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          {rsvps.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No registrations yet.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>Phone</th>
                    <th style={thStyle}>Email</th>
                    <th style={thStyle}>Registered</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Attended</th>
                  </tr>
                </thead>
                <tbody>
                  {rsvps.map(r => {
                    const isAttended = !!r.attended_at;
                    return (
                      <tr key={r.id} style={{ background: isAttended ? '#f0fdf4' : '#fff' }}>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: isAttended ? '#16a34a' : NAV + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isAttended ? '#fff' : NAV, fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                              {isAttended ? '✓' : (r.name?.[0] || '?').toUpperCase()}
                            </div>
                            {r.name || '—'}
                          </div>
                        </td>
                        <td style={tdStyle}>{r.phone || <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                        <td style={tdStyle}>{r.email || <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                        <td style={{ ...tdStyle, color: '#64748b', fontSize: '0.8rem' }}>{new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <button
                            onClick={() => toggleAttended(r)}
                            disabled={toggling === r.id}
                            style={{ background: isAttended ? '#dcfce7' : NAV, color: isAttended ? '#16a34a' : '#fff', border: isAttended ? '1.5px solid #bbf7d0' : 'none', borderRadius: 8, padding: '7px 14px', fontWeight: 700, fontSize: '0.8rem', cursor: toggling === r.id ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', minWidth: 110 }}>
                            {toggling === r.id ? '…' : isAttended ? '✓ Attended' : 'Mark attended'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Walk-ins tab */}
      {tab === 'walkins' && (
        <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 10 }}>
            <input
              value={walkInName}
              onChange={e => setWalkInName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addWalkIn()}
              placeholder="Name of walk-in attendee…"
              style={{ flex: 1, padding: '10px 14px', border: '1.5px solid #dde3f0', borderRadius: 10, fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none' }}
            />
            <button onClick={addWalkIn} disabled={!walkInName.trim() || addingWalkIn}
              style={{ background: walkInName.trim() ? GOLD : '#e2e8f0', color: walkInName.trim() ? NAV : '#94a3b8', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 700, cursor: walkInName.trim() ? 'pointer' : 'not-allowed', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
              {addingWalkIn ? 'Adding…' : '+ Add walk-in'}
            </button>
          </div>
          {walkIns.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No walk-ins recorded yet.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>Type</th>
                    <th style={thStyle}>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {walkIns.map(r => (
                    <tr key={r.id}>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: GOLD + '33', display: 'flex', alignItems: 'center', justifyContent: 'center', color: NAV, fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                            {(r.visitor_name || r.cc_members?.first_name || '?')[0].toUpperCase()}
                          </div>
                          {r.cc_members ? `${r.cc_members.first_name} ${r.cc_members.last_name}` : r.visitor_name}
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ background: '#f1f5f9', color: '#64748b', padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize' }}>{r.visitor_type}</span>
                      </td>
                      <td style={{ ...tdStyle, color: '#64748b', fontSize: '0.8rem' }}>{new Date(r.sign_in_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
