import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function POST(req) {
  const { name, churchName, email, message } = await req.json();
  if (!name || !email || !message) {
    return NextResponse.json({ error: 'Name, email and message are required.' }, { status: 400 });
  }

  const result = await sendEmail({
    to: 'hello@elmorilx.com',
    fromName: 'ChurchCompass Enquiry',
    subject: `Custom plan enquiry from ${name}${churchName ? ` — ${churchName}` : ''}`,
    body: `Name: ${name}\nChurch: ${churchName || '(not given)'}\nEmail: ${email}\n\nMessage:\n${message}`,
  });

  if (!result.sent) {
    return NextResponse.json({ error: 'Could not send message. Please email hello@elmorilx.com directly.' }, { status: 500 });
  }

  // Auto-reply to the enquirer
  await sendEmail({
    to: email,
    fromName: 'ChurchCompass',
    subject: 'We received your enquiry',
    body: `Hi ${name},\n\nThanks for getting in touch about ChurchCompass! We've received your message and will get back to you within 1–2 business days.\n\nIn the meantime, if you have any urgent questions you can reply to this email.\n\nThe ChurchCompass Team\nhello@elmorilx.com`,
  });

  return NextResponse.json({ ok: true });
}
