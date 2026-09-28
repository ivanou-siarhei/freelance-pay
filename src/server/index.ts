import express from 'express';
import { config } from './config';
import { runMigrations } from './db/migrations';
import { authRoutes } from './routes/auth.routes';
import { payoutRoutes } from './routes/payout.routes';
import { profileRoutes } from './routes/profile.routes';
import { cors, errorHandler, rateLimit, securityHeaders } from './middleware/security';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(securityHeaders);
app.use(cors);
app.use(express.json({ limit: '10kb' }));

app.use('/api/auth', rateLimit({ windowMs: 60_000, max: 20 }), authRoutes);
app.use('/api/payouts', rateLimit({ windowMs: 60_000, max: 60 }), payoutRoutes);
app.use('/api/profiles', rateLimit({ windowMs: 60_000, max: 60 }), profileRoutes);
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
app.use(errorHandler);

async function start() {
  await runMigrations();
  app.listen(config.port, () => {
    console.log(`PayFlow server running on port ${config.port}`);
  });
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});
