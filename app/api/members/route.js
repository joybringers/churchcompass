import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth';

async function auth(req) {
  const token = (req.headers.get('Authorization') || '').replace('Bearer ', '');
  return verifyToken(token);
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const churchId = searchParams.get('churchId');
  const search = searchParams.get('search');
  if (!churchId) return NextResponse.json({ error: 'churchId required' }, { status: 400 });

  let query = supabase.from('cc_members').select('*').eq('church_id', churchId).eq('is_active', true).order('last_name');
  if (search) query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ members: data });
}

export async function POST(req) {
  const payload = await auth(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const { churchId, firstName, lastName, email, phone, dob, memberType, notes } = await req.json();
  if (payload.churchId !== churchId) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  const { data, error } = await supabase.from('cc_members').insert({ church_id: churchId, first_name: firstName, last_name: lastName, email, phone, dob: dob || null, member_type: memberType || 'adult', notes }).select('id').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: data.id });
}

export async function PUT(req) {
  const payload = await auth(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const { id, churchId, firstName, lastName, email, phone, dob, memberType, notes } = await req.json();
  if (payload.churchId !== churchId) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  const { error } = await supabase.from('cc_members').update({ first_name: firstName, last_name: lastName, email, phone, dob: dob || null, member_type: memberType, notes }).eq('id', id).eq('church_id', churchId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  const payload = await auth(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const { error } = await supabase.from('cc_members').update({ is_active: false }).eq('id', id).eq('church_id', payload.churchId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
