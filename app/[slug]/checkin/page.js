'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';

const NAV = '#1e3a5f';
const GOLD = '#f59e0b';

export default function SelfCheckin() {
  const { slug } = useParams();

  const [church, setChurch] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Steps: 'event' | 'name' | 'success' | 'error'
  const [step, setStep] = useState('event');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [identifier, setIdentifier] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const inputRef = useRef(null);
  const resetTimer = useRef(null);

  useEffect(() => {
    fetch(`/api/checkin?slug=${slug}`)
      .then(r => r.json())
      .then(d => {
        setChurch(d.church || null);
        setEvents(d.events || []);
        setLoading(false);
      });
  }, [slug]);

  useEffect(() => {
    if (step === 'name' && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [step]);

  const scheduleReset = () => {
    clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => {
      setStep('event');
      setSelectedEvent(null);
      setIdentifier('');
      setResult(null);
    }, 5000);
  };

  const selectEvent = (ev) => {
    setSelectedEvent(ev);
    setStep('name');
  };

  const submit = async () => {
    if (!identifier.trim()) return;
    setSubmitting(true);
    const res = await fetch('/api/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, eventId: selectedEvent.id, identifier: identifier.trim() }),
    });
    const data = await res.json();
    setResult(data);
    setStep(data.ok ? 'success' : 'error');
    setSubmitting(false);
    scheduleReset();
  };

  const reset = () => {
    clearTimeout(resetTimer.current);
    setStep('event');
    setSelectedEvent(null);
    setIdentifier('');
    setResult(null);
  };

  const accent = church?.brand_color || NAV;

  const typeLabel = { service: 'Service', meeting: 'Meeting', event: 'Event', youth: 'Youth', kids: 'Kids' };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div style={{ color: '#94a3b8', fontSize: '1rem' }}>Loading…</div>
    </div>
  );

  if (!church) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div style={{ color: '#ef4444' }}>Church not found.</div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div style={{ background: accent, padding: '24px 32px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="fas fa-check-circle" style={{ color: '#fff', fontSize: 22 }} />
        </div>
        <div>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.2rem' }}>{church.name}</div>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.85rem' }}>Event Attendance Check-In</div>
        </div>
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '40px 20px' }}>

        {/* STEP 1 — Select event */}
        {step === 'event' && (
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: NAV, marginBottom: 6, textAlign: 'center' }}>Which event are you attending today?</h2>
            <p style={{ color: '#64748b', textAlign: 'center', marginBottom: 28, fontSize: '0.9rem' }}>Select your event below</p>
            {events.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: 16, padding: 32, textAlign: 'center', color: '#94a3b8', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
                No upcoming events found.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {events.map(ev => (
                  <button key={ev.id} onClick={() => selectEvent(ev)}
                    style={{ background: '#fff', border: `2px solid #e2e8f0`, borderRadius: 14, padding: '18px 22px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', transition: 'border-color 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = accent}
                    onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}>
                    <div style={{ width: 52, height: 52, borderRadius: 12, background: accent + '18', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 900, color: accent, lineHeight: 1 }}>{new Date(ev.event_date + 'T00:00:00').getDate()}</div>
                      <div style={{ fontSize: '0.6rem', fontWeight: 700, color: accent, textTransform: 'uppercase' }}>{new Date(ev.event_date + 'T00:00:00').toLocaleString('en-GB', { month: 'short' })}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '1rem' }}>{ev.name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>
                        {typeLabel[ev.event_type] || ev.event_type}
                        {ev.start_time ? ` · ${ev.start_time}` : ''}
                      </div>
                    </div>
                    <i className="fas fa-chevron-right" style={{ color: '#cbd5e1', fontSize: 14 }} />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 2 — Enter name or email */}
        {step === 'name' && (
          <div>
            <button onClick={reset} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.85rem', cursor: 'pointer', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}>
              ← Back
            </button>
            <div style={{ background: '#fff', borderRadius: 16, padding: '32px 28px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
              <div style={{ background: accent + '15', border: `1.5px solid ${accent}33`, borderRadius: 10, padding: '12px 16px', marginBottom: 24, textAlign: 'center' }}>
                <div style={{ fontWeight: 700, color: accent, fontSize: '1rem' }}>{selectedEvent?.name}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>
                  {new Date(selectedEvent?.event_date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                  {selectedEvent?.start_time ? ` · ${selectedEvent.start_time}` : ''}
                </div>
              </div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: NAV, marginBottom: 6 }}>Enter your name or email</h2>
              <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 20 }}>We'll find your registration and check you in.</p>
              <input
                ref={inputRef}
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !submitting && identifier.trim() && submit()}
                placeholder="Your name or email address…"
                style={{ width: '100%', padding: '14px 16px', border: '2px solid #dde3f0', borderRadius: 12, fontSize: '1rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', marginBottom: 14 }}
              />
              <button onClick={submit} disabled={!identifier.trim() || submitting}
                style={{ width: '100%', background: identifier.trim() ? accent : '#e2e8f0', color: identifier.trim() ? '#fff' : '#94a3b8', border: 'none', borderRadius: 12, padding: '14px', fontWeight: 800, fontSize: '1rem', cursor: identifier.trim() && !submitting ? 'pointer' : 'not-allowed', transition: 'background 0.15s' }}>
                {submitting ? 'Checking in…' : 'Check In →'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — Success */}
        {step === 'success' && result && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <i className="fas fa-check" style={{ color: '#16a34a', fontSize: 36 }} />
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: NAV, marginBottom: 8 }}>
              {result.alreadyCheckedIn ? 'Already checked in!' : 'Welcome!'}
            </h2>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>{result.name}</div>
            <div style={{ color: '#64748b', marginBottom: 8 }}>{selectedEvent?.name}</div>
            {!result.found && (
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: 16 }}>You've been added as a walk-in.</div>
            )}
            <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: 24 }}>This screen will reset in a few seconds…</div>
            <button onClick={reset} style={{ background: accent, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 28px', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' }}>
              Done
            </button>
          </div>
        )}

        {/* Error */}
        {step === 'error' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <i className="fas fa-times" style={{ color: '#ef4444', fontSize: 36 }} />
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: NAV, marginBottom: 8 }}>Something went wrong</h2>
            <div style={{ color: '#64748b', marginBottom: 24 }}>{result?.error || 'Please try again.'}</div>
            <button onClick={reset} style={{ background: accent, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 28px', fontWeight: 700, cursor: 'pointer' }}>
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
