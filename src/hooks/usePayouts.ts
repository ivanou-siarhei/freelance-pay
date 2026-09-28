import { useCallback, useEffect, useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { apiFetch, clearSession } from '../lib/api';

export interface Payout {
  id: string;
  amount: string;
  fee: string;
  dest_chain: string;
  dest_address: string;
  source_tx_hash: string;
  dest_tx_hash: string | null;
  status: 'submitted' | 'done' | 'failed';
  created_at: string;
}

export interface NewPayout {
  amount: string;
  fee: string;
  destChain: string;
  destAddress: string;
  sourceTxHash: string;
  destTxHash?: string | null;
  status?: 'failed';
}

export function usePayouts() {
  const { address, getSession } = useWallet();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const withSession = useCallback(
    async <T,>(fn: (token: string) => Promise<T>): Promise<T> => {
      try {
        return await fn(await getSession());
      } catch (e: any) {
        if (e?.status === 401) {
          clearSession(address);
          return fn(await getSession());
        }
        throw e;
      }
    },
    [getSession, address]
  );

  const fetchPayouts = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    try {
      setPayouts(await withSession((t) => apiFetch<Payout[]>('/api/payouts', t)));
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load payouts');
    } finally {
      setLoading(false);
    }
  }, [address, withSession]);

  const recordPayout = useCallback(
    async (p: NewPayout) => {
      const saved = await withSession((t) => apiFetch<Payout>('/api/payouts', t, { method: 'POST', body: JSON.stringify(p) }));
      setPayouts((prev) => [saved, ...prev]);
      return saved;
    },
    [withSession]
  );

  useEffect(() => {
    setPayouts([]);
  }, [address]);

  return { payouts, loading, error, fetchPayouts, recordPayout };
}
