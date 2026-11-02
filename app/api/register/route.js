import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabase } from '@/lib/supabase';
import { sendEmail } from '@/lib/email';

export async function POST(req) {
  try {
    const { name, slug, denomination, address, phone, adminEmail, password } = await req.json();
    if (!name || !slug || !adminEmail || !password) return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });

    const { data: existing } = await supabase.from('cc_churches').select('id').eq('slug', slug).single();
    if (existing) return NextResponse.json({ error: 'That slug is already taken. Please choose another.' }, { status: 409 });

    const password_hash = await bcrypt.hash(password, 12);
    const { data: church, error } = await supabase.from('cc_churches').insert({ slug, name, denomination, address, phone, admin_email: adminEmail, password_hash }).select('id').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Create the owner admin account
    await supabase.from('cc_admin_users').insert({ church_id: church.id, name: 'Church Admin', email: adminEmail, role: 'owner', password_hash });

    // Send welcome email (best-effort — don't fail registration if email fails)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://churchcompass.elmorilx.com';
    try {
      await sendEmail({
        to: adminEmail,
        subject: `Welcome to ChurchCompass — ${name}`,
        body: `Hi there,\n\nWelcome to ChurchCompass! Your church "${name}" has been registered successfully.\n\nHere are your details:\n  Church slug: ${slug}\n  Admin email: ${adminEmail}\n\nYou can log in to your admin dashboard here:\n  ${baseUrl}/${slug}/admin\n\nSet up your kiosk for check-in:\n  ${baseUrl}/${slug}/signin\n\nFirst-timer welcome form (share this link or print a QR code):\n  ${baseUrl}/${slug}/first-timer\n\nIf you have any questions, reply to this email or visit elmorilx.com.\n\nThe ChurchCompass Team\nPowered by Elmoril`,
      });
    } catch { /* ignore */ }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
