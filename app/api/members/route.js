import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { adminFromRequest, cleanSearch } from '@/lib/guard';

// Full member records are for church admins only. The kiosk uses /api/kiosk,
// which only returns names.
export async function GET(req) {
  const payload = await adminFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const churchId = searchParams.get('churchId');
  if (!churchId) return NextResponse.json({ error: 'churchId required' }, { status: 400 });
  if (payload.churchId !== churchId) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const search = cleanSearch(searchParams.get('search'));
  let query = supabase.from('cc_members').select('*').eq('church_id', churchId).eq('is_active', true).order('last_name');
  if (search) query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ members: data });
}

export async function POST(req) {
  const payload = await adminFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const { churchId, firstName, lastName, email, phone, dob, memberType, notes, parentId } = await req.json();
  if (payload.churchId !== churchId) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  const { data, error } = await supabase.from('cc_members').insert({ church_id: churchId, first_name: firstName, last_name: lastName, email, phone, dob: dob || null, member_type: memberType || 'adult', notes, parent_id: parentId || null }).select('id').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: data.id });
}

export async function PUT(req) {
  const payload = await adminFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const { id, churchId, firstName, lastName, email, phone, dob, memberType, notes, parentId } = await req.json();
  if (payload.churchId !== churchId) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  const { error } = await supabase.from('cc_members').update({ first_name: firstName, last_name: lastName, email, phone, dob: dob || null, member_type: memberType, notes, parent_id: parentId || null }).eq('id', id).eq('church_id', churchId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  const payload = await adminFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const { error } = await supabase.from('cc_members').update({ is_active: false }).eq('id', id).eq('church_id', payload.churchId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
