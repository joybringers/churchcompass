'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCC } from '../layout';

const NAV = '#1e3a5f';
const GOLD = '#f59e0b';

const BLANK = { firstName: '', lastName: '', email: '', phone: '', dob: '', memberType: 'adult', notes: '', parentId: '' };
const FREE_LIMIT = 100;

const CSV_FIELDS = ['firstName', 'lastName', 'email', 'phone', 'dob', 'memberType', 'notes'];
const CSV_LABELS = { firstName: 'First name', lastName: 'Last name', email: 'Email', phone: 'Phone', dob: 'Date of birth', memberType: 'Member type', notes: 'Notes' };

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows = lines.slice(1).map(line => {
    const cols = [];
    let cur = '', inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; }
      else if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = ''; }
      else cur += ch;
    }
    cols.push(cur.trim());
    return Object.fromEntries(headers.map((h, i) => [h, cols[i] || '']));
  }).filter(r => Object.values(r).some(v => v));
  return { headers, rows };
}

export default function Members() {
  const ctx = useCC();
  const router = useRouter();
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all'); // 'all' | 'families'
  const [modal, setModal] = useState(null); // null | 'add' | member obj
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [csvModal, setCsvModal] = useState(false);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [csvRows, setCsvRows] = useState([]);
  const [csvMapping, setCsvMapping] = useState({});
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvResult, setCsvResult] = useState(null);
  const [memberFields, setMemberFields] = useState([]);
  const [customValues, setCustomValues] = useState({});

  const load = () => {
    if (!ctx) return;
    const { church, token } = ctx;
    fetch(`/api/members?churchId=${church.id}`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()).then(d => setMembers(d.members || []));
    fetch(`/api/custom-fields?churchId=${church.id}&formType=member`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()).then(d => setMemberFields(d.fields || []));
  };

  useEffect(() => { load(); }, [ctx]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openAdd = () => {
    const plan = ctx?.church?.plan || 'free';
    if (plan === 'free' && members.length >= FREE_LIMIT) {
      window.location.href = `/${ctx.slug}/admin/settings`;
      return;
    }
    setForm(BLANK); setCustomValues({}); setModal('add');
  };
  const openEdit = async (m) => {
    setForm({ firstName: m.first_name, lastName: m.last_name, email: m.email || '', phone: m.phone || '', dob: m.dob || '', memberType: m.member_type, notes: m.notes || '', parentId: m.parent_id || '' });
    setCustomValues({});
    setModal(m);
    if (memberFields.length > 0) {
      const { token } = ctx;
      const res = await fetch(`/api/custom-field-values?recordId=${m.id}&recordType=member`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      setCustomValues(data.values || {});
    }
  };

  const save = async () => {
    setSaving(true);
    const { church, token } = ctx;
    const h = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
    const body = { churchId: church.id, firstName: form.firstName, lastName: form.lastName, email: form.email, phone: form.phone, dob: form.dob, memberType: form.memberType, notes: form.notes, parentId: form.parentId || null };
    let memberId = modal?.id;
    if (modal === 'add') {
      const res = await fetch('/api/members', { method: 'POST', headers: h, body: JSON.stringify(body) });
      const data = await res.json();
      memberId = data.id;
    } else {
      await fetch('/api/members', { method: 'PUT', headers: h, body: JSON.stringify({ ...body, id: modal.id }) });
    }
    if (memberId && memberFields.length > 0 && Object.keys(customValues).length > 0) {
      await fetch('/api/custom-field-values', { method: 'POST', headers: h, body: JSON.stringify({ recordId: memberId, recordType: 'member', values: customValues }) });
    }
    setSaving(false); setModal(null); load();
  };

  const remove = async (id) => {
    if (!confirm('Delete this member?')) return;
    const { token } = ctx;
    await fetch(`/api/members?id=${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    load();
  };

  const importVisitors = async () => {
    setImporting(true);
    const { church, token } = ctx;
    const h = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

    // Fetch all attendance records with a visitor name
    const attRes = await fetch(`/api/attendance?churchId=${church.id}`, { headers: { 'Authorization': `Bearer ${token}` } });
    const attData = await attRes.json();
    const visitorRecords = (attData.records || []).filter(r => r.visitor_name && !r.member_id);

    // Deduplicate by lowercase name
    const nameMap = {};
    visitorRecords.forEach(r => {
      const key = r.visitor_name.toLowerCase().trim();
      if (!nameMap[key]) nameMap[key] = { displayName: r.visitor_name.trim(), type: r.visitor_type, recordIds: [] };
      nameMap[key].recordIds.push(r.id);
    });

    // Get existing members to skip duplicates
    const membRes = await fetch(`/api/members?churchId=${church.id}`, { headers: { 'Authorization': `Bearer ${token}` } });
    const membData = await membRes.json();
    const existingNames = new Set((membData.members || []).map(m => `${m.first_name} ${m.last_name}`.toLowerCase().trim()));

    let created = 0, skipped = 0;
    for (const [key, { displayName, type, recordIds }] of Object.entries(nameMap)) {
      if (existingNames.has(key)) { skipped++; continue; }
      const parts = displayName.split(' ');
      const firstName = parts[0];
      const lastName = parts.slice(1).join(' ') || '—';
      const createRes = await fetch('/api/members', { method: 'POST', headers: h, body: JSON.stringify({ churchId: church.id, firstName, lastName, memberType: type || 'adult' }) });
      const createData = await createRes.json();
      if (createData.id) {
        for (const recordId of recordIds) {
          await fetch('/api/attendance', { method: 'PUT', headers: h, body: JSON.stringify({ id: recordId, memberId: createData.id }) });
        }
        created++;
      }
    }
    setImporting(false);
    setImportResult({ created, skipped });
    load();
  };

  const exportCsv = () => {
    const rows = [['First Name','Last Name','Email','Phone','Type','Date of Birth','Notes']];
    members.forEach(m => rows.push([m.first_name, m.last_name, m.email||'', m.phone||'', m.member_type, m.dob||'', m.notes||'']));
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'\\"')}"`).join(',')).join('\n');
    const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,'+encodeURIComponent(csv); a.download='members.csv'; a.click();
  };

  const openCsvImport = () => {
    if ((ctx?.church?.plan || 'free') === 'free') {
      window.location.href = `/${ctx.slug}/admin/settings`;
      return;
    }
    setCsvRows([]); setCsvHeaders([]); setCsvMapping({}); setCsvResult(null); setCsvModal(true);
  };

  const handleCsvFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const { headers, rows } = parseCSV(ev.target.result);
      setCsvHeaders(headers);
      setCsvRows(rows);
      // Auto-map columns with matching names
      const autoMap = {};
      CSV_FIELDS.forEach(field => {
        const match = headers.find(h => h.toLowerCase().replace(/[\s_-]/g, '') === field.toLowerCase() ||
          h.toLowerCase() === CSV_LABELS[field].toLowerCase() ||
          (field === 'firstName' && /first.*name/i.test(h)) ||
          (field === 'lastName' && /last.*name|surname/i.test(h)) ||
          (field === 'memberType' && /type|member.type/i.test(h)) ||
          (field === 'dob' && /birth|dob/i.test(h))
        );
        if (match) autoMap[field] = match;
      });
      setCsvMapping(autoMap);
      setCsvResult(null);
    };
    reader.readAsText(file);
  };

  const runCsvImport = async () => {
    setCsvImporting(true);
    const { church, token } = ctx;
    const rows = csvRows.map(row => {
      const r = {};
      CSV_FIELDS.forEach(f => { if (csvMapping[f]) r[f] = row[csvMapping[f]] || ''; });
      if (!r.memberType || !['adult', 'child', 'visitor', 'staff'].includes(r.memberType?.toLowerCase())) r.memberType = 'adult';
      else r.memberType = r.memberType.toLowerCase();
      return r;
    }).filter(r => r.firstName || r.lastName);

    const res = await fetch('/api/members/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ churchId: church.id, members: rows }),
    });
    const data = await res.json();
    setCsvImporting(false);
    setCsvResult(data);
    if (data.ok) load();
  };

  const filtered = members.filter(m => `${m.first_name} ${m.last_name} ${m.email}`.toLowerCase().includes(search.toLowerCase()));
  const memberById = Object.fromEntries(members.map(m => [m.id, m]));
  const adults = members.filter(m => m.member_type !== 'child');
  // Build family groups: parents (adults with children) + their children
  const childrenByParent = {};
  members.filter(m => m.parent_id).forEach(m => {
    if (!childrenByParent[m.parent_id]) childrenByParent[m.parent_id] = [];
    childrenByParent[m.parent_id].push(m);
  });
  const families = adults.filter(a => childrenByParent[a.id]);
  const orphanedChildren = members.filter(m => m.member_type === 'child' && !m.parent_id);

  const inp = { padding: '10px 12px', border: '1.5px solid #dde3f0', borderRadius: 10, fontSize: '0.95rem', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' };
  const lbl = { fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 3 };

  if (!ctx) return null;

  return (
    <div style={{ padding: '32px 28px', maxWidth: 960 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: NAV }}>Members</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={importVisitors} disabled={importing} style={{ background: importing ? '#94a3b8' : '#f0fdf4', color: importing ? '#fff' : '#16a34a', border: '1.5px solid #bbf7d0', borderRadius: 10, padding: '10px 16px', fontWeight: 600, cursor: importing ? 'not-allowed' : 'pointer', fontSize: '0.875rem' }}>
            <i className="fas fa-user-check" style={{ marginRight: 6 }} />{importing ? 'Importing…' : 'Import visitors'}
          </button>
          <button onClick={openCsvImport} style={{ background: '#f0f9ff', color: '#0369a1', border: '1.5px solid #bae6fd', borderRadius: 10, padding: '10px 16px', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>
            <i className="fas fa-file-csv" style={{ marginRight: 6 }} />Import CSV
          </button>
          <button onClick={exportCsv} style={{ background: '#f1f5f9', color: NAV, border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '10px 16px', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>
            <i className="fas fa-download" style={{ marginRight: 6 }} />Export CSV
          </button>
          <button onClick={openAdd} style={{ background: NAV, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>
            <i className="fas fa-plus" style={{ marginRight: 6 }} />Add member
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid #e2e8f0', paddingBottom: 0 }}>
        {[['all', 'All Members'], ['families', 'Families']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ background: 'none', border: 'none', borderBottom: tab === key ? `2px solid ${NAV}` : '2px solid transparent', marginBottom: -2, padding: '8px 16px', fontWeight: tab === key ? 700 : 500, color: tab === key ? NAV : '#64748b', cursor: 'pointer', fontSize: '0.9rem', transition: 'color 0.15s' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Free tier limit banner */}
      {(ctx?.church?.plan || 'free') === 'free' && members.length >= FREE_LIMIT && (
        <div style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: 12, padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <i className="fas fa-lock" style={{ color: '#d97706', fontSize: 16 }} />
          <div style={{ flex: 1 }}>
            <span style={{ fontWeight: 700, color: '#92400e', fontSize: '0.875rem' }}>Member limit reached ({FREE_LIMIT} on Free). </span>
            <span style={{ color: '#b45309', fontSize: '0.875rem' }}>Upgrade to Pro to add unlimited members.</span>
          </div>
          <a href={`/${ctx.slug}/admin/settings`} style={{ background: '#d97706', color: '#fff', borderRadius: 8, padding: '7px 16px', fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Upgrade →
          </a>
        </div>
      )}

      {tab === 'all' && (<>
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
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{m.first_name} {m.last_name}</div>
                    {m.parent_id && memberById[m.parent_id] && (
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 1 }}>
                        <i className="fas fa-user" style={{ marginRight: 3 }} />
                        {memberById[m.parent_id].first_name} {memberById[m.parent_id].last_name}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', textTransform: 'capitalize', color: '#64748b' }}>{m.member_type}</td>
                  <td style={{ padding: '12px 16px', color: '#64748b' }}>{m.email || '—'}</td>
                  <td style={{ padding: '12px 16px', color: '#64748b' }}>{m.phone || '—'}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <button onClick={() => router.push(`/${ctx.slug}/admin/members/${m.id}`)} style={{ background: 'none', border: 'none', color: '#0891b2', cursor: 'pointer', marginRight: 8, fontSize: '0.85rem', fontWeight: 600 }}>View</button>
                    <button onClick={() => openEdit(m)} style={{ background: 'none', border: 'none', color: NAV, cursor: 'pointer', marginRight: 8, fontSize: '0.85rem' }}>Edit</button>
                    <button onClick={() => remove(m.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem' }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>)}

      {tab === 'families' && (
        <div>
          {families.length === 0 && orphanedChildren.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 14, padding: '40px', textAlign: 'center', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
              <i className="fas fa-users" style={{ fontSize: 32, color: '#e2e8f0', marginBottom: 12, display: 'block' }} />
              <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: 8 }}>No families linked yet.</p>
              <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Edit a child member and set their parent to create a family group.</p>
            </div>
          ) : (<>
            {families.map(parent => (
              <div key={parent.id} style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: NAV + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="fas fa-user" style={{ color: NAV, fontSize: 14 }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: NAV, fontSize: '0.95rem' }}>{parent.first_name} {parent.last_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{parent.email || parent.phone || parent.member_type}</div>
                    </div>
                  </div>
                  <button onClick={() => openEdit(parent)} style={{ background: 'none', border: '1px solid #e2e8f0', color: NAV, borderRadius: 7, padding: '5px 12px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>Edit</button>
                </div>
                {(childrenByParent[parent.id] || []).map(child => (
                  <div key={child.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 20px 11px 56px', borderBottom: '1px solid #f8fafc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <i className="fas fa-child" style={{ color: GOLD, fontSize: 13 }} />
                      <div>
                        <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>{child.first_name} {child.last_name}</span>
                        {child.dob && <span style={{ color: '#94a3b8', fontSize: '0.75rem', marginLeft: 8 }}>DOB {child.dob}</span>}
                      </div>
                    </div>
                    <button onClick={() => openEdit(child)} style={{ background: 'none', border: '1px solid #e2e8f0', color: NAV, borderRadius: 7, padding: '5px 12px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>Edit</button>
                  </div>
                ))}
              </div>
            ))}
            {orphanedChildren.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ padding: '12px 20px', background: '#fffbeb', borderBottom: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="fas fa-triangle-exclamation" style={{ color: '#d97706' }} />
                  <span style={{ fontWeight: 700, color: '#92400e', fontSize: '0.85rem' }}>Children without a linked parent ({orphanedChildren.length})</span>
                </div>
                {orphanedChildren.map(child => (
                  <div key={child.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 20px', borderBottom: '1px solid #f8fafc' }}>
                    <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>{child.first_name} {child.last_name}</div>
                    <button onClick={() => openEdit(child)} style={{ background: NAV, color: '#fff', border: 'none', borderRadius: 7, padding: '5px 12px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>Link parent</button>
                  </div>
                ))}
              </div>
            )}
          </>)}
        </div>
      )}

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
              {form.memberType === 'child' && (
                <div>
                  <label style={lbl}>Parent / Guardian</label>
                  <select style={inp} value={form.parentId} onChange={e => set('parentId', e.target.value)}>
                    <option value="">— not linked —</option>
                    {adults.filter(a => modal === 'add' || a.id !== modal?.id).map(a => (
                      <option key={a.id} value={a.id}>{a.first_name} {a.last_name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div><label style={lbl}>Notes</label><textarea rows={2} style={{ ...inp, resize: 'vertical' }} value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
              {memberFields.length > 0 && (
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 12, marginTop: 4 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 10 }}>Custom fields</div>
                  {memberFields.map(f => (
                    <div key={f.id} style={{ marginBottom: 10 }}>
                      <label style={lbl}>{f.field_label}{f.is_required ? ' *' : ''}</label>
                      {f.field_type === 'textarea' ? (
                        <textarea rows={2} style={{ ...inp, resize: 'vertical' }} value={customValues[f.id] || ''} onChange={e => setCustomValues(v => ({ ...v, [f.id]: e.target.value }))} required={f.is_required} />
                      ) : f.field_type === 'select' ? (
                        <select style={inp} value={customValues[f.id] || ''} onChange={e => setCustomValues(v => ({ ...v, [f.id]: e.target.value }))} required={f.is_required}>
                          <option value="">— select —</option>
                          {(f.field_options || []).map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : f.field_type === 'checkbox' ? (
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.875rem' }}>
                          <input type="checkbox" checked={customValues[f.id] === 'true'} onChange={e => setCustomValues(v => ({ ...v, [f.id]: e.target.checked ? 'true' : 'false' }))} />
                          {f.field_label}
                        </label>
                      ) : (
                        <input style={inp} type={f.field_type} value={customValues[f.id] || ''} onChange={e => setCustomValues(v => ({ ...v, [f.id]: e.target.value }))} required={f.is_required} />
                      )}
                    </div>
                  ))}
                </div>
              )}
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
      {importResult && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '32px 28px', maxWidth: 400, width: '100%', textAlign: 'center' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <i className="fas fa-user-check" style={{ fontSize: 24, color: '#16a34a' }} />
            </div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: NAV, marginBottom: 8 }}>Import complete</h2>
            <p style={{ color: '#374151', marginBottom: 4 }}><strong>{importResult.created}</strong> visitor{importResult.created !== 1 ? 's' : ''} added as members</p>
            {importResult.skipped > 0 && <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 0 }}>{importResult.skipped} already existed — skipped</p>}
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: 12 }}>They can now search their name at the kiosk to sign in.</p>
            <button onClick={() => setImportResult(null)} style={{ marginTop: 20, background: NAV, color: '#fff', border: 'none', borderRadius: 10, padding: '11px 28px', fontWeight: 700, cursor: 'pointer' }}>Done</button>
          </div>
        </div>
      )}
      {/* CSV Import modal */}
      {csvModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 600, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '22px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: NAV, marginBottom: 2 }}>Import members from CSV</h2>
                <p style={{ fontSize: '0.78rem', color: '#64748b' }}>Upload a spreadsheet exported from Excel, Google Sheets, or another system.</p>
              </div>
              <button onClick={() => { setCsvModal(false); setCsvResult(null); }} style={{ background: 'none', border: 'none', fontSize: 22, color: '#94a3b8', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
              {csvResult ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  {csvResult.ok ? (
                    <>
                      <i className="fas fa-circle-check" style={{ fontSize: 40, color: '#16a34a', marginBottom: 12, display: 'block' }} />
                      <div style={{ fontWeight: 800, color: NAV, fontSize: '1.1rem', marginBottom: 6 }}>{csvResult.imported} member{csvResult.imported !== 1 ? 's' : ''} imported</div>
                      <p style={{ color: '#64748b', fontSize: '0.875rem' }}>They now appear in your Members list.</p>
                      <button onClick={() => { setCsvModal(false); setCsvResult(null); }}
                        style={{ marginTop: 20, background: NAV, color: '#fff', border: 'none', borderRadius: 10, padding: '11px 28px', fontWeight: 700, cursor: 'pointer' }}>Done</button>
                    </>
                  ) : (
                    <>
                      <i className="fas fa-circle-xmark" style={{ fontSize: 40, color: '#dc2626', marginBottom: 12, display: 'block' }} />
                      <div style={{ fontWeight: 700, color: '#dc2626', marginBottom: 6 }}>Import failed</div>
                      <p style={{ color: '#64748b', fontSize: '0.875rem' }}>{csvResult.error}</p>
                      <button onClick={() => setCsvResult(null)} style={{ marginTop: 16, background: '#f1f5f9', color: NAV, border: 'none', borderRadius: 10, padding: '10px 24px', fontWeight: 700, cursor: 'pointer' }}>Try again</button>
                    </>
                  )}
                </div>
              ) : (
                <>
                  {/* File upload */}
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', border: '2px dashed #cbd5e1', borderRadius: 12, padding: '24px', textAlign: 'center', cursor: 'pointer', background: '#f8fafc' }}>
                      <i className="fas fa-cloud-upload-alt" style={{ fontSize: 28, color: '#94a3b8', display: 'block', marginBottom: 8 }} />
                      <div style={{ fontWeight: 600, color: '#374151', marginBottom: 4 }}>Click to upload a CSV file</div>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>First row must be column headers. Supports .csv files.</div>
                      <input type="file" accept=".csv,text/csv" onChange={handleCsvFile} style={{ display: 'none' }} />
                    </label>
                  </div>

                  {csvRows.length > 0 && (
                    <>
                      <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: '0.825rem', color: '#0369a1', fontWeight: 600 }}>
                        <i className="fas fa-table" style={{ marginRight: 6 }} />{csvRows.length} rows detected · {csvHeaders.length} columns
                      </div>

                      {/* Column mapping */}
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontWeight: 700, color: NAV, fontSize: '0.85rem', marginBottom: 10 }}>Map your columns</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          {CSV_FIELDS.map(field => (
                            <div key={field}>
                              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 3 }}>
                                {CSV_LABELS[field]}{field === 'firstName' || field === 'lastName' ? ' *' : ''}
                              </label>
                              <select value={csvMapping[field] || ''} onChange={e => setCsvMapping(m => ({ ...m, [field]: e.target.value || undefined }))}
                                style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #dde3f0', borderRadius: 8, fontSize: '0.825rem', fontFamily: 'inherit', background: '#fff' }}>
                                <option value="">— skip —</option>
                                {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                              </select>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Preview */}
                      <div>
                        <div style={{ fontWeight: 700, color: NAV, fontSize: '0.85rem', marginBottom: 8 }}>Preview (first 3 rows)</div>
                        <div style={{ overflow: 'auto', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                            <thead>
                              <tr style={{ background: '#f8fafc' }}>
                                {CSV_FIELDS.filter(f => csvMapping[f]).map(f => (
                                  <th key={f} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, color: '#374151', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{CSV_LABELS[f]}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {csvRows.slice(0, 3).map((row, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                                  {CSV_FIELDS.filter(f => csvMapping[f]).map(f => (
                                    <td key={f} style={{ padding: '7px 10px', color: '#374151' }}>{row[csvMapping[f]] || <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            {!csvResult && csvRows.length > 0 && (
              <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 10 }}>
                <button onClick={() => setCsvModal(false)} style={{ flex: 1, background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button onClick={runCsvImport} disabled={csvImporting || (!csvMapping.firstName && !csvMapping.lastName)}
                  style={{ flex: 2, background: csvImporting ? '#94a3b8' : NAV, color: '#fff', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 700, cursor: csvImporting ? 'not-allowed' : 'pointer' }}>
                  {csvImporting ? 'Importing…' : `Import ${csvRows.length} member${csvRows.length !== 1 ? 's' : ''}`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
