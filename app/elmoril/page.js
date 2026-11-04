'use client';
import { useState, useEffect } from 'react';

const NAV = '#0f172a';
const ACCENT = '#6366f1';
const GOLD = '#f59e0b';
const GREEN = '#10b981';
const RED = '#ef4444';
const PURPLE = '#8b5cf6';

function fmt£(n) { return `£${Number(n || 0).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` }

function relativeTime(iso) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso);
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 7 * 86400000) return `${Math.floor(diff / 86400000)}d ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function KPI({ label, value, sub, color = ACCENT, icon, change }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
        {icon && <i className={`fas ${icon}`} style={{ color, opacity: 0.5, fontSize: 14 }} />}
      </div>
      <div style={{ fontSize: '1.9rem', fontWeight: 900, color: NAV, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {change !== undefined && (
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: change >= 0 ? GREEN : RED, background: change >= 0 ? '#f0fdf4' : '#fef2f2', padding: '1px 6px', borderRadius: 20 }}>
            {change >= 0 ? '+' : ''}{change}
          </span>
        )}
        {sub && <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{sub}</span>}
      </div>
    </div>
  );
}

function PlanChip({ plan }) {
  const cfg = {
    pro: { bg: '#ede9fe', color: PURPLE, label: 'Pro' },
    custom: { bg: '#fef9c3', color: '#a16207', label: 'Custom' },
    free: { bg: '#f1f5f9', color: '#64748b', label: 'Free' },
  }[plan] || { bg: '#f1f5f9', color: '#64748b', label: 'Free' };
  return <span style={{ background: cfg.bg, color: cfg.color, fontSize: '0.68rem', fontWeight: 800, padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{cfg.label}</span>;
}

function StageBar({ stage, count, total, description, i }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const colors = [ACCENT, '#0ea5e9', GREEN, GOLD, PURPLE, '#e11d48'];
  const color = colors[i % colors.length];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
      <div style={{ width: 24, height: 24, borderRadius: '50%', background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: '0.65rem', fontWeight: 900, color }}>{i + 1}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b' }}>{stage}</span>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color, minWidth: 60, textAlign: 'right' }}>{count} <span style={{ color: '#94a3b8', fontWeight: 400, fontSize: '0.72rem' }}>({pct}%)</span></span>
        </div>
        <div style={{ background: '#f1f5f9', borderRadius: 4, height: 6, overflow: 'hidden' }}>
          <div style={{ background: color, width: `${pct}%`, height: '100%', borderRadius: 4, transition: 'width 0.5s ease' }} />
        </div>
        <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: 2 }}>{description}</div>
      </div>
    </div>
  );
}

export default function ElmorilAdmin() {
  const [keyInput, setKeyInput] = useState('');
  const [authed, setAuthed] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sort, setSort] = useState('lastActivity');
  const [sortDir, setSortDir] = useState('desc');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [view, setView] = useState('overview'); // overview | churches

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('elmoril_key');
      if (saved) fetchData(saved);
    } catch {}
  }, []);

  const fetchData = async (k) => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`/api/elmoril?key=${encodeURIComponent(k)}`);
      if (res.status === 401) { setError('Invalid key.'); setLoading(false); return; }
      const d = await res.json();
      setData(d); setAuthed(true);
      try { sessionStorage.setItem('elmoril_key', k); } catch {}
    } catch { setError('Could not connect.'); }
    setLoading(false);
  };

  const signOut = () => {
    setAuthed(false); setData(null);
    try { sessionStorage.removeItem('elmoril_key'); } catch {}
  };

  const toggleSort = (col) => {
    if (sort === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSort(col); setSortDir('desc'); }
  };

  // ── LOGIN ──
  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', background: `radial-gradient(ellipse at top, #1e1b4b 0%, ${NAV} 60%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: '44px 40px', width: '100%', maxWidth: 400, boxShadow: '0 40px 100px rgba(0,0,0,0.5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fas fa-compass" style={{ color: '#fff', fontSize: 18 }} />
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: '0.9rem', color: NAV, letterSpacing: '0.04em' }}>ELMORIL <span style={{ color: ACCENT }}>PLATFORM</span></div>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Internal Admin · ChurchCompass</div>
            </div>
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: NAV, marginBottom: 6 }}>Platform Overview</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 28 }}>Revenue, activation and church analytics.</p>
          <form onSubmit={e => { e.preventDefault(); fetchData(keyInput); }}>
            <input type="password" value={keyInput} onChange={e => setKeyInput(e.target.value)} placeholder="Admin key"
              style={{ width: '100%', padding: '14px 16px', border: `2px solid ${error ? '#fecaca' : '#e2e8f0'}`, borderRadius: 12, fontSize: '1rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', marginBottom: error ? 8 : 14 }} />
            {error && <p style={{ color: RED, fontSize: '0.8rem', marginBottom: 12, fontWeight: 600 }}>{error}</p>}
            <button type="submit" disabled={loading || !keyInput}
              style={{ width: '100%', background: ACCENT, color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem', opacity: loading || !keyInput ? 0.6 : 1 }}>
              {loading ? 'Checking…' : 'Access dashboard →'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const { totals: T, funnel, monthlySignups, churches } = data;

  // Filter churches
  let rows = [...(churches || [])];
  if (filter === 'active') rows = rows.filter(c => c.isActive);
  if (filter === 'inactive') rows = rows.filter(c => !c.isActive);
  if (planFilter === 'pro') rows = rows.filter(c => c.plan === 'pro' || c.plan === 'custom');
  if (planFilter === 'free') rows = rows.filter(c => !c.plan || c.plan === 'free');
  if (search) rows = rows.filter(c => `${c.name} ${c.slug} ${c.adminEmail}`.toLowerCase().includes(search.toLowerCase()));
  rows.sort((a, b) => {
    let av = a[sort] ?? '', bv = b[sort] ?? '';
    if (sort === 'lastActivity' || sort === 'createdAt') { av = av || '0'; bv = bv || '0'; }
    if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    return sortDir === 'asc' ? av - bv : bv - av;
  });

  const maxSignups = Math.max(...(monthlySignups || []).map(m => m.signups), 1);
  const maxSignIns = Math.max(...(monthlySignups || []).map(m => m.signIns), 1);

  const TH = ({ children, col, right }) => (
    <th onClick={() => col && toggleSort(col)}
      style={{ padding: '10px 14px', textAlign: right ? 'right' : 'left', fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', cursor: col ? 'pointer' : 'default', whiteSpace: 'nowrap', userSelect: 'none', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
      {children}{col && sort === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
    </th>
  );

  const featureDot = (has) => (
    <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: has ? GREEN : '#e2e8f0' }} />
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', system-ui, sans-serif", color: NAV }}>

      {/* Top nav */}
      <div style={{ background: NAV, borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56, position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fas fa-compass" style={{ color: '#fff', fontSize: 13 }} />
            </div>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: '0.85rem', letterSpacing: '0.04em' }}>ELMORIL <span style={{ color: ACCENT }}>PLATFORM</span></span>
          </div>
          <div style={{ display: 'flex', gap: 2 }}>
            {[['overview', 'Overview'], ['churches', 'Churches']].map(([id, label]) => (
              <button key={id} onClick={() => setView(id)}
                style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: view === id ? 'rgba(99,102,241,0.2)' : 'transparent', color: view === id ? '#a5b4fc' : 'rgba(255,255,255,0.4)', fontWeight: 600, fontSize: '0.825rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem' }}>Last refreshed: {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
          <button onClick={() => fetchData(sessionStorage.getItem('elmoril_key') || '')}
            style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}>
            <i className="fas fa-rotate" style={{ marginRight: 5 }} />{loading ? 'Refreshing…' : 'Refresh'}
          </button>
          <button onClick={signOut}
            style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit' }}>
            Sign out
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '28px 24px' }}>

        {/* ── OVERVIEW ── */}
        {view === 'overview' && (
          <>
            {/* Revenue row */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Revenue</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
                <KPI label="MRR" value={fmt£(T.mrr)} sub="est. monthly recurring" color={GREEN} icon="fa-sterling-sign" change={T.newChurchesThisMonth > 0 ? T.newChurchesThisMonth * 9 : undefined} />
                <KPI label="ARR" value={fmt£(T.arr)} sub="est. annual run rate" color={GREEN} icon="fa-chart-line" />
                <KPI label="Pro subscribers" value={T.proChurches} sub={`of ${T.churches} churches`} color={PURPLE} icon="fa-crown" change={T.proChurches} />
                <KPI label="Conversion rate" value={`${T.conversionRate}%`} sub="Free → Pro" color={ACCENT} icon="fa-arrow-trend-up" />
              </div>
            </div>

            {/* Usage row */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Usage</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                <KPI label="Total churches" value={T.churches} sub={`${T.activeChurches} active (30d)`} color={ACCENT} icon="fa-church" change={T.newChurchesThisWeek > 0 ? `+${T.newChurchesThisWeek} this week` : undefined} />
                <KPI label="New this month" value={T.newChurchesThisMonth} sub="new signups" color="#0ea5e9" icon="fa-user-plus" />
                <KPI label="Total members" value={T.totalMembers.toLocaleString()} sub="across all churches" color={GOLD} icon="fa-users" />
                <KPI label="Sign-ins this week" value={T.signInsThisWeek.toLocaleString()} sub="last 7 days" color="#0891b2" icon="fa-clipboard-check" />
                <KPI label="Sign-ins this month" value={T.signInsThisMonth.toLocaleString()} sub="calendar month" color={ACCENT} icon="fa-calendar" />
                <KPI label="All-time sign-ins" value={T.totalSignIns.toLocaleString()} sub="platform total" color="#64748b" icon="fa-database" />
                <KPI label="First timers" value={(T.totalFirstTimers || 0).toLocaleString()} sub="all churches" color={RED} icon="fa-hand-wave" />
                <KPI label="Events created" value={(T.totalEvents || 0).toLocaleString()} sub="all churches" color="#d97706" icon="fa-calendar-days" />
              </div>
            </div>

            {/* Charts + Funnel row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 340px', gap: 16, marginBottom: 20 }}>

              {/* Monthly signups */}
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>New signups — last 6 months</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
                  {(monthlySignups || []).map((m, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{ fontSize: '0.68rem', color: ACCENT, fontWeight: 800 }}>{m.signups || ''}</div>
                      <div style={{ width: '100%', background: i === monthlySignups.length - 1 ? ACCENT : '#c7d2fe', borderRadius: '4px 4px 0 0', height: `${Math.max(3, (m.signups / maxSignups) * 56)}px` }} />
                      <div style={{ fontSize: '0.6rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>{m.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Monthly sign-ins */}
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Platform sign-ins — last 6 months</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
                  {(monthlySignups || []).map((m, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{ fontSize: '0.68rem', color: '#0891b2', fontWeight: 800 }}>{m.signIns || ''}</div>
                      <div style={{ width: '100%', background: i === monthlySignups.length - 1 ? '#0891b2' : '#bae6fd', borderRadius: '4px 4px 0 0', height: `${Math.max(3, (m.signIns / maxSignIns) * 56)}px` }} />
                      <div style={{ fontSize: '0.6rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>{m.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Plan breakdown */}
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Plan breakdown</div>
                {[
                  { label: 'Free', count: T.freeChurches, color: '#e2e8f0', textColor: '#64748b' },
                  { label: 'Pro', count: T.proChurches, color: PURPLE, textColor: PURPLE },
                ].map(({ label, count, color, textColor }) => (
                  <div key={label} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: textColor }}>{label}</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: NAV }}>{count} <span style={{ color: '#94a3b8', fontWeight: 400 }}>({T.churches > 0 ? Math.round(count / T.churches * 100) : 0}%)</span></span>
                    </div>
                    <div style={{ background: '#f1f5f9', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                      <div style={{ background: color, width: T.churches > 0 ? `${count / T.churches * 100}%` : '0%', height: '100%', borderRadius: 4 }} />
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: 2 }}>Est. MRR from Pro</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: GREEN }}>{fmt£(T.mrr)}</div>
                </div>
              </div>
            </div>

            {/* Activation funnel */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Activation funnel</div>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>% of {T.churches} total churches</span>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: 14 }}>Drop-off points show where churches stop engaging after signup.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0 32px' }}>
                {(funnel || []).map((f, i) => (
                  <StageBar key={f.stage} {...f} total={T.churches} i={i} />
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── CHURCHES TABLE ── */}
        {view === 'churches' && (
          <>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search church, slug, email…"
                style={{ flex: 1, minWidth: 220, padding: '9px 14px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none', background: '#fff' }} />
              <div style={{ display: 'flex', gap: 6 }}>
                {[['all', `All (${churches.length})`], ['active', `Active (${churches.filter(c => c.isActive).length})`], ['inactive', `Inactive (${churches.filter(c => !c.isActive).length})`]].map(([f, label]) => (
                  <button key={f} onClick={() => setFilter(f)}
                    style={{ padding: '7px 14px', border: `1px solid ${filter === f ? ACCENT : '#e2e8f0'}`, borderRadius: 10, background: filter === f ? ACCENT : '#fff', color: filter === f ? '#fff' : '#64748b', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                    {label}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {[['all', 'All plans'], ['pro', 'Pro only'], ['free', 'Free only']].map(([f, label]) => (
                  <button key={f} onClick={() => setPlanFilter(f)}
                    style={{ padding: '7px 14px', border: `1px solid ${planFilter === f ? PURPLE : '#e2e8f0'}`, borderRadius: 10, background: planFilter === f ? PURPLE : '#fff', color: planFilter === f ? '#fff' : '#64748b', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <TH col="name">Church</TH>
                      <TH>Plan</TH>
                      <TH col="createdAt">Registered</TH>
                      <TH col="lastActivity">Last active</TH>
                      <TH col="memberCount" right>Members</TH>
                      <TH col="signInsThisWeek" right>Week</TH>
                      <TH col="signInsThisMonth" right>Month</TH>
                      <TH col="totalSignIns" right>Total</TH>
                      <TH col="firstTimerCount" right>1st timers</TH>
                      <TH col="activationStage" right>Stage</TH>
                      <TH>Features used</TH>
                      <TH>Status</TH>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr><td colSpan={12} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No churches match.</td></tr>
                    ) : rows.map(c => (
                      <tr key={c.id}
                        onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                        onMouseLeave={e => e.currentTarget.style.background = ''}>
                        <td style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9' }}>
                          <div style={{ fontWeight: 700, color: NAV, fontSize: '0.875rem' }}>{c.name}</div>
                          <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontFamily: 'monospace' }}>/{c.slug}</div>
                          <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{c.adminEmail}</div>
                        </td>
                        <td style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9' }}><PlanChip plan={c.plan} /></td>
                        <td style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', fontSize: '0.8rem', color: '#64748b', whiteSpace: 'nowrap' }}>{relativeTime(c.createdAt)}</td>
                        <td style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', fontSize: '0.8rem', fontWeight: c.lastActivity ? 600 : 400, color: c.lastActivity ? NAV : '#94a3b8', whiteSpace: 'nowrap' }}>{relativeTime(c.lastActivity)}</td>
                        <td style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontSize: '0.875rem', fontWeight: 700, color: c.memberCount > 0 ? NAV : '#94a3b8', fontVariantNumeric: 'tabular-nums' }}>{c.memberCount || '—'}</td>
                        <td style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontSize: '0.875rem', fontWeight: 700, color: c.signInsThisWeek > 0 ? ACCENT : '#94a3b8', fontVariantNumeric: 'tabular-nums' }}>{c.signInsThisWeek || '—'}</td>
                        <td style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontSize: '0.875rem', fontWeight: 700, color: c.signInsThisMonth > 0 ? '#0891b2' : '#94a3b8', fontVariantNumeric: 'tabular-nums' }}>{c.signInsThisMonth || '—'}</td>
                        <td style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontSize: '0.875rem', fontVariantNumeric: 'tabular-nums', color: '#475569' }}>{c.totalSignIns.toLocaleString()}</td>
                        <td style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontSize: '0.875rem', fontWeight: c.firstTimerCount > 0 ? 700 : 400, color: c.firstTimerCount > 0 ? RED : '#94a3b8', fontVariantNumeric: 'tabular-nums' }}>{c.firstTimerCount || '—'}</td>
                        <td style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', textAlign: 'right' }}>
                          <span style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.68rem', fontWeight: 800, padding: '2px 8px', borderRadius: 20 }}>
                            {c.activationStage}/5
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9' }}>
                          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                            {[
                              [c.hasMembers, 'Members'],
                              [c.hasEvents, 'Events'],
                              [c.hasAttendance, 'Attendance'],
                              [c.hasFirstTimers, 'First timers'],
                              [c.hasGiving, 'Giving'],
                            ].map(([has, label]) => (
                              <span key={label} title={label} style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: has ? GREEN : '#e2e8f0', flexShrink: 0 }} />
                            ))}
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>
                          <span style={{ background: c.isActive ? '#f0fdf4' : '#fef2f2', color: c.isActive ? '#16a34a' : '#dc2626', borderRadius: 20, padding: '3px 10px', fontSize: '0.68rem', fontWeight: 800 }}>
                            {c.isActive ? '● Active' : '● Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ padding: '10px 14px', borderTop: '1px solid #f1f5f9', fontSize: '0.72rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
                <span>{rows.length} of {churches.length} churches shown</span>
                <span>Features: ● Members · ● Events · ● Attendance · ● First timers · ● Giving</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
