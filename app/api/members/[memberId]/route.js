import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { adminFromRequest } from '@/lib/guard';

export async function GET(req, { params }) {
  const payload = await adminFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const { memberId } = await params;

  const { data: member, error } = await supabase
    .from('cc_members')
    .select('*, parent:parent_id(id, first_name, last_name, member_type)')
    .eq('id', memberId)
    .single();

  if (error || !member) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  if (member.church_id !== payload.churchId) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const [children, groups, attendance, customValues, customFields, dbs] = await Promise.all([
    // Children of this member
    supabase.from('cc_members').select('id, first_name, last_name, member_type, dob').eq('parent_id', memberId),
    // Groups this member belongs to
    supabase.from('cc_group_members').select('id, role, joined_at, cc_groups(id, name, group_type, color)').eq('member_id', memberId),
    // Last 20 attendance records
    supabase.from('cc_attendance').select('id, sign_in_time, sign_out_time, cc_events(id, name, event_date, type)').eq('member_id', memberId).order('sign_in_time', { ascending: false }).limit(20),
    // Custom field values
    supabase.from('cc_custom_field_values').select('field_id, value').eq('record_id', memberId).eq('record_type', 'member'),
    // Custom field definitions
    supabase.from('cc_custom_fields').select('id, label, field_type').eq('church_id', member.church_id).eq('form_type', 'member').order('sort_order'),
    // DBS records for this person (match by name)
    supabase.from('cc_dbs_records').select('*').eq('church_id', member.church_id).ilike('person_name', `%${member.first_name}%`),
  ]);

  return NextResponse.json({
    member,
    children: children.data || [],
    groups: (groups.data || []).map(g => ({ ...g.cc_groups, membership_id: g.id, role: g.role, joined_at: g.joined_at })),
    attendance: attendance.data || [],
    customValues: Object.fromEntries((customValues.data || []).map(v => [v.field_id, v.value])),
    customFields: customFields.data || [],
    dbs: dbs.data || [],
  });
}
