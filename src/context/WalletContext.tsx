import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createPublicClient, createWalletClient, custom, http, type PublicClient, type WalletClient } from 'viem';
import { createViemAdapterFromProvider } from '@circle-fin/adapter-viem-v2';
import { arcTestnet, erc20Abi, USDC_ADDRESS } from '../lib/arc';
import { clearSession, ensureSession } from '../lib/api';

export type Role = 'client' | 'freelancer';

export interface BrowserWallet {
  info: { uuid: string; name: string; rdns: string; icon: string };
  provider: any;
}

interface WalletCtx {
  wallets: BrowserWallet[];
  address: `0x${string}` | null;
  chainId: number | null;
  isArc: boolean;
  usdcBalance: bigint | null;
  role: Role | null;
  publicClient: PublicClient;
  walletClient: WalletClient | null;
  adapter: any | null;
  connect: (w: BrowserWallet) => Promise<void>;
  disconnect: () => void;
  switchToArc: () => Promise<void>;
  setRole: (r: Role | null) => void;
  refreshBalance: () => Promise<void>;
  getSession: () => Promise<string>;
}

const Ctx = createContext<WalletCtx | null>(null);

const publicClient = createPublicClient({ chain: arcTestnet, transport: http() });
const roleKey = (a: string) => `payflow:role:${a.toLowerCase()}`;
const ARC_HEX = `0x${arcTestnet.id.toString(16)}`;

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [wallets, setWallets] = useState<BrowserWallet[]>([]);
  const [provider, setProvider] = useState<any>(null);
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<bigint | null>(null);
  const [role, setRoleState] = useState<Role | null>(null);
  const [adapter, setAdapter] = useState<any>(null);
  const listenersRef = useRef<{ p: any; acc: any; chain: any } | null>(null);
  const addressRef = useRef<string | null>(null);
  useEffect(() => {
    addressRef.current = address;
  }, [address]);

  // EIP-6963: слушаем анонсы постоянно, дедуп по uuid, отписка при размонтировании
  useEffect(() => {
    const onAnnounce = (event: any) => {
      const detail = event.detail as BrowserWallet;
      setWallets((prev) => (prev.some((w) => w.info.uuid === detail.info.uuid) ? prev : [...prev, detail]));
    };

    const requestProviders = () => {
      window.dispatchEvent(new Event('eip6963:requestProviders'));
    };

    window.addEventListener('eip6963:announceProvider', onAnnounce as EventListener);
    requestProviders();

    // Повторный запрос, если кошельки подключились с задержкой
    const t1 = setTimeout(requestProviders, 500);
    const t2 = setTimeout(requestProviders, 2000);

    // Fallback: если есть window.ethereum (MetaMask обычно это инжектит)
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const provider = (window as any).ethereum;
      setWallets((prev) => {
        if (prev.some((w) => w.info.rdns === 'io.metamask')) return prev;
        return [...prev, {
          info: { uuid: 'metamask-fallback', name: 'MetaMask', rdns: 'io.metamask', icon: '' },
          provider,
        }];
      });
    }

    return () => {
      window.removeEventListener('eip6963:announceProvider', onAnnounce as EventListener);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const loadRole = (a: string | null) => {
    if (!a) return setRoleState(null);
    const r = localStorage.getItem(roleKey(a));
    setRoleState(r === 'client' || r === 'freelancer' ? r : null);
  };

  const detach = () => {
    const l = listenersRef.current;
    if (l?.p?.removeListener) {
      l.p.removeListener('accountsChanged', l.acc);
      l.p.removeListener('chainChanged', l.chain);
    }
    listenersRef.current = null;
  };

  const disconnect = useCallback(() => {
    detach();
    clearSession(addressRef.current);
    setProvider(null);
    setAddress(null);
    setChainId(null);
    setUsdcBalance(null);
    setAdapter(null);
    setRoleState(null);
  }, []);

  const connect = useCallback(async (w: BrowserWallet) => {
    const accounts = (await w.provider.request({ method: 'eth_requestAccounts' })) as string[];
    if (!accounts?.length) throw new Error('No account selected');
    const cid = parseInt((await w.provider.request({ method: 'eth_chainId' })) as string, 16);

    detach();
    const acc = (list: string[]) => {
      if (!list.length) {
        disconnect();
        return;
      }
      // Новый аккаунт = новая роль и новая сессия
      const next = list[0] as `0x${string}`;
      setAddress(next);
      loadRole(next);
    };
    const chain = (hex: string) => setChainId(parseInt(hex, 16));
    w.provider.on?.('accountsChanged', acc);
    w.provider.on?.('chainChanged', chain);
    listenersRef.current = { p: w.provider, acc, chain };

    setProvider(w.provider);
    setAddress(accounts[0] as `0x${string}`);
    setChainId(cid);
    loadRole(accounts[0]);
    setAdapter(await createViemAdapterFromProvider({ provider: w.provider }));
  }, [disconnect]);

  const switchToArc = useCallback(async () => {
    if (!provider) return;
    try {
      await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: ARC_HEX }] });
    } catch (e: any) {
      if (e?.code !== 4902) throw e;
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: ARC_HEX,
            chainName: arcTestnet.name,
            nativeCurrency: arcTestnet.nativeCurrency,
            rpcUrls: arcTestnet.rpcUrls.default.http,
            blockExplorerUrls: [arcTestnet.blockExplorers.default.url],
          },
        ],
      });
    }
  }, [provider]);

  const walletClient = useMemo(
    () => (provider && address ? createWalletClient({ account: address, chain: arcTestnet, transport: custom(provider) }) : null),
    [provider, address]
  );

  const refreshBalance = useCallback(async () => {
    if (!address) return;
    try {
      const b = await publicClient.readContract({ address: USDC_ADDRESS, abi: erc20Abi, functionName: 'balanceOf', args: [address] });
      setUsdcBalance(b);
    } catch {
      setUsdcBalance(null);
    }
  }, [address]);

  useEffect(() => {
    refreshBalance();
  }, [refreshBalance, chainId]);

  const setRole = useCallback(
    (r: Role | null) => {
      if (!address) return;
      if (r) localStorage.setItem(roleKey(address), r);
      else localStorage.removeItem(roleKey(address));
      setRoleState(r);
    },
    [address]
  );

  const getSession = useCallback(async () => {
    if (!walletClient || !address) throw new Error('Wallet not connected');
    return ensureSession(address, (message) => walletClient.signMessage({ account: address, message }));
  }, [walletClient, address]);

  const value: WalletCtx = {
    wallets,
    address,
    chainId,
    isArc: chainId === arcTestnet.id,
    usdcBalance,
    role,
    publicClient: publicClient as PublicClient,
    walletClient,
    adapter,
    connect,
    disconnect,
    switchToArc,
    setRole,
    refreshBalance,
    getSession,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWallet() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useWallet must be used inside WalletProvider');
  return v;
}
