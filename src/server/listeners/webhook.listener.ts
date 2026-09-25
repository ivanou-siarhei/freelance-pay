// src/server/listeners/webhook.listener.ts
import { createPublicClient, http, parseAbiItem, keccak256, toBytes } from 'viem';
import { config } from '../config';
import { query } from '../db/neon';
import { createPayout, processPayout } from '../services/payout.service';

const FUNDS_RELEASED_TOPIC = keccak256(toBytes('FundsReleased(uint256,address,uint256)'));

export function startEventListener() {
  const client = createPublicClient({
    transport: http(config.arc.rpcUrl),
  });

  client.watchEvent({
    address: config.arc.escrowContract as `0x${string}`,
    event: parseAbiItem('event FundsReleased(uint256 indexed escrowId, address indexed freelancer, uint256 amount)'),
    onLogs: async (logs) => {
      for (const log of logs) {
        const { escrowId, freelancer, amount } = log.args as any;

        const existing = await query(
          'SELECT id FROM payouts WHERE escrow_id = $1 AND tx_hash = $2',
          [escrowId.toString(), log.transactionHash]
        );

        if (existing.length > 0) continue;

        const profiles = await query(
          'SELECT * FROM freelancer_profiles WHERE arc_address = $1',
          [freelancer]
        );

        if (profiles.length === 0) {
          console.log(`No profile found for address ${freelancer}`);
          continue;
        }

        const profile = profiles[0];
        const destChain = profile.default_chain || 'Ethereum';
        const destAddress = profile.default_destination_address || freelancer;

        const payout = await createPayout(
          escrowId.toString(),
          profile.id,
          destChain,
          destAddress
        );

        await query(
          `INSERT INTO tx_log (payout_id, event_type, payload)
           VALUES ($1, 'funds_released', $2)`,
          [payout.id, JSON.stringify({ escrowId: escrowId.toString(), amount: amount.toString() })]
        );

        processPayout(payout.id).catch(console.error);
      }
    },
    onError: (error) => {
      console.error('Event listener error:', error);
    },
  });

  console.log('FundsReleased event listener started');
}