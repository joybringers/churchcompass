import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth';

async function auth(req) {
  const token = (req.headers.get('Authorization') || '').replace('Bearer ', '');
  return verifyToken(token);
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const churchId = searchParams.get('churchId');
  const formType = searchParams.get('formType');
  if (!churchId) return NextResponse.json({ error: 'churchId required' }, { status: 400 });
  let query = supabase.from('cc_custom_fields').select('*').eq('church_id', churchId).eq('is_active', true).order('position');
  if (formType) query = query.eq('form_type', formType);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ fields: data });
}

export async function POST(req) {
  const payload = await auth(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const { churchId, formType, fieldLabel, fieldName, fieldType, fieldOptions, isRequired } = await req.json();
  if (payload.churchId !== churchId) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  const { error } = await supabase.from('cc_custom_fields').insert({ church_id: churchId, form_type: formType, field_label: fieldLabel, field_name: fieldName, field_type: fieldType, field_options: fieldOptions || null, is_required: !!isRequired });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function PUT(req) {
  const payload = await auth(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const { id, churchId, formType, fieldLabel, fieldName, fieldType, fieldOptions, isRequired } = await req.json();
  if (payload.churchId !== churchId) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  const { error } = await supabase.from('cc_custom_fields').update({ form_type: formType, field_label: fieldLabel, field_name: fieldName, field_type: fieldType, field_options: fieldOptions || null, is_required: !!isRequired }).eq('id', id).eq('church_id', churchId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  const payload = await auth(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const { error } = await supabase.from('cc_custom_fields').update({ is_active: false }).eq('id', id).eq('church_id', payload.churchId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
