// src/server/services/fee.service.ts
const FEE_RECIPIENT = process.env.FEE_RECIPIENT_ADDRESS || '0x0000000000000000000000000000000000000000';
const FEE_PERCENTAGE = 0.01; // 1%

export function calculateFee(amount: number): number {
  return Math.floor(amount * FEE_PERCENTAGE * 1_000_000) / 1_000_000;
}

export function getFeeRecipient(): string {
  return FEE_RECIPIENT;
}
