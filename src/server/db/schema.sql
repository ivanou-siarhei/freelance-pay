CREATE TABLE IF NOT EXISTS freelancer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arc_address VARCHAR(42) NOT NULL,
  default_chain VARCHAR(20),
  default_destination_address VARCHAR(42),
  email VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escrow_id VARCHAR(20) NOT NULL,
  freelancer_id UUID REFERENCES freelancer_profiles(id),
  amount NUMERIC(18,6) NOT NULL,
  source_chain VARCHAR(20) DEFAULT 'Arc',
  dest_chain VARCHAR(20) NOT NULL,
  dest_address VARCHAR(42) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  tx_hash VARCHAR(66),
  bridge_tx_hash VARCHAR(66),
  fee NUMERIC(18,6),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tx_log (
  id SERIAL PRIMARY KEY,
  payout_id UUID REFERENCES payouts(id),
  event_type VARCHAR(30),
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payouts_freelancer ON payouts(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);
CREATE INDEX IF NOT EXISTS idx_tx_log_payout ON tx_log(payout_id);
