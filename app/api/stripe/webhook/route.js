import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  const churchIdFromMeta = (obj) => obj?.metadata?.churchId;

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const churchId = churchIdFromMeta(session);
      if (churchId && session.subscription) {
        await supabase.from('cc_churches').update({
          plan: 'pro',
          stripe_subscription_id: session.subscription,
        }).eq('id', churchId);
      }
      break;
    }
    case 'customer.subscription.updated': {
      const sub = event.data.object;
      const churchId = churchIdFromMeta(sub);
      if (!churchId) break;
      const active = ['active', 'trialing'].includes(sub.status);
      await supabase.from('cc_churches').update({
        plan: active ? 'pro' : 'free',
        stripe_subscription_id: sub.id,
      }).eq('id', churchId);
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      const churchId = churchIdFromMeta(sub);
      if (churchId) {
        await supabase.from('cc_churches').update({ plan: 'free', stripe_subscription_id: null }).eq('id', churchId);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
