'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

const NAV = '#1e3a5f';
const GOLD = '#f59e0b';

const TYPE_COLORS = {
  service: '#3b82f6',
  meeting: GOLD,
  event: '#22c55e',
  youth: '#8b5cf6',
  kids: '#f97316',
};
const TYPE_LABELS = {
  service: 'Sunday Service',
  meeting: 'Meeting',
  event: 'Event',
  youth: 'Youth',
  kids: 'Kids',
};

function fmtDate(d) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

function fmtTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hour = parseInt(h);
  return `${hour > 12 ? hour - 12 : hour || 12}:${m} ${hour >= 12 ? 'pm' : 'am'}`;
}

function initials(name) {
  if (!name) return 'CC';
  return name.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

export default function ChurchProfile() {
  const { slug } = useParams();
  const router = useRouter();
  const [church, setChurch] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    Promise.all([
      fetch(`/api/churches?slug=${slug}`).then(r => r.json()),
      fetch(`/api/events/public?slug=${slug}`).then(r => r.json()).catch(() => ({ events: [] })),
    ]).then(([cd, ed]) => {
      setChurch(cd.church || null);
      setEvents((ed.events || []).filter(e => e.event_date >= new Date().toISOString().split('T')[0]).slice(0, 6));
      setLoading(false);
    });
  }, [slug]);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Loading…</div>
    </div>
  );

  if (!church) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: 24 }}>
      <div style={{ fontSize: '3rem', marginBottom: 12 }}>🔍</div>
      <h1 style={{ color: NAV, fontWeight: 800, marginBottom: 8 }}>Church not found</h1>
      <p style={{ color: '#64748b' }}>The link "{slug}" doesn't match any church in ChurchCompass.</p>
      <a href="/" style={{ marginTop: 20, color: NAV, fontWeight: 600, fontSize: '0.875rem' }}>← Back to ChurchCompass</a>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Header strip */}
      <div style={{ background: NAV, padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="fas fa-compass" style={{ color: NAV, fontSize: 12 }} />
          </div>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.78rem', fontWeight: 600 }}>Powered by CHURCH<span style={{ color: GOLD }}>COMPASS</span></span>
        </div>
        <button onClick={() => router.push(`/${slug}/admin`)}
          style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'inherit' }}>
          Admin login
        </button>
      </div>

      {/* Hero */}
      <div style={{ background: `linear-gradient(135deg, ${NAV} 0%, #2d4f7a 100%)`, padding: '48px 24px 40px', textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '1.6rem', fontWeight: 900, color: NAV }}>
          {initials(church.name)}
        </div>
        <h1 style={{ color: '#fff', fontSize: '2rem', fontWeight: 900, marginBottom: 6, lineHeight: 1.2 }}>{church.name}</h1>
        {church.denomination && (
          <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.9rem', marginBottom: 10 }}>{church.denomination}</div>
        )}
        {church.address && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
            <i className="fas fa-location-dot" style={{ color: GOLD }} />
            <span>{church.address}</span>
          </div>
        )}
        {church.website && (
          <div style={{ marginTop: 6 }}>
            <a href={church.website.startsWith('http') ? church.website : `https://${church.website}`} target="_blank" rel="noreferrer"
              style={{ color: GOLD, fontSize: '0.85rem', textDecoration: 'none', fontWeight: 600 }}>
              <i className="fas fa-globe" style={{ marginRight: 5 }} />{church.website.replace(/^https?:\/\//, '')}
            </a>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '28px 20px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 32 }}>
          <button onClick={() => router.push(`/${slug}/signin`)}
            style={{ background: NAV, color: '#fff', border: 'none', borderRadius: 14, padding: '18px 16px', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center' }}>
            <i className="fas fa-clipboard-check" style={{ fontSize: 22, display: 'block', marginBottom: 6 }} />
            <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>Sign in</div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>Attendance kiosk</div>
          </button>
          <button onClick={() => router.push(`/${slug}/first-timer`)}
            style={{ background: GOLD, color: NAV, border: 'none', borderRadius: 14, padding: '18px 16px', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center' }}>
            <i className="fas fa-hand-wave" style={{ fontSize: 22, display: 'block', marginBottom: 6 }} />
            <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>New here?</div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(30,58,95,0.65)', marginTop: 2 }}>Register your visit</div>
          </button>
        </div>

        {/* Contact info */}
        {church.phone && (
          <div style={{ background: '#fff', borderRadius: 16, padding: '18px 20px', marginBottom: 20, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ fontWeight: 800, color: NAV, fontSize: '0.9rem', marginBottom: 12 }}>Get in touch</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className="fas fa-phone" style={{ color: '#0369a1', fontSize: 13 }} />
              </div>
              <span style={{ color: '#374151', fontSize: '0.9rem' }}>{church.phone}</span>
            </div>
          </div>
        )}

        {/* Upcoming events */}
        {events.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontWeight: 800, color: NAV, fontSize: '1rem', marginBottom: 14 }}>
              <i className="fas fa-calendar-days" style={{ color: GOLD, marginRight: 8 }} />Upcoming events
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {events.map(ev => {
                const typeColor = TYPE_COLORS[ev.event_type] || '#64748b';
                return (
                  <div key={ev.id} style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: typeColor + '15', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <div style={{ fontSize: '1rem', fontWeight: 900, color: typeColor, lineHeight: 1 }}>
                        {new Date(ev.event_date + 'T12:00:00').getDate()}
                      </div>
                      <div style={{ fontSize: '0.6rem', color: typeColor, fontWeight: 700, textTransform: 'uppercase' }}>
                        {new Date(ev.event_date + 'T12:00:00').toLocaleDateString('en-GB', { month: 'short' })}
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
                        <span style={{ background: typeColor + '15', color: typeColor, fontSize: '0.65rem', fontWeight: 700, padding: '1px 7px', borderRadius: 20 }}>
                          {TYPE_LABELS[ev.event_type] || ev.event_type}
                        </span>
                        {ev.start_time && <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{fmtTime(ev.start_time)}</span>}
                        {ev.location && <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}><i className="fas fa-location-dot" style={{ marginRight: 3 }} />{ev.location}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ textAlign: 'center', marginTop: 10 }}>
              <button onClick={() => router.push(`/${slug}/events`)}
                style={{ background: 'none', border: 'none', color: NAV, fontWeight: 600, fontSize: '0.825rem', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit' }}>
                View all events →
              </button>
            </div>
          </div>
        )}

        {events.length === 0 && (
          <div style={{ background: '#fff', borderRadius: 16, padding: '28px', textAlign: 'center', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', marginBottom: 24 }}>
            <i className="fas fa-calendar-days" style={{ fontSize: 28, color: '#e2e8f0', display: 'block', marginBottom: 10 }} />
            <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No upcoming events at this time.</p>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '12px 0 32px', borderTop: '1px solid #e2e8f0' }}>
          <div style={{ color: '#cbd5e1', fontSize: '0.72rem' }}>
            Managed with <a href="/" style={{ color: GOLD, fontWeight: 700, textDecoration: 'none' }}>ChurchCompass</a>
          </div>
        </div>
      </div>
    </div>
  );
}
