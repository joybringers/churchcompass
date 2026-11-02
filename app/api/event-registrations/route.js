import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { adminFromRequest, cleanText } from '@/lib/guard';

// GET — admin: list registrations for an event
export async function GET(req) {
  const payload = await adminFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const churchId = searchParams.get('churchId');
  const eventId = searchParams.get('eventId');

  if (!churchId) return NextResponse.json({ error: 'churchId required' }, { status: 400 });
  if (payload.churchId !== churchId) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  let q = supabase.from('cc_event_registrations').select('*').eq('church_id', churchId).order('created_at', { ascending: true });
  if (eventId) q = q.eq('event_id', eventId);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ registrations: data });
}

// POST — public: register for an event
export async function POST(req) {
  try {
    const { churchId, eventId, name, email, phone } = await req.json();
    if (!churchId || !eventId) return NextResponse.json({ error: 'churchId and eventId required.' }, { status: 400 });

    const cleanName = cleanText(name, 120);
    if (!cleanName) return NextResponse.json({ error: 'Name is required.' }, { status: 400 });

    // Verify the event belongs to this church
    const { data: ev } = await supabase.from('cc_events').select('id').eq('id', eventId).eq('church_id', churchId).maybeSingle();
    if (!ev) return NextResponse.json({ error: 'Event not found.' }, { status: 404 });

    const { error } = await supabase.from('cc_event_registrations').insert({
      church_id: churchId,
      event_id: eventId,
      name: cleanName,
      email: cleanText(email, 200) || null,
      phone: cleanText(phone, 40) || null,
    });
    if (error) return NextResponse.json({ error: 'Could not save registration.' }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Bad request.' }, { status: 400 });
  }
}

// PUT — admin: mark/unmark attended
export async function PUT(req) {
  try {
    const payload = await adminFromRequest(req);
    if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

    const { id, attended } = await req.json();
    if (!id) return NextResponse.json({ error: 'id required.' }, { status: 400 });

    const update = { attended_at: attended ? new Date().toISOString() : null };
    const { data, error } = await supabase.from('cc_event_registrations').update(update).eq('id', id).eq('church_id', payload.churchId).select('id');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data || data.length === 0) return NextResponse.json({ error: 'Record not found.' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Bad request.' }, { status: 400 });
  }
}
