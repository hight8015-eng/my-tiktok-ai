// node tools/audit.js <project_dir> <t1> <t2> ... : prints one JSON line per time (characters in frame / blocked / head size, camera)
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs'); const http = require('http');
(async () => { const root = path.resolve(process.argv[2], 'src'), ts = process.argv.slice(3).map(Number);
  const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.ttf': 'font/ttf' };
  const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] }); const p = await b.newPage({ viewport: { width: 540, height: 960 } });
  p.on('pageerror', e => console.error('PAGEERR', e.message)); await p.goto(`http://127.0.0.1:${srv.address().port}/index.html`); await p.waitForFunction(() => window.ready, null, { timeout: 180000 });
  for (const t of ts) console.log(JSON.stringify(await p.evaluate((t) => window.audit(t), t)));
  await b.close(); srv.close(); })();
