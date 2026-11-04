import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabase } from '@/lib/supabase';
import { adminFromRequest } from '@/lib/guard';
import { sendEmail } from '@/lib/email';

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

  // Email the new admin their credentials (best-effort)
  const { data: church } = await supabase.from('cc_churches').select('name, slug').eq('id', churchId).single();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://churchcompass.elmorilx.com';
  try {
    await sendEmail({
      to: email,
      subject: `You've been added as an admin — ${church?.name || 'ChurchCompass'}`,
      body: `Hi ${name},\n\nYou've been added as an admin for ${church?.name || 'your church'} on ChurchCompass.\n\nYour login details:\n  Email: ${email}\n  Password: ${password}\n\nSign in here:\n  ${baseUrl}/${church?.slug}/admin\n\nYou can change your password after signing in.\n\nThe ChurchCompass Team`,
    });
  } catch { /* ignore */ }

  return NextResponse.json(data);
}

export async function PUT(req) {
  const payload = await adminFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const body = await req.json();

  // Change own password — any admin can do this
  if (body.action === 'change_password') {
    const { currentPassword, newPassword } = body;
    if (!currentPassword || !newPassword) return NextResponse.json({ error: 'Current and new password required.' }, { status: 400 });
    if (newPassword.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    if (!payload.adminId) return NextResponse.json({ error: 'Legacy session — please log out and back in.' }, { status: 400 });

    const { data: admin } = await supabase.from('cc_admin_users').select('password_hash').eq('id', payload.adminId).single();
    if (!admin) return NextResponse.json({ error: 'Admin not found.' }, { status: 404 });

    const ok = await bcrypt.compare(currentPassword, admin.password_hash);
    if (!ok) return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 401 });

    const password_hash = await bcrypt.hash(newPassword, 12);
    const { error } = await supabase.from('cc_admin_users').update({ password_hash }).eq('id', payload.adminId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // Rename an admin — owner only
  if (payload.role && payload.role !== 'owner') return NextResponse.json({ error: 'Only the owner can edit admins.' }, { status: 403 });
  const { id, churchId, name } = body;
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
