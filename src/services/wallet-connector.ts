import { createViemAdapterFromProvider } from '@circle-fin/adapter-viem-v2';

export interface BrowserWallet {
  info: { name: string; rdns: string; icon: string };
  provider: any;
}

export async function discoverBrowserWallets(): Promise<BrowserWallet[]> {
  if (typeof window === 'undefined') return [];

  const providers: BrowserWallet[] = [];

  // EIP-6963 discovery
  window.addEventListener('eip6963:announceProvider', ((event: any) => {
    providers.push(event.detail);
  }) as EventListener);

  window.dispatchEvent(new Event('eip6963:requestProviders'));

  // Wait a bit for providers to announce
  await new Promise(resolve => setTimeout(resolve, 100));

  return providers;
}

export async function connectWallet(provider: any) {
  await provider.request({ method: 'eth_requestAccounts' });
  const accounts = (await provider.request({ method: 'eth_accounts' })) as string[];

  const adapter = await createViemAdapterFromProvider({ provider });

  return {
    adapter,
    address: accounts[0],
    provider,
  };
}
