import { NextResponse } from 'next/server';

export async function POST(req) {
  const { to, subject, body, churchName } = await req.json();
  if (!to || !subject) return NextResponse.json({ error: 'to and subject required' }, { status: 400 });

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    // No API key — caller can fall back to mailto:
    return NextResponse.json({ sent: false, reason: 'no_api_key' });
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: `${churchName || 'ChurchCompass'} <noreply@churchcompass.elmorilx.com>`,
      to: [to],
      subject,
      text: body,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    return NextResponse.json({ sent: false, error: err }, { status: 500 });
  }
  return NextResponse.json({ sent: true });
}
