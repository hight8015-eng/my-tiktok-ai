// shots.js: "สะพานสองหมู่บ้าน" (58.68 s timeline incl. the 0.9 s beat at 41.47)
import { THREE, scene, camera, clamp, lerp, sstep, eIO, eOut, eIn, eSine, D2R, noise1, rng, POST, mesh, rbox, toon, group } from './engine.js';
import * as Wd from './world.js';
import { CHARS, pose, toTorso, blinkAt } from './chars.js';
const { VL, VA, DY, desk, DK, boat, BT } = Wd;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const TM = { env: [] };
const talkAt = (t) => { const e = TM.env[Math.round(t * 30)] || 0; return e > .55 ? 1 : e > .25 ? .5 : 0; };
let SH = { a: 0, t: 0 };
function look(pos, tgt, fov = 40, roll = 0) { POST.focus = pos.distanceTo(tgt); camera.position.copy(pos); camera.fov = fov; camera.updateProjectionMatrix(); camera.up.set(0, 1, 0); if (Math.abs(pos.x - tgt.x) + Math.abs(pos.z - tgt.z) < .05) camera.up.set(0, 0, -1); camera.lookAt(tgt); if (roll) camera.rotateZ(roll * D2R);
  if (SH.a > 0) { const t = SH.t * 22; camera.rotateX(noise1(t) * .02 * SH.a); camera.rotateY(noise1(t + 50) * .02 * SH.a); camera.position.y += noise1(t + 9) * .08 * SH.a; } }
const lp = (a, b, u) => a.map((v, i) => lerp(v, b[i], u));
const TY = (p, g) => p[1] < 4 ? [g[0], g[1] - .16, g[2]] : g; // v2: short figures, keep heads above the caption band
function camW(p0, t0, p1, t1, u, fov = 40, roll = 0) { look(V(...lp(p0, p1, u)), V(...lp(TY(p0, t0), TY(p1, t1), u)), fov, roll); }
const camO = (o) => (p0, t0, p1, t1, u, fov = 40, roll = 0) => look(V(...lp(p0, p1, u)).add(o.position), V(...lp(t0, t1, u)).add(o.position), fov, roll);
const camD = camO(desk);
function put(C, parent, P) { if (C.g.parent !== parent) parent.add(C.g); pose(C, P); }
const orb = (c, r, a, h) => [c[0] + Math.sin(a * D2R) * r, c[1] + h, c[2] + Math.cos(a * D2R) * r];
function dof(k) { POST.dof = k; }
const U = (lt, d, e = eIO) => e(clamp(lt / d));
function moonAt(dx, dy) { const d = V(); camera.getWorldDirection(d); const r = V().crossVectors(d, V(0, 1, 0)).normalize(); Wd.skyState.moonDir.copy(d).addScaledVector(r, dx).add(V(0, dy, 0)).normalize(); }
const HIDE = V(0, -50, 0);
function reset(t) {
  SH.a = 0; SH.t = t; if (benchFloor) benchFloor.visible = false;
  Object.values(CHARS).forEach(C => { C.g.visible = false; });
  VL.visible = true; desk.visible = false; boat.visible = false; Wd.sea.visible = true; Wd.WAVE.amp = .22; Wd.gullsAt(t, [0, 19, 0], 0);
  Wd.bridgeAt(0, 0); Wd.valleyNight(0); Wd.flagsAt(t); Wd.crowd([]); VA.toll.visible = false; VA.spark.material.opacity = 0; Wd.drawSign('ปีที่ไม่มีสะพาน', 50); Wd.lanternOn(VA.lamp, 0);
  for (const o of [VA.bagR, VA.bagB, VA.ham[0], VA.ham[1], VA.lamp, VA.coin, VA.plank[0], VA.plank[1]]) { o.position.copy(HIDE); o.rotation.set(0, 0, 0); } VA.coin.rotation.x = Math.PI / 2;
}
// light helpers
const _ca = new THREE.Color(), _cb = new THREE.Color();
function mixP(a, b, k) { const A = Wd.PRESETS[a], B = Wd.PRESETS[b], o = {}; for (const key in A) { const x = A[key], y = B[key]; if (typeof x === 'number') o[key] = lerp(x, y, k); else if (Array.isArray(x)) o[key] = x.map((v, i) => lerp(v, y[i], k)); else o[key] = '#' + _ca.set(x).lerp(_cb.set(y), k).getHexString(); } return o; }
function day(o = {}, f = [0, 1.3, 0, 14]) { Wd.applyLight('day', o); Wd.setShadowFocus(...f); }
function night(o = {}, f = [0, 1.3, 0, 14]) { Wd.applyLight('night', { hemiI: 2.0, sunI: 1.7, ...o }); Wd.valleyNight(1); Wd.setShadowFocus(...f); }
function lampAt(C, k = 1, h = [.36, .3, .34]) { scene.updateMatrixWorld(); const w = C.torso.localToWorld(V(h[0], h[1] - .42, h[2])); VA.lamp.position.copy(w); Wd.lanternOn(VA.lamp, k); Wd.pts[0].position.copy(w).add(V(0, .9, 1.3)); Wd.pts[0].intensity = 1.0 * k * (1 + .06 * Math.sin(SH.t * 17)); Wd.pts[0].color.set('#ffb35a'); }
function propAt(o, C, h, rot) { scene.updateMatrixWorld(); o.position.copy(C.torso.localToWorld(V(...h))); if (rot) o.rotation.set(...rot); }
// crowds
const R = rng(31), BANK = [], DECK = [];
for (let i = 0; i < 70; i++) { const s = i % 2 ? 1 : -1; BANK.push([s * (6.5 + R() * 4.2), 1, (R() < .5 ? -1 : 1) * (1.5 + R() * 5.5), s, R() * 6, .1]); }
for (let i = 0; i < 44; i++) { const s = i % 2 ? 1 : -1; DECK.push([s * (.5 + R() * 5.2), DY, -.8 + R() * 1.6, s, R() * 6, .1]); }
const deckCrowd = (k, n = 44) => DECK.slice(0, n).filter(c => 6 - Math.abs(c[0]) <= k * 6 - .5);
// ---------- common character poses ----------
const hip = { hL: [-.3, .36, .12], hR: [.3, .36, .12], pL: [-1, 0, -.5], pR: [1, 0, -.5] };
const up2 = { hL: [-.42, 1.02, .3], hR: [.42, 1.02, .3], pL: [-1, -.2, .2], pR: [1, -.2, .2] };
