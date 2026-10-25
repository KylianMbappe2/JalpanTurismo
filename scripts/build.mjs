import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { publicConfig, securityHeaders } from './config.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const config = publicConfig();
await rm(`${root}dist`, { recursive: true, force: true });
await mkdir(`${root}dist`, { recursive: true });
await cp(`${root}public`, `${root}dist`, { recursive: true });

// Cada publicación cambia las URL de JS y CSS (?v=huella): ningún navegador reutiliza una copia anterior.
const assets = (await readdir(`${root}public`)).filter(name => /\.(js|css|html)$/.test(name)).sort();
const hash = createHash('sha256');
for (const name of assets) hash.update(name).update(await readFile(`${root}public/${name}`));
const version = hash.digest('hex').slice(0, 10);
const stamp = name => `${name}?v=${version}`;
for (const name of assets) {
  const path = `${root}dist/${name}`;
  let text = await readFile(path, 'utf8');
  if (name.endsWith('.js')) text = text.replace(/(from\s+['"])(\.\/[\w-]+\.js)(['"])/g, (_, a, file, b) => `${a}${stamp(file)}${b}`);
  if (name.endsWith('.html')) text = text.replace(/((?:href|src)=")(\/[\w-]+\.(?:js|css))(")/g, (_, a, file, b) => `${a}${stamp(file)}${b}`);
  await writeFile(path, text);
}
await writeFile(`${root}dist/config.json`, `${JSON.stringify({ ...config, version })}\n`);
await writeFile(`${root}dist/_headers`, `/*\n${Object.entries(securityHeaders(config)).map(([key, value]) => `  ${key}: ${value}`).join('\n')}\n  Strict-Transport-Security: max-age=31536000\n\n/config.json\n  Cache-Control: no-store\n\n/index.html\n  Cache-Control: no-cache\n`);
console.log(`Build ${version} listo en dist/. Envíos ${config.supabaseUrl ? 'configurados' : 'pendientes de configurar Supabase'}.`);
