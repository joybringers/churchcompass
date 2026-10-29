'use client';
import { useState, useEffect } from 'react';
import { useCC } from '../layout';

const NAV = '#1e3a5f';
const GOLD = '#f59e0b';

const BLANK_FIELD = { formType: 'first_timer', fieldLabel: '', fieldName: '', fieldType: 'text', fieldOptions: '', isRequired: false };

export default function Settings() {
  const ctx = useCC();
  const [churchForm, setChurchForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
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
