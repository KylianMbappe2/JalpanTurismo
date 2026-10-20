import type { E2EConfig } from 'e2e';
import { web } from '@e2e-dev/web';

const app = { url: 'http://127.0.0.1:0', command: { executable: 'node', args: ['scripts/serve.mjs'], env: { PORT: '{port}', SUPABASE_URL: 'https://qa.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_public_test_key' }, log: '.e2e/logs/app.log' } };
export default {
  targets: [
    { name: 'desktop', engine: web({ viewport: { width: 1440, height: 1000 } }), app },
    { name: 'mobile', engine: web({ viewport: { width: 390, height: 844 } }), app },
  ],
  tests: 'tests/**/*.e2e.ts', workers: 1, retries: 0,
  timeout: 60000, actionTimeout: 10000, assertionTimeout: 5000,
  reporters: ['list', 'markdown'],
} satisfies E2EConfig;
