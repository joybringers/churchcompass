import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { cleanSearch, cleanText, parseNotes, normaliseName, makeCode, codesMatch, todayRange, VISITOR_TYPES } from '@/lib/guard';

// The kiosk and the parents' children's check-in page have no login, so this
// route is deliberately narrow:
//  - searches return names only (never phone numbers, dates of birth or notes)
//  - pick-up codes are made here and only returned once, at check-in
//  - signing a child or family out needs the pick-up code, checked here
const MAX_CODE_ATTEMPTS = 5;

const fail = (message, status, extra = {}) => NextResponse.json({ error: message, ...extra }, { status });

async function churchExists(id) {
  if (!id) return false;
  const { data } = await supabase.from('cc_churches').select('id').eq('id', id).maybeSingle();
  return !!data;
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const churchId = searchParams.get('churchId');
    if (!(await churchExists(churchId))) return fail('Church not found.', 404);

    // Name search for "find my name" and "find my child"
    if (action === 'members') {
      const q = cleanSearch(searchParams.get('q'));
      if (q.length < 2) return NextResponse.json({ members: [] });
      const { data, error } = await supabase.from('cc_members').select('id, first_name, last_name, member_type')
        .eq('church_id', churchId).eq('is_active', true)
        .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%`).order('last_name').limit(25);
      if (error) return fail('Search failed.', 500);
      return NextResponse.json({ members: data || [] });
    }

    // People signed in today who match a name, for the Sign Out tab
    if (action === 'signed-in') {
      const q = cleanSearch(searchParams.get('q')).toLowerCase();
      if (q.length < 2) return NextResponse.json({ results: [] });
      const { from, to } = todayRange();
      const { data, error } = await supabase.from('cc_attendance').select('id, visitor_name, visitor_type, cc_members(first_name, last_name)')
        .eq('church_id', churchId).gte('sign_in_time', from).lte('sign_in_time', to).is('sign_out_time', null)
        .order('sign_in_time', { ascending: false }).limit(500);
      if (error) return fail('Search failed.', 500);
      const results = [];
      for (const r of data || []) {
        const name = r.visitor_name || (r.cc_members ? `${r.cc_members.first_name} ${r.cc_members.last_name}` : '');
        if (!name.toLowerCase().includes(q)) continue;
        results.push({
          attendanceId: r.id,
          first_name: r.visitor_name || r.cc_members?.first_name || 'Unknown',
          last_name: r.visitor_name ? '' : (r.cc_members?.last_name || ''),
          member_type: r.visitor_type,
        });
        if (results.length >= 25) break;
      }
      return NextResponse.json({ results });
    }

    // Returning families: children seen with this exact guardian name in the last four weeks.
    // Only the child's name and group come back.
    if (action === 'family') {
      const guardian = normaliseName(searchParams.get('guardian'));
      if (guardian.length < 5) return NextResponse.json({ children: [] });
      const since = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const { data, error } = await supabase.from('cc_attendance').select('visitor_name, notes')
        .eq('church_id', churchId).eq('visitor_type', 'child').gte('sign_in_time', `${since}T00:00:00`)
        .order('sign_in_time', { ascending: false }).limit(1000);
      if (error) return fail('Lookup failed.', 500);
      const seen = new Set();
      const children = [];
      for (const r of data || []) {
        const n = parseNotes(r.notes);
        if (normaliseName(n.guardianName) !== guardian) continue;
        const key = normaliseName(r.visitor_name);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        children.push({ name: r.visitor_name, group: n.group || '' });
        if (children.length >= 10) break;
      }
      return NextResponse.json({ children });
    }

    return fail('Unknown action.', 400);
  } catch {
    return fail('Something went wrong.', 500);
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    if (!(await churchExists(body.churchId))) return fail('Church not found.', 404);
    if (body.action === 'checkin') return await checkin(body);
    if (body.action === 'family-checkin') return await familyCheckin(body);
    if (body.action === 'signout') return await signout(body);
    return fail('Unknown action.', 400);
  } catch {
    return fail('Something went wrong.', 500);
  }
}

async function checkEvent(eventId, churchId) {
  if (!eventId) return { ok: true, id: null };
  const { data } = await supabase.from('cc_events').select('id').eq('id', eventId).eq('church_id', churchId).maybeSingle();
  return data ? { ok: true, id: data.id } : { ok: false, id: null };
}

function splitName(full) {
  const parts = (full || '').trim().split(/\s+/);
  if (parts.length < 2) return { firstName: parts[0] || '', lastName: '' };
  return { firstName: parts.slice(0, -1).join(' '), lastName: parts[parts.length - 1] };
}

async function autoUpsertMember(churchId, firstName, lastName, opts = {}) {
  const fn = (firstName || '').trim();
  const ln = (lastName || '').trim();
  if (!fn) return null;
  let query = supabase.from('cc_members').select('id').eq('church_id', churchId).eq('is_active', true).ilike('first_name', fn);
  if (ln) query = query.ilike('last_name', ln);
  const { data: existing } = await query.maybeSingle();
  if (existing) return existing.id;
  const { data, error } = await supabase.from('cc_members').insert({
    church_id: churchId, first_name: fn, last_name: ln || null,
    member_type: opts.memberType || 'adult', parent_id: opts.parentId || null, is_active: true,
  }).select('id').single();
  return error ? null : data.id;
}

async function checkin(body) {
  const { churchId, memberId, visitorName, visitorType, eventId, guardianName, guardianPhone, allergies } = body;
  const requested = visitorType || 'adult';
  if (!VISITOR_TYPES.includes(requested)) return fail('Invalid visitor type.', 400);

  let member = null;
  let name = cleanText(visitorName, 120);
  if (memberId) {
    const { data } = await supabase.from('cc_members').select('id, first_name, last_name, member_type').eq('id', memberId).eq('church_id', churchId).eq('is_active', true).maybeSingle();
    if (!data) return fail('Member not found.', 404);
    member = data;
    name = null;
  } else if (!name) {
    return fail('A name is required.', 400);
  }

  const event = await checkEvent(eventId, churchId);
  if (!event.ok) return fail('Event not found.', 400);

  // Children always get a pick-up code, whichever way they were found.
  const type = requested === 'child' ? 'child' : (member ? member.member_type : requested);
  // A child's name is kept on the record so room lists can show it. Other members are shown from their member record.
  const storedName = type === 'child'
    ? (member ? `${member.first_name} ${member.last_name}`.trim() : name)
    : (member ? null : name);

  if (member) {
    const { from, to } = todayRange();
    const { data: open } = await supabase.from('cc_attendance').select('id').eq('church_id', churchId).eq('member_id', member.id)
      .gte('sign_in_time', from).lte('sign_in_time', to).is('sign_out_time', null).limit(1);
    if (open && open.length) return NextResponse.json({ alreadyIn: true, attendanceId: open[0].id });
  }

  let notes = null;
  let pickupCode = null;
  if (type === 'child') {
    pickupCode = makeCode();
    notes = JSON.stringify({
      pickupCode,
      guardianName: cleanText(guardianName, 120) || '',
      guardianPhone: cleanText(guardianPhone, 40) || '',
      allergies: cleanText(allergies, 300) || '',
    });
  }

  const { error } = await supabase.from('cc_attendance').insert({
    church_id: churchId, event_id: event.id, member_id: member ? member.id : null,
    visitor_name: storedName, visitor_type: type, notes,
  });
  if (error) return fail('Could not save the check-in.', 500);

  // Auto-add new visitors to members (no-op if they're already a known member or already in members table)
  if (!member && name) {
    const { firstName, lastName } = splitName(name);
    await autoUpsertMember(churchId, firstName, lastName, { memberType: type === 'child' ? 'child' : 'adult' });
  }

  return NextResponse.json({ ok: true, pickupCode });
}

async function familyCheckin(body) {
  const { churchId, guardianName, guardianPhone, children, eventId } = body;
  const guardian = cleanText(guardianName, 120);
  if (!guardian) return fail('Please enter your name.', 400);

  const kids = (Array.isArray(children) ? children : [])
    .map(c => ({ name: cleanText(c && c.name, 120), group: cleanText(c && c.group, 40) || '' }))
    .filter(c => c.name)
    .slice(0, 12);
  if (kids.length === 0) return fail('Please add at least one child.', 400);

  const event = await checkEvent(eventId, churchId);
  if (!event.ok) return fail('Event not found.', 400);

  const code = makeCode();
  const phone = cleanText(guardianPhone, 40) || '';
  const rows = [
    { church_id: churchId, event_id: event.id, visitor_name: guardian, visitor_type: 'adult', notes: JSON.stringify({ role: 'guardian', familyCode: code }) },
    ...kids.map(k => ({
      church_id: churchId, event_id: event.id, visitor_name: k.name, visitor_type: 'child',
      notes: JSON.stringify({ pickupCode: code, group: k.group, guardianName: guardian, guardianPhone: phone }),
    })),
  ];
  const { error } = await supabase.from('cc_attendance').insert(rows);
  if (error) return fail('Could not complete check-in.', 500);

  // Auto-add guardian and children to members
  const { firstName: gFn, lastName: gLn } = splitName(guardian);
  const guardianMemberId = await autoUpsertMember(churchId, gFn, gLn, { memberType: 'adult' });
  for (const k of kids) {
    const { firstName: kFn, lastName: kLn } = splitName(k.name);
    await autoUpsertMember(churchId, kFn, kLn, { memberType: 'child', parentId: guardianMemberId });
  }

  return NextResponse.json({ ok: true, pickupCode: code, count: kids.length });
}

async function signout(body) {
  const { churchId, attendanceId, memberId, code } = body;
  const { from, to } = todayRange();

  let record = null;
  if (attendanceId) {
    const { data } = await supabase.from('cc_attendance').select('id, visitor_name, sign_out_time, notes')
      .eq('id', attendanceId).eq('church_id', churchId).maybeSingle();
    record = data;
  } else if (memberId) {
    const { data } = await supabase.from('cc_attendance').select('id, visitor_name, sign_out_time, notes')
      .eq('church_id', churchId).eq('member_id', memberId).gte('sign_in_time', from).lte('sign_in_time', to)
      .is('sign_out_time', null).order('sign_in_time', { ascending: false }).limit(1);
    record = data && data[0] ? data[0] : null;
    if (!record) return NextResponse.json({ ok: true, notSignedIn: true });
  } else {
    return fail('Nothing to sign out.', 400);
  }
  if (!record) return fail('Record not found.', 404);
  if (record.sign_out_time) return NextResponse.json({ ok: true, already: true, childCount: 0 });

  const notes = parseNotes(record.notes);
  const isFamilyGuardian = notes.role === 'guardian' && !!notes.familyCode;
  const expected = notes.pickupCode || (isFamilyGuardian ? notes.familyCode : null);

  // A child, or a guardian with children, can only be signed out with the pick-up code.
  if (expected) {
    if (!code) return fail('A pick-up code is needed.', 403, { reason: 'code_required' });

    const attempts = Number(notes.failedAttempts) || 0;
    if (attempts >= MAX_CODE_ATTEMPTS) {
      return fail('Too many wrong codes. Please see a children\'s leader.', 423, { reason: 'locked' });
    }
    // Count the attempt first, and only if nobody else changed the record in the
    // meantime. This stops many guesses being sent at once.
    const next = { ...notes, failedAttempts: attempts + 1 };
    const storedAsText = typeof record.notes === 'string';
    let reserve = supabase.from('cc_attendance')
      .update({ notes: storedAsText ? JSON.stringify(next) : next })
      .eq('id', record.id).eq('church_id', churchId);
    if (storedAsText) reserve = reserve.eq('notes', record.notes);
    const { data: reserved, error: reserveError } = await reserve.select('id');
    if (reserveError || !reserved || reserved.length === 0) return fail('Please try again.', 409, { reason: 'busy' });

    if (!codesMatch(String(code).trim(), expected)) {
      const left = MAX_CODE_ATTEMPTS - (attempts + 1);
      if (left <= 0) return fail('Too many wrong codes. Please see a children\'s leader.', 423, { reason: 'locked' });
      return fail('That code is not right.', 403, { reason: 'wrong_code', attemptsLeft: left });
    }
  }

  const now = new Date().toISOString();
  const { error } = await supabase.from('cc_attendance').update({ sign_out_time: now })
    .eq('id', record.id).eq('church_id', churchId).is('sign_out_time', null);
  if (error) return fail('Could not sign out.', 500);

  // Signing out a guardian signs out the children checked in with them today.
  let childCount = 0;
  if (isFamilyGuardian) {
    const { data: kids } = await supabase.from('cc_attendance').select('id, notes')
      .eq('church_id', churchId).eq('visitor_type', 'child').gte('sign_in_time', from).lte('sign_in_time', to).is('sign_out_time', null);
    const ids = (kids || []).filter(k => {
      const n = parseNotes(k.notes);
      return String(n.pickupCode) === String(notes.familyCode) && normaliseName(n.guardianName) === normaliseName(record.visitor_name);
    }).map(k => k.id);
    if (ids.length) {
      const { error: kidError } = await supabase.from('cc_attendance').update({ sign_out_time: now }).in('id', ids).eq('church_id', churchId);
      if (!kidError) childCount = ids.length;
    }
  }
  return NextResponse.json({ ok: true, childCount });
}
