import { cp, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { publicConfig, securityHeaders } from './config.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const config = publicConfig();
await mkdir(`${root}dist`, { recursive: true });
await cp(`${root}public`, `${root}dist`, { recursive: true });
await writeFile(`${root}dist/config.json`, `${JSON.stringify(config)}\n`);
await writeFile(`${root}dist/_headers`, `/*\n${Object.entries(securityHeaders(config)).map(([key, value]) => `  ${key}: ${value}`).join('\n')}\n  Strict-Transport-Security: max-age=31536000\n\n/config.json\n  Cache-Control: no-store\n`);
console.log(`Build listo en dist/. Envíos ${config.supabaseUrl ? 'configurados' : 'pendientes de configurar Supabase'}.`);
