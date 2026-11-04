import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  if (!slug) return NextResponse.json({ events: [] });

  const { data: church } = await supabase.from('cc_churches').select('id').eq('slug', slug).single();
  if (!church) return NextResponse.json({ events: [] });

  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('cc_events')
    .select('id, name, event_type, event_date, start_time, end_time, location, description')
    .eq('church_id', church.id)
    .gte('event_date', today)
    .order('event_date', { ascending: true })
    .limit(10);

  if (error) return NextResponse.json({ events: [] });
  return NextResponse.json({ events: data || [] });
}
