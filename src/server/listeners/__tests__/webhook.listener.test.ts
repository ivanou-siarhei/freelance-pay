// src/server/listeners/__tests__/webhook.listener.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../db/neon', () => ({
  query: vi.fn(),
}));

vi.mock('../../services/payout.service', () => ({
  createPayout: vi.fn(),
  processPayout: vi.fn(),
}));

const mockWatchEvent = vi.fn();
vi.mock('viem', () => ({
  createPublicClient: vi.fn(() => ({
    watchEvent: mockWatchEvent,
  })),
  http: vi.fn(),
  parseAbiItem: vi.fn(),
  keccak256: vi.fn().mockReturnValue('0xmockedtopic'),
  toBytes: vi.fn(),
}));

import { startEventListener } from '../webhook.listener';
import { query } from '../../db/neon';
import { createPayout, processPayout } from '../../services/payout.service';

describe('WebhookListener', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts event listener and logs message', () => {
    const consoleSpy = vi.spyOn(console, 'log');
    startEventListener();
    expect(mockWatchEvent).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith('FundsReleased event listener started');
  });

  it('skips duplicate events (idempotency)', async () => {
    startEventListener();
    const onLogs = mockWatchEvent.mock.calls[0][0].onLogs;

    (query as any).mockResolvedValueOnce([{ id: 'existing-payout' }]);

    await onLogs([{ args: { escrowId: 1n, freelancer: '0x123', amount: 100n }, transactionHash: '0xtxhash' }]);

    expect(createPayout).not.toHaveBeenCalled();
  });

  it('skips events for unknown freelancer addresses', async () => {
    startEventListener();
    const onLogs = mockWatchEvent.mock.calls[0][0].onLogs;

    (query as any)
      .mockResolvedValueOnce([])  // idempotency check
      .mockResolvedValueOnce([]); // profile lookup

    await onLogs([{ args: { escrowId: 1n, freelancer: '0xunknown', amount: 100n }, transactionHash: '0xtxhash2' }]);

    expect(createPayout).not.toHaveBeenCalled();
  });

  it('creates payout and processes it for valid events', async () => {
    startEventListener();
    const onLogs = mockWatchEvent.mock.calls[0][0].onLogs;

    const mockPayout = { id: 'payout-123' };
    (query as any)
      .mockResolvedValueOnce([]) // idempotency check
      .mockResolvedValueOnce([{ id: 'profile-1', default_chain: 'Base', default_destination_address: '0xdest' }]) // profile lookup
      .mockResolvedValueOnce(undefined); // tx_log insert
    (createPayout as any).mockResolvedValueOnce(mockPayout);
    (processPayout as any).mockResolvedValue(undefined);

    await onLogs([{ args: { escrowId: 42n, freelancer: '0xfreelancer', amount: 500n }, transactionHash: '0xtxhash3' }]);

    expect(createPayout).toHaveBeenCalledWith('42', 'profile-1', 'Base', '0xdest');
    expect(query).toHaveBeenLastCalledWith(
      expect.stringContaining('INSERT INTO tx_log'),
      ['payout-123', JSON.stringify({ escrowId: '42', amount: '500' })]
    );
    expect(processPayout).toHaveBeenCalledWith('payout-123');
  });

  it('uses freelancer address as fallback destination', async () => {
    startEventListener();
    const onLogs = mockWatchEvent.mock.calls[0][0].onLogs;

    const mockPayout = { id: 'payout-456' };
    (query as any)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'profile-2', default_chain: null, default_destination_address: null }])
      .mockResolvedValueOnce(undefined);
    (createPayout as any).mockResolvedValueOnce(mockPayout);
    (processPayout as any).mockResolvedValue(undefined);

    await onLogs([{ args: { escrowId: 7n, freelancer: '0xfallback', amount: 200n }, transactionHash: '0xtxhash4' }]);

    expect(createPayout).toHaveBeenCalledWith('7', 'profile-2', 'Ethereum', '0xfallback');
  });

  it('logs errors from event listener', () => {
    const consoleSpy = vi.spyOn(console, 'error');
    startEventListener();
    const onError = mockWatchEvent.mock.calls[0][0].onError;

    onError(new Error('RPC connection failed'));

    expect(consoleSpy).toHaveBeenCalledWith('Event listener error:', expect.any(Error));
  });
});