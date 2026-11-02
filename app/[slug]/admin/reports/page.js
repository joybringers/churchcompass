'use client';
import { useState, useEffect } from 'react';
import { useCC } from '../layout';

const NAV = '#1e3a5f';
const GOLD = '#f59e0b';

function getWeekStart(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatWeekLabel(date) {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function daysSince(date) {
  return Math.floor((new Date() - new Date(date)) / 86400000);
}

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

function ProSection({ slug, children, title, icon }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', marginBottom: 24, overflow: 'hidden' }}>
      <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: NAV, display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
          <i className={`fas ${icon}`} style={{ color: GOLD }} />{title}
          <span style={{ background: NAV, color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '2px 7px', borderRadius: 10, letterSpacing: '0.04em' }}>PRO</span>
        </h2>
        {!children && (
          <a href={`/${slug}/admin/settings`} style={{ background: GOLD, color: NAV, borderRadius: 8, padding: '6px 14px', fontWeight: 700, fontSize: '0.78rem', textDecoration: 'none' }}>Upgrade →</a>
        )}
      </div>
      {children ? children : (
        <div style={{ padding: '32px 24px', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
          Upgrade to Pro to unlock this report.
        </div>
      )}
    </div>
  );
}

export default function Reports() {
  const ctx = useCC();
  const [records, setRecords] = useState([]);
  const [members, setMembers] = useState([]);
  const [firstTimers, setFirstTimers] = useState([]);
  const [events, setEvents] = useState([]);
  const [rsvps, setRsvps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [absentFilter, setAbsentFilter] = useState(28); // days threshold

  const plan = ctx?.church?.plan || 'free';
  const isPro = plan === 'pro' || plan === 'custom';

  useEffect(() => {
    if (!ctx) return;
    const { church, token } = ctx;
    const h = { 'Authorization': `Bearer ${token}` };
    const to = new Date().toISOString().split('T')[0];
    const fromDate = new Date(); fromDate.setDate(fromDate.getDate() - 90);
    const from = fromDate.toISOString().split('T')[0];
    Promise.all([
      fetch(`/api/attendance?churchId=${church.id}&from=${from}&to=${to}`, { headers: h }).then(r => r.json()),
      fetch(`/api/first-timers?churchId=${church.id}`, { headers: h }).then(r => r.json()),
      fetch(`/api/events?churchId=${church.id}`, { headers: h }).then(r => r.json()),
      fetch(`/api/event-registrations?churchId=${church.id}`, { headers: h }).then(r => r.json()),
      fetch(`/api/members?churchId=${church.id}`, { headers: h }).then(r => r.json()),
    ]).then(([att, ft, ev, regData, memData]) => {
      setRecords(att.records || []);
      setFirstTimers(ft.firstTimers || []);
      setEvents(ev.events || []);
      setRsvps(regData.registrations || []);
      setMembers(memData.members || []);
      setLoading(false);
    });
  }, [ctx]);

  if (!ctx || loading) return (
    <div style={{ padding: '32px 28px', color: '#64748b' }}>Loading reports…</div>
  );

  const { slug } = ctx;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // Weekly buckets — last 12 weeks
  const weeks = [];
  for (let i = 11; i >= 0; i--) {
    const weekStart = getWeekStart(new Date(now - i * 7 * 86400000));
    const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 7);
    const count = records.filter(r => { const t = new Date(r.sign_in_time); return t >= weekStart && t < weekEnd; }).length;
    weeks.push({ label: formatWeekLabel(weekStart), count });
  }
  const maxCount = Math.max(...weeks.map(w => w.count), 1);

  // Base stats
  const thisMonth = records.filter(r => r.sign_in_time >= monthStart);
  const avgPerWeek = weeks.length ? Math.round(weeks.reduce((s, w) => s + w.count, 0) / weeks.length) : 0;
  const dayCount = [0,0,0,0,0,0,0];
  records.forEach(r => { dayCount[new Date(r.sign_in_time).getDay()]++; });
  const busiestDay = DAYS[dayCount.indexOf(Math.max(...dayCount))];
  const ftThisMonth = firstTimers.filter(ft => ft.created_at >= monthStart).length;

  // Event map for reports
  const eventMap = {};
  records.forEach(r => {
    if (!r.event_id) return;
    const name = r.cc_events?.name || 'Unnamed event';
    eventMap[r.event_id] = { name, count: (eventMap[r.event_id]?.count || 0) + 1 };
  });

  // ── PRO: Absentee list ──
  const thresholdDate = new Date(now - absentFilter * 86400000);
  const memberLastSeen = {};
  records.forEach(r => {
    if (!r.member_id) return;
    const t = new Date(r.sign_in_time);
    if (!memberLastSeen[r.member_id] || t > memberLastSeen[r.member_id]) memberLastSeen[r.member_id] = t;
  });
  const absentees = members
    .filter(m => memberLastSeen[m.id] && memberLastSeen[m.id] < thresholdDate)
    .map(m => ({ ...m, lastSeen: memberLastSeen[m.id] }))
    .sort((a, b) => a.lastSeen - b.lastSeen);
  const neverAttended = members.filter(m => !memberLastSeen[m.id]).length;

  // ── PRO: Attendance streaks ──
  const memberMap = Object.fromEntries(members.map(m => [m.id, m]));
  const byMember = {};
  records.forEach(r => {
    if (!r.member_id) return;
    const wk = getWeekStart(new Date(r.sign_in_time)).getTime();
    if (!byMember[r.member_id]) byMember[r.member_id] = new Set();
    byMember[r.member_id].add(wk);
  });
  const thisWk = getWeekStart(now).getTime();
  const lastWk = thisWk - 7 * 86400000;
  const streaks = Object.entries(byMember).map(([id, wkSet]) => {
    const sorted = Array.from(wkSet).sort((a, b) => b - a);
    if (sorted[0] !== thisWk && sorted[0] !== lastWk) return null;
    let streak = 0, expected = sorted[0];
    for (const wk of sorted) {
      if (wk === expected) { streak++; expected -= 7 * 86400000; }
      else break;
    }
    return memberMap[id] ? { member: memberMap[id], streak } : null;
  }).filter(Boolean).sort((a, b) => b.streak - a.streak).slice(0, 10);

  const csvExport = () => {
    const rows = [['Name','Type','Event','Sign In','Sign Out']];
    records.forEach(r => {
      const name = r.cc_members ? `${r.cc_members.first_name} ${r.cc_members.last_name}` : r.visitor_name || '';
      rows.push([name, r.visitor_type, r.cc_events?.name || '', r.sign_in_time ? new Date(r.sign_in_time).toLocaleString('en-GB') : '', r.sign_out_time ? new Date(r.sign_out_time).toLocaleString('en-GB') : '']);
    });
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'\\"')}"`).join(',')).join('\n');
    const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv); a.download = 'attendance-report.csv'; a.click();
  };

  const chartH = 160;

  return (
    <div style={{ padding: '32px 28px', maxWidth: 960 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: NAV }}>Reports</h1>
        <button onClick={csvExport} style={{ background: '#f1f5f9', color: NAV, border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '9px 16px', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>
          <i className="fas fa-download" style={{ marginRight: 6 }} />Export CSV (90 days)
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'This month', value: thisMonth.length, color: NAV, icon: 'fa-users' },
          { label: 'Avg per week', value: avgPerWeek, color: '#22c55e', icon: 'fa-chart-line' },
          { label: 'Busiest day', value: busiestDay, color: GOLD, icon: 'fa-calendar-day' },
          { label: 'New this month', value: ftThisMonth, color: '#8b5cf6', icon: 'fa-user-plus' },
          { label: 'Absent 4+ wks', value: absentees.length, color: '#ef4444', icon: 'fa-person-walking-arrow-right', pro: true },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 14, padding: '18px 16px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 12, opacity: s.pro && !isPro ? 0.5 : 1 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: s.color + '1a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className={`fas ${s.icon}`} style={{ color: s.color, fontSize: 16 }} />
            </div>
            <div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{s.pro && !isPro ? '—' : s.value}</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 3 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '24px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', marginBottom: 24, overflowX: 'auto' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: NAV, marginBottom: 20 }}>Weekly attendance — last 12 weeks</h2>
        <svg width="100%" viewBox={`0 0 ${weeks.length * 70} ${chartH + 36}`} style={{ overflow: 'visible', minWidth: 400 }}>
          {weeks.map((w, i) => {
            const barH = maxCount > 0 ? Math.max(4, (w.count / maxCount) * chartH) : 4;
            const x = i * 70 + 10;
            const y = chartH - barH;
            return (
              <g key={i}>
                <rect x={x} y={y} width={50} height={barH} rx={5} fill={NAV} opacity={0.85} />
                {w.count > 0 && <text x={x + 25} y={y - 5} textAnchor="middle" fontSize={11} fill="#374151" fontWeight="600">{w.count}</text>}
                <text x={x + 25} y={chartH + 18} textAnchor="middle" fontSize={10} fill="#94a3b8">{w.label}</text>
              </g>
            );
          })}
          <line x1={0} y1={chartH} x2={weeks.length * 70} y2={chartH} stroke="#e2e8f0" strokeWidth={1} />
        </svg>
      </div>

      {/* ── PRO: Attendance Streaks ── */}
      <ProSection slug={slug} title="Attendance Streaks" icon="fa-fire" children={isPro ? (
        <div style={{ padding: '0 0 4px' }}>
          {streaks.length === 0 ? (
            <div style={{ padding: '32px 24px', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>No streaks yet — check back once members have a few consecutive weeks of attendance.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['#', 'Member', 'Type', 'Streak'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: h === 'Streak' ? 'center' : 'left', color: '#94a3b8', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {streaks.map(({ member: m, streak }, idx) => (
                  <tr key={m.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', color: idx < 3 ? GOLD : '#94a3b8', fontWeight: 800, fontSize: idx === 0 ? '1.1rem' : '0.875rem' }}>
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#1e293b' }}>{m.first_name} {m.last_name}</td>
                    <td style={{ padding: '12px 16px', color: '#64748b', textTransform: 'capitalize' }}>{m.member_type}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span style={{ background: streak >= 8 ? '#fef9c3' : streak >= 4 ? '#f0fdf4' : '#f8fafc', color: streak >= 8 ? '#a16207' : streak >= 4 ? '#15803d' : '#64748b', borderRadius: 8, padding: '4px 12px', fontWeight: 800, fontSize: '0.9rem' }}>
                        {streak} {streak === 1 ? 'week' : 'weeks'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : null} />

      {/* ── PRO: Absentee List ── */}
      <ProSection slug={slug} title="Absentee List" icon="fa-user-clock" children={isPro ? (
        <div>
          <div style={{ padding: '14px 24px 0', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Show members absent for more than</span>
            {[14, 28, 42, 56].map(d => (
              <button key={d} onClick={() => setAbsentFilter(d)}
                style={{ padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, background: absentFilter === d ? NAV : '#f1f5f9', color: absentFilter === d ? '#fff' : '#64748b' }}>
                {d / 7} weeks
              </button>
            ))}
            {neverAttended > 0 && <span style={{ fontSize: '0.78rem', color: '#94a3b8', marginLeft: 'auto' }}>{neverAttended} members have never attended</span>}
          </div>
          {absentees.length === 0 ? (
            <div style={{ padding: '32px 24px', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
              No members absent for {absentFilter / 7}+ weeks.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', marginTop: 14 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Member', 'Type', 'Last seen', 'Days absent', 'Contact'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: '#94a3b8', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {absentees.map(m => {
                  const days = daysSince(m.lastSeen);
                  const urgency = days >= 56 ? '#ef4444' : days >= 28 ? '#d97706' : '#64748b';
                  return (
                    <tr key={m.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#1e293b' }}>{m.first_name} {m.last_name}</td>
                      <td style={{ padding: '12px 16px', color: '#64748b', textTransform: 'capitalize' }}>{m.member_type}</td>
                      <td style={{ padding: '12px 16px', color: '#64748b', whiteSpace: 'nowrap' }}>{m.lastSeen.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ color: urgency, fontWeight: 700, fontSize: '0.85rem' }}>{days}d</span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {m.email
                          ? <a href={`mailto:${m.email}?subject=We miss you!`} style={{ color: NAV, fontSize: '0.8rem', fontWeight: 600 }}>Email</a>
                          : m.phone
                            ? <a href={`tel:${m.phone}`} style={{ color: NAV, fontSize: '0.8rem', fontWeight: 600 }}>Call</a>
                            : <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>—</span>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      ) : null} />

      {/* Events breakdown */}
      {events.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 14, padding: '24px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', marginBottom: 24 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: NAV, marginBottom: 16 }}>Events — registered vs attended</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                  {['Event', 'Date', 'Registered', 'Attended', 'Walk-ins', 'No-show'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: h === 'Event' || h === 'Date' ? 'left' : 'center', color: '#94a3b8', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {events.slice(0, 20).map(ev => {
                  const evRsvps = rsvps.filter(r => r.event_id === ev.id);
                  const attended = evRsvps.filter(r => r.attended_at).length;
                  const walkInCount = (eventMap[ev.id]?.count || 0);
                  const noShow = evRsvps.length - attended;
                  return (
                    <tr key={ev.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: '12px 12px', fontWeight: 600, color: '#1e293b' }}>{ev.name}</td>
                      <td style={{ padding: '12px 12px', color: '#64748b', whiteSpace: 'nowrap' }}>{new Date(ev.event_date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td style={{ padding: '12px 12px', textAlign: 'center', fontWeight: evRsvps.length > 0 ? 700 : 400, color: evRsvps.length > 0 ? '#3b82f6' : '#94a3b8' }}>{evRsvps.length || '—'}</td>
                      <td style={{ padding: '12px 12px', textAlign: 'center', fontWeight: attended > 0 ? 700 : 400, color: attended > 0 ? '#16a34a' : '#94a3b8' }}>{attended || '—'}</td>
                      <td style={{ padding: '12px 12px', textAlign: 'center', color: walkInCount > 0 ? '#d97706' : '#94a3b8', fontWeight: walkInCount > 0 ? 700 : 400 }}>{walkInCount || '—'}</td>
                      <td style={{ padding: '12px 12px', textAlign: 'center', color: noShow > 0 ? '#ef4444' : '#94a3b8' }}>{evRsvps.length > 0 ? (noShow || '—') : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
