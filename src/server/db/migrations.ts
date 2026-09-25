import { readFileSync } from 'fs';
import { join } from 'path';
import { neonPool } from './neon';

export async function runMigrations() {
  const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
  await neonPool.query(schema);
  console.log('Database migrations completed');
}
