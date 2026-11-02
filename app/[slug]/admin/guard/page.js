'use client';
import { useState, useEffect } from 'react';
import { useCC } from '../layout';

const NAV = '#1e3a5f';
const GOLD = '#f59e0b';
const GREEN = '#16a34a';

const BLANK_COLLECTOR = { childName: '', collectorName: '', relationship: '', phone: '' };
const BLANK_DBS = { fullName: '', role: '', checkType: 'enhanced', checkNumber: '', issueDate: '', renewalDate: '', trainingSafeguarding: false, trainingFirstAid: false, notes: '' };
const BLANK_INCIDENT = { incidentDate: new Date().toISOString().split('T')[0], personInvolved: '', reportedBy: '', incidentType: 'accident', description: '', actionTaken: '', followUpRequired: false, followUpNotes: '' };

const INCIDENT_TYPES = { accident: 'Accident', concern: 'Concern', safeguarding: 'Safeguarding', near_miss: 'Near Miss' };
const INCIDENT_COLORS = { accident: '#f59e0b', concern: '#6366f1', safeguarding: '#ef4444', near_miss: '#94a3b8' };
const CHECK_TYPES = { basic: 'Basic', standard: 'Standard', enhanced: 'Enhanced' };

function dbsStatus(renewalDate) {
  if (!renewalDate) return { label: 'No date', color: '#94a3b8', bg: '#f8fafc' };
  const days = Math.floor((new Date(renewalDate) - new Date()) / 86400000);
  if (days < 0) return { label: 'Expired', color: '#ef4444', bg: '#fef2f2' };
  if (days < 90) return { label: `${days}d left`, color: '#d97706', bg: '#fffbeb' };
  return { label: 'Valid', color: GREEN, bg: '#f0fdf4' };
}

const inp = { padding: '10px 12px', border: '1.5px solid #dde3f0', borderRadius: 10, fontSize: '0.9rem', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' };
const lbl = { fontSize: '0.78rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 3 };

function ProGate({ slug }) {
  return (
    <div style={{ padding: '48px 24px', textAlign: 'center' }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <i className="fas fa-lock" style={{ fontSize: 26, color: GOLD }} />
      </div>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: NAV, marginBottom: 8 }}>Pro feature</h3>
      <p style={{ color: '#64748b', fontSize: '0.875rem', maxWidth: 340, margin: '0 auto 24px' }}>
        Upgrade to Pro to access the DBS tracker and incident log.
      </p>
      <a href={`/${slug}/admin/settings`} style={{ background: NAV, color: '#fff', borderRadius: 10, padding: '11px 24px', fontWeight: 700, fontSize: '0.875rem', textDecoration: 'none' }}>
        Upgrade to Pro →
      </a>
    </div>
  );
}

export default function Guard() {
  const ctx = useCC();
  const [tab, setTab] = useState('collectors');
  const [collectors, setCollectors] = useState([]);
  const [dbsRecords, setDbsRecords] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | 'collector' | 'dbs' | 'incident' | obj
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const plan = ctx?.church?.plan || 'free';
  const isPro = plan === 'pro' || plan === 'custom';

  const loadAll = () => {
    if (!ctx) return;
    const { church, token } = ctx;
    const h = { 'Authorization': `Bearer ${token}` };
    fetch(`/api/guard/collectors?churchId=${church.id}`, { headers: h }).then(r => r.json()).then(d => setCollectors(d.collectors || []));
    if (isPro) {
      fetch(`/api/guard/dbs?churchId=${church.id}`, { headers: h }).then(r => r.json()).then(d => setDbsRecords(d.records || []));
      fetch(`/api/guard/incidents?churchId=${church.id}`, { headers: h }).then(r => r.json()).then(d => setIncidents(d.incidents || []));
    }
  };

  useEffect(() => { loadAll(); }, [ctx, isPro]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openAdd = (type) => {
    setEditTarget(null);
    if (type === 'collector') setForm(BLANK_COLLECTOR);
    else if (type === 'dbs') setForm(BLANK_DBS);
    else setForm(BLANK_INCIDENT);
    setModal(type);
  };

  const openEdit = (type, record) => {
    setEditTarget(record);
    if (type === 'collector') {
      setForm({ childName: record.child_name, collectorName: record.collector_name, relationship: record.relationship || '', phone: record.phone || '' });
    } else if (type === 'dbs') {
      setForm({ fullName: record.full_name, role: record.role || '', checkType: record.check_type, checkNumber: record.check_number || '', issueDate: record.issue_date || '', renewalDate: record.renewal_date || '', trainingSafeguarding: record.training_safeguarding, trainingFirstAid: record.training_first_aid, notes: record.notes || '' });
    } else {
      setForm({ incidentDate: record.incident_date, personInvolved: record.person_involved || '', reportedBy: record.reported_by || '', incidentType: record.incident_type, description: record.description, actionTaken: record.action_taken || '', followUpRequired: record.follow_up_required, followUpNotes: record.follow_up_notes || '' });
    }
    setModal(type);
  };

  const save = async () => {
    setSaving(true);
    const { church, token } = ctx;
    const h = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

    if (modal === 'collector') {
      const body = { churchId: church.id, ...form };
      if (editTarget) {
        // no PUT for collectors — delete + re-add
        await fetch(`/api/guard/collectors?id=${editTarget.id}`, { method: 'DELETE', headers: h });
        await fetch('/api/guard/collectors', { method: 'POST', headers: h, body: JSON.stringify(body) });
      } else {
        await fetch('/api/guard/collectors', { method: 'POST', headers: h, body: JSON.stringify(body) });
      }
    } else if (modal === 'dbs') {
      const body = { churchId: church.id, ...form };
      if (editTarget) {
        await fetch('/api/guard/dbs', { method: 'PUT', headers: h, body: JSON.stringify({ id: editTarget.id, ...body }) });
      } else {
        await fetch('/api/guard/dbs', { method: 'POST', headers: h, body: JSON.stringify(body) });
      }
    } else if (modal === 'incident') {
      const body = { churchId: church.id, ...form };
      if (editTarget) {
        await fetch('/api/guard/incidents', { method: 'PUT', headers: h, body: JSON.stringify({ id: editTarget.id, ...body }) });
      } else {
        await fetch('/api/guard/incidents', { method: 'POST', headers: h, body: JSON.stringify(body) });
      }
    }
    setSaving(false);
    setModal(null);
    loadAll();
  };

  const remove = async (type, id) => {
    if (!confirm('Delete this record?')) return;
    const { token } = ctx;
    const h = { 'Authorization': `Bearer ${token}` };
    if (type === 'collector') await fetch(`/api/guard/collectors?id=${id}`, { method: 'DELETE', headers: h });
    else if (type === 'dbs') await fetch(`/api/guard/dbs?id=${id}`, { method: 'DELETE', headers: h });
    else await fetch(`/api/guard/incidents?id=${id}`, { method: 'DELETE', headers: h });
    loadAll();
  };

  if (!ctx) return null;
  const { slug } = ctx;

  const filteredCollectors = collectors.filter(c => `${c.child_name} ${c.collector_name}`.toLowerCase().includes(search.toLowerCase()));
  const filteredDbs = dbsRecords.filter(r => r.full_name.toLowerCase().includes(search.toLowerCase()));
  const filteredIncidents = incidents.filter(i => `${i.person_involved} ${i.description}`.toLowerCase().includes(search.toLowerCase()));

  const tabStyle = (t) => ({
    padding: '10px 18px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem', fontFamily: 'inherit',
    background: tab === t ? NAV : '#f1f5f9',
    color: tab === t ? '#fff' : '#64748b',
  });

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1000 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: NAV, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
            <i className="fas fa-shield-halved" style={{ color: GOLD }} />
            Guard
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Safeguarding records — authorised collectors, DBS checks, and incident log</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {tab === 'collectors' && <button onClick={() => openAdd('collector')} style={{ background: NAV, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}><i className="fas fa-plus" style={{ marginRight: 6 }} />Add collector</button>}
          {tab === 'dbs' && isPro && <button onClick={() => openAdd('dbs')} style={{ background: NAV, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}><i className="fas fa-plus" style={{ marginRight: 6 }} />Add DBS record</button>}
          {tab === 'incidents' && isPro && <button onClick={() => openAdd('incident')} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}><i className="fas fa-plus" style={{ marginRight: 6 }} />Log incident</button>}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <button style={tabStyle('collectors')} onClick={() => { setTab('collectors'); setSearch(''); }}>
          <i className="fas fa-person-circle-check" style={{ marginRight: 6 }} />Authorised Collectors
        </button>
        <button style={tabStyle('dbs')} onClick={() => { setTab('dbs'); setSearch(''); }}>
          <i className="fas fa-id-badge" style={{ marginRight: 6 }} />DBS &amp; Training
          {!isPro && <i className="fas fa-lock" style={{ marginLeft: 6, fontSize: '0.75rem', opacity: 0.7 }} />}
        </button>
        <button style={tabStyle('incidents')} onClick={() => { setTab('incidents'); setSearch(''); }}>
          <i className="fas fa-triangle-exclamation" style={{ marginRight: 6 }} />Incident Log
          {!isPro && <i className="fas fa-lock" style={{ marginLeft: 6, fontSize: '0.75rem', opacity: 0.7 }} />}
        </button>
      </div>

      {/* Search */}
      {(tab === 'collectors' || isPro) && (
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${tab === 'collectors' ? 'by child or collector name' : tab === 'dbs' ? 'by name' : 'by person or description'}…`}
          style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.9rem', marginBottom: 16, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none', background: '#fff' }} />
      )}

      {/* ── COLLECTORS TAB ── */}
      {tab === 'collectors' && (
        <>
          <div style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: '0.85rem', color: '#1d4ed8', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <i className="fas fa-info-circle" style={{ marginTop: 1 }} />
            <span>Add the named adults who are authorised to collect each child. Staff can use this list to verify pickups in the Children Check-In screen.</span>
          </div>
          <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Child</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Authorised Collector</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Relationship</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Phone</th>
                  <th style={{ padding: '12px 16px' }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredCollectors.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8' }}>No authorised collectors added yet.</td></tr>
                ) : filteredCollectors.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#1e293b' }}>{c.child_name}</td>
                    <td style={{ padding: '12px 16px', color: '#374151' }}>{c.collector_name}</td>
                    <td style={{ padding: '12px 16px', color: '#64748b' }}>{c.relationship || '—'}</td>
                    <td style={{ padding: '12px 16px', color: '#64748b' }}>{c.phone || '—'}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button onClick={() => openEdit('collector', c)} style={{ background: 'none', border: 'none', color: NAV, cursor: 'pointer', marginRight: 8, fontSize: '0.85rem' }}>Edit</button>
                      <button onClick={() => remove('collector', c.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem' }}>Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── DBS TAB ── */}
      {tab === 'dbs' && !isPro && <ProGate slug={slug} />}
      {tab === 'dbs' && isPro && (
        <>
          {dbsRecords.some(r => { const s = dbsStatus(r.renewal_date); return s.label === 'Expired' || s.label.includes('d left'); }) && (
            <div style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: '0.85rem', color: '#92400e', display: 'flex', gap: 10 }}>
              <i className="fas fa-triangle-exclamation" style={{ marginTop: 1, color: '#d97706' }} />
              <span>Some DBS checks are expired or expiring soon — review and update below.</span>
            </div>
          )}
          <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Name</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Role</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Check Type</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Renewal</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Training</th>
                  <th style={{ padding: '12px 16px' }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredDbs.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8' }}>No DBS records added yet.</td></tr>
                ) : filteredDbs.map(r => {
                  const status = dbsStatus(r.renewal_date);
                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#1e293b' }}>{r.full_name}</td>
                      <td style={{ padding: '12px 16px', color: '#64748b' }}>{r.role || '—'}</td>
                      <td style={{ padding: '12px 16px', color: '#374151', textTransform: 'capitalize' }}>{CHECK_TYPES[r.check_type] || r.check_type}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'inline-block', background: status.bg, color: status.color, borderRadius: 6, padding: '3px 10px', fontWeight: 700, fontSize: '0.78rem' }}>{status.label}</div>
                        {r.renewal_date && <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>{new Date(r.renewal_date).toLocaleDateString('en-GB')}</div>}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {r.training_safeguarding && <span style={{ background: '#eff6ff', color: '#1d4ed8', borderRadius: 5, padding: '2px 8px', fontSize: '0.72rem', fontWeight: 600 }}>Safeguarding</span>}
                          {r.training_first_aid && <span style={{ background: '#f0fdf4', color: '#15803d', borderRadius: 5, padding: '2px 8px', fontSize: '0.72rem', fontWeight: 600 }}>First Aid</span>}
                          {!r.training_safeguarding && !r.training_first_aid && <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>None recorded</span>}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button onClick={() => openEdit('dbs', r)} style={{ background: 'none', border: 'none', color: NAV, cursor: 'pointer', marginRight: 8, fontSize: '0.85rem' }}>Edit</button>
                        <button onClick={() => remove('dbs', r.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem' }}>Delete</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── INCIDENTS TAB ── */}
      {tab === 'incidents' && !isPro && <ProGate slug={slug} />}
      {tab === 'incidents' && isPro && (
        <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ textAlign: 'left', padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Date</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Type</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Person</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Summary</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Follow Up</th>
                <th style={{ padding: '12px 16px' }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredIncidents.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8' }}>No incidents logged.</td></tr>
              ) : filteredIncidents.map(i => (
                <tr key={i.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 16px', color: '#374151', whiteSpace: 'nowrap' }}>{new Date(i.incident_date).toLocaleDateString('en-GB')}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: INCIDENT_COLORS[i.incident_type] + '20', color: INCIDENT_COLORS[i.incident_type], borderRadius: 6, padding: '3px 10px', fontWeight: 700, fontSize: '0.78rem', textTransform: 'capitalize' }}>
                      {INCIDENT_TYPES[i.incident_type] || i.incident_type}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#374151' }}>{i.person_involved || '—'}</td>
                  <td style={{ padding: '12px 16px', color: '#64748b', maxWidth: 260 }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.description}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {i.follow_up_required
                      ? <span style={{ color: '#d97706', fontWeight: 700, fontSize: '0.8rem' }}><i className="fas fa-circle-exclamation" style={{ marginRight: 4 }} />Required</span>
                      : <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>None</span>
                    }
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <button onClick={() => openEdit('incident', i)} style={{ background: 'none', border: 'none', color: NAV, cursor: 'pointer', marginRight: 8, fontSize: '0.85rem' }}>Edit</button>
                    <button onClick={() => remove('incident', i.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem' }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── MODALS ── */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '28px 24px', width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}>

            {/* Collector modal */}
            {modal === 'collector' && (
              <>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: NAV, marginBottom: 20 }}>{editTarget ? 'Edit' : 'Add'} Authorised Collector</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div><label style={lbl}>Child's name *</label><input style={inp} value={form.childName} onChange={e => set('childName', e.target.value)} placeholder="e.g. Emma Johnson" /></div>
                  <div><label style={lbl}>Collector's name *</label><input style={inp} value={form.collectorName} onChange={e => set('collectorName', e.target.value)} placeholder="e.g. Sarah Johnson" /></div>
                  <div><label style={lbl}>Relationship</label><input style={inp} value={form.relationship} onChange={e => set('relationship', e.target.value)} placeholder="e.g. Mother, Grandparent, Aunt" /></div>
                  <div><label style={lbl}>Phone number</label><input style={inp} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="e.g. 07700 900123" /></div>
                </div>
              </>
            )}

            {/* DBS modal */}
            {modal === 'dbs' && (
              <>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: NAV, marginBottom: 20 }}>{editTarget ? 'Edit' : 'Add'} DBS Record</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div><label style={lbl}>Full name *</label><input style={inp} value={form.fullName} onChange={e => set('fullName', e.target.value)} /></div>
                  <div><label style={lbl}>Role / position</label><input style={inp} value={form.role} onChange={e => set('role', e.target.value)} placeholder="e.g. Children's Worker, Youth Leader" /></div>
                  <div><label style={lbl}>Check type</label>
                    <select style={inp} value={form.checkType} onChange={e => set('checkType', e.target.value)}>
                      {Object.entries(CHECK_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div><label style={lbl}>Certificate / reference number</label><input style={inp} value={form.checkNumber} onChange={e => set('checkNumber', e.target.value)} /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div><label style={lbl}>Issue date</label><input style={inp} type="date" value={form.issueDate} onChange={e => set('issueDate', e.target.value)} /></div>
                    <div><label style={lbl}>Renewal date</label><input style={inp} type="date" value={form.renewalDate} onChange={e => set('renewalDate', e.target.value)} /></div>
                  </div>
                  <div>
                    <label style={{ ...lbl, marginBottom: 8 }}>Training completed</label>
                    <div style={{ display: 'flex', gap: 16 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem', cursor: 'pointer' }}>
                        <input type="checkbox" checked={form.trainingSafeguarding} onChange={e => set('trainingSafeguarding', e.target.checked)} />
                        Safeguarding
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem', cursor: 'pointer' }}>
                        <input type="checkbox" checked={form.trainingFirstAid} onChange={e => set('trainingFirstAid', e.target.checked)} />
                        First Aid
                      </label>
                    </div>
                  </div>
                  <div><label style={lbl}>Notes</label><textarea rows={2} style={{ ...inp, resize: 'vertical' }} value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
                </div>
              </>
            )}

            {/* Incident modal */}
            {modal === 'incident' && (
              <>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: NAV, marginBottom: 20 }}>{editTarget ? 'Edit' : 'Log'} Incident</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div><label style={lbl}>Date *</label><input style={inp} type="date" value={form.incidentDate} onChange={e => set('incidentDate', e.target.value)} /></div>
                    <div><label style={lbl}>Type</label>
                      <select style={inp} value={form.incidentType} onChange={e => set('incidentType', e.target.value)}>
                        {Object.entries(INCIDENT_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </div>
                  </div>
                  <div><label style={lbl}>Person involved</label><input style={inp} value={form.personInvolved} onChange={e => set('personInvolved', e.target.value)} /></div>
                  <div><label style={lbl}>Reported by</label><input style={inp} value={form.reportedBy} onChange={e => set('reportedBy', e.target.value)} /></div>
                  <div><label style={lbl}>Description *</label><textarea rows={3} style={{ ...inp, resize: 'vertical' }} value={form.description} onChange={e => set('description', e.target.value)} placeholder="What happened?" /></div>
                  <div><label style={lbl}>Action taken</label><textarea rows={2} style={{ ...inp, resize: 'vertical' }} value={form.actionTaken} onChange={e => set('actionTaken', e.target.value)} placeholder="What was done in response?" /></div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', cursor: 'pointer', fontWeight: 600, color: '#374151' }}>
                    <input type="checkbox" checked={form.followUpRequired} onChange={e => set('followUpRequired', e.target.checked)} />
                    Follow-up required
                  </label>
                  {form.followUpRequired && (
                    <div><label style={lbl}>Follow-up notes</label><textarea rows={2} style={{ ...inp, resize: 'vertical' }} value={form.followUpNotes} onChange={e => set('followUpNotes', e.target.value)} /></div>
                  )}
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setModal(null)} style={{ flex: 1, background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={save} disabled={saving || (modal === 'collector' && (!form.childName || !form.collectorName)) || (modal === 'dbs' && !form.fullName) || (modal === 'incident' && (!form.description || !form.incidentDate))}
                style={{ flex: 1, background: saving ? '#94a3b8' : modal === 'incident' ? '#ef4444' : NAV, color: '#fff', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Saving…' : editTarget ? 'Update' : modal === 'incident' ? 'Log Incident' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
