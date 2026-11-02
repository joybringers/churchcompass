import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key');

  if (!key || key !== process.env.ELMORIL_ADMIN_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [churchRes, attRes, memberRes, firstTimerRes, eventRes, regRes] = await Promise.all([
    supabase.from('cc_churches').select('id, name, slug, denomination, admin_email, created_at').order('created_at', { ascending: false }),
    supabase.from('cc_attendance').select('church_id, sign_in_time, visitor_type'),
    supabase.from('cc_members').select('church_id, is_active'),
    supabase.from('cc_first_timers').select('church_id'),
    supabase.from('cc_events').select('church_id'),
    supabase.from('cc_event_registrations').select('church_id'),
  ]);

  const churches = churchRes.data || [];
  const attendance = attRes.data || [];
  const members = memberRes.data || [];
  const firstTimers = firstTimerRes.data || [];
  const events = eventRes.data || [];
  const registrations = regRes.data || [];

  const now = Date.now();
  const ago = (days) => new Date(now - days * 86400000).toISOString();
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  const churchStats = churches.map(c => {
    const att = attendance.filter(a => a.church_id === c.id);
    const mem = members.filter(m => m.church_id === c.id && m.is_active !== false);
    const sorted = [...att].sort((a, b) => b.sign_in_time.localeCompare(a.sign_in_time));

    return {
      id: c.id,
      name: c.name,
      slug: c.slug,
      denomination: c.denomination || null,
      adminEmail: c.admin_email,
      createdAt: c.created_at,
      lastActivity: sorted[0]?.sign_in_time || null,
      memberCount: mem.length,
      totalSignIns: att.length,
      signInsThisMonth: att.filter(a => a.sign_in_time >= monthStart).length,
      signInsThisWeek: att.filter(a => a.sign_in_time >= ago(7)).length,
      isActive: att.some(a => a.sign_in_time >= ago(30)),
      firstTimerCount: firstTimers.filter(ft => ft.church_id === c.id).length,
      eventCount: events.filter(ev => ev.church_id === c.id).length,
      rsvpCount: registrations.filter(r => r.church_id === c.id).length,
    };
  });

  const totals = {
    churches: churches.length,
    activeChurches: churchStats.filter(c => c.isActive).length,
    totalSignIns: attendance.length,
    signInsThisMonth: attendance.filter(a => a.sign_in_time >= monthStart).length,
    signInsThisWeek: attendance.filter(a => a.sign_in_time >= ago(7)).length,
    totalMembers: members.filter(m => m.is_active !== false).length,
    totalFirstTimers: firstTimers.length,
    totalEvents: events.length,
  };

  // Monthly breakdown for chart (last 6 months)
  const monthly = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    const start = d.toISOString();
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString();
    monthly.push({
      label: d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
      count: attendance.filter(a => a.sign_in_time >= start && a.sign_in_time < end).length,
    });
  }

  return NextResponse.json({ churches: churchStats, totals, monthly });
}
