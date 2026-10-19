import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

// Applies rls-policies.sql to the database. Run AFTER db:migrate and after the
// roles/users rows exist (otherwise RLS locks everyone out). Idempotent-ish:
// re-running errors on existing policies, so drop them first if re-applying.
const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set. See packages/db/.env.example');

const sqlPath = fileURLToPath(new URL('./rls-policies.sql', import.meta.url));
const ddl = readFileSync(sqlPath, 'utf8');

async function main() {
  const sql = postgres(url!);
  try {
    await sql.unsafe(ddl);
    console.log('RLS policies applied.');
  } finally {
    await sql.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
