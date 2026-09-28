export const SUPPORTED_DEST_CHAINS = [
  'Ethereum_Sepolia',
  'Base_Sepolia',
  'Arbitrum_Sepolia',
  'Optimism_Sepolia',
] as const;

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;
const TX_RE = /^0x[a-fA-F0-9]{64}$/;
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
const AMOUNT_RE = /^\d{1,18}(\.\d{1,6})?$/;

export class ValidationError extends Error {
  status = 400;
}

export function normAddress(v: unknown, field = 'address'): string {
  if (typeof v !== 'string' || !ADDRESS_RE.test(v)) throw new ValidationError(`Invalid ${field}`);
  return v.toLowerCase();
}

export function txHash(v: unknown, field = 'txHash'): string {
  if (typeof v !== 'string' || !TX_RE.test(v)) throw new ValidationError(`Invalid ${field}`);
  return v.toLowerCase();
}

export function destChain(v: unknown): string {
  if (typeof v !== 'string' || !(SUPPORTED_DEST_CHAINS as readonly string[]).includes(v)) {
    throw new ValidationError('Unsupported chain');
  }
  return v;
}

export function amount(v: unknown, field = 'amount'): string {
  if (typeof v !== 'string' || !AMOUNT_RE.test(v) || Number(v) <= 0) throw new ValidationError(`Invalid ${field}`);
  return v;
}

export function optionalEmail(v: unknown): string | null {
  if (v === undefined || v === null || v === '') return null;
  if (typeof v !== 'string' || v.length > 255 || !EMAIL_RE.test(v)) throw new ValidationError('Invalid email');
  return v.trim();
}
