'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

const NAV = '#1e3a5f';
const GOLD = '#f59e0b';

export default function FirstTimer() {
  const { slug } = useParams();
  const router = useRouter();
  const [church, setChurch] = useState(null);
  const [customFields, setCustomFields] = useState([]);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', address: '', howHeard: '', prayerRequest: '', wouldLikeContact: false });
  const [customValues, setCustomValues] = useState({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch(`/api/churches?slug=${slug}`).then(r => r.json()).then(d => {
      setChurch(d.church || null);
      if (d.church) {
        fetch(`/api/custom-fields?churchId=${d.church.id}&formType=first_timer`).then(r => r.json()).then(cf => setCustomFields(cf.fields || []));
      }
    });
  }, [slug]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setCV = (id, v) => setCustomValues(cv => ({ ...cv, [id]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const body = { churchId: church.id, firstName: form.firstName, lastName: form.lastName, email: form.email, phone: form.phone, address: form.address, howHeard: form.howHeard, prayerRequest: form.prayerRequest, wouldLikeContact: form.wouldLikeContact, customValues };
    const res = await fetch('/api/first-timers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.ok) { setDone(true); setTimeout(() => router.push(`/${slug}/signin`), 4000); }
    setLoading(false);
  };

  const inp = { padding: '12px 14px', border: '1.5px solid #dde3f0', borderRadius: 10, fontSize: '1rem', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' };
  const lbl = { fontSize: '0.85rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 };
  const primary = church?.primary_color || NAV;

  if (done) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', textAlign: 'center', padding: 32 }}>
      <div style={{ fontSize: 72, marginBottom: 16 }}>🎉</div>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, color: primary, marginBottom: 8 }}>Welcome, {form.firstName}!</h1>
      <p style={{ color: '#64748b', fontSize: '1.1rem' }}>We're so glad you're here. Returning to sign-in screen…</p>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <header style={{ background: primary, padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.2rem' }}>{church?.name || '…'}</div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>First-timer welcome card</div>
        </div>
        <button onClick={() => router.push(`/${slug}/signin`)}
          style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: '0.85rem' }}>
          ← Back
        </button>
      </header>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '32px 16px' }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: '32px 28px', boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: primary, marginBottom: 6 }}>Welcome! Tell us about yourself</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: 28 }}>Only your name is required — fill in as much as you're comfortable with.</p>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><label style={lbl}>First name <span style={{ color: '#dc2626' }}>*</span></label><input style={inp} value={form.firstName} onChange={e => set('firstName', e.target.value)} required /></div>
              <div><label style={lbl}>Last name <span style={{ color: '#dc2626' }}>*</span></label><input style={inp} value={form.lastName} onChange={e => set('lastName', e.target.value)} required /></div>
            </div>
            <div><label style={lbl}>Email</label><input style={inp} type="email" value={form.email} onChange={e => set('email', e.target.value)} /></div>
            <div><label style={lbl}>Phone</label><input style={inp} type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
            <div><label style={lbl}>Address</label><input style={inp} value={form.address} onChange={e => set('address', e.target.value)} /></div>
            <div>
              <label style={lbl}>How did you hear about us?</label>
              <select value={form.howHeard} onChange={e => set('howHeard', e.target.value)} style={{ ...inp }}>
                <option value="">Select…</option>
                {['Friend / family', 'Social media', 'Walking past', 'Search online', 'Event / flyer', 'Other'].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div><label style={lbl}>Prayer request (optional)</label><textarea rows={3} style={{ ...inp, resize: 'vertical' }} value={form.prayerRequest} onChange={e => set('prayerRequest', e.target.value)} /></div>

            {customFields.map(cf => (
              <div key={cf.id}>
                <label style={lbl}>{cf.field_label}{cf.is_required && <span style={{ color: '#dc2626' }}> *</span>}</label>
                {cf.field_type === 'textarea' ? (
                  <textarea rows={3} style={{ ...inp, resize: 'vertical' }} value={customValues[cf.id] || ''} onChange={e => setCV(cf.id, e.target.value)} required={cf.is_required} />
                ) : cf.field_type === 'select' ? (
                  <select style={{ ...inp }} value={customValues[cf.id] || ''} onChange={e => setCV(cf.id, e.target.value)} required={cf.is_required}>
                    <option value="">Select…</option>
                    {(cf.field_options || []).map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : cf.field_type === 'checkbox' ? (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!customValues[cf.id]} onChange={e => setCV(cf.id, e.target.checked)} />
                    <span style={{ fontSize: '0.9rem', color: '#374151' }}>{cf.field_label}</span>
                  </label>
                ) : (
                  <input style={inp} type={cf.field_type === 'number' ? 'number' : 'text'} value={customValues[cf.id] || ''} onChange={e => setCV(cf.id, e.target.value)} required={cf.is_required} />
                )}
              </div>
            ))}

            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '12px 14px', background: '#f8fafc', borderRadius: 10 }}>
              <input type="checkbox" checked={form.wouldLikeContact} onChange={e => set('wouldLikeContact', e.target.checked)} style={{ width: 18, height: 18 }} />
              <span style={{ fontSize: '0.9rem', color: '#374151', fontWeight: 500 }}>I'd like someone to follow up with me</span>
            </label>

            <button type="submit" disabled={loading}
              style={{ background: loading ? '#94a3b8' : primary, color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontWeight: 700, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4 }}>
              {loading ? 'Submitting…' : 'Submit Welcome Card'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
