import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { adminFromRequest } from '@/lib/guard';

export async function GET(req) {
  const payload = await adminFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const churchId = searchParams.get('churchId');
  if (payload.churchId !== churchId) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const { data, error } = await supabase
    .from('cc_incidents')
    .select('*')
    .eq('church_id', churchId)
    .order('incident_date', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ incidents: data });
}

export async function POST(req) {
  const payload = await adminFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const body = await req.json();
  const { churchId, incidentDate, personInvolved, reportedBy, incidentType, description, actionTaken, followUpRequired, followUpNotes } = body;
  if (payload.churchId !== churchId) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  if (!description) return NextResponse.json({ error: 'Description required.' }, { status: 400 });

  const { data, error } = await supabase
    .from('cc_incidents')
    .insert({ church_id: churchId, incident_date: incidentDate, person_involved: personInvolved, reported_by: reportedBy, incident_type: incidentType, description, action_taken: actionTaken, follow_up_required: !!followUpRequired, follow_up_notes: followUpNotes })
    .select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(req) {
  const payload = await adminFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const body = await req.json();
  const { id, churchId, incidentDate, personInvolved, reportedBy, incidentType, description, actionTaken, followUpRequired, followUpNotes } = body;
  if (payload.churchId !== churchId) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const { error } = await supabase
    .from('cc_incidents')
    .update({ incident_date: incidentDate, person_involved: personInvolved, reported_by: reportedBy, incident_type: incidentType, description, action_taken: actionTaken, follow_up_required: !!followUpRequired, follow_up_notes: followUpNotes })
    .eq('id', id).eq('church_id', churchId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  const payload = await adminFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  const { data: existing } = await supabase.from('cc_incidents').select('church_id').eq('id', id).single();
  if (!existing || existing.church_id !== payload.churchId) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  await supabase.from('cc_incidents').delete().eq('id', id);
  return NextResponse.json({ ok: true });
}
