import type { E2EConfig } from 'e2e';
import { web } from '@e2e-dev/web';

// Opt-in explícito: crea un usuario de prueba y una entrega marcada en el Supabase real.
export default {
  targets: [{
    name: 'supabase-real',
    engine: web({ viewport: { width: 390, height: 844 } }),
    app: {
      url: 'http://127.0.0.1:0',
      command: { executable: 'node', args: ['scripts/serve.mjs'], env: { PORT: '{port}' }, log: '.e2e/live/app.log' },
    },
  }],
  tests: 'tests/live-supabase.spec.ts',
  workers: 1, retries: 0, timeout: 60000, actionTimeout: 15000,
  assertionTimeout: 25000, output: '.e2e/live', reporters: ['list', 'markdown'],
} satisfies E2EConfig;
