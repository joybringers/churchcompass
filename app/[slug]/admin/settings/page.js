'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCC } from '../layout';

const NAV = '#1e3a5f';
const GOLD = '#f59e0b';

function Badge({ plan }) {
  const isPro = plan === 'pro' || plan === 'custom';
  return (
    <span style={{ background: isPro ? 'rgba(245,158,11,0.15)' : '#f1f5f9', color: isPro ? GOLD : '#64748b', fontSize: '0.72rem', fontWeight: 800, padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.06em', border: isPro ? '1px solid rgba(245,158,11,0.3)' : '1px solid #e2e8f0' }}>
      {plan === 'custom' ? 'Custom' : isPro ? 'Pro' : 'Free'}
    </span>
  );
}

function RoleChip({ role }) {
  const isOwner = role === 'owner';
  return (
    <span style={{ background: isOwner ? 'rgba(30,58,95,0.1)' : '#f1f5f9', color: isOwner ? NAV : '#64748b', fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20, textTransform: 'capitalize' }}>
      {role}
    </span>
  );
}

export default function Settings() {
  const ctx = useCC();
  const router = useRouter();

  const [tab, setTab] = useState('profile');
  const [saved, setSaved] = useState('');

  // Profile
  const [profile, setProfile] = useState({ name: '', denomination: '', address: '', phone: '', website: '' });
  const [profileSaving, setProfileSaving] = useState(false);

  // Team
  const [admins, setAdmins] = useState([]);
  const [addModal, setAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', email: '', password: '' });
  const [addError, setAddError] = useState('');
  const [addSaving, setAddSaving] = useState(false);

  // Password
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  // Billing
  const [billingLoading, setBillingLoading] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState('');

  const { church, token, slug, admin } = ctx || {};
  const isPro = church?.plan === 'pro' || church?.plan === 'custom';

  useEffect(() => {
    if (!ctx) return;
    setProfile({ name: church.name || '', denomination: church.denomination || '', address: church.address || '', phone: church.phone || '', website: church.website || '' });
    loadAdmins();
    // Check for Stripe success redirect
    const url = new URL(window.location.href);
    if (url.searchParams.get('upgraded') === '1') {
      setSaved('plan_upgraded');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [ctx]);

  const loadAdmins = async () => {
    if (!ctx) return;
    const res = await fetch(`/api/admin-users?churchId=${church.id}`, { headers: { 'Authorization': `Bearer ${token}` } });
    const data = await res.json();
    if (data.admins) setAdmins(data.admins);
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    const res = await fetch('/api/churches', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ id: church.id, ...profile }) });
    setProfileSaving(false);
    if (res.ok) setSaved('profile');
    setTimeout(() => setSaved(''), 3000);
  };

  const addAdmin = async (e) => {
    e.preventDefault();
    setAddError(''); setAddSaving(true);
    const res = await fetch('/api/admin-users', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ churchId: church.id, ...addForm }) });
    const data = await res.json();
    setAddSaving(false);
    if (!res.ok) { setAddError(data.error || 'Failed to add admin.'); return; }
    setAddModal(false);
    setAddForm({ name: '', email: '', password: '' });
    loadAdmins();
    setSaved('admin_added');
    setTimeout(() => setSaved(''), 3000);
  };

  const removeAdmin = async (id) => {
    if (!confirm('Remove this admin? They will lose access immediately.')) return;
    await fetch(`/api/admin-users?id=${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    loadAdmins();
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPw !== pwForm.confirm) { setPwError('Passwords do not match.'); return; }
    if (pwForm.newPw.length < 8) { setPwError('Password must be at least 8 characters.'); return; }
    setPwError(''); setPwSaving(true);
    const res = await fetch('/api/admin-users', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ action: 'change_password', currentPassword: pwForm.current, newPassword: pwForm.newPw }) });
    const data = await res.json();
    setPwSaving(false);
    if (!res.ok) { setPwError(data.error || 'Failed to change password.'); return; }
    setPwForm({ current: '', newPw: '', confirm: '' });
    setSaved('password');
    setTimeout(() => setSaved(''), 3000);
  };

  const openBillingPortal = async () => {
    setBillingLoading(true);
    const res = await fetch('/api/stripe/portal', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
    const data = await res.json();
    setBillingLoading(false);
    if (data.url) window.location.href = data.url;
  };

  const startCheckout = async (billing) => {
    setUpgradeLoading(billing);
    const res = await fetch('/api/stripe/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ churchId: church.id, billing }) });
    const data = await res.json();
    setUpgradeLoading('');
    if (data.url) window.location.href = data.url;
  };

  if (!ctx) return null;

  const inp = { padding: '10px 12px', border: '1.5px solid #dde3f0', borderRadius: 10, fontSize: '0.9rem', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' };
  const lbl = { fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 };
  const tabBtn = (id, label, icon) => (
    <button onClick={() => setTab(id)}
      style={{ padding: '9px 18px', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', background: tab === id ? NAV : '#f1f5f9', color: tab === id ? '#fff' : '#475569', fontFamily: 'inherit' }}>
      <i className={`fas ${icon}`} style={{ marginRight: 6 }} />{label}
    </button>
  );

  return (
    <div style={{ padding: '32px 28px', maxWidth: 760 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: NAV, marginBottom: 2 }}>
          <i className="fas fa-gear" style={{ marginRight: 8, color: GOLD }} />Settings
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Manage your church details, team, and subscription.</p>
      </div>

      {/* Toast */}
      {saved && (
        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <i className="fas fa-circle-check" style={{ color: '#16a34a', fontSize: 15 }} />
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#166534' }}>
            {saved === 'profile' ? 'Church profile saved.' : saved === 'admin_added' ? 'Admin added — they\'ve been sent their login details by email.' : saved === 'password' ? 'Password changed successfully.' : saved === 'plan_upgraded' ? 'Your plan has been upgraded to Pro!' : 'Saved.'}
          </span>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
        {tabBtn('profile', 'Church Profile', 'fa-church')}
        {tabBtn('team', 'Team', 'fa-users')}
        {tabBtn('billing', 'Plan & Billing', 'fa-credit-card')}
        {tabBtn('security', 'Security', 'fa-lock')}
      </div>

      {/* ── PROFILE ── */}
      {tab === 'profile' && (
        <div style={{ background: '#fff', borderRadius: 16, padding: '28px 24px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
          <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={lbl}>Church name</label>
              <input style={inp} value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Denomination</label>
                <input style={inp} value={profile.denomination} onChange={e => setProfile(p => ({ ...p, denomination: e.target.value }))} placeholder="e.g. Baptist" />
              </div>
              <div>
                <label style={lbl}>Phone</label>
                <input style={inp} value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} />
              </div>
            </div>
            <div>
              <label style={lbl}>Address</label>
              <input style={inp} value={profile.address} onChange={e => setProfile(p => ({ ...p, address: e.target.value }))} />
            </div>
            <div>
              <label style={lbl}>Website</label>
              <input style={inp} value={profile.website} onChange={e => setProfile(p => ({ ...p, website: e.target.value }))} placeholder="https://..." />
            </div>
            <div>
              <label style={lbl}>Admin URL slug</label>
              <div style={{ padding: '10px 12px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.875rem', color: '#64748b', fontFamily: 'monospace' }}>
                churchcompass.elmorilx.com/{slug}/admin
              </div>
              <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 4 }}>URL slugs cannot be changed after registration.</p>
            </div>
            <button type="submit" disabled={profileSaving}
              style={{ background: profileSaving ? '#94a3b8' : NAV, color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontWeight: 700, cursor: profileSaving ? 'not-allowed' : 'pointer', alignSelf: 'flex-start', paddingLeft: 24, paddingRight: 24 }}>
              {profileSaving ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        </div>
      )}

      {/* ── TEAM ── */}
      {tab === 'team' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                {admins.length} admin{admins.length !== 1 ? 's' : ''}
                {!isPro && <span style={{ marginLeft: 6, color: '#d97706', fontWeight: 600 }}>· Free plan: up to 3</span>}
              </span>
            </div>
            {admin?.role === 'owner' && (
              <button onClick={() => { setAddModal(true); setAddError(''); setAddForm({ name: '', email: '', password: '' }); }}
                style={{ background: NAV, color: '#fff', border: 'none', borderRadius: 10, padding: '9px 18px', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}>
                <i className="fas fa-plus" style={{ marginRight: 6 }} />Add admin
              </button>
            )}
          </div>

          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            {admins.map((a, i) => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', borderBottom: i < admins.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: a.role === 'owner' ? NAV : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: a.role === 'owner' ? '#fff' : '#64748b', fontWeight: 800, fontSize: '0.85rem' }}>
                    {a.name ? a.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?'}
                  </span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem' }}>{a.name}</span>
                    <RoleChip role={a.role} />
                    {a.id === ctx.admin?.adminId && <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600 }}>You</span>}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 1 }}>{a.email}</div>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', flexShrink: 0, textAlign: 'right' }}>
                  Added {new Date(a.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
                {admin?.role === 'owner' && a.role !== 'owner' && (
                  <button onClick={() => removeAdmin(a.id)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, flexShrink: 0, marginLeft: 4 }}>
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>

          {!isPro && admins.length >= 3 && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '14px 18px', marginTop: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
              <i className="fas fa-triangle-exclamation" style={{ color: '#d97706', flexShrink: 0 }} />
              <div style={{ fontSize: '0.85rem', color: '#92400e', flex: 1 }}>Free plan limit reached (3 admins). <strong>Upgrade to Pro</strong> for unlimited admin accounts.</div>
              <button onClick={() => setTab('billing')} style={{ background: GOLD, color: NAV, border: 'none', borderRadius: 8, padding: '6px 14px', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer', flexShrink: 0 }}>
                Upgrade →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── BILLING ── */}
      {tab === 'billing' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Current plan */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '24px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontWeight: 800, color: NAV, fontSize: '0.95rem', marginBottom: 6 }}>Current plan</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Badge plan={church.plan || 'free'} />
                  {isPro && <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 600 }}><i className="fas fa-circle-check" style={{ marginRight: 4 }} />Active</span>}
                </div>
              </div>
              {isPro && (
                <button onClick={openBillingPortal} disabled={billingLoading}
                  style={{ background: '#f1f5f9', color: NAV, border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 700, cursor: billingLoading ? 'not-allowed' : 'pointer', fontSize: '0.875rem' }}>
                  <i className="fas fa-arrow-up-right-from-square" style={{ marginRight: 6 }} />
                  {billingLoading ? 'Opening…' : 'Manage billing'}
                </button>
              )}
            </div>
            {isPro && (
              <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: 12 }}>
                To cancel, change payment method, or download invoices — click <strong>Manage billing</strong> above.
              </p>
            )}
          </div>

          {/* Upgrade section (Free only) */}
          {!isPro && (
            <div style={{ background: NAV, borderRadius: 16, padding: '28px 24px', boxShadow: '0 4px 24px rgba(30,58,95,0.2)' }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ color: GOLD, fontWeight: 800, fontSize: '1rem', marginBottom: 4 }}>Upgrade to Pro</div>
                <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.875rem' }}>Unlock unlimited members, admins, CSV export, Groups, Guard, Communications and more.</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <button onClick={() => startCheckout('monthly')} disabled={upgradeLoading}
                  style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.2)', borderRadius: 12, padding: '14px', fontWeight: 700, cursor: upgradeLoading ? 'not-allowed' : 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: GOLD }}>£9<span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>/month</span></div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>14-day free trial</div>
                  <div style={{ marginTop: 10, background: GOLD, color: NAV, borderRadius: 8, padding: '8px 12px', textAlign: 'center', fontSize: '0.825rem', fontWeight: 800 }}>
                    {upgradeLoading === 'monthly' ? 'Redirecting…' : 'Start free trial →'}
                  </div>
                </button>
                <button onClick={() => startCheckout('annual')} disabled={upgradeLoading}
                  style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.2)', borderRadius: 12, padding: '14px', fontWeight: 700, cursor: upgradeLoading ? 'not-allowed' : 'pointer', textAlign: 'left', fontFamily: 'inherit', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 10, right: 10, background: '#dcfce7', color: '#16a34a', fontSize: '0.6rem', fontWeight: 800, padding: '2px 6px', borderRadius: 20 }}>SAVE 17%</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: GOLD }}>£90<span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>/year</span></div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>£7.50/mo · 2 months free</div>
                  <div style={{ marginTop: 10, background: 'rgba(255,255,255,0.15)', color: '#fff', borderRadius: 8, padding: '8px 12px', textAlign: 'center', fontSize: '0.825rem', fontWeight: 800 }}>
                    {upgradeLoading === 'annual' ? 'Redirecting…' : 'Get annual →'}
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SECURITY ── */}
      {tab === 'security' && (
        <div style={{ background: '#fff', borderRadius: 16, padding: '28px 24px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ fontWeight: 800, color: NAV, marginBottom: 16 }}>Change password</div>
          <form onSubmit={changePassword} style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 420 }}>
            <div>
              <label style={lbl}>Current password</label>
              <input type="password" style={inp} value={pwForm.current} onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))} required />
            </div>
            <div>
              <label style={lbl}>New password</label>
              <input type="password" style={inp} value={pwForm.newPw} onChange={e => setPwForm(f => ({ ...f, newPw: e.target.value }))} required minLength={8} />
            </div>
            <div>
              <label style={lbl}>Confirm new password</label>
              <input type="password" style={inp} value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} required />
            </div>
            {pwError && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: '0.85rem' }}>{pwError}</div>}
            <button type="submit" disabled={pwSaving}
              style={{ background: pwSaving ? '#94a3b8' : NAV, color: '#fff', border: 'none', borderRadius: 10, padding: '12px 24px', fontWeight: 700, cursor: pwSaving ? 'not-allowed' : 'pointer', alignSelf: 'flex-start' }}>
              {pwSaving ? 'Saving…' : 'Change password'}
            </button>
          </form>
        </div>
      )}

      {/* Add Admin Modal */}
      {addModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '28px', maxWidth: 440, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontWeight: 800, color: NAV, fontSize: '1rem' }}>Add admin</div>
              <button onClick={() => setAddModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, color: '#94a3b8', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>
            <form onSubmit={addAdmin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={lbl}>Full name</label>
                <input style={inp} value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} required placeholder="e.g. Sarah Johnson" />
              </div>
              <div>
                <label style={lbl}>Email address</label>
                <input type="email" style={inp} value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} required />
              </div>
              <div>
                <label style={lbl}>Temporary password</label>
                <input type="text" style={inp} value={addForm.password} onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))} required minLength={8} placeholder="Min. 8 characters" />
                <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 3 }}>They'll receive this by email and can change it after first login.</p>
              </div>
              {addError && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: '0.85rem' }}>{addError}</div>}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
                <button type="button" onClick={() => setAddModal(false)} style={{ background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                <button type="submit" disabled={addSaving} style={{ background: addSaving ? '#94a3b8' : NAV, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 700, cursor: addSaving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                  {addSaving ? 'Adding…' : 'Add admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
