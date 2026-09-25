// src/server/services/__tests__/wallet.service.test.ts
import { describe, it, expect, vi } from 'vitest';

vi.mock('@circle-fin/adapter-circle-wallets', () => ({
  createCircleWalletsAdapter: vi.fn(() => ({ getSdk: vi.fn() })),
}));

vi.mock('@circle-fin/app-kit', () => ({
  AppKit: class MockAppKit {
    bridge = vi.fn();
  },
}));

import { initWalletAdapter, getAppKitInstance } from '../wallet.service';

describe('WalletService', () => {
  it('creates adapter with Circle credentials', () => {
    const adapter = initWalletAdapter();
    expect(adapter).toBeDefined();
    expect(adapter).toHaveProperty('getSdk');
  });

  it('creates AppKit instance', () => {
    const kit = getAppKitInstance();
    expect(kit).toBeDefined();
    expect(kit.bridge).toBeDefined();
  });

  it('returns same adapter on subsequent calls', () => {
    const adapter1 = initWalletAdapter();
    const adapter2 = initWalletAdapter();
    expect(adapter1).toBe(adapter2);
  });

  it('returns same AppKit instance on subsequent calls', () => {
    const kit1 = getAppKitInstance();
    const kit2 = getAppKitInstance();
    expect(kit1).toBe(kit2);
  });
});
