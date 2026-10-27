import type { E2EConfig } from 'e2e';
import { web } from '@e2e-dev/web';

// Sitio compilado (pnpm build) servido como en producción: URL versionadas y aviso de versión nueva.
const app = { url: 'http://127.0.0.1:0', command: { executable: 'node', args: ['scripts/serve.mjs'], env: { PORT: '{port}', SERVE_DIR: 'dist', SUPABASE_URL: 'https://qa.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_public_test_key' }, log: '.e2e/dist/app.log' } };
export default {
  targets: [
    { name: 'dist-desktop', engine: web({ viewport: { width: 1440, height: 1000 } }), app },
    { name: 'dist-mobile', engine: web({ viewport: { width: 390, height: 844 } }), app },
  ],
  tests: ['tests/dist.spec.ts', 'tests/presentations.e2e.ts', 'tests/materials-performance.e2e.ts', 'tests/profiles.e2e.ts', 'tests/curriculum.e2e.ts', 'tests/archived-activities.e2e.ts', 'tests/teacher-panel.e2e.ts', 'tests/checklist.e2e.ts'], workers: 1, retries: 0, timeout: 60000, actionTimeout: 10000, assertionTimeout: 8000,
  output: '.e2e/dist', reporters: ['list', 'markdown'],
} satisfies E2EConfig;
