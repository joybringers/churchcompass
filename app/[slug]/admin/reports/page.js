'use client';
import { useState, useEffect } from 'react';
import { useCC } from '../layout';

const NAV = '#1e3a5f';
const GOLD = '#f59e0b';

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatWeekLabel(date) {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

export default function Reports() {
  const ctx = useCC();
  const [records, setRecords] = useState([]);
  const [firstTimers, setFirstTimers] = useState([]);
  const [loading, setLoading] = useState(true);

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
    ]).then(([att, ft]) => {
      setRecords(att.records || []);
      setFirstTimers(ft.firstTimers || []);
      setLoading(false);
    });
  }, [ctx]);

  if (!ctx || loading) return (
    <div style={{ padding: '32px 28px', color: '#64748b' }}>Loading reports…</div>
  );

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // Weekly buckets — last 12 weeks
  const weeks = [];
  for (let i = 11; i >= 0; i--) {
    const weekStart = getWeekStart(new Date(now - i * 7 * 86400000));
    const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 7);
    const count = records.filter(r => {
      const t = new Date(r.sign_in_time);
      return t >= weekStart && t < weekEnd;
    }).length;
    weeks.push({ label: formatWeekLabel(weekStart), count });
  }

  const maxCount = Math.max(...weeks.map(w => w.count), 1);

  // Stats
  const thisMonth = records.filter(r => r.sign_in_time >= monthStart);
  const avgPerWeek = weeks.length ? Math.round(weeks.reduce((s, w) => s + w.count, 0) / weeks.length) : 0;
  const dayCount = [0,0,0,0,0,0,0];
  records.forEach(r => { dayCount[new Date(r.sign_in_time).getDay()]++; });
  const busiestDay = DAYS[dayCount.indexOf(Math.max(...dayCount))];
  const ftThisMonth = firstTimers.filter(ft => ft.created_at >= monthStart).length;

  // Top events
  const eventMap = {};
  records.forEach(r => {
    if (!r.event_id) return;
    const name = r.cc_events?.name || 'Unnamed event';
    eventMap[r.event_id] = { name, count: (eventMap[r.event_id]?.count || 0) + 1 };
  });
  const topEvents = Object.values(eventMap).sort((a, b) => b.count - a.count).slice(0, 5);

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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'This month', value: thisMonth.length, color: NAV, icon: 'fa-users' },
          { label: 'Avg per week', value: avgPerWeek, color: '#22c55e', icon: 'fa-chart-line' },
          { label: 'Busiest day', value: busiestDay, color: GOLD, icon: 'fa-calendar-day' },
          { label: 'First timers (month)', value: ftThisMonth, color: '#8b5cf6', icon: 'fa-user-plus' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: s.color + '1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className={`fas ${s.icon}`} style={{ color: s.color, fontSize: 18 }} />
            </div>
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 3 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '24px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', marginBottom: 24 }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: NAV, marginBottom: 20 }}>Weekly attendance — last 12 weeks</h2>
        <svg width="100%" viewBox={`0 0 ${weeks.length * 70} ${chartH + 36}`} style={{ overflow: 'visible' }}>
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

      {/* Top events */}
      {topEvents.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 14, padding: '24px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: NAV, marginBottom: 16 }}>Top events by attendance</h2>
          {topEvents.map((ev, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: GOLD + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: GOLD }}>{i + 1}</div>
              <div style={{ flex: 1, fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>{ev.name}</div>
              <div style={{ background: NAV + '12', color: NAV, padding: '3px 12px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700 }}>{ev.count}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
