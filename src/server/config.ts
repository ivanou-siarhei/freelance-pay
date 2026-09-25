import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  neon: {
    connectionString: process.env.DATABASE_URL!,
  },
  circle: {
    apiKey: process.env.CIRCLE_API_KEY!,
    entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
    kitKey: process.env.KIT_KEY,
  },
  arc: {
    rpcUrl: process.env.ARC_RPC_URL || 'https://rpc.testnet.arc.io',
    usdcAddress: '0x3600000000000000000000000000000000000000',
    escrowContract: process.env.ESCROW_CONTRACT_ADDRESS!,
  },
} as const;
