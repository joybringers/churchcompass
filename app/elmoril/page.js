'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const NAV = '#1e3a5f';
const GOLD = '#f59e0b';

const COMPASS = (
  <svg width="22" height="22" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="18" fill={NAV}/>
    <polygon points="50,85 59,68 50,50 41,68" fill={GOLD} opacity="0.4"/>
    <polygon points="85,50 68,41 50,50 68,59" fill={GOLD} opacity="0.4"/>
    <polygon points="15,50 32,41 50,50 32,59" fill={GOLD} opacity="0.4"/>
    <polygon points="50,13 59,32 50,50 41,32" fill={GOLD}/>
    <circle cx="50" cy="50" r="7" fill="#fff"/>
    <circle cx="50" cy="50" r="3.5" fill={NAV}/>
  </svg>
);

function relativeTime(iso) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso);
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 7 * 86400000) return `${Math.floor(diff / 86400000)}d ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: diff > 365 * 86400000 ? 'numeric' : undefined });
}

export default function ElmorilAdmin() {
  const router = useRouter();
  const [keyInput, setKeyInput] = useState('');
  const [authed, setAuthed] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sort, setSort] = useState('lastActivity');
  const [sortDir, setSortDir] = useState('desc');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all | active | inactive

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('elmoril_key');
      if (saved) fetchData(saved);
    } catch {}
  }, []);

  const fetchData = async (k) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/elmoril?key=${encodeURIComponent(k)}`);
      if (res.status === 401) { setError('Invalid key — check and try again.'); setLoading(false); return; }
      const d = await res.json();
      setData(d);
      setAuthed(true);
      try { sessionStorage.setItem('elmoril_key', k); } catch {}
    } catch {
      setError('Could not connect. Try again.');
    }
    setLoading(false);
  };

  const signOut = () => {
    setAuthed(false); setData(null);
    try { sessionStorage.removeItem('elmoril_key'); } catch {}
    router.push('/');
  };

  const toggleSort = (col) => {
    if (sort === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSort(col); setSortDir('desc'); }
  };

  // --- LOGIN ---
  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', background: `linear-gradient(145deg, #0c2040 0%, ${NAV} 60%, #0f2744 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ background: '#fff', borderRadius: 22, padding: '44px 40px', width: '100%', maxWidth: 400, boxShadow: '0 32px 80px rgba(0,0,0,0.4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
            {COMPASS}
            <div>
              <div style={{ fontWeight: 900, fontSize: '0.85rem', color: NAV, letterSpacing: '0.04em' }}>ELMORIL <span style={{ color: GOLD }}>PLATFORM</span></div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>ChurchCompass Admin</div>
            </div>
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: NAV, marginBottom: 6 }}>Platform Dashboard</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 26 }}>Enter your Elmoril admin key to access usage data.</p>
          <form onSubmit={e => { e.preventDefault(); fetchData(keyInput); }}>
            <div style={{ position: 'relative', marginBottom: 14 }}>
              <input
                type="password" value={keyInput} onChange={e => setKeyInput(e.target.value)}
                placeholder="Admin key"
                style={{ width: '100%', padding: '15px 18px', border: `2px solid ${error ? '#fecaca' : '#e2e8f0'}`, borderRadius: 12, fontSize: '1rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: error ? '#fff5f5' : '#fff' }}
              />
            </div>
            {error && <p style={{ color: '#dc2626', fontSize: '0.8rem', marginBottom: 12, fontWeight: 600 }}>{error}</p>}
            <button type="submit" disabled={loading || !keyInput}
              style={{ width: '100%', background: loading || !keyInput ? '#94a3b8' : NAV, color: '#fff', border: 'none', borderRadius: 12, padding: '15px', fontWeight: 700, cursor: loading || !keyInput ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: '0.95rem', transition: 'background 0.15s' }}>
              {loading ? 'Checking…' : 'Access Dashboard'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- DASHBOARD ---
  const T = data.totals;
  const monthly = data.monthly || [];

  let rows = [...(data.churches || [])];
  if (filter === 'active') rows = rows.filter(c => c.isActive);
  if (filter === 'inactive') rows = rows.filter(c => !c.isActive);
  if (search) rows = rows.filter(c => `${c.name} ${c.slug} ${c.adminEmail} ${c.denomination || ''}`.toLowerCase().includes(search.toLowerCase()));
  rows.sort((a, b) => {
    let av = a[sort] ?? '', bv = b[sort] ?? '';
    if (sort === 'lastActivity' || sort === 'createdAt') { av = av || '0'; bv = bv || '0'; }
    if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    return sortDir === 'asc' ? av - bv : bv - av;
  });

  const maxMonthly = Math.max(...monthly.map(m => m.count), 1);
  const th = { padding: '10px 14px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none', background: '#f8fafc' };
  const td = (extra = {}) => ({ padding: '14px 14px', fontSize: '0.875rem', color: '#334155', borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle', ...extra });

  return (
    <div style={{ minHeight: '100vh', background: '#f4f6fb', fontFamily: 'system-ui, sans-serif' }}>

      {/* Top bar */}
      <div style={{ background: NAV, padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 12px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {COMPASS}
          <div>
            <div style={{ color: '#fff', fontWeight: 900, fontSize: '0.85rem', letterSpacing: '0.04em' }}>ELMORIL <span style={{ color: GOLD }}>PLATFORM</span></div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem' }}>ChurchCompass · Internal Admin</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => fetchData(sessionStorage.getItem('elmoril_key') || '')}
            style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}>
            ↻ Refresh
          </button>
          <button onClick={signOut}
            style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}>
            Sign out
          </button>
        </div>
      </div>

      <div style={{ padding: '32px 28px', maxWidth: 1280, margin: '0 auto' }}>

        {/* Stat tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14, marginBottom: 28 }}>
          {[
            { label: 'Total Churches', value: T.churches, sub: `${T.activeChurches} active (30d)`, accent: NAV },
            { label: 'Sign-ins This Month', value: T.signInsThisMonth.toLocaleString(), sub: 'calendar month', accent: '#7c3aed' },
            { label: 'Sign-ins This Week', value: T.signInsThisWeek.toLocaleString(), sub: 'last 7 days', accent: '#0891b2' },
            { label: 'All-time Sign-ins', value: T.totalSignIns.toLocaleString(), sub: 'across all churches', accent: '#059669' },
            { label: 'Total Members', value: T.totalMembers.toLocaleString(), sub: 'active records', accent: GOLD },
            { label: 'First Timers', value: (T.totalFirstTimers || 0).toLocaleString(), sub: 'all time', accent: '#e11d48' },
            { label: 'Events Created', value: (T.totalEvents || 0).toLocaleString(), sub: 'across all churches', accent: '#d97706' },
          ].map(({ label, value, sub, accent }) => (
            <div key={label} style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 16, padding: '20px 20px', borderTop: `3px solid ${accent}` }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 10 }}>{label}</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: accent, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 6 }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Activity chart (6-month bar) */}
        <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 16, padding: '24px 24px 20px', marginBottom: 24 }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 20 }}>Sign-ins — last 6 months</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 80 }}>
            {monthly.map((m, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{m.count || ''}</div>
                <div style={{ width: '100%', background: i === monthly.length - 1 ? NAV : '#c7d9ef', borderRadius: '4px 4px 0 0', height: `${Math.max(4, (m.count / maxMonthly) * 52)}px`, transition: 'height 0.3s' }} />
                <div style={{ fontSize: '0.65rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Filters + search */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search churches…"
            style={{ flex: 1, minWidth: 200, padding: '10px 14px', border: '1.5px solid #dde3f0', borderRadius: 10, fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none', background: '#fff' }} />
          {['all', 'active', 'inactive'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '9px 16px', border: `1.5px solid ${filter === f ? NAV : '#dde3f0'}`, borderRadius: 10, background: filter === f ? NAV : '#fff', color: filter === f ? '#fff' : '#64748b', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize' }}>
              {f === 'all' ? `All (${data.churches.length})` : f === 'active' ? `Active (${data.churches.filter(c => c.isActive).length})` : `Inactive (${data.churches.filter(c => !c.isActive).length})`}
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  <th style={th} onClick={() => toggleSort('name')}>Church {sort === 'name' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</th>
                  <th style={th}>Contact</th>
                  <th style={th} onClick={() => toggleSort('createdAt')}>Registered {sort === 'createdAt' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</th>
                  <th style={th} onClick={() => toggleSort('lastActivity')}>Last Active {sort === 'lastActivity' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</th>
                  <th style={th} onClick={() => toggleSort('memberCount')}>Members {sort === 'memberCount' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</th>
                  <th style={th} onClick={() => toggleSort('signInsThisWeek')}>Week {sort === 'signInsThisWeek' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</th>
                  <th style={th} onClick={() => toggleSort('signInsThisMonth')}>Month {sort === 'signInsThisMonth' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</th>
                  <th style={th} onClick={() => toggleSort('totalSignIns')}>Total {sort === 'totalSignIns' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</th>
                  <th style={{...th, borderLeft: '2px solid #e2e8f0'}} onClick={() => toggleSort('firstTimerCount')}>1st Timers {sort === 'firstTimerCount' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</th>
                  <th style={th} onClick={() => toggleSort('eventCount')}>Events {sort === 'eventCount' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</th>
                  <th style={th} onClick={() => toggleSort('rsvpCount')}>RSVPs {sort === 'rsvpCount' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</th>
                  <th style={th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={12} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>No churches match.</td></tr>
                ) : rows.map(c => (
                  <tr key={c.id} style={{ transition: 'background 0.1s' }} onMouseEnter={e => e.currentTarget.style.background='#f8fafc'} onMouseLeave={e => e.currentTarget.style.background=''}>
                    <td style={td({ fontWeight: 700 })}>
                      <div style={{ color: NAV }}>{c.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 400 }}>/{c.slug}{c.denomination ? ` · ${c.denomination}` : ''}</div>
                    </td>
                    <td style={td()}>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{c.adminEmail}</div>
                    </td>
                    <td style={td()}>{relativeTime(c.createdAt)}</td>
                    <td style={td({ fontWeight: c.lastActivity ? 600 : 400 })}>{relativeTime(c.lastActivity)}</td>
                    <td style={td({ fontVariantNumeric: 'tabular-nums', textAlign: 'right' })}>{c.memberCount}</td>
                    <td style={td({ fontVariantNumeric: 'tabular-nums', textAlign: 'right', fontWeight: c.signInsThisWeek > 0 ? 700 : 400, color: c.signInsThisWeek > 0 ? NAV : '#94a3b8' })}>{c.signInsThisWeek || '—'}</td>
                    <td style={td({ fontVariantNumeric: 'tabular-nums', textAlign: 'right', fontWeight: c.signInsThisMonth > 0 ? 700 : 400, color: c.signInsThisMonth > 0 ? '#7c3aed' : '#94a3b8' })}>{c.signInsThisMonth || '—'}</td>
                    <td style={td({ fontVariantNumeric: 'tabular-nums', textAlign: 'right' })}>{c.totalSignIns.toLocaleString()}</td>
                    <td style={td({ fontVariantNumeric: 'tabular-nums', textAlign: 'right', borderLeft: '2px solid #f1f5f9', fontWeight: c.firstTimerCount > 0 ? 700 : 400, color: c.firstTimerCount > 0 ? '#e11d48' : '#94a3b8' })}>{c.firstTimerCount || '—'}</td>
                    <td style={td({ fontVariantNumeric: 'tabular-nums', textAlign: 'right', fontWeight: c.eventCount > 0 ? 700 : 400, color: c.eventCount > 0 ? '#d97706' : '#94a3b8' })}>{c.eventCount || '—'}</td>
                    <td style={td({ fontVariantNumeric: 'tabular-nums', textAlign: 'right', color: c.rsvpCount > 0 ? '#0891b2' : '#94a3b8' })}>{c.rsvpCount || '—'}</td>
                    <td style={td()}>
                      <span style={{ background: c.isActive ? '#f0fdf4' : '#fef2f2', color: c.isActive ? '#16a34a' : '#dc2626', borderRadius: 20, padding: '4px 11px', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.03em' }}>
                        {c.isActive ? '● Active' : '● Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ marginTop: 16, fontSize: '0.72rem', color: '#94a3b8', textAlign: 'right' }}>
          Active = at least one sign-in in the last 30 days. Data refreshes on page load.
        </div>
      </div>
    </div>
  );
}
