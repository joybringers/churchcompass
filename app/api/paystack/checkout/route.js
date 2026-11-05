import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { adminFromRequest } from '@/lib/guard';

export async function POST(req) {
  const admin = await adminFromRequest(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const { churchId, billing } = await req.json();
  if (admin.churchId !== churchId) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const { data: church } = await supabase
    .from('cc_churches')
    .select('id, name, admin_email, slug')
    .eq('id', churchId)
    .single();
  if (!church) return NextResponse.json({ error: 'Church not found.' }, { status: 404 });

  const isAnnual = billing === 'annual';
  const planCode = isAnnual
    ? process.env.PAYSTACK_PLAN_ANNUAL_NGN
    : process.env.PAYSTACK_PLAN_MONTHLY_NGN;
  // Paystack amounts are in kobo: ₦2,000 = 200000, ₦20,000 = 2000000
  const amount = isAnnual ? 2000000 : 200000;
  const origin = process.env.NEXT_PUBLIC_BASE_URL || 'https://churchcompass.elmorilx.com';

  const res = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: church.admin_email,
      amount,
      plan: planCode,
      callback_url: `${origin}/${church.slug}/admin/settings?upgraded=1`,
      metadata: {
        church_id: church.id,
        billing: isAnnual ? 'annual' : 'monthly',
      },
    }),
  });

  const data = await res.json();
  if (!data.status) {
    return NextResponse.json({ error: data.message || 'Paystack error.' }, { status: 500 });
  }
  return NextResponse.json({ url: data.data.authorization_url });
}
