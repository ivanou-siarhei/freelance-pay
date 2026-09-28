export interface UserProfile {
  address: string;
  default_chain: string | null;
  default_destination_address: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface BridgePayout {
  id: string;
  address: string;
  amount: string;
  fee: string;
  dest_chain: string;
  dest_address: string;
  source_tx_hash: string;
  dest_tx_hash: string | null;
  status: 'submitted' | 'done' | 'failed';
  created_at: string;
  updated_at: string;
}
