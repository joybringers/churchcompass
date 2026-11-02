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
    .from('cc_dbs_records')
    .select('*')
    .eq('church_id', churchId)
    .order('full_name');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ records: data });
}

export async function POST(req) {
  const payload = await adminFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const body = await req.json();
  const { churchId, fullName, role, checkType, checkNumber, issueDate, renewalDate, trainingSafeguarding, trainingFirstAid, notes } = body;
  if (payload.churchId !== churchId) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const { data, error } = await supabase
    .from('cc_dbs_records')
    .insert({ church_id: churchId, full_name: fullName, role, check_type: checkType, check_number: checkNumber, issue_date: issueDate || null, renewal_date: renewalDate || null, training_safeguarding: !!trainingSafeguarding, training_first_aid: !!trainingFirstAid, notes })
    .select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(req) {
  const payload = await adminFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const body = await req.json();
  const { id, churchId, fullName, role, checkType, checkNumber, issueDate, renewalDate, trainingSafeguarding, trainingFirstAid, notes } = body;
  if (payload.churchId !== churchId) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const { error } = await supabase
    .from('cc_dbs_records')
    .update({ full_name: fullName, role, check_type: checkType, check_number: checkNumber, issue_date: issueDate || null, renewal_date: renewalDate || null, training_safeguarding: !!trainingSafeguarding, training_first_aid: !!trainingFirstAid, notes })
    .eq('id', id).eq('church_id', churchId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  const payload = await adminFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  const { data: existing } = await supabase.from('cc_dbs_records').select('church_id').eq('id', id).single();
  if (!existing || existing.church_id !== payload.churchId) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  await supabase.from('cc_dbs_records').delete().eq('id', id);
  return NextResponse.json({ ok: true });
}
