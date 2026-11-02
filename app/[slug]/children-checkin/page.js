'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';

const NAV = '#1e3a5f';
const GOLD = '#f59e0b';
const GREEN = '#22c55e';
const CHILD_GROUPS = ['Nursery (0-2)', 'Toddlers (3-4)', 'Kids (5-8)', 'Pre-teen (9-12)'];

export default function ChildrenCheckin() {
  const { slug } = useParams();
  const [church, setChurch] = useState(null);
  // step: home | guardian | children | confirm | done
  const [step, setStep] = useState('home');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [prevChildren, setPrevChildren] = useState([]); // [{name, group, selected}]
  const [newChildren, setNewChildren] = useState([]);   // [{name, group, allergies}]
  const [searching, setSearching] = useState(false);
  const [pickupCode, setPickupCode] = useState('');
  const [doneChildren, setDoneChildren] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const resetRef = useRef(null);
  const guardianRef = useRef(null);
  const lookupRef = useRef(null);

  useEffect(() => {
    fetch(`/api/churches?slug=${slug}`).then(r => r.json()).then(d => setChurch(d.church));
  }, [slug]);

  const scheduleReset = () => {
    if (resetRef.current) clearTimeout(resetRef.current);
    resetRef.current = setTimeout(doReset, 20000);
  };

  const doReset = () => {
    if (resetRef.current) clearTimeout(resetRef.current);
    setStep('home'); setGuardianName(''); setGuardianPhone('');
    setPrevChildren([]); setNewChildren([]); setPickupCode('');
    setDoneChildren([]); setError('');
  };

  useEffect(() => () => { if (resetRef.current) clearTimeout(resetRef.current); }, []);

  const lookupFamily = (name) => {
    clearTimeout(lookupRef.current);
    if (name.length < 2) { setPrevChildren([]); setSearching(false); return; }
    setSearching(true);
    lookupRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/kiosk?action=family&churchId=${church.id}&guardian=${encodeURIComponent(name)}`);
        const d = await res.json();
        setPrevChildren((d.children || []).map(c => ({ name: c.name, group: c.group || '', allergies: c.allergies || '', selected: true })));
      } catch { /* ignore */ }
      setSearching(false);
    }, 600);
  };

  const handleGuardianName = (v) => {
    setGuardianName(v);
    lookupFamily(v);
  };

  const goChildren = () => {
    if (!guardianName.trim()) return;
    if (prevChildren.length === 0 && newChildren.length === 0) {
      setNewChildren([{ name: '', group: '', allergies: '' }]);
    }
    setStep('children');
  };

  const togglePrev = (i) => setPrevChildren(p => p.map((c, j) => j === i ? { ...c, selected: !c.selected } : c));
  const updateNew = (i, field, val) => setNewChildren(p => p.map((c, j) => j === i ? { ...c, [field]: val } : c));
  const addChild = () => setNewChildren(p => [...p, { name: '', group: '', allergies: '' }]);
  const removeNew = (i) => setNewChildren(p => p.filter((_, j) => j !== i));

  const goConfirm = () => {
    const checklist = [
      ...prevChildren.filter(c => c.selected),
      ...newChildren.filter(c => c.name.trim()),
    ];
    if (checklist.length === 0) { setError('Please select at least one child.'); return; }
    setError('');
    setStep('confirm');
  };

  const submit = async () => {
    setSubmitting(true); setError('');
    const checklist = [
      ...prevChildren.filter(c => c.selected).map(c => ({ name: c.name, group: c.group, allergies: c.allergies })),
      ...newChildren.filter(c => c.name.trim()).map(c => ({ name: c.name.trim(), group: c.group, allergies: c.allergies })),
    ];
    try {
      const res = await fetch('/api/kiosk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'family',
          churchId: church.id,
          guardianName: guardianName.trim(),
          guardianPhone: guardianPhone.trim(),
          prevChildren: prevChildren.filter(c => c.selected).map(c => c.name),
          newChildren: newChildren.filter(c => c.name.trim()).map(c => ({ name: c.name.trim(), group: c.group, allergies: c.allergies })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Check-in failed');
      setPickupCode(data.pickupCode || '');
      setDoneChildren(checklist);
      setStep('done');
      scheduleReset();
    } catch (e) {
      setError(e.message || "Could not check in. Please see a children's leader.");
    }
    setSubmitting(false);
  };

  if (!church) return (
    <div style={{ minHeight: '100vh', background: NAV, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'rgba(255,255,255,0.6)' }}>Loading…</p>
    </div>
  );

  const inp = { width: '100%', padding: '16px 18px', border: '2px solid #e2e8f0', borderRadius: 14, fontSize: '1.1rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' };
  const lbl = { fontSize: '0.85rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 };
  const checklistTotal = prevChildren.filter(c => c.selected).length + newChildren.filter(c => c.name.trim()).length;

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

      <div style={{ background: '#fff', borderRadius: 24, padding: '40px 36px', width: '100%', maxWidth: 540, boxShadow: '0 24px 80px rgba(0,0,0,0.3)' }}>

        {/* HOME */}
        {step === 'home' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>👶</div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: NAV, marginBottom: 8 }}>Welcome!</h1>
            <p style={{ color: '#64748b', marginBottom: 32, fontSize: '0.95rem' }}>Check in your child for today's session.</p>
            <button onClick={() => { setStep('guardian'); setTimeout(() => guardianRef.current?.focus(), 100); }}
              style={{ background: NAV, color: '#fff', border: 'none', borderRadius: 14, padding: '18px', fontSize: '1.05rem', fontWeight: 700, cursor: 'pointer', width: '100%' }}>
              <i className="fas fa-user-check" style={{ marginRight: 10 }} />Start check-in
            </button>
          </div>
        )}

        {/* GUARDIAN */}
        {step === 'guardian' && (
          <div>
            <button onClick={() => setStep('home')} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', marginBottom: 20, fontSize: '0.9rem', padding: 0 }}>
              <i className="fas fa-arrow-left" style={{ marginRight: 8 }} />Back
            </button>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: NAV, marginBottom: 6 }}>Your name</h2>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 20 }}>Enter your name to find your children.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={lbl}>Your name *</label>
                <input ref={guardianRef} style={inp} value={guardianName} onChange={e => handleGuardianName(e.target.value)} placeholder="First and last name" autoComplete="off" />
              </div>
              <div>
                <label style={lbl}>Phone (optional)</label>
                <input style={inp} value={guardianPhone} onChange={e => setGuardianPhone(e.target.value)} placeholder="For urgent contact" type="tel" />
              </div>
            </div>
            {searching && <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: 10 }}>Looking up your children…</p>}
            {prevChildren.length > 0 && (
              <div style={{ marginTop: 16, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '12px 16px' }}>
                <p style={{ color: '#166534', fontSize: '0.8rem', fontWeight: 700, marginBottom: 6 }}>
                  <i className="fas fa-check-circle" style={{ marginRight: 6 }} />Found {prevChildren.length} child{prevChildren.length !== 1 ? 'ren' : ''} from previous visits
                </p>
                {prevChildren.map((c, i) => (
                  <div key={i} style={{ color: '#15803d', fontSize: '0.9rem', padding: '2px 0' }}>· {c.name}</div>
                ))}
              </div>
            )}
            <button onClick={goChildren} disabled={!guardianName.trim()}
              style={{ width: '100%', background: !guardianName.trim() ? '#94a3b8' : NAV, color: '#fff', border: 'none', borderRadius: 14, padding: '18px', fontSize: '1.05rem', fontWeight: 700, cursor: !guardianName.trim() ? 'not-allowed' : 'pointer', marginTop: 24 }}>
              Next
            </button>
          </div>
        )}

        {/* CHILDREN */}
        {step === 'children' && (
          <div>
            <button onClick={() => setStep('guardian')} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', marginBottom: 20, fontSize: '0.9rem', padding: 0 }}>
              <i className="fas fa-arrow-left" style={{ marginRight: 8 }} />Back
            </button>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: NAV, marginBottom: 4 }}>Select children</h2>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 20 }}>Tick the children checking in today.</p>

            {prevChildren.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: 10 }}>RETURNING CHILDREN</p>
                {prevChildren.map((c, i) => (
                  <div key={i} onClick={() => togglePrev(i)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, border: `2px solid ${c.selected ? NAV : '#e2e8f0'}`, marginBottom: 8, cursor: 'pointer', background: c.selected ? NAV + '08' : '#fff' }}>
                    <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${c.selected ? NAV : '#cbd5e1'}`, background: c.selected ? NAV : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {c.selected && <i className="fas fa-check" style={{ color: '#fff', fontSize: 11 }} />}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#1e293b' }}>{c.name}</div>
                      {c.group && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.group}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {newChildren.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: 10 }}>NEW CHILDREN</p>
                {newChildren.map((c, i) => (
                  <div key={i} style={{ background: '#f8fafc', borderRadius: 12, padding: '14px 16px', marginBottom: 10, border: '1.5px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Child {i + 1}</span>
                      {newChildren.length > 1 && <button onClick={() => removeNew(i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', padding: 0 }}>Remove</button>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <input style={{ ...inp, padding: '11px 14px', fontSize: '0.95rem' }} value={c.name} onChange={e => updateNew(i, 'name', e.target.value)} placeholder="Child's full name *" />
                      <select style={{ ...inp, padding: '11px 14px', fontSize: '0.95rem', color: c.group ? '#1e293b' : '#94a3b8' }} value={c.group} onChange={e => updateNew(i, 'group', e.target.value)}>
                        <option value="">Age group</option>
                        {CHILD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                      <input style={{ ...inp, padding: '11px 14px', fontSize: '0.95rem' }} value={c.allergies} onChange={e => updateNew(i, 'allergies', e.target.value)} placeholder="Allergies / medical notes (optional)" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button onClick={addChild} style={{ background: 'transparent', color: NAV, border: `2px dashed ${NAV}`, borderRadius: 12, padding: '12px', width: '100%', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem', marginBottom: 16 }}>
              <i className="fas fa-plus" style={{ marginRight: 8 }} />Add {newChildren.length > 0 || prevChildren.length > 0 ? 'another' : 'a'} child
            </button>

            {error && <p style={{ color: '#dc2626', fontSize: '0.85rem', marginBottom: 10 }}>{error}</p>}
            <button onClick={goConfirm} disabled={checklistTotal === 0}
              style={{ width: '100%', background: checklistTotal === 0 ? '#94a3b8' : NAV, color: '#fff', border: 'none', borderRadius: 14, padding: '18px', fontSize: '1.05rem', fontWeight: 700, cursor: checklistTotal === 0 ? 'not-allowed' : 'pointer' }}>
              Continue ({checklistTotal} {checklistTotal === 1 ? 'child' : 'children'})
            </button>
          </div>
        )}

        {/* CONFIRM */}
        {step === 'confirm' && (
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: NAV, marginBottom: 6 }}>Confirm check-in</h2>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 20 }}>Please check the details below.</p>
            <div style={{ background: '#f8fafc', borderRadius: 14, padding: '16px 20px', marginBottom: 20 }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 6, fontWeight: 600 }}>GUARDIAN</div>
              <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: 16 }}>{guardianName}{guardianPhone && ` · ${guardianPhone}`}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 8, fontWeight: 600 }}>CHILDREN</div>
              {[...prevChildren.filter(c => c.selected), ...newChildren.filter(c => c.name.trim())].map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderTop: i > 0 ? '1px solid #e2e8f0' : 'none' }}>
                  <i className="fas fa-child" style={{ color: GOLD, fontSize: 14 }} />
                  <div>
                    <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.95rem' }}>{c.name}</div>
                    {(c.group || c.allergies) && <div style={{ fontSize: '0.75rem', color: c.allergies ? '#ef4444' : '#64748b' }}>{c.group}{c.group && c.allergies ? ' · ' : ''}{c.allergies && `⚠ ${c.allergies}`}</div>}
                  </div>
                </div>
              ))}
            </div>
            {error && <p style={{ color: '#dc2626', fontSize: '0.85rem', marginBottom: 10 }}>{error}</p>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep('children')} style={{ flex: 1, background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 12, padding: '14px', fontWeight: 600, cursor: 'pointer' }}>Edit</button>
              <button onClick={submit} disabled={submitting}
                style={{ flex: 2, background: submitting ? '#94a3b8' : GREEN, color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', fontSize: '1rem' }}>
                {submitting ? 'Checking in…' : 'Check In'}
              </button>
            </div>
          </div>
        )}

        {/* DONE */}
        {step === 'done' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: GREEN + '1a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <i className="fas fa-check" style={{ fontSize: 32, color: GREEN }} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: NAV, marginBottom: 6 }}>Checked in!</h2>
            <p style={{ color: '#64748b', marginBottom: 20, fontSize: '0.9rem' }}>
              {doneChildren.length === 1 ? <><strong>{doneChildren[0].name}</strong> is all set.</> : <><strong>{doneChildren.length} children</strong> are checked in.</>}
            </p>
            <div style={{ background: GOLD + '1a', border: `2px solid ${GOLD}`, borderRadius: 16, padding: '24px', marginBottom: 28 }}>
              <div style={{ color: '#92400e', fontSize: '0.85rem', fontWeight: 600, marginBottom: 8 }}>YOUR PICKUP CODE</div>
              <div style={{ fontSize: '3rem', fontWeight: 900, fontFamily: 'monospace', color: NAV, letterSpacing: 12 }}>{pickupCode}</div>
              <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: 8 }}>Show this code when collecting your child.</div>
            </div>
            <button onClick={doReset} style={{ background: NAV, color: '#fff', border: 'none', borderRadius: 14, padding: '16px 32px', fontWeight: 700, cursor: 'pointer', fontSize: '1rem' }}>
              Done
            </button>
            <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: 12 }}>Resets automatically in 20 seconds</div>
          </div>
        )}
      </div>
    </div>
  );
}
