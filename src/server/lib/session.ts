import { createHmac, timingSafeEqual } from 'crypto';

// Минималистичный подписанный токен: base64url(payload).base64url(hmac)
export function signSession(address: string, secret: string, ttlSec: number, now = Date.now()): string {
  const payload = Buffer.from(JSON.stringify({ a: address.toLowerCase(), e: Math.floor(now / 1000) + ttlSec })).toString('base64url');
  const sig = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifySession(token: string, secret: string, now = Date.now()): string | null {
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const expected = createHmac('sha256', secret).update(payload).digest();
  let given: Buffer;
  try {
    given = Buffer.from(sig, 'base64url');
  } catch {
    return null;
  }
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (typeof data.a !== 'string' || typeof data.e !== 'number') return null;
    if (data.e < Math.floor(now / 1000)) return null;
    return data.a;
  } catch {
    return null;
  }
}
