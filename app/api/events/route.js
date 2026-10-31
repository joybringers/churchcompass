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
  if (!churchId) return NextResponse.json({ error: 'churchId required' }, { status: 400 });
  const date = searchParams.get('date');
  let q = supabase.from('cc_events').select('*').eq('church_id', churchId).order('event_date', { ascending: false });
  if (date) q = q.eq('event_date', date);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ events: data });
}

export async function POST(req) {
  const payload = await auth(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const { churchId, name, eventType, eventDate, startTime, endTime, description } = await req.json();
  if (payload.churchId !== churchId) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  const { error } = await supabase.from('cc_events').insert({ church_id: churchId, name, event_type: eventType, event_date: eventDate, start_time: startTime || null, end_time: endTime || null, description });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function PUT(req) {
  const payload = await auth(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const { id, churchId, name, eventType, eventDate, startTime, endTime, description } = await req.json();
  if (payload.churchId !== churchId) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  const { error } = await supabase.from('cc_events').update({ name, event_type: eventType, event_date: eventDate, start_time: startTime || null, end_time: endTime || null, description }).eq('id', id).eq('church_id', churchId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  const payload = await auth(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const { error } = await supabase.from('cc_events').delete().eq('id', id).eq('church_id', payload.churchId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
