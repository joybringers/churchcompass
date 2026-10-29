import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabase } from '@/lib/supabase';

export async function POST(req) {
  try {
    const { name, slug, denomination, address, phone, adminEmail, password } = await req.json();
    if (!name || !slug || !adminEmail || !password) return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });

    const { data: existing } = await supabase.from('cc_churches').select('id').eq('slug', slug).single();
    if (existing) return NextResponse.json({ error: 'That slug is already taken. Please choose another.' }, { status: 409 });

    const password_hash = await bcrypt.hash(password, 12);
    const { error } = await supabase.from('cc_churches').insert({ slug, name, denomination, address, phone, admin_email: adminEmail, password_hash });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
