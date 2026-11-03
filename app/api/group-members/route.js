import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { adminFromRequest } from '@/lib/guard';

// GET ?groupId=X — members of a group
export async function GET(req) {
  const payload = await adminFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const groupId = searchParams.get('groupId');

  const { data: group } = await supabase.from('cc_groups').select('church_id').eq('id', groupId).single();
  if (!group || group.church_id !== payload.churchId) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const { data, error } = await supabase
    .from('cc_group_members')
    .select('id, role, joined_at, cc_members(id, first_name, last_name, email, phone, member_type)')
    .eq('group_id', groupId)
    .order('joined_at');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ members: (data || []).map(r => ({ ...r.cc_members, membership_id: r.id, role: r.role, joined_at: r.joined_at })) });
}

// POST { groupId, memberIds: [] } — add members to a group
export async function POST(req) {
  const payload = await adminFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const { groupId, memberIds } = await req.json();

  const { data: group } = await supabase.from('cc_groups').select('church_id').eq('id', groupId).single();
  if (!group || group.church_id !== payload.churchId) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const inserts = memberIds.map(mid => ({ group_id: groupId, member_id: mid }));
  const { error } = await supabase.from('cc_group_members').upsert(inserts, { onConflict: 'group_id,member_id', ignoreDuplicates: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE ?membershipId=X — remove one member from a group
export async function DELETE(req) {
  const payload = await adminFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const membershipId = searchParams.get('membershipId');

  // Verify ownership via group
  const { data: gm } = await supabase
    .from('cc_group_members')
    .select('group_id, cc_groups(church_id)')
    .eq('id', membershipId)
    .single();
  if (!gm || gm.cc_groups?.church_id !== payload.churchId) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  await supabase.from('cc_group_members').delete().eq('id', membershipId);
  return NextResponse.json({ ok: true });
}
