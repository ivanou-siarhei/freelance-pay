import { Router } from 'express';
import { createPublicClient, http, defineChain } from 'viem';
import { query } from '../db/neon';
import { config } from '../config';
import { requireAuth, AuthedRequest } from '../middleware/security';
import { amount, destChain, normAddress, txHash, ValidationError } from '../lib/validation';

export const payoutRoutes = Router();
payoutRoutes.use(requireAuth);

const arc = defineChain({
  id: config.arc.chainId,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: { default: { http: [config.arc.rpcUrl] } },
});
const arcClient = createPublicClient({ chain: arc, transport: http(config.arc.rpcUrl) });

// Только свои выплаты, с пагинацией
payoutRoutes.get('/', async (req: AuthedRequest, res, next) => {
  try {
    const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? '50'), 10) || 50, 1), 100);
    const offset = Math.max(parseInt(String(req.query.offset ?? '0'), 10) || 0, 0);
    const rows = await query(
      'SELECT * FROM bridge_payouts WHERE address = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [req.user!.address, limit, offset]
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// Записываем выплату, которую фрилансер уже отправил со своего кошелька.
// Сервер проверяет on-chain, что исходная транзакция успешна и отправлена именно этим адресом.
payoutRoutes.post('/', async (req: AuthedRequest, res, next) => {
  try {
    const b = req.body ?? {};
    const sourceTx = txHash(b.sourceTxHash, 'sourceTxHash');
    const destTx = b.destTxHash ? txHash(b.destTxHash, 'destTxHash') : null;
    const amt = amount(b.amount);
    const fee = b.fee ? amount(b.fee, 'fee') : '0';
    const chain = destChain(b.destChain);
    const dest = normAddress(b.destAddress, 'destAddress');
    const status = b.status === 'failed' ? 'failed' : destTx ? 'done' : 'submitted';

    const receipt = await arcClient.getTransactionReceipt({ hash: sourceTx as `0x${string}` }).catch(() => null);
    if (!receipt || receipt.status !== 'success') throw new ValidationError('Source transaction not found or failed');
    if (receipt.from.toLowerCase() !== req.user!.address) {
      return res.status(403).json({ error: 'Transaction was not sent by this wallet' });
    }

    const rows = await query(
      `INSERT INTO bridge_payouts (address, amount, fee, dest_chain, dest_address, source_tx_hash, dest_tx_hash, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (source_tx_hash) DO NOTHING
       RETURNING *`,
      [req.user!.address, amt, fee, chain, dest, sourceTx, destTx, status]
    );
    if (rows.length === 0) return res.status(409).json({ error: 'Payout already recorded' });
    res.status(201).json(rows[0]);
  } catch (e) {
    next(e);
  }
});
