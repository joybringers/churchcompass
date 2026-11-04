'use client';
import { useState, useEffect } from 'react';
import { useCC } from '../layout';

const NAV = '#1e3a5f';
const GOLD = '#f59e0b';

export default function Communications() {
  const ctx = useCC();
  const [tab, setTab] = useState('compose');
  const [groups, setGroups] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [form, setForm] = useState({ subject: '', body: '', recipientType: 'all', groupId: '' });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const load = () => {
    if (!ctx) return;
    const { church, token } = ctx;
    const h = { 'Authorization': `Bearer ${token}` };
    fetch(`/api/groups?churchId=${church.id}`, { headers: h }).then(r => r.json()).then(d => setGroups(d.groups || []));
    fetch(`/api/communications?churchId=${church.id}`, { headers: h }).then(r => r.json()).then(d => setCampaigns(d.campaigns || []));
  };

  useEffect(() => { load(); }, [ctx]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const send = async () => {
    if (!form.subject.trim() || !form.body.trim()) return;
    if (!confirm(`Send this email to ${recipientLabel()}? This cannot be undone.`)) return;
    setSending(true); setResult(null);
    const { church, token } = ctx;
    const res = await fetch('/api/communications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ churchId: church.id, ...form }),
    });
    const data = await res.json();
    setSending(false);
    setResult(data);
    if (data.ok) { setForm({ subject: '', body: '', recipientType: 'all', groupId: '' }); load(); }
  };

  const recipientLabel = () => {
    if (form.recipientType === 'all') return 'all members';
    if (form.recipientType === 'first_timers') return 'all first timers';
    if (form.recipientType === 'group') {
      const g = groups.find(g => g.id === form.groupId);
      return g ? `${g.name} (${g.member_count} members)` : 'selected group';
    }
    return 'selected recipients';
  };

  const isPro = ctx?.church?.plan === 'pro' || ctx?.church?.plan === 'custom';
  const inpStyle = { padding: '10px 12px', border: '1.5px solid #dde3f0', borderRadius: 10, fontSize: '0.9rem', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' };
  const lbl = { fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 };
  const tabBtn = (id, label, icon) => (
    <button onClick={() => setTab(id)}
      style={{ padding: '9px 20px', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', background: tab === id ? NAV : '#f1f5f9', color: tab === id ? '#fff' : '#475569' }}>
      <i className={`fas ${icon}`} style={{ marginRight: 6 }} />{label}
    </button>
  );

  if (!ctx) return null;

  if (!isPro) return (
    <div style={{ padding: '32px 28px', maxWidth: 600 }}>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: NAV, marginBottom: 8 }}>
        <i className="fas fa-envelope" style={{ marginRight: 8, color: GOLD }} />Communications
      </h1>
      <div style={{ background: '#fff', borderRadius: 16, padding: '36px 28px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', textAlign: 'center', marginTop: 24 }}>
        <i className="fas fa-lock" style={{ fontSize: 32, color: '#e2e8f0', marginBottom: 14, display: 'block' }} />
        <div style={{ fontWeight: 800, color: NAV, fontSize: '1.1rem', marginBottom: 8 }}>Pro feature</div>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 20 }}>Send emails to your members, groups, or first timers directly from ChurchCompass.</p>
        <button onClick={() => window.location.href = `/${ctx.slug}/admin/settings`}
          style={{ background: GOLD, color: NAV, border: 'none', borderRadius: 10, padding: '12px 28px', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem' }}>
          Upgrade to Pro →
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '32px 28px', maxWidth: 760 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: NAV, marginBottom: 2 }}>
          <i className="fas fa-envelope" style={{ marginRight: 8, color: GOLD }} />Communications
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Send emails to your members, groups and first timers.</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {tabBtn('compose', 'Compose', 'fa-pen')}
        {tabBtn('history', 'Sent', 'fa-clock-rotate-left')}
      </div>

      {tab === 'compose' && (
        <div style={{ background: '#fff', borderRadius: 16, padding: '28px 24px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
          {result && (
            <div style={{ background: result.ok ? '#f0fdf4' : '#fef2f2', border: `1px solid ${result.ok ? '#86efac' : '#fecaca'}`, borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <i className={`fas ${result.ok ? 'fa-circle-check' : 'fa-circle-xmark'}`} style={{ color: result.ok ? '#16a34a' : '#dc2626', fontSize: 16 }} />
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: result.ok ? '#166534' : '#991b1b' }}>
                {result.ok ? `Sent to ${result.sent} recipient${result.sent !== 1 ? 's' : ''}${result.failed ? ` · ${result.failed} failed` : ''}` : result.error}
              </span>
              <button onClick={() => setResult(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 16 }}>×</button>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Recipients */}
            <div>
              <label style={lbl}>Send to</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { value: 'all', label: 'All members', icon: 'fa-users' },
                  { value: 'first_timers', label: 'First timers', icon: 'fa-user-plus' },
                  { value: 'group', label: 'A group', icon: 'fa-layer-group' },
                ].map(opt => (
                  <button key={opt.value} type="button" onClick={() => set('recipientType', opt.value)}
                    style={{ padding: '8px 14px', border: `1.5px solid ${form.recipientType === opt.value ? NAV : '#dde3f0'}`, borderRadius: 10, background: form.recipientType === opt.value ? NAV + '10' : '#fff', color: form.recipientType === opt.value ? NAV : '#64748b', fontWeight: form.recipientType === opt.value ? 700 : 500, cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'inherit' }}>
                    <i className={`fas ${opt.icon}`} style={{ marginRight: 6 }} />{opt.label}
                  </button>
                ))}
              </div>
              {form.recipientType === 'group' && (
                <select value={form.groupId} onChange={e => set('groupId', e.target.value)} style={{ ...inpStyle, marginTop: 8 }}>
                  <option value="">Select a group…</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name} ({g.member_count} members)</option>)}
                </select>
              )}
            </div>

            {/* Subject */}
            <div>
              <label style={lbl}>Subject</label>
              <input style={inpStyle} value={form.subject} onChange={e => set('subject', e.target.value)} placeholder="e.g. Sunday service update" />
            </div>

            {/* Body */}
            <div>
              <label style={lbl}>Message</label>
              <textarea rows={10} style={{ ...inpStyle, resize: 'vertical', lineHeight: 1.6 }} value={form.body} onChange={e => set('body', e.target.value)}
                placeholder="Write your message here...&#10;&#10;You can use {name}, {first_name} or {last_name} to personalise each email." />
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 4 }}>
                <i className="fas fa-info-circle" style={{ marginRight: 4 }} />Use <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>{'{first_name}'}</code>, <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>{'{last_name}'}</code> or <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>{'{name}'}</code> to personalise.
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Sending to: <strong style={{ color: NAV }}>{recipientLabel()}</strong>
              </div>
              <button onClick={send} disabled={sending || !form.subject.trim() || !form.body.trim() || (form.recipientType === 'group' && !form.groupId)}
                style={{ background: sending ? '#94a3b8' : NAV, color: '#fff', border: 'none', borderRadius: 10, padding: '11px 24px', fontWeight: 700, cursor: sending ? 'not-allowed' : 'pointer', fontSize: '0.9rem' }}>
                <i className="fas fa-paper-plane" style={{ marginRight: 7 }} />{sending ? 'Sending…' : 'Send email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div>
          {campaigns.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 14, padding: '48px 24px', textAlign: 'center', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
              <i className="fas fa-clock-rotate-left" style={{ fontSize: 32, color: '#e2e8f0', display: 'block', marginBottom: 12 }} />
              <p style={{ color: '#94a3b8' }}>No emails sent yet.</p>
            </div>
          ) : campaigns.map(c => (
            <div key={c.id} style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontWeight: 800, color: NAV, fontSize: '0.95rem', marginBottom: 4 }}>{c.subject}</div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                    {new Date(c.sent_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    {c.sent_by && ` · sent by ${c.sent_by}`}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 4, textTransform: 'capitalize' }}>
                    To: {c.recipient_type === 'group' ? (c.cc_groups?.name || 'Group') : c.recipient_type.replace('_', ' ')}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <span style={{ background: '#f0fdf4', color: '#16a34a', fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>
                    <i className="fas fa-check" style={{ marginRight: 4 }} />{c.sent_count} sent
                  </span>
                  {c.failed_count > 0 && (
                    <span style={{ background: '#fef2f2', color: '#dc2626', fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>
                      {c.failed_count} failed
                    </span>
                  )}
                </div>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 10, lineHeight: 1.5, whiteSpace: 'pre-wrap', maxHeight: 60, overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
