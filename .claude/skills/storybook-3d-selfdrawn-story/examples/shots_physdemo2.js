// shots.js: THE LAST VILLAIN ep 3 ตอนจบ (75.23 s) - times are real seconds (voice already sped up); animation clocks run SP x
import { THREE, scene, camera, clamp, lerp, sstep, eIO, eOut, eIn, eSine, D2R, noise1, rng, POST, mesh, rbox, toon, basic, group, cylBetween } from './engine.js';
import * as Wd from './world.js';
import { CHARS, pose, blinkAt, talkQ, popAt, sparkAt, actHit, actPunch, hitStop, impactAt, dustAt, debrisAt, smokeAt, ramp, tintAt, irisAt, burnAt, rainAt, shockAt, runesAt, beamAt } from './chars.js';
const { HALL, HA, FIELD, FA, BALC, CRYPT, CR, VILL, VI } = Wd;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const TM = { env: [] };
const talkAt = (t) => talkQ(TM.env, t / SP); // env is in real (sped-up) seconds
let SH = { a: 0, t: 0 };
function look(pos, tgt, fov = 40, roll = 0) { POST.focus = pos.distanceTo(tgt); camera.position.copy(pos); camera.fov = fov; camera.updateProjectionMatrix(); camera.up.set(0, 1, 0); camera.lookAt(tgt); if (roll) camera.rotateZ(roll * D2R);
  if (SH.a > 0) { const t = SH.t * 22; camera.rotateX(noise1(t) * .02 * SH.a); camera.rotateY(noise1(t + 50) * .02 * SH.a); camera.position.y += noise1(t + 9) * .06 * SH.a; } camera.updateMatrixWorld(); }
const lp = (a, b, u) => a.map((v, i) => lerp(v, b[i], u));
const HUP = .32, hup = (v) => { v[1] += HUP * clamp(v[1] / 1.4); return v; }; // taller cast (legs 1.2 heads): framing at head height lifts with the heads, floor framing stays
const CAMX = 1.4; /* v4.29 refs move the camera 3-4x more: stretch every planned move around its midpoint */
const ampl = (p0, p1, t0, t1) => { /* v4.30 keep the CLOSER end exactly as planned (no extra zoom into faces); stretch only the far end */
  const d0 = Math.hypot(p0[0] - t0[0], p0[1] - t0[1], p0[2] - t0[2]), d1 = Math.hypot(p1[0] - t1[0], p1[1] - t1[1], p1[2] - t1[2]);
  return d0 >= d1 ? [p0.map((v, i) => p1[i] + (v - p1[i]) * CAMX), p1] : [p0, p1.map((v, i) => p0[i] + (v - p0[i]) * CAMX)]; };
let MIND = 2.0; /* v4.30 face shots: the camera never comes closer than 2 m (medium close-up with headroom); macro shots set MIND = 0 */
const keep = (p, t) => { const d = Math.hypot(p[0] - t[0], p[1] - t[1], p[2] - t[2]); if (d >= MIND || d < 1e-3) return p; const k = MIND / d; return p.map((v, i) => t[i] + (v - t[i]) * k); };
const camO = (o) => (p0, t0, p1, t1, u, fov = 40, roll = 0) => { p0 = keep(p0, t0); p1 = keep(p1, t1); const [q0, q1] = ampl(p0, p1, t0, t1); look(V(...hup(lp(q0, q1, u))).add(o.position), V(...hup(lp(t0, t1, u))).add(o.position), fov, roll); };
const camH = camO(HALL), camF = camO(FIELD), camB = camO(BALC), camC = camO(CRYPT), camV = camO(VILL);
function put(C, parent, P) { if (C.g.parent !== parent) parent.add(C.g); pose(C, P); }
function dof(k) { POST.dof = k; }
const U = (lt, d, e = eIO) => e(clamp(lt / d));
const K = () => CHARS.kael, E_ = () => CHARS.elena, L = () => CHARS.lucien, A = () => CHARS.arcus, K2 = () => CHARS.kael2, KN = (i) => CHARS['k' + i];
// ---------- props made here ----------
const SWORD = group({ parent: scene }); { mesh(new THREE.CylinderGeometry(.016, .016, .12, 8), toon('#4a2f22'), { parent: SWORD }); mesh(rbox(.14, .025, .035), toon('#e2b23c'), { p: [0, .07, 0], parent: SWORD });
  mesh(rbox(.035, .6, .01), toon('#eef3f8', { emissive: '#fff4c8', ei: .5 }), { p: [0, .38, 0], parent: SWORD }); }
const AUR = Wd.glowSprite('#9a4aff', 6, { opacity: 0 }); scene.add(AUR);           // purple aura behind Kael
const HOLY = Wd.glowSprite('#ffe6a0', 10, { opacity: 0 }); scene.add(HOLY);        // Lucien's light
const EYES = [0, 1].map(() => { const s = Wd.glowSprite('#ff2030', .5, { opacity: 0 }); scene.add(s); return s; });
const WAVE = mesh(new THREE.TorusGeometry(1, .08, 8, 64), basic('#b07aff', { transparent: true, opacity: 0, add: true, depthWrite: false }), { r: [90, 0, 0], parent: scene, cast: false }); WAVE.userData.noInk = true;
const WHITE = { k: 0 };
const HIDE = V(0, -60, 0);
const BOOK = group({ parent: scene }); { mesh(rbox(.26, .34, .07), toon('#8a1f2e'), { parent: BOOK }); mesh(rbox(.24, .32, .05), toon('#f4ecd8'), { p: [.012, 0, 0], parent: BOOK }); mesh(rbox(.03, .16, .072), toon('#e2b23c'), { parent: BOOK }); mesh(rbox(.11, .03, .072), toon('#e2b23c'), { p: [0, .03, 0], parent: BOOK }); }
const STAFF = group({ parent: scene }); { mesh(new THREE.CylinderGeometry(.022, .026, 1.7, 8), toon('#6a4a2a'), { p: [0, .35, 0], parent: STAFF }); mesh(new THREE.TorusGeometry(.12, .025, 8, 20), toon('#e2b23c'), { p: [0, 1.25, 0], parent: STAFF });
  const o = mesh(new THREE.SphereGeometry(.085, 14, 10), basic('#ff3a5a'), { p: [0, 1.25, 0], parent: STAFF }); o.userData.noInk = true; const g = Wd.glowSprite('#ff3a5a', .7, { opacity: .6 }); g.position.set(0, 1.25, 0); STAFF.add(g); }
const SPEARS = [0, 1, 2, 3].map(() => { const g = group({ parent: scene }); mesh(new THREE.CylinderGeometry(.014, .014, 1.9, 6), toon('#6a4a2a'), { p: [0, .4, 0], parent: g }); mesh(new THREE.ConeGeometry(.04, .2, 4), toon('#dfe3ec'), { p: [0, 1.45, 0], parent: g }); return g; });
function reset(t) {
  SH.a = 0; SH.t = t; Object.values(CHARS).forEach(C => { C.g.visible = false; });
  Wd.hideSets(); Wd.hideSea(); Wd.pts.forEach(l => { l.intensity = 0; });
  SWORD.visible = BOOK.visible = STAFF.visible = false; SPEARS.forEach(x => { x.visible = false; }); AUR.material.opacity = 0; HOLY.material.opacity = 0; EYES.forEach(e => { e.material.opacity = 0; }); WAVE.material.opacity = 0; WHITE.k = 0;
  FA.army.forEach(m => { m.visible = false; }); (FA.standards || []).forEach(g => { g.visible = false; }); Wd.cityAt(false, t); Wd.posterAt(false); FA.rock.visible = true;
  POST.sat = 1; POST.lift = 1; POST.vig = .32;
}
// ---------- light helpers ----------
const past = () => { POST.sat = .78; POST.lift = 1.02; POST.vig = .42; }; // 100 years ago: a touch faded
function hallLight(o = {}) { Wd.applyLight('night', { hemiI: 1.7, sunI: .9, hemiS: '#b8b0e8', hemiG: '#4a3a5a', fog: '#2a2240', fogN: 18, fogF: 70, stars: 0, moon: 0, ...o }); Wd.setShadowFocus(0, 1, -10, 9); }
function fieldDusk(o = {}) { Wd.applyLight('dusk', { fogN: 40, fogF: 320, ...o }); Wd.setShadowFocus(300, 1, -6, 14); }
function warLight() { Wd.applyLight('dusk', { top: '#2a1424', mid: '#8a2a2a', hor: '#ff7a3a', glow: '#ff6a2a', glowAmt: .8, sunC: '#ff9a6a', sunI: 2.4, hemiS: '#ff9a8a', hemiG: '#4a2020', fog: '#7a2a24', fogN: 30, fogF: 260 }); Wd.setShadowFocus(300, 1, -20, 20); }
function dawnLight() { Wd.applyLight('sunrise', { fogN: 40, fogF: 320 }); Wd.setShadowFocus(300, 1, -4, 12); }
function moonLight() { Wd.applyLight('night', { hemiI: 1.9, sunI: 1.5 }); Wd.setShadowFocus(-300, 1, 0, 8); }
function cryptLight() { Wd.applyLight('night', { hemiI: .9, sunI: .35, hemiS: '#8a6aa8', hemiG: '#2a1020', fog: '#1a0f20', fogN: 12, fogF: 70, stars: 0, moon: 0 }); Wd.setShadowFocus(0, 4, 288, 16); }
function villNight(o = {}) { Wd.applyLight('night', { hemiI: 1.8, sunI: 1.3, ...o }); Wd.setShadowFocus(0, 1, -300, 14); }
// ---------- pose presets ----------
const hip = { hL: [-.3, .36, .12], hR: [.3, .36, .12], pL: [-1, 0, -.5], pR: [1, 0, -.5] };
const hands = { hL: [-.06, .42, .34], hR: [.06, .42, .34], pL: [-1, -.3, 0], pR: [1, -.3, 0] };
const flick = (k) => ({ hR: lp([.3, .3, .1], [.62, .78, .55], k), pR: [1, -.2, -.4], hL: [-.3, .3, .1], pL: [-1, 0, -.5] });
// glow helpers (world positions)
const W = (C, v) => { scene.updateMatrixWorld(); return C.torso.localToWorld(V(...v)); };
function aura(C, k, t, col = '#9a4aff', sz = 4) { const p = W(C, [0, .7, 0]); p.addScaledVector(V().subVectors(p, camera.position).normalize(), .9 * C.spec.s); AUR.position.copy(p); AUR.material.color.set(col); AUR.material.opacity = k * (.38 + .08 * Math.sin(t * 6)); AUR.scale.setScalar(sz * C.spec.s * (1 + .05 * Math.sin(t * 4))); }
function redEyes(C, k, t) { scene.updateMatrixWorld(); const h = C.head.getWorldPosition(V()), d = V().subVectors(camera.position, h).normalize(), r = V().crossVectors(d, V(0, 1, 0)).normalize(), s = C.spec.s;
  EYES.forEach((e, i) => { e.position.copy(h).addScaledVector(d, .42 * s).addScaledVector(r, (i ? 1 : -1) * .13 * s).add(V(0, .16 * s, 0)); e.material.opacity = k * (.7 + .15 * Math.sin(t * 9 + i)); e.scale.setScalar(.5 * s * (.6 + .4 * k)); }); }
// ===================================================================== SHOTS
export const SHOTS = [];
const AMBK = () => HALL.visible ? 'dust' : BALC.visible ? 'firefly' : CRYPT.visible ? 'spark' : VILL.visible ? 'firefly' : FIELD.visible ? 'ember' : null; // v4.22 ambience per set
// v4.24 PACE: the whole clip plays SP x faster (voice sped up with atempo, pitch kept); shot times shrink, animation clocks run SP x
const SP = 1.12;
// v4.24 COVERAGE: longer shots get a cut-in (same side of the action, no spin) so the angle changes every ~1.2-1.8 s
const _f = new THREE.Vector3(), _r = new THREE.Vector3(), _T = new THREE.Vector3();
function coverage(sh, ltR) { return; /* v4.30 off: the mid-shot close-up cut still read as a zoom + skipped frames */ // v4.27: one clear change of angle per long shot - a close-up on the main character from ~30 deg to the same side, about 2x closer.
  // (small punch-ins of the same framing read as skipped frames / jump cuts, so they are not used)
  const i = SHOTS.indexOf(sh), nx = SHOTS[i + 1], d = (nx ? nx.t0 : 23.4) - sh.t0; if (sh.noCut || d < 2.6 || ltR < d * .55) return;
  camera.updateMatrixWorld(); const cp = camera.position.clone(); camera.getWorldDirection(_f);
  /* stateless + deterministic (segments render in separate browsers): the first character in cast order whose head is near the view axis */
  let best = null; for (const C of Object.values(CHARS)) { let o = C.g, v = true; while (o) { v = v && o.visible; o = o.parent; } if (!v || !C.g.parent) continue;
    const h = C.hc.getWorldPosition(new THREE.Vector3()).add(V(0, C.is2D ? .36 * C.g.getWorldScale(new THREE.Vector3()).x : 0, 0)), rel = h.clone().sub(cp), z = rel.dot(_f); if (z < .5) continue;
    if (rel.clone().addScaledVector(_f, -z).length() / z > .6) continue; best = h; break; }
  if (!best) return; const dist = cp.distanceTo(best); if (dist < 2.2) return;
  const back = cp.clone().sub(best).setY(0).normalize(), sg = i % 2 ? 1 : -1, a = sg * .5, ca = Math.cos(a), sa = Math.sin(a);
  const dir = new THREE.Vector3(back.x * ca - back.z * sa, 0, back.x * sa + back.z * ca), nd = Math.max(1.25, dist * .45);
  const tgt = best.clone().add(V(0, -.18, 0)); /* just below the face centre: face in the upper third */ camera.position.copy(tgt).addScaledVector(dir, nd).add(V(0, .06, 0)); camera.lookAt(tgt); camera.updateMatrixWorld(); POST.focus = camera.position.distanceTo(tgt); }
const S = (id, t0, tr, fn, o = {}) => { const sh = { id, t0, tr, ...o }; sh.fn = (lt, t) => { fn(lt * SP, t * SP); coverage(sh, (globalThis.FRAME_T ?? t) - sh.t0); Wd.ambientAt(t, o.amb ?? AMBK()); Wd.clothAt(t); Wd.flamesAt(t); }; SHOTS.push(sh); };
/* v4.32 perform(lt, [[t, ex], ...]): expression changes happen behind a blink (eyes shut ~4 frames around the swap) with a small head dip, never a hard cut */
function pf(lt, keys) { let i = 0; for (let k = 0; k < keys.length; k++) if (lt >= keys[k][0]) i = k; const o = { ex: keys[i][1] };
  for (let k = 1; k < keys.length; k++) { const d = lt - keys[k][0]; if (d > -.06 && d < .1) o.blink = true; if (d >= 0 && d < .32) o.head = [7 * Math.sin(Math.PI * d / .32), 0, 0]; } return o; }

// ===================== PHYSICS FX DEMO 2 (v5.1): bodies colliding with each other + impact frame =====================
import * as FX from './fxphys.js';
const GRP = []; const grp = (par) => { const g = group({ parent: par }); GRP.push(g); return g; };
const L_ = 3.2;
// E1: a tower of crates (spheres-collision pile) is hit by Elena's energy ball and collapses; crates knock into each other
const h1 = grp(FIELD); const U1 = 0, HIT = U1 + 1.35, list = [];
for (let y = 0; y < 5; y++) for (let x = 0; x < 3; x++) { const p0 = [x * .6 - .6, .3 + y * .6, -3.6]; const d = Math.hypot(p0[0] - .6, p0[1] - 1.5);
  list.push({ kind: 'crate', size: .5, p0, v0: d < 1.1 ? [(-p0[0] + .6) * -1.2 - 3.2 * (1.1 - d), .8, -1.5 * (1.1 - d)] : [0, 0, 0] }); }
const tower = FX.pile(h1, { list, t0: HIT, dur: 3, rest: .2, seed: 3 });
const shot1 = FX.energy(h1, { from: [2.6, 1.6, -1.4], to: [.6, 1.5, -3.5], tCharge: U1 + .1, tFire: U1 + 1.0, tHit: HIT, col: '#b070ff', arc: .2, ringSize: 2 });
// E2: ultimate slash with an anime impact frame on the strike, then the boulder bursts into a rubble pile
const h2 = grp(FIELD); const U2 = L_, STRIKE = U2 + 1.1;
const ult2 = FX.slash(h2, { at: [0, 1.5, -2.8], dir: -18, size: 2.6, t0: STRIKE, col: '#ffe9a8', ultimate: true, screenAngle: -16, gap: 30 });
const IF = FX.impactFrame({ t0: STRIKE + .02, at: [300, 1.4, -3.0] });
const R_ = rng(5), rub = []; for (let i = 0; i < 14; i++) rub.push({ kind: 'rock', size: .3 + R_() * .35, p0: [(R_() - .5) * 1.2, .8 + R_() * 1.2, -4.8 + (R_() - .5) * 1.2], v0: [(R_() - .5) * 4, 1 + R_() * 3, -R_() * 3] });
const rubble = FX.pile(h2, { list: rub, t0: STRIKE + .45, dur: 3, rest: .3, seed: 7, showFrom: STRIKE + .45 });
const big = FX.shatter(h2, { kind: 'rock', at: [0, 1.0, -4.8], size: 1.4, tBreak: STRIKE + .45, dir: [0, .2, -1], power: 2.4, n: 18, seed: 31, fadeAfter: .6 });
const D = (id, t0, fn) => S(id, t0, 'cut', (lt, t) => { GRP.forEach(g => { g.visible = false; }); Wd.rocksAt([0, 0, 0], 0, 0); fn(lt / SP, t / SP); }, { noCut: true });
D('E1', U1, (l, t) => { fieldDusk(); FIELD.visible = true; FA.rock.visible = false; h1.visible = true; tower.at(t); shot1.at(t);
  camF([3.6, 2.2, 1.4], [0, 1.4, -3.4], [3.2, 2.0, .9], [0, 1.1, -3.6], U(l, L_, eIO), 54); });
D('E2', U2, (l, t) => { warLight(); FIELD.visible = true; FA.rock.visible = false; h2.visible = true; ult2.at(t); IF.at(t); big.at(t); rubble.at(t); SWORD.visible = true;
  const wind = sstep(.1, 1.0, l), cut = sstep(1.05, 1.18, l);
  put(L(), FIELD, { p: [-.2, 0, -1.2], ry: 180, ...pf(l, [[0, 'determined'], [1.0, 'angry']]), hR: lp(lp([.3, .5, .2], [-.2, 1.15, -.1], wind), [.55, .3, .65], cut), pR: [1, -.3, -.3], lean: lerp(0, -8, wind) + 18 * cut,
    hold: { R: { obj: SWORD, off: [0, -.01, .02], rot: [lerp(lerp(20, -30, wind), 130, cut), 0, 0], mass: .4 } } });
  if (l < 1.05) tintAt('#000010', .25 * wind); SH.a = l > 1.1 && l < 1.6 ? .6 : 0; SH.t = t; const cp = lp([2.6, 1.6, 2.2], [2.2, 1.7, 1.6], eIO(clamp(l / 1.2))); camF(cp, [-.1, 1.3, -3.0], cp, [-.1, 1.3, -3.0], 0, 56); });

export function initShots(timing) { TM.env = timing.env; for (let i = 0; i < SHOTS.length; i++) SHOTS[i].t1 = i + 1 < SHOTS.length ? SHOTS[i + 1].t0 : timing.end; }
export function runShot(sh, t) { reset(t); sh.fn(t - sh.t0, t); }
export const WHITEK = WHITE;
export const COVER = { id: 'COVER', t0: 0, fn: (lt, t, o = {}) => {
  reset(10); ep3Reset(); wedNight(); Wd.hallAt(10); nookAt({ lit: 7 }); Wd.raysAt(HALL.localToWorld(V(0, 0, -11)), .35, 10, '#ffe0a0');
  const cm = o.cam || [0, 1.75, -6.9], g = o.tgt || [0, 1.75, -10.0]; camH(cm, g, cm, g, 0, o.fov || 46);
  put(K2_(), HALL, { p: [.4, .3, -10.0], ry: -20, ex: 'happy', hL: [-.3, .45, .3], pL: [-1, -.3, 0] }); put(E_(), HALL, { p: [-.4, .3, -10.0], ry: 20, ex: 'happy', hR: [.3, .45, .3], pR: [1, -.3, 0] });
} };
export const BENCH = { id: 'BENCH', t0: 0, fn: (lt, t, o = {}) => {
  reset(0); hallLight(); Wd.hallAt(0); const ids = ['kael', 'elena', 'lucien', 'arcus', 'kael2', 'k1'];
  ids.forEach((id, i) => put(CHARS[id], HALL, { p: [(i - 2.5) * .9, 0, -6], ry: o.ry ?? 0, ex: ['sly', 'happy', 'smug', 'evil', 'shocked', 'frown'][i] }));
  const bc = o.cam || [0, 1.3, -.8], bt = o.tgt || [0, 1.0, -6]; camH(bc, bt, bc, bt, 0, o.fov || 40);
} };
