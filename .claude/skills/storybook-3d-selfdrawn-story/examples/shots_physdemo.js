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

// ===================== PHYSICS FX DEMO (v5.0) =====================
import * as FX from './fxphys.js';
const K2_ = () => CHARS.kael2;
const GRP = []; const grp = (par) => { const g = group({ parent: par }); GRP.push(g); return g; };
const L_ = 2.6;   // seconds per demo scene
// --- D1 falling objects: crates, a barrel and apples tumble off a cart, bounce, roll and settle (FIELD) ---
const g1 = grp(FIELD); const T1 = 0;
const fall = [FX.body(g1, { kind: 'crate', size: .55, p0: [-.6, 5.6, -2], v0: [.6, -2.4, .4], t0: T1 - .25, seed: 2 }), FX.body(g1, { kind: 'crate', size: .45, p0: [.1, 6.1, -2.2], v0: [-.3, -2.4, .6], t0: T1 - .05, seed: 3 }),
  FX.body(g1, { kind: 'barrel', size: .6, p0: [.8, 5.8, -2.4], v0: [-.5, -2.4, .9], t0: T1 - .15, seed: 4, rest: .3 })];
const apples = FX.rainOf(g1, { kind: 'apple', n: 14, at: [0, 6.3, -2.2], spread: .7, size: .16, t0: T1 + .1, stagger: .5, up: -2.4, scatter: 1.6, seed: 5, rest: .45 });
// --- D2 shatter: Kael flicks his fingers - a clay pot and a block of ice burst (FIELD) ---
const g2 = grp(FIELD); const T2 = L_; const ped = mesh(new THREE.CylinderGeometry(.35, .4, .9, 14), toon('#8a86a0'), { p: [.6, .45, -3], parent: g2 }); const ped2 = mesh(new THREE.CylinderGeometry(.35, .4, .9, 14), toon('#8a86a0'), { p: [-.8, .45, -3.4], parent: g2 });
const pot = FX.shatter(g2, { kind: 'pot', at: [.6, 1.15, -3], size: .5, tBreak: T2 + 1.0, dir: [.8, .3, -.3], power: 2.6, seed: 7 });
const ice = FX.shatter(g2, { kind: 'ice', at: [-.8, 1.2, -3.4], size: .55, tBreak: T2 + 1.45, dir: [-.6, .4, -.2], power: 2.8, seed: 8 });
// --- D3 chain: the seal chains strain, shiver and snap one after another (CRYPT) ---
const g3 = grp(CRYPT); const T3 = 2 * L_;
const chains = [FX.chain(g3, { a: [-4, 4.2, -6], b: [4, 4.2, -6], links: 22, tBreak: T3 + .9, power: 5, seed: 1, sag: .25 }), FX.chain(g3, { a: [-4, 2.6, -6.2], b: [4, 2.9, -6.2], links: 22, tBreak: T3 + 1.35, power: 5, seed: 2, sag: .3, breakAt: .4 }),
  FX.chain(g3, { a: [-4, 1.3, -6.4], b: [4, 1.1, -6.4], links: 22, tBreak: T3 + 1.75, power: 4, seed: 3, sag: .2, breakAt: .62, glow: '#ff4060' })];
// --- D4 water: a jug pours into a basin, droplets splash, ripples spread; a stream flows behind (VILL) ---
const g4 = grp(VILL); const T4 = 3 * L_;
const jug = group({ p: [-.15, 1.75, 2.4], r: [0, 0, -55], parent: g4 }); mesh(new THREE.CylinderGeometry(.16, .22, .45, 14), toon('#c0643a'), { parent: jug }); mesh(new THREE.CylinderGeometry(.08, .12, .12, 10), toon('#c0643a'), { p: [0, .28, 0], parent: jug });
mesh(new THREE.CylinderGeometry(.75, .6, .3, 20, 1, true), toon('#8a8494', { side: THREE.DoubleSide }), { p: [.45, .15, 2.4], parent: g4 });
const water = FX.pour(g4, { from: [.08, 1.95, 2.4], v0: [1.05, .35, 0], t0: T4 + .25, t1: T4 + 2.4, ground: .2, rate: 80, seed: 3 });
const river = FX.stream(g4, { path: [[-6, 6], [-2, 5], [1, 6.5], [5, 5.5], [8, 6.5]], width: 1.4, y: .03, speed: 1.1 });
// --- D5 energy: Elena charges violet energy in her palm and fires it into a boulder, which shatters (FIELD) ---
const g5 = grp(FIELD); const T5 = 4 * L_;
const boulder = FX.shatter(g5, { kind: 'rock', at: [2.6, .55, -6.5], size: .9, tBreak: T5 + 1.95, dir: [.4, .5, -.8], power: 3.6, n: 22, seed: 12 });
let blast = null;   // built on first use (needs Elena's hand position)
// --- D6 cracks: Kael stomps - glowing red cracks race across the ground, stones lift (FIELD) ---
const g6 = grp(FIELD); const T6 = 5 * L_;
const crack = FX.cracks(g6, { at: [0, 0, -1.5], normal: 'y', size: 5.5, t0: T6 + .75, dur: .55, col: '#2a1416', glow: '#ff3a4a', arms: 8, seed: 4 });
// --- D7 slash: Lucien cuts twice - crisp crescent arcs that sweep open and fade (FIELD) ---
const g7 = grp(FIELD); const T7 = 6 * L_;
const sl1 = FX.slash(g7, { at: [0, 1.25, -2.1], dir: 35, size: 1.1, t0: T7 + .7, col: '#bfe4ff', tilt: .15 }), sl2 = FX.slash(g7, { at: [0, 1.2, -2.1], dir: 160, size: 1.15, t0: T7 + 1.35, col: '#bfe4ff', tilt: -.1 });
const log7 = FX.shatter(g7, { kind: 'wood', at: [0, .9, -2.6], size: .7, tBreak: T7 + 1.38, dir: [0, .3, -.6], power: 2, n: 10, seed: 21 });
// --- D8 ULTIMATE: a held breath, a giant slash, the whole frame is cut along the line, then the stone splits (FIELD) ---
const g8 = grp(FIELD); const T8 = 7 * L_;
const ult = FX.slash(g8, { at: [0, 1.5, -2.8], dir: -18, size: 2.6, t0: T8 + 1.0, col: '#ffe9a8', ultimate: true, screenAngle: -16, gap: 30, tilt: 0 });
const stone8 = FX.shatter(g8, { kind: 'rock', at: [0, 1.0, -4.8], size: 1.4, tBreak: T8 + 1.55, dir: [0, .2, -1], power: 2.4, n: 26, seed: 31 });
// --- D9 lightning strikes a tower top, then an explosion throws rubble (CRYPT) ---
const g9 = grp(CRYPT); const T9 = 8 * L_;
mesh(new THREE.CylinderGeometry(.6, .8, 3, 12), toon('#5a5470'), { p: [2.2, 1.5, -7], parent: g9 });
const bolt = FX.lightning(g9, { from: [1.6, 12, -9], to: [2.2, 3.05, -7], t0: T9 + .55, dur: .45, seed: 3, width: .04 });
const boom = FX.explosion(g9, { at: [2.2, 3.1, -7], t0: T9 + .95, size: 2.2, seed: 5 });
const rubble = FX.rainOf(g9, { kind: 'rock', n: 16, at: [2.2, 3.3, -7], spread: .5, size: .3, t0: T9 + 1.0, stagger: .1, scatter: 6, up: 4, seed: 9, rest: .3 });
// ---------------------------------------------------------------------------------------------------------
const D = (id, t0, set, fn) => S(id, t0, 'cut', (lt, t) => { GRP.forEach(g => { g.visible = false; }); Wd.rocksAt([0, 0, 0], 0, 0); Wd.raysAt([0, 0, 0], 0); Wd.fogAt([0, 0, 0], 0, 0); const l = lt / SP, tr = t / SP; fn(l, tr); }, { noCut: true });
D('D1', T1, FIELD, (l, t) => { fieldDusk(); FIELD.visible = true; FA.rock.visible = false; g1.visible = true; fall.forEach(b => b.at(t)); apples.at(t);
  put(K2_(), FIELD, { p: [-2.0, 0, -1.4], ry: 60, ...pf(l, [[0, 'calm'], [.9, 'shocked']]), pop: popAt(l, .9, .08) });
  camF([3.2, 1.0, 2.6], [0, .7, -2.1], [2.4, .8, 2.0], [0, .5, -2.1], U(l, L_, eIO), 50); });
D('D2', T2, FIELD, (l, t) => { fieldDusk(); FIELD.visible = true; FA.rock.visible = false; g2.visible = true; pot.at(t); ice.at(t); const k = sstep(.75, .95, l);
  put(K(), FIELD, { p: [-.1, 0, -1.3], ry: 180, ...pf(l, [[0, 'sly'], [.95, 'evil']]), eyeC: '#ff2030', ...flick(k), fast: true });
  camF([3.2, 1.9, .9], [-.3, 1.0, -2.6], [2.9, 1.85, .6], [-.3, 1.0, -2.7], U(l, L_, eIO), 58); });
D('D3', T3, CRYPT, (l, t) => { cryptLight(); CRYPT.visible = true; Wd.cryptAt(t, 0); CR.demon.visible = false; g3.visible = true; chains.forEach(c => c.at(t));
  camC([.9, 2.8, -1.4], [0, 2.6, -6.2], [-.9, 2.6, -1.8], [0, 2.5, -6.2], U(l, L_, eIO), 56); });
D('D4', T4, VILL, (l, t) => { villNight({ hemiI: 1.9, sunI: 1.3 }); VILL.visible = true; g4.visible = true; water.at(t); river.at(t);
  camV([1.9, 1.6, 5.6], [.2, 1.0, 2.4], [1.4, 1.4, 4.8], [.3, .7, 2.4], U(l, L_, eIO), 46); });
D('D5', T5, FIELD, (l, t) => { fieldDusk(); FIELD.visible = true; FA.rock.visible = false; g5.visible = true; boulder.at(t);
  put(E_(), FIELD, { p: [-1.4, 0, -2.2], ry: 50, ...pf(l, [[0, 'determined'], [1.95, 'confident']]), hR: [.3, .75, .5], pR: [1, -.3, -.3], hL: [-.3, .35, .2], pL: [-1, 0, -.5] });
  if (!blast) { scene.updateMatrixWorld(); const h = FIELD.worldToLocal(W(E_(), [.32, .78, .62])); blast = FX.energy(g5, { from: h.toArray(), to: [2.6, .7, -6.5], tCharge: T5 + .15, tFire: T5 + 1.45, tHit: T5 + 1.95, col: '#b070ff', arc: .4 }); }
  blast.at(t); camF([-2.2, 2.0, 2.8], [.1, 1.0, -4.0], [-1.8, 1.95, 2.4], [.4, .9, -4.4], U(l, L_, eIO), 58); });
D('D6', T6, FIELD, (l, t) => { fieldDusk(); FIELD.visible = true; FA.rock.visible = false; g6.visible = true; crack.at(t); const s = sstep(.55, .75, l);
  put(K(), FIELD, { p: [0, 0, -1.5], ry: 0, ...pf(l, [[0, 'calm'], [.7, 'angry']]), eyeC: '#ff2030', hipY: -.08 * Math.sin(Math.PI * s), lean: 10 * Math.sin(Math.PI * s), ...flick(sstep(.3, .7, l) * (1 - s)) });
  Wd.rocksAt(FIELD.localToWorld(V(0, 0, -1.5)), t, sstep(.8, 1.6, l)); SH.a = l > .75 && l < 1.15 ? .7 : 0; SH.t = t; if (l > .75) shockAt(FIELD.localToWorld(V(0, .05, -1.5)), (l - .75) / .7, 1.1, '#ff6a7a');
  camF([1.0, 5.2, 2.2], [0, 0, -1.8], [1.5, 4.4, 2.8], [0, .3, -1.8], U(l, L_, eIO), 54); });
D('D7', T7, FIELD, (l, t) => { fieldDusk(); FIELD.visible = true; FA.rock.visible = false; g7.visible = true; sl1.at(t); sl2.at(t); log7.at(t); SWORD.visible = true;
  const sw = l < .7 ? 0 : l < 1.0 ? (l - .7) / .3 : l < 1.35 ? 1 - (l - 1.0) / .35 : 0, a = sstep(0, 1, sw);
  put(L(), FIELD, { p: [-.9, 0, -1.6], ry: 60, ...pf(l, [[0, 'determined'], [.7, 'angry']]), hR: lp([.3, .9, .3], [.45, .35, .6], a), pR: [1, -.3, -.3], hold: { R: { obj: SWORD, off: [0, -.01, .02], rot: [lerp(10, 120, a), 0, 0], mass: .4 } } });
  camF([1.6, 1.5, 1.6], [-.3, 1.1, -2.2], [1.3, 1.4, 1.3], [-.3, 1.1, -2.3], U(l, L_, eIO), 52); });
D('D8', T8, FIELD, (l, t) => { warLight(); FIELD.visible = true; FA.rock.visible = false; g8.visible = true; ult.at(t); stone8.at(t); SWORD.visible = true;
  const wind = sstep(.1, .9, l), cut = sstep(.95, 1.08, l);    // slow wind-up (held breath) -> 3-frame strike -> hold the pose
  put(L(), FIELD, { p: [-.2, 0, -1.2], ry: 180, ...pf(l, [[0, 'determined'], [.9, 'angry']]), hR: lp(lp([.3, .5, .2], [-.2, 1.15, -.1], wind), [.55, .3, .65], cut), pR: [1, -.3, -.3], lean: lerp(0, -8, wind) + 18 * cut,
    hold: { R: { obj: SWORD, off: [0, -.01, .02], rot: [lerp(lerp(20, -30, wind), 130, cut), 0, 0], mass: .4 } } }); HOLY.position.copy(W(L(), [0, .8, 0])); HOLY.material.opacity = .5 * wind * (1 - cut * .6); HOLY.scale.setScalar(3);
  if (l < .95) tintAt('#000010', .25 * wind); const cp = lp([2.6, 1.6, 2.2], [2.2, 1.7, 1.6], eIO(clamp(l))); camF(cp, [-.1, 1.3, -3.0], cp, [-.1, 1.3, -3.0], 0, 56); });
D('D9', T9, CRYPT, (l, t) => { cryptLight(); CRYPT.visible = true; Wd.cryptAt(t, 0); CR.demon.visible = false; g9.visible = true; bolt.at(t); boom.at(t); rubble.at(t); SH.a = l > .95 && l < 1.5 ? .8 : 0; SH.t = t;
  camC([-1.4, 2.0, 1.6], [1.8, 3.0, -7], [-1.8, 1.8, 2.2], [1.8, 2.8, -7], U(l, L_, eIO), 56); });

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
