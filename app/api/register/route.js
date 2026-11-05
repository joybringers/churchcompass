import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';
import { sendEmail } from '@/lib/email';

export async function POST(req) {
  try {
    const { name, slug, denomination, address, phone, adminEmail, password, plan, billing, currency } = await req.json();
    if (!name || !slug || !adminEmail || !password) return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });

    const { data: existing } = await supabase.from('cc_churches').select('id').eq('slug', slug).single();
    if (existing) return NextResponse.json({ error: 'That slug is already taken. Please choose another.' }, { status: 409 });

    const password_hash = await bcrypt.hash(password, 12);
    const { data: church, error } = await supabase.from('cc_churches').insert({ slug, name, denomination, address, phone, admin_email: adminEmail, password_hash }).select('id').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Create the owner admin account
    await supabase.from('cc_admin_users').insert({ church_id: church.id, name: 'Church Admin', email: adminEmail, role: 'owner', password_hash });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://churchcompass.elmorilx.com';

    // Send welcome email (best-effort)
    try {
      await sendEmail({
        to: adminEmail,
        subject: `Welcome to ChurchCompass — ${name}`,
        body: `Hi there,\n\nWelcome to ChurchCompass! Your church "${name}" has been registered successfully.\n\nHere are your details:\n  Church slug: ${slug}\n  Admin email: ${adminEmail}\n\nYou can log in to your admin dashboard here:\n  ${baseUrl}/${slug}/admin\n\nSet up your kiosk for check-in:\n  ${baseUrl}/${slug}/signin\n\nFirst-timer welcome form (share this link or print a QR code):\n  ${baseUrl}/${slug}/first-timer\n\nIf you have any questions, email admin@elmorilx.com or visit https://www.elmorilx.com/contact\n\nThe ChurchCompass Team\nPowered by Elmoril`,
      });
    } catch { /* ignore */ }

    // If registering for Pro, create Stripe checkout session
    let stripeUrl = null;
    if (plan === 'pro' && process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

        // Create Stripe customer linked to this church
        const customer = await stripe.customers.create({
          name,
          email: adminEmail,
          metadata: { churchId: church.id, slug },
        });
        await supabase.from('cc_churches').update({ stripe_customer_id: customer.id }).eq('id', church.id);

        const isAnnual = billing === 'annual';
        const priceId = isAnnual ? process.env.STRIPE_PRICE_ID_PRO_ANNUAL : process.env.STRIPE_PRICE_ID_PRO;

        const subscriptionData = { metadata: { churchId: church.id } };
        if (!isAnnual) subscriptionData.trial_period_days = 14;

        const session = await stripe.checkout.sessions.create({
          customer: customer.id,
          mode: 'subscription',
          line_items: [{ price: priceId, quantity: 1 }],
          success_url: `${baseUrl}/${slug}/admin?upgraded=1`,
          cancel_url: `${baseUrl}/${slug}/admin`,
          metadata: { churchId: church.id },
          subscription_data: subscriptionData,
        });
        stripeUrl = session.url;
      } catch { /* if Stripe fails, let them in on free and upgrade from settings */ }
    }

    // If Nigerian church registering for Pro, use Paystack
    let paystackUrl = null;
    if (plan === 'pro' && currency === 'ngn' && process.env.PAYSTACK_SECRET_KEY && !stripeUrl) {
      try {
        const isAnnual = billing === 'annual';
        const planCode = isAnnual ? process.env.PAYSTACK_PLAN_ANNUAL_NGN : process.env.PAYSTACK_PLAN_MONTHLY_NGN;
        if (planCode) {
          const psRes = await fetch('https://api.paystack.co/transaction/initialize', {
            method: 'POST',
            headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: adminEmail,
              amount: isAnnual ? 2000000 : 200000, // kobo
              plan: planCode,
              callback_url: `${baseUrl}/${slug}/admin?upgraded=1`,
              metadata: { church_id: church.id, billing: isAnnual ? 'annual' : 'monthly' },
            }),
          });
          const psData = await psRes.json();
          if (psData.status) paystackUrl = psData.data.authorization_url;
        }
      } catch { /* fall through to free if Paystack fails */ }
    }

    return NextResponse.json({ ok: true, slug, stripeUrl, paystackUrl });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
