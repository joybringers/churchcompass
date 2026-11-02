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

      // Try named admin user first
      const { data: adminUser } = await supabase
        .from('cc_admin_users')
        .select('*')
        .eq('church_id', church.id)
        .ilike('email', email)
        .single();

      if (adminUser) {
        const ok = await bcrypt.compare(password, adminUser.password_hash);
        if (!ok) return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
        await supabase.from('cc_admin_users').update({ last_login: new Date().toISOString() }).eq('id', adminUser.id);
        const jwt = await makeToken(church.id, slug, { adminId: adminUser.id, adminName: adminUser.name, adminEmail: adminUser.email, role: adminUser.role });
        return NextResponse.json({ token: jwt, adminName: adminUser.name, role: adminUser.role });
      }

      // Fallback: legacy shared password (pre-migration churches)
      if (church.password_hash) {
        const ok = await bcrypt.compare(password, church.password_hash);
        if (!ok) return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
        // Auto-create owner admin so future logins use the new path
        const { data: newAdmin } = await supabase.from('cc_admin_users')
          .insert({ church_id: church.id, name: 'Church Admin', email: email || church.admin_email, role: 'owner', password_hash: church.password_hash })
          .select().single();
        const jwt = await makeToken(church.id, slug, {
          adminId: newAdmin?.id, adminName: 'Church Admin', adminEmail: email || church.admin_email, role: 'owner',
        });
        return NextResponse.json({ token: jwt, adminName: 'Church Admin', role: 'owner' });
      }

      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
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
