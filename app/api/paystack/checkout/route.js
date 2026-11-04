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
  const planCode = isAnnual ? process.env.PAYSTACK_PLAN_ANNUAL_NGN : process.env.PAYSTACK_PLAN_MONTHLY_NGN;
  if (!planCode) return NextResponse.json({ error: 'Paystack plans not configured.' }, { status: 500 });

  const origin = req.headers.get('origin') || 'https://churchcompass.elmorilx.com';
  const reference = `cc_${church.id.replace(/-/g, '')}_${Date.now()}`;

  const res = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: church.admin_email,
      plan: planCode,
      callback_url: `${origin}/${church.slug}/admin/settings?upgraded=1`,
      reference,
      metadata: { church_id: church.id, billing: isAnnual ? 'annual' : 'monthly' },
    }),
  });

  const data = await res.json();
  if (!data.status) return NextResponse.json({ error: data.message || 'Paystack error.' }, { status: 500 });

  return NextResponse.json({ url: data.data.authorization_url });
}
