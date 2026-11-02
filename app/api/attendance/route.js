import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { adminFromRequest, cleanText, VISITOR_TYPES } from '@/lib/guard';

// Reading and changing attendance records is for signed-in church admins only,
// and only for their own church. The kiosk uses /api/kiosk instead.
export async function GET(req) {
  const payload = await adminFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

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
  if (payload.churchId !== churchId) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  let query = supabase.from('cc_attendance').select('*, cc_members(first_name, last_name, member_type), cc_events(name)').eq('church_id', churchId).order('sign_in_time', { ascending: false });
  if (date) query = query.gte('sign_in_time', date + 'T00:00:00').lte('sign_in_time', date + 'T23:59:59');
  if (from) query = query.gte('sign_in_time', from + 'T00:00:00');
  if (to) query = query.lte('sign_in_time', to + 'T23:59:59');
  if (eventId) query = query.eq('event_id', eventId);
  if (memberId) query = query.eq('member_id', memberId);
  if (visitorType) query = query.eq('visitor_type', visitorType);
  else query = query.neq('visitor_type', 'rsvp');
  if (status === 'in') query = query.is('sign_out_time', null);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ records: data });
}

async function belongsToChurch(table, id, churchId) {
  if (!id) return true;
  const { data } = await supabase.from(table).select('id').eq('id', id).eq('church_id', churchId).maybeSingle();
  return !!data;
}

export async function POST(req) {
  try {
    const { churchId, memberId, visitorName, visitorType, eventId, notes } = await req.json();
    if (!churchId) return NextResponse.json({ error: 'churchId required' }, { status: 400 });

    const payload = await adminFromRequest(req);
    const isAdmin = !!payload && payload.churchId === churchId;

    // Unauthenticated requests are no longer allowed here.
    // Event registrations (RSVPs) use /api/event-registrations instead.
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

    const type = visitorType || 'member';
    if (![...VISITOR_TYPES, 'rsvp'].includes(type)) return NextResponse.json({ error: 'Invalid visitor type.' }, { status: 400 });
    if (!(await belongsToChurch('cc_members', memberId, churchId))) return NextResponse.json({ error: 'Member not found.' }, { status: 404 });
    if (!(await belongsToChurch('cc_events', eventId, churchId))) return NextResponse.json({ error: 'Event not found.' }, { status: 404 });

    const { error } = await supabase.from('cc_attendance').insert({ church_id: churchId, member_id: memberId || null, visitor_name: cleanText(visitorName, 120), visitor_type: type, event_id: eventId || null, notes: notes || null });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Bad request.' }, { status: 400 });
  }
}

export async function PUT(req) {
  try {
    const payload = await adminFromRequest(req);
    if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

    const { id, signOutTime, attended, memberId } = await req.json();
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const update = {};
    if (attended === true) update.sign_out_time = new Date().toISOString();
    else if (attended === false) update.sign_out_time = null;
    else if (signOutTime !== undefined) {
      const t = signOutTime ? new Date(signOutTime) : new Date();
      if (Number.isNaN(t.getTime())) return NextResponse.json({ error: 'Invalid time.' }, { status: 400 });
      update.sign_out_time = t.toISOString();
    }
    if (memberId !== undefined) {
      if (!(await belongsToChurch('cc_members', memberId, payload.churchId))) return NextResponse.json({ error: 'Member not found.' }, { status: 404 });
      update.member_id = memberId || null;
    }
    if (Object.keys(update).length === 0) return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });

    const { data, error } = await supabase.from('cc_attendance').update(update).eq('id', id).eq('church_id', payload.churchId).select('id');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data || data.length === 0) return NextResponse.json({ error: 'Record not found.' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Bad request.' }, { status: 400 });
  }
}
