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
    .from('cc_authorised_collectors')
    .select('*')
    .eq('church_id', churchId)
    .order('child_name');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ collectors: data });
}

export async function POST(req) {
  const payload = await adminFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const { churchId, childName, collectorName, relationship, phone } = await req.json();
  if (payload.churchId !== churchId) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const { data, error } = await supabase
    .from('cc_authorised_collectors')
    .insert({ church_id: churchId, child_name: childName, collector_name: collectorName, relationship, phone })
    .select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req) {
  const payload = await adminFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  const { data: existing } = await supabase.from('cc_authorised_collectors').select('church_id').eq('id', id).single();
  if (!existing || existing.church_id !== payload.churchId) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  await supabase.from('cc_authorised_collectors').delete().eq('id', id);
  return NextResponse.json({ ok: true });
}
