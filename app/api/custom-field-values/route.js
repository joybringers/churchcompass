import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { adminFromRequest } from '@/lib/guard';

export async function GET(req) {
  const payload = await adminFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const recordId   = searchParams.get('recordId');
  const recordType = searchParams.get('recordType');
  if (!recordId || !recordType) return NextResponse.json({ error: 'recordId and recordType required.' }, { status: 400 });

  const { data, error } = await supabase
    .from('cc_custom_field_values')
    .select('field_id, value')
    .eq('record_id', recordId)
    .eq('record_type', recordType);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const values = Object.fromEntries((data || []).map(r => [r.field_id, r.value]));
  return NextResponse.json({ values });
}

export async function POST(req) {
  const payload = await adminFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const { recordId, recordType, values } = await req.json();
  if (!recordId || !recordType || !values) return NextResponse.json({ error: 'recordId, recordType, values required.' }, { status: 400 });

  // Delete existing then re-insert (simpler than individual upserts)
  await supabase.from('cc_custom_field_values').delete().eq('record_id', recordId).eq('record_type', recordType);

  const inserts = Object.entries(values)
    .filter(([, v]) => v !== '' && v != null)
    .map(([fieldId, value]) => ({ field_id: fieldId, record_id: recordId, record_type: recordType, value: String(value) }));

  if (inserts.length) {
    const { error } = await supabase.from('cc_custom_field_values').insert(inserts);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
