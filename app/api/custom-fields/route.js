import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { tokenFromRequest, verifyToken } from '@/lib/auth';

async function auth(req) {
  const token = tokenFromRequest(req);
  if (!token) return null;
  return await verifyToken(token);
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const churchId = searchParams.get('churchId');
  if (!churchId) return NextResponse.json({ error: 'churchId required' }, { status: 400 });

  const { data, error } = await supabase
    .from('cc_custom_fields')
    .select('*')
    .eq('church_id', churchId)
    .order('form_type')
    .order('sort_order');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ fields: data || [] });
}

export async function POST(req) {
  const payload = await auth(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { label, fieldType, formType, options, required, sortOrder } = await req.json();
  if (!label || !fieldType || !formType) return NextResponse.json({ error: 'label, fieldType and formType are required' }, { status: 400 });

  const { data, error } = await supabase
    .from('cc_custom_fields')
    .insert({ church_id: payload.churchId, label, field_type: fieldType, form_type: formType, options: options || null, required: !!required, sort_order: sortOrder || 0 })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ field: data });
}

export async function PUT(req) {
  const payload = await auth(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, label, fieldType, formType, options, required, sortOrder } = await req.json();

  const { error } = await supabase
    .from('cc_custom_fields')
    .update({ label, field_type: fieldType, form_type: formType, options: options || null, required: !!required, sort_order: sortOrder || 0 })
    .eq('id', id)
    .eq('church_id', payload.churchId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  const payload = await auth(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  const { error } = await supabase
    .from('cc_custom_fields')
    .delete()
    .eq('id', id)
    .eq('church_id', payload.churchId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
