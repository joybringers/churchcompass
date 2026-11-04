import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { adminFromRequest } from '@/lib/guard';

export async function POST(req) {
  const payload = await adminFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const { data: church } = await supabase
    .from('cc_churches')
    .select('id, flw_subscription_id, payment_provider')
    .eq('id', payload.churchId)
    .maybeSingle();

  if (!church) return NextResponse.json({ error: 'Church not found.' }, { status: 404 });
  if (church.payment_provider !== 'flutterwave') return NextResponse.json({ error: 'Not a Flutterwave subscription.' }, { status: 400 });

  if (church.flw_subscription_id && process.env.FLW_SECRET_KEY) {
    // Attempt programmatic cancel via Flutterwave API
    await fetch(`https://api.flutterwave.com/v3/subscriptions/${church.flw_subscription_id}/cancel`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` },
    }).catch(() => null);
  }

  return NextResponse.json({
    ok: true,
    message: "Cancellation requested. If you're not downgraded within 24 hours, email admin@elmorilx.com.",
  });
}
