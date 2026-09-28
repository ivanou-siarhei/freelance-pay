import { defineChain, formatUnits, parseAbi } from 'viem';

export const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.arc.io'], webSocket: ['wss://rpc.testnet.arc.io'] },
  },
  blockExplorers: { default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' } },
  testnet: true,
});

export const USDC_ADDRESS = '0x3600000000000000000000000000000000000000' as const;
export const USDC_DECIMALS = 6;

const envEscrow = import.meta.env.VITE_ESCROW_ADDRESS as string | undefined;
export const ESCROW_ADDRESS = (envEscrow && /^0x[a-fA-F0-9]{40}$/.test(envEscrow) ? envEscrow : null) as
  | `0x${string}`
  | null;

// Должны совпадать с константами контракта
export const REVIEW_PERIOD_SEC = 3 * 24 * 60 * 60;
export const DISPUTE_TIMEOUT_SEC = 30 * 24 * 60 * 60;
export const MAX_DESCRIPTION_LENGTH = 280;

export const erc20Abi = parseAbi([
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
]);

export const escrowAbi = parseAbi([
  'struct Escrow { uint256 id; address client; address freelancer; uint256 amount; uint64 createdAt; uint64 deadline; uint64 submittedAt; uint64 disputedAt; uint8 status; string description; }',
  'function getEscrow(uint256 id) view returns (Escrow)',
  'function getClientEscrowIds(address) view returns (uint256[])',
  'function getFreelancerEscrowIds(address) view returns (uint256[])',
  'function owner() view returns (address)',
  'function createEscrow(address freelancer, uint256 amount, uint256 deadline, string description) returns (uint256)',
  'function releaseFunds(uint256 id)',
  'function refundAfterDeadline(uint256 id)',
  'function submitWork(uint256 id)',
  'function claimAfterReview(uint256 id)',
  'function refundByFreelancer(uint256 id)',
  'function initiateDispute(uint256 id)',
  'function resolveDisputeByTimeout(uint256 id)',
]);

export enum EscrowStatus {
  FundsLocked = 0,
  WorkSubmitted = 1,
  Completed = 2,
  Disputed = 3,
  Refunded = 4,
  Resolved = 5,
}

export const STATUS_LABEL: Record<EscrowStatus, string> = {
  [EscrowStatus.FundsLocked]: 'Funds Locked',
  [EscrowStatus.WorkSubmitted]: 'Under Review',
  [EscrowStatus.Completed]: 'Completed',
  [EscrowStatus.Disputed]: 'Disputed',
  [EscrowStatus.Refunded]: 'Refunded',
  [EscrowStatus.Resolved]: 'Resolved by Arbitration',
};

export interface EscrowDeal {
  id: bigint;
  client: `0x${string}`;
  freelancer: `0x${string}`;
  amount: bigint;
  createdAt: number;
  deadline: number;
  submittedAt: number;
  disputedAt: number;
  status: EscrowStatus;
  description: string;
}

export const formatUsdc = (v: bigint) =>
  Number(formatUnits(v, USDC_DECIMALS)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 });

export const shortAddr = (a?: string | null) => (a ? `${a.slice(0, 6)}...${a.slice(-4)}` : '');

export const txUrl = (hash: string) => `${arcTestnet.blockExplorers.default.url}/tx/${hash}`;

/** Человекочитаемая ошибка из viem / кошелька без утечки внутренностей */
export function readableError(e: unknown): string {
  const err = e as any;
  if (err?.code === 4001 || /User rejected|denied/i.test(err?.message ?? '')) return 'Transaction rejected in wallet';
  const name = err?.cause?.data?.errorName ?? err?.data?.errorName;
  if (name) return `Contract rejected: ${name}`;
  return err?.shortMessage ?? 'Something went wrong';
}
