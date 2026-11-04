import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { adminFromRequest } from '@/lib/guard';
import { sendEmail } from '@/lib/email';

export async function GET(req) {
  const payload = await adminFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const churchId = new URL(req.url).searchParams.get('churchId');
  if (payload.churchId !== churchId) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const { data } = await supabase
    .from('cc_email_campaigns')
    .select('*, cc_groups(name)')
    .eq('church_id', churchId)
    .order('sent_at', { ascending: false })
    .limit(50);
  return NextResponse.json({ campaigns: data || [] });
}

export async function POST(req) {
  const payload = await adminFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const { churchId, subject, body, recipientType, groupId } = await req.json();
  if (payload.churchId !== churchId) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  // Pro only
  const { data: church } = await supabase.from('cc_churches').select('plan, name').eq('id', churchId).single();
  if (!church || (church.plan !== 'pro' && church.plan !== 'custom')) {
    return NextResponse.json({ error: 'Communications is a Pro feature.' }, { status: 403 });
  }

  if (!subject?.trim() || !body?.trim()) return NextResponse.json({ error: 'Subject and body required.' }, { status: 400 });

  // Gather recipients
  let recipients = [];
  if (recipientType === 'all') {
    const { data } = await supabase.from('cc_members').select('email, first_name, last_name').eq('church_id', churchId).not('email', 'is', null).neq('email', '');
    recipients = data || [];
  } else if (recipientType === 'group' && groupId) {
    const { data } = await supabase.from('cc_group_members').select('cc_members(email, first_name, last_name)').eq('group_id', groupId);
    recipients = (data || []).map(r => r.cc_members).filter(m => m?.email);
  } else if (recipientType === 'first_timers') {
    const { data } = await supabase.from('cc_first_timers').select('email, first_name, last_name').eq('church_id', churchId).not('email', 'is', null).neq('email', '');
    recipients = data || [];
  }

  if (!recipients.length) return NextResponse.json({ error: 'No recipients with email addresses found.' }, { status: 400 });

  // Send emails
  let sent = 0, failed = 0;
  for (const r of recipients) {
    const personalised = body
      .replace(/\{first_name\}/gi, r.first_name || '')
      .replace(/\{last_name\}/gi, r.last_name || '')
      .replace(/\{name\}/gi, `${r.first_name || ''} ${r.last_name || ''}`.trim());
    const result = await sendEmail({ to: r.email, subject, body: personalised, fromName: church.name });
    if (result.sent) sent++; else failed++;
  }

  // Log campaign
  await supabase.from('cc_email_campaigns').insert({
    church_id: churchId,
    subject,
    body,
    recipient_type: recipientType,
    group_id: groupId || null,
    sent_count: sent,
    failed_count: failed,
    sent_by: payload.adminName || null,
  });

  return NextResponse.json({ ok: true, sent, failed, total: recipients.length });
}
