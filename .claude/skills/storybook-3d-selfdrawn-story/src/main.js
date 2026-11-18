// main.js: frame(t) -> JPEG data URL (1080x1920): shots + transitions + one-word captions
import * as E from './engine.js';
import * as Wd from './world.js';
import { makeCast, makeChar, pose, CHARS, loadSprites, updateSprites, SPRG, ANIM, OVL, applySmooth } from './chars.js';
import { SHOTS, initShots, runShot, COVER, BENCH } from './shots.js';
const timing = await (await fetch('timing.json')).json(), project = await (await fetch('project.json')).json();
await E.fontsReady; await loadSprites(); E.scene.add(SPRG); makeCast(project.cast); initShots(timing); Wd.redrawSign();
const out = document.getElementById('out'), X = out.getContext('2d');
const BL = document.createElement('canvas'); BL.width = 270; BL.height = 480; const BX = BL.getContext('2d');
function bloom(a = .24) { BX.filter = 'brightness(.9) contrast(3.4) saturate(1.3) blur(7px)'; BX.drawImage(out, 0, 0, 270, 480); BX.filter = 'none'; X.save(); X.globalCompositeOperation = 'screen'; X.globalAlpha = a; X.drawImage(BL, 0, 0, 1080, 1920); X.restore(); }
// v4 auto-cinematics (no effect on story/staging): shallow focus on the nearest character, shock speed lines + zoom punch
const _hv = new E.THREE.Vector3(), _cv = new E.THREE.Vector3();
function nearestHead() { let best = null; E.camera.getWorldPosition(_cv); const fw = new E.THREE.Vector3(0, 0, -1).transformDirection(E.camera.matrixWorld);
  for (const C of Object.values(CHARS)) { let r = C.g, vis = true; while (r) { if (!r.visible) { vis = false; break; } r = r.parent; } if (!vis || !C.g.parent) continue;
    C.head.getWorldPosition(_hv); const d = _hv.clone().sub(_cv), z = d.dot(fw); if (z < .3) continue; const sp = _hv.clone().project(E.camera); if (Math.abs(sp.x) > .85 || sp.y > .95 || sp.y < -.9) continue;
    if (!best || z < best.z) best = { C, z, sx: (sp.x + 1) * 540, sy: (1 - sp.y) * 960 }; } return best; }
let FX = null;
function draw(sh, t, alpha = 1, mb = 0, dir = 1) { OVL.length = 0; E.POST.gseed = Math.floor(t * 12) % 97; E.POST.dof = 0; E.POST.mblur = [mb * 90 * dir, mb * 14]; E.POST.leakPh = t * .6;
  // v4 motion smoothing: evaluate the shot 5..1 frames back (no render) and blend character poses -> no 1-frame snaps
  const SW = [.05, .08, .12, .17, .23], lt0 = t - sh.t0; Object.values(CHARS).forEach(C => { C._acc = null; });
  if (!window.NOSMOOTH) for (let k = 5; k >= 1; k--) { const tk = t - k / 30; if (tk - sh.t0 < 0) continue; ANIM.rec = SW[5 - k]; ANIM.t = tk; runShot(sh, tk); }
  ANIM.wFinal = .35; ANIM.rec = window.NOSMOOTH ? undefined : .35; ANIM.t = t; OVL.length = 0; runShot(sh, t); ANIM.rec = undefined;
  if (!window.NOSMOOTH) Object.values(CHARS).forEach(applySmooth); updateSprites(E.camera);
  const nh = nearestHead(); if (E.POST.dof === 0 && nh && nh.z < 9 && !window.NOAUTO) { E.POST.focus = nh.z * .97; E.POST.dof = .7 * (1 - E.sstep(3.5, 9, nh.z)); }
  const lt = t - sh.t0, shock = nh && nh.C.f2 && /shocked|scared|scream/.test(nh.C.f2[0]) && nh.C.view !== 'B' && nh.z < 7 && lt < .75 && !window.NOAUTO; FX = shock ? { lt, x: nh.sx, y: nh.sy } : (alpha === 1 ? null : FX); if (window.NOFACE) Object.values(CHARS).forEach(C => { C.face.visible = false; C.sweat.visible = false; for (const L of [C.aL, C.aR, C.lL, C.lR]) { L.up.visible = false; L.fo.visible = false; } }); Wd.updateSky(t); E.render(); X.globalAlpha = alpha;
  if (FX && FX.lt < .32) { const k = 1 + .07 * (1 - E.eOut(FX.lt / .32)); X.drawImage(E.glc, FX.x * (1 - k), FX.y * (1 - k), 1080 * k, 1920 * k); } else X.drawImage(E.glc, 0, 0);
  X.globalAlpha = 1; if (FX) speedLines(FX); overlays(t, alpha); }
function scr(v) { const p = v.clone().project(E.camera); return p.z > 1 ? null : [(p.x + 1) * 540, (1 - p.y) * 960]; }
function overlays(t, alpha) { // gloom lines + sparkles requested by poses/shots this frame
  for (const o of OVL) { X.save(); X.globalAlpha = alpha * Math.min(1, o.k);
    if (o.kind === 'gloom') { const C = o.C; C.head.updateWorldMatrix(true, false); const hp = C.head.getWorldPosition(new E.THREE.Vector3()), q = scr(hp); if (!q) { X.restore(); continue; }
      const top = scr(hp.clone().add(new E.THREE.Vector3(0, .5 * C.spec.s, 0))), R = top ? Math.max(40, Math.abs(q[1] - top[1])) : 120; X.strokeStyle = 'rgba(40,30,70,.75)'; X.lineCap = 'round';
      for (let i = 0; i < 9; i++) { const xx = q[0] + (i - 4) * R * .2, ph = ((t * .9 + i * .37) % 1), y0 = q[1] - R * 1.5 + ph * R * .5, L = R * (.5 + .3 * ((i * 7) % 3) / 2);
        X.lineWidth = Math.max(2, R * .035); X.globalAlpha = alpha * Math.min(1, o.k) * (1 - ph) * .9; X.beginPath(); X.moveTo(xx, y0); X.lineTo(xx, y0 + L); X.stroke(); } }
    else if (o.kind === 'spark') { const q = scr(o.p); if (!q) { X.restore(); continue; } const r = 46 * o.size * (.6 + .4 * o.k), ro = t * 1.5;
      X.translate(q[0], q[1]); X.rotate(ro * .2); X.globalCompositeOperation = 'lighter'; const g = X.createRadialGradient(0, 0, 0, 0, 0, r * 1.3); g.addColorStop(0, 'rgba(255,250,220,.9)'); g.addColorStop(1, 'rgba(255,220,140,0)'); X.fillStyle = g; X.beginPath(); X.arc(0, 0, r * 1.3, 0, 7); X.fill();
      X.fillStyle = '#fffbe8'; for (const [rr, rot] of [[r, 0], [r * .55, Math.PI / 4]]) { X.save(); X.rotate(rot); X.beginPath(); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, d = k % 2 ? rr * .16 : rr; X.lineTo(Math.cos(a) * d, Math.sin(a) * d); } X.closePath(); X.fill(); X.restore(); } }
    X.restore(); } }
function speedLines(f) { // manga focus lines toward the shocked face, fading out
  const a = (1 - E.sstep(.35, .75, f.lt)) * E.sstep(0, .06, f.lt); if (a <= 0) return; const r = E.rng(Math.floor(f.lt * 12) + 7);
  X.save(); X.globalAlpha = a * .85; X.fillStyle = '#ffffff'; X.strokeStyle = 'rgba(20,16,24,.55)'; X.lineWidth = 2;
  for (let i = 0; i < 46; i++) { const an = (i / 46) * Math.PI * 2 + r() * .12, w = .006 + r() * .012, R0 = 330 + r() * 160, R1 = 1700;
    X.beginPath(); X.moveTo(f.x + Math.cos(an) * R0, f.y + Math.sin(an) * R0); X.lineTo(f.x + Math.cos(an - w) * R1, f.y + Math.sin(an - w) * R1); X.lineTo(f.x + Math.cos(an + w) * R1, f.y + Math.sin(an + w) * R1); X.closePath(); X.fill(); X.stroke(); }
  X.restore(); }
function sweep(k) { // soft warm light sweep across the frame (k 0..1)
  X.save(); X.globalCompositeOperation = 'screen'; const x = -700 + k * 2500; const g = X.createLinearGradient(x - 500, 0, x + 500, 400);
  g.addColorStop(0, 'rgba(255,240,215,0)'); g.addColorStop(.5, `rgba(255,240,215,${.75 * Math.sin(Math.PI * k)})`); g.addColorStop(1, 'rgba(255,240,215,0)'); X.fillStyle = g; X.fillRect(0, 0, 1080, 1920); X.restore(); }
function caption(t) {
  const c = timing.caps.find(c => t >= c[0] && t < c[1]); if (!c) return;
  X.save(); X.font = '700 70px Prompt'; X.textAlign = 'center'; X.textBaseline = 'alphabetic'; X.lineJoin = 'round';
  const y = 1350; X.shadowColor = 'rgba(0,0,0,.45)'; X.shadowBlur = 10; X.shadowOffsetY = 5; X.lineWidth = 13; X.strokeStyle = '#141018'; X.strokeText(c[2], 540, y);
  X.shadowColor = 'transparent'; X.fillStyle = '#ffffff'; X.fillText(c[2], 540, y); X.restore();
}
const DIS = .28, WH = .22;
window.frame = (t, opts = {}) => {
  let i = SHOTS.length - 1; for (let k = 0; k < SHOTS.length; k++) if (t < SHOTS[k].t1) { i = k; break; }
  const sh = SHOTS[i], lt = t - sh.t0;
  const nx0 = SHOTS[i + 1], dir = i % 2 ? 1 : -1;
  const bIn = sh.tr === 'whip' && lt < WH ? 1 - lt / WH : 0, bOut = nx0 && nx0.tr === 'whip' && nx0.t0 - t < .12 ? 1 - (nx0.t0 - t) / .12 : 0;
  if (i > 0 && (sh.tr === 'dis' || sh.tr === 'sweep') && lt < DIS) { draw(SHOTS[i - 1], t); draw(sh, t, E.eSine(lt / DIS)); }
  else if (i > 0 && sh.tr === 'whip' && lt < .1) { draw(SHOTS[i - 1], t, 1, 1, -dir); draw(sh, t, lt / .1, bIn, dir); }
  else draw(sh, t, 1, Math.max(bIn, bOut), bOut > bIn ? -dir : dir);
  bloom();
  if (sh.tr === 'sweep' && lt < .45) sweep(lt / .45); const nx = SHOTS[i + 1]; if (nx && nx.tr === 'sweep' && nx.t0 - t < .2) sweep((t - (nx.t0 - .2)) / .45);
  if (t > timing.end - .25) { X.fillStyle = `rgba(0,0,0,${E.clamp((t - (timing.end - .25)) / .25)})`; X.fillRect(0, 0, 1080, 1920); }
  if (!opts.nocap) caption(t);
  return out.toDataURL('image/jpeg', .92);
};
window.cover = (o = {}) => { reset0(); COVER.fn(0, 57.5, o); updateSprites(E.camera); Wd.updateSky(57.5); E.render(); X.drawImage(E.glc, 0, 0); bloom(); return out.toDataURL('image/jpeg', .95); };
window.bench = (o = {}) => { reset0(); BENCH.fn(0, 20, o); updateSprites(E.camera); Wd.updateSky(20); E.render(); X.drawImage(E.glc, 0, 0); bloom(); return out.toDataURL('image/jpeg', .95); };
const reset0 = () => runShot({ t0: 0, fn: () => { } }, 57.5);

// refsheet (2D asset style refs): faceless, limbless head + costume on flat chroma green, one char per call
const RSPEC = {
  C01: { id: 'r1', shirt: '#24418a', stripe: '#f6f2e8', hat: 'beanie', hatC: '#e0453a', hatC2: '#b8322c', pomC: '#f6f2e8', s: .6, belt: '#6a4226' },
  C02: { id: 'r2', shirt: '#a0522d', hat: 'knit', hatC: '#4a4a58', hatC2: '#33333f', s: .64, belly: 1.14 },
  C03: { id: 'r3', shirt: '#26346e', hat: 'bicorne', coat: true, s: .68, belly: 1.2 },
  C04: { id: 'r4', shirt: '#e8b040', hat: 'bandana', hatC: '#d8483e', s: .6, belly: 1.12 },
  C05: { id: 'r5', shirt: '#6fa6dc', hat: 'straw', hatC: '#8a3a2a', s: .61, belly: .94 },
  C06: { id: 'r6', shirt: '#9a62aa', stripe: '#f3eaf6', hat: 'beanie', hatC: '#e8b84a', hatC2: '#c9952e', pomC: '#f6f2e8', s: .55 },
};
const RC = {}; let rsHidden = null;
window.refsheet = (o = {}) => {
  reset0();
  if (!rsHidden) { rsHidden = []; E.scene.children.forEach(c => { if (!c.isLight && c !== Wd.sky && c.visible) { c.visible = false; rsHidden.push(c); } }); }
  E.scene.children.forEach(c => { if (!c.isLight && c !== Wd.sky && !c.userData.rs) c.visible = false; });
  const G = o.bg || '#2db84a';
  Wd.applyLight('dusk', { top: G, mid: G, hor: G, glowAmt: 0, sunDir: [-.6, .7, 1], sunC: '#fff3e2', sunI: 2.3, hemiS: '#ffffff', hemiG: '#d9cfc2', hemiI: 2.4, fog: G, fogN: 900, fogF: 2500, stars: 0, moon: 0 });
  Object.values(RC).forEach(c => { c.g.visible = false; });
  const id = o.id || 'C01'; if (!RC[id]) { const c = makeChar(RSPEC[id]); c.g.userData.rs = true; E.scene.add(c.g); RC[id] = c; }
  const C = RC[id]; pose(C, { p: [0, 0, 0], ry: o.ry || 0, ex: 'neutral', head: [0, 0, 0] });
  C.g.userData.rs = true; C.g.visible = true; C.face.visible = false; C.sweat.visible = false;
  for (const L of [C.aL, C.aR, C.lL, C.lR]) { L.up.visible = false; L.fo.visible = false; }
  C.head.position.y = .88 + (o.gap ?? .17);
  const s = C.spec.s, cy = 1.9 * s; E.scene.updateMatrixWorld();
  Wd.setShadowFocus(0, cy, 0, 3);
  E.camera.position.set(0, cy + .05, 9); E.camera.fov = o.fov || 12.5; E.camera.updateProjectionMatrix(); E.camera.up.set(0, 1, 0); E.camera.lookAt(0, cy, 0);
  Object.assign(E.POST, { dof: 0, mblur: [0, 0], vig: 0, leak: 0, sat: 1.12, lift: 1.03, con: 1.04, focus: 9 });
  Wd.updateSky(0); E.render(); X.drawImage(E.glc, 0, 0); return out.toDataURL('image/png');
};
const LEGY = .95;
window.SHOTLIST = SHOTS.map(s => [s.id, s.t0, s.t1]);
window.ready = true;
