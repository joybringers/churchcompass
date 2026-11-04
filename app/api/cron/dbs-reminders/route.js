import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendEmail } from '@/lib/email';

// Called daily by Vercel cron. Sends email to each church that has DBS records
// expiring within the next 30 days (and hasn't already been notified today).
export async function GET(req) {
  // Verify this is a Vercel cron call or our own CRON_SECRET
  const secret = req.headers.get('x-cron-secret') || new URL(req.url).searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const today = new Date();
  const in30 = new Date(today); in30.setDate(today.getDate() + 30);
  const todayStr = today.toISOString().slice(0, 10);
  const in30Str = in30.toISOString().slice(0, 10);

  // Find all DBS records with renewal_date in the next 30 days
  const { data: expiringRecords, error } = await supabase
    .from('cc_dbs_records')
    .select('id, church_id, full_name, role, renewal_date, check_type')
    .gte('renewal_date', todayStr)
    .lte('renewal_date', in30Str)
    .order('renewal_date');

  if (error) {
    console.error('[dbs-reminders] DB error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!expiringRecords?.length) {
    return NextResponse.json({ ok: true, sent: 0, message: 'No expiring DBS records today.' });
  }

  // Group by church
  const byChurch = {};
  for (const r of expiringRecords) {
    if (!byChurch[r.church_id]) byChurch[r.church_id] = [];
    byChurch[r.church_id].push(r);
  }

  const churchIds = Object.keys(byChurch);

  // Fetch church details (name, admin_email, slug)
  const { data: churches } = await supabase
    .from('cc_churches')
    .select('id, name, slug, admin_email')
    .in('id', churchIds);

  if (!churches?.length) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://churchcompass.elmorilx.com';
  let sent = 0;

  for (const church of churches) {
    const records = byChurch[church.id];
    if (!records?.length) continue;

    const lines = records.map(r => {
      const daysLeft = Math.round((new Date(r.renewal_date) - today) / 86400000);
      return `  • ${r.full_name} (${r.role || r.check_type || 'DBS'}) — expires ${r.renewal_date} (${daysLeft} day${daysLeft === 1 ? '' : 's'})`;
    }).join('\n');

    const subject = records.length === 1
      ? `DBS expiring soon: ${records[0].full_name} — ${church.name}`
      : `${records.length} DBS records expiring soon — ${church.name}`;

    const body = `Hi,

This is a reminder from ChurchCompass that the following DBS ${records.length === 1 ? 'check is' : 'checks are'} due for renewal within the next 30 days for ${church.name}:

${lines}

Please arrange renewals in good time to maintain your safeguarding compliance.

View your Guard dashboard:
${baseUrl}/${church.slug}/admin/guard

If you have any questions, reply to this email.

The ChurchCompass Team
Powered by Elmoril`;

    const result = await sendEmail({
      to: church.admin_email,
      subject,
      body,
      fromName: 'ChurchCompass Safeguarding',
    });

    if (result.sent) {
      sent++;
      console.log(`[dbs-reminders] Sent to ${church.admin_email} — ${records.length} record(s)`);
    } else {
      console.error(`[dbs-reminders] Failed for ${church.admin_email}:`, result.detail);
    }
  }

  return NextResponse.json({ ok: true, sent, churches: churchIds.length, records: expiringRecords.length });
}
