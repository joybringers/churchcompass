import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { adminFromRequest } from '@/lib/guard';

export async function GET(req) {
  const payload = await adminFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const churchId = searchParams.get('churchId');
  if (payload.churchId !== churchId) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const year = searchParams.get('year') || new Date().getFullYear();
  const month = searchParams.get('month'); // optional

  let query = supabase
    .from('cc_giving_records')
    .select('*, cc_members(id, first_name, last_name)')
    .eq('church_id', churchId)
    .order('giving_date', { ascending: false });

  if (month) {
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const end = new Date(year, month, 0).toISOString().split('T')[0];
    query = query.gte('giving_date', start).lte('giving_date', end);
  } else {
    query = query.gte('giving_date', `${year}-01-01`).lte('giving_date', `${year}-12-31`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ records: data || [] });
}

export async function POST(req) {
  const payload = await adminFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const body = await req.json();
  const { churchId, memberId, donorName, amount, giftAid, givingDate, givingType, reference, notes } = body;
  if (payload.churchId !== churchId) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  if (!amount || isNaN(parseFloat(amount))) return NextResponse.json({ error: 'Valid amount required.' }, { status: 400 });
  if (!givingDate) return NextResponse.json({ error: 'Date required.' }, { status: 400 });

  const { data, error } = await supabase.from('cc_giving_records').insert({
    church_id: churchId,
    member_id: memberId || null,
    donor_name: donorName || null,
    amount: parseFloat(amount),
    gift_aid: giftAid || false,
    giving_date: givingDate,
    giving_type: givingType || 'tithe',
    reference: reference || null,
    notes: notes || null,
  }).select('*, cc_members(id, first_name, last_name)').single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(req) {
  const payload = await adminFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const { id, churchId, memberId, donorName, amount, giftAid, givingDate, givingType, reference, notes } = await req.json();
  if (payload.churchId !== churchId) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const { data: existing } = await supabase.from('cc_giving_records').select('church_id').eq('id', id).single();
  if (!existing || existing.church_id !== churchId) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const { error } = await supabase.from('cc_giving_records').update({
    member_id: memberId || null,
    donor_name: donorName || null,
    amount: parseFloat(amount),
    gift_aid: giftAid || false,
    giving_date: givingDate,
    giving_type: givingType || 'tithe',
    reference: reference || null,
    notes: notes || null,
    updated_at: new Date().toISOString(),
  }).eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  const payload = await adminFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  const { data: existing } = await supabase.from('cc_giving_records').select('church_id').eq('id', id).single();
  if (!existing || existing.church_id !== payload.churchId) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  await supabase.from('cc_giving_records').delete().eq('id', id);
  return NextResponse.json({ ok: true });
}
