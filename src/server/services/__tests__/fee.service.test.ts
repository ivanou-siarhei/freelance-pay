// src/server/services/__tests__/fee.service.test.ts
import { describe, it, expect } from 'vitest';
import { calculateFee, getFeeRecipient } from '../fee.service';

describe('FeeService', () => {
  it('calculates 1% fee', () => {
    const fee = calculateFee(1000);
    expect(fee).toBe(10);
  });

  it('rounds to 6 decimals', () => {
    const fee = calculateFee(100.50);
    expect(fee).toBe(1.005);
  });

  it('returns fee recipient address', () => {
    const recipient = getFeeRecipient();
    expect(recipient).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });
});
