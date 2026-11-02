import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { adminFromRequest, cleanText } from '@/lib/guard';

// GET — admin or public kiosk: list registrations
// Public (no auth): requires churchId only — used by self-service kiosk
// Admin (with auth): requires churchId, optionally eventId
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const churchId = searchParams.get('churchId');
  const eventId = searchParams.get('eventId');

  if (!churchId) return NextResponse.json({ error: 'churchId required' }, { status: 400 });

  const payload = await adminFromRequest(req);
  if (payload) {
    // Admin: enforce church ownership
    if (payload.churchId !== churchId) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  } else {
    // Public kiosk: verify church exists
    const { data: ch } = await supabase.from('cc_churches').select('id').eq('id', churchId).maybeSingle();
    if (!ch) return NextResponse.json({ error: 'Church not found.' }, { status: 404 });
  }

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

// PUT — admin or public kiosk: mark/unmark attended
// Public kiosk: pass { id, attended: true, public: true } — can only mark attended (not unmark)
export async function PUT(req) {
  try {
    const body = await req.json();
    const { id, attended, public: isPublic } = body;
    if (!id) return NextResponse.json({ error: 'id required.' }, { status: 400 });

    if (isPublic) {
      // Public kiosk: only allow marking attended, verify record exists
      if (!attended) return NextResponse.json({ error: 'Public check-in can only mark attended.' }, { status: 403 });
      const { data: rec } = await supabase.from('cc_event_registrations').select('id').eq('id', id).maybeSingle();
      if (!rec) return NextResponse.json({ error: 'Record not found.' }, { status: 404 });
      const { error } = await supabase.from('cc_event_registrations').update({ attended_at: new Date().toISOString() }).eq('id', id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    // Admin only for unmark or full control
    const payload = await adminFromRequest(req);
    if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

    const update = { attended_at: attended ? new Date().toISOString() : null };
    const { data, error } = await supabase.from('cc_event_registrations').update(update).eq('id', id).eq('church_id', payload.churchId).select('id');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data || data.length === 0) return NextResponse.json({ error: 'Record not found.' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Bad request.' }, { status: 400 });
  }
}
