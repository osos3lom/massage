import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

// `generate` works offline from ./src/schema.ts. `migrate`/`push`/`studio` need
// DATABASE_URL (the direct Supabase Postgres connection string — see .env.example).
export default defineConfig({
  schema: './src/schema.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL ?? '' },
  casing: 'snake_case',
});
