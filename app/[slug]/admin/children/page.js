'use client';
import { useState, useEffect, useRef } from 'react';
import { useCC } from '../layout';

const NAV = '#1e3a5f';
const GOLD = '#f59e0b';

export default function Children() {
  const ctx = useCC();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(null);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [pickedUp, setPickedUp] = useState(null);
  const intervalRef = useRef(null);

  const load = () => {
    if (!ctx) return;
    const { church, token } = ctx;
    const today = new Date().toISOString().split('T')[0];
    fetch(`/api/attendance?churchId=${church.id}&from=${today}&to=${today}&visitorType=child`, {
      headers: { 'Authorization': `Bearer ${token}` },
    }).then(r => r.json()).then(d => {
      setRecords(d.records || []);
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
    intervalRef.current = setInterval(load, 30000);
    return () => clearInterval(intervalRef.current);
  }, [ctx]);

  const parseNotes = (notes) => {
    try { return JSON.parse(notes || '{}'); } catch { return {}; }
  };

  const verifyPickup = (record) => {
    setVerifying(record);
    setCode('');
    setCodeError('');
  };

  const confirmPickup = async () => {
    const notes = parseNotes(verifying.notes);
    if (code.trim() !== String(notes.pickupCode)) {
      setCodeError('Incorrect code. Please try again.');
      return;
    }
    const { token } = ctx;
    await fetch('/api/attendance', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ id: verifying.id, signOutTime: new Date().toISOString() }),
    });
    setPickedUp(verifying.visitor_name || 'Child');
    setVerifying(null);
    setTimeout(() => { setPickedUp(null); load(); }, 3000);
  };

  const checkedIn = records.filter(r => !r.sign_out_time);
  const checkedOut = records.filter(r => r.sign_out_time);

  if (!ctx || loading) return (
    <div style={{ padding: '32px 28px', color: '#64748b' }}>Loading children check-in…</div>
  );

  return (
    <div style={{ padding: '32px 28px', maxWidth: 900 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: NAV }}>Children Check-In</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Auto-refreshes every 30s</span>
          <button onClick={load} style={{ background: '#f1f5f9', color: NAV, border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '7px 14px', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>
            <i className="fas fa-rotate" style={{ marginRight: 6 }} />Refresh
          </button>
        </div>
      </div>
      <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: 24 }}>
        Today — {checkedIn.length} checked in, {checkedOut.length} picked up
      </p>

      {pickedUp && (
        <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 12, padding: '14px 20px', marginBottom: 20, color: '#15803d', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
          <i className="fas fa-check-circle" />
          {pickedUp} has been picked up and signed out successfully.
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', marginBottom: 20 }}>
        <div style={{ padding: '14px 20px', background: '#f8fafc', borderBottom: '2px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} />
          <span style={{ fontWeight: 700, color: NAV, fontSize: '0.9rem' }}>Currently checked in ({checkedIn.length})</span>
        </div>
        {checkedIn.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>No children currently checked in.</div>
        ) : checkedIn.map(r => {
          const notes = parseNotes(r.notes);
          return (
            <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem' }}>{r.visitor_name}</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>
                  Signed in {new Date(r.sign_in_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  {notes.guardianName && ` · Guardian: ${notes.guardianName}`}
                  {notes.allergies && <span style={{ color: '#ef4444', fontWeight: 600 }}> · Allergies: {notes.allergies}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {notes.pickupCode && (
                  <div style={{ background: GOLD + '22', color: '#92400e', borderRadius: 8, padding: '6px 14px', fontWeight: 800, fontSize: '1.1rem', letterSpacing: 4, fontFamily: 'monospace' }}>
                    {notes.pickupCode}
                  </div>
                )}
                <button onClick={() => verifyPickup(r)}
                  style={{ background: NAV, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}>
                  <i className="fas fa-person-walking-arrow-right" style={{ marginRight: 6 }} />Pick Up
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {checkedOut.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ padding: '14px 20px', background: '#f8fafc', borderBottom: '2px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#94a3b8' }} />
            <span style={{ fontWeight: 700, color: '#64748b', fontSize: '0.9rem' }}>Picked up today ({checkedOut.length})</span>
          </div>
          {checkedOut.map(r => (
            <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid #f1f5f9', opacity: 0.6 }}>
              <div style={{ fontWeight: 600, color: '#64748b', fontSize: '0.875rem' }}>{r.visitor_name}</div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Picked up {new Date(r.sign_out_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
        </div>
      )}

      {verifying && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '36px 32px', width: '100%', maxWidth: 400, textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: GOLD + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <i className="fas fa-shield-halved" style={{ fontSize: 28, color: GOLD }} />
            </div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: NAV, marginBottom: 6 }}>Verify Pickup</h2>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 24 }}>Enter the 4-digit pickup code for <strong>{verifying.visitor_name}</strong></p>
            <input
              value={code}
              onChange={e => { setCode(e.target.value); setCodeError(''); }}
              onKeyDown={e => e.key === 'Enter' && confirmPickup()}
              placeholder="0000"
              maxLength={4}
              autoFocus
              style={{ width: '100%', padding: '16px', border: `2px solid ${codeError ? '#ef4444' : '#dde3f0'}`, borderRadius: 12, fontSize: '2rem', textAlign: 'center', fontFamily: 'monospace', letterSpacing: 8, outline: 'none', boxSizing: 'border-box', marginBottom: 10 }}
            />
            {codeError && <div style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: 16 }}>{codeError}</div>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setVerifying(null)} style={{ flex: 1, background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 10, padding: '12px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={confirmPickup} disabled={code.length < 4}
                style={{ flex: 1, background: code.length >= 4 ? '#22c55e' : '#94a3b8', color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontWeight: 700, cursor: code.length >= 4 ? 'pointer' : 'not-allowed' }}>
                Confirm Pickup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
