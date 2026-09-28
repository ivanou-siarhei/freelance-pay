import { Router } from 'express';
import { query } from '../db/neon';
import { requireAuth, AuthedRequest } from '../middleware/security';
import { destChain, normAddress, optionalEmail } from '../lib/validation';

export const profileRoutes = Router();
profileRoutes.use(requireAuth);

// Профиль доступен только владельцу кошелька: адрес берётся из подписанной сессии, а не из URL
profileRoutes.get('/me', async (req: AuthedRequest, res, next) => {
  try {
    const rows = await query('SELECT * FROM user_profiles WHERE address = $1', [req.user!.address]);
    res.json(rows[0] ?? { address: req.user!.address, default_chain: null, default_destination_address: null, email: null });
  } catch (e) {
    next(e);
  }
});

profileRoutes.put('/me', async (req: AuthedRequest, res, next) => {
  try {
    const b = req.body ?? {};
    const chain = b.defaultChain ? destChain(b.defaultChain) : null;
    const dest = b.defaultDestinationAddress ? normAddress(b.defaultDestinationAddress, 'destination address') : null;
    const email = optionalEmail(b.email);

    const rows = await query(
      `INSERT INTO user_profiles (address, default_chain, default_destination_address, email)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (address) DO UPDATE SET
         default_chain = EXCLUDED.default_chain,
         default_destination_address = EXCLUDED.default_destination_address,
         email = EXCLUDED.email,
         updated_at = NOW()
       RETURNING *`,
      [req.user!.address, chain, dest, email]
    );
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});
