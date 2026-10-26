import { execFileSync } from 'node:child_process';
import { readFile, mkdir, writeFile } from 'node:fs/promises';

const container = process.env.STACK_DB_CONTAINER ?? 'aula-perfiles-qa';
const database = `aula_profiles_${Date.now().toString(36)}`;
const run = args => execFileSync('docker', ['exec', container, ...args], { encoding: 'utf8' });
const sql = (input, target = database) => execFileSync('docker', ['exec', '-i', container, 'psql', '-U', 'postgres', '-d', target, '-v', 'ON_ERROR_STOP=1'], { input, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
sql("do $$ begin if not exists(select 1 from pg_roles where rolname='anon') then create role anon nologin; end if; if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if; end $$;", 'postgres');
run(['createdb', '-U', 'postgres', database]);
try {
  sql(await readFile(new URL('../supabase/setup.sql', import.meta.url), 'utf8'));
  const migration = (await readFile(new URL('../supabase/migrations/007_perfiles_turisticos.sql', import.meta.url), 'utf8')).replace(/^(begin|commit);[ \t]*$/gmi, '');
  const checks = (await readFile(new URL('../tests/profiles-migration.sql', import.meta.url), 'utf8')).replaceAll('-- APPLY_PROFILES_MIGRATION', migration);
  const result = sql(checks);
  await mkdir('.e2e', { recursive: true });
  await writeFile('.e2e/profiles-migration.txt', result);
  console.log(result);
  run(['dropdb', '-U', 'postgres', database]);
} catch (error) {
  console.error(error.stderr?.toString() || error.message);
  console.error(`Base aislada conservada para diagnóstico: ${database}`);
  process.exitCode = 1;
}
