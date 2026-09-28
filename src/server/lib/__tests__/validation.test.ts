import { describe, it, expect } from 'vitest';
import { amount, destChain, normAddress, optionalEmail, txHash } from '../validation';

describe('validation', () => {
  it('normalizes addresses to lowercase', () => {
    expect(normAddress('0xAbCdEf0000000000000000000000000000000001')).toBe('0xabcdef0000000000000000000000000000000001');
    expect(() => normAddress('arc1abc')).toThrow();
  });
  it('validates amounts as decimal strings with max 6 decimals', () => {
    expect(amount('10.5')).toBe('10.5');
    expect(() => amount('0')).toThrow();
    expect(() => amount('1.1234567')).toThrow();
    expect(() => amount(10 as any)).toThrow();
  });
  it('accepts only supported chains', () => {
    expect(destChain('Base_Sepolia')).toBe('Base_Sepolia');
    expect(() => destChain('Solana')).toThrow();
  });
  it('validates tx hash and email', () => {
    expect(() => txHash('0x123')).toThrow();
    expect(optionalEmail('')).toBeNull();
    expect(() => optionalEmail('not-an-email')).toThrow();
  });
});
