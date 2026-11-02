import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabase } from '@/lib/supabase';
import { makeToken } from '@/lib/auth';

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return NextResponse.json({ error: 'Email and password required.' }, { status: 400 });

    const { data: church } = await supabase
      .from('cc_churches')
      .select('id, slug, name, admin_email, password_hash, primary_color')
      .eq('admin_email', email.toLowerCase().trim())
      .single();

    if (!church || !church.password_hash) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, church.password_hash);
    if (!valid) return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });

    const token = await makeToken(church.id, church.slug);
    return NextResponse.json({
      token,
      slug: church.slug,
      church: { id: church.id, slug: church.slug, name: church.name, admin_email: church.admin_email, primary_color: church.primary_color },
    });
  } catch (e) {
    return NextResponse.json({ error: 'Sign in failed.' }, { status: 500 });
  }
}
