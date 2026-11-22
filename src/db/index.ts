import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

declare global {
  var _postgresPool: Pool | undefined;
}

export const createPool = () => {
  if (!global._postgresPool) {
    const databaseUrl = (process.env.DATABASE_URL || '').trim();

    if (databaseUrl) {
      const disableSsl =
        process.env.PGSSLMODE === 'disable' ||
        databaseUrl.includes('localhost') ||
        databaseUrl.includes('127.0.0.1');

      global._postgresPool = new Pool({
        connectionString: databaseUrl,
        ssl: disableSsl ? false : { rejectUnauthorized: false },
        max: 10,
        connectionTimeoutMillis: 15000,
        idleTimeoutMillis: 30000,
      });
    } else {
      global._postgresPool = new Pool({
        host: process.env.SQL_HOST,
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        database: process.env.SQL_DB_NAME,
        max: 10,
        connectionTimeoutMillis: 15000,
      });
    }

    global._postgresPool.on('error', (err) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }
  return global._postgresPool;
};

export const pool = createPool();
export const db = drizzle(pool, { schema });
