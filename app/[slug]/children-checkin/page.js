'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';

const NAV = '#1e3a5f';
const GOLD = '#f59e0b';
const GREEN = '#22c55e';

export default function ChildrenCheckin() {
  const { slug } = useParams();
  const [church, setChurch] = useState(null);
  const [mode, setMode] = useState('home'); // home | search | new | confirm | done
  const [query, setQuery] = useState('');
  const [members, setMembers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ childName: '', guardianName: '', guardianPhone: '', allergies: '' });
  const [pickupCode, setPickupCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const resetRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    fetch(`/api/churches?slug=${slug}`).then(r => r.json()).then(d => setChurch(d.church));
  }, [slug]);

  const scheduleReset = () => {
    if (resetRef.current) clearTimeout(resetRef.current);
    resetRef.current = setTimeout(() => {
      setMode('home'); setQuery(''); setMembers([]); setSelected(null);
      setForm({ childName: '', guardianName: '', guardianPhone: '', allergies: '' });
      setPickupCode('');
    }, 15000);
  };

  const cancelReset = () => { if (resetRef.current) clearTimeout(resetRef.current); };

  useEffect(() => () => cancelReset(), []);

  const goSearch = () => { setMode('search'); setQuery(''); setMembers([]); setTimeout(() => searchRef.current?.focus(), 100); };

  const searchMembers = async (q) => {
    setQuery(q);
    if (q.length < 2) { setMembers([]); return; }
    if (!church) return;
    const res = await fetch(`/api/kiosk?action=members&churchId=${church.id}&q=${encodeURIComponent(q)}`);
    const d = await res.json();
    setMembers((d.members || []).filter(m => m.member_type === 'child' || m.member_type === 'youth'));
  };

  const selectMember = (m) => {
    setSelected(m);
    setForm(f => ({ ...f, childName: `${m.first_name} ${m.last_name}` }));
    setMode('confirm');
  };

  const goNew = () => { setSelected(null); setForm({ childName: '', guardianName: '', guardianPhone: '', allergies: '' }); setMode('new'); };

  const goConfirm = () => setMode('confirm');

  const submit = async () => {
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await fetch('/api/kiosk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'checkin',
          churchId: church.id,
          memberId: selected?.id || null,
          visitorName: form.childName,
          visitorType: 'child',
          guardianName: form.guardianName,
          guardianPhone: form.guardianPhone,
          allergies: form.allergies,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error();
      if (data.alreadyIn) {
        setSubmitError("This child is already checked in today. Please see a children's leader if you need help.");
        setSubmitting(false);
        return;
      }
      setPickupCode(data.pickupCode || '');
      setMode('done');
      scheduleReset();
    } catch {
      setSubmitError("Could not check in. Please see a children's leader.");
    }
    setSubmitting(false);
  };

  const reset = () => {
    cancelReset();
    setMode('home'); setQuery(''); setMembers([]); setSelected(null);
    setForm({ childName: '', guardianName: '', guardianPhone: '', allergies: '' });
    setPickupCode('');
  };

  if (!church) return (
    <div style={{ minHeight: '100vh', background: NAV, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'rgba(255,255,255,0.6)' }}>Loading…</p>
    </div>
  );

  const inp = { width: '100%', padding: '16px 18px', border: '2px solid #e2e8f0', borderRadius: 14, fontSize: '1.1rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' };
  const lbl = { fontSize: '0.85rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(145deg, #0f2744 0%, #1e3a5f 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="fas fa-child" style={{ color: NAV, fontSize: 22 }} />
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 900, fontSize: '1.2rem' }}>CHILDREN<span style={{ color: GOLD }}> CHECK-IN</span></div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>{church.name}</div>
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 24, padding: '40px 36px', width: '100%', maxWidth: 520, boxShadow: '0 24px 80px rgba(0,0,0,0.3)' }}>

        {/* HOME */}
        {mode === 'home' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>👶</div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: NAV, marginBottom: 8 }}>Welcome!</h1>
            <p style={{ color: '#64748b', marginBottom: 32, fontSize: '0.95rem' }}>Check in your child for today's session.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button onClick={goSearch} style={{ background: NAV, color: '#fff', border: 'none', borderRadius: 14, padding: '18px', fontSize: '1.05rem', fontWeight: 700, cursor: 'pointer', width: '100%' }}>
                <i className="fas fa-magnifying-glass" style={{ marginRight: 10 }} />Find my child
              </button>
              <button onClick={goNew} style={{ background: GOLD, color: NAV, border: 'none', borderRadius: 14, padding: '18px', fontSize: '1.05rem', fontWeight: 700, cursor: 'pointer', width: '100%' }}>
                <i className="fas fa-plus" style={{ marginRight: 10 }} />New visitor
              </button>
            </div>
          </div>
        )}

        {/* SEARCH */}
        {mode === 'search' && (
          <div>
            <button onClick={() => setMode('home')} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', marginBottom: 20, fontSize: '0.9rem', padding: 0 }}>
              <i className="fas fa-arrow-left" style={{ marginRight: 8 }} />Back
            </button>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: NAV, marginBottom: 6 }}>Find your child</h2>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 20 }}>Search by first or last name.</p>
            <input ref={searchRef} value={query} onChange={e => searchMembers(e.target.value)} placeholder="Type a name…" style={inp} autoComplete="off" />
            {members.length > 0 && (
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {members.map(m => (
                  <button key={m.id} onClick={() => selectMember(m)}
                    style={{ background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: 12, padding: '14px 18px', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }}>
                    <div style={{ fontWeight: 700, color: NAV, fontSize: '1rem' }}>{m.first_name} {m.last_name}</div>
                    <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: 2, textTransform: 'capitalize' }}>{m.member_type}</div>
                  </button>
                ))}
              </div>
            )}
            {query.length >= 2 && members.length === 0 && (
              <div style={{ marginTop: 20, textAlign: 'center' }}>
                <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 12 }}>No results found.</p>
                <button onClick={goNew} style={{ background: GOLD, color: NAV, border: 'none', borderRadius: 12, padding: '12px 24px', fontWeight: 700, cursor: 'pointer' }}>
                  <i className="fas fa-plus" style={{ marginRight: 8 }} />Add as new visitor
                </button>
              </div>
            )}
          </div>
        )}

        {/* NEW */}
        {mode === 'new' && (
          <div>
            <button onClick={() => setMode('home')} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', marginBottom: 20, fontSize: '0.9rem', padding: 0 }}>
              <i className="fas fa-arrow-left" style={{ marginRight: 8 }} />Back
            </button>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: NAV, marginBottom: 20 }}>Child details</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={lbl}>Child's full name *</label>
                <input style={inp} value={form.childName} onChange={e => setForm(f => ({ ...f, childName: e.target.value }))} placeholder="First and last name" />
              </div>
              <div>
                <label style={lbl}>Guardian's name *</label>
                <input style={inp} value={form.guardianName} onChange={e => setForm(f => ({ ...f, guardianName: e.target.value }))} placeholder="Your name" />
              </div>
              <div>
                <label style={lbl}>Guardian's phone</label>
                <input style={inp} value={form.guardianPhone} onChange={e => setForm(f => ({ ...f, guardianPhone: e.target.value }))} placeholder="Phone number" type="tel" />
              </div>
              <div>
                <label style={lbl}>Allergies or medical notes</label>
                <input style={inp} value={form.allergies} onChange={e => setForm(f => ({ ...f, allergies: e.target.value }))} placeholder="None" />
              </div>
            </div>
            <button onClick={goConfirm} disabled={!form.childName || !form.guardianName}
              style={{ width: '100%', background: !form.childName || !form.guardianName ? '#94a3b8' : NAV, color: '#fff', border: 'none', borderRadius: 14, padding: '18px', fontSize: '1.05rem', fontWeight: 700, cursor: !form.childName || !form.guardianName ? 'not-allowed' : 'pointer', marginTop: 24 }}>
              Continue
            </button>
          </div>
        )}

        {/* CONFIRM */}
        {mode === 'confirm' && (
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: NAV, marginBottom: 6 }}>Confirm check-in</h2>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 24 }}>Please check the details below.</p>
            <div style={{ background: '#f8fafc', borderRadius: 14, padding: '20px', marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Child</span>
                <span style={{ fontWeight: 700, color: '#1e293b' }}>{form.childName || (selected ? `${selected.first_name} ${selected.last_name}` : '')}</span>
              </div>
              {form.guardianName && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Guardian</span>
                  <span style={{ fontWeight: 600, color: '#1e293b' }}>{form.guardianName}</span>
                </div>
              )}
              {form.allergies && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#ef4444', fontSize: '0.875rem', fontWeight: 600 }}>Allergies</span>
                  <span style={{ fontWeight: 600, color: '#ef4444' }}>{form.allergies}</span>
                </div>
              )}
            </div>
            {submitError && <p style={{ color: '#dc2626', fontSize: '0.85rem', marginBottom: 12 }}>{submitError}</p>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setMode(selected ? 'search' : 'new')} style={{ flex: 1, background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 12, padding: '14px', fontWeight: 600, cursor: 'pointer' }}>Edit</button>
              <button onClick={submit} disabled={submitting}
                style={{ flex: 2, background: submitting ? '#94a3b8' : GREEN, color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', fontSize: '1rem' }}>
                {submitting ? 'Checking in…' : 'Check In'}
              </button>
            </div>
          </div>
        )}

        {/* DONE */}
        {mode === 'done' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: GREEN + '1a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <i className="fas fa-check" style={{ fontSize: 32, color: GREEN }} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: NAV, marginBottom: 6 }}>Checked in!</h2>
            <p style={{ color: '#64748b', marginBottom: 28, fontSize: '0.9rem' }}>
              <strong>{form.childName}</strong> is all set.
            </p>
            <div style={{ background: GOLD + '1a', border: `2px solid ${GOLD}`, borderRadius: 16, padding: '24px', marginBottom: 28 }}>
              <div style={{ color: '#92400e', fontSize: '0.85rem', fontWeight: 600, marginBottom: 8 }}>YOUR PICKUP CODE</div>
              <div style={{ fontSize: '3rem', fontWeight: 900, fontFamily: 'monospace', color: NAV, letterSpacing: 12 }}>{pickupCode}</div>
              <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: 8 }}>Show this code when collecting your child.</div>
            </div>
            <button onClick={reset} style={{ background: NAV, color: '#fff', border: 'none', borderRadius: 14, padding: '16px 32px', fontWeight: 700, cursor: 'pointer', fontSize: '1rem' }}>
              Done
            </button>
            <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: 12 }}>Resets automatically in 15 seconds</div>
          </div>
        )}
      </div>
    </div>
  );
}
