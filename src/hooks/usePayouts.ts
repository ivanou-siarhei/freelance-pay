// src/hooks/usePayouts.ts
import { useState, useCallback } from 'react';

interface Payout {
  id: string;
  escrow_id: string;
  amount: number;
  dest_chain: string;
  dest_address: string;
  status: 'pending' | 'processing' | 'done' | 'failed';
  tx_hash: string | null;
  bridge_tx_hash: string | null;
  fee: number | null;
  created_at: string;
}

export function usePayouts() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPayouts = useCallback(async (freelancerId?: string) => {
    setLoading(true);
    try {
      const url = freelancerId
        ? `/api/payouts?freelancer=${freelancerId}`
        : '/api/payouts';
      const res = await fetch(url);
      const data = await res.json();
      setPayouts(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const createPayout = useCallback(async (
    escrowId: string,
    freelancerId: string,
    destChain: string,
    destAddress: string
  ) => {
    const res = await fetch('/api/payouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ escrowId, freelancerId, destChain, destAddress }),
    });
    return res.json();
  }, []);

  return { payouts, loading, fetchPayouts, createPayout };
}
