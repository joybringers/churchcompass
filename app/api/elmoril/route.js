import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key');

  if (!key || key !== process.env.ELMORIL_ADMIN_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = Date.now();
  const ago = (days) => new Date(now - days * 86400000).toISOString();
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  const [
    churchRes, attRes, memberRes, firstTimerRes, eventRes, regRes,
    givingRes, adminUserRes,
  ] = await Promise.all([
    supabase.from('cc_churches').select('id, name, slug, denomination, admin_email, created_at, plan, stripe_customer_id').order('created_at', { ascending: false }),
    supabase.from('cc_attendance').select('church_id, sign_in_time'),
    supabase.from('cc_members').select('church_id, is_active, created_at'),
    supabase.from('cc_first_timers').select('church_id, created_at'),
    supabase.from('cc_events').select('church_id, created_at'),
    supabase.from('cc_event_registrations').select('church_id'),
    supabase.from('cc_giving_records').select('church_id, amount').then(r => ({ data: r.data || [] })).catch(() => ({ data: [] })),
    supabase.from('cc_admin_users').select('church_id, role').then(r => ({ data: r.data || [] })).catch(() => ({ data: [] })),
  ]);

  const churches = churchRes.data || [];
  const attendance = attRes.data || [];
  const members = memberRes.data || [];
  const firstTimers = firstTimerRes.data || [];
  const events = eventRes.data || [];
  const registrations = regRes.data || [];
  const giving = givingRes.data || [];
  const adminUsers = adminUserRes.data || [];

  // Plan revenue (estimate — £9/mo per Pro, Custom treated as £50/mo)
  const proChurches = churches.filter(c => c.plan === 'pro');
  const customChurches = churches.filter(c => c.plan === 'custom');
  const mrr = proChurches.length * 9 + customChurches.length * 50;
  const arr = mrr * 12;

  // Per-church stats
  const churchStats = churches.map(c => {
    const att = attendance.filter(a => a.church_id === c.id);
    const mem = members.filter(m => m.church_id === c.id && m.is_active !== false);
    const ft = firstTimers.filter(ft => ft.church_id === c.id);
    const ev = events.filter(ev => ev.church_id === c.id);
    const rsvp = registrations.filter(r => r.church_id === c.id);
    const gav = giving.filter(g => g.church_id === c.id);
    const adm = adminUsers.filter(a => a.church_id === c.id);
    const sorted = [...att].sort((a, b) => b.sign_in_time.localeCompare(a.sign_in_time));

    // Activation stage (0-5)
    let activationStage = 0;
    if (mem.length > 0) activationStage = 1;
    if (ev.length > 0) activationStage = 2;
    if (att.length > 0) activationStage = 3;
    if (ft.length > 0) activationStage = 4;
    if (att.some(a => a.sign_in_time >= ago(14))) activationStage = 5;

    return {
      id: c.id,
      name: c.name,
      slug: c.slug,
      denomination: c.denomination || null,
      adminEmail: c.admin_email,
      createdAt: c.created_at,
      plan: c.plan || 'free',
      hasStripe: !!c.stripe_customer_id,
      lastActivity: sorted[0]?.sign_in_time || null,
      memberCount: mem.length,
      totalSignIns: att.length,
      signInsThisMonth: att.filter(a => a.sign_in_time >= monthStart).length,
      signInsThisWeek: att.filter(a => a.sign_in_time >= ago(7)).length,
      isActive: att.some(a => a.sign_in_time >= ago(30)),
      firstTimerCount: ft.length,
      eventCount: ev.length,
      rsvpCount: rsvp.length,
      givingTotal: gav.reduce((s, g) => s + parseFloat(g.amount || 0), 0),
      adminCount: adm.length,
      activationStage,
      // Feature adoption flags
      hasMembers: mem.length > 0,
      hasEvents: ev.length > 0,
      hasAttendance: att.length > 0,
      hasFirstTimers: ft.length > 0,
      hasGiving: gav.length > 0,
    };
  });

  // Platform totals
  const totals = {
    churches: churches.length,
    activeChurches: churchStats.filter(c => c.isActive).length,
    proChurches: proChurches.length,
    freeChurches: churches.filter(c => !c.plan || c.plan === 'free').length,
    mrr,
    arr,
    conversionRate: churches.length > 0 ? Math.round((proChurches.length / churches.length) * 100) : 0,
    totalSignIns: attendance.length,
    signInsThisMonth: attendance.filter(a => a.sign_in_time >= monthStart).length,
    signInsThisWeek: attendance.filter(a => a.sign_in_time >= ago(7)).length,
    totalMembers: members.filter(m => m.is_active !== false).length,
    totalFirstTimers: firstTimers.length,
    totalEvents: events.length,
    newChurchesThisMonth: churches.filter(c => c.created_at >= monthStart).length,
    newChurchesThisWeek: churches.filter(c => c.created_at >= ago(7)).length,
  };

  // Activation funnel (% of churches at each stage)
  const funnel = [
    { stage: 'Registered', count: churches.length, description: 'Created an account' },
    { stage: 'Added members', count: churchStats.filter(c => c.hasMembers).length, description: 'At least 1 member' },
    { stage: 'Created event', count: churchStats.filter(c => c.hasEvents).length, description: 'At least 1 event' },
    { stage: 'Tracked attendance', count: churchStats.filter(c => c.hasAttendance).length, description: 'At least 1 sign-in' },
    { stage: 'Got first timer', count: churchStats.filter(c => c.hasFirstTimers).length, description: 'First timer recorded' },
    { stage: 'Active (14d)', count: churchStats.filter(c => c.isActive).length, description: 'Sign-in in last 14 days' },
  ];
  // Fix last funnel stage
  funnel[5].count = churchStats.filter(c => attendance.some(a => a.church_id === c.id && a.sign_in_time >= ago(14))).length;

  // Monthly new signups — last 6 months
  const monthlySignups = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    const start = d.toISOString();
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString();
    monthlySignups.push({
      label: d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
      signups: churches.filter(c => c.created_at >= start && c.created_at < end).length,
      signIns: attendance.filter(a => a.sign_in_time >= start && a.sign_in_time < end).length,
      proUpgrades: churches.filter(c => (c.plan === 'pro' || c.plan === 'custom') && c.created_at >= start && c.created_at < end).length,
    });
  }

  return NextResponse.json({ churches: churchStats, totals, funnel, monthlySignups });
}
