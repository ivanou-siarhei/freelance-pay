// src/server/services/payout.service.ts
import { query } from '../db/neon';
import { getAppKitInstance } from './wallet.service';
import { calculateFee, getFeeRecipient } from './fee.service';
import { Payout } from '../types';
import { BridgeChain } from '@circle-fin/app-kit';

export async function createPayout(
  escrowId: string,
  freelancerId: string,
  destChain: string,
  destAddress: string
): Promise<Payout> {
  const fee = calculateFee(0);
  const result = await query<Payout>(
    `INSERT INTO payouts (escrow_id, freelancer_id, dest_chain, dest_address, fee)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [escrowId, freelancerId, destChain, destAddress, fee]
  );
  return result[0];
}

export async function processPayout(payoutId: string): Promise<void> {
  const rows = await query<Payout & { arc_address: string }>(
    `SELECT p.*, fp.arc_address
     FROM payouts p
     JOIN freelancer_profiles fp ON p.freelancer_id = fp.id
     WHERE p.id = $1`,
    [payoutId]
  );

  if (rows.length === 0) throw new Error('Payout not found');
  const payout = rows[0];

  await query(
    `UPDATE payouts SET status = 'processing', updated_at = NOW() WHERE id = $1`,
    [payoutId]
  );

  try {
    const kit = getAppKitInstance();
    const fee = calculateFee(payout.amount);

    const result = await kit.bridge({
      from: { adapter: null as any, chain: BridgeChain.Arc_Testnet },
      to: { adapter: null as any, chain: payout.dest_chain as BridgeChain, recipientAddress: payout.dest_address },
      amount: payout.amount.toString(),
      config: {
        customFee: {
          value: fee.toString(),
          recipientAddress: getFeeRecipient(),
        },
      },
    });

    if (result.state === 'error') {
      throw new Error('Bridge failed');
    }

    const bridgeTxHash = (result as any).steps?.[1]?.txHash || null;

    await query(
      `UPDATE payouts SET status = 'done', bridge_tx_hash = $1, updated_at = NOW() WHERE id = $2`,
      [bridgeTxHash, payoutId]
    );

    await query(
      `INSERT INTO tx_log (payout_id, event_type, payload)
       VALUES ($1, 'bridge_completed', $2)`,
      [payoutId, JSON.stringify({ bridgeTxHash, fee })]
    );
  } catch (error) {
    await query(
      `UPDATE payouts SET status = 'failed', updated_at = NOW() WHERE id = $1`,
      [payoutId]
    );

    await query(
      `INSERT INTO tx_log (payout_id, event_type, payload)
       VALUES ($1, 'bridge_failed', $2)`,
      [payoutId, JSON.stringify({ error: (error as Error).message })]
    );

    throw error;
  }
}
