'use client';
import { useState, useEffect } from 'react';
import { useCC } from '../layout';

const NAV = '#1e3a5f';
const GOLD = '#f59e0b';

const TYPES = [
  { value: 'tithe',    label: 'Tithe',    color: '#1e3a5f', bg: '#eff6ff' },
  { value: 'offering', label: 'Offering', color: '#7c3aed', bg: '#f5f3ff' },
  { value: 'special',  label: 'Special',  color: '#d97706', bg: '#fffbeb' },
  { value: 'mission',  label: 'Mission',  color: '#16a34a', bg: '#f0fdf4' },
  { value: 'building', label: 'Building', color: '#dc2626', bg: '#fef2f2' },
];

const typeInfo = (v) => TYPES.find(t => t.value === v) || TYPES[0];

const BLANK = { memberId: '', donorName: '', amount: '', giftAid: false, givingDate: new Date().toISOString().split('T')[0], givingType: 'tithe', reference: '', notes: '' };

function fmt(n) { return `£${parseFloat(n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}` }

function StatCard({ label, value, sub, color = NAV, icon }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className={`fas ${icon}`} style={{ color, fontSize: 14 }} />
        </div>
        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b' }}>{label}</span>
      </div>
      <div style={{ fontSize: '1.6rem', fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function downloadCSV(records) {
  const cols = ['Date', 'Donor', 'Type', 'Amount', 'Gift Aid', 'Gift Aid Value', 'Reference', 'Notes'];
  const rows = records.map(r => [
    r.giving_date,
    r.cc_members ? `${r.cc_members.first_name} ${r.cc_members.last_name}` : (r.donor_name || 'Anonymous'),
    r.giving_type,
    r.amount,
    r.gift_aid ? 'Yes' : 'No',
    r.gift_aid ? (parseFloat(r.amount) * 0.25).toFixed(2) : '0.00',
    r.reference || '',
    r.notes || '',
  ]);
  const csv = [cols, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `giving-${new Date().toISOString().split('T')[0]}.csv`; a.click();
}

export default function Giving() {
  const ctx = useCC();
  const [records, setRecords] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'add' | record
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [year, setYear] = useState(new Date().getFullYear());

  const { church, token } = ctx || {};
  const isPro = church?.plan === 'pro' || church?.plan === 'custom';

  const load = async () => {
    if (!ctx) return;
    setLoading(true);
    const [givingRes, membersRes] = await Promise.all([
      fetch(`/api/giving?churchId=${church.id}&year=${year}`, { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch(`/api/members?churchId=${church.id}`, { headers: { 'Authorization': `Bearer ${token}` } }),
    ]);
    const [gd, md] = await Promise.all([givingRes.json(), membersRes.json()]);
    setRecords(gd.records || []);
    setMembers(md.members || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [ctx, year]);

  const openAdd = () => { setForm({ ...BLANK, givingDate: new Date().toISOString().split('T')[0] }); setModal('add'); };
  const openEdit = (r) => {
    setForm({ memberId: r.member_id || '', donorName: r.donor_name || '', amount: r.amount, giftAid: r.gift_aid, givingDate: r.giving_date, givingType: r.giving_type, reference: r.reference || '', notes: r.notes || '' });
    setModal(r);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    const isEdit = modal && modal !== 'add';
    const url = '/api/giving';
    const body = { churchId: church.id, ...form };
    if (isEdit) body.id = modal.id;
    const res = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(body) });
    setSaving(false);
    if (res.ok) { setModal(null); load(); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this giving record?')) return;
    await fetch(`/api/giving?id=${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    load();
  };

  if (!ctx) return null;

  // Stats
  const total = records.reduce((s, r) => s + parseFloat(r.amount), 0);
  const giftAidRecords = records.filter(r => r.gift_aid);
  const giftAidValue = giftAidRecords.reduce((s, r) => s + parseFloat(r.amount) * 0.25, 0);
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();
  const monthTotal = records.filter(r => {
    const d = new Date(r.giving_date + 'T12:00:00');
    return d.getMonth() === thisMonth && d.getFullYear() === parseInt(year);
  }).reduce((s, r) => s + parseFloat(r.amount), 0);
  const uniqueGivers = new Set(records.map(r => r.member_id || r.donor_name || 'anon')).size;

  // Filter
  const filtered = records.filter(r => {
    const name = r.cc_members ? `${r.cc_members.first_name} ${r.cc_members.last_name}` : (r.donor_name || '');
    const matchSearch = !search || name.toLowerCase().includes(search.toLowerCase()) || (r.reference || '').toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || r.giving_type === filterType;
    return matchSearch && matchType;
  });

  const inp = { padding: '10px 12px', border: '1.5px solid #dde3f0', borderRadius: 10, fontSize: '0.9rem', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' };
  const lbl = { fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 };

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div style={{ padding: '32px 28px', maxWidth: 900 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: NAV, marginBottom: 2 }}>
            <i className="fas fa-hand-holding-heart" style={{ marginRight: 8, color: GOLD }} />Giving
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Track donations, tithes and Gift Aid.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Year selector */}
          <select value={year} onChange={e => setYear(e.target.value)}
            style={{ padding: '9px 12px', border: '1.5px solid #dde3f0', borderRadius: 10, fontSize: '0.875rem', background: '#fff', color: NAV, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', outline: 'none' }}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {isPro && records.length > 0 && (
            <button onClick={() => downloadCSV(records)}
              style={{ background: '#f1f5f9', color: NAV, border: 'none', borderRadius: 10, padding: '9px 16px', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}>
              <i className="fas fa-download" style={{ marginRight: 6 }} />CSV
            </button>
          )}
          <button onClick={openAdd}
            style={{ background: NAV, color: '#fff', border: 'none', borderRadius: 10, padding: '9px 18px', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}>
            <i className="fas fa-plus" style={{ marginRight: 6 }} />Record giving
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14, marginBottom: 24 }}>
        <StatCard label={`Total ${year}`} value={fmt(total)} sub={`${records.length} records`} color={NAV} icon="fa-sterling-sign" />
        <StatCard label="This month" value={fmt(monthTotal)} sub={new Date().toLocaleString('en-GB', { month: 'long' })} color="#7c3aed" icon="fa-calendar" />
        <StatCard label="Gift Aid claimable" value={fmt(giftAidValue)} sub={`${giftAidRecords.length} gift-aided donations`} color="#16a34a" icon="fa-gift" />
        <StatCard label="Givers" value={uniqueGivers} sub={`in ${year}`} color={GOLD} icon="fa-users" />
      </div>

      {/* Gift Aid notice */}
      {giftAidValue > 0 && (
        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <i className="fas fa-circle-info" style={{ color: '#16a34a', flexShrink: 0 }} />
          <span style={{ fontSize: '0.85rem', color: '#166534' }}>
            You can claim <strong>{fmt(giftAidValue)}</strong> from HMRC through Gift Aid on {giftAidRecords.length} gift-aided donations this year.
            <a href="https://www.gov.uk/claim-gift-aid" target="_blank" rel="noreferrer" style={{ color: '#16a34a', marginLeft: 6, fontWeight: 600 }}>Learn how →</a>
          </span>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search donor or reference…"
          style={{ padding: '9px 14px', border: '1.5px solid #dde3f0', borderRadius: 10, fontSize: '0.875rem', background: '#fff', outline: 'none', flex: 1, minWidth: 200, fontFamily: 'inherit' }} />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[{ value: 'all', label: 'All' }, ...TYPES].map(t => (
            <button key={t.value} onClick={() => setFilterType(t.value)}
              style={{ padding: '7px 14px', border: 'none', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', background: filterType === t.value ? NAV : '#f1f5f9', color: filterType === t.value ? '#fff' : '#475569', fontFamily: 'inherit' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 16, padding: '48px 24px', textAlign: 'center', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
          <i className="fas fa-hand-holding-heart" style={{ fontSize: 32, color: '#e2e8f0', display: 'block', marginBottom: 12 }} />
          <p style={{ color: '#94a3b8', marginBottom: 16 }}>{search || filterType !== 'all' ? 'No records match your filter.' : `No giving records for ${year} yet.`}</p>
          {!search && filterType === 'all' && (
            <button onClick={openAdd} style={{ background: NAV, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>
              Record first donation
            </button>
          )}
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Date', 'Donor', 'Type', 'Amount', 'Gift Aid', ''].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: h === 'Amount' ? 'right' : 'left', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const ti = typeInfo(r.giving_type);
                const donorName = r.cc_members ? `${r.cc_members.first_name} ${r.cc_members.last_name}` : (r.donor_name || 'Anonymous');
                return (
                  <tr key={r.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f8fafc' : 'none' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                      {new Date(r.giving_date + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>{donorName}</div>
                      {r.reference && <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'monospace' }}>{r.reference}</div>}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: ti.bg, color: ti.color, fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20, textTransform: 'capitalize' }}>{ti.label}</span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, color: NAV, fontSize: '0.95rem', fontVariantNumeric: 'tabular-nums' }}>
                      {fmt(r.amount)}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      {r.gift_aid ? (
                        <span title={`+${fmt(parseFloat(r.amount) * 0.25)} claimable`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f0fdf4', color: '#16a34a', fontSize: '0.72rem', fontWeight: 700, padding: '3px 8px', borderRadius: 20 }}>
                          <i className="fas fa-check" style={{ fontSize: 10 }} />Gift Aid
                        </span>
                      ) : <span style={{ color: '#e2e8f0', fontSize: 12 }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button onClick={() => openEdit(r)} style={{ background: 'none', border: 'none', color: NAV, cursor: 'pointer', fontSize: '0.8rem', marginRight: 8 }}>Edit</button>
                      <button onClick={() => remove(r.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}>Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
                <td colSpan={3} style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>
                  {filtered.length} records
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 900, color: NAV, fontSize: '1rem' }}>
                  {fmt(filtered.reduce((s, r) => s + parseFloat(r.amount), 0))}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Add / Edit Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '28px', maxWidth: 500, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontWeight: 800, color: NAV, fontSize: '1rem' }}>
                {modal === 'add' ? 'Record giving' : 'Edit giving record'}
              </div>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', fontSize: 20, color: '#94a3b8', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>

            <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Member or name */}
              <div>
                <label style={lbl}>Member (optional)</label>
                <select style={inp} value={form.memberId} onChange={e => setForm(f => ({ ...f, memberId: e.target.value, donorName: e.target.value ? '' : f.donorName }))}>
                  <option value="">— Enter name manually —</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>)}
                </select>
              </div>
              {!form.memberId && (
                <div>
                  <label style={lbl}>Donor name</label>
                  <input style={inp} value={form.donorName} onChange={e => setForm(f => ({ ...f, donorName: e.target.value }))} placeholder="e.g. Anonymous or visitor name" />
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={lbl}>Amount (£) <span style={{ color: '#dc2626' }}>*</span></label>
                  <input type="number" step="0.01" min="0.01" style={inp} value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required placeholder="0.00" />
                </div>
                <div>
                  <label style={lbl}>Date <span style={{ color: '#dc2626' }}>*</span></label>
                  <input type="date" style={inp} value={form.givingDate} onChange={e => setForm(f => ({ ...f, givingDate: e.target.value }))} required />
                </div>
              </div>

              <div>
                <label style={lbl}>Type</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {TYPES.map(t => (
                    <button type="button" key={t.value} onClick={() => setForm(f => ({ ...f, givingType: t.value }))}
                      style={{ padding: '7px 14px', border: `1.5px solid ${form.givingType === t.value ? t.color : '#e2e8f0'}`, borderRadius: 20, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', background: form.givingType === t.value ? t.bg : '#fff', color: form.givingType === t.value ? t.color : '#64748b', fontFamily: 'inherit' }}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gift Aid */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none', background: form.giftAid ? '#f0fdf4' : '#f8fafc', border: `1.5px solid ${form.giftAid ? '#86efac' : '#e2e8f0'}`, borderRadius: 10, padding: '12px 14px' }}>
                <input type="checkbox" checked={form.giftAid} onChange={e => setForm(f => ({ ...f, giftAid: e.target.checked }))} style={{ width: 16, height: 16, accentColor: '#16a34a' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: form.giftAid ? '#16a34a' : '#374151' }}>
                    Gift Aid eligible
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    Donor is a UK taxpayer and has made a Gift Aid declaration
                    {form.giftAid && form.amount ? ` · +${fmt(parseFloat(form.amount || 0) * 0.25)} claimable from HMRC` : ''}
                  </div>
                </div>
              </label>

              <div>
                <label style={lbl}>Reference / envelope no.</label>
                <input style={inp} value={form.reference} onChange={e => setForm(f => ({ ...f, reference: e.target.value }))} placeholder="Optional" />
              </div>
              <div>
                <label style={lbl}>Notes</label>
                <textarea rows={2} style={{ ...inp, resize: 'none' }} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional" />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
                <button type="button" onClick={() => setModal(null)} style={{ background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                <button type="submit" disabled={saving}
                  style={{ background: saving ? '#94a3b8' : NAV, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                  {saving ? 'Saving…' : modal === 'add' ? 'Save record' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
