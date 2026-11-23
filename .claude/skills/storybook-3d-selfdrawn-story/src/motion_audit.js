// node src/motion_audit.js out.json [step=3] : for every visible character, per shot: how much the head / hands / root actually move (m/s), % of time frozen (nothing moves), max hand speed
{ const fs0 = require('fs'), p0 = require('path'); let d = __dirname;   // v8.2: the Chromium kept in a parent render/ms-playwright (E:)
  while (!process.env.PLAYWRIGHT_BROWSERS_PATH && d !== p0.dirname(d)) { if (fs0.existsSync(p0.join(d, 'ms-playwright'))) process.env.PLAYWRIGHT_BROWSERS_PATH = p0.join(d, 'ms-playwright'); d = p0.dirname(d); } }
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs'); const http = require('http');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.ttf': 'font/ttf', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.glb': 'model/gltf-binary' };
(async () => {
  const srv = http.createServer((q, r) => { const f = path.join(__dirname, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); });
  await new Promise(r => srv.listen(0, '127.0.0.1', r)); const port = srv.address().port; const step = +(process.argv[3] || 3);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'], headless: true }); const p = await b.newPage({ viewport: { width: 270, height: 480 } });
  await p.goto(`http://127.0.0.1:${port}/index.html`); await p.waitForFunction(() => window.ready, null, { timeout: 240000 });
  const res = await p.evaluate(([step]) => {
    const SL = window.SHOTLIST, end = SL[SL.length - 1][2], S = [], P = {};
    const W = (o) => { o.updateWorldMatrix(true, false); const e = o.matrixWorld.elements; return [e[12], e[13], e[14]]; };
    for (let f = 0; f < end * 30; f += step) { const t = f / 30; window.frame(t, { nocap: true }); const sh = SL.find(s => t >= s[1] && t < s[2]) || SL[SL.length - 1];
      for (const [id, C] of Object.entries(window.__CHARS)) { let vis = true, r = C.g; while (r) { if (!r.visible) { vis = false; break; } r = r.parent; } if (!vis || !C.g.parent) continue;
        S.push({ t, shot: sh[0], id, root: W(C.g), head: W(C.head), hl: W(C.aL.hand), hr: W(C.aR.hand) }); } }
    return S; }, [step]);
  fs.writeFileSync(process.argv[2], JSON.stringify(res)); console.log('samples', res.length); await b.close(); srv.close(); })();
