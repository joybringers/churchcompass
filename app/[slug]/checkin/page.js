'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';

const NAV = '#1e3a5f';

export default function SelfCheckin() {
  const { slug } = useParams();

  const [church, setChurch] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Steps: 'search' | 'confirm' | 'success' | 'notfound'
  const [step, setStep] = useState('search');
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [matches, setMatches] = useState([]); // array of { registration, event }
  const [selected, setSelected] = useState({}); // id → true/false (checkbox)
  const [submitting, setSubmitting] = useState(false);
  const [checkedIn, setCheckedIn] = useState([]);

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
    if (step === 'search' && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [step]);

  const scheduleReset = (ms = 8000) => {
    clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(reset, ms);
  };

  const reset = () => {
    clearTimeout(resetTimer.current);
    setStep('search');
    setQuery('');
    setMatches([]);
    setSelected({});
    setCheckedIn([]);
  };

  // Search across ALL events for this name/email
  const search = async () => {
    const term = query.trim();
    if (!term || !church) return;
    setSearching(true);

    // Fetch all registrations for this church
    const res = await fetch(`/api/event-registrations?churchId=${church.id}`);
    const data = await res.json();
    const allRegs = data.registrations || [];
    const termLower = term.toLowerCase();

    // Match by name or email (partial name match too)
    const found = allRegs.filter(r => {
      const nameMatch = r.name?.toLowerCase().includes(termLower);
      const emailMatch = r.email?.toLowerCase() === termLower;
      return nameMatch || emailMatch;
    });

    if (found.length === 0) {
      setStep('notfound');
      setSearching(false);
      scheduleReset(6000);
      return;
    }

    // Attach event info and pre-select all not yet attended
    const withEvents = found.map(r => ({
      reg: r,
      event: events.find(e => e.id === r.event_id) || null,
    }));

    setMatches(withEvents);
    // Pre-select all not yet attended
    const preSelected = {};
    withEvents.forEach(({ reg }) => {
      preSelected[reg.id] = !reg.attended_at;
    });
    setSelected(preSelected);
    setStep('confirm');
    setSearching(false);
  };

  const confirm = async () => {
    const toCheckin = matches.filter(({ reg }) => selected[reg.id] && !reg.attended_at);
    if (toCheckin.length === 0) { reset(); return; }
    setSubmitting(true);

    await Promise.all(toCheckin.map(({ reg }) =>
      fetch('/api/event-registrations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: reg.id, attended: true, public: true }),
      })
    ));

    setCheckedIn(toCheckin.map(({ reg, event }) => ({ name: reg.name, eventName: event?.name || 'Event' })));
    setStep('success');
    setSubmitting(false);
    scheduleReset(8000);
  };

  const accent = church?.brand_color || NAV;

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4f8' }}>
      <div style={{ color: '#94a3b8' }}>Loading…</div>
    </div>
  );

  if (!church) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4f8' }}>
      <div style={{ color: '#ef4444' }}>Church not found.</div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div style={{ background: accent, padding: '22px 32px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="fas fa-calendar-check" style={{ color: '#fff', fontSize: 20 }} />
        </div>
        <div>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.15rem' }}>{church.name}</div>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.8rem' }}>Event Check-In</div>
        </div>
      </div>

      <div style={{ maxWidth: 540, margin: '0 auto', padding: '48px 20px' }}>

        {/* SEARCH */}
        {step === 'search' && (
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: NAV, marginBottom: 6, textAlign: 'center' }}>Welcome!</h2>
            <p style={{ color: '#64748b', textAlign: 'center', marginBottom: 32, fontSize: '0.95rem' }}>
              Enter your name or email to check in
            </p>
            <div style={{ background: '#fff', borderRadius: 18, padding: '28px 24px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !searching && query.trim() && search()}
                placeholder="e.g. John Smith or john@email.com"
                style={{ width: '100%', padding: '16px 18px', border: '2px solid #e2e8f0', borderRadius: 12, fontSize: '1.05rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', marginBottom: 14 }}
                autoComplete="off"
              />
              <button onClick={search} disabled={!query.trim() || searching}
                style={{ width: '100%', background: query.trim() ? accent : '#e2e8f0', color: query.trim() ? '#fff' : '#94a3b8', border: 'none', borderRadius: 12, padding: '15px', fontWeight: 800, fontSize: '1.05rem', cursor: query.trim() && !searching ? 'pointer' : 'not-allowed' }}>
                {searching ? 'Searching…' : 'Find my registration →'}
              </button>
            </div>
          </div>
        )}

        {/* CONFIRM */}
        {step === 'confirm' && (
          <div>
            <button onClick={reset} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.85rem', cursor: 'pointer', marginBottom: 20, padding: 0 }}>
              ← Back
            </button>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: NAV, marginBottom: 6 }}>We found you!</h2>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 20 }}>
              Select everyone you want to check in, then tap Confirm.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {matches.map(({ reg, event }) => {
                const isChecked = !!selected[reg.id];
                const alreadyIn = !!reg.attended_at;
                return (
                  <div key={reg.id}
                    onClick={() => !alreadyIn && setSelected(s => ({ ...s, [reg.id]: !s[reg.id] }))}
                    style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 1px 6px rgba(0,0,0,0.06)', cursor: alreadyIn ? 'default' : 'pointer', border: `2px solid ${isChecked && !alreadyIn ? accent : '#e2e8f0'}`, opacity: alreadyIn ? 0.6 : 1 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, border: `2px solid ${alreadyIn ? '#94a3b8' : isChecked ? accent : '#e2e8f0'}`, background: alreadyIn ? '#f1f5f9' : isChecked ? accent : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {(isChecked || alreadyIn) && <i className="fas fa-check" style={{ color: alreadyIn ? '#94a3b8' : '#fff', fontSize: 12 }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>{reg.name}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>
                        {event?.name || 'Event'} · {event ? new Date(event.event_date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}
                        {alreadyIn && <span style={{ marginLeft: 8, color: '#16a34a', fontWeight: 600 }}>Already checked in</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <button onClick={confirm} disabled={submitting || Object.values(selected).every(v => !v) || matches.every(({ reg }) => reg.attended_at)}
              style={{ width: '100%', background: accent, color: '#fff', border: 'none', borderRadius: 12, padding: '15px', fontWeight: 800, fontSize: '1.05rem', cursor: 'pointer' }}>
              {submitting ? 'Checking in…' : `Confirm check-in`}
            </button>
          </div>
        )}

        {/* SUCCESS */}
        {step === 'success' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 90, height: 90, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <i className="fas fa-check" style={{ color: '#16a34a', fontSize: 42 }} />
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 900, color: NAV, marginBottom: 12 }}>You're checked in!</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24, textAlign: 'left', background: '#fff', borderRadius: 14, padding: '16px 20px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
              {checkedIn.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <i className="fas fa-check-circle" style={{ color: '#16a34a', fontSize: 16 }} />
                  <div>
                    <span style={{ fontWeight: 700, color: '#1e293b' }}>{c.name}</span>
                    <span style={{ color: '#64748b', fontSize: '0.85rem' }}> — {c.eventName}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: 20 }}>Resetting in a few seconds…</div>
            <button onClick={reset} style={{ background: accent, color: '#fff', border: 'none', borderRadius: 12, padding: '13px 32px', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' }}>
              Done
            </button>
          </div>
        )}

        {/* NOT FOUND */}
        {step === 'notfound' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <i className="fas fa-search" style={{ color: '#f97316', fontSize: 34 }} />
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: NAV, marginBottom: 8 }}>Not found</h2>
            <p style={{ color: '#64748b', marginBottom: 24, lineHeight: 1.5 }}>
              We couldn't find a registration for <strong>"{query}"</strong>.<br />
              Please see a member of staff to be added.
            </p>
            <button onClick={reset} style={{ background: accent, color: '#fff', border: 'none', borderRadius: 12, padding: '13px 32px', fontWeight: 700, cursor: 'pointer' }}>
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
