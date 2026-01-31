-- Create assets table
CREATE TABLE IF NOT EXISTS assets (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL UNIQUE,
  address VARCHAR(42) NOT NULL,
  decimals INTEGER NOT NULL,
  name VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create current_yields table
CREATE TABLE IF NOT EXISTS current_yields (
  id SERIAL PRIMARY KEY,
  asset_symbol VARCHAR(10) NOT NULL UNIQUE,
  supply_apy DECIMAL(10,6) NOT NULL,
  borrow_apy DECIMAL(10,6),
  utilization_rate DECIMAL(5,4),
  total_supply DECIMAL(30,18),
  total_borrow DECIMAL(30,18),
  block_number BIGINT NOT NULL,
  last_updated TIMESTAMP DEFAULT NOW()
);

-- Create yield_history table
CREATE TABLE IF NOT EXISTS yield_history (
  id BIGSERIAL PRIMARY KEY,
  asset_symbol VARCHAR(10) NOT NULL,
  supply_apy DECIMAL(10,6) NOT NULL,
  borrow_apy DECIMAL(10,6),
  block_number BIGINT NOT NULL,
  timestamp TIMESTAMP NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_yield_history_symbol_timestamp ON yield_history(asset_symbol, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_yield_history_timestamp ON yield_history(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_current_yields_symbol ON current_yields(asset_symbol);

-- Insert supported assets
INSERT INTO assets (symbol, address, decimals, name) VALUES
('USDC', '0xA0b86a33E6441b8C4505B8C4505B8C4505B8C4505', 6, 'USD Coin'),
('USDT', '0xdAC17F958D2ee523a2206206994597C13D831ec7', 6, 'Tether USD')
ON CONFLICT (symbol) DO NOTHING;