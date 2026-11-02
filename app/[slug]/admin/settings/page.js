'use client';
import { useState, useEffect } from 'react';
import { useCC } from '../layout';
import { useParams } from 'next/navigation';

const NAV = '#1e3a5f';
const GOLD = '#f59e0b';

import { useSearchParams } from 'next/navigation';

const BLANK_FIELD = { formType: 'first_timer', fieldLabel: '', fieldName: '', fieldType: 'text', fieldOptions: '', isRequired: false };

export default function Settings() {
  const ctx = useCC();
  const { slug } = useParams();
  const [churchForm, setChurchForm] = useState(null);
  const [qrSignin, setQrSignin] = useState('');
  const [qrChildren, setQrChildren] = useState('');
  const [qrCheckin, setQrCheckin] = useState('');
  const searchParams = useSearchParams();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);
  const [upgradedBanner, setUpgradedBanner] = useState(searchParams?.get('upgraded') === '1');
  const [customFields, setCustomFields] = useState([]);
  const [fieldModal, setFieldModal] = useState(null);
  const [fieldForm, setFieldForm] = useState(BLANK_FIELD);
  const [fieldSaving, setFieldSaving] = useState(false);

  const load = () => {
    if (!ctx) return;
    const { church, token } = ctx;
    setChurchForm({ name: church.name, denomination: church.denomination || '', address: church.address || '', phone: church.phone || '', website: church.website || '', primaryColor: church.primary_color || NAV });
    fetch(`/api/custom-fields?churchId=${church.id}`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()).then(d => setCustomFields(d.fields || []));
  };

  useEffect(() => { load(); }, [ctx]);

  useEffect(() => {
    if (!slug) return;
    const base = 'https://churchcompass.elmorilx.com';
    import('qrcode').then(QRCode => {
      QRCode.default.toDataURL(`${base}/${slug}/signin`, { width: 220, margin: 1 }).then(setQrSignin);
      QRCode.default.toDataURL(`${base}/${slug}/children-checkin`, { width: 220, margin: 1 }).then(setQrChildren);
      QRCode.default.toDataURL(`${base}/${slug}/checkin`, { width: 220, margin: 1 }).then(setQrCheckin);
    });
  }, [slug]);

  const set = (k, v) => setChurchForm(f => ({ ...f, [k]: v }));
  const setFF = (k, v) => setFieldForm(f => ({ ...f, [k]: v }));

  const saveChurch = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { church, token } = ctx;
    await fetch('/api/churches', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ id: church.id, ...churchForm }) });
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2500);
  };

  const openAddField = () => { setFieldForm({ ...BLANK_FIELD, fieldName: '' }); setFieldModal('add'); };
  const openEditField = (f) => {
    setFieldForm({ formType: f.form_type, fieldLabel: f.field_label, fieldName: f.field_name, fieldType: f.field_type, fieldOptions: (f.field_options || []).join('\n'), isRequired: f.is_required });
    setFieldModal(f);
  };

  const saveField = async () => {
    setFieldSaving(true);
    const { church, token } = ctx;
    const h = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
    const opts = fieldForm.fieldOptions.split('\n').map(s => s.trim()).filter(Boolean);
    const body = { churchId: church.id, formType: fieldForm.formType, fieldLabel: fieldForm.fieldLabel, fieldName: fieldForm.fieldName || fieldForm.fieldLabel.toLowerCase().replace(/\s+/g, '_'), fieldType: fieldForm.fieldType, fieldOptions: opts.length ? opts : null, isRequired: fieldForm.isRequired };
    if (fieldModal === 'add') await fetch('/api/custom-fields', { method: 'POST', headers: h, body: JSON.stringify(body) });
    else await fetch('/api/custom-fields', { method: 'PUT', headers: h, body: JSON.stringify({ ...body, id: fieldModal.id }) });
    setFieldSaving(false); setFieldModal(null); load();
  };

  const deleteField = async (id) => {
    if (!confirm('Delete this field?')) return;
    await fetch(`/api/custom-fields?id=${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${ctx.token}` } });
    load();
  };

  const startCheckout = async () => {
    setBillingLoading(true);
    const res = await fetch('/api/stripe/checkout', { method: 'POST', headers: { 'Authorization': `Bearer ${ctx.token}` } });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else { alert(data.error || 'Could not start checkout.'); setBillingLoading(false); }
  };

  const openPortal = async () => {
    setBillingLoading(true);
    const res = await fetch('/api/stripe/portal', { method: 'POST', headers: { 'Authorization': `Bearer ${ctx.token}` } });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else { alert(data.error || 'Could not open billing portal.'); setBillingLoading(false); }
  };

  const inp = { padding: '10px 12px', border: '1.5px solid #dde3f0', borderRadius: 10, fontSize: '0.95rem', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' };
  const lbl = { fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 3 };

  if (!ctx || !churchForm) return null;

  return (
    <div style={{ padding: '32px 28px', maxWidth: 700 }}>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: NAV, marginBottom: 28 }}>Settings</h1>

      <div style={{ background: '#fff', borderRadius: 16, padding: '28px 24px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', marginBottom: 28 }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 800, color: NAV, marginBottom: 20 }}>Church info</h2>
        <form onSubmit={saveChurch} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div><label style={lbl}>Church name *</label><input style={inp} value={churchForm.name} onChange={e => set('name', e.target.value)} required /></div>
          <div><label style={lbl}>Denomination</label><input style={inp} value={churchForm.denomination} onChange={e => set('denomination', e.target.value)} /></div>
          <div><label style={lbl}>Address</label><input style={inp} value={churchForm.address} onChange={e => set('address', e.target.value)} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={lbl}>Phone</label><input style={inp} value={churchForm.phone} onChange={e => set('phone', e.target.value)} /></div>
            <div><label style={lbl}>Website</label><input style={inp} value={churchForm.website} onChange={e => set('website', e.target.value)} /></div>
          </div>
          <div>
            <label style={lbl}>Brand color</label>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input type="color" value={churchForm.primaryColor} onChange={e => set('primaryColor', e.target.value)} style={{ width: 40, height: 40, border: 'none', borderRadius: 8, cursor: 'pointer', padding: 2 }} />
              <input style={{ ...inp, flex: 1 }} value={churchForm.primaryColor} onChange={e => set('primaryColor', e.target.value)} placeholder="#1e3a5f" />
            </div>
          </div>
          <button type="submit" disabled={saving}
            style={{ background: saved ? '#22c55e' : saving ? '#94a3b8' : NAV, color: '#fff', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* PLAN & BILLING */}
      {upgradedBanner && (
        <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <i className="fas fa-circle-check" style={{ color: '#16a34a', fontSize: 18 }} />
          <span style={{ color: '#166534', fontWeight: 600, fontSize: '0.9rem' }}>Welcome to Pro! All features are now unlocked.</span>
          <button onClick={() => setUpgradedBanner(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 18 }}>×</button>
        </div>
      )}
      <div style={{ background: '#fff', borderRadius: 16, padding: '28px 24px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', marginBottom: 28 }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 800, color: NAV, marginBottom: 20 }}>Plan & Billing</h2>
        {(() => {
          const plan = ctx.church?.plan || 'free';
          const isPro = plan === 'pro' || plan === 'custom';
          return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ background: isPro ? '#fef3c7' : '#f1f5f9', color: isPro ? '#b45309' : '#475569', fontWeight: 800, fontSize: '0.8rem', padding: '3px 12px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {plan === 'custom' ? 'Custom' : isPro ? 'Pro' : 'Free'}
                  </span>
                  {!isPro && <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>100 member limit · basic features</span>}
                  {isPro && <span style={{ fontSize: '0.8rem', color: '#16a34a' }}>Unlimited members · all features unlocked</span>}
                </div>
                {!isPro && (
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                    Upgrade to Pro for £19/month to unlock unlimited members, CSV export, custom fields and more.
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {!isPro && (
                  <button onClick={startCheckout} disabled={billingLoading}
                    style={{ background: NAV, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 700, cursor: billingLoading ? 'not-allowed' : 'pointer', fontSize: '0.875rem' }}>
                    {billingLoading ? 'Loading…' : 'Upgrade to Pro →'}
                  </button>
                )}
                {isPro && ctx.church?.stripe_customer_id && plan !== 'custom' && (
                  <button onClick={openPortal} disabled={billingLoading}
                    style={{ background: '#f1f5f9', color: NAV, border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '10px 20px', fontWeight: 700, cursor: billingLoading ? 'not-allowed' : 'pointer', fontSize: '0.875rem' }}>
                    {billingLoading ? 'Loading…' : 'Manage billing'}
                  </button>
                )}
                <a href="/pricing" target="_blank" style={{ background: '#f8fafc', color: '#64748b', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '10px 16px', fontWeight: 600, fontSize: '0.8rem', textDecoration: 'none' }}>
                  View plans
                </a>
              </div>
            </div>
          );
        })()}
      </div>

      <div style={{ background: '#fff', borderRadius: 16, padding: '28px 24px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 800, color: NAV }}>QR Codes</h2>
          <button onClick={() => window.print()} style={{ background: '#f1f5f9', color: NAV, border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '7px 14px', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>
            <i className="fas fa-print" style={{ marginRight: 6 }} />Print QR Codes
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 24 }}>
          {[
            { label: 'Sign-In Kiosk', url: `https://churchcompass.elmorilx.com/${slug}/signin`, qr: qrSignin },
            { label: 'Children Check-In', url: `https://churchcompass.elmorilx.com/${slug}/children-checkin`, qr: qrChildren },
            { label: 'Event Check-In', url: `https://churchcompass.elmorilx.com/${slug}/checkin`, qr: qrCheckin },
          ].map(({ label, url, qr }) => (
            <div key={label} style={{ textAlign: 'center', background: '#f8fafc', borderRadius: 12, padding: '20px 16px' }}>
              <div style={{ fontWeight: 700, color: NAV, marginBottom: 12, fontSize: '0.9rem' }}>{label}</div>
              {qr ? <img src={qr} alt={label} style={{ width: 160, height: 160, borderRadius: 8, display: 'block', margin: '0 auto 12px' }} /> : <div style={{ width: 160, height: 160, background: '#e2e8f0', borderRadius: 8, margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>Generating…</div>}
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: 12, wordBreak: 'break-all' }}>{url}</div>
              {qr && <a href={qr} download={`${label.replace(/\s+/g,'-').toLowerCase()}-qr.png`} style={{ display: 'inline-block', background: NAV, color: '#fff', borderRadius: 8, padding: '7px 14px', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none' }}>Download PNG</a>}
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 16, padding: '28px 24px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, color: NAV, marginBottom: 2 }}>Custom fields</h2>
            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Add extra fields to first-timer forms and member records.</p>
          </div>
          <button onClick={openAddField} style={{ background: NAV, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}>
            <i className="fas fa-plus" style={{ marginRight: 5 }} />Add field
          </button>
        </div>

        {customFields.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No custom fields yet.</p>
        ) : customFields.map(cf => (
          <div key={cf.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
            <div>
              <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>{cf.field_label}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{cf.form_type} · {cf.field_type}{cf.is_required ? ' · required' : ''}</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => openEditField(cf)} style={{ background: '#f1f5f9', color: NAV, border: 'none', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>Edit</button>
              <button onClick={() => deleteField(cf.id)} style={{ background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {fieldModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '28px 24px', width: '100%', maxWidth: 440 }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, color: NAV, marginBottom: 20 }}>{fieldModal === 'add' ? 'Add custom field' : 'Edit custom field'}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div><label style={lbl}>Form type</label>
                <select style={inp} value={fieldForm.formType} onChange={e => setFF('formType', e.target.value)}>
                  <option value="first_timer">First-timer form</option>
                  <option value="member">Member profile</option>
                </select>
              </div>
              <div><label style={lbl}>Field label *</label><input style={inp} value={fieldForm.fieldLabel} onChange={e => setFF('fieldLabel', e.target.value)} placeholder="e.g. T-shirt size" /></div>
              <div><label style={lbl}>Field type</label>
                <select style={inp} value={fieldForm.fieldType} onChange={e => setFF('fieldType', e.target.value)}>
                  {['text', 'number', 'email', 'tel', 'textarea', 'select', 'checkbox'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              {fieldForm.fieldType === 'select' && (
                <div><label style={lbl}>Options (one per line)</label><textarea rows={4} style={{ ...inp, resize: 'vertical' }} value={fieldForm.fieldOptions} onChange={e => setFF('fieldOptions', e.target.value)} placeholder={'Small\nMedium\nLarge'} /></div>
              )}
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.875rem' }}>
                <input type="checkbox" checked={fieldForm.isRequired} onChange={e => setFF('isRequired', e.target.checked)} />
                Required field
              </label>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setFieldModal(null)} style={{ flex: 1, background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={saveField} disabled={fieldSaving || !fieldForm.fieldLabel}
                style={{ flex: 1, background: fieldSaving ? '#94a3b8' : NAV, color: '#fff', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 700, cursor: fieldSaving ? 'not-allowed' : 'pointer' }}>
                {fieldSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
