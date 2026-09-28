import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { neonPool } from './neon';

// В ESM ("type": "module") нет __dirname, поэтому считаем путь сами
const here = dirname(fileURLToPath(import.meta.url));

export async function runMigrations() {
  const schema = readFileSync(join(here, 'schema.sql'), 'utf-8');
  await neonPool.query(schema);
  console.log('Database migrations completed');
}
