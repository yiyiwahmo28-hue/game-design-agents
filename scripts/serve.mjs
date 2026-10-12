import http from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
if (args.some(arg => !/^--port=\d+$/.test(arg)) || args.length > 1) {
  console.error('Usage: node scripts/serve.mjs [--port=4173]');
  process.exit(1);
}
const port = Number(args[0]?.split('=')[1] ?? 4173);
if (!Number.isInteger(port) || port < 1024 || port > 65535) {
  console.error('Port must be an integer from 1024 to 65535.');
  process.exit(1);
}
const types = { '.html': 'text/html; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.gif': 'image/gif', '.md': 'text/plain; charset=utf-8' };
const server = http.createServer(async (req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const parts = pathname.replaceAll('\\', '/').split('/');
    if (parts.some(part => part.startsWith('.')) || pathname.includes('\0')) {
      res.writeHead(403).end('Forbidden');
      return;
    }
    const candidate = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    const filename = await realpath(candidate);
    if (!filename.startsWith(root + path.sep) || !(await stat(filename)).isFile()) {
      res.writeHead(403).end('Forbidden');
      return;
    }
    const contentType = types[path.extname(filename)];
    if (!contentType) {
      res.writeHead(403).end('Unsupported file type');
      return;
    }
    const body = await readFile(filename);
    res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff', 'Content-Length': body.length });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch (error) {
    res.writeHead(error instanceof URIError ? 400 : 404).end('Not found');
  }
});
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => {
  console.log(`Game Design Agents: http://127.0.0.1:${port}`);
  console.log('Local static demo. No model, account, or API key required.');
});
