import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { adminFromRequest } from '@/lib/guard';

export async function GET(req) {
  const payload = await adminFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const churchId = new URL(req.url).searchParams.get('churchId');
  if (payload.churchId !== churchId) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const { data, error } = await supabase
    .from('cc_incidents')
    .select('*')
    .eq('church_id', churchId)
    .order('incident_date', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ incidents: data || [] });
}

export async function POST(req) {
  const payload = await adminFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const body = await req.json();
  if (payload.churchId !== body.churchId) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  if (!body.title || !body.incidentDate) return NextResponse.json({ error: 'Title and date required.' }, { status: 400 });

  const { data, error } = await supabase.from('cc_incidents').insert({
    church_id: body.churchId,
    incident_date: body.incidentDate,
    title: body.title,
    description: body.description || null,
    people_involved: body.peopleInvolved || null,
    action_taken: body.actionTaken || null,
    reported_to: body.reportedTo || null,
    severity: body.severity || 'low',
    status: body.status || 'open',
    created_by: payload.adminName || null,
  }).select('id').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: data.id });
}

export async function PUT(req) {
  const payload = await adminFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const body = await req.json();

  const { data: inc } = await supabase.from('cc_incidents').select('church_id').eq('id', body.id).single();
  if (!inc || inc.church_id !== payload.churchId) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const { error } = await supabase.from('cc_incidents').update({
    incident_date: body.incidentDate,
    title: body.title,
    description: body.description || null,
    people_involved: body.peopleInvolved || null,
    action_taken: body.actionTaken || null,
    reported_to: body.reportedTo || null,
    severity: body.severity || 'low',
    status: body.status || 'open',
    updated_at: new Date().toISOString(),
  }).eq('id', body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  const payload = await adminFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const id = new URL(req.url).searchParams.get('id');

  const { data: inc } = await supabase.from('cc_incidents').select('church_id').eq('id', id).single();
  if (!inc || inc.church_id !== payload.churchId) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  await supabase.from('cc_incidents').delete().eq('id', id);
  return NextResponse.json({ ok: true });
}
