'use client';
import { useState, useEffect } from 'react';
import { useCC } from '../layout';

const NAV = '#1e3a5f';
const GOLD = '#f59e0b';

function fmt(d) { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }); }
function fmtM(d) { return new Date(d).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }); }

// Group items by month (YYYY-MM)
function byMonth(items, dateKey) {
  const map = {};
  items.forEach(i => {
    const raw = i[dateKey] || (i.cc_events && i.cc_events.event_date);
    if (!raw) return;
    const m = raw.slice(0, 7);
    map[m] = (map[m] || 0) + 1;
  });
  return map;
}

// Last N months as YYYY-MM strings
function lastMonths(n) {
  const months = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return months;
}

function BarChart({ data, color = NAV, height = 120 }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height, paddingTop: 8 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
          <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600, minWidth: 0, lineHeight: 1 }}>{d.value || ''}</div>
          <div title={`${d.label}: ${d.value}`}
            style={{ width: '100%', background: d.value ? color : '#f1f5f9', borderRadius: '4px 4px 0 0', height: `${Math.max((d.value / max) * 90, d.value ? 4 : 2)}%`, transition: 'height 0.3s', minHeight: 2 }} />
          <div style={{ fontSize: '0.6rem', color: '#94a3b8', textAlign: 'center', lineHeight: 1.2, overflow: 'hidden', maxWidth: '100%', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
}

function StatCard({ label, value, icon, sub, color }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: '20px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', borderLeft: `3px solid ${color || GOLD}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: NAV, lineHeight: 1 }}>{value}</div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 4 }}>{label}</div>
          {sub && <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>{sub}</div>}
        </div>
        <i className={`fas ${icon}`} style={{ color: color || GOLD, fontSize: 22, opacity: 0.7 }} />
      </div>
    </div>
  );
}

function downloadCSV(rows, filename) {
  const header = Object.keys(rows[0]);
  const csv = [header.join(','), ...rows.map(r => header.map(k => JSON.stringify(r[k] ?? '')).join(','))].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = filename;
  a.click();
}

export default function Reports() {
  const ctx = useCC();
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('overview');
  const [range, setRange] = useState(6); // months

  useEffect(() => {
    if (!ctx) return;
    const { church, token } = ctx;
    fetch(`/api/reports?churchId=${church.id}`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json()).then(setData);
  }, [ctx]);

  if (!ctx) return null;
  if (!data) return <div style={{ padding: 40, color: '#64748b' }}>Loading reports…</div>;

  const months = lastMonths(range);
  const isPro = ctx.church?.plan === 'pro' || ctx.church?.plan === 'custom';

  // Derived
  const totalMembers = data.members.length;
  const adults = data.members.filter(m => m.member_type !== 'child').length;
  const children = data.members.filter(m => m.member_type === 'child').length;
  const newThisMonth = data.members.filter(m => m.created_at?.slice(0, 7) === months[months.length - 1]).length;

  const membersByMonth = byMonth(data.members, 'created_at');
  const attendanceByMonth = byMonth(data.attendance, 'created_at');
  const firstTimersByMonth = byMonth(data.firstTimers, 'created_at');

  // Event attendance breakdown (last 10 events with attendance count)
  const eventCountMap = {};
  data.attendance.forEach(a => { if (a.event_id) eventCountMap[a.event_id] = (eventCountMap[a.event_id] || 0) + 1; });
  const topEvents = data.events.slice(0, 10).map(e => ({ ...e, count: eventCountMap[e.id] || 0 }));

  // First timers follow-up breakdown
  const ftByStatus = {};
  data.firstTimers.forEach(f => { const s = f.follow_up_status || 'pending'; ftByStatus[s] = (ftByStatus[s] || 0) + 1; });

  // Average attendance per event
  const avgAttendance = data.events.length ? Math.round(Object.values(eventCountMap).reduce((a, b) => a + b, 0) / data.events.filter(e => eventCountMap[e.id]).length || 0) : 0;

  const tabBtn = (id, label, icon) => (
    <button onClick={() => setTab(id)}
      style={{ padding: '8px 16px', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.825rem', cursor: 'pointer', background: tab === id ? NAV : '#f1f5f9', color: tab === id ? '#fff' : '#475569' }}>
      <i className={`fas ${icon}`} style={{ marginRight: 5 }} />{label}
    </button>
  );

  const chartData = (map) => months.map(m => ({ label: fmtM(m + '-01'), value: map[m] || 0 }));

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1000 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: NAV, marginBottom: 2 }}>
            <i className="fas fa-chart-bar" style={{ marginRight: 8, color: GOLD }} />Reports
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Attendance, growth and engagement insights.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={range} onChange={e => setRange(Number(e.target.value))}
            style={{ padding: '8px 12px', border: '1.5px solid #dde3f0', borderRadius: 10, fontSize: '0.85rem', fontFamily: 'inherit', color: NAV, fontWeight: 600, background: '#fff', cursor: 'pointer' }}>
            <option value={3}>Last 3 months</option>
            <option value={6}>Last 6 months</option>
            <option value={12}>Last 12 months</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {tabBtn('overview', 'Overview', 'fa-gauge-high')}
        {tabBtn('attendance', 'Attendance', 'fa-clipboard-list')}
        {tabBtn('members', 'Members', 'fa-users')}
        {tabBtn('firsttimers', 'First Timers', 'fa-user-plus')}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
            <StatCard label="Total members" value={totalMembers} icon="fa-users" color={NAV} sub={`${adults} adults · ${children} children`} />
            <StatCard label="New this month" value={newThisMonth} icon="fa-user-plus" color="#16a34a" />
            <StatCard label="Events held" value={data.events.length} icon="fa-calendar-days" color="#7c3aed" />
            <StatCard label="Avg attendance" value={avgAttendance || '—'} icon="fa-clipboard-list" color={GOLD} sub="per event" />
            <StatCard label="First timers" value={data.firstTimers.length} icon="fa-door-open" color="#0891b2" />
          </div>
          {/* Attendance trend */}
          <div style={{ background: '#fff', borderRadius: 14, padding: '22px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
            <div style={{ fontWeight: 800, color: NAV, fontSize: '0.95rem', marginBottom: 16 }}>Attendance trend</div>
            <BarChart data={chartData(attendanceByMonth)} color={NAV} height={140} />
          </div>
          {/* Side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
            <div style={{ background: '#fff', borderRadius: 14, padding: '22px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
              <div style={{ fontWeight: 800, color: NAV, fontSize: '0.95rem', marginBottom: 16 }}>New members</div>
              <BarChart data={chartData(membersByMonth)} color="#16a34a" height={120} />
            </div>
            <div style={{ background: '#fff', borderRadius: 14, padding: '22px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
              <div style={{ fontWeight: 800, color: NAV, fontSize: '0.95rem', marginBottom: 16 }}>First timers</div>
              <BarChart data={chartData(firstTimersByMonth)} color="#0891b2" height={120} />
            </div>
          </div>
        </div>
      )}

      {/* Attendance tab */}
      {tab === 'attendance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: '22px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontWeight: 800, color: NAV, fontSize: '0.95rem' }}>Monthly attendance</div>
              {isPro && (
                <button onClick={() => downloadCSV(months.map(m => ({ month: m, attendance: attendanceByMonth[m] || 0 })), 'attendance-by-month.csv')}
                  style={{ background: '#f1f5f9', color: NAV, border: 'none', borderRadius: 8, padding: '6px 14px', fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem' }}>
                  <i className="fas fa-download" style={{ marginRight: 5 }} />CSV
                </button>
              )}
            </div>
            <BarChart data={chartData(attendanceByMonth)} color={NAV} height={160} />
          </div>
          {/* Per-event table */}
          <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ fontWeight: 800, color: NAV, fontSize: '0.95rem' }}>Attendance by event (last 10)</div>
              {isPro && (
                <button onClick={() => downloadCSV(topEvents.map(e => ({ event: e.name, date: e.event_date, type: e.type, attendance: e.count })), 'attendance-by-event.csv')}
                  style={{ background: '#f1f5f9', color: NAV, border: 'none', borderRadius: 8, padding: '6px 14px', fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem' }}>
                  <i className="fas fa-download" style={{ marginRight: 5 }} />CSV
                </button>
              )}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Event', 'Date', 'Type', 'Attendance'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700, color: '#374151', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topEvents.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>No events yet.</td></tr>
                ) : topEvents.map(e => (
                  <tr key={e.id} style={{ borderTop: '1px solid #f8fafc' }}>
                    <td style={{ padding: '11px 16px', fontWeight: 600, color: NAV }}>{e.name}</td>
                    <td style={{ padding: '11px 16px', color: '#64748b' }}>{e.event_date ? fmt(e.event_date) : '—'}</td>
                    <td style={{ padding: '11px 16px', color: '#64748b', textTransform: 'capitalize' }}>{e.type || '—'}</td>
                    <td style={{ padding: '11px 16px' }}>
                      <span style={{ fontWeight: 700, color: e.count ? NAV : '#94a3b8', fontSize: '0.9rem' }}>{e.count || 0}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Members tab */}
      {tab === 'members' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
            <StatCard label="Total members" value={totalMembers} icon="fa-users" color={NAV} />
            <StatCard label="Adults" value={adults} icon="fa-person" color="#7c3aed" />
            <StatCard label="Children" value={children} icon="fa-child" color="#0891b2" />
            <StatCard label="Added this month" value={newThisMonth} icon="fa-user-plus" color="#16a34a" />
          </div>
          <div style={{ background: '#fff', borderRadius: 14, padding: '22px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontWeight: 800, color: NAV, fontSize: '0.95rem' }}>New members per month</div>
              {isPro && (
                <button onClick={() => downloadCSV(data.members.map(m => ({ name: '', created: m.created_at?.slice(0, 10), type: m.member_type })), 'members.csv')}
                  style={{ background: '#f1f5f9', color: NAV, border: 'none', borderRadius: 8, padding: '6px 14px', fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem' }}>
                  <i className="fas fa-download" style={{ marginRight: 5 }} />CSV
                </button>
              )}
            </div>
            <BarChart data={chartData(membersByMonth)} color="#16a34a" height={160} />
          </div>
          {/* Member type breakdown */}
          <div style={{ background: '#fff', borderRadius: 14, padding: '22px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
            <div style={{ fontWeight: 800, color: NAV, fontSize: '0.95rem', marginBottom: 16 }}>Member breakdown</div>
            {[
              { label: 'Adults', count: adults, color: '#7c3aed' },
              { label: 'Children', count: children, color: '#0891b2' },
            ].map(r => (
              <div key={r.label} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, color: '#374151' }}>{r.label}</span>
                  <span style={{ color: '#64748b' }}>{r.count} ({totalMembers ? Math.round(r.count / totalMembers * 100) : 0}%)</span>
                </div>
                <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${totalMembers ? (r.count / totalMembers) * 100 : 0}%`, background: r.color, borderRadius: 4, transition: 'width 0.3s' }} />
                </div>
              </div>
            ))}
          </div>
          {!isPro && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '14px 18px', fontSize: '0.85rem', color: '#92400e' }}>
              <i className="fas fa-lock" style={{ marginRight: 6 }} />CSV export is a Pro feature. <strong>Upgrade to Pro</strong> to download member data.
            </div>
          )}
        </div>
      )}

      {/* First Timers tab */}
      {tab === 'firsttimers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
            <StatCard label="Total first timers" value={data.firstTimers.length} icon="fa-door-open" color="#0891b2" />
            <StatCard label="This month" value={data.firstTimers.filter(f => f.created_at?.slice(0, 7) === months[months.length - 1]).length} icon="fa-calendar" color={GOLD} />
            <StatCard label="Followed up" value={data.firstTimers.filter(f => f.follow_up_status && f.follow_up_status !== 'pending').length} icon="fa-check-circle" color="#16a34a" />
            <StatCard label="Pending" value={ftByStatus['pending'] || 0} icon="fa-clock" color="#94a3b8" />
          </div>
          <div style={{ background: '#fff', borderRadius: 14, padding: '22px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontWeight: 800, color: NAV, fontSize: '0.95rem' }}>First timers per month</div>
              {isPro && (
                <button onClick={() => downloadCSV(months.map(m => ({ month: m, first_timers: firstTimersByMonth[m] || 0 })), 'first-timers-by-month.csv')}
                  style={{ background: '#f1f5f9', color: NAV, border: 'none', borderRadius: 8, padding: '6px 14px', fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem' }}>
                  <i className="fas fa-download" style={{ marginRight: 5 }} />CSV
                </button>
              )}
            </div>
            <BarChart data={chartData(firstTimersByMonth)} color="#0891b2" height={160} />
          </div>
          {/* Follow-up status breakdown */}
          {Object.keys(ftByStatus).length > 0 && (
            <div style={{ background: '#fff', borderRadius: 14, padding: '22px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
              <div style={{ fontWeight: 800, color: NAV, fontSize: '0.95rem', marginBottom: 16 }}>Follow-up status</div>
              {Object.entries(ftByStatus).map(([status, count]) => (
                <div key={status} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, color: '#374151', textTransform: 'capitalize' }}>{status.replace('_', ' ')}</span>
                    <span style={{ color: '#64748b' }}>{count} ({data.firstTimers.length ? Math.round(count / data.firstTimers.length * 100) : 0}%)</span>
                  </div>
                  <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${data.firstTimers.length ? (count / data.firstTimers.length) * 100 : 0}%`, background: '#0891b2', borderRadius: 4, transition: 'width 0.3s' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
