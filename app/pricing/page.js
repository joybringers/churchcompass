'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const NAV = '#1e3a5f';
const GOLD = '#f59e0b';

const FREE_FEATURES = [
  'Up to 100 members',
  'Events & attendance tracking',
  'First-timer forms & follow-up',
  'Children check-in kiosk',
  'Self-service event check-in',
  'Basic reporting',
  '1 admin account',
];

const PRO_FEATURES = [
  'Up to 500 members',
  'Unlimited admin accounts',
  'Everything in Free',
  'CSV export',
  'Custom fields',
  'Groups & teams',
  'Guard (DBS + incidents)',
  'Priority support',
];

const CUSTOM_FEATURES = [
  '500+ members',
  'Multi-site / network',
  'Everything in Pro',
  'White-label option',
  'Dedicated onboarding',
  'Custom integrations',
];

function Check({ color = '#16a34a' }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
      <circle cx="9" cy="9" r="9" fill={color + '20'} />
      <path d="M5 9.5l3 3 5-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ContactModal({ onClose }) {
  const [form, setForm] = useState({ name: '', churchName: '', email: '', message: '' });
  const [status, setStatus] = useState('idle'); // idle | sending | done | error
  const [errorMsg, setErrorMsg] = useState('');

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setStatus('sending');
    setErrorMsg('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const j = await res.json();
      if (!res.ok) { setErrorMsg(j.error || 'Something went wrong.'); setStatus('error'); return; }
      setStatus('done');
    } catch {
      setErrorMsg('Network error. Please try again.');
      setStatus('error');
    }
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0',
    fontSize: '0.9rem', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none',
    color: '#1e293b', background: '#fff',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '36px 32px', maxWidth: 480, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#94a3b8', lineHeight: 1 }}>×</button>

        {status === 'done' ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <h3 style={{ color: NAV, fontWeight: 800, fontSize: '1.2rem', marginBottom: 8 }}>Message sent!</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6 }}>We'll get back to you within 1–2 business days. Check your inbox for a confirmation.</p>
            <button onClick={onClose} style={{ marginTop: 24, padding: '11px 28px', borderRadius: 10, background: NAV, color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'inherit' }}>Close</button>
          </div>
        ) : (
          <>
            <h2 style={{ color: NAV, fontWeight: 800, fontSize: '1.3rem', marginBottom: 4 }}>Talk to us about Custom</h2>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 24 }}>Tell us about your church or network and we'll be in touch.</p>
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: NAV, marginBottom: 5 }}>Your name *</label>
                <input style={inputStyle} value={form.name} onChange={set('name')} required placeholder="John Smith" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: NAV, marginBottom: 5 }}>Church / organisation name</label>
                <input style={inputStyle} value={form.churchName} onChange={set('churchName')} placeholder="City Life Church" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: NAV, marginBottom: 5 }}>Your email *</label>
                <input style={inputStyle} type="email" value={form.email} onChange={set('email')} required placeholder="john@citychurch.org" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: NAV, marginBottom: 5 }}>Message *</label>
                <textarea style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }} value={form.message} onChange={set('message')} required placeholder="Tell us about your church — size, locations, what you need..." />
              </div>
              {status === 'error' && <p style={{ color: '#ef4444', fontSize: '0.85rem', margin: 0 }}>{errorMsg}</p>}
              <button type="submit" disabled={status === 'sending'}
                style={{ padding: '13px', borderRadius: 10, background: NAV, color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.95rem', cursor: status === 'sending' ? 'not-allowed' : 'pointer', opacity: status === 'sending' ? 0.7 : 1, fontFamily: 'inherit' }}>
                {status === 'sending' ? 'Sending…' : 'Send message'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function Pricing() {
  const [billing, setBilling] = useState('monthly');
  const [showContact, setShowContact] = useState(false);
  const [isNigeria, setIsNigeria] = useState(false);
  const isAnnual = billing === 'annual';
  const router = useRouter();

  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setIsNigeria(tz === 'Africa/Lagos');
    } catch {}
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif', display: 'flex', flexDirection: 'column' }}>
      {showContact && <ContactModal onClose={() => setShowContact(false)} />}

      {/* Nav */}
      <div style={{ background: NAV, padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div onClick={() => router.push('/')} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L8 8H2l4.5 3.5L4 18l8-5 8 5-2.5-6.5L22 8h-6L12 2z" fill={NAV} />
            </svg>
          </div>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: '0.95rem' }}>CHURCH<span style={{ color: GOLD }}>COMPASS</span></span>
        </div>
        <button onClick={() => router.push('/')} style={{ background: 'transparent', color: 'rgba(255,255,255,0.7)', border: 'none', fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit' }}>← Home</button>
      </div>

      <div style={{ flex: 1, maxWidth: 1060, margin: '0 auto', padding: '64px 24px 80px', width: '100%' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: NAV, marginBottom: 12 }}>
            Simple, transparent pricing
          </h1>
          <p style={{ color: '#64748b', fontSize: '1.1rem', maxWidth: 520, margin: '0 auto 28px' }}>
            Start free. Upgrade when your church is ready to grow.
          </p>

          {/* Billing toggle */}
          <div style={{ display: 'inline-flex', background: '#e2e8f0', borderRadius: 12, padding: 4, gap: 2 }}>
            <button onClick={() => setBilling('monthly')}
              style={{ padding: '8px 20px', borderRadius: 10, border: 'none', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', background: !isAnnual ? '#fff' : 'transparent', color: !isAnnual ? NAV : '#64748b', boxShadow: !isAnnual ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s', fontFamily: 'inherit' }}>
              Monthly
            </button>
            <button onClick={() => setBilling('annual')}
              style={{ padding: '8px 20px', borderRadius: 10, border: 'none', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', background: isAnnual ? '#fff' : 'transparent', color: isAnnual ? NAV : '#64748b', boxShadow: isAnnual ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
              Annual
              <span style={{ background: '#dcfce7', color: '#16a34a', fontSize: '0.65rem', fontWeight: 800, padding: '2px 6px', borderRadius: 20 }}>SAVE 17%</span>
            </button>
          </div>
          {isAnnual && (
            <p style={{ color: '#16a34a', fontSize: '0.8rem', fontWeight: 600, marginTop: 10 }}>
              {isNigeria ? '2 months free — ₦20,000/year instead of ₦24,000' : '2 months free — £90/year instead of £108'}
            </p>
          )}
        </div>

        {/* Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, alignItems: 'start' }}>

          {/* Free */}
          <div style={{ background: '#fff', borderRadius: 20, padding: '32px 28px', boxShadow: '0 1px 12px rgba(0,0,0,0.07)', border: '2px solid #f1f5f9' }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontWeight: 800, color: NAV, fontSize: '1.1rem', marginBottom: 4 }}>Free</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontSize: '2.8rem', fontWeight: 900, color: NAV }}>£0</span>
                <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>/month</span>
              </div>
              <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 8 }}>Perfect for small or new churches getting started.</p>
            </div>
            <a href="/register" style={{ display: 'block', textAlign: 'center', padding: '13px', borderRadius: 12, background: '#f1f5f9', color: NAV, fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none', marginBottom: 28 }}>
              Get started free
            </a>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {FREE_FEATURES.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '0.875rem', color: '#374151' }}>
                  <Check color="#16a34a" />{f}
                </div>
              ))}
            </div>
          </div>

          {/* Pro */}
          <div style={{ background: NAV, borderRadius: 20, padding: '32px 28px', boxShadow: '0 4px 24px rgba(30,58,95,0.25)', border: '2px solid ' + NAV, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 16, right: 16, background: GOLD, color: NAV, fontSize: '0.72rem', fontWeight: 800, padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Most popular
            </div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontWeight: 800, color: GOLD, fontSize: '1.1rem', marginBottom: 4 }}>Pro</div>
              {isNigeria ? (
              isAnnual ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: '2.8rem', fontWeight: 900, color: '#fff' }}>₦20,000</span>
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>/year</span>
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', textDecoration: 'line-through', marginTop: 2 }}>₦24,000/year</div>
                  <div style={{ fontSize: '0.78rem', color: GOLD, fontWeight: 600, marginTop: 4 }}>₦1,667/month · 2 months free</div>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: '2.8rem', fontWeight: 900, color: '#fff' }}>₦2,000</span>
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>/month</span>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', marginTop: 8 }}>For growing churches that need the full toolkit.</p>
                  <div style={{ fontSize: '0.78rem', color: GOLD, fontWeight: 600, marginTop: 4 }}>Paid via Paystack · Cancel anytime</div>
                </>
              )
            ) : isAnnual ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: '2.8rem', fontWeight: 900, color: '#fff' }}>£90</span>
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>/year</span>
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', textDecoration: 'line-through', marginTop: 2 }}>£108/year</div>
                  <div style={{ fontSize: '0.78rem', color: GOLD, fontWeight: 600, marginTop: 4 }}>£7.50/month · 2 months free</div>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: '2.8rem', fontWeight: 900, color: '#fff' }}>£9</span>
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>/month</span>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', marginTop: 8 }}>For growing churches that need the full toolkit.</p>
                  <div style={{ fontSize: '0.78rem', color: GOLD, fontWeight: 600, marginTop: 4 }}>14-day free trial — no card required</div>
                </>
              )}
            </div>
            <a href={`/register?plan=pro&billing=${billing}`}
              style={{ display: 'block', textAlign: 'center', padding: '13px', borderRadius: 12, background: GOLD, color: NAV, fontWeight: 800, fontSize: '0.95rem', textDecoration: 'none', marginBottom: 28 }}>
              {isNigeria
                ? (isAnnual ? 'Get Pro — ₦20,000/year' : 'Get Pro — ₦2,000/month')
                : (isAnnual ? 'Get Pro — £90/year' : 'Start 14-day free trial')}
            </a>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {PRO_FEATURES.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '0.875rem', color: 'rgba(255,255,255,0.9)' }}>
                  <Check color={GOLD} />{f}
                </div>
              ))}
            </div>
          </div>

          {/* Custom */}
          <div style={{ background: '#fff', borderRadius: 20, padding: '32px 28px', boxShadow: '0 1px 12px rgba(0,0,0,0.07)', border: '2px solid #f1f5f9' }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontWeight: 800, color: NAV, fontSize: '1.1rem', marginBottom: 4 }}>Custom</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontSize: '2.8rem', fontWeight: 900, color: NAV }}>Talk</span>
              </div>
              <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: 2 }}>to us</div>
              <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 8 }}>For denominations and multi-site church networks.</p>
            </div>
            <button onClick={() => setShowContact(true)}
              style={{ display: 'block', width: '100%', textAlign: 'center', padding: '13px', borderRadius: 12, background: '#f1f5f9', color: NAV, fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none', marginBottom: 28, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              Contact us
            </button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {CUSTOM_FEATURES.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '0.875rem', color: '#374151' }}>
                  <Check color="#6366f1" />{f}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FAQ strip */}
        <div style={{ marginTop: 64, background: '#fff', borderRadius: 16, padding: '32px 28px', boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: NAV, marginBottom: 24 }}>Common questions</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
            {(isNigeria ? [
              { q: 'Do I need a card to start?', a: 'No. The Free plan is free forever — no card required. For Pro, you pay via Paystack (cards, bank transfers, USSD) after signup.' },
              { q: 'Can I upgrade at any time?', a: 'Yes. Upgrade from your admin settings and your data carries over instantly.' },
              { q: 'How do I pay?', a: 'Pro subscriptions for Nigerian churches are billed in Naira (₦) via Paystack. We accept debit cards, bank transfers, and USSD.' },
              { q: "What's the difference between monthly and annual?", a: "Annual billing is ₦20,000/year — that's 2 months free compared to paying ₦2,000 each month. Payment is taken upfront." },
              { q: 'How do I cancel?', a: 'Email admin@elmorilx.com and we\'ll cancel your subscription within 24 hours.' },
              { q: 'What happens when I hit 100 members on Free?', a: "You can still use the system — you just won't be able to add more members until you upgrade to Pro." },
            ] : [
              { q: 'Do I need a credit card to start?', a: 'No. The Free plan is free forever — no card required. For the Pro monthly trial, you add your card after signup but nothing is charged for 14 days.' },
              { q: 'Can I upgrade at any time?', a: 'Yes. Upgrade from your admin settings and your data carries over instantly.' },
              { q: 'What happens after the 14-day trial?', a: "Your card is charged £9/month automatically. Cancel any time before the trial ends and you won't be charged." },
              { q: "What's the difference between monthly and annual?", a: "Annual billing is £90/year — that's 2 months free compared to paying monthly. Payment is taken upfront for the year." },
              { q: 'Can I switch between monthly and annual?', a: 'Yes. Contact us and we can switch your billing at the next renewal with no penalty.' },
              { q: 'What happens when I hit 100 members on Free?', a: "You can still use the system — you just won't be able to add more members until you upgrade to Pro." },
            ]).map(({ q, a }) => (
              <div key={q}>
                <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem', marginBottom: 6 }}>{q}</div>
                <div style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: 1.6 }}>{a}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background: '#0f1f35', padding: '20px 32px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
        ChurchCompass — church management · by Elmoril · elmorilx.com
        <span style={{ margin: '0 12px' }}>·</span>
        <button onClick={() => router.push('/privacy')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit' }}>Privacy Policy</button>
        <span style={{ margin: '0 12px' }}>·</span>
        <button onClick={() => router.push('/terms')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit' }}>Terms of Service</button>
      </footer>
    </div>
  );
}
