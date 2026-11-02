'use client';
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
  'Everything in Free',
  'CSV export for all data',
  'Custom form fields',
  'Advanced reporting & analytics',
  'Multiple admin accounts',
  'Priority support',
];

const CUSTOM_FEATURES = [
  'Everything in Pro',
  'Dedicated onboarding',
  'Custom integrations',
  'White-label options',
  'SLA & data agreements',
  'Invoiced billing',
];

function Check({ color = '#16a34a' }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
      <circle cx="9" cy="9" r="9" fill={color + '20'} />
      <path d="M5 9.5l3 3 5-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Pricing() {
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Nav */}
      <div style={{ background: NAV, padding: '16px 32px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L8 8H2l4.5 3.5L4 18l8-5 8 5-2.5-6.5L22 8h-6L12 2z" fill={NAV} />
          </svg>
        </div>
        <span style={{ color: '#fff', fontWeight: 800, fontSize: '0.95rem' }}>CHURCH<span style={{ color: GOLD }}>COMPASS</span></span>
      </div>

      <div style={{ maxWidth: 1060, margin: '0 auto', padding: '64px 24px 80px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: NAV, marginBottom: 12 }}>
            Simple, transparent pricing
          </h1>
          <p style={{ color: '#64748b', fontSize: '1.1rem', maxWidth: 520, margin: '0 auto' }}>
            Start free. Upgrade when your church is ready to grow.
          </p>
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
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontSize: '2.8rem', fontWeight: 900, color: '#fff' }}>£9</span>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>/month</span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', marginTop: 8 }}>For growing churches that need the full toolkit.</p>
            </div>
            <a href="/register?plan=pro" style={{ display: 'block', textAlign: 'center', padding: '13px', borderRadius: 12, background: GOLD, color: NAV, fontWeight: 800, fontSize: '0.95rem', textDecoration: 'none', marginBottom: 28 }}>
              Start Pro
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
                <span style={{ fontSize: '2.8rem', fontWeight: 900, color: NAV }}>Custom</span>
              </div>
              <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 8 }}>For denominations and multi-site church networks.</p>
            </div>
            <a href="mailto:hello@churchcompass.app" style={{ display: 'block', textAlign: 'center', padding: '13px', borderRadius: 12, background: '#f1f5f9', color: NAV, fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none', marginBottom: 28 }}>
              Contact us
            </a>
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
            {[
              { q: 'Do I need a credit card to start?', a: 'No. The Free plan is free forever — no card required.' },
              { q: 'Can I upgrade at any time?', a: 'Yes. Upgrade from your admin settings and your data carries over.' },
              { q: 'What happens when I hit 100 members on Free?', a: "You can still use the system — you just won't be able to add more members until you upgrade to Pro." },
              { q: 'Is there an annual discount?', a: 'Annual billing is coming soon with 2 months free. Contact us for early access.' },
            ].map(({ q, a }) => (
              <div key={q}>
                <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem', marginBottom: 6 }}>{q}</div>
                <div style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: 1.6 }}>{a}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
