import { Pool } from 'pg';
import { config } from '../config';

export const neonPool = new Pool({
  connectionString: config.neon.connectionString,
  // Neon требует TLS; rejectUnauthorized оставляем включённым
  ssl: config.neon.connectionString.includes('localhost') ? undefined : { rejectUnauthorized: true },
  max: 10,
});

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const result = await neonPool.query(text, params);
  return result.rows as T[];
}
