import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Node-only DB client (migrations, seeding, and the Electron desktop app).
// The static web app CANNOT use this — it has no server runtime; it uses Supabase JS.
const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error(
    'DATABASE_URL is not set — the direct Supabase Postgres connection string. See packages/db/.env.example',
  );
}

export const queryClient = postgres(url, { prepare: false });
export const db = drizzle(queryClient, { schema });
export { schema };
