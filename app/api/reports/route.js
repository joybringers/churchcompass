import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { adminFromRequest } from '@/lib/guard';

export async function GET(req) {
  const payload = await adminFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const churchId = searchParams.get('churchId');
  if (payload.churchId !== churchId) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const [members, events, attendance, firstTimers] = await Promise.all([
    supabase.from('cc_members').select('id, created_at, member_type').eq('church_id', churchId),
    supabase.from('cc_events').select('id, name, event_date, type').eq('church_id', churchId).order('event_date', { ascending: false }).limit(50),
    supabase.from('cc_attendance').select('id, event_id, created_at, cc_events(event_date, name, type)').eq('church_id', churchId),
    supabase.from('cc_first_timers').select('id, created_at, follow_up_status').eq('church_id', churchId).order('created_at', { ascending: false }),
  ]);

  return NextResponse.json({
    members: members.data || [],
    events: events.data || [],
    attendance: attendance.data || [],
    firstTimers: firstTimers.data || [],
  });
}
