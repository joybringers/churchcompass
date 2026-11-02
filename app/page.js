'use client';
import { useRouter } from 'next/navigation';

const NAV = '#1e3a5f';
const GOLD = '#f59e0b';

export default function Landing() {
  const router = useRouter();
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ background: NAV, padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="fas fa-compass" style={{ color: NAV, fontSize: 18 }} />
          </div>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem', letterSpacing: '0.05em' }}>
            CHURCH<span style={{ color: GOLD }}>COMPASS</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => router.push('/login')}
            style={{ background: 'transparent', color: '#fff', border: '1.5px solid rgba(255,255,255,0.4)', borderRadius: 8, padding: '9px 20px', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>
            Sign In
          </button>
          <button onClick={() => router.push('/register')}
            style={{ background: GOLD, color: NAV, border: 'none', borderRadius: 8, padding: '9px 20px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
            Register Your Church
          </button>
        </div>
      </header>

      <section style={{ background: `linear-gradient(135deg, ${NAV} 0%, #2d5282 100%)`, padding: '80px 32px', textAlign: 'center', color: '#fff', flex: 1 }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ display: 'inline-block', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: 20, padding: '6px 16px', fontSize: '0.8rem', color: GOLD, fontWeight: 600, marginBottom: 24, letterSpacing: '0.06em' }}>
            FREE PLAN AVAILABLE
          </div>
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
          </div>
        </div>
      </section>

      <section id="features" style={{ background: '#fff', padding: '64px 32px' }}>
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

      <section style={{ background: NAV, padding: '40px 32px', textAlign: 'center' }}>
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
      </footer>
    </div>
  );
}
