import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, extname, sep } from 'node:path';
import { publicConfig, securityHeaders } from './config.mjs';

const publicDir = fileURLToPath(new URL('../public/', import.meta.url));
const config = publicConfig();
const port = Number(process.env.PORT ?? 4173);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json; charset=utf-8', '.pdf': 'application/pdf' };
const server = createServer(async (req, res) => {
  const headers = { ...securityHeaders(config), 'Cache-Control': 'no-store' };
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, headers); res.end(); return; }
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname === '/config.json') { res.writeHead(200, { ...headers, 'Content-Type': types['.json'] }); res.end(req.method === 'HEAD' ? '' : JSON.stringify(config)); return; }
    const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
    const path = resolve(publicDir, relative);
    if (!path.startsWith(publicDir.endsWith(sep) ? publicDir : publicDir + sep) || relative.split('/').some(part => part.startsWith('.')) || !types[extname(path)] || !(await stat(path)).isFile()) throw new Error('not found');
    const file = await readFile(path);
    res.writeHead(200, { ...headers, 'Content-Type': types[extname(path)] }); res.end(req.method === 'HEAD' ? '' : file);
  } catch { res.writeHead(404, { ...headers, 'Content-Type': 'text/plain; charset=utf-8' }); res.end('No encontrado'); }
});
server.listen(port, '127.0.0.1', () => console.log(`Aula Sierra: http://127.0.0.1:${port}`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
