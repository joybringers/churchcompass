import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';
import { adminFromRequest } from '@/lib/guard';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// POST /api/stripe/portal — opens Stripe billing portal for existing subscribers
export async function POST(req) {
  const payload = await adminFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const { data: church } = await supabase
    .from('cc_churches')
    .select('slug, stripe_customer_id')
    .eq('id', payload.churchId)
    .maybeSingle();

  if (!church?.stripe_customer_id) return NextResponse.json({ error: 'No billing account found.' }, { status: 404 });

  const origin = req.headers.get('origin') || 'https://churchcompass.elmorilx.com';
  const session = await stripe.billingPortal.sessions.create({
    customer: church.stripe_customer_id,
    return_url: `${origin}/${church.slug}/admin/settings`,
  });

  return NextResponse.json({ url: session.url });
}
