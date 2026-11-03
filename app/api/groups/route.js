import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { adminFromRequest } from '@/lib/guard';

export async function GET(req) {
  const payload = await adminFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const churchId = searchParams.get('churchId');
  if (payload.churchId !== churchId) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const { data: groups, error } = await supabase
    .from('cc_groups')
    .select('*')
    .eq('church_id', churchId)
    .order('name');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Count members per group
  const { data: counts } = await supabase
    .from('cc_group_members')
    .select('group_id')
    .in('group_id', (groups || []).map(g => g.id));

  const countMap = {};
  (counts || []).forEach(r => { countMap[r.group_id] = (countMap[r.group_id] || 0) + 1; });
  const result = (groups || []).map(g => ({ ...g, member_count: countMap[g.id] || 0 }));
  return NextResponse.json({ groups: result });
}

export async function POST(req) {
  const payload = await adminFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const { churchId, name, description, groupType, color } = await req.json();
  if (payload.churchId !== churchId) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  if (!name) return NextResponse.json({ error: 'Name required.' }, { status: 400 });

  const { data, error } = await supabase.from('cc_groups')
    .insert({ church_id: churchId, name, description: description || null, group_type: groupType || 'general', color: color || '#1e3a5f' })
    .select('id').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: data.id });
}

export async function PUT(req) {
  const payload = await adminFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const { id, churchId, name, description, groupType, color } = await req.json();
  if (payload.churchId !== churchId) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const { error } = await supabase.from('cc_groups')
    .update({ name, description: description || null, group_type: groupType || 'general', color: color || '#1e3a5f' })
    .eq('id', id).eq('church_id', churchId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  const payload = await adminFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  const { data: group } = await supabase.from('cc_groups').select('church_id').eq('id', id).single();
  if (!group || group.church_id !== payload.churchId) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  await supabase.from('cc_groups').delete().eq('id', id);
  return NextResponse.json({ ok: true });
}
