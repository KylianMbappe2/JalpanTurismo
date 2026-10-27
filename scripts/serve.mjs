import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, extname, sep } from 'node:path';
import { publicConfig, securityHeaders } from './config.mjs';
import { preparePreviewAssets } from './preview-assets.mjs';

// SERVE_DIR=dist sirve el sitio compilado (con versiones en las URL) tal como se publica.
const publicDir = fileURLToPath(new URL(`../${process.env.SERVE_DIR === 'dist' ? 'dist' : 'public'}/`, import.meta.url));
const config = publicConfig();
if (process.env.SERVE_DIR !== 'dist') await preparePreviewAssets();
const port = Number(process.env.PORT ?? 4173);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json; charset=utf-8', '.pdf': 'application/pdf', '.webp': 'image/webp', '.mp4': 'video/mp4' };
const server = createServer(async (req, res) => {
  const headers = { ...securityHeaders(config), 'Cache-Control': 'no-store' };
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, headers); res.end(); return; }
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname === '/config.json' && process.env.SERVE_DIR !== 'dist') { res.writeHead(200, { ...headers, 'Content-Type': types['.json'] }); res.end(req.method === 'HEAD' ? '' : JSON.stringify(config)); return; }
    const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
    const path = resolve(publicDir, relative);
    if (!path.startsWith(publicDir.endsWith(sep) ? publicDir : publicDir + sep) || relative.split('/').some(part => part.startsWith('.')) || !types[extname(path)] || !(await stat(path)).isFile()) throw new Error('not found');
    if (extname(path) === '.mp4') {
      const { size } = await stat(path);
      let start = 0, end = size - 1;
      const range = req.headers.range;
      if (range) {
        const match = /^bytes=(\d*)-(\d*)$/.exec(range);
        if (!match || (!match[1] && !match[2])) { res.writeHead(416, { ...headers, 'Content-Range': `bytes */${size}` }); res.end(); return; }
        start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
        end = match[1] && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
        if (!Number.isSafeInteger(start) || start >= size || end < start) { res.writeHead(416, { ...headers, 'Content-Range': `bytes */${size}` }); res.end(); return; }
      }
      res.writeHead(range ? 206 : 200, { ...headers, 'Content-Type': 'video/mp4', 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1, ...(range ? { 'Content-Range': `bytes ${start}-${end}/${size}` } : {}) });
      if (req.method === 'HEAD') res.end();
      else { const stream = createReadStream(path, { start, end }); stream.on('error', () => res.destroy()); res.on('close', () => stream.destroy()); stream.pipe(res); }
      return;
    }
    const file = await readFile(path);
    res.writeHead(200, { ...headers, 'Content-Type': types[extname(path)] }); res.end(req.method === 'HEAD' ? '' : file);
  } catch { res.writeHead(404, { ...headers, 'Content-Type': 'text/plain; charset=utf-8' }); res.end('No encontrado'); }
});
server.listen(port, '127.0.0.1', () => console.log(`Aula Sierra: http://127.0.0.1:${port}`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
