// src/server/services/__tests__/payout.service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../wallet.service', () => ({
  getAppKitInstance: () => ({
    bridge: vi.fn().mockResolvedValue({ state: 'success', steps: [] }),
  }),
}));

vi.mock('../../db/neon', () => ({
  query: vi.fn(),
}));

import { createPayout, processPayout } from '../payout.service';
import { query } from '../../db/neon';

describe('PayoutService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates payout record', async () => {
    (query as any).mockResolvedValueOnce([{ id: 'test-id' }]);

    const payout = await createPayout('escrow-1', 'freelancer-1', 'Ethereum', '0x123');
    expect(payout).toBeDefined();
  });

  it('processes payout with bridge', async () => {
    (query as any)
      .mockResolvedValueOnce([{ id: 'payout-1', amount: 100, dest_chain: 'Ethereum', dest_address: '0x123', arc_address: '0x456' }]);

    await processPayout('payout-1');
    expect(query).toHaveBeenCalled();
  });
});
