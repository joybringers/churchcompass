'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCC } from '../../../layout';

const NAV = '#1e3a5f';
const GOLD = '#f59e0b';

export default function EventCheckin() {
  const ctx = useCC();
  const { eventId } = useParams();
  const router = useRouter();

  const [event, setEvent] = useState(null);
  const [rsvps, setRsvps] = useState([]);
  const [walkIns, setWalkIns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(null);
  const [walkInName, setWalkInName] = useState('');
  const [addingWalkIn, setAddingWalkIn] = useState(false);

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

  return (
    <div style={{ padding: '32px 28px', maxWidth: 860 }}>

      {/* Back + header */}
      <button onClick={() => router.push(`/${ctx.slug}/admin/events`)}
        style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.85rem', cursor: 'pointer', padding: 0, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
        ← Back to events
      </button>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: NAV, marginBottom: 4 }}>
          {event ? event.name : 'Event'} — Check-in
        </h1>
        {event && <div style={{ color: '#64748b', fontSize: '0.875rem' }}>{eventDate}{event.start_time ? ` · ${event.start_time}` : ''}</div>}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
        {[
          { label: 'Registered', value: registered, color: '#3b82f6', bg: '#eff6ff' },
          { label: 'Attended', value: attended, color: '#16a34a', bg: '#f0fdf4' },
          { label: 'No-show', value: noShow, color: '#dc2626', bg: '#fef2f2' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, border: `1.5px solid ${s.color}33`, borderRadius: 12, padding: '16px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: s.color, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* RSVP list */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', marginBottom: 20 }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: NAV, marginBottom: 16 }}>
          Registered guests ({registered})
        </h2>
        {rsvps.length === 0 && (
          <div style={{ color: '#94a3b8', fontSize: '0.875rem', textAlign: 'center', padding: '16px 0' }}>No registrations yet.</div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rsvps.map(r => {
            const isAttended = !!r.attended_at;
            return (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 10, background: isAttended ? '#f0fdf4' : '#f8fafc', border: `1.5px solid ${isAttended ? '#bbf7d0' : '#e2e8f0'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: isAttended ? '#16a34a' : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isAttended ? '#fff' : '#94a3b8', fontSize: '0.75rem', fontWeight: 700 }}>
                    {isAttended ? '✓' : (r.name?.[0] || '?').toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>{r.name || '—'}</div>
                    {(r.email || r.phone) && (
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{r.email || ''}{r.email && r.phone ? ' · ' : ''}{r.phone || ''}</div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => toggleAttended(r)}
                  disabled={toggling === r.id}
                  style={{ background: isAttended ? '#dcfce7' : NAV, color: isAttended ? '#16a34a' : '#fff', border: isAttended ? '1.5px solid #bbf7d0' : 'none', borderRadius: 8, padding: '8px 14px', fontWeight: 700, fontSize: '0.8rem', cursor: toggling === r.id ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
                  {toggling === r.id ? '…' : isAttended ? '✓ Attended' : 'Mark attended'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Walk-ins */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: NAV, marginBottom: 16 }}>
          Walk-ins ({walkIns.length})
          <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#94a3b8', marginLeft: 8 }}>people who attended but didn't register</span>
        </h2>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <input
            value={walkInName}
            onChange={e => setWalkInName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addWalkIn()}
            placeholder="Name of walk-in attendee…"
            style={{ flex: 1, padding: '10px 14px', border: '1.5px solid #dde3f0', borderRadius: 10, fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none' }}
          />
          <button onClick={addWalkIn} disabled={!walkInName.trim() || addingWalkIn}
            style={{ background: walkInName.trim() ? GOLD : '#e2e8f0', color: walkInName.trim() ? NAV : '#94a3b8', border: 'none', borderRadius: 10, padding: '10px 18px', fontWeight: 700, cursor: walkInName.trim() ? 'pointer' : 'not-allowed', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
            {addingWalkIn ? 'Adding…' : '+ Add'}
          </button>
        </div>
        {walkIns.length === 0 ? (
          <div style={{ color: '#94a3b8', fontSize: '0.875rem', textAlign: 'center', padding: '8px 0' }}>No walk-ins recorded yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {walkIns.map(r => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: GOLD + '33', display: 'flex', alignItems: 'center', justifyContent: 'center', color: NAV, fontSize: '0.7rem', fontWeight: 700 }}>
                  {(r.visitor_name || r.cc_members?.first_name || '?')[0].toUpperCase()}
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>
                  {r.cc_members ? `${r.cc_members.first_name} ${r.cc_members.last_name}` : r.visitor_name}
                </div>
                <div style={{ marginLeft: 'auto', fontSize: '0.72rem', color: '#94a3b8' }}>
                  {new Date(r.sign_in_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
