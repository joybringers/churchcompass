import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';

export const runtime = 'nodejs';

export async function POST(req) {
  if (!process.env.PAYSTACK_SECRET_KEY) {
    return NextResponse.json({ error: 'Not configured.' }, { status: 500 });
  }

  const body = await req.text();
  const sig = req.headers.get('x-paystack-signature');
  const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY).update(body).digest('hex');

  if (hash !== sig) return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });

  let event;
  try { event = JSON.parse(body); } catch {
    return NextResponse.json({ error: 'Bad JSON.' }, { status: 400 });
  }

  const { event: type, data } = event;

  if (type === 'charge.success') {
    const churchId = data?.metadata?.church_id;
    if (churchId) {
      await supabase.from('cc_churches').update({
        plan: 'pro',
        payment_provider: 'paystack',
        currency: 'ngn',
        paystack_customer_code: data?.customer?.customer_code || null,
        paystack_subscription_code: data?.subscription?.subscription_code || null,
      }).eq('id', churchId);
    }
  }

  if (type === 'subscription.create') {
    const churchId = data?.metadata?.church_id;
    if (churchId) {
      await supabase.from('cc_churches').update({
        plan: 'pro',
        payment_provider: 'paystack',
        currency: 'ngn',
        paystack_subscription_code: data?.subscription_code || null,
        paystack_customer_code: data?.customer?.customer_code || null,
      }).eq('id', churchId);
    }
  }

  if (type === 'subscription.disable' || type === 'subscription.not_renew') {
    const customerCode = data?.customer?.customer_code;
    if (customerCode) {
      await supabase.from('cc_churches')
        .update({ plan: 'free', paystack_subscription_code: null })
        .eq('paystack_customer_code', customerCode);
    }
  }

  return NextResponse.json({ received: true });
}
