// src/server/services/wallet.service.ts
import { createCircleWalletsAdapter } from '@circle-fin/adapter-circle-wallets';
import { AppKit } from '@circle-fin/app-kit';
import { config } from '../config';

let adapter: ReturnType<typeof createCircleWalletsAdapter> | null = null;
let kit: AppKit | null = null;

export function initWalletAdapter() {
  if (!adapter) {
    adapter = createCircleWalletsAdapter({
      apiKey: config.circle.apiKey,
      entitySecret: config.circle.entitySecret,
    });
  }
  return adapter;
}

export function getAppKitInstance(): AppKit {
  if (!kit) {
    kit = new AppKit();
  }
  return kit;
}
