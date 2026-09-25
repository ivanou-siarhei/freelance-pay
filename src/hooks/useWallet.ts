import { useState, useCallback } from 'react';
import { discoverBrowserWallets, connectWallet, BrowserWallet } from '../services/wallet-connector';

interface WalletState {
  connected: boolean;
  address: string | null;
  chain: string | null;
  chainId: number | null;
  adapter: any | null;
}

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>({
    connected: false,
    address: null,
    chain: null,
    chainId: null,
    adapter: null,
  });

  const [wallets, setWallets] = useState<BrowserWallet[]>([]);

  const discover = useCallback(async () => {
    const discovered = await discoverBrowserWallets();
    setWallets(discovered);
  }, []);

  const connect = useCallback(async (provider: any) => {
    const result = await connectWallet(provider);
    const chainIdHex = (await provider.request({ method: 'eth_chainId' })) as string;
    const chainId = parseInt(chainIdHex, 16);

    setWallet({
      connected: true,
      address: result.address,
      chain: `Chain ${chainId}`,
      chainId,
      adapter: result.adapter,
    });

    // Listen for chain/account changes
    provider.on('chainChanged', () => window.location.reload());
    provider.on('accountsChanged', (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setWallet(prev => ({ ...prev, address: accounts[0] }));
      }
    });
  }, []);

  const disconnect = useCallback(() => {
    setWallet({
      connected: false,
      address: null,
      chain: null,
      chainId: null,
      adapter: null,
    });
  }, []);

  return { wallet, wallets, discover, connect, disconnect };
}
