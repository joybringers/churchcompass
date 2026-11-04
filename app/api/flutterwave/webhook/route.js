import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function POST(req) {
  // Verify the secret hash set in Flutterwave dashboard → Settings → Webhooks
  const secretHash = process.env.FLW_SECRET_HASH;
  if (secretHash && req.headers.get('verif-hash') !== secretHash) {
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
  }

  let event;
  try { event = JSON.parse(await req.text()); } catch {
    return NextResponse.json({ error: 'Bad JSON.' }, { status: 400 });
  }

  const { event: type, data } = event;

  if (type === 'charge.completed') {
    // Confirm the transaction with Flutterwave before trusting it
    if (data?.id && process.env.FLW_SECRET_KEY) {
      const verify = await fetch(`https://api.flutterwave.com/v3/transactions/${data.id}/verify`, {
        headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` },
      }).then(r => r.json()).catch(() => null);

      if (verify?.data?.status !== 'successful') return NextResponse.json({ received: true });
    }

    const churchId = data?.meta?.church_id;
    if (churchId) {
      await supabase.from('cc_churches').update({
        plan: 'pro',
        payment_provider: 'flutterwave',
        currency: 'ngn',
        flw_customer_id: String(data?.customer?.id || ''),
        flw_subscription_id: String(data?.plan || ''),
      }).eq('id', churchId);
    }
  }

  if (type === 'subscription.cancelled') {
    const customerId = String(data?.customer?.id || '');
    if (customerId) {
      await supabase.from('cc_churches')
        .update({ plan: 'free', flw_subscription_id: null })
        .eq('flw_customer_id', customerId);
    }
  }

  return NextResponse.json({ received: true });
}
