import dotenv from 'dotenv';
dotenv.config();

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env variable: ${name}`);
  return v;
}

const sessionSecret = required('SESSION_SECRET');
if (sessionSecret.length < 32) throw new Error('SESSION_SECRET must be at least 32 characters');

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  isProd: process.env.NODE_ENV === 'production',
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  sessionSecret,
  sessionTtlSec: 60 * 60 * 12, // 12h
  neon: {
    connectionString: required('DATABASE_URL'),
  },
  arc: {
    chainId: 5042002,
    rpcUrl: process.env.ARC_RPC_URL || 'https://rpc.testnet.arc.io',
    usdcAddress: '0x3600000000000000000000000000000000000000',
  },
} as const;
