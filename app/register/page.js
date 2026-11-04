'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const NAV = '#1e3a5f';
const GOLD = '#f59e0b';

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const plan = params.get('plan'); // 'pro' or null
  const billing = params.get('billing') || 'monthly'; // 'monthly' | 'annual'
  const isPro = plan === 'pro';

  const [form, setForm] = useState({ name: '', slug: '', denomination: '', address: '', phone: '', adminEmail: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const handleName = (v) => { set('name', v); if (!form.slug || form.slug === slugify(form.name)) set('slug', slugify(v)); };

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setError(''); setLoading(true);
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, slug: form.slug, denomination: form.denomination, address: form.address, phone: form.phone, adminEmail: form.adminEmail, password: form.password, plan: isPro ? 'pro' : 'free', billing }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || 'Registration failed.'); setLoading(false); return; }
    if (data.stripeUrl) {
      window.location.href = data.stripeUrl;
    } else {
      router.push(`/${form.slug}/admin`);
    }
  };

  const inp = { padding: '11px 14px', border: '1.5px solid #dde3f0', borderRadius: 10, fontSize: '1rem', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' };
  const lbl = { fontSize: '0.85rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="fas fa-compass" style={{ color: NAV, fontSize: 16 }} />
        </div>
        <span style={{ fontWeight: 800, fontSize: '1.1rem', color: NAV }}>CHURCH<span style={{ color: GOLD }}>COMPASS</span></span>
      </div>

      <div style={{ background: '#fff', borderRadius: 16, padding: '36px 32px', maxWidth: 540, width: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: NAV, marginBottom: 4 }}>Register your church</h1>

        {isPro ? (
          <div style={{ background: 'linear-gradient(90deg, #1e3a5f 0%, #2d5282 100%)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <i className="fas fa-bolt" style={{ color: GOLD, marginTop: 2, flexShrink: 0 }} />
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.875rem' }}>
                Starting Pro — {billing === 'annual' ? '£90/year' : '14-day free trial'}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.78rem', marginTop: 2 }}>
                {billing === 'annual'
                  ? 'After creating your account you\'ll set up annual payment on the next step.'
                  : 'After creating your account you\'ll add a card — no charge for 14 days.'}
              </div>
            </div>
          </div>
        ) : (
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: 28 }}>Free plan available. No credit card needed.</p>
        )}

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={lbl}>Church name <span style={{ color: '#dc2626' }}>*</span></label>
            <input style={inp} value={form.name} onChange={e => handleName(e.target.value)} required placeholder="City of God Church" />
          </div>
          <div>
            <label style={lbl}>Your URL slug <span style={{ color: '#dc2626' }}>*</span></label>
            <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #dde3f0', borderRadius: 10, overflow: 'hidden' }}>
              <span style={{ padding: '11px 12px', background: '#f1f5f9', color: '#64748b', fontSize: '0.85rem', borderRight: '1px solid #dde3f0', whiteSpace: 'nowrap' }}>churchcompass.elmorilx.com/</span>
              <input style={{ ...inp, border: 'none', borderRadius: 0, outline: 'none' }} value={form.slug} onChange={e => set('slug', slugify(e.target.value))} required placeholder="city-of-god" />
            </div>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>Kiosk: churchcompass.elmorilx.com/{form.slug || 'your-slug'}/signin</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={lbl}>Denomination</label><input style={inp} value={form.denomination} onChange={e => set('denomination', e.target.value)} placeholder="e.g. Baptist" /></div>
            <div><label style={lbl}>Phone</label><input style={inp} value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
          </div>
          <div><label style={lbl}>Address</label><input style={inp} value={form.address} onChange={e => set('address', e.target.value)} /></div>

          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: 12 }}>ADMIN ACCOUNT</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div><label style={lbl}>Admin email <span style={{ color: '#dc2626' }}>*</span></label><input style={inp} type="email" value={form.adminEmail} onChange={e => set('adminEmail', e.target.value)} required /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={lbl}>Password <span style={{ color: '#dc2626' }}>*</span></label><input style={inp} type="password" value={form.password} onChange={e => set('password', e.target.value)} required /></div>
                <div><label style={lbl}>Confirm <span style={{ color: '#dc2626' }}>*</span></label><input style={inp} type="password" value={form.confirm} onChange={e => set('confirm', e.target.value)} required /></div>
              </div>
            </div>
          </div>

          {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: '0.875rem' }}>{error}</div>}

          <button type="submit" disabled={loading}
            style={{ background: loading ? '#94a3b8' : (isPro ? GOLD : NAV), color: isPro ? NAV : '#fff', border: 'none', borderRadius: 10, padding: '14px', fontWeight: 800, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading
              ? (isPro ? 'Creating account…' : 'Creating account…')
              : (isPro ? (billing === 'annual' ? 'Create account & set up payment →' : 'Create account & start free trial →') : 'Create Church Account')}
          </button>

          {isPro && (
            <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8', marginTop: -8 }}>
              <i className="fas fa-lock" style={{ marginRight: 4 }} />
              {billing === 'annual' ? 'Secure payment via Stripe. Cancel anytime.' : 'No charge until your 14-day trial ends. Cancel anytime.'}
            </p>
          )}
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.85rem', color: '#64748b' }}>
          Already registered? <a href="/" style={{ color: NAV, fontWeight: 600 }}>Find your church</a>
        </p>
        <p style={{ textAlign: 'center', marginTop: 12, fontSize: '0.78rem', color: '#94a3b8' }}>
          By registering you agree to our <a href="/terms" style={{ color: '#94a3b8' }}>Terms of Service</a> and <a href="/privacy" style={{ color: '#94a3b8' }}>Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}

export default function Register() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
