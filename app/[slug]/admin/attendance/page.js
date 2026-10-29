'use client';
import { useState, useEffect } from 'react';
import { useCC } from '../layout';

const NAV = '#1e3a5f';
const GOLD = '#f59e0b';

export default function Attendance() {
  const ctx = useCC();
  const [records, setRecords] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState('');

  const load = () => {
    if (!ctx) return;
    const { church, token } = ctx;
    const h = { 'Authorization': `Bearer ${token}` };
    let url = `/api/attendance?churchId=${church.id}&date=${date}`;
    if (eventId) url += `&eventId=${eventId}`;
    fetch(url, { headers: h }).then(r => r.json()).then(d => setRecords(d.records || []));
  };

  useEffect(() => {
    if (!ctx) return;
    const { church, token } = ctx;
    fetch(`/api/events?churchId=${church.id}`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()).then(d => setEvents(d.events || []));
  }, [ctx]);

  useEffect(() => { load(); }, [ctx, date, eventId]);

  const csvExport = () => {
    const rows = [['Name', 'Type', 'Sign In', 'Sign Out']];
    records.forEach(r => {
      const name = r.cc_members ? `${r.cc_members.first_name} ${r.cc_members.last_name}` : r.visitor_name || '';
      rows.push([name, r.visitor_type, r.sign_in_time ? new Date(r.sign_in_time).toLocaleTimeString('en-GB') : '', r.sign_out_time ? new Date(r.sign_out_time).toLocaleTimeString('en-GB') : '']);
    });
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv); a.download = `attendance-${date}.csv`; a.click();
  };

  if (!ctx) return null;

  return (
    <div style={{ padding: '32px 28px', maxWidth: 900 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: NAV }}>Attendance</h1>
        <button onClick={csvExport} style={{ background: '#f1f5f9', color: NAV, border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '9px 16px', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>
          <i className="fas fa-download" style={{ marginRight: 6 }} />Export CSV
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          style={{ padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.95rem', background: '#fff', outline: 'none' }} />
        <select value={eventId} onChange={e => setEventId(e.target.value)}
          style={{ padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.95rem', background: '#fff', outline: 'none', flex: 1, maxWidth: 300 }}>
          <option value="">All events</option>
          {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name} ({ev.event_date})</option>)}
        </select>
      </div>

      <div style={{ background: '#fff', borderRadius: 14, padding: '16px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 24, fontSize: '0.875rem', color: '#64748b' }}>
          <span><strong style={{ color: '#1e293b', fontSize: '1.1rem' }}>{records.length}</strong> total</span>
          <span><strong style={{ color: '#22c55e', fontSize: '1.1rem' }}>{records.filter(r => !r.sign_out_time).length}</strong> still in</span>
          <span><strong style={{ color: '#94a3b8', fontSize: '1.1rem' }}>{records.filter(r => r.sign_out_time).length}</strong> signed out</span>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ textAlign: 'left', padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Name</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Type</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Sign In</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Sign Out</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '28px', textAlign: 'center', color: '#94a3b8' }}>No records for this date.</td></tr>
            ) : records.map(r => {
              const name = r.cc_members ? `${r.cc_members.first_name} ${r.cc_members.last_name}` : r.visitor_name || 'Visitor';
              return (
                <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 500, color: '#1e293b' }}>{name}</td>
                  <td style={{ padding: '12px 16px', color: '#64748b', textTransform: 'capitalize' }}>{r.visitor_type}</td>
                  <td style={{ padding: '12px 16px', color: '#64748b' }}>{r.sign_in_time ? new Date(r.sign_in_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                  <td style={{ padding: '12px 16px', color: '#64748b' }}>{r.sign_out_time ? new Date(r.sign_out_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: r.sign_out_time ? '#f1f5f9' : '#dcfce7', color: r.sign_out_time ? '#64748b' : '#16a34a', padding: '3px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600 }}>
                      {r.sign_out_time ? 'Left' : 'In'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
