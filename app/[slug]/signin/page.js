'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

const NAV = '#1e3a5f';
const GOLD = '#f59e0b';

export default function Kiosk() {
  const { slug } = useParams();
  const [church, setChurch] = useState(null);
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState('search'); // search | confirm | done | visitor
  const [selected, setSelected] = useState(null);
  const [action, setAction] = useState('in'); // in | out
  const [message, setMessage] = useState('');
  const [visitor, setVisitor] = useState({ name: '', type: 'adult' });

  useEffect(() => {
    fetch(`/api/churches?slug=${slug}`).then(r => r.json()).then(d => setChurch(d.church || null));
  }, [slug]);

  useEffect(() => {
    if (!search.trim() || !church) { setMembers([]); return; }
    const t = setTimeout(() => {
      fetch(`/api/members?churchId=${church.id}&search=${encodeURIComponent(search)}`).then(r => r.json()).then(d => setMembers(d.members || []));
    }, 300);
    return () => clearTimeout(t);
  }, [search, church]);

  const signIn = async (memberId, visitorName, visitorType) => {
    const body = { churchId: church.id, memberId: memberId || null, visitorName: visitorName || null, visitorType: visitorType || 'member' };
    await fetch('/api/attendance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const name = selected ? `${selected.first_name} ${selected.last_name}` : visitorName;
    setMessage(`Welcome, ${name}! ✓`);
    setMode('done');
    setTimeout(() => { setMode('search'); setSearch(''); setSelected(null); setMessage(''); setVisitor({ name: '', type: 'adult' }); }, 3000);
  };

  const signOut = async (memberId) => {
    const recs = await fetch(`/api/attendance?churchId=${church.id}&memberId=${memberId}&status=in`).then(r => r.json());
    if (recs.records && recs.records.length) {
      await fetch('/api/attendance', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: recs.records[0].id }) });
    }
    setMessage(`Goodbye, ${selected.first_name}! See you soon.`);
    setMode('done');
    setTimeout(() => { setMode('search'); setSearch(''); setSelected(null); setMessage(''); }, 3000);
  };

  const primary = church?.primary_color || NAV;

  if (!church) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <p style={{ color: '#64748b' }}>Loading…</p>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', display: 'flex', flexDirection: 'column' }}>
      <header style={{ background: primary, padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.3rem' }}>{church.name}</div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>Sign in / out</div>
        </div>
        <button onClick={() => window.location.href = `/${slug}/first-timer`}
          style={{ background: GOLD, color: NAV, border: 'none', borderRadius: 10, padding: '10px 18px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>
          <i className="fas fa-user-plus" style={{ marginRight: 6 }} />First timer
        </button>
      </header>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>

        {mode === 'done' && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.3s ease' }}>
            <div style={{ fontSize: 72, marginBottom: 16 }}>✅</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: primary }}>{message}</div>
          </div>
        )}

        {mode === 'search' && (
          <div style={{ width: '100%', maxWidth: 560 }}>
            <h2 style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 800, color: primary, marginBottom: 24 }}>Find your name</h2>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Type your first or last name…"
              autoFocus
              style={{ width: '100%', padding: '18px 20px', fontSize: '1.2rem', borderRadius: 14, border: `2px solid ${primary}`, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
            {members.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 12, marginTop: 8, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
                {members.map(m => (
                  <div key={m.id} onClick={() => { setSelected(m); setMode('confirm'); }}
                    style={{ padding: '16px 20px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '1.05rem' }}>{m.first_name} {m.last_name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'capitalize' }}>{m.member_type}</div>
                    </div>
                    <i className="fas fa-chevron-right" style={{ color: '#cbd5e1' }} />
                  </div>
                ))}
              </div>
            )}
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <button onClick={() => setMode('visitor')}
                style={{ background: 'transparent', color: '#64748b', border: '1.5px solid #cbd5e1', borderRadius: 10, padding: '10px 20px', cursor: 'pointer', fontSize: '0.9rem' }}>
                I'm a visitor — not in the system
              </button>
            </div>
          </div>
        )}

        {mode === 'confirm' && selected && (
          <div style={{ width: '100%', maxWidth: 440, textAlign: 'center' }}>
            <div style={{ background: '#fff', borderRadius: 16, padding: '32px 24px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', marginBottom: 16 }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: primary, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 32, color: '#fff', fontWeight: 800 }}>
                {selected.first_name[0]}{selected.last_name[0]}
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>{selected.first_name} {selected.last_name}</div>
              <div style={{ color: '#64748b', textTransform: 'capitalize', marginBottom: 28 }}>{selected.member_type}</div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 16 }}>
                <button onClick={() => signIn(selected.id)}
                  style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 28px', fontWeight: 700, cursor: 'pointer', fontSize: '1rem', flex: 1 }}>
                  <i className="fas fa-sign-in-alt" style={{ marginRight: 8 }} />Sign In
                </button>
                <button onClick={() => signOut(selected.id)}
                  style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 28px', fontWeight: 700, cursor: 'pointer', fontSize: '1rem', flex: 1 }}>
                  <i className="fas fa-sign-out-alt" style={{ marginRight: 8 }} />Sign Out
                </button>
              </div>
            </div>
            <button onClick={() => { setSelected(null); setMode('search'); }}
              style={{ background: 'transparent', color: '#64748b', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}>
              ← Back
            </button>
          </div>
        )}

        {mode === 'visitor' && (
          <div style={{ width: '100%', maxWidth: 420 }}>
            <h2 style={{ textAlign: 'center', fontSize: '1.4rem', fontWeight: 800, color: primary, marginBottom: 24 }}>Visitor sign-in</h2>
            <div style={{ background: '#fff', borderRadius: 16, padding: '28px 24px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Your name</label>
                <input value={visitor.name} onChange={e => setVisitor(v => ({ ...v, name: e.target.value }))} placeholder="Full name"
                  style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #dde3f0', borderRadius: 10, fontSize: '1rem', boxSizing: 'border-box', fontFamily: 'inherit' }} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>I am a</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['adult', 'child', 'student'].map(t => (
                    <button key={t} onClick={() => setVisitor(v => ({ ...v, type: t }))}
                      style={{ flex: 1, padding: '10px', borderRadius: 10, border: `2px solid ${visitor.type === t ? primary : '#dde3f0'}`, background: visitor.type === t ? primary : '#fff', color: visitor.type === t ? '#fff' : '#374151', fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize', fontSize: '0.85rem' }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <button disabled={!visitor.name.trim()} onClick={() => signIn(null, visitor.name, visitor.type)}
                style={{ width: '100%', background: visitor.name.trim() ? '#22c55e' : '#94a3b8', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontWeight: 700, cursor: visitor.name.trim() ? 'pointer' : 'not-allowed', fontSize: '1rem' }}>
                Sign In as Visitor
              </button>
            </div>
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button onClick={() => setMode('search')} style={{ background: 'transparent', color: '#64748b', border: 'none', cursor: 'pointer' }}>← Back</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
