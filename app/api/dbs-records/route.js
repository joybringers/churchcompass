import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { adminFromRequest } from '@/lib/guard';

export async function GET(req) {
  const payload = await adminFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const churchId = new URL(req.url).searchParams.get('churchId');
  if (payload.churchId !== churchId) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const { data, error } = await supabase
    .from('cc_dbs_records')
    .select('*')
    .eq('church_id', churchId)
    .order('person_name');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ records: data || [] });
}

export async function POST(req) {
  const payload = await adminFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const body = await req.json();
  if (payload.churchId !== body.churchId) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  if (!body.personName) return NextResponse.json({ error: 'Name required.' }, { status: 400 });

  const { data, error } = await supabase.from('cc_dbs_records').insert({
    church_id: body.churchId,
    person_name: body.personName,
    role: body.role || null,
    dbs_number: body.dbsNumber || null,
    issue_date: body.issueDate || null,
    expiry_date: body.expiryDate || null,
    status: body.status || 'valid',
    notes: body.notes || null,
  }).select('id').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: data.id });
}

export async function PUT(req) {
  const payload = await adminFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const body = await req.json();

  const { data: rec } = await supabase.from('cc_dbs_records').select('church_id').eq('id', body.id).single();
  if (!rec || rec.church_id !== payload.churchId) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const { error } = await supabase.from('cc_dbs_records').update({
    person_name: body.personName,
    role: body.role || null,
    dbs_number: body.dbsNumber || null,
    issue_date: body.issueDate || null,
    expiry_date: body.expiryDate || null,
    status: body.status || 'valid',
    notes: body.notes || null,
    updated_at: new Date().toISOString(),
  }).eq('id', body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  const payload = await adminFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const id = new URL(req.url).searchParams.get('id');

  const { data: rec } = await supabase.from('cc_dbs_records').select('church_id').eq('id', id).single();
  if (!rec || rec.church_id !== payload.churchId) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  await supabase.from('cc_dbs_records').delete().eq('id', id);
  return NextResponse.json({ ok: true });
}
