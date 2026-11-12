import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
const root = resolve('build');
const mime = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png', '.webp':'image/webp', '.jpg':'image/jpeg' };
http.createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    const path = resolve(root, '.' + decodeURIComponent(pathname === '/' ? '/index.html' : pathname));
    if (!path.startsWith(root + sep)) { response.writeHead(403).end(); return; }
    response.writeHead(200, { 'Content-Type': mime[extname(path)] || 'application/octet-stream', 'Cache-Control':'no-store' }).end(await readFile(path));
  } catch { response.writeHead(404).end('Not found'); }
}).listen(4174, '127.0.0.1', () => console.log('http://127.0.0.1:4174'));
