import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const churchId = searchParams.get('churchId');
  const date = searchParams.get('date');
  const eventId = searchParams.get('eventId');
  const memberId = searchParams.get('memberId');
  const status = searchParams.get('status'); // 'in' = no sign_out_time
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const visitorType = searchParams.get('visitorType');

  if (!churchId) return NextResponse.json({ error: 'churchId required' }, { status: 400 });

  let query = supabase.from('cc_attendance').select('*, cc_members(first_name, last_name, member_type), cc_events(name)').eq('church_id', churchId).order('sign_in_time', { ascending: false });
  if (date) query = query.gte('sign_in_time', date + 'T00:00:00').lte('sign_in_time', date + 'T23:59:59');
  if (from) query = query.gte('sign_in_time', from + 'T00:00:00');
  if (to) query = query.lte('sign_in_time', to + 'T23:59:59');
  if (eventId) query = query.eq('event_id', eventId);
  if (memberId) query = query.eq('member_id', memberId);
  if (visitorType) query = query.eq('visitor_type', visitorType);
  if (status === 'in') query = query.is('sign_out_time', null);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ records: data });
}

export async function POST(req) {
  try {
    const { churchId, memberId, visitorName, visitorType, eventId, notes } = await req.json();
    if (!churchId) return NextResponse.json({ error: 'churchId required' }, { status: 400 });
    const { error } = await supabase.from('cc_attendance').insert({ church_id: churchId, member_id: memberId || null, visitor_name: visitorName || null, visitor_type: visitorType || 'member', event_id: eventId || null, notes: notes || null });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const { id, signOutTime, memberId } = await req.json();
    const update = {};
    if (signOutTime !== undefined) update.sign_out_time = signOutTime || new Date().toISOString();
    if (memberId !== undefined) update.member_id = memberId;
    const { error } = await supabase.from('cc_attendance').update(update).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
