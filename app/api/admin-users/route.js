import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabase } from '@/lib/supabase';
import { adminFromRequest } from '@/lib/guard';

const FREE_ADMIN_LIMIT = 3;

export async function GET(req) {
  const payload = await adminFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const churchId = searchParams.get('churchId');
  if (payload.churchId !== churchId) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const { data, error } = await supabase
    .from('cc_admin_users')
    .select('id, name, email, role, created_at')
    .eq('church_id', churchId)
    .order('created_at');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ admins: data });
}

export async function POST(req) {
  const payload = await adminFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  // Only owner (or legacy token without role) can add admins
  if (payload.role && payload.role !== 'owner') return NextResponse.json({ error: 'Only the owner can add admins.' }, { status: 403 });

  const { churchId, name, email, password } = await req.json();
  if (payload.churchId !== churchId) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  if (!name || !email || !password) return NextResponse.json({ error: 'Name, email and password required.' }, { status: 400 });

  // Check plan limit
  const { data: church } = await supabase.from('cc_churches').select('plan').eq('id', churchId).single();
  const isPro = church?.plan === 'pro' || church?.plan === 'custom';
  if (!isPro) {
    const { count } = await supabase.from('cc_admin_users').select('id', { count: 'exact' }).eq('church_id', churchId);
    if (count >= FREE_ADMIN_LIMIT) return NextResponse.json({ error: `Free plan allows up to ${FREE_ADMIN_LIMIT} admins. Upgrade to Pro for unlimited.` }, { status: 403 });
  }

  // Check for duplicate email
  const { data: existing } = await supabase.from('cc_admin_users').select('id').eq('church_id', churchId).ilike('email', email).single();
  if (existing) return NextResponse.json({ error: 'An admin with that email already exists.' }, { status: 409 });

  const password_hash = await bcrypt.hash(password, 12);
  const { data, error } = await supabase.from('cc_admin_users')
    .insert({ church_id: churchId, name, email, role: 'admin', password_hash })
    .select('id, name, email, role, created_at').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(req) {
  const payload = await adminFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  if (payload.role && payload.role !== 'owner') return NextResponse.json({ error: 'Only the owner can edit admins.' }, { status: 403 });

  const { id, churchId, name } = await req.json();
  if (payload.churchId !== churchId) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const { error } = await supabase.from('cc_admin_users').update({ name }).eq('id', id).eq('church_id', churchId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  const payload = await adminFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  if (payload.role && payload.role !== 'owner') return NextResponse.json({ error: 'Only the owner can remove admins.' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  // Verify record belongs to this church
  const { data: target } = await supabase.from('cc_admin_users').select('church_id, role').eq('id', id).single();
  if (!target || target.church_id !== payload.churchId) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  if (target.role === 'owner') return NextResponse.json({ error: 'Cannot remove the owner account.' }, { status: 400 });

  await supabase.from('cc_admin_users').delete().eq('id', id);
  return NextResponse.json({ ok: true });
}
