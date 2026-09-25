export interface FreelancerProfile {
  id: string;
  arc_address: string;
  default_chain: string | null;
  default_destination_address: string | null;
  email: string | null;
  created_at: string;
}

export interface Payout {
  id: string;
  escrow_id: string;
  freelancer_id: string;
  amount: number;
  source_chain: string;
  dest_chain: string;
  dest_address: string;
  status: 'pending' | 'processing' | 'done' | 'failed';
  tx_hash: string | null;
  bridge_tx_hash: string | null;
  fee: number | null;
  created_at: string;
  updated_at: string;
}

export interface TxLog {
  id: number;
  payout_id: string;
  event_type: string;
  payload: Record<string, any>;
  created_at: string;
}

export interface PayoutError {
  code: 'BRIDGE_FAILED' | 'INSUFFICIENT_BALANCE' | 'WRONG_NETWORK'
      | 'ATTESTATION_TIMEOUT' | 'DB_ERROR' | 'WALLET_DISCONNECTED';
  message: string;
  retryable: boolean;
  retryAfter?: number;
  txHash?: string;
}
