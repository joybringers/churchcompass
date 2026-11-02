'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const NAV = '#1e3a5f';
const GOLD = '#f59e0b';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const inp = { padding: '11px 14px', border: '1.5px solid #dde3f0', borderRadius: 10, fontSize: '1rem', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' };

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || 'Sign in failed.'); setLoading(false); return; }
    try {
      sessionStorage.setItem(`cc_session_${data.slug}`, JSON.stringify({ token: data.token, church: data.church }));
    } catch {}
    router.push(`/${data.slug}/admin`);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, cursor: 'pointer' }} onClick={() => router.push('/')}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="fas fa-compass" style={{ color: NAV, fontSize: 16 }} />
        </div>
        <span style={{ fontWeight: 800, fontSize: '1.1rem', color: NAV }}>CHURCH<span style={{ color: GOLD }}>COMPASS</span></span>
      </div>

      <div style={{ background: '#fff', borderRadius: 16, padding: '36px 32px', maxWidth: 440, width: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: NAV, marginBottom: 4 }}>Sign in</h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: 28 }}>Access your church admin dashboard.</p>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Email address</label>
            <input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" placeholder="you@example.com" />
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Password</label>
            <input style={inp} type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
          </div>

          {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: '0.875rem' }}>{error}</div>}

          <button type="submit" disabled={loading}
            style={{ background: loading ? '#94a3b8' : NAV, color: '#fff', border: 'none', borderRadius: 10, padding: '14px', fontWeight: 700, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button onClick={() => router.push('/forgot-password')}
            style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}>
            Forgot password?
          </button>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.85rem', color: '#64748b' }}>
          Not registered? <button onClick={() => router.push('/register')} style={{ background: 'none', border: 'none', color: NAV, fontWeight: 600, cursor: 'pointer', padding: 0, fontSize: '0.85rem' }}>Register your church</button>
        </p>
      </div>
    </div>
  );
}
