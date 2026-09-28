import { Router } from 'express';
import { randomBytes } from 'crypto';
import { verifyMessage } from 'viem';
import { query } from '../db/neon';
import { config } from '../config';
import { signSession } from '../lib/session';
import { normAddress, ValidationError } from '../lib/validation';

export const authRoutes = Router();

// Шаг 1: выдаём одноразовое сообщение для подписи (EIP-4361-подобное)
authRoutes.post('/nonce', async (req, res, next) => {
  try {
    const address = normAddress(req.body?.address);
    const nonce = randomBytes(16).toString('hex');
    const issuedAt = new Date().toISOString();
    const domain = config.allowedOrigins[0] ?? 'payflow';
    const message =
      `${domain} wants you to sign in with your Ethereum account:\n${address}\n\n` +
      `Sign in to PayFlow. This does not cost gas and does not approve any transaction.\n\n` +
      `Chain ID: ${config.arc.chainId}\nNonce: ${nonce}\nIssued At: ${issuedAt}`;

    await query('DELETE FROM auth_nonces WHERE expires_at < NOW()');
    await query(
      `INSERT INTO auth_nonces (nonce, address, message, expires_at) VALUES ($1, $2, $3, NOW() + INTERVAL '5 minutes')`,
      [nonce, address, message]
    );
    res.json({ nonce, message });
  } catch (e) {
    next(e);
  }
});

// Шаг 2: проверяем подпись, nonce сжигаем (защита от replay)
authRoutes.post('/verify', async (req, res, next) => {
  try {
    const address = normAddress(req.body?.address);
    const { nonce, signature } = req.body ?? {};
    if (typeof nonce !== 'string' || typeof signature !== 'string' || !/^0x[0-9a-fA-F]+$/.test(signature)) {
      throw new ValidationError('Invalid payload');
    }
    const rows = await query<{ message: string }>(
      `DELETE FROM auth_nonces WHERE nonce = $1 AND address = $2 AND expires_at > NOW() RETURNING message`,
      [nonce, address]
    );
    if (rows.length === 0) return res.status(401).json({ error: 'Nonce expired or invalid' });

    const ok = await verifyMessage({
      address: address as `0x${string}`,
      message: rows[0].message,
      signature: signature as `0x${string}`,
    });
    if (!ok) return res.status(401).json({ error: 'Bad signature' });

    res.json({ token: signSession(address, config.sessionSecret, config.sessionTtlSec), address });
  } catch (e) {
    next(e);
  }
});
