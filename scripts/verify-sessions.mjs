// Verificación aislada: pnpm exec node scripts/verify-sessions.mjs (requiere el PostgreSQL local de QA).
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

const container = process.env.STACK_DB_CONTAINER ?? 'aula-pin-qa';
const database = `aula_sessions_${Date.now().toString(36)}`;
const run = args => execFileSync('docker', ['exec', container, ...args], { encoding: 'utf8' });
const sql = input => execFileSync('docker', ['exec', '-i', container, 'psql', '-U', 'postgres', '-d', database, '-v', 'ON_ERROR_STOP=1'], { input, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
run(['createdb', '-U', 'postgres', database]);
try {
  sql(await readFile(new URL('../supabase/setup.sql', import.meta.url), 'utf8'));
  const migration = (await readFile(new URL('../supabase/migrations/006_sesion_dos.sql', import.meta.url), 'utf8')).replace(/^(begin|commit);[ \t]*$/gmi, '');
  const checks = (await readFile(new URL('../tests/session-migration.sql', import.meta.url), 'utf8')).replaceAll('-- APPLY_SESSION_MIGRATION', migration);
  const result = sql(checks);
  await mkdir('.e2e', { recursive: true });
  await writeFile('.e2e/session-migration.txt', result);
  console.log(result);
  run(['dropdb', '-U', 'postgres', database]);
} catch (error) {
  console.error(error.stderr?.toString() || error.message);
  console.error(`Base aislada conservada para diagnóstico: ${database}`);
  process.exitCode = 1;
}
