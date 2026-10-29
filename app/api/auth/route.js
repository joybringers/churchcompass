import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabase } from '@/lib/supabase';
import { makeToken, verifyToken } from '@/lib/auth';

export async function POST(req) {
  try {
    const { action, slug, email, password, token } = await req.json();

    if (action === 'login') {
      const { data: church, error } = await supabase.from('cc_churches').select('*').eq('slug', slug).single();
      if (error || !church) return NextResponse.json({ error: 'Church not found.' }, { status: 404 });
      const ok = await bcrypt.compare(password, church.password_hash);
      if (!ok) return NextResponse.json({ error: 'Invalid password.' }, { status: 401 });
      const jwt = await makeToken(church.id, slug);
      return NextResponse.json({ token: jwt });
    }

    if (action === 'verify') {
      const payload = await verifyToken(token);
      if (!payload) return NextResponse.json({ error: 'Invalid token.' }, { status: 401 });
      return NextResponse.json({ valid: true, churchId: payload.churchId });
    }

    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
