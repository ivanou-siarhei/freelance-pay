import express from 'express';
import { config } from './config';
import { runMigrations } from './db/migrations';
import { payoutRoutes } from './routes/payout.routes';
import { profileRoutes } from './routes/profile.routes';

const app = express();
app.use(express.json());

app.use('/api/payouts', payoutRoutes);
app.use('/api/profiles', profileRoutes);

async function start() {
  await runMigrations();
  app.listen(config.port, () => {
    console.log(`PayFlow server running on port ${config.port}`);
  });
}

start().catch(console.error);
