'use client';
import { useState, useEffect } from 'react';
import { useCC } from './layout';

const NAV = '#1e3a5f';
const GOLD = '#f59e0b';

function StatCard({ icon, label, value, color }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: color + '1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <i className={`fas ${icon}`} style={{ color, fontSize: 22 }} />
      </div>
      <div>
        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>{label}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const ctx = useCC();
  const [stats, setStats] = useState({ members: 0, today: 0, events: 0, firstTimers: 0 });
  const [recent, setRecent] = useState([]);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!ctx) return;
    const { church, token } = ctx;
    const h = { 'Authorization': `Bearer ${token}` };
    Promise.all([
      fetch(`/api/members?churchId=${church.id}`, { headers: h }).then(r => r.json()),
      fetch(`/api/attendance?churchId=${church.id}&date=${today}`, { headers: h }).then(r => r.json()),
      fetch(`/api/events?churchId=${church.id}`, { headers: h }).then(r => r.json()),
      fetch(`/api/first-timers?churchId=${church.id}`, { headers: h }).then(r => r.json()),
    ]).then(([m, a, e, ft]) => {
      setStats({ members: m.members?.length || 0, today: a.records?.length || 0, events: e.events?.length || 0, firstTimers: ft.firstTimers?.length || 0 });
      setRecent((a.records || []).slice(0, 8));
    });
  }, [ctx, today]);

  if (!ctx) return null;
  const { church } = ctx;

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1000 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: NAV }}>{church.name}</h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>{new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
        <StatCard icon="fa-users"       label="Total members"       value={stats.members}    color={NAV} />
        <StatCard icon="fa-door-open"   label="Signed in today"     value={stats.today}      color="#22c55e" />
        <StatCard icon="fa-calendar"    label="Events scheduled"    value={stats.events}     color={GOLD} />
        <StatCard icon="fa-user-plus"   label="First timers"        value={stats.firstTimers} color="#8b5cf6" />
      </div>

      <div style={{ background: '#fff', borderRadius: 14, padding: '24px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: NAV, marginBottom: 16 }}>Today's sign-ins</h2>
        {recent.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No sign-ins recorded today yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                <th style={{ textAlign: 'left', padding: '8px 12px', color: '#64748b', fontWeight: 600 }}>Name</th>
                <th style={{ textAlign: 'left', padding: '8px 12px', color: '#64748b', fontWeight: 600 }}>Type</th>
                <th style={{ textAlign: 'left', padding: '8px 12px', color: '#64748b', fontWeight: 600 }}>Sign-in</th>
                <th style={{ textAlign: 'left', padding: '8px 12px', color: '#64748b', fontWeight: 600 }}>Sign-out</th>
              </tr>
            </thead>
            <tbody>
              {recent.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '10px 12px', color: '#1e293b', fontWeight: 500 }}>
                    {r.cc_members ? `${r.cc_members.first_name} ${r.cc_members.last_name}` : r.visitor_name || '—'}
                  </td>
                  <td style={{ padding: '10px 12px', color: '#64748b', textTransform: 'capitalize' }}>{r.visitor_type}</td>
                  <td style={{ padding: '10px 12px', color: '#64748b' }}>{r.sign_in_time ? new Date(r.sign_in_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                  <td style={{ padding: '10px 12px', color: '#64748b' }}>{r.sign_out_time ? new Date(r.sign_out_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : <span style={{ color: '#22c55e', fontWeight: 600 }}>In</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
