'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';

const NAV = '#1e3a5f';
const GOLD = '#f59e0b';
const GREEN = '#22c55e';
const IDLE_SECS = 45;

function genCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

const TABS = ['Sign In', 'Visitors', 'Children', 'Sign Out'];

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
  const idleRef = useRef(null);
  const countdownRef = useRef(null);
  const searchRef = useRef(null);
  const rootRef = useRef(null);

  useEffect(() => {
    fetch(`/api/churches?slug=${slug}`).then(r => r.json()).then(d => setChurch(d.church));
  }, [slug]);

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

  const searchMembers = async (q) => {
    setQuery(q);
    if (q.length < 2) { setResults([]); return; }
    if (!church) return;

    if (signOutModeRef.current) {
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(`/api/attendance?churchId=${church.id}&from=${today}&to=${today}`);
      const d = await res.json();
      const ql = q.toLowerCase();
      const filtered = (d.records || []).filter(r => {
        if (r.sign_out_time) return false;
        const name = r.visitor_name || (r.cc_members ? `${r.cc_members.first_name} ${r.cc_members.last_name}` : '');
        return name.toLowerCase().includes(ql);
      });
      setResults(filtered.map(r => ({
        attendanceId: r.id,
        first_name: r.visitor_name || r.cc_members?.first_name || 'Unknown',
        last_name: r.visitor_name ? '' : (r.cc_members?.last_name || ''),
        member_type: r.visitor_type,
      })));
      return;
    }

    const res = await fetch(`/api/members?churchId=${church.id}&search=${encodeURIComponent(q)}`);
    const d = await res.json();
    setResults(d.members || []);
  };

  const selectMember = (m) => { setSelected(m); setMode('found'); touch(); };

  const signIn = async (opts = {}) => {
    setSubmitting(true);
    touch();
    await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        churchId: church.id,
        memberId: opts.memberId || null,
        visitorName: opts.visitorName || null,
        visitorType: opts.visitorType || 'adult',
        eventId: selectedEvent || null,
        notes: opts.notes || null,
      }),
    });
    setSubmitting(false);
    setDoneMsg(opts.doneMsg || 'You are signed in!');
    setPickupCode(opts.pickupCode || '');
    setMode('done');
    touch();
  };

  const signOut = async () => {
    if (!selected) return;
    setSubmitting(true);
    touch();
    let recordId = selected.attendanceId || null;
    if (!recordId) {
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(`/api/attendance?churchId=${church.id}&from=${today}&to=${today}`);
      const d = await res.json();
      const record = (d.records || []).find(r => r.member_id === selected.id && !r.sign_out_time);
      recordId = record?.id || null;
    }
    if (recordId) {
      await fetch('/api/attendance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: recordId, signOutTime: new Date().toISOString() }),
      });
    }
    setSubmitting(false);
    setDoneMsg(recordId ? `Goodbye, ${selected.first_name}! See you next time.` : `${selected.first_name} was not signed in today.`);
    signOutModeRef.current = false; setSignOutMode(false);
    setMode('done');
    touch();
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
        <button onClick={toggleFullscreen}
          style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
          <i className={`fas fa-${fullscreen ? 'compress' : 'expand'}`} style={{ marginRight: 6 }} />
          {fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        </button>
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
              <button onClick={() => setMode('newChild')}
                style={{ width: '100%', background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: 14, padding: '18px', fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer' }}>
                <i className="fas fa-child" style={{ marginRight: 10 }} />Check in a child
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
              const code = genCode();
              const notes = JSON.stringify({ pickupCode: code, guardianName: childForm.guardianName, guardianPhone: childForm.guardianPhone, allergies: childForm.allergies });
              signIn({ visitorName: childForm.childName, visitorType: 'child', notes, doneMsg: `${childForm.childName} is checked in!`, pickupCode: code });
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
    </div>
  );
}
