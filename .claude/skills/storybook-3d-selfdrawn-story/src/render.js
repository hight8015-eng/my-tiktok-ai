// node render.js stills <out_dir> <t1> <t2> ... | node render.js video <out.mp4> <startFrame> <endFrame> | node render.js steps <out.json> [t0 t1]  (walkAlong heel strikes, no rendering) | node render.js camdump <out.json> [t0 t1]  (camera + cast per frame, no rendering)
{ const fs0 = require('fs'), p0 = require('path'); let d = __dirname;   // v7.10: use the Chromium kept in a parent render/ms-playwright (E:) when no PLAYWRIGHT_BROWSERS_PATH is set
  while (!process.env.PLAYWRIGHT_BROWSERS_PATH && d !== p0.dirname(d)) { if (fs0.existsSync(p0.join(d, 'ms-playwright'))) process.env.PLAYWRIGHT_BROWSERS_PATH = p0.join(d, 'ms-playwright'); d = p0.dirname(d); } }
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'); const fs = require('fs'); const http = require('http');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.ttf': 'font/ttf', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg' };
(async () => {
  const srv = http.createServer((q, r) => { const f = path.join(__dirname, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); });
  await new Promise(r => srv.listen(0, '127.0.0.1', r)); const port = srv.address().port;
  const [mode, out, ...rest] = process.argv.slice(2);
  const args = process.env.GPU ? ['--use-gl=angle', '--use-angle=' + (process.platform === 'win32' ? 'd3d11' : process.platform === 'darwin' ? 'metal' : 'vulkan'), '--ignore-gpu-blocklist', '--enable-gpu-rasterization'] : ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']; // v7.6 GPU=1 on a PC with a graphics card (much faster); default = CPU SwiftShader (cloud)
  const b = await chromium.launch({ args, headless: true });
  const p = await b.newPage({ viewport: { width: 540, height: 960 } });
  p.on('pageerror', e => console.error('PAGEERR', e.message)); p.on('console', m => { const s = m.text(); if (/GPU stall|GL Driver/.test(s)) return; console.log('[pg]', s.slice(0, 400)); });
  await p.goto(`http://127.0.0.1:${port}/index.html`); await Promise.race([p.waitForFunction(() => window.ready, null, { timeout: 180000 }), new Promise((_, rej) => p.on('pageerror', e => rej(e)))]);
  const nocap = !!process.env.NOCAP; if (process.env.NOFACE) await p.evaluate(() => { window.NOFACE = true; }); if (process.env.NOSMOOTH) await p.evaluate(() => { window.NOSMOOTH = true; }); if (process.env.SHUTTER) await p.evaluate(([n, a]) => { window.SHUTTER = n; if (a) window.SHUTTER_ANGLE = a; }, [+process.env.SHUTTER, +(process.env.SHUTTER_ANGLE || 0)]);
  if (mode === 'stills') { fs.mkdirSync(out, { recursive: true });
    for (const t of rest) { const t0 = Date.now(); const d = await p.evaluate(([t, n]) => frame(+t, { nocap: n }), [t, nocap]); fs.writeFileSync(`${out}/t${(+t).toFixed(2)}.jpg`, Buffer.from(d.split(',')[1], 'base64')); console.log('t', t, Date.now() - t0, 'ms'); }
  } else if (mode === 'cover' || mode === 'bench') { const J = JSON.parse(rest[0] || '{}'), L = Array.isArray(J) ? J : [J];
    for (let i = 0; i < L.length; i++) { const d = await p.evaluate(([m, o]) => window[m](o), [mode, L[i]]); const f = L.length > 1 ? out.replace(/(\.\w+)$/, `_${i}$1`) : out; fs.writeFileSync(f, Buffer.from(d.split(',')[1], 'base64')); console.log('cover', f); }
  } else if (mode === 'refsheet') { fs.mkdirSync(out, { recursive: true });
    for (const id of ['C01', 'C02', 'C03', 'C04', 'C05', 'C06']) for (const [v, ry] of [['F', 0], ['Q', -45], ['S', -90], ['B', 180]]) {
      const d = await p.evaluate((o) => window.refsheet(o), { id, ry }); fs.writeFileSync(`${out}/${id}-${v}.png`, Buffer.from(d.split(',')[1], 'base64')); console.log(id, v); }
  } else if (mode === 'steps') { fs.writeFileSync(out, JSON.stringify(await p.evaluate(([a, b]) => window.steps(a == null ? 0 : +a, b == null ? undefined : +b), rest), null, 0)); console.log('steps ->', out);
  } else if (mode === 'charpose') { fs.mkdirSync(out, { recursive: true }); const L = JSON.parse(fs.readFileSync(rest[0], 'utf-8'));   // v8.1: [{ file, id, ry, ex, pose, frame, bg, light }]
    for (const o of L) { const d = await p.evaluate((o) => window.charpose(o), o); fs.writeFileSync(path.join(out, o.file), Buffer.from(d.split(',')[1], 'base64')); }
    console.log('charpose', L.length, '->', out);
  } else if (mode === 'camdump') { fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true }); fs.writeFileSync(out, JSON.stringify(await p.evaluate(([a, b]) => window.camdump(a == null ? 0 : +a, b == null ? undefined : +b), rest))); console.log('camdump ->', out);   // v8.0: camera + cast per frame, no rendering
  } else if (mode === 'movetest') { const r = await p.evaluate(() => window.movetest()); fs.writeFileSync(out, JSON.stringify(r, null, 1)); console.log(JSON.stringify(r));   // v8.2
  } else if (mode === 'list') { console.log(JSON.stringify(await p.evaluate(() => window.SHOTLIST))); }
  else {
    const [a, z] = rest.map(Number);
    const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    let T = Date.now();
    for (let f = a; f < z; f++) { const d = await p.evaluate(([t, n]) => frame(t, { nocap: n }), [f / 30, nocap]); if (!ff.stdin.write(Buffer.from(d.split(',')[1], 'base64'))) await new Promise(r => ff.stdin.once('drain', r)); if ((f - a) % 30 === 29) console.log(out, f, ((Date.now() - T) / (f - a + 1) | 0) + 'ms/f'); }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
  }
  await b.close(); srv.close();
})();
