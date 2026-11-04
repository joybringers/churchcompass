'use client';
import { useRouter } from 'next/navigation';

const NAV = '#1e3a5f';
const GOLD = '#f59e0b';

export default function Landing() {
  const router = useRouter();
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        .cc-nav { padding: 14px 20px !important; }
        .cc-nav-logo-text { font-size: 1rem !important; }
        .cc-nav-btns { gap: 8px !important; }
        .cc-btn-register { display: none !important; }
        .cc-btn-signin { padding: 8px 14px !important; font-size: 0.85rem !important; }
        @media (min-width: 480px) {
          .cc-nav { padding: 16px 28px !important; }
          .cc-btn-register { display: inline-flex !important; }
          .cc-btn-signin { padding: 9px 18px !important; font-size: 0.9rem !important; }
        }
        @media (min-width: 640px) {
          .cc-nav { padding: 16px 32px !important; }
        }
        .cc-hero { padding: 60px 20px !important; }
        @media (min-width: 480px) { .cc-hero { padding: 80px 28px !important; } }
        @media (min-width: 640px) { .cc-hero { padding: 80px 32px !important; } }
      `}</style>
      <header className="cc-nav" style={{ background: NAV, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className="fas fa-compass" style={{ color: NAV, fontSize: 17 }} />
          </div>
          <span className="cc-nav-logo-text" style={{ color: '#fff', fontWeight: 800, letterSpacing: '0.05em' }}>
            CHURCH<span style={{ color: GOLD }}>COMPASS</span>
          </span>
        </div>
        <div className="cc-nav-btns" style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => router.push('/login')} className="cc-btn-signin"
            style={{ background: 'transparent', color: '#fff', border: '1.5px solid rgba(255,255,255,0.4)', borderRadius: 8, padding: '9px 20px', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
            Sign In
          </button>
          <button onClick={() => router.push('/register')} className="cc-btn-register"
            style={{ background: GOLD, color: NAV, border: 'none', borderRadius: 8, padding: '9px 20px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center' }}>
            Register Your Church
          </button>
        </div>
      </header>

      <section className="cc-hero" style={{ background: `linear-gradient(135deg, ${NAV} 0%, #2d5282 100%)`, textAlign: 'center', color: '#fff', flex: 1 }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, lineHeight: 1.15, marginBottom: 20 }}>
            Simple tools for growing churches
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.85, lineHeight: 1.7, marginBottom: 36 }}>
            Children's sign-in, attendance tracking, first-timer forms, member directory and event management — all in one place.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => router.push('/register')}
              style={{ background: GOLD, color: NAV, border: 'none', borderRadius: 10, padding: '14px 28px', fontWeight: 700, cursor: 'pointer', fontSize: '1rem' }}>
              Get Started Free
            </button>
            <button onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
              style={{ background: 'transparent', color: '#fff', border: '2px solid rgba(255,255,255,0.4)', borderRadius: 10, padding: '14px 28px', fontWeight: 600, cursor: 'pointer', fontSize: '1rem' }}>
              See Features
            </button>
            <button onClick={() => document.getElementById('pricing').scrollIntoView({ behavior: 'smooth' })}
              style={{ background: 'transparent', color: GOLD, border: '2px solid rgba(245,158,11,0.4)', borderRadius: 10, padding: '14px 28px', fontWeight: 600, cursor: 'pointer', fontSize: '1rem' }}>
              See Pricing
            </button>
          </div>
        </div>
      </section>

      <section id="features" style={{ background: '#fff', padding: 'clamp(40px, 8vw, 64px) clamp(16px, 5vw, 32px)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '1.75rem', fontWeight: 800, color: NAV, marginBottom: 8 }}>Everything in one platform</h2>
          <p style={{ textAlign: 'center', color: '#64748b', marginBottom: 48 }}>Built for churches of all sizes. Free plan available, no setup fee.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
            {[
              { icon: 'fa-door-open',   title: 'Check-in / out',      desc: 'Kiosk mode for children, adults and staff.' },
              { icon: 'fa-users',       title: 'Member directory',     desc: 'Profiles and member records.' },
              { icon: 'fa-user-plus',   title: 'First-timer forms',    desc: 'Digital welcome card with custom fields.' },
              { icon: 'fa-calendar-check', title: 'Events & services', desc: 'Schedule and track attendance per event.' },
              { icon: 'fa-chart-bar',   title: 'Attendance reports',   desc: 'Attendance trends. CSV export.' },
              { icon: 'fa-sliders',     title: 'Custom fields',        desc: 'Add any field to any form — your data, your way.' },
            ].map(f => (
              <div key={f.title} style={{ background: '#f8fafc', borderRadius: 12, padding: '24px 20px', borderTop: `3px solid ${GOLD}` }}>
                <i className={`fas ${f.icon}`} style={{ color: NAV, fontSize: 24, marginBottom: 12, display: 'block' }} />
                <div style={{ fontWeight: 700, color: NAV, marginBottom: 8 }}>{f.title}</div>
                <div style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ background: '#f8fafc', padding: 'clamp(40px, 8vw, 72px) clamp(16px, 5vw, 32px)' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '1.75rem', fontWeight: 800, color: NAV, marginBottom: 8 }}>Simple, transparent pricing</h2>
          <p style={{ textAlign: 'center', color: '#64748b', marginBottom: 48 }}>No hidden fees. Cancel any time.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
            {/* Free */}
            <div style={{ background: '#fff', borderRadius: 16, padding: '32px 28px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontWeight: 800, color: NAV, fontSize: '1.1rem', marginBottom: 4 }}>Free</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: NAV, lineHeight: 1, marginBottom: 4 }}>£0</div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: 24 }}>forever</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                {['Up to 100 members', '3 admin accounts', 'Children check-in', 'Attendance tracking', 'First-timer forms', 'Events management'].map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', color: '#374151' }}>
                    <i className="fas fa-check" style={{ color: '#16a34a', fontSize: 12, flexShrink: 0 }} />{f}
                  </li>
                ))}
              </ul>
              <button onClick={() => router.push('/register')}
                style={{ marginTop: 28, background: '#f1f5f9', color: NAV, border: 'none', borderRadius: 10, padding: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
                Get started free
              </button>
            </div>
            {/* Pro — highlighted */}
            <div style={{ background: NAV, borderRadius: 16, padding: '32px 28px', boxShadow: '0 4px 24px rgba(30,58,95,0.25)', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 16, right: 16, background: GOLD, color: NAV, fontSize: '0.65rem', fontWeight: 800, padding: '3px 10px', borderRadius: 20, letterSpacing: '0.06em' }}>MOST POPULAR</div>
              <div style={{ fontWeight: 800, color: '#fff', fontSize: '1.1rem', marginBottom: 4 }}>Pro</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: GOLD, lineHeight: 1, marginBottom: 4 }}>£9</div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>per month</div>
              <div style={{ fontSize: '0.75rem', color: GOLD, fontWeight: 600, marginBottom: 24 }}>14-day free trial, no card required</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                {['Up to 500 members', 'Unlimited admin accounts', 'Everything in Free', 'CSV export', 'Custom fields', 'Groups & teams', 'Guard (DBS + incidents)', 'Priority support'].map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', color: 'rgba(255,255,255,0.85)' }}>
                    <i className="fas fa-check" style={{ color: GOLD, fontSize: 12, flexShrink: 0 }} />{f}
                  </li>
                ))}
              </ul>
              <button onClick={() => router.push('/register?plan=pro&billing=monthly')}
                style={{ marginTop: 28, background: GOLD, color: NAV, border: 'none', borderRadius: 10, padding: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
                Start 14-day free trial
              </button>
              <button onClick={() => router.push('/pricing')}
                style={{ marginTop: 8, background: 'transparent', color: 'rgba(255,255,255,0.5)', border: 'none', padding: '4px', fontWeight: 600, cursor: 'pointer', fontSize: '0.75rem' }}>
                Save with annual billing (£90/yr) →
              </button>
            </div>
            {/* Custom */}
            <div style={{ background: '#fff', borderRadius: 16, padding: '32px 28px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontWeight: 800, color: NAV, fontSize: '1.1rem', marginBottom: 4 }}>Custom</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: NAV, lineHeight: 1, marginBottom: 4 }}>Talk</div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: 24 }}>to us</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                {['500+ members', 'Multi-site / network', 'Everything in Pro', 'White-label option', 'Dedicated onboarding', 'Custom integrations'].map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', color: '#374151' }}>
                    <i className="fas fa-check" style={{ color: '#16a34a', fontSize: 12, flexShrink: 0 }} />{f}
                  </li>
                ))}
              </ul>
              <a href="mailto:hello@elmorilx.com"
                style={{ marginTop: 28, background: '#f1f5f9', color: NAV, border: 'none', borderRadius: 10, padding: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', textDecoration: 'none', textAlign: 'center', display: 'block' }}>
                Contact us
              </a>
            </div>
          </div>
        </div>
      </section>

      <section style={{ background: NAV, padding: 'clamp(32px, 6vw, 40px) clamp(16px, 5vw, 32px)', textAlign: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 20 }}>Already have an account?</p>
        <button onClick={() => router.push('/login')}
          style={{ background: GOLD, color: NAV, border: 'none', borderRadius: 10, padding: '14px 36px', fontWeight: 700, cursor: 'pointer', fontSize: '1rem' }}>
          Sign In to Your Church
        </button>
      </section>

      <footer style={{ background: '#0f1f35', padding: '20px 32px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
        ChurchCompass — church management · by Elmoril · elmorilx.com
        <span style={{ margin: '0 12px' }}>·</span>
        <button onClick={() => router.push('/privacy')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}>Privacy Policy</button>
        <span style={{ margin: '0 12px' }}>·</span>
        <button onClick={() => router.push('/terms')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}>Terms of Service</button>
      </footer>
    </div>
  );
}
