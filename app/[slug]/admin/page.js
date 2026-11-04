'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCC } from './layout';

const NAV = '#1e3a5f';
const GOLD = '#f59e0b';

function StatCard({ icon, label, value, color, sub }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: '20px 22px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 46, height: 46, borderRadius: 12, background: color + '1a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <i className={`fas ${icon}`} style={{ color, fontSize: 20 }} />
      </div>
      <div>
        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 3 }}>{label}</div>
        {sub && <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  );
}

function QuickAction({ icon, label, onClick, color }) {
  return (
    <button onClick={onClick}
      style={{ background: '#fff', border: `1.5px solid ${color}20`, borderRadius: 12, padding: '14px 16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, fontFamily: 'inherit', transition: 'transform 0.1s', flex: 1, minWidth: 80 }}
      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <i className={`fas ${icon}`} style={{ color, fontSize: 16 }} />
      </div>
      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#374151', textAlign: 'center', lineHeight: 1.3 }}>{label}</span>
    </button>
  );
}

function daysUntil(d) {
  if (!d) return null;
  return Math.ceil((new Date(d) - new Date()) / 86400000);
}

export default function Dashboard() {
  const ctx = useCC();
  const router = useRouter();
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [attendanceToday, setAttendanceToday] = useState([]);
  const [firstTimers, setFirstTimers] = useState([]);
  const [dbsRecords, setDbsRecords] = useState([]);
  const [groups, setGroups] = useState([]);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!ctx) return;
    const { church, token } = ctx;
    const h = { 'Authorization': `Bearer ${token}` };
    Promise.all([
      fetch(`/api/members?churchId=${church.id}`, { headers: h }).then(r => r.json()),
      fetch(`/api/events?churchId=${church.id}`, { headers: h }).then(r => r.json()),
      fetch(`/api/attendance?churchId=${church.id}&date=${today}`, { headers: h }).then(r => r.json()),
      fetch(`/api/first-timers?churchId=${church.id}`, { headers: h }).then(r => r.json()),
      fetch(`/api/dbs-records?churchId=${church.id}`, { headers: h }).then(r => r.json()),
      fetch(`/api/groups?churchId=${church.id}`, { headers: h }).then(r => r.json()),
    ]).then(([m, e, a, ft, dbs, g]) => {
      setMembers(m.members || []);
      setEvents(e.events || []);
      setAttendanceToday(a.records || []);
      setFirstTimers(ft.firstTimers || []);
      setDbsRecords(dbs.records || []);
      setGroups(g.groups || []);
    });
  }, [ctx, today]);

  if (!ctx) return null;
  const { church, slug } = ctx;
  const base = `/${slug}/admin`;

  // Computed
  const upcomingEvents = events
    .filter(e => e.event_date >= today)
    .sort((a, b) => a.event_date.localeCompare(b.event_date))
    .slice(0, 4);

  const recentFirstTimers = firstTimers.slice(0, 5);
  const thisMonthFT = firstTimers.filter(f => f.created_at?.slice(0, 7) === today.slice(0, 7)).length;

  const dbsAlerts = dbsRecords.filter(r => {
    const d = daysUntil(r.expiry_date);
    return d !== null && d <= 90;
  }).sort((a, b) => daysUntil(a.expiry_date) - daysUntil(b.expiry_date));

  const adults = members.filter(m => m.member_type !== 'child').length;
  const children = members.filter(m => m.member_type === 'child').length;

  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? 'Good morning' : greetingHour < 17 ? 'Good afternoon' : 'Good evening';
  const adminName = ctx.admin?.adminName?.split(' ')[0] || '';

  return (
    <div style={{ padding: '28px 24px', maxWidth: 1040 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: NAV, marginBottom: 2 }}>
          {greeting}{adminName ? `, ${adminName}` : ''} 👋
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
          {church.name} · {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* DBS alert banner */}
      {dbsAlerts.length > 0 && (
        <div onClick={() => router.push(base + '/guard')}
          style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '12px 16px', marginBottom: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
          <i className="fas fa-triangle-exclamation" style={{ color: '#d97706', fontSize: 16, flexShrink: 0 }} />
          <span style={{ color: '#92400e', fontSize: '0.85rem', fontWeight: 600 }}>
            {dbsAlerts.length} DBS {dbsAlerts.length === 1 ? 'certificate' : 'certificates'} expiring or expired —
            <span style={{ fontWeight: 400, marginLeft: 4 }}>{dbsAlerts[0].person_name}{dbsAlerts.length > 1 ? ` and ${dbsAlerts.length - 1} more` : ''}</span>
          </span>
          <i className="fas fa-chevron-right" style={{ color: '#d97706', fontSize: 11, marginLeft: 'auto' }} />
        </div>
      )}

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14, marginBottom: 24 }}>
        <StatCard icon="fa-users" label="Total members" value={members.length} color={NAV} sub={`${adults} adults · ${children} children`} />
        <StatCard icon="fa-door-open" label="Signed in today" value={attendanceToday.length} color="#22c55e" />
        <StatCard icon="fa-calendar-days" label="Upcoming events" value={upcomingEvents.length} color={GOLD} />
        <StatCard icon="fa-user-plus" label="First timers" value={firstTimers.length} color="#8b5cf6" sub={thisMonthFT ? `+${thisMonthFT} this month` : ''} />
        <StatCard icon="fa-layer-group" label="Groups" value={groups.length} color="#0891b2" />
      </div>

      {/* Quick actions */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', marginBottom: 20 }}>
        <div style={{ fontWeight: 800, color: NAV, fontSize: '0.875rem', marginBottom: 14 }}>Quick actions</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <QuickAction icon="fa-user-plus" label="Add member" color={NAV} onClick={() => router.push(base + '/members')} />
          <QuickAction icon="fa-calendar-plus" label="New event" color={GOLD} onClick={() => router.push(base + '/events')} />
          <QuickAction icon="fa-door-open" label="First timer" color="#8b5cf6" onClick={() => router.push(`/${slug}/first-timer`)} />
          <QuickAction icon="fa-calendar-check" label="Check-in" color="#22c55e" onClick={() => window.open(`/${slug}/checkin`, '_blank')} />
          <QuickAction icon="fa-child" label="Children" color="#0891b2" onClick={() => window.open(`/${slug}/children-checkin`, '_blank')} />
          <QuickAction icon="fa-chart-bar" label="Reports" color="#d97706" onClick={() => router.push(base + '/reports')} />
        </div>
      </div>

      {/* Two column */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 16 }}>
        {/* Upcoming events */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '20px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontWeight: 800, color: NAV, fontSize: '0.875rem' }}>Upcoming events</div>
            <button onClick={() => router.push(base + '/events')} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>View all</button>
          </div>
          {upcomingEvents.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No upcoming events.</p>
          ) : upcomingEvents.map(e => {
            const days = daysUntil(e.event_date);
            return (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f8fafc' }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: '#f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{new Date(e.event_date + 'T12:00:00').toLocaleDateString('en-GB', { month: 'short' })}</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: NAV, lineHeight: 1 }}>{new Date(e.event_date + 'T12:00:00').getDate()}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `In ${days} days`}{e.type ? ` · ${e.type}` : ''}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent first timers */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '20px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontWeight: 800, color: NAV, fontSize: '0.875rem' }}>Recent first timers</div>
            <button onClick={() => router.push(base + '/first-timers')} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>View all</button>
          </div>
          {recentFirstTimers.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No first timers yet.</p>
          ) : recentFirstTimers.map(ft => {
            const statusColors = { contacted: '#16a34a', 'not-contacted': '#dc2626', pending: '#d97706' };
            const s = ft.follow_up_status || 'pending';
            return (
              <div key={ft.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid #f8fafc' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#8b5cf620', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className="fas fa-user" style={{ color: '#8b5cf6', fontSize: 13 }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ft.first_name} {ft.last_name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{ft.created_at ? new Date(ft.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}</div>
                </div>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: (statusColors[s] || '#d97706') + '18', color: statusColors[s] || '#d97706', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
                  {s.replace('-', ' ')}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Today's sign-ins */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '20px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ fontWeight: 800, color: NAV, fontSize: '0.875rem', marginBottom: 14 }}>
          Today's sign-ins
          {attendanceToday.length > 0 && <span style={{ marginLeft: 8, background: '#f0fdf4', color: '#16a34a', fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>{attendanceToday.length} in</span>}
        </div>
        {attendanceToday.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No sign-ins recorded today yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                {['Name', 'Type', 'Sign-in', 'Sign-out'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: '#94a3b8', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {attendanceToday.slice(0, 10).map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '9px 12px', color: '#1e293b', fontWeight: 500 }}>
                    {r.cc_members ? `${r.cc_members.first_name} ${r.cc_members.last_name}` : r.visitor_name || '—'}
                  </td>
                  <td style={{ padding: '9px 12px', color: '#64748b', textTransform: 'capitalize' }}>{r.visitor_type}</td>
                  <td style={{ padding: '9px 12px', color: '#64748b' }}>{r.sign_in_time ? new Date(r.sign_in_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                  <td style={{ padding: '9px 12px' }}>{r.sign_out_time ? <span style={{ color: '#64748b' }}>{new Date(r.sign_out_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span> : <span style={{ color: '#22c55e', fontWeight: 700, fontSize: '0.75rem' }}>● IN</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
