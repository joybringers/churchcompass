import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { adminFromRequest } from '@/lib/guard';

const FREE_LIMIT = 100;

// POST { churchId, members: [{firstName, lastName, email, phone, dob, memberType, notes}] }
export async function POST(req) {
  const payload = await adminFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const { churchId, members: rows } = await req.json();
  if (payload.churchId !== churchId) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  if (!rows?.length) return NextResponse.json({ error: 'No rows supplied.' }, { status: 400 });

  const { data: church } = await supabase.from('cc_churches').select('plan').eq('id', churchId).single();
  const isPro = church?.plan === 'pro' || church?.plan === 'custom';

  // Count existing members
  const { count } = await supabase.from('cc_members').select('id', { count: 'exact', head: true }).eq('church_id', churchId);
  const existing = count || 0;

  if (!isPro && existing + rows.length > FREE_LIMIT) {
    return NextResponse.json({ error: `Free plan limit is ${FREE_LIMIT} members. You have ${existing} and are importing ${rows.length}. Upgrade to Pro or reduce the import.` }, { status: 403 });
  }

  const inserts = rows.map(r => ({
    church_id: churchId,
    first_name: (r.firstName || '').trim(),
    last_name: (r.lastName || '').trim(),
    email: r.email?.trim() || null,
    phone: r.phone?.trim() || null,
    dob: r.dob || null,
    member_type: r.memberType || 'adult',
    notes: r.notes?.trim() || null,
  })).filter(r => r.first_name || r.last_name);

  const { data, error } = await supabase.from('cc_members').insert(inserts).select('id');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, imported: data?.length || 0 });
}
