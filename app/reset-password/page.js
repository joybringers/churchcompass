'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const NAV = '#1e3a5f';
const GOLD = '#f59e0b';

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) setError('Invalid reset link. Please request a new one.');
  }, [token]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/password-reset', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Reset failed.'); setLoading(false); return; }
      setDone(true);
      setTimeout(() => router.push('/'), 3000);
    } catch {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  const inp = { padding: '11px 14px', border: '1.5px solid #dde3f0', borderRadius: 10, fontSize: '1rem', fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box' };

  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: '36px 32px', maxWidth: 400, width: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="fas fa-compass" style={{ color: NAV, fontSize: 18 }} />
        </div>
        <span style={{ fontWeight: 800, color: NAV, fontSize: '0.95rem' }}>CHURCH<span style={{ color: GOLD }}>COMPASS</span></span>
      </div>

      {done ? (
        <>
          <div style={{ fontSize: 48, textAlign: 'center', marginBottom: 16 }}>✅</div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: NAV, marginBottom: 8, textAlign: 'center' }}>Password updated!</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', textAlign: 'center' }}>You can now log in with your new password. Redirecting…</p>
        </>
      ) : (
        <>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: NAV, marginBottom: 6 }}>Set a new password</h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: 24 }}>Choose a strong password for your ChurchCompass account.</p>
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input type="password" placeholder="New password (min 8 characters)" required value={password} onChange={e => setPassword(e.target.value)} style={inp} />
            <input type="password" placeholder="Confirm new password" required value={confirm} onChange={e => setConfirm(e.target.value)} style={inp} />
            {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px', color: '#dc2626', fontSize: '0.85rem' }}>{error}</div>}
            <button type="submit" disabled={loading || !token}
              style={{ background: loading || !token ? '#94a3b8' : NAV, color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontWeight: 700, fontSize: '1rem', cursor: loading || !token ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default function ResetPassword() {
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <Suspense fallback={<p style={{ color: '#64748b' }}>Loading…</p>}>
        <ResetForm />
      </Suspense>
    </div>
  );
}
