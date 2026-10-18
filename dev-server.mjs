// Local dev server: serves /public and the same API as the Netlify function,
// but stores data in ./.dev-data as plain files. Run:  node dev-server.mjs
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';
import { createApp } from './netlify/lib/core.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const pub = path.join(root, 'public');
const data = path.join(root, '.dev-data');
const safe = (s) => encodeURIComponent(s).replace(/%/g, '_');
const dir = (store) => { const d = path.join(data, store); fs.mkdirSync(d, { recursive: true }); return d; };

const db = {
  async getJSON(s, k) { try { return JSON.parse(fs.readFileSync(path.join(dir(s), safe(k) + '.json'), 'utf8')); } catch { return null; } },
  async setJSON(s, k, v) { fs.writeFileSync(path.join(dir(s), safe(k) + '.json'), JSON.stringify(v)); },
  async del(s, k) { for (const ext of ['.json', '.bin']) try { fs.unlinkSync(path.join(dir(s), safe(k) + ext)); } catch {} },
  async keys(s, prefix = '') {
    return fs.readdirSync(dir(s)).filter((f) => f.endsWith('.json') || f.endsWith('.bin'))
      .map((f) => decodeURIComponent(f.replace(/\.(json|bin)$/, '').replace(/_/g, '%'))).filter((k) => k.startsWith(prefix));
  },
  async getBin(s, k) { try { return new Uint8Array(fs.readFileSync(path.join(dir(s), safe(k) + '.bin'))); } catch { return null; } },
  async setBin(s, k, b) { fs.writeFileSync(path.join(dir(s), safe(k) + '.bin'), b); },
  async streamBin(s, k) {
    const f = path.join(dir(s), safe(k) + '.bin');
    return fs.existsSync(f) ? Readable.toWeb(fs.createReadStream(f)) : null;
  },
};

const app = createApp(db, (n) => process.env[n]);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json' };

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname.startsWith('/api/')) {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const body = Buffer.concat(chunks);
    const r = await app(new Request(url, { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : body }));
    res.writeHead(r.status, Object.fromEntries(r.headers));
    if (r.body) Readable.fromWeb(r.body).pipe(res); else res.end();
    return;
  }
  let file = path.join(pub, decodeURIComponent(url.pathname));
  if (!file.startsWith(pub)) { res.writeHead(403); return res.end(); }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(pub, 'index.html');
  res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
  fs.createReadStream(file).pipe(res);
}).listen(process.env.PORT || 8888, () => console.log('ClivEdu dev server on http://localhost:' + (process.env.PORT || 8888)));
