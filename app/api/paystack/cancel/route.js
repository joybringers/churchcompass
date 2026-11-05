import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { adminFromRequest } from '@/lib/guard';

export async function POST(req) {
  const admin = await adminFromRequest(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const { churchId } = await req.json();
  if (admin.churchId !== churchId) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const { data: church } = await supabase
    .from('cc_churches')
    .select('flw_subscription_id')
    .eq('id', churchId)
    .single();

  const subCode = church?.flw_subscription_id;
  if (!subCode) {
    return NextResponse.json({ error: 'No active Paystack subscription found. Please email admin@elmorilx.com to cancel.' }, { status: 404 });
  }

  // Fetch subscription to get the email token required by Paystack's disable API
  const fetchRes = await fetch(`https://api.paystack.co/subscription/${subCode}`, {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
  });
  const fetchData = await fetchRes.json();
  const emailToken = fetchData?.data?.email_token;

  if (!emailToken) {
    return NextResponse.json({ fallback: true, message: 'Please email admin@elmorilx.com to cancel your subscription.' });
  }

  const disableRes = await fetch('https://api.paystack.co/subscription/disable', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code: subCode, token: emailToken }),
  });
  const disableData = await disableRes.json();

  if (!disableData.status) {
    return NextResponse.json({ error: disableData.message || 'Failed to cancel subscription.' }, { status: 500 });
  }

  await supabase.from('cc_churches')
    .update({ plan: 'free', flw_subscription_id: null })
    .eq('id', churchId);

  return NextResponse.json({ ok: true });
}
