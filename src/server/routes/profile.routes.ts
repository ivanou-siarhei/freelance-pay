import { Router, Request, Response } from 'express';
import { query } from '../db/neon';

export const profileRoutes = Router();

profileRoutes.get('/:id', async (req: Request, res: Response) => {
  try {
    const rows = await query('SELECT * FROM freelancer_profiles WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

profileRoutes.put('/:id', async (req: Request, res: Response) => {
  try {
    const { defaultChain, defaultDestinationAddress, email } = req.body;
    const rows = await query(
      `UPDATE freelancer_profiles
       SET default_chain = COALESCE($1, default_chain),
           default_destination_address = COALESCE($2, default_destination_address),
           email = COALESCE($3, email)
       WHERE id = $4 RETURNING *`,
      [defaultChain, defaultDestinationAddress, email, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});
