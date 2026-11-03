'use client';
import { useState, useEffect } from 'react';
import { useCC } from '../layout';

const NAV = '#1e3a5f';
const GOLD = '#f59e0b';

const GROUP_TYPES = ['general', 'home group', 'team', 'ministry', 'youth', 'children', 'prayer', 'other'];
const PRESET_COLORS = ['#1e3a5f', '#f59e0b', '#16a34a', '#dc2626', '#7c3aed', '#0891b2', '#ea580c', '#db2777'];
const BLANK = { name: '', description: '', groupType: 'general', color: '#1e3a5f' };

export default function Groups() {
  const ctx = useCC();
  const [groups, setGroups] = useState([]);
  const [members, setMembers] = useState([]);
  const [modal, setModal] = useState(null); // null | 'add' | group obj
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [openGroup, setOpenGroup] = useState(null); // group obj being managed
  const [groupMembers, setGroupMembers] = useState([]);
  const [addSearch, setAddSearch] = useState('');
  const [addSelected, setAddSelected] = useState([]);
  const [addingSaving, setAddingSaving] = useState(false);

  const load = () => {
    if (!ctx) return;
    const { church, token } = ctx;
    const h = { 'Authorization': `Bearer ${token}` };
    fetch(`/api/groups?churchId=${church.id}`, { headers: h }).then(r => r.json()).then(d => setGroups(d.groups || []));
    fetch(`/api/members?churchId=${church.id}`, { headers: h }).then(r => r.json()).then(d => setMembers(d.members || []));
  };

  useEffect(() => { load(); }, [ctx]);

  const loadGroupMembers = async (group) => {
    const { token } = ctx;
    const res = await fetch(`/api/group-members?groupId=${group.id}`, { headers: { 'Authorization': `Bearer ${token}` } });
    const data = await res.json();
    setGroupMembers(data.members || []);
  };

  const openManage = async (group) => {
    setOpenGroup(group);
    setAddSearch(''); setAddSelected([]);
    await loadGroupMembers(group);
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const saveGroup = async () => {
    setSaving(true);
    const { church, token } = ctx;
    const h = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
    const body = { churchId: church.id, ...form };
    if (modal === 'add') await fetch('/api/groups', { method: 'POST', headers: h, body: JSON.stringify(body) });
    else await fetch('/api/groups', { method: 'PUT', headers: h, body: JSON.stringify({ ...body, id: modal.id }) });
    setSaving(false); setModal(null); load();
  };

  const deleteGroup = async (id) => {
    if (!confirm('Delete this group? Members will not be deleted.')) return;
    await fetch(`/api/groups?id=${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${ctx.token}` } });
    load();
    if (openGroup?.id === id) setOpenGroup(null);
  };

  const removeFromGroup = async (membershipId) => {
    await fetch(`/api/group-members?membershipId=${membershipId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${ctx.token}` } });
    await loadGroupMembers(openGroup);
    load();
  };

  const addToGroup = async () => {
    if (!addSelected.length) return;
    setAddingSaving(true);
    const { token } = ctx;
    await fetch('/api/group-members', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ groupId: openGroup.id, memberIds: addSelected }) });
    setAddSelected([]); setAddSearch(''); setAddingSaving(false);
    await loadGroupMembers(openGroup);
    load();
  };

  const inpStyle = { padding: '10px 12px', border: '1.5px solid #dde3f0', borderRadius: 10, fontSize: '0.95rem', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' };
  const lbl = { fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 3 };

  const groupMemberIds = new Set(groupMembers.map(m => m.id));
  const addableMembers = members.filter(m => {
    if (groupMemberIds.has(m.id)) return false;
    if (!addSearch.trim()) return true;
    return `${m.first_name} ${m.last_name}`.toLowerCase().includes(addSearch.toLowerCase());
  });

  if (!ctx) return null;

  return (
    <div style={{ padding: '32px 28px', maxWidth: 960 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: NAV, marginBottom: 2 }}>Groups</h1>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Home groups, teams, ministries and more.</p>
        </div>
        <button onClick={() => { setForm(BLANK); setModal('add'); }}
          style={{ background: NAV, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>
          <i className="fas fa-plus" style={{ marginRight: 6 }} />New group
        </button>
      </div>

      {groups.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 16, padding: '48px 24px', textAlign: 'center', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
          <i className="fas fa-layer-group" style={{ fontSize: 36, color: '#e2e8f0', marginBottom: 14, display: 'block' }} />
          <p style={{ color: '#94a3b8', marginBottom: 4 }}>No groups yet.</p>
          <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Create your first group to organise members into home groups, teams or ministries.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {groups.map(g => (
            <div key={g.id} style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: 6, background: g.color || NAV }} />
              <div style={{ padding: '18px 20px', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div style={{ fontWeight: 800, color: NAV, fontSize: '1rem' }}>{g.name}</div>
                  <span style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20, textTransform: 'capitalize', whiteSpace: 'nowrap', marginLeft: 8 }}>{g.group_type}</span>
                </div>
                {g.description && <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: 10, lineHeight: 1.5 }}>{g.description}</p>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                  <i className="fas fa-users" style={{ color: '#94a3b8', fontSize: 12 }} />
                  <span style={{ color: '#64748b', fontSize: '0.8rem' }}>{g.member_count} member{g.member_count !== 1 ? 's' : ''}</span>
                </div>
              </div>
              <div style={{ padding: '12px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 8 }}>
                <button onClick={() => openManage(g)}
                  style={{ flex: 1, background: NAV, color: '#fff', border: 'none', borderRadius: 8, padding: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}>
                  <i className="fas fa-users" style={{ marginRight: 5 }} />Manage
                </button>
                <button onClick={() => { setForm({ name: g.name, description: g.description || '', groupType: g.group_type, color: g.color }); setModal(g); }}
                  style={{ background: '#f1f5f9', color: NAV, border: 'none', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontSize: '0.8rem' }}>
                  <i className="fas fa-pen" />
                </button>
                <button onClick={() => deleteGroup(g.id)}
                  style={{ background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontSize: '0.8rem' }}>
                  <i className="fas fa-trash" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '28px 24px', width: '100%', maxWidth: 440 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: NAV, marginBottom: 20 }}>{modal === 'add' ? 'Create group' : 'Edit group'}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div><label style={lbl}>Group name *</label><input style={inpStyle} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Alpha Home Group 1" /></div>
              <div><label style={lbl}>Type</label>
                <select style={inpStyle} value={form.groupType} onChange={e => set('groupType', e.target.value)}>
                  {GROUP_TYPES.map(t => <option key={t} value={t} style={{ textTransform: 'capitalize' }}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div><label style={lbl}>Description</label><textarea rows={2} style={{ ...inpStyle, resize: 'vertical' }} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Optional description" /></div>
              <div>
                <label style={lbl}>Colour</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {PRESET_COLORS.map(c => (
                    <button key={c} type="button" onClick={() => set('color', c)}
                      style={{ width: 32, height: 32, borderRadius: '50%', background: c, border: form.color === c ? '3px solid #0f172a' : '3px solid transparent', cursor: 'pointer', outline: 'none' }} />
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setModal(null)} style={{ flex: 1, background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={saveGroup} disabled={saving || !form.name}
                style={{ flex: 1, background: saving ? '#94a3b8' : NAV, color: '#fff', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage members panel */}
      {openGroup && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 520, maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: openGroup.color || NAV, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, color: NAV, fontSize: '1rem' }}>{openGroup.name}</div>
                <div style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'capitalize' }}>{openGroup.group_type} · {groupMembers.length} member{groupMembers.length !== 1 ? 's' : ''}</div>
              </div>
              <button onClick={() => setOpenGroup(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>×</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
              {/* Add members */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 700, color: NAV, fontSize: '0.85rem', marginBottom: 8 }}>Add members</div>
                <input value={addSearch} onChange={e => setAddSearch(e.target.value)} placeholder="Search members to add…"
                  style={{ ...inpStyle, marginBottom: 8 }} />
                {addSearch && (
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, maxHeight: 160, overflowY: 'auto', marginBottom: 8 }}>
                    {addableMembers.length === 0 ? (
                      <div style={{ padding: '10px 14px', color: '#94a3b8', fontSize: '0.85rem' }}>No members found.</div>
                    ) : addableMembers.map(m => (
                      <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', cursor: 'pointer', borderBottom: '1px solid #f8fafc' }}>
                        <input type="checkbox" checked={addSelected.includes(m.id)} onChange={e => setAddSelected(s => e.target.checked ? [...s, m.id] : s.filter(x => x !== m.id))} />
                        <span style={{ fontSize: '0.875rem', color: '#1e293b', fontWeight: 500 }}>{m.first_name} {m.last_name}</span>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'capitalize', marginLeft: 'auto' }}>{m.member_type}</span>
                      </label>
                    ))}
                  </div>
                )}
                {addSelected.length > 0 && (
                  <button onClick={addToGroup} disabled={addingSaving}
                    style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 700, cursor: 'pointer', fontSize: '0.825rem' }}>
                    <i className="fas fa-plus" style={{ marginRight: 5 }} />{addingSaving ? 'Adding…' : `Add ${addSelected.length} member${addSelected.length !== 1 ? 's' : ''}`}
                  </button>
                )}
              </div>

              {/* Current members */}
              <div>
                <div style={{ fontWeight: 700, color: NAV, fontSize: '0.85rem', marginBottom: 8 }}>Current members ({groupMembers.length})</div>
                {groupMembers.length === 0 ? (
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No members yet. Use the search above to add some.</p>
                ) : groupMembers.map(m => (
                  <div key={m.membership_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f8fafc' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>{m.first_name} {m.last_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'capitalize' }}>{m.member_type}{m.email ? ` · ${m.email}` : ''}</div>
                    </div>
                    <button onClick={() => removeFromGroup(m.membership_id)}
                      style={{ background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
