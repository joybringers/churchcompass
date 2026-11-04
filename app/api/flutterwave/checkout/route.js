import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { adminFromRequest } from '@/lib/guard';

export async function POST(req) {
  const payload = await adminFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const { data: church } = await supabase
    .from('cc_churches')
    .select('id, name, slug, plan, admin_email')
    .eq('id', payload.churchId)
    .maybeSingle();

  if (!church) return NextResponse.json({ error: 'Church not found.' }, { status: 404 });
  if (church.plan === 'pro') return NextResponse.json({ error: 'Already on Pro.' }, { status: 400 });

  const { billing } = await req.json().catch(() => ({}));
  const isAnnual = billing === 'annual';
  const planId = isAnnual ? process.env.FLW_PLAN_ANNUAL_NGN : process.env.FLW_PLAN_MONTHLY_NGN;
  if (!planId) return NextResponse.json({ error: 'Flutterwave plans not configured.' }, { status: 500 });

  const origin = req.headers.get('origin') || 'https://churchcompass.elmorilx.com';
  const txRef = `cc_${church.id.replace(/-/g, '')}_${Date.now()}`;

  const res = await fetch('https://api.flutterwave.com/v3/payments', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tx_ref: txRef,
      amount: isAnnual ? 20000 : 2000,
      currency: 'NGN',
      redirect_url: `${origin}/${church.slug}/admin/settings?upgraded=1`,
      payment_plan: planId,
      customer: { email: church.admin_email, name: church.name },
      meta: { church_id: church.id, billing: isAnnual ? 'annual' : 'monthly' },
    }),
  });

  const data = await res.json();
  if (data.status !== 'success') {
    return NextResponse.json({ error: data.message || 'Flutterwave error.' }, { status: 500 });
  }

  return NextResponse.json({ url: data.data.link });
}
