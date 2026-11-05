import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase } from '@/lib/supabase';

export async function POST(req) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-paystack-signature') || '';
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY || '')
    .update(rawBody)
    .digest('hex');

  if (hash !== signature) {
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
  }

  const { event, data } = JSON.parse(rawBody);

  // Successful payment on a subscription plan → upgrade church to Pro
  if (event === 'charge.success' && data?.plan) {
    const churchId = data?.metadata?.church_id;
    if (churchId) {
      await supabase.from('cc_churches').update({
        plan: 'pro',
        payment_provider: 'paystack',
        currency: 'ngn',
        flw_customer_id: data?.customer?.customer_code || '',
      }).eq('id', churchId);
    }
  }

  // Subscription created → store subscription code (needed for cancellation)
  if (event === 'subscription.create') {
    const customerEmail = data?.customer?.email;
    const subCode = data?.subscription_code;
    if (customerEmail && subCode) {
      await supabase.from('cc_churches')
        .update({ flw_subscription_id: subCode })
        .eq('admin_email', customerEmail);
    }
  }

  // Subscription cancelled (via Paystack dashboard or API) → downgrade to Free
  if (event === 'subscription.disable' || event === 'subscription.not_renew') {
    const subCode = data?.subscription_code;
    const customerEmail = data?.customer?.email;
    if (subCode) {
      await supabase.from('cc_churches')
        .update({ plan: 'free', flw_subscription_id: null })
        .eq('flw_subscription_id', subCode);
    } else if (customerEmail) {
      await supabase.from('cc_churches')
        .update({ plan: 'free' })
        .eq('admin_email', customerEmail)
        .eq('payment_provider', 'paystack');
    }
  }

  return NextResponse.json({ received: true });
}
