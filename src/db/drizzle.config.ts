import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config();

const directOrPoolUrl = (process.env.DIRECT_URL || process.env.DATABASE_URL || '').trim();

function resolveDbCredentials() {
  if (directOrPoolUrl) {
    const disableSsl =
      process.env.PGSSLMODE === 'disable' ||
      directOrPoolUrl.includes('localhost') ||
      directOrPoolUrl.includes('127.0.0.1');
    return {
      url: directOrPoolUrl,
      ssl: disableSsl ? false : ({ rejectUnauthorized: false } as const),
    };
  }

  const sqlHost = process.env.SQL_HOST;
  const sqlDbName = process.env.SQL_DB_NAME;
  const user = process.env.SQL_ADMIN_USER || process.env.SQL_USER;
  const password = process.env.SQL_ADMIN_PASSWORD || process.env.SQL_PASSWORD;

  if (!sqlHost) throw new Error('DATABASE_URL or SQL_HOST must be set in environment variables.');
  if (!sqlDbName) throw new Error('DATABASE_URL or SQL_DB_NAME must be set in environment variables.');
  if (!user) throw new Error('DATABASE_URL or SQL_ADMIN_USER must be set in environment variables.');
  if (!password) throw new Error('DATABASE_URL or SQL_ADMIN_PASSWORD must be set in environment variables.');

  return {
    host: sqlHost,
    user,
    password,
    database: sqlDbName,
    ssl: false as const,
  };
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  schemaFilter: ['public'],
  dbCredentials: resolveDbCredentials(),
  verbose: true,
});
