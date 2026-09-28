import { describe, it, expect } from 'vitest';
import { signSession, verifySession } from '../session';

const SECRET = 'x'.repeat(40);

describe('session tokens', () => {
  it('round-trips a lowercase address', () => {
    const t = signSession('0xABCDEF0000000000000000000000000000000001', SECRET, 60);
    expect(verifySession(t, SECRET)).toBe('0xabcdef0000000000000000000000000000000001');
  });
  it('rejects a tampered payload', () => {
    const t = signSession('0x0000000000000000000000000000000000000001', SECRET, 60);
    const [, sig] = t.split('.');
    const forged = Buffer.from(JSON.stringify({ a: '0x0000000000000000000000000000000000000002', e: 9e9 })).toString('base64url');
    expect(verifySession(`${forged}.${sig}`, SECRET)).toBeNull();
  });
  it('rejects wrong secret and expired tokens', () => {
    const t = signSession('0x0000000000000000000000000000000000000001', SECRET, 60, 0);
    expect(verifySession(t, 'y'.repeat(40), 0)).toBeNull();
    expect(verifySession(t, SECRET, 120_000)).toBeNull();
  });
});
