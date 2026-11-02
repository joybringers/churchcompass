import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';
import { adminFromRequest } from '@/lib/guard';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// POST /api/stripe/checkout
// Creates a Stripe Checkout session for the Pro plan
export async function POST(req) {
  const payload = await adminFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const { data: church } = await supabase
    .from('cc_churches')
    .select('id, name, slug, plan, stripe_customer_id')
    .eq('id', payload.churchId)
    .maybeSingle();

  if (!church) return NextResponse.json({ error: 'Church not found.' }, { status: 404 });
  if (church.plan === 'pro') return NextResponse.json({ error: 'Already on Pro.' }, { status: 400 });

  const origin = req.headers.get('origin') || 'https://churchcompass.elmorilx.com';

  // Reuse or create Stripe customer
  let customerId = church.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({ name: church.name, metadata: { churchId: church.id, slug: church.slug } });
    customerId = customer.id;
    await supabase.from('cc_churches').update({ stripe_customer_id: customerId }).eq('id', church.id);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: process.env.STRIPE_PRICE_ID_PRO, quantity: 1 }],
    success_url: `${origin}/${church.slug}/admin/settings?upgraded=1`,
    cancel_url: `${origin}/${church.slug}/admin/settings`,
    metadata: { churchId: church.id },
    subscription_data: { metadata: { churchId: church.id } },
  });

  return NextResponse.json({ url: session.url });
}
