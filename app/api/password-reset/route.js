import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { supabase } from '@/lib/supabase';

// POST — request a password reset (send email with token)
export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: 'Email required.' }, { status: 400 });

    const { data: church } = await supabase
      .from('cc_churches')
      .select('id, name, slug, admin_email')
      .eq('admin_email', email.toLowerCase().trim())
      .single();

    // Always return ok — don't reveal whether email exists
    if (!church) return NextResponse.json({ ok: true });

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    await supabase.from('cc_churches').update({ reset_token: token, reset_token_expires: expires }).eq('id', church.id);

    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://churchcompass.elmorilx.com'}/reset-password?token=${token}`;

    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://churchcompass.elmorilx.com'}/api/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: church.admin_email,
        subject: 'Reset your ChurchCompass password',
        churchName: 'ChurchCompass',
        body: `Hi,\n\nWe received a request to reset the password for your ChurchCompass account (${church.name}).\n\nClick the link below to set a new password. This link expires in 1 hour.\n\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email — your password won't change.\n\nChurchCompass Team`,
      }),
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PATCH — verify token and set new password
export async function PATCH(req) {
  try {
    const { token, password } = await req.json();
    if (!token || !password) return NextResponse.json({ error: 'Token and password required.' }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });

    const { data: church } = await supabase
      .from('cc_churches')
      .select('id, reset_token, reset_token_expires')
      .eq('reset_token', token)
      .single();

    if (!church) return NextResponse.json({ error: 'Invalid or expired reset link.' }, { status: 400 });
    if (!church.reset_token_expires || new Date(church.reset_token_expires) < new Date()) {
      return NextResponse.json({ error: 'This reset link has expired. Please request a new one.' }, { status: 400 });
    }

    const password_hash = await bcrypt.hash(password, 12);
    await supabase.from('cc_churches').update({ password_hash, reset_token: null, reset_token_expires: null }).eq('id', church.id);

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
