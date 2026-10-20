import type { E2EConfig } from 'e2e';
import { web } from '@e2e-dev/web';

// Pila local: PostgreSQL con supabase/setup.sql + PostgREST en STACK_REST_URL. Ver tests/stack.spec.ts.
const app = { url: 'http://127.0.0.1:0', command: { executable: 'node', args: ['scripts/serve.mjs'], env: { PORT: '{port}', SUPABASE_URL: 'https://qa.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_public_test_key' }, log: '.e2e/stack/app.log' } };
export default {
  targets: [
    { name: 'stack-mobile', engine: web({ viewport: { width: 390, height: 844 } }), app },
    { name: 'stack-desktop', engine: web({ viewport: { width: 1440, height: 1000 } }), app },
  ],
  tests: 'tests/stack.spec.ts', workers: 1, retries: 0,
  timeout: 90000, actionTimeout: 10000, assertionTimeout: 8000,
  output: '.e2e/stack', reporters: ['list', 'markdown'],
} satisfies E2EConfig;
