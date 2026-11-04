import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  const id = searchParams.get('id');
  if (slug) {
    const { data, error } = await supabase.from('cc_churches').select('id, slug, name, denomination, logo_url, primary_color, address, phone, website, plan, stripe_customer_id, payment_provider, currency, paystack_customer_code, paystack_subscription_code').eq('slug', slug).single();
    if (error) return NextResponse.json({ church: null });
    return NextResponse.json({ church: data });
  }
  if (id) {
    const { data } = await supabase.from('cc_churches').select('id, slug, name, denomination, logo_url, primary_color, address, phone, website, plan, stripe_customer_id, payment_provider, currency, paystack_customer_code, paystack_subscription_code').eq('id', id).single();
    return NextResponse.json({ church: data });
  }
  return NextResponse.json({ error: 'slug or id required' }, { status: 400 });
}

export async function PUT(req) {
  try {
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

    const { id, name, denomination, address, phone, website, primaryColor } = await req.json();
    if (payload.churchId !== id) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

    const { error } = await supabase.from('cc_churches').update({ name, denomination, address, phone, website, primary_color: primaryColor }).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
