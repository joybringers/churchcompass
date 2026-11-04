'use client';
import { useState, useEffect } from 'react';
import { useCC } from '../layout';

const NAV = '#1e3a5f';
const GOLD = '#f59e0b';

const DBS_STATUSES = ['valid', 'expiring', 'expired', 'pending'];
const INC_SEVERITIES = ['low', 'medium', 'high'];
const INC_STATUSES = ['open', 'under_review', 'closed'];

const BLANK_DBS = { personName: '', role: '', dbsNumber: '', issueDate: '', expiryDate: '', status: 'valid', notes: '' };
const BLANK_INC = { incidentDate: '', title: '', description: '', peopleInvolved: '', actionTaken: '', reportedTo: '', severity: 'low', status: 'open' };

const statusColors = {
  valid:        { bg: '#f0fdf4', color: '#16a34a' },
  expiring:     { bg: '#fffbeb', color: '#d97706' },
  expired:      { bg: '#fef2f2', color: '#dc2626' },
  pending:      { bg: '#f1f5f9', color: '#475569' },
};
const sevColors = {
  low:    { bg: '#f0fdf4', color: '#16a34a' },
  medium: { bg: '#fffbeb', color: '#d97706' },
  high:   { bg: '#fef2f2', color: '#dc2626' },
};
const incStatusColors = {
  open:         { bg: '#fef2f2', color: '#dc2626' },
  under_review: { bg: '#fffbeb', color: '#d97706' },
  closed:       { bg: '#f1f5f9', color: '#475569' },
};

function chip(label, colors) {
  return (
    <span style={{ background: colors.bg, color: colors.color, fontSize: '0.7rem', fontWeight: 700, padding: '2px 10px', borderRadius: 20, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
      {label.replace('_', ' ')}
    </span>
  );
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
}

export default function Guard() {
  const ctx = useCC();
  const [tab, setTab] = useState('dbs');
  const [dbsRecords, setDbsRecords] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [modal, setModal] = useState(null); // null | 'dbs-add' | dbs-obj | 'inc-add' | inc-obj
  const [dbsForm, setDbsForm] = useState(BLANK_DBS);
  const [incForm, setIncForm] = useState(BLANK_INC);
  const [saving, setSaving] = useState(false);

  const load = () => {
    if (!ctx) return;
    const { church, token } = ctx;
    const h = { 'Authorization': `Bearer ${token}` };
    fetch(`/api/dbs-records?churchId=${church.id}`, { headers: h }).then(r => r.json()).then(d => setDbsRecords(d.records || []));
    fetch(`/api/incidents?churchId=${church.id}`, { headers: h }).then(r => r.json()).then(d => setIncidents(d.incidents || []));
  };

  useEffect(() => { load(); }, [ctx]);

  const setD = (k, v) => setDbsForm(f => ({ ...f, [k]: v }));
  const setI = (k, v) => setIncForm(f => ({ ...f, [k]: v }));

  const saveDbs = async () => {
    setSaving(true);
    const { church, token } = ctx;
    const h = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
    if (modal === 'dbs-add') {
      await fetch('/api/dbs-records', { method: 'POST', headers: h, body: JSON.stringify({ churchId: church.id, ...dbsForm }) });
    } else {
      await fetch('/api/dbs-records', { method: 'PUT', headers: h, body: JSON.stringify({ id: modal.id, ...dbsForm }) });
    }
    setSaving(false); setModal(null); load();
  };

  const saveInc = async () => {
    setSaving(true);
    const { church, token } = ctx;
    const h = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
    if (modal === 'inc-add') {
      await fetch('/api/incidents', { method: 'POST', headers: h, body: JSON.stringify({ churchId: church.id, ...incForm }) });
    } else {
      await fetch('/api/incidents', { method: 'PUT', headers: h, body: JSON.stringify({ id: modal.id, ...incForm }) });
    }
    setSaving(false); setModal(null); load();
  };

  const deleteDbs = async (id) => {
    if (!confirm('Delete this DBS record?')) return;
    await fetch(`/api/dbs-records?id=${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${ctx.token}` } });
    load();
  };

  const deleteInc = async (id) => {
    if (!confirm('Delete this incident record?')) return;
    await fetch(`/api/incidents?id=${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${ctx.token}` } });
    load();
  };

  const inpStyle = { padding: '10px 12px', border: '1.5px solid #dde3f0', borderRadius: 10, fontSize: '0.9rem', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' };
  const lbl = { fontSize: '0.78rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 3 };
  const tabBtn = (id, label, icon) => (
    <button onClick={() => setTab(id)}
      style={{ padding: '9px 20px', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', background: tab === id ? NAV : '#f1f5f9', color: tab === id ? '#fff' : '#475569' }}>
      <i className={`fas ${icon}`} style={{ marginRight: 6 }} />{label}
    </button>
  );

  // Stats
  const expiringSoon = dbsRecords.filter(r => { const d = daysUntil(r.expiry_date); return d !== null && d >= 0 && d <= 90; });
  const expired = dbsRecords.filter(r => r.status === 'expired' || (r.expiry_date && daysUntil(r.expiry_date) < 0));
  const openInc = incidents.filter(i => i.status === 'open');
  const highInc = incidents.filter(i => i.severity === 'high' && i.status !== 'closed');

  if (!ctx) return null;

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1000 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: NAV, marginBottom: 2 }}>
          <i className="fas fa-shield-halved" style={{ marginRight: 8, color: GOLD }} />Guard
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Safeguarding: DBS checks and incident log.</p>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 28 }}>
        {[
          { label: 'DBS Records', value: dbsRecords.length, icon: 'fa-id-card', color: NAV },
          { label: 'Expiring Soon', value: expiringSoon.length, icon: 'fa-clock', color: '#d97706', warn: expiringSoon.length > 0 },
          { label: 'Expired', value: expired.length, icon: 'fa-circle-exclamation', color: '#dc2626', warn: expired.length > 0 },
          { label: 'Open Incidents', value: openInc.length, icon: 'fa-triangle-exclamation', color: openInc.length > 0 ? '#dc2626' : '#16a34a', warn: openInc.length > 0 },
        ].map(s => (
          <div key={s.label} style={{ background: s.warn ? (s.color === '#dc2626' ? '#fef2f2' : '#fffbeb') : '#fff', borderRadius: 12, padding: '16px 18px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', borderLeft: `3px solid ${s.color}` }}>
            <div style={{ color: s.color, fontSize: 20, marginBottom: 6 }}><i className={`fas ${s.icon}`} /></div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: NAV }}>{s.value}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {tabBtn('dbs', 'DBS Records', 'fa-id-card')}
        {tabBtn('incidents', 'Incident Log', 'fa-triangle-exclamation')}
      </div>

      {/* DBS tab */}
      {tab === 'dbs' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
            <button onClick={() => { setDbsForm(BLANK_DBS); setModal('dbs-add'); }}
              style={{ background: NAV, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>
              <i className="fas fa-plus" style={{ marginRight: 6 }} />Add DBS Record
            </button>
          </div>
          {dbsRecords.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 14, padding: '40px', textAlign: 'center', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
              <i className="fas fa-id-card" style={{ fontSize: 32, color: '#e2e8f0', marginBottom: 12, display: 'block' }} />
              <p style={{ color: '#94a3b8' }}>No DBS records yet. Add one to start tracking.</p>
            </div>
          ) : (
            <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Name', 'Role', 'DBS Number', 'Issue Date', 'Expiry', 'Status', ''].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#374151', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.03em', borderBottom: '1px solid #f1f5f9' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dbsRecords.map(r => {
                    const days = daysUntil(r.expiry_date);
                    const isExpired = days !== null && days < 0;
                    const isExpiring = days !== null && days >= 0 && days <= 90;
                    const statusKey = isExpired ? 'expired' : isExpiring ? 'expiring' : r.status;
                    return (
                      <tr key={r.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: NAV }}>{r.person_name}</td>
                        <td style={{ padding: '12px 16px', color: '#64748b' }}>{r.role || '—'}</td>
                        <td style={{ padding: '12px 16px', color: '#64748b', fontFamily: 'monospace', fontSize: '0.8rem' }}>{r.dbs_number || '—'}</td>
                        <td style={{ padding: '12px 16px', color: '#64748b' }}>{r.issue_date ? new Date(r.issue_date).toLocaleDateString('en-GB') : '—'}</td>
                        <td style={{ padding: '12px 16px' }}>
                          {r.expiry_date ? (
                            <span style={{ color: isExpired ? '#dc2626' : isExpiring ? '#d97706' : '#374151', fontWeight: isExpired || isExpiring ? 700 : 400 }}>
                              {new Date(r.expiry_date).toLocaleDateString('en-GB')}
                              {isExpiring && !isExpired && <span style={{ fontSize: '0.7rem', marginLeft: 4 }}>({days}d)</span>}
                            </span>
                          ) : '—'}
                        </td>
                        <td style={{ padding: '12px 16px' }}>{chip(statusKey, statusColors[statusKey] || statusColors.valid)}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => { setDbsForm({ personName: r.person_name, role: r.role || '', dbsNumber: r.dbs_number || '', issueDate: r.issue_date || '', expiryDate: r.expiry_date || '', status: r.status, notes: r.notes || '' }); setModal(r); }}
                              style={{ background: '#f1f5f9', color: NAV, border: 'none', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>Edit</button>
                            <button onClick={() => deleteDbs(r.id)}
                              style={{ background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontSize: '0.78rem' }}>
                              <i className="fas fa-trash" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Incidents tab */}
      {tab === 'incidents' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
            <button onClick={() => { setIncForm({ ...BLANK_INC, incidentDate: new Date().toISOString().split('T')[0] }); setModal('inc-add'); }}
              style={{ background: NAV, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>
              <i className="fas fa-plus" style={{ marginRight: 6 }} />Log Incident
            </button>
          </div>
          {incidents.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 14, padding: '40px', textAlign: 'center', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
              <i className="fas fa-triangle-exclamation" style={{ fontSize: 32, color: '#e2e8f0', marginBottom: 12, display: 'block' }} />
              <p style={{ color: '#94a3b8' }}>No incidents logged.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {incidents.map(inc => (
                <div key={inc.id} style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', borderLeft: `4px solid ${sevColors[inc.severity]?.color || '#94a3b8'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, color: NAV, fontSize: '0.95rem' }}>{inc.title}</span>
                        {chip(inc.severity, sevColors[inc.severity] || sevColors.low)}
                        {chip(inc.status, incStatusColors[inc.status] || incStatusColors.open)}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: inc.description ? 8 : 0 }}>
                        {new Date(inc.incident_date).toLocaleDateString('en-GB')}
                        {inc.created_by && ` · logged by ${inc.created_by}`}
                      </div>
                      {inc.description && <p style={{ fontSize: '0.85rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>{inc.description}</p>}
                      {inc.people_involved && <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '6px 0 0', lineHeight: 1.4 }}><strong>People involved:</strong> {inc.people_involved}</p>}
                      {inc.action_taken && <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0', lineHeight: 1.4 }}><strong>Action taken:</strong> {inc.action_taken}</p>}
                      {inc.reported_to && <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0' }}><strong>Reported to:</strong> {inc.reported_to}</p>}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button onClick={() => { setIncForm({ incidentDate: inc.incident_date, title: inc.title, description: inc.description || '', peopleInvolved: inc.people_involved || '', actionTaken: inc.action_taken || '', reportedTo: inc.reported_to || '', severity: inc.severity, status: inc.status }); setModal(inc); }}
                        style={{ background: '#f1f5f9', color: NAV, border: 'none', borderRadius: 7, padding: '6px 12px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>Edit</button>
                      <button onClick={() => deleteInc(inc.id)}
                        style={{ background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: 7, padding: '6px 10px', cursor: 'pointer', fontSize: '0.78rem' }}>
                        <i className="fas fa-trash" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* DBS modal */}
      {(modal === 'dbs-add' || (modal && modal.person_name !== undefined)) && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '28px 24px', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: NAV, marginBottom: 20 }}>
              {modal === 'dbs-add' ? 'Add DBS Record' : 'Edit DBS Record'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div><label style={lbl}>Full name *</label><input style={inpStyle} value={dbsForm.personName} onChange={e => setD('personName', e.target.value)} placeholder="e.g. Sarah Johnson" /></div>
              <div><label style={lbl}>Role / position</label><input style={inpStyle} value={dbsForm.role} onChange={e => setD('role', e.target.value)} placeholder="e.g. Children's Worker" /></div>
              <div><label style={lbl}>DBS Certificate number</label><input style={inpStyle} value={dbsForm.dbsNumber} onChange={e => setD('dbsNumber', e.target.value)} placeholder="e.g. 001234567890" /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div><label style={lbl}>Issue date</label><input type="date" style={inpStyle} value={dbsForm.issueDate} onChange={e => setD('issueDate', e.target.value)} /></div>
                <div><label style={lbl}>Expiry date</label><input type="date" style={inpStyle} value={dbsForm.expiryDate} onChange={e => setD('expiryDate', e.target.value)} /></div>
              </div>
              <div><label style={lbl}>Status</label>
                <select style={inpStyle} value={dbsForm.status} onChange={e => setD('status', e.target.value)}>
                  {DBS_STATUSES.map(s => <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              <div><label style={lbl}>Notes</label><textarea rows={2} style={{ ...inpStyle, resize: 'vertical' }} value={dbsForm.notes} onChange={e => setD('notes', e.target.value)} /></div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setModal(null)} style={{ flex: 1, background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={saveDbs} disabled={saving || !dbsForm.personName}
                style={{ flex: 1, background: saving ? '#94a3b8' : NAV, color: '#fff', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Incident modal */}
      {(modal === 'inc-add' || (modal && modal.title !== undefined)) && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '28px 24px', width: '100%', maxWidth: 520, maxHeight: '92vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: NAV, marginBottom: 20 }}>
              {modal === 'inc-add' ? 'Log Incident' : 'Edit Incident'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div><label style={lbl}>Incident date *</label><input type="date" style={inpStyle} value={incForm.incidentDate} onChange={e => setI('incidentDate', e.target.value)} /></div>
              <div><label style={lbl}>Title / summary *</label><input style={inpStyle} value={incForm.title} onChange={e => setI('title', e.target.value)} placeholder="Brief description of the incident" /></div>
              <div><label style={lbl}>Full description</label><textarea rows={3} style={{ ...inpStyle, resize: 'vertical' }} value={incForm.description} onChange={e => setI('description', e.target.value)} /></div>
              <div><label style={lbl}>People involved</label><textarea rows={2} style={{ ...inpStyle, resize: 'vertical' }} value={incForm.peopleInvolved} onChange={e => setI('peopleInvolved', e.target.value)} placeholder="Names of people involved" /></div>
              <div><label style={lbl}>Action taken</label><textarea rows={2} style={{ ...inpStyle, resize: 'vertical' }} value={incForm.actionTaken} onChange={e => setI('actionTaken', e.target.value)} placeholder="What steps were taken?" /></div>
              <div><label style={lbl}>Reported to</label><input style={inpStyle} value={incForm.reportedTo} onChange={e => setI('reportedTo', e.target.value)} placeholder="e.g. DSL, police, social services" /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div><label style={lbl}>Severity</label>
                  <select style={inpStyle} value={incForm.severity} onChange={e => setI('severity', e.target.value)}>
                    {INC_SEVERITIES.map(s => <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
                <div><label style={lbl}>Status</label>
                  <select style={inpStyle} value={incForm.status} onChange={e => setI('status', e.target.value)}>
                    {INC_STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setModal(null)} style={{ flex: 1, background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={saveInc} disabled={saving || !incForm.title || !incForm.incidentDate}
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
