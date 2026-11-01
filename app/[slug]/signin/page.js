'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';

const NAV = '#1e3a5f';
const GOLD = '#f59e0b';
const GREEN = '#22c55e';
const IDLE_SECS = 45;

// The kiosk talks to /api/kiosk, which only ever returns names and checks pick-up codes on the server.
async function kioskGet(churchId, params) {
  const qs = new URLSearchParams({ churchId, ...params }).toString();
  const res = await fetch(`/api/kiosk?${qs}`);
  let data = {};
  try { data = await res.json(); } catch { /* ignore */ }
  return { ok: res.ok, data };
}

async function kioskPost(churchId, body) {
  const res = await fetch('/api/kiosk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ churchId, ...body }),
  });
  let data = {};
  try { data = await res.json(); } catch { /* ignore */ }
  return { ok: res.ok, data };
}

const TABS = ['Sign In', 'Visitors', 'Family', 'Sign Out'];
const CHILD_GROUPS = ['Nursery (0-2)', 'Toddlers (3-4)', 'Kids (5-8)', 'Pre-teen (9-12)'];

export default function Signin() {
  const { slug } = useParams();
  const [church, setChurch] = useState(null);
  const [tab, setTab] = useState(0); // 0=Members, 1=Visitors, 2=Children
  const [mode, setMode] = useState('home'); // home | search | found | newVisitor | newChild | done
  const [signOutMode, setSignOutMode] = useState(false);
  const signOutModeRef = useRef(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [visitorForm, setVisitorForm] = useState({ name: '', type: 'adult' });
  const [childForm, setChildForm] = useState({ childName: '', guardianName: '', guardianPhone: '', allergies: '' });
  const [pickupCode, setPickupCode] = useState('');
  const [doneMsg, setDoneMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [idleCountdown, setIdleCountdown] = useState(IDLE_SECS);
  const [fullscreen, setFullscreen] = useState(false);
  const [clock, setClock] = useState('');
  const [clockDate, setClockDate] = useState('');
  const [toast, setToast] = useState(null);
  const [alreadyInModal, setAlreadyInModal] = useState(null);
  const [codeModal, setCodeModal] = useState(null); // asks for the pick-up code before signing out a child or family
  const [codeInput, setCodeInput] = useState('');
  const [familyStep, setFamilyStep] = useState(1);
  const [guardianForm, setGuardianForm] = useState({ name: '', phone: '' });
  const [prevChildren, setPrevChildren] = useState([]);
  const [newChildren, setNewChildren] = useState([{ name: '', group: '' }]);
  const [familySearching, setFamilySearching] = useState(false);
  const [doneChildren, setDoneChildren] = useState([]);
  const idleRef = useRef(null);
  const countdownRef = useRef(null);
  const searchRef = useRef(null);
  const rootRef = useRef(null);
  const toastTimerRef = useRef(null);
  const familyLookupTimerRef = useRef(null);

  useEffect(() => {
    fetch(`/api/churches?slug=${slug}`).then(r => r.json()).then(d => setChurch(d.church));
  }, [slug]);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
      setClockDate(now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!church) return;
    const today = new Date().toISOString().split('T')[0];
    fetch(`/api/events?churchId=${church.id}&date=${today}`).then(r => r.json()).then(d => setEvents(d.events || []));
  }, [church]);

  const resetKiosk = useCallback(() => {
    clearTimeout(idleRef.current);
    clearInterval(countdownRef.current);
    setMode('home'); setQuery(''); setResults([]); setSelected(null);
    setVisitorForm({ name: '', type: 'adult' });
    setChildForm({ childName: '', guardianName: '', guardianPhone: '', allergies: '' });
    setPickupCode(''); setDoneMsg(''); setIdleCountdown(IDLE_SECS);
    signOutModeRef.current = false; setSignOutMode(false);
    setFamilyStep(1); setGuardianForm({ name: '', phone: '' });
    setPrevChildren([]); setNewChildren([{ name: '', group: '' }]);
    setFamilySearching(false); setDoneChildren([]);
  }, []);

  const startIdleTimer = useCallback(() => {
    clearTimeout(idleRef.current);
    clearInterval(countdownRef.current);
    setIdleCountdown(IDLE_SECS);
    idleRef.current = setTimeout(resetKiosk, IDLE_SECS * 1000);
    countdownRef.current = setInterval(() => {
      setIdleCountdown(prev => (prev <= 1 ? IDLE_SECS : prev - 1));
    }, 1000);
  }, [resetKiosk]);

  const touch = useCallback(() => {
    if (mode !== 'home') startIdleTimer();
  }, [mode, startIdleTimer]);

  const showToast = useCallback((msg, type = 'error') => {
    setToast({ msg, type });
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const performSignOut = useCallback(async ({ attendanceId, memberId, firstName, code }) => {
    setSubmitting(true);
    try {
      const { ok, data } = await kioskPost(church.id, { action: 'signout', attendanceId: attendanceId || null, memberId: memberId || null, code: code || null });
      if (!ok) {
        if (data.reason === 'code_required') {
          setCodeInput('');
          setCodeModal({ attendanceId, memberId, firstName, error: '' });
        } else if (data.reason === 'wrong_code') {
          setCodeInput('');
          setCodeModal({ attendanceId, memberId, firstName, error: `That code is not right. ${data.attemptsLeft} ${data.attemptsLeft === 1 ? 'try' : 'tries'} left.` });
        } else if (data.reason === 'locked') {
          setCodeModal(null);
          showToast("Too many wrong codes. Please see a children's leader.");
        } else if (data.reason === 'busy') {
          showToast('Please try again.');
        } else {
          showToast('Could not sign out. Please see an usher.');
        }
        setSubmitting(false);
        touch();
        return;
      }
      setCodeModal(null);
      const childCount = data.childCount || 0;
      setDoneMsg(data.notSignedIn
        ? `${firstName} was not signed in today.`
        : childCount > 0
          ? `Goodbye, ${firstName}! ${childCount} ${childCount === 1 ? 'child' : 'children'} also signed out.`
          : `Goodbye, ${firstName}! See you next time.`);
      setPickupCode('');
      signOutModeRef.current = false; setSignOutMode(false);
      setMode('done');
      touch();
    } catch {
      showToast('Could not sign out. Please see an usher.');
    }
    setSubmitting(false);
  }, [touch, showToast, church]);

  useEffect(() => {
    if (mode !== 'home') { startIdleTimer(); }
    else { clearTimeout(idleRef.current); clearInterval(countdownRef.current); }
    return () => { clearTimeout(idleRef.current); clearInterval(countdownRef.current); };
  }, [mode, startIdleTimer]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      rootRef.current?.requestFullscreen?.();
      setFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setFullscreen(false);
    }
  };

  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const debouncedLookupFamily = (name) => {
    clearTimeout(familyLookupTimerRef.current);
    if (name.length < 2) { setPrevChildren([]); setFamilySearching(false); return; }
    if (!church) return;
    setFamilySearching(true);
    familyLookupTimerRef.current = setTimeout(async () => {
      try {
        const { data } = await kioskGet(church.id, { action: 'family', guardian: name });
        setPrevChildren((data.children || []).map(c => ({ name: c.name, group: c.group || '', selected: true })));
      } catch { /* ignore */ }
      setFamilySearching(false);
    }, 600);
  };

  const signInFamily = async () => {
    const allChildren = [
      ...prevChildren.filter(c => c.selected),
      ...newChildren.filter(c => c.name.trim()),
    ];
    if (allChildren.length === 0) { showToast('Please add at least one child.'); return; }
    setSubmitting(true); touch();
    try {
      const { ok, data } = await kioskPost(church.id, {
        action: 'family-checkin',
        guardianName: guardianForm.name,
        guardianPhone: guardianForm.phone,
        eventId: selectedEvent || null,
        children: allChildren.map(c => ({ name: c.name, group: c.group || '' })),
      });
      if (!ok) throw new Error();
      setDoneChildren(allChildren);
      setPickupCode(data.pickupCode || '');
      setDoneMsg(`${guardianForm.name.split(' ')[0]}'s family is checked in!`);
      setMode('done');
    } catch {
      showToast('Could not complete check-in. Please see an usher.');
    }
    setSubmitting(false);
  };

  const searchMembers = async (q) => {
    setQuery(q);
    if (q.length < 2) { setResults([]); return; }
    if (!church) return;

    if (signOutModeRef.current) {
      const { data } = await kioskGet(church.id, { action: 'signed-in', q });
      setResults(data.results || []);
      return;
    }

    const { data } = await kioskGet(church.id, { action: 'members', q });
    setResults(data.members || []);
  };

  const selectMember = (m) => { setSelected(m); setMode('found'); touch(); };

  const signIn = async (opts = {}) => {
    setSubmitting(true);
    touch();
    let code = '';
    try {
      const { ok, data } = await kioskPost(church.id, {
        action: 'checkin',
        memberId: opts.memberId || null,
        visitorName: opts.visitorName || null,
        visitorType: opts.visitorType || 'adult',
        eventId: selectedEvent || null,
        guardianName: opts.guardianName || null,
        guardianPhone: opts.guardianPhone || null,
        allergies: opts.allergies || null,
      });
      if (!ok) throw new Error();
      if (data.alreadyIn) {
        setSubmitting(false);
        const firstName = opts.doneMsg?.replace('Welcome, ', '').replace('!', '') || 'You';
        setAlreadyInModal({ firstName, attendanceId: data.attendanceId });
        return;
      }
      code = data.pickupCode || '';
    } catch {
      setSubmitting(false);
      showToast('Could not save sign-in. Please see an usher.');
      return;
    }
    setSubmitting(false);
    setDoneMsg(opts.doneMsg || 'You are signed in!');
    setPickupCode(code);
    setMode('done');
    touch();
  };

  const signOut = () => {
    if (!selected) return;
    touch();
    performSignOut({
      attendanceId: selected.attendanceId || null,
      memberId: selected.attendanceId ? null : selected.id,
      firstName: selected.first_name,
    });
  };

  if (!church) return (
    <div style={{ minHeight: '100vh', background: NAV, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'rgba(255,255,255,0.6)' }}>Loading…</p>
    </div>
  );

  const bg = 'linear-gradient(145deg, #0c2040 0%, #1e3a5f 60%, #0f2744 100%)';
  const card = { background: '#fff', borderRadius: 24, padding: '40px 36px', width: '100%', maxWidth: 540, boxShadow: '0 32px 100px rgba(0,0,0,0.35)' };
  const inp = { width: '100%', padding: '16px 18px', border: '2px solid #e2e8f0', borderRadius: 14, fontSize: '1.1rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' };
  const lbl = { fontSize: '0.85rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 };

  return (
    <div ref={rootRef} onPointerMove={touch} onPointerDown={touch}
      style={{ minHeight: '100vh', background: bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'system-ui, sans-serif', userSelect: 'none' }}>

      {/* Top bar */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="fas fa-compass" style={{ color: NAV, fontSize: 16 }} />
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 900, fontSize: '0.85rem' }}>CHURCH<span style={{ color: GOLD }}>COMPASS</span></div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}>{church.name}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {clock && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.2rem', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{clock}</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem', marginTop: 2 }}>{clockDate}</div>
            </div>
          )}
          <button onClick={toggleFullscreen}
            style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
            <i className={`fas fa-${fullscreen ? 'compress' : 'expand'}`} style={{ marginRight: 6 }} />
            {fullscreen ? 'Exit' : 'Fullscreen'}
          </button>
        </div>
      </div>

      {/* Idle warning */}
      {mode !== 'home' && idleCountdown <= 15 && (
        <div style={{ position: 'fixed', top: 64, left: '50%', transform: 'translateX(-50%)', background: '#fef3c7', border: '2px solid ' + GOLD, borderRadius: 12, padding: '10px 20px', color: '#92400e', fontWeight: 700, fontSize: '0.875rem', zIndex: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
          <i className="fas fa-clock" style={{ marginRight: 8 }} />Resetting in {idleCountdown}s — tap to cancel
        </div>
      )}

      <div style={card}>

        {/* HOME */}
        {mode === 'home' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: NAV, marginBottom: 4 }}>Welcome!</h1>
              <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Tap below to sign in for today.</p>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 14, padding: 4, marginBottom: 24, gap: 2 }}>
              {TABS.map((t, i) => (
                <button key={t} onClick={() => { setTab(i); touch(); }}
                  style={{ flex: 1, padding: '10px 4px', border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.78rem', background: tab === i ? (i === 3 ? '#fee2e2' : '#fff') : 'transparent', color: tab === i ? (i === 3 ? '#dc2626' : NAV) : '#64748b', boxShadow: tab === i ? '0 1px 6px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s' }}>
                  {t}
                </button>
              ))}
            </div>

            {/* Event selector */}
            {events.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <label style={lbl}>Today's event (optional)</label>
                <select value={selectedEvent} onChange={e => { setSelectedEvent(e.target.value); touch(); }}
                  style={{ ...inp, fontSize: '0.95rem' }}>
                  <option value="">No specific event</option>
                  {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                </select>
              </div>
            )}

            {tab === 0 && (
              <button onClick={() => { signOutModeRef.current = false; setSignOutMode(false); setMode('search'); setTimeout(() => searchRef.current?.focus(), 100); }}
                style={{ width: '100%', background: NAV, color: '#fff', border: 'none', borderRadius: 14, padding: '18px', fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer' }}>
                <i className="fas fa-magnifying-glass" style={{ marginRight: 10 }} />Find me
              </button>
            )}
            {tab === 1 && (
              <button onClick={() => setMode('newVisitor')}
                style={{ width: '100%', background: GOLD, color: NAV, border: 'none', borderRadius: 14, padding: '18px', fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer' }}>
                <i className="fas fa-user-plus" style={{ marginRight: 10 }} />Sign in as visitor
              </button>
            )}
            {tab === 2 && (
              <button onClick={() => { setFamilyStep(1); setMode('newFamily'); touch(); }}
                style={{ width: '100%', background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: 14, padding: '18px', fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer' }}>
                <i className="fas fa-people-group" style={{ marginRight: 10 }} />Family check-in
              </button>
            )}
            {tab === 3 && (
              <div>
                <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 14, padding: '16px 18px', marginBottom: 16, textAlign: 'center' }}>
                  <i className="fas fa-sign-out-alt" style={{ color: '#dc2626', fontSize: '2rem', marginBottom: 10, display: 'block' }} />
                  <p style={{ color: '#7f1d1d', fontWeight: 700, fontSize: '0.95rem', margin: 0 }}>Search your name below to sign out</p>
                  <p style={{ color: '#991b1b', fontSize: '0.8rem', marginTop: 4, marginBottom: 0 }}>Only for members who are already signed in today</p>
                </div>
                <button onClick={() => { signOutModeRef.current = true; setSignOutMode(true); setMode('search'); setTimeout(() => searchRef.current?.focus(), 100); }}
                  style={{ width: '100%', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 14, padding: '18px', fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer' }}>
                  <i className="fas fa-magnifying-glass" style={{ marginRight: 10 }} />Find my name to sign out
                </button>
              </div>
            )}
          </div>
        )}

        {/* SEARCH */}
        {mode === 'search' && (
          <div>
            <button onClick={() => { setMode('home'); setQuery(''); setResults([]); }} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', marginBottom: 20, fontSize: '0.9rem', padding: 0 }}>
              <i className="fas fa-arrow-left" style={{ marginRight: 8 }} />Back
            </button>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: signOutMode ? '#dc2626' : NAV, marginBottom: 6 }}>{signOutMode ? 'Find your name to sign out' : 'Find your name'}</h2>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 20 }}>Type your first or last name.</p>
            <input ref={searchRef} value={query} onChange={e => { searchMembers(e.target.value); touch(); }} placeholder="Start typing…" style={inp} autoComplete="off" />
            {results.length > 0 && (
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
                {results.map(m => (
                  <button key={m.id} onClick={() => selectMember(m)}
                    style={{ background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: 12, padding: '16px 18px', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: NAV, fontSize: '1.05rem' }}>{m.first_name} {m.last_name}</div>
                      <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: 2, textTransform: 'capitalize' }}>{m.member_type}</div>
                    </div>
                    <i className="fas fa-chevron-right" style={{ color: '#94a3b8' }} />
                  </button>
                ))}
              </div>
            )}
            {query.length >= 2 && results.length === 0 && (
              <div style={{ marginTop: 20, textAlign: 'center' }}>
                {signOutMode ? (
                  <p style={{ color: '#dc2626', fontSize: '0.875rem' }}>No one signed in today matches that name.</p>
                ) : (
                  <>
                    <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 12 }}>Not found. Try visiting as a guest.</p>
                    <button onClick={() => setMode('newVisitor')} style={{ background: GOLD, color: NAV, border: 'none', borderRadius: 12, padding: '12px 24px', fontWeight: 700, cursor: 'pointer' }}>
                      <i className="fas fa-user-plus" style={{ marginRight: 8 }} />Sign in as visitor
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* FOUND */}
        {mode === 'found' && selected && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: (signOutMode ? '#fef2f2' : NAV + '1a'), display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <span style={{ fontSize: '2rem', fontWeight: 900, color: signOutMode ? '#dc2626' : NAV }}>{selected.first_name?.[0]}{selected.last_name?.[0]}</span>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: NAV }}>{selected.first_name} {selected.last_name}</h2>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 28, textTransform: 'capitalize' }}>{selected.member_type}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {signOutMode ? (
                <button onClick={signOut} disabled={submitting}
                  style={{ background: submitting ? '#94a3b8' : '#dc2626', color: '#fff', border: 'none', borderRadius: 14, padding: '18px', fontSize: '1.1rem', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer' }}>
                  <i className="fas fa-sign-out-alt" style={{ marginRight: 10 }} />{submitting ? 'Signing out…' : 'Sign Out'}
                </button>
              ) : (
                <>
                  <button onClick={() => signIn({ memberId: selected.id, visitorType: selected.member_type, doneMsg: `Welcome, ${selected.first_name}!` })}
                    disabled={submitting}
                    style={{ background: submitting ? '#94a3b8' : GREEN, color: '#fff', border: 'none', borderRadius: 14, padding: '18px', fontSize: '1.1rem', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer' }}>
                    <i className="fas fa-sign-in-alt" style={{ marginRight: 10 }} />{submitting ? 'Signing in…' : 'Sign In'}
                  </button>
                  <button onClick={signOut} disabled={submitting}
                    style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 14, padding: '14px', fontSize: '0.95rem', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer' }}>
                    <i className="fas fa-sign-out-alt" style={{ marginRight: 8 }} />Sign Out Instead
                  </button>
                </>
              )}
              <button onClick={() => { setMode('search'); setQuery(''); setResults([]); }}
                style={{ background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 12, padding: '12px', fontWeight: 600, cursor: 'pointer' }}>
                Not me — search again
              </button>
            </div>
          </div>
        )}

        {/* NEW VISITOR */}
        {mode === 'newVisitor' && (
          <div>
            <button onClick={() => setMode('home')} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', marginBottom: 20, fontSize: '0.9rem', padding: 0 }}>
              <i className="fas fa-arrow-left" style={{ marginRight: 8 }} />Back
            </button>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: NAV, marginBottom: 20 }}>Visitor sign-in</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={lbl}>Your name *</label>
                <input style={inp} value={visitorForm.name} onChange={e => { setVisitorForm(f => ({ ...f, name: e.target.value })); touch(); }} placeholder="First and last name" autoComplete="off" />
              </div>
              <div>
                <label style={lbl}>Visitor type</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {['adult', 'youth'].map(t => (
                    <button key={t} onClick={() => { setVisitorForm(f => ({ ...f, type: t })); touch(); }}
                      style={{ padding: '12px', border: `2px solid ${visitorForm.type === t ? NAV : '#e2e8f0'}`, borderRadius: 12, background: visitorForm.type === t ? NAV + '0d' : '#fff', color: visitorForm.type === t ? NAV : '#64748b', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize' }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={() => signIn({ visitorName: visitorForm.name, visitorType: visitorForm.type, doneMsg: `Welcome, ${visitorForm.name.split(' ')[0]}!` })}
              disabled={submitting || !visitorForm.name}
              style={{ width: '100%', background: !visitorForm.name || submitting ? '#94a3b8' : GREEN, color: '#fff', border: 'none', borderRadius: 14, padding: '18px', fontSize: '1.05rem', fontWeight: 700, cursor: !visitorForm.name || submitting ? 'not-allowed' : 'pointer', marginTop: 24 }}>
              {submitting ? 'Signing in…' : 'Sign In'}
            </button>
          </div>
        )}

        {/* NEW FAMILY */}
        {mode === 'newFamily' && (
          <div>
            <button onClick={() => { if (familyStep === 1) { setMode('home'); } else { setFamilyStep(1); } touch(); }}
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', marginBottom: 20, fontSize: '0.9rem', padding: 0 }}>
              <i className="fas fa-arrow-left" style={{ marginRight: 8 }} />Back
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, background: '#8b5cf6', color: '#fff' }}>1</div>
              <div style={{ flex: 1, height: 3, borderRadius: 2, background: familyStep > 1 ? '#8b5cf6' : '#e2e8f0' }} />
              <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, background: familyStep >= 2 ? '#8b5cf6' : '#e2e8f0', color: familyStep >= 2 ? '#fff' : '#94a3b8' }}>2</div>
              <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: 4 }}>{familyStep === 1 ? 'Guardian' : 'Children'}</span>
            </div>

            {familyStep === 1 && (
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: NAV, marginBottom: 6 }}>Family check-in</h2>
                <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 20 }}>Start with the guardian's details.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={lbl}>Guardian's name *</label>
                    <input style={inp} value={guardianForm.name} autoComplete="off"
                      onChange={e => { const v = e.target.value; setGuardianForm(f => ({ ...f, name: v })); touch(); debouncedLookupFamily(v); }}
                      placeholder="Your full name" />
                    {familySearching && <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 6 }}><i className="fas fa-spinner fa-spin" style={{ marginRight: 6 }} />Looking up previous visits…</div>}
                    {!familySearching && prevChildren.length > 0 && (
                      <div style={{ marginTop: 8, background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 10, padding: '9px 12px', fontSize: '0.8rem', color: '#166534', fontWeight: 600 }}>
                        <i className="fas fa-star" style={{ marginRight: 6, color: '#22c55e' }} />Welcome back! Your children are ready to check in.
                      </div>
                    )}
                  </div>
                  <div>
                    <label style={lbl}>Guardian's phone</label>
                    <input style={inp} type="tel" value={guardianForm.phone} autoComplete="off"
                      onChange={e => { setGuardianForm(f => ({ ...f, phone: e.target.value })); touch(); }}
                      placeholder="Phone number (optional)" />
                  </div>
                </div>
                <button onClick={() => { if (!guardianForm.name.trim()) { showToast('Please enter your name.'); return; } setFamilyStep(2); touch(); }}
                  style={{ width: '100%', marginTop: 24, background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: 14, padding: '18px', fontSize: '1.05rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Next — Add Children <i className="fas fa-arrow-right" style={{ marginLeft: 8 }} />
                </button>
              </div>
            )}

            {familyStep === 2 && (
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: NAV, marginBottom: 4 }}>Add children</h2>
                <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 16 }}>Checking in with {guardianForm.name.split(' ')[0]}.</p>

                {prevChildren.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Previous children — tap to select</div>
                    {prevChildren.map((c, i) => (
                      <button key={i} onClick={() => { const u = [...prevChildren]; u[i] = { ...u[i], selected: !u[i].selected }; setPrevChildren(u); touch(); }}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, background: c.selected ? '#f5f3ff' : '#f8fafc', border: `2px solid ${c.selected ? '#8b5cf6' : '#e2e8f0'}`, borderRadius: 12, padding: '12px 14px', marginBottom: 6, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                        <div style={{ width: 22, height: 22, borderRadius: 6, background: c.selected ? '#8b5cf6' : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {c.selected && <i className="fas fa-check" style={{ color: '#fff', fontSize: 11 }} />}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: NAV, fontSize: '0.95rem' }}>{c.name}</div>
                          {c.group && <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{c.group}</div>}
                        </div>
                      </button>
                    ))}
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center', margin: '8px 0 14px' }}>— add a new child below —</div>
                  </div>
                )}

                {newChildren.map((c, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <input style={{ ...inp, padding: '13px 16px', fontSize: '0.95rem' }} value={c.name}
                        onChange={e => { const a = [...newChildren]; a[i] = { ...a[i], name: e.target.value }; setNewChildren(a); touch(); }}
                        placeholder="Child's full name" autoComplete="off" />
                      <select style={{ ...inp, padding: '11px 14px', fontSize: '0.875rem' }} value={c.group}
                        onChange={e => { const a = [...newChildren]; a[i] = { ...a[i], group: e.target.value }; setNewChildren(a); touch(); }}>
                        <option value="">Group (optional)</option>
                        {CHILD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    {newChildren.length > 1 && (
                      <button onClick={() => { setNewChildren(newChildren.filter((_, j) => j !== i)); touch(); }}
                        style={{ width: 36, height: 36, borderRadius: '50%', background: '#fee2e2', border: 'none', color: '#dc2626', cursor: 'pointer', flexShrink: 0, marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}>
                        <i className="fas fa-times" />
                      </button>
                    )}
                  </div>
                ))}

                {newChildren.length < 5 && (
                  <button onClick={() => { setNewChildren([...newChildren, { name: '', group: '' }]); touch(); }}
                    style={{ width: '100%', padding: '12px', border: '2px dashed #c4b5fd', borderRadius: 12, background: '#f5f3ff', color: '#7c3aed', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem', marginBottom: 16, fontFamily: 'inherit' }}>
                    <i className="fas fa-plus" style={{ marginRight: 8 }} />Add {newChildren[0]?.name ? 'another' : 'a'} child
                  </button>
                )}

                <button onClick={signInFamily} disabled={submitting}
                  style={{ width: '100%', background: submitting ? '#94a3b8' : '#8b5cf6', color: '#fff', border: 'none', borderRadius: 14, padding: '18px', fontSize: '1.05rem', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                  <i className="fas fa-child" style={{ marginRight: 10 }} />{submitting ? 'Checking in…' : 'Check In Family'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* NEW CHILD */}
        {mode === 'newChild' && (
          <div>
            <button onClick={() => setMode('home')} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', marginBottom: 20, fontSize: '0.9rem', padding: 0 }}>
              <i className="fas fa-arrow-left" style={{ marginRight: 8 }} />Back
            </button>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: NAV, marginBottom: 20 }}>Child check-in</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={lbl}>Child's full name *</label>
                <input style={inp} value={childForm.childName} onChange={e => { setChildForm(f => ({ ...f, childName: e.target.value })); touch(); }} placeholder="First and last name" />
              </div>
              <div>
                <label style={lbl}>Guardian's name *</label>
                <input style={inp} value={childForm.guardianName} onChange={e => { setChildForm(f => ({ ...f, guardianName: e.target.value })); touch(); }} placeholder="Your name" />
              </div>
              <div>
                <label style={lbl}>Guardian's phone</label>
                <input style={inp} value={childForm.guardianPhone} onChange={e => { setChildForm(f => ({ ...f, guardianPhone: e.target.value })); touch(); }} type="tel" placeholder="Phone number" />
              </div>
              <div>
                <label style={lbl}>Allergies or medical notes</label>
                <input style={inp} value={childForm.allergies} onChange={e => { setChildForm(f => ({ ...f, allergies: e.target.value })); touch(); }} placeholder="None" />
              </div>
            </div>
            <button onClick={() => {
              signIn({ visitorName: childForm.childName, visitorType: 'child', guardianName: childForm.guardianName, guardianPhone: childForm.guardianPhone, allergies: childForm.allergies, doneMsg: `${childForm.childName} is checked in!` });
            }}
              disabled={submitting || !childForm.childName || !childForm.guardianName}
              style={{ width: '100%', background: !childForm.childName || !childForm.guardianName || submitting ? '#94a3b8' : '#8b5cf6', color: '#fff', border: 'none', borderRadius: 14, padding: '18px', fontSize: '1.05rem', fontWeight: 700, cursor: !childForm.childName || !childForm.guardianName || submitting ? 'not-allowed' : 'pointer', marginTop: 24 }}>
              {submitting ? 'Checking in…' : 'Check In'}
            </button>
          </div>
        )}

        {/* DONE */}
        {mode === 'done' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: GREEN + '1a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <i className="fas fa-check" style={{ fontSize: 36, color: GREEN }} />
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: NAV, marginBottom: 8 }}>{doneMsg}</h2>
            {doneChildren.length > 0 && (
              <div style={{ background: '#f5f3ff', border: '1.5px solid #c4b5fd', borderRadius: 14, padding: '14px 16px', margin: '12px 0 4px', textAlign: 'left' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Children checked in</div>
                {doneChildren.map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0', borderBottom: i < doneChildren.length - 1 ? '1px solid #ede9fe' : 'none' }}>
                    <i className="fas fa-child" style={{ color: '#8b5cf6', width: 14 }} />
                    <div>
                      <span style={{ fontWeight: 700, color: NAV, fontSize: '0.9rem' }}>{c.name}</span>
                      {c.group && <span style={{ color: '#7c3aed', fontSize: '0.75rem', marginLeft: 8 }}>{c.group}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {pickupCode && (
              <div style={{ background: GOLD + '1a', border: `2px solid ${GOLD}`, borderRadius: 16, padding: '20px', margin: '20px 0' }}>
                <div style={{ color: '#92400e', fontSize: '0.8rem', fontWeight: 700, marginBottom: 8 }}>PICKUP CODE</div>
                <div style={{ fontSize: '3rem', fontWeight: 900, fontFamily: 'monospace', color: NAV, letterSpacing: 12 }}>{pickupCode}</div>
                <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: 8 }}>Show this code to collect your child.</div>
              </div>
            )}
            {!pickupCode && <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: 28 }}>God bless you!</p>}
            <button onClick={resetKiosk}
              style={{ background: NAV, color: '#fff', border: 'none', borderRadius: 14, padding: '16px 40px', fontWeight: 700, cursor: 'pointer', fontSize: '1rem' }}>
              Done
            </button>
            <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: 12 }}>
              Returns to home in {idleCountdown}s
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ marginTop: 20, color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem' }}>
        Powered by <a href="https://elmorilx.com" target="_blank" rel="noreferrer" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Elmoril</a>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', background: toast.type === 'error' ? '#dc2626' : '#1e3a5f', color: '#fff', padding: '12px 24px', borderRadius: 50, fontSize: '0.9rem', fontWeight: 600, zIndex: 100, boxShadow: '0 4px 24px rgba(0,0,0,0.3)', whiteSpace: 'nowrap', pointerEvents: 'none' }}>
          <i className={`fas fa-${toast.type === 'error' ? 'circle-xmark' : 'circle-check'}`} style={{ marginRight: 8 }} />{toast.msg}
        </div>
      )}

      {/* Pick-up code modal: a child or family is only signed out with the code given at check-in */}
      {codeModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '32px 28px', maxWidth: 380, width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: NAV, marginBottom: 10 }}>Enter your pick-up code</h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: 16 }}>
              {codeModal.firstName}, please enter the 4-digit code you were given at check-in.
            </p>
            <input value={codeInput} onChange={e => { setCodeInput(e.target.value.replace(/\D/g, '').slice(0, 4)); touch(); }}
              inputMode="numeric" autoComplete="off" autoFocus placeholder="0000"
              style={{ ...inp, textAlign: 'center', fontSize: '2rem', letterSpacing: 12, fontFamily: 'monospace', marginBottom: 12 }} />
            {codeModal.error && <p style={{ color: '#dc2626', fontSize: '0.85rem', marginBottom: 12 }}>{codeModal.error}</p>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setCodeModal(null); setCodeInput(''); }}
                style={{ flex: 1, padding: '13px', border: '1.5px solid #e2e8f0', background: '#fff', borderRadius: 12, fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', color: '#374151' }}>
                Cancel
              </button>
              <button onClick={() => performSignOut({ attendanceId: codeModal.attendanceId, memberId: codeModal.memberId, firstName: codeModal.firstName, code: codeInput })}
                disabled={submitting || codeInput.length < 4}
                style={{ flex: 1, padding: '13px', border: 'none', background: submitting || codeInput.length < 4 ? '#94a3b8' : NAV, borderRadius: 12, fontSize: '0.95rem', fontWeight: 700, cursor: submitting || codeInput.length < 4 ? 'not-allowed' : 'pointer', color: '#fff' }}>
                <i className="fas fa-sign-out-alt" style={{ marginRight: 8 }} />Sign Out
              </button>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: 14 }}>Lost your code? Please see a children&apos;s leader.</p>
          </div>
        </div>
      )}

      {/* Already signed in modal */}
      {alreadyInModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '32px 28px', maxWidth: 380, width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <i className="fas fa-exclamation-triangle" style={{ fontSize: 24, color: '#d97706' }} />
            </div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: NAV, marginBottom: 10 }}>Already Signed In</h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: 24 }}>
              {alreadyInModal.firstName}, you are already signed in today.<br />Would you like to sign out instead?
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setAlreadyInModal(null)}
                style={{ flex: 1, padding: '13px', border: '1.5px solid #e2e8f0', background: '#fff', borderRadius: 12, fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', color: '#374151' }}>
                Cancel
              </button>
              <button onClick={() => { const m = alreadyInModal; setAlreadyInModal(null); performSignOut({ attendanceId: m.attendanceId, firstName: m.firstName }); }}
                style={{ flex: 1, padding: '13px', border: 'none', background: NAV, borderRadius: 12, fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer', color: '#fff' }}>
                <i className="fas fa-sign-out-alt" style={{ marginRight: 8 }} />Sign Out Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
