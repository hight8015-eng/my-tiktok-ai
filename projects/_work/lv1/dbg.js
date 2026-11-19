const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs'); const http = require('http');
(async () => { const root = process.argv[2];
  const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': f.endsWith('.js') ? 'text/javascript' : f.endsWith('.html') ? 'text/html' : 'application/octet-stream' }); r.end(d); }); });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const p = await b.newPage({ viewport: { width: 540, height: 960 } });
  p.on('console', m => console.log('[pg]', m.text().slice(0, 300))); p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto(`http://127.0.0.1:${srv.address().port}/index.html`); await p.waitForFunction(() => window.ready, null, { timeout: 180000 });
  console.log(await p.evaluate(() => { const r = []; for (const t of [1.0, 46.5, 20.0]) { frame(t); for (const C of Object.values(window.__M.CHARS)) { if (!C.sb || !C.sb.visible) continue; const h = C.hc.getWorldPosition(new window.__E.THREE.Vector3()); r.push([t, C.spec.id, +(C.sh.position.y - h.y).toFixed(3), +(C.g.scale.x).toFixed(2)]); } } return JSON.stringify(r); }));
  await b.close(); srv.close(); })();
