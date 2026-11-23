// node src/audit_clip.js out.json [step=3 frames] : per frame, every visible character's position in warehouse-local metres vs the prop footprints (sets/wh_pm3_colliders.json) -> overlaps by shot
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs'); const http = require('http');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.ttf': 'font/ttf', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.glb': 'model/gltf-binary' };
(async () => {
  const srv = http.createServer((q, r) => { const f = path.join(__dirname, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); });
  await new Promise(r => srv.listen(0, '127.0.0.1', r)); const port = srv.address().port; const step = +(process.argv[3] || 3);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'], headless: true }); const p = await b.newPage({ viewport: { width: 270, height: 480 } });
  await p.goto(`http://127.0.0.1:${port}/index.html`); await p.waitForFunction(() => window.ready, null, { timeout: 240000 });
  await p.evaluate(([a, b]) => { window.__T0 = a; window.__T1 = b; }, [+(process.argv[4] || 0), +(process.argv[5] || 1e9)]);
  const res = await p.evaluate(async ([step]) => {
    const FP = (await (await fetch('sets/wh_pm3_colliders.json')).json()).footprints.filter(f => !(f[0] === 0 && f[1] === -9.6)).concat([[0, -1.9, 1.2, 1.2, 9], [1.7, -3.4, 1.1, 2.2, 1], [-2.6, -8.6, .8, .8, 1], [2.6, -8.6, .8, .8, 1]]), out = [], SL = window.SHOTLIST, end = SL[SL.length - 1][2];
    for (let f = Math.round((+window.__T0 || 0) * 30); f < Math.min(end, (+window.__T1 || end)) * 30; f += step) { const t = f / 30; window.frame(t, { nocap: true }); const sh = SL.find(s => t >= s[1] && t < s[2]) || SL[SL.length - 1];
      for (const [id, C] of Object.entries(window.__CHARS)) { let vis = true, r = C.g; while (r) { if (!r.visible) { vis = false; break; } r = r.parent; } if (!vis || !C.g.parent) continue;
        C.g.updateWorldMatrix(true, false); const e = C.g.matrixWorld.elements, x = e[12] + 600, z = e[14] - 600; if (Math.abs(x) > 14 || Math.abs(z) > 16) continue;     // not in the warehouse
        FP.forEach(([fx, fz, w, d, h], i) => { if (Math.abs(x - fx) < w / 2 + .22 && Math.abs(z - fz) < d / 2 + .22) out.push({ t: +t.toFixed(2), shot: sh[0], id, x: +x.toFixed(2), z: +z.toFixed(2), fp: i, box: [fx, fz, w, d, h] }); }); } }
    return out; }, [step]);
  fs.writeFileSync(process.argv[2], JSON.stringify(res)); console.log('overlap samples', res.length); await b.close(); srv.close(); })();
