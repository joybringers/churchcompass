import crypto from 'crypto';
import { verifyToken } from '@/lib/auth';

// Types a member or visitor can have. 'rsvp' is only allowed through the public event form.
export const MEMBER_TYPES = ['adult', 'child', 'youth', 'volunteer', 'leader', 'pastor'];
export const VISITOR_TYPES = ['member', ...MEMBER_TYPES, 'visitor'];

// Returns the signed-in church admin's token payload, or null.
export async function adminFromRequest(req) {
  const token = (req.headers.get('Authorization') || '').replace('Bearer ', '');
  if (!token) return null;
  return verifyToken(token);
}

// Notes are stored as a JSON string. Always return an object.
export function parseNotes(notes) {
  if (!notes) return {};
  if (typeof notes === 'object') return notes;
  try {
    const n = JSON.parse(notes);
    return n && typeof n === 'object' ? n : {};
  } catch {
    return {};
  }
}

// Trim and cap a text value. Returns null for empty input.
export function cleanText(value, max = 200) {
  if (value === undefined || value === null) return null;
  const s = String(value).trim().slice(0, max);
  return s || null;
}

// Keep only letters, numbers, spaces, apostrophes and hyphens, so search text
// can never change the shape of a database filter.
export function cleanSearch(value) {
  return String(value || '')
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}\s'’-]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60);
}

export function normaliseName(value) {
  return String(value || '').normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim();
}

// Pick-up codes are made on the server with a secure random number.
export function makeCode() {
  return String(crypto.randomInt(1000, 10000));
}

export function codesMatch(given, expected) {
  const a = Buffer.from(String(given));
  const b = Buffer.from(String(expected));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Same day window the app has always used (UTC date).
export function todayRange() {
  const d = new Date().toISOString().split('T')[0];
  return { from: `${d}T00:00:00`, to: `${d}T23:59:59` };
}
