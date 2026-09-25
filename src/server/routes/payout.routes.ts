import { Router, Request, Response } from 'express';
import { query } from '../db/neon';
import { createPayout } from '../services/payout.service';

export const payoutRoutes = Router();

payoutRoutes.post('/', async (req: Request, res: Response) => {
  try {
    const { escrowId, freelancerId, destChain, destAddress } = req.body;
    const payout = await createPayout(escrowId, freelancerId, destChain, destAddress);
    res.json(payout);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

payoutRoutes.get('/:id', async (req: Request, res: Response) => {
  try {
    const rows = await query('SELECT * FROM payouts WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

payoutRoutes.get('/', async (req: Request, res: Response) => {
  try {
    const { freelancer } = req.query;
    let sql = 'SELECT * FROM payouts';
    const params: any[] = [];

    if (freelancer) {
      sql += ' WHERE freelancer_id = $1';
      params.push(freelancer);
    }

    sql += ' ORDER BY created_at DESC LIMIT 50';

    const rows = await query(sql, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});
