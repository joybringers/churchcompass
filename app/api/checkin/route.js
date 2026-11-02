import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/checkin?slug=city-of-god
// Returns church info + upcoming events (public)
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 });

  const { data: church } = await supabase
    .from('cc_churches')
    .select('id, name, primary_color')
    .eq('slug', slug)
    .maybeSingle();

  if (!church) return NextResponse.json({ error: 'Church not found.' }, { status: 404 });

  // Events from today onwards (and up to 7 days ago in case event is still running)
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  const { data: events } = await supabase
    .from('cc_events')
    .select('id, name, event_date, start_time, event_type')
    .eq('church_id', church.id)
    .gte('event_date', cutoffStr)
    .order('event_date', { ascending: false });

  return NextResponse.json({ church, events: events || [] });
}

// POST /api/checkin
// { slug, eventId, identifier } — identifier is name or email
// Marks the registration as attended, or adds as a walk-in if not registered
export async function POST(req) {
  try {
    const { slug, eventId, identifier } = await req.json();
    if (!slug || !eventId || !identifier?.trim()) {
      return NextResponse.json({ error: 'slug, eventId and identifier required' }, { status: 400 });
    }

    const term = identifier.trim().toLowerCase();

    // Look up church
    const { data: church } = await supabase
      .from('cc_churches')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    if (!church) return NextResponse.json({ error: 'Church not found.' }, { status: 404 });

    // Verify event belongs to church
    const { data: event } = await supabase
      .from('cc_events')
      .select('id, name')
      .eq('id', eventId)
      .eq('church_id', church.id)
      .maybeSingle();
    if (!event) return NextResponse.json({ error: 'Event not found.' }, { status: 404 });

    // Search registrations by name or email (case-insensitive)
    const { data: regs } = await supabase
      .from('cc_event_registrations')
      .select('*')
      .eq('church_id', church.id)
      .eq('event_id', eventId);

    const match = (regs || []).find(r =>
      r.name?.toLowerCase() === term ||
      r.email?.toLowerCase() === term
    );

    if (match) {
      if (match.attended_at) {
        // Already checked in
        return NextResponse.json({ ok: true, alreadyCheckedIn: true, name: match.name });
      }
      // Mark attended
      await supabase
        .from('cc_event_registrations')
        .update({ attended_at: new Date().toISOString() })
        .eq('id', match.id);
      return NextResponse.json({ ok: true, found: true, name: match.name });
    }

    // Not pre-registered — add as walk-in to attendance
    const { error } = await supabase.from('cc_attendance').insert({
      church_id: church.id,
      event_id: eventId,
      visitor_name: identifier.trim(),
      visitor_type: 'visitor',
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, found: false, name: identifier.trim() });
  } catch {
    return NextResponse.json({ error: 'Bad request.' }, { status: 400 });
  }
}
