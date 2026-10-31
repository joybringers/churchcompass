'use client';
import { useState, useEffect } from 'react';
import { useCC } from '../layout';

const NAV = '#1e3a5f';
const GOLD = '#f59e0b';

const BLANK = { firstName: '', lastName: '', email: '', phone: '', dob: '', memberType: 'adult', notes: '' };

export default function Members() {
  const ctx = useCC();
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | 'add' | member obj
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);

  const load = () => {
    if (!ctx) return;
    const { church, token } = ctx;
    fetch(`/api/members?churchId=${church.id}`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()).then(d => setMembers(d.members || []));
  };

  useEffect(() => { load(); }, [ctx]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openAdd = () => { setForm(BLANK); setModal('add'); };
  const openEdit = (m) => { setForm({ firstName: m.first_name, lastName: m.last_name, email: m.email || '', phone: m.phone || '', dob: m.dob || '', memberType: m.member_type, notes: m.notes || '' }); setModal(m); };

  const save = async () => {
    setSaving(true);
    const { church, token } = ctx;
    const h = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
    const body = { churchId: church.id, firstName: form.firstName, lastName: form.lastName, email: form.email, phone: form.phone, dob: form.dob, memberType: form.memberType, notes: form.notes };
    if (modal === 'add') await fetch('/api/members', { method: 'POST', headers: h, body: JSON.stringify(body) });
    else await fetch('/api/members', { method: 'PUT', headers: h, body: JSON.stringify({ ...body, id: modal.id }) });
    setSaving(false); setModal(null); load();
  };

  const remove = async (id) => {
    if (!confirm('Delete this member?')) return;
    const { token } = ctx;
    await fetch(`/api/members?id=${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    load();
  };

  const exportCsv = () => {
    const rows = [['First Name','Last Name','Email','Phone','Type','Date of Birth','Notes']];
    members.forEach(m => rows.push([m.first_name, m.last_name, m.email||'', m.phone||'', m.member_type, m.dob||'', m.notes||'']));
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'\\"')}"`).join(',')).join('\n');
    const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,'+encodeURIComponent(csv); a.download='members.csv'; a.click();
  };

  const filtered = members.filter(m => `${m.first_name} ${m.last_name} ${m.email}`.toLowerCase().includes(search.toLowerCase()));

  const inp = { padding: '10px 12px', border: '1.5px solid #dde3f0', borderRadius: 10, fontSize: '0.95rem', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' };
  const lbl = { fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 3 };

  if (!ctx) return null;

  return (
    <div style={{ padding: '32px 28px', maxWidth: 960 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: NAV }}>Members</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={exportCsv} style={{ background: '#f1f5f9', color: NAV, border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '10px 16px', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>
            <i className="fas fa-download" style={{ marginRight: 6 }} />Export CSV
          </button>
          <button onClick={openAdd} style={{ background: NAV, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>
            <i className="fas fa-plus" style={{ marginRight: 6 }} />Add member
          </button>
        </div>
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search members…"
        style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.95rem', marginBottom: 16, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none', background: '#fff' }} />

      <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ textAlign: 'left', padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Name</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Type</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Email</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Phone</th>
              <th style={{ padding: '12px 16px' }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '28px 16px', textAlign: 'center', color: '#94a3b8' }}>No members found.</td></tr>
            ) : filtered.map(m => (
              <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1e293b' }}>{m.first_name} {m.last_name}</td>
                <td style={{ padding: '12px 16px', textTransform: 'capitalize', color: '#64748b' }}>{m.member_type}</td>
                <td style={{ padding: '12px 16px', color: '#64748b' }}>{m.email || '—'}</td>
                <td style={{ padding: '12px 16px', color: '#64748b' }}>{m.phone || '—'}</td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <button onClick={() => openEdit(m)} style={{ background: 'none', border: 'none', color: NAV, cursor: 'pointer', marginRight: 8, fontSize: '0.85rem' }}>Edit</button>
                  <button onClick={() => remove(m.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '28px 24px', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: NAV, marginBottom: 20 }}>{modal === 'add' ? 'Add member' : 'Edit member'}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div><label style={lbl}>First name *</label><input style={inp} value={form.firstName} onChange={e => set('firstName', e.target.value)} /></div>
                <div><label style={lbl}>Last name *</label><input style={inp} value={form.lastName} onChange={e => set('lastName', e.target.value)} /></div>
              </div>
              <div><label style={lbl}>Member type</label>
                <select style={inp} value={form.memberType} onChange={e => set('memberType', e.target.value)}>
                  {['adult', 'child', 'youth', 'volunteer', 'leader', 'pastor'].map(t => <option key={t} value={t} style={{ textTransform: 'capitalize' }}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div><label style={lbl}>Email</label><input style={inp} type="email" value={form.email} onChange={e => set('email', e.target.value)} /></div>
              <div><label style={lbl}>Phone</label><input style={inp} value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
              <div><label style={lbl}>Date of birth</label><input style={inp} type="date" value={form.dob} onChange={e => set('dob', e.target.value)} /></div>
              <div><label style={lbl}>Notes</label><textarea rows={2} style={{ ...inp, resize: 'vertical' }} value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setModal(null)} style={{ flex: 1, background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={save} disabled={saving || !form.firstName || !form.lastName}
                style={{ flex: 1, background: saving ? '#94a3b8' : NAV, color: '#fff', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
