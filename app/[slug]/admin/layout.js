'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';

const NAV = '#1e3a5f';
const GOLD = '#f59e0b';

export const CC = createContext(null);
export function useCC() { return useContext(CC); }

const navItems = [
  { label: 'Dashboard',    icon: 'fa-gauge-high',    path: '' },
  { label: 'Members',      icon: 'fa-users',          path: '/members' },
  { label: 'Events',       icon: 'fa-calendar-days',  path: '/events' },
  { label: 'Attendance',   icon: 'fa-clipboard-list', path: '/attendance' },
  { label: 'Children',     icon: 'fa-child',          path: '/children' },
  { label: 'First Timers', icon: 'fa-user-plus',      path: '/first-timers' },
  { label: 'Reports',      icon: 'fa-chart-bar',      path: '/reports' },
  { label: 'Settings',     icon: 'fa-gear',           path: '/settings' },
];

export default function AdminLayout({ children }) {
  const { slug } = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const [church, setChurch] = useState(null);
  const [token, setToken] = useState(null);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem(`cc_token_${slug}`);
    if (stored) setToken(stored);
    fetch(`/api/churches?slug=${slug}`).then(r => r.json()).then(d => { setChurch(d.church || null); setAuthChecked(true); });
  }, [slug]);

  const login = async (e) => {
    e.preventDefault();
    setLoginLoading(true); setLoginError('');
    const res = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'login', slug, email: loginForm.email, password: loginForm.password }) });
    const data = await res.json();
    if (!res.ok) { setLoginError(data.error || 'Login failed.'); setLoginLoading(false); return; }
    sessionStorage.setItem(`cc_token_${slug}`, data.token);
    setToken(data.token);
    setLoginLoading(false);
  };

  const logout = () => { sessionStorage.removeItem(`cc_token_${slug}`); setToken(null); };

  if (!authChecked) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#64748b' }}>Loading…</p>
    </div>
  );

  if (!church) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#dc2626' }}>Church "{slug}" not found.</p>
    </div>
  );

  if (!token) return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '36px 32px', maxWidth: 400, width: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="fas fa-compass" style={{ color: NAV, fontSize: 18 }} />
          </div>
          <div>
            <div style={{ fontWeight: 800, color: NAV, fontSize: '0.95rem' }}>CHURCH<span style={{ color: GOLD }}>COMPASS</span></div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{church.name}</div>
          </div>
        </div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: NAV, marginBottom: 4 }}>Admin login</h2>
        <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: 24 }}>Enter your credentials to manage {church.name}.</p>
        <form onSubmit={login} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input type="email" placeholder="Admin email" required value={loginForm.email} onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
            style={{ padding: '11px 14px', border: '1.5px solid #dde3f0', borderRadius: 10, fontSize: '1rem', fontFamily: 'inherit', outline: 'none' }} />
          <input type="password" placeholder="Password" required value={loginForm.password} onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
            style={{ padding: '11px 14px', border: '1.5px solid #dde3f0', borderRadius: 10, fontSize: '1rem', fontFamily: 'inherit', outline: 'none' }} />
          {loginError && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px', color: '#dc2626', fontSize: '0.85rem' }}>{loginError}</div>}
          <button type="submit" disabled={loginLoading}
            style={{ background: loginLoading ? '#94a3b8' : NAV, color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontWeight: 700, fontSize: '1rem', cursor: loginLoading ? 'not-allowed' : 'pointer' }}>
            {loginLoading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );

  const adminBase = `/${slug}/admin`;
  const currentPath = pathname.replace(adminBase, '') || '';

  return (
    <CC.Provider value={{ church, token, slug }}>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9' }}>
        {/* Sidebar */}
        <aside style={{ width: 220, background: NAV, display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}>
          <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fas fa-compass" style={{ color: NAV, fontSize: 14 }} />
              </div>
              <span style={{ color: '#fff', fontWeight: 800, fontSize: '0.85rem' }}>CHURCH<span style={{ color: GOLD }}>COMPASS</span></span>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', marginTop: 6, paddingLeft: 2 }}>{church.name}</div>
          </div>
          <nav style={{ flex: 1, padding: '12px 8px' }}>
            {navItems.map(item => {
              const active = currentPath === item.path || (item.path && currentPath.startsWith(item.path));
              return (
                <div key={item.path} onClick={() => router.push(adminBase + item.path)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, marginBottom: 2, cursor: 'pointer', background: active ? 'rgba(245,158,11,0.15)' : 'transparent', color: active ? GOLD : 'rgba(255,255,255,0.7)', fontWeight: active ? 700 : 400, fontSize: '0.875rem', transition: 'background 0.15s' }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
                  <i className={`fas ${item.icon}`} style={{ width: 18, textAlign: 'center' }} />
                  {item.label}
                </div>
              );
            })}
          </nav>
          <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <div onClick={() => window.open(`/${slug}/signin`, '_blank')}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', marginBottom: 4 }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <i className="fas fa-desktop" style={{ width: 18, textAlign: 'center' }} />Open Kiosk
            </div>
            <div onClick={logout}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <i className="fas fa-right-from-bracket" style={{ width: 18, textAlign: 'center' }} />Log out
            </div>
          </div>
        </aside>
        {/* Main */}
        <main style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </CC.Provider>
  );
}
