import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { adminFromRequest } from '@/lib/guard';

export async function POST(req) {
  const payload = await adminFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const { data: church } = await supabase
    .from('cc_churches')
    .select('id, paystack_subscription_code, payment_provider')
    .eq('id', payload.churchId)
    .maybeSingle();

  if (!church) return NextResponse.json({ error: 'Church not found.' }, { status: 404 });
  if (church.payment_provider !== 'paystack') return NextResponse.json({ error: 'Not a Paystack subscription.' }, { status: 400 });
  if (!church.paystack_subscription_code) return NextResponse.json({ error: 'No subscription found.' }, { status: 400 });

  const res = await fetch(`https://api.paystack.co/subscription/disable`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code: church.paystack_subscription_code,
      token: '', // Paystack requires the subscription token to cancel — users should use the manage link
    }),
  });

  const data = await res.json();
  // Even if this fails, we tell the user to email us — Paystack tokens are only sent to customers
  return NextResponse.json({ ok: true, message: 'Please email admin@elmorilx.com to cancel your subscription and we\'ll process it within 24 hours.' });
}
