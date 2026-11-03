import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { supabase } from '@/lib/supabase';
import { sendEmail } from '@/lib/email';

const BASE = process.env.NEXT_PUBLIC_BASE_URL || 'https://churchcompass.elmorilx.com';

// POST — request a reset link for a named admin account
export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: 'Email required.' }, { status: 400 });

    // Find all admin users with this email (could span churches)
    const { data: adminUsers } = await supabase
      .from('cc_admin_users')
      .select('id, name, email, church_id, cc_churches(name, slug)')
      .ilike('email', email.trim());

    // Always return ok — never reveal whether the email exists
    if (!adminUsers || adminUsers.length === 0) return NextResponse.json({ ok: true });

    for (const admin of adminUsers) {
      const token = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();

      await supabase.from('cc_admin_users')
        .update({ reset_token: token, reset_token_expires: expires })
        .eq('id', admin.id);

      const churchName = admin.cc_churches?.name || 'your church';
      const resetUrl = `${BASE}/reset-password?token=${token}`;

      try {
        await sendEmail({
          to: admin.email,
          subject: 'Reset your ChurchCompass password',
          body: `Hi ${admin.name},\n\nWe received a request to reset the password for your ChurchCompass admin account at ${churchName}.\n\nClick the link below to set a new password. This link expires in 1 hour.\n\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email — your password won't change.\n\nChurchCompass Team`,
        });
      } catch { /* ignore */ }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PATCH — verify token and set new password on the admin user
export async function PATCH(req) {
  try {
    const { token, password } = await req.json();
    if (!token || !password) return NextResponse.json({ error: 'Token and password required.' }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });

    const { data: admin } = await supabase
      .from('cc_admin_users')
      .select('id, reset_token_expires')
      .eq('reset_token', token)
      .single();

    if (!admin) return NextResponse.json({ error: 'Invalid or expired reset link.' }, { status: 400 });
    if (!admin.reset_token_expires || new Date(admin.reset_token_expires) < new Date()) {
      return NextResponse.json({ error: 'This reset link has expired. Please request a new one.' }, { status: 400 });
    }

    const password_hash = await bcrypt.hash(password, 12);
    await supabase.from('cc_admin_users')
      .update({ password_hash, reset_token: null, reset_token_expires: null })
      .eq('id', admin.id);

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
