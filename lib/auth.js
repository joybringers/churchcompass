import { SignJWT, jwtVerify } from 'jose';

const secret = () => new TextEncoder().encode(process.env.CC_SESSION_SECRET || 'cc-dev-secret-change-me');
const TTL = 8 * 60 * 60;

export async function makeToken(churchId, slug, extra = {}) {
  return new SignJWT({ churchId, slug, ...extra })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${TTL}s`)
    .sign(secret());
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload;
  } catch {
    return null;
  }
}

export function tokenFromRequest(req) {
  const auth = req.headers.get('authorization') || '';
  return auth.startsWith('Bearer ') ? auth.slice(7) : null;
}
