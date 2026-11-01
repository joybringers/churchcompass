'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const NAV = '#1e3a5f';
const GOLD = '#f59e0b';

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await fetch('/api/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setDone(true);
    } catch {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  const inp = { padding: '11px 14px', border: '1.5px solid #dde3f0', borderRadius: 10, fontSize: '1rem', fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box' };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '36px 32px', maxWidth: 400, width: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="fas fa-compass" style={{ color: NAV, fontSize: 18 }} />
          </div>
          <span style={{ fontWeight: 800, color: NAV, fontSize: '0.95rem' }}>CHURCH<span style={{ color: GOLD }}>COMPASS</span></span>
        </div>

        {done ? (
          <>
            <div style={{ fontSize: 48, textAlign: 'center', marginBottom: 16 }}>📧</div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: NAV, marginBottom: 8, textAlign: 'center' }}>Check your email</h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6, textAlign: 'center', marginBottom: 24 }}>
              If that email is registered, we've sent a password reset link. Check your inbox (and spam folder).
            </p>
            <button onClick={() => router.push('/')}
              style={{ width: '100%', background: NAV, color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>
              Back to home
            </button>
          </>
        ) : (
          <>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: NAV, marginBottom: 6 }}>Forgot your password?</h2>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: 24, lineHeight: 1.6 }}>
              Enter the email address you registered with and we'll send you a link to reset your password.
            </p>
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input type="email" placeholder="Admin email address" required value={email} onChange={e => setEmail(e.target.value)} style={inp} />
              {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px', color: '#dc2626', fontSize: '0.85rem' }}>{error}</div>}
              <button type="submit" disabled={loading}
                style={{ background: loading ? '#94a3b8' : NAV, color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontWeight: 700, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
              <button type="button" onClick={() => router.back()}
                style={{ background: 'transparent', color: '#64748b', border: 'none', fontSize: '0.875rem', cursor: 'pointer', padding: '4px' }}>
                ← Back to login
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
