// main.js: frame(t) -> JPEG data URL (1080x1920): shots + transitions + one-word captions
import * as E from './engine.js';
import * as Wd from './world.js';
import { makeCast, makeChar, pose, CHARS, loadSprites, updateSprites, SPRG } from './chars.js';
import { SHOTS, initShots, runShot, COVER, BENCH } from './shots.js';
const timing = await (await fetch('timing.json')).json(), project = await (await fetch('project.json')).json();
await E.fontsReady; await loadSprites(); E.scene.add(SPRG); makeCast(project.cast); initShots(timing); Wd.redrawSign();
const out = document.getElementById('out'), X = out.getContext('2d');
const BL = document.createElement('canvas'); BL.width = 270; BL.height = 480; const BX = BL.getContext('2d');
function bloom(a = .24) { BX.filter = 'brightness(.9) contrast(3.4) saturate(1.3) blur(7px)'; BX.drawImage(out, 0, 0, 270, 480); BX.filter = 'none'; X.save(); X.globalCompositeOperation = 'screen'; X.globalAlpha = a; X.drawImage(BL, 0, 0, 1080, 1920); X.restore(); }
function draw(sh, t, alpha = 1, mb = 0, dir = 1) { E.POST.dof = 0; E.POST.mblur = [mb * 90 * dir, mb * 14]; E.POST.leakPh = t * .6; runShot(sh, t); updateSprites(E.camera); if (window.NOFACE) Object.values(CHARS).forEach(C => { C.face.visible = false; C.sweat.visible = false; for (const L of [C.aL, C.aR, C.lL, C.lR]) { L.up.visible = false; L.fo.visible = false; } }); Wd.updateSky(t); E.render(); X.globalAlpha = alpha; X.drawImage(E.glc, 0, 0); X.globalAlpha = 1; }
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
window.SHOTLIST = SHOTS.map(s => [s.id, s.t0, s.t1]); window.DBG = (t) => { frame(t); const o = {}; for (const k in CHARS) if (CHARS[k].g.visible) { const v = new E.THREE.Vector3(); CHARS[k].g.getWorldPosition(v); o[k] = [v.x, v.y, v.z].map(a => a.toFixed(2)).join(','); } return JSON.stringify({ cam: E.camera.position.toArray().map(a => a.toFixed(2)), o }); };
window.ready = true;
