'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCC } from '../../layout';

const NAV = '#1e3a5f';
const GOLD = '#f59e0b';

function daysUntil(d) {
  if (!d) return null;
  return Math.ceil((new Date(d) - new Date()) / 86400000);
}

function age(dob) {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid #f8fafc' }}>
      <div style={{ width: 130, fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', flexShrink: 0, paddingTop: 1 }}>{label}</div>
      <div style={{ fontSize: '0.875rem', color: '#1e293b' }}>{value}</div>
    </div>
  );
}

export default function MemberProfile() {
  const ctx = useCC();
  const router = useRouter();
  const { slug, memberId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ctx) return;
    fetch(`/api/members/${memberId}`, { headers: { 'Authorization': `Bearer ${ctx.token}` } })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [ctx, memberId]);

  if (!ctx || loading) return <div style={{ padding: 40, color: '#64748b' }}>Loading…</div>;
  if (!data?.member) return <div style={{ padding: 40, color: '#dc2626' }}>Member not found.</div>;

  const { member, children, groups, attendance, customValues, customFields, dbs } = data;
  const base = `/${slug}/admin`;
  const initials = `${member.first_name?.[0] || ''}${member.last_name?.[0] || ''}`.toUpperCase();
  const memberAge = age(member.dob);

  const typeColors = { adult: { bg: '#f0f9ff', color: '#0369a1' }, child: { bg: '#fdf4ff', color: '#7c3aed' }, visitor: { bg: '#f0fdf4', color: '#16a34a' }, staff: { bg: '#fffbeb', color: '#d97706' } };
  const tc = typeColors[member.member_type] || typeColors.adult;

  return (
    <div style={{ padding: '28px 24px', maxWidth: 900 }}>
      {/* Back */}
      <button onClick={() => router.push(base + '/members')}
        style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, marginBottom: 20, padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
        <i className="fas fa-arrow-left" style={{ fontSize: 12 }} />Back to Members
      </button>

      {/* Header */}
      <div style={{ background: '#fff', borderRadius: 16, padding: '24px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: NAV, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: '1.5rem' }}>{initials}</span>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: NAV, margin: 0 }}>{member.first_name} {member.last_name}</h1>
            <span style={{ background: tc.bg, color: tc.color, fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20, textTransform: 'capitalize' }}>{member.member_type}</span>
          </div>
          {member.email && <div style={{ color: '#64748b', fontSize: '0.85rem' }}><i className="fas fa-envelope" style={{ marginRight: 6, opacity: 0.5 }} />{member.email}</div>}
          {member.phone && <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: 2 }}><i className="fas fa-phone" style={{ marginRight: 6, opacity: 0.5 }} />{member.phone}</div>}
        </div>
        <button onClick={() => router.push(base + `/members?edit=${memberId}`)}
          style={{ background: NAV, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', flexShrink: 0 }}>
          <i className="fas fa-pen" style={{ marginRight: 6 }} />Edit
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Contact & details */}
          <div style={{ background: '#fff', borderRadius: 14, padding: '20px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
            <div style={{ fontWeight: 800, color: NAV, fontSize: '0.9rem', marginBottom: 10 }}>Details</div>
            <InfoRow label="Date of birth" value={member.dob ? `${new Date(member.dob + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}${memberAge ? ` (age ${memberAge})` : ''}` : null} />
            <InfoRow label="Member since" value={member.created_at ? new Date(member.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : null} />
            {member.parent && <InfoRow label="Parent / guardian" value={`${member.parent.first_name} ${member.parent.last_name}`} />}
            {member.notes && <InfoRow label="Notes" value={member.notes} />}
            {customFields.map(f => customValues[f.id] ? <InfoRow key={f.id} label={f.label} value={customValues[f.id]} /> : null)}
            {!member.dob && !member.notes && customFields.length === 0 && !member.parent && (
              <p style={{ color: '#94a3b8', fontSize: '0.825rem', margin: 0 }}>No additional details.</p>
            )}
          </div>

          {/* Family */}
          {children.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 14, padding: '20px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
              <div style={{ fontWeight: 800, color: NAV, fontSize: '0.9rem', marginBottom: 12 }}>Children</div>
              {children.map(c => (
                <div key={c.id} onClick={() => router.push(base + `/members/${c.id}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f8fafc', cursor: 'pointer' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#fdf4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className="fas fa-child" style={{ color: '#7c3aed', fontSize: 13 }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>{c.first_name} {c.last_name}</div>
                    {c.dob && <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Age {age(c.dob)}</div>}
                  </div>
                  <i className="fas fa-chevron-right" style={{ color: '#cbd5e1', fontSize: 11, marginLeft: 'auto' }} />
                </div>
              ))}
            </div>
          )}

          {/* Groups */}
          <div style={{ background: '#fff', borderRadius: 14, padding: '20px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
            <div style={{ fontWeight: 800, color: NAV, fontSize: '0.9rem', marginBottom: 12 }}>Groups</div>
            {groups.length === 0 ? <p style={{ color: '#94a3b8', fontSize: '0.825rem', margin: 0 }}>Not in any groups.</p>
              : groups.map(g => (
                <div key={g.membership_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f8fafc' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: g.color || NAV, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>{g.name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'capitalize' }}>{g.group_type}</div>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: 20, textTransform: 'capitalize' }}>{g.role}</span>
                </div>
              ))}
          </div>

          {/* DBS */}
          {dbs.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 14, padding: '20px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
              <div style={{ fontWeight: 800, color: NAV, fontSize: '0.9rem', marginBottom: 12 }}>DBS Records</div>
              {dbs.map(d => {
                const days = daysUntil(d.expiry_date);
                const isExpired = days !== null && days < 0;
                const isExpiring = days !== null && days >= 0 && days <= 90;
                return (
                  <div key={d.id} style={{ padding: '10px 0', borderBottom: '1px solid #f8fafc' }}>
                    <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem', marginBottom: 2 }}>{d.role || 'DBS Check'}</div>
                    {d.dbs_number && <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace' }}>{d.dbs_number}</div>}
                    {d.expiry_date && (
                      <div style={{ fontSize: '0.75rem', color: isExpired ? '#dc2626' : isExpiring ? '#d97706' : '#16a34a', fontWeight: 600, marginTop: 2 }}>
                        <i className={`fas ${isExpired ? 'fa-circle-xmark' : isExpiring ? 'fa-clock' : 'fa-circle-check'}`} style={{ marginRight: 4 }} />
                        {isExpired ? 'Expired' : isExpiring ? `Expires in ${days} days` : 'Valid'} · {new Date(d.expiry_date).toLocaleDateString('en-GB')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column — Attendance */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '20px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', alignSelf: 'start' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontWeight: 800, color: NAV, fontSize: '0.9rem' }}>
              Attendance history
              <span style={{ marginLeft: 8, background: '#f1f5f9', color: '#475569', fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>{attendance.length}</span>
            </div>
          </div>
          {attendance.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '0.825rem', margin: 0 }}>No attendance records yet.</p>
          ) : attendance.map(a => (
            <div key={a.id} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid #f8fafc', alignItems: 'flex-start' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', lineHeight: 1 }}>
                  {a.cc_events?.event_date ? new Date(a.cc_events.event_date + 'T12:00:00').toLocaleDateString('en-GB', { month: 'short' }) : ''}
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: NAV, lineHeight: 1 }}>
                  {a.cc_events?.event_date ? new Date(a.cc_events.event_date + 'T12:00:00').getDate() : ''}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.cc_events?.name || 'Event'}</div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 1 }}>
                  {a.sign_in_time ? new Date(a.sign_in_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''}
                  {a.sign_out_time ? ` → ${new Date(a.sign_out_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` : ''}
                  {a.cc_events?.type ? ` · ${a.cc_events.type}` : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
