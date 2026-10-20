import { isConfigured } from '../public/submission.js';

try { process.loadEnvFile('.env.local'); } catch (error) { if (error.code !== 'ENOENT') throw error; }

export function publicConfig() {
  const supabaseUrl = (process.env.SUPABASE_URL ?? '').trim();
  const supabaseKey = (process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? '').trim();
  if (!supabaseUrl && !supabaseKey) return { supabaseUrl: '', supabaseKey: '' };
  if (!isConfigured({ supabaseUrl, supabaseKey })) throw new Error('Configura una URL HTTPS de Supabase y una clave publishable o anon válida. Las claves secret/service_role no están permitidas.');
  return { supabaseUrl, supabaseKey };
}

export function securityHeaders(config) {
  const origin = config.supabaseUrl ? new URL(config.supabaseUrl).origin : 'https://*.supabase.co';
  return {
    'Content-Security-Policy': `default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' ${origin}; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'`,
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Frame-Options': 'DENY',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  };
}
