-- Все адреса хранятся в нижнем регистре, чтобы сравнение не зависело от checksum-формы

CREATE TABLE IF NOT EXISTS user_profiles (
  address VARCHAR(42) PRIMARY KEY CHECK (address ~ '^0x[0-9a-f]{40}$'),
  default_chain VARCHAR(32),
  default_destination_address VARCHAR(42) CHECK (default_destination_address IS NULL OR default_destination_address ~ '^0x[0-9a-f]{40}$'),
  email VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth_nonces (
  nonce VARCHAR(64) PRIMARY KEY,
  address VARCHAR(42) NOT NULL,
  message TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_auth_nonces_expires ON auth_nonces(expires_at);

-- Выплаты (бридж USDC с Arc) делает сам фрилансер из своего кошелька.
-- Бэкенд только хранит историю и проверяет, что исходная транзакция реально от этого адреса.
CREATE TABLE IF NOT EXISTS bridge_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address VARCHAR(42) NOT NULL,
  amount NUMERIC(24,6) NOT NULL CHECK (amount > 0),
  fee NUMERIC(24,6) NOT NULL DEFAULT 0,
  dest_chain VARCHAR(32) NOT NULL,
  dest_address VARCHAR(42) NOT NULL,
  source_tx_hash VARCHAR(66) NOT NULL UNIQUE,
  dest_tx_hash VARCHAR(66),
  status VARCHAR(16) NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','done','failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bridge_payouts_address ON bridge_payouts(address, created_at DESC);
