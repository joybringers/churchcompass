// Server-only email helper. This replaces the old public /api/email route:
// nothing outside our own server code can ask for an email to be sent.
export async function sendEmail({ to, subject, body, fromName = 'ChurchCompass' }) {
  if (!to || !subject) return { sent: false, reason: 'missing_fields' };

  const key = process.env.RESEND_API_KEY;
  if (!key) return { sent: false, reason: 'no_api_key' };

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: `${fromName} <noreply@churchcompass.elmorilx.com>`,
      to: [String(to)],
      subject: String(subject).replace(/[\r\n]+/g, ' ').slice(0, 200),
      text: String(body || ''),
    }),
  });

  if (!res.ok) {
    let detail = '';
    try { const j = await res.json(); detail = j.message || j.error || JSON.stringify(j); } catch {}
    console.error('[email] Resend error', res.status, detail);
    return { sent: false, reason: 'provider_error', detail };
  }
  return { sent: true };
}
