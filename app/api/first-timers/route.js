import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth';

async function auth(req) {
  const token = (req.headers.get('Authorization') || '').replace('Bearer ', '');
  return verifyToken(token);
}

export async function GET(req) {
  const payload = await auth(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const churchId = searchParams.get('churchId');
  if (payload.churchId !== churchId) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  const { data, error } = await supabase.from('cc_first_timers').select('*').eq('church_id', churchId).order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (data && data.length > 0) {
    const ids = data.map(ft => ft.id);
    const { data: cvData } = await supabase.from('cc_custom_field_values')
      .select('record_id, value, field_id, cc_custom_fields(field_label)')
      .eq('record_type', 'first_timer')
      .in('record_id', ids);
    if (cvData) {
      const byRecord = {};
      cvData.forEach(cv => {
        if (!byRecord[cv.record_id]) byRecord[cv.record_id] = [];
        byRecord[cv.record_id].push({ label: cv.cc_custom_fields?.field_label, value: cv.value });
      });
      data.forEach(ft => { ft.customValues = byRecord[ft.id] || []; });
    }
  }

  return NextResponse.json({ firstTimers: data });
}

async function autoUpsertMember(churchId, firstName, lastName, opts = {}) {
  const fn = (firstName || '').trim();
  const ln = (lastName || '').trim();
  if (!fn) return null;

  // Check for existing active member with same name (case-insensitive)
  let query = supabase.from('cc_members').select('id').eq('church_id', churchId).eq('is_active', true).ilike('first_name', fn);
  if (ln) query = query.ilike('last_name', ln);
  const { data: existing } = await query.maybeSingle();
  if (existing) return existing.id;

  const { data, error } = await supabase.from('cc_members').insert({
    church_id: churchId, first_name: fn, last_name: ln || null,
    email: opts.email || null, phone: opts.phone || null, dob: opts.dob || null,
    member_type: opts.memberType || 'adult',
  }).select('id').single();
  return error ? null : data.id;
}

export async function POST(req) {
  try {
    const { churchId, firstName, lastName, email, phone, address, howHeard, prayerRequest, wouldLikeContact, customValues } = await req.json();
    if (!churchId || !firstName || !lastName) return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });

    const { data, error } = await supabase.from('cc_first_timers').insert({
      church_id: churchId, first_name: firstName, last_name: lastName, email: email || null,
      phone: phone || null, address: address || null, how_heard: howHeard || null,
      prayer_request: prayerRequest || null, would_like_contact: !!wouldLikeContact,
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (customValues && data) {
      const cvInserts = Object.entries(customValues).map(([fieldId, value]) => ({ field_id: fieldId, record_id: data.id, record_type: 'first_timer', value: String(value) }));
      if (cvInserts.length) await supabase.from('cc_custom_field_values').insert(cvInserts);
    }

    // Auto-add to members (best-effort, no duplicate if same name already exists)
    await autoUpsertMember(churchId, firstName, lastName, { email, phone, memberType: 'adult' });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req) {
  const payload = await auth(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const { id, followUpStatus, followUpNotes } = await req.json();
  const { error } = await supabase.from('cc_first_timers').update({ follow_up_status: followUpStatus, follow_up_notes: followUpNotes }).eq('id', id).eq('church_id', payload.churchId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
