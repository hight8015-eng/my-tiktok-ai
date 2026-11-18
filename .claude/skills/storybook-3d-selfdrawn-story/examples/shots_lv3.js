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
  const i = SHOTS.indexOf(sh), nx = SHOTS[i + 1], d = (nx ? nx.t0 : 75.23) - sh.t0; if (sh.noCut || d < 2.6 || ltR < d * .55) return;
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
// ===================== EP3 (finale) set pieces =====================
const K2_ = () => CHARS.kael2;   // Kael (the reborn body that vanished in ZERO)
const PR = Wd.PROP;
// the old cathedral door (shut for 100 years)
const DOOR = group({ p: [0, 0, 8.6], parent: HALL }); { const st = toon('#5a5470'); for (const s of [-1, 1]) mesh(rbox(1.2, 5.6, .6), st, { p: [s * 2.2, 2.8, .1], parent: DOOR }); mesh(rbox(5.6, 1.4, .6), st, { p: [0, 4.9, .1], parent: DOOR });
  mesh(rbox(12, 12, .4), toon('#ffffff', { map: null }), { p: [0, 6, .5], s: [1, 1, 1], parent: DOOR }).visible = false;
  const sky = mesh(new THREE.PlaneGeometry(3.4, 4.3), basic('#fff4dc'), { p: [0, 2.1, .7], r: [0, 180, 0], parent: DOOR, cast: false }); sky.userData.noInk = true; sky.material.side = THREE.DoubleSide;
  DOOR.userData.leaves = [-1, 1].map(s => { const g = group({ p: [s * 1.6, 0, -.25], parent: DOOR }); mesh(rbox(1.6, 4.2, .18), toon('#6a3e26'), { p: [-s * .8, 2.1, 0], parent: g });
    for (const y of [1.0, 3.2]) mesh(rbox(1.5, .12, .22), toon('#3a3040'), { p: [-s * .8, y, 0], parent: g }); return g; });
  const web = new THREE.Mesh(new THREE.CircleGeometry(.9, 8), basic('#e8e8f0', { transparent: true, opacity: .35, side: THREE.DoubleSide })); web.position.set(1.4, 3.9, -.4); web.userData.noInk = true; DOOR.add(web); DOOR.userData.web = web; }
function doorAt(k) { DOOR.userData.leaves.forEach((g, i) => { const s = i ? 1 : -1; g.rotation.y = s * k * 1.9; }); DOOR.userData.web.visible = k < .05; }
// the wedding corner in front of the altar: a table with two rings + candles, two chairs, the dress on a stand
const NOOK = group({ p: [0, .9, -11.0], parent: HALL }); {
  mesh(new THREE.CylinderGeometry(.55, .5, .06, 20), toon('#f4ecd8'), { p: [0, .72, 0], parent: NOOK }); cylBetween([0, 0, 0], [0, .72, 0], .06, toon('#c9a24a'), NOOK, 8);
  mesh(new THREE.CylinderGeometry(.16, .16, .05, 16), toon('#8a1f2e'), { p: [.18, .77, .05], parent: NOOK });
  NOOK.userData.rings = [-1, 1].map(s => { const r = mesh(new THREE.TorusGeometry(.045, .012, 8, 20), toon('#e2b23c', { emissive: '#e2b23c', ei: .3 }), { p: [.18 + s * .06, .815, .05], r: [70, 0, 0], parent: NOOK }); return r; });
  NOOK.userData.candles = []; for (let k = 0; k < 7; k++) { const a = k / 7 * 6.283; const c = group({ p: [Math.cos(a) * .4, .75, Math.sin(a) * .4 - .05], parent: NOOK }); mesh(new THREE.CylinderGeometry(.025, .028, .16 + (k % 3) * .05, 8), toon('#efe6d2'), { p: [0, .09, 0], parent: c });
    const f = mesh(new THREE.SphereGeometry(.025, 8, 6), basic('#ffd27a'), { p: [0, .2 + (k % 3) * .05, 0], s: [1, 1.7, 1], parent: c, cast: false }); f.userData.noInk = true; c.userData.f = f; NOOK.userData.candles.push(c); }
  NOOK.userData.glow = Wd.glowSprite('#ffb84a', 3, { opacity: .55 }); NOOK.userData.glow.position.set(0, 1.0, 0); NOOK.add(NOOK.userData.glow);
  NOOK.userData.chairs = [-1, 1].map(s => { const g = group({ p: [s * 1.1, 0, .1], r: [0, s * -25, 0], parent: NOOK }); mesh(rbox(.6, .08, .55), toon('#e8e0cc'), { p: [0, .48, 0], parent: g }); mesh(rbox(.6, .8, .08), toon('#e8e0cc'), { p: [0, .92, -.26], parent: g });
    for (const [x, z] of [[-.26, -.24], [.26, -.24], [-.26, .24], [.26, .24]]) cylBetween([x, 0, z], [x, .46, z], .025, toon('#c9a24a'), g, 5); mesh(new THREE.TorusGeometry(.16, .03, 6, 14), toon('#e8708a'), { p: [0, 1.2, -.26], parent: g }); return g; });
  // the dress on a stand
  const D = group({ p: [-2.4, 0, -.6], r: [0, 25, 0], parent: NOOK }); cylBetween([0, 0, 0], [0, 1.6, 0], .03, toon('#c9a24a'), D, 6); mesh(new THREE.CapsuleGeometry(.2, .28, 6, 12), toon('#f8f4ec'), { p: [0, 1.32, 0], s: [1, 1, .7], parent: D });
  const sk = new THREE.LatheGeometry([[0, 0], [.62, 0], [.55, .3], [.38, .7], [.22, 1.08], [.18, 1.12]].map(([x, y]) => new THREE.Vector2(x, y)), 24); mesh(sk, toon('#f8f4ec', { side: THREE.DoubleSide }), { p: [0, .05, 0], parent: D });
  mesh(new THREE.TorusGeometry(.6, .03, 6, 24), toon('#e2b23c'), { p: [0, .08, 0], r: [90, 0, 0], parent: D }); mesh(new THREE.ConeGeometry(.32, .9, 16, 1, true), basic('#ffffff', { transparent: true, opacity: .35, side: THREE.DoubleSide }), { p: [0, 1.25, -.05], parent: D, cast: false }); NOOK.userData.dress = D;
  // cobwebs that grow with the years
  NOOK.userData.webs = [[-1.1, 1.3, -.2], [1.1, 1.3, -.2], [0, 1.0, -.35]].map(p => { const w = new THREE.Mesh(new THREE.CircleGeometry(.35, 8), basic('#e8e8f0', { transparent: true, opacity: .4, side: THREE.DoubleSide })); w.position.set(...p); w.userData.noInk = true; NOOK.add(w); return w; }); }
function nookAt(o = {}) { const lit = o.lit ?? 7; NOOK.userData.candles.forEach((c, i) => { c.userData.f.visible = i < lit; }); NOOK.userData.glow.material.opacity = .08 * lit;
  NOOK.userData.rings[0].visible = o.ring0 ?? true; NOOK.userData.rings[1].visible = o.ring1 ?? true; NOOK.userData.webs.forEach((w, i) => { w.visible = (o.webs || 0) > i; }); }
// year boards
const YEAR = [10, 50, 100].map(y => { const b = PR.countdown(HALL, [1.7, .9, -10.3], `ปีที่ ${y}`, -35); b.visible = false; return b; });
// limbo (between life and death): floating rocks + mist in the crypt with the demon gone
const RINGH = group({ parent: scene }); mesh(new THREE.TorusGeometry(.05, .014, 8, 20), toon('#e2b23c', { emissive: '#e2b23c', ei: .3 }), { parent: RINGH }); RINGH.visible = false;   // ring in Kael's hand
const BQ = PR.bouquet(scene, 0); BQ.visible = false;
const pts0 = (p, i) => { const l = Wd.pts[1]; l.position.copy(p); l.color.set('#fff0d0'); l.intensity = i; l.distance = 18; };
const wedNight = () => hallLight({ hemiI: 1.25, sunI: .5, hemiS: '#9a90d0', fog: '#1e1832' });
function ep3Reset() { NOOK.visible = true; doorAt(0); nookAt(); YEAR.forEach(b => { b.visible = false; }); RINGH.visible = false; BQ.visible = false; CR.demon.visible = true;
  Wd.cracksAt(0, [0, 0, 0], 0); Wd.cracksAt(1, [0, 0, 0], 0); Wd.raysAt([0, 0, 0], 0); Wd.fogAt([0, 0, 0], 0, 0); Wd.rocksAt([0, 0, 0], 0, 0); }
const E3 = (id, t0, tr, fn, o) => S(id, t0, tr, (lt, t) => { ep3Reset(); MIND = 2.0; fn(lt, t); }, o);
const EL = (o) => put(E_(), HALL, o);
const bq = (wilt) => { BQ.visible = true; BQ.children.forEach((m, i) => { if (i) m.position.y = .1 - wilt * .07 * (i % 3); }); return BQ; };

// ===================== EP3 SHOTS (real seconds) =====================
E3('S01', 0, 'cut', (lt, t) => { // "ทุกปี" - candlelit arch at night
  wedNight(); Wd.hallAt(t); Wd.raysAt(HALL.localToWorld(V(0, 0, -11)), .4, t, '#ffe0a0');
  camH([0, 3.4, -4.0], [0, 2.4, -12], [0, 2.9, -5.2], [0, 2.3, -12], U(lt, 1.0, eOut), 46); });
E3('S02', .99, 'cut', (lt, t) => { // "เจ้าหญิงคนนี้จะจัดงานแต่งงาน" - she walks down the aisle alone
  wedNight(); Wd.hallAt(t); const z = -3.5 - lt * 1.4;
  EL({ p: [0, 0, z], ry: 180, ex: 'calm', walk: { ph: lt * 6, stride: .16 }, hL: [-.12, .45, .35], hR: [.12, .45, .35], pL: [-1, -.3, 0], pR: [1, -.3, 0], hold: { R: { obj: bq(0), off: [-.06, .05, .05], rot: [0, 0, 0] } } });
  camH([.5, 1.75, z - 2.6], [0, 1.55, z], [.3, 1.7, z - 2.2], [0, 1.55, z], U(lt, 2.4, eIO), 46); });
E3('S03', 3.37, 'cut', (lt, t) => { // "ที่ไม่มีเจ้าบ่าว" - from behind: no one waiting at the altar
  wedNight(); Wd.hallAt(t); EL({ p: [-.5, .9, -10.7], ry: 0, ex: 'sad' });
  camH([-.2, 2.2, -6.2], [0, 1.8, -12], [-.4, 2.6, -4.8], [0, 1.9, -12], U(lt, 1.4, eOut), 44); tintAt('#101830', .15); });
E3('S04', 4.78, 'cut', (lt, t) => { // "ชุดเจ้าสาวหนึ่งชุด" - slide past the dress
  wedNight(); Wd.hallAt(t); const P = NOOK.localToWorld(V(-2.4, 1.1, -.6));
  camH([-4.2, 2.1, -7.6], [-2.4, 1.8, -11.6], [-1.6, 2.0, -7.4], [-2.4, 1.8, -11.6], U(lt, 1.6, eIO), 46); });
E3('S05', 6.36, 'cut', (lt, t) => { MIND = 0; // "แหวนสองวง" - macro orbit around the rings
  wedNight(); Wd.hallAt(t); const a = lerp(-.5, .4, eIO(lt / 1.3)); const c = V(.18, 1.72, -10.95);
  camH([c.x + Math.sin(a) * 1.0, 2.25, c.z + Math.cos(a) * 1.0], c.toArray(), [c.x + Math.sin(a) * 1.0, 2.25, c.z + Math.cos(a) * 1.0], c.toArray(), 0, 34); dof(.8); }, { noCut: true });
E3('S06', 7.62, 'cut', (lt, t) => { // "และเก้าอี้ว่างอีกหนึ่งตัว" - truck from Elena to the empty chair
  wedNight(); Wd.hallAt(t); EL({ p: [-1.1, 1.35, -10.85], ry: 25, ex: 'sad', sit: true, seat: .5, hL: [-.15, .35, .3], hR: [.15, .35, .3], pL: [-1, -.3, 0], pR: [1, -.3, 0] });
  camH([-1.2, 1.7, -8.0], [-1.0, 1.6, -11], [1.4, 1.6, -8.2], [1.1, 1.4, -11], U(lt, 2.0, eIO), 44); }, { noCut: true });
E3('S07', 9.58, 'dis', (lt, t) => { // "เพราะวันนี้ คือวันที่เธอกับเคลเคยสัญญาว่าจะแต่งงานกัน" - the promise, 100+ years ago
  moonLight(); BALC.visible = true; past(); POST.sat = .55; burnAt(.5 + .1 * Math.sin(t * 2));
  put(K(), BALC, { p: [.25, 0, -1.6], ry: -70, ex: 'happy', blink: blinkAt(t, 1), hL: [-.32, .45, .35], pL: [-1, -.3, 0] }); put(E_(), BALC, { p: [-.55, 0, -1.55], ry: 70, ex: 'happy', blink: blinkAt(t, 2), hR: [.32, .45, .35], pR: [1, -.3, 0] });
  camB([-.2, 1.5, 2.6], [-.15, 1.5, -1.6], [-.15, 1.6, 1.0], [-.15, 1.55, -1.6], U(lt, 4.4, eIO), 44); }, { noCut: true });
E3('S08', 14.12, 'blur', (lt, t) => { // "ทั้งเมืองบอกว่าเขาตายไปแล้ว" - the town square, villagers gossip
  villNight({ hemiI: 1.4 }); VILL.visible = true;
  put(KN(1), VILL, { p: [3.6, 0, 5.4], ry: 60, ex: 'frown', talk: talkAt(t) }); put(KN(2), VILL, { p: [4.6, 0, 6.1], ry: -110, ex: 'sly' }); put(K2_(), VILL, { p: [99, 0, 99], visible: false });
  camV([1.0, 1.6, 9.6], [4.6, 2.0, 4.4], [2.0, 2.4, 10.4], [5.4, 2.6, 3.8], U(lt, 2.1, eIO), 48); });
E3('S09', 16.25, 'blur', (lt, t) => { // "แต่เอเลน่าไม่เคยเชื่อ" - she clutches her ring, determined
  wedNight(); Wd.hallAt(t); EL({ p: [-1.1, 1.35, -10.85], ry: 25, ex: 'determined', sit: true, seat: .5, hL: [-.1, .55, .35], hR: [.1, .55, .35], pL: [-1, -.3, 0], pR: [1, -.3, 0] });
  camH([-.4, 2.1, -9.0], [-1.1, 2.0, -10.85], [-.6, 2.08, -9.5], [-1.1, 2.0, -10.85], U(lt, 1.8, eOut), 40); });
const yearShot = (i, webs, wilt, lit) => (lt, t) => { wedNight(); Wd.hallAt(t); YEAR[i].visible = true; nookAt({ webs, lit }); tintAt(['#0a1020', '#20140a', '#0a0a10'][i], .12 + .06 * Math.sin(t * 9));
  EL({ p: [-.75, .9, -10.3], ry: 15, ex: i === 2 ? 'sad' : 'calm', hL: [-.12, .45, .35], hR: [.12, .45, .35], pL: [-1, -.3, 0], pR: [1, -.3, 0], hold: { R: { obj: bq(wilt), off: [-.06, .05, .05], rot: [0, 0, 0] } } });
  const k = eIO(lt / 1.8); camH([.5 - k * .3, 2.2, -5.4 + k * .6], [.5, 1.85, -10.4], [.5 - k * .3, 2.2, -5.4 + k * .6], [.5, 1.85, -10.4], 0, 56); };
E3('S10', 18.06, 'cut', yearShot(0, 0, 0, 7), { noCut: true });       // "10 ปีผ่านไป"
E3('S11', 19.84, 'cut', yearShot(1, 2, .5, 5), { noCut: true });      // "50 ปีผ่านไป"
E3('S12', 21.60, 'cut', yearShot(2, 3, 1, 3), { noCut: true });       // "จนครบ 100 ปี"
E3('S13', 23.68, 'cut', (lt, t) => { MIND = 0; // "คืนนั้นเธอถอดแหวน วางลงบนโต๊ะ" - close on the hand and the table
  wedNight(); Wd.hallAt(t); nookAt({ webs: 3, lit: 3, ring1: lt > 2.2 }); const k = sstep(.6, 2.2, lt);
  EL({ p: [-.55, .9, -10.6], ry: 40, ex: 'sad', hR: lp([.1, .55, .35], [.32, .48, .5], k), pR: [1, -.3, -.3], hL: [-.25, .35, .2], pL: [-1, 0, -.5] });
  if (lt < 2.2) { RINGH.visible = true; RINGH.position.copy(W(E_(), lp([.1, .58, .38], [.32, .5, .52], k))); RINGH.rotation.x = 1.2; }
  camH([.3, 2.9, -9.0], [.1, 1.7, -10.9], [.25, 2.7, -9.4], [.15, 1.72, -10.9], U(lt, 3.0, eOut), 42); }, { noCut: true });
E3('S14', 26.76, 'cut', (lt, t) => { // "พอแล้ว! ฉันรอมามากพอแล้ว!" - she breaks
  wedNight(); Wd.hallAt(t); nookAt({ webs: 3, lit: 3 }); SH.a = .25; SH.t = t;
  EL({ p: [-.55, .9, -10.6], ry: 20, ex: lt < 1.0 ? 'angry' : 'sad', sweat: true, talk: talkAt(t), pop: popAt(lt, .05, .12), hL: [-.32, .6, .4], hR: [.32, .6, .4], pL: [-1, -.3, -.3], pR: [1, -.3, -.3] });
  camH([.2, 2.05, -8.9], [-.55, 2.0, -10.6], [-.1, 2.0, -9.4], [-.55, 2.0, -10.6], U(lt, 2.7, eOut), 40, -6); });
E3('S15', 29.54, 'cut', (lt, t) => { MIND = 0; // "เธอเป่าเทียนเล่มสุดท้าย" - the last flame goes out
  hallLight({ hemiI: lerp(1.25, .7, sstep(.6, 1.2, lt)), sunI: .3, hemiS: '#7a70b0', fog: '#141022' }); Wd.hallAt(t); nookAt({ webs: 3, lit: lt < .8 ? 1 : 0 });
  if (lt > .8) smokeAt(NOOK.localToWorld(V(Math.cos(0) * .4, 1.0, -.05)), lt - .8, { col: '#c8c0d8', size: .08, life: 1.4 });
  camH([.9, 1.85, -10.5], [.4, 1.65, -11.05], [.75, 1.8, -10.7], [.4, 1.65, -11.05], U(lt, 1.7, eOut), 36); }, { noCut: true });
E3('S16', 31.26, 'cut', (lt, t) => { // "แล้วเดินไปที่ประตู" - into the dark, towards the door
  hallLight({ hemiI: .7, sunI: .3, hemiS: '#7a70b0', fog: '#141022' }); Wd.hallAt(t); nookAt({ webs: 3, lit: 0 }); const z = -9.4 + lt * 1.3;
  EL({ p: [0, 0, z], ry: 0, ex: 'sad', walk: { ph: lt * 6, stride: .16 } }); camH([.6, 1.9, z - 3.2], [0, 1.4, z + 4], [.4, 1.8, z - 2.6], [0, 1.4, z + 4], U(lt, 1.5, eIO), 50); });
E3('S17', 32.78, 'cut', (lt, t) => { // "แต่แล้ว" - she stops
  hallLight({ hemiI: .7, sunI: .3, hemiS: '#7a70b0', fog: '#141022' }); Wd.hallAt(t); EL({ p: [0, 0, -7.3], ry: 0, ex: 'shocked', pop: popAt(lt, .1, .1) });
  camH([.3, 1.55, -4.8], [0, 1.42, -7.3], [.25, 1.55, -5.2], [0, 1.42, -7.3], U(lt, .7, eOut), 42); });
E3('S18', 33.46, 'blur', (lt, t) => { // "ประตูที่ไม่เคยเปิดมา 100 ปี" - the dusty door, light leaks through
  hallLight({ hemiI: .7, sunI: .3, hemiS: '#7a70b0', fog: '#141022' }); Wd.hallAt(t); Wd.raysAt(HALL.localToWorld(V(0, 0, 9.4)), .35 + .3 * sstep(1.2, 2.1, lt), t, '#fff2c0'); pts0(HALL.localToWorld(V(0, 2.5, 6)), 30);
  camH([.8, 2.0, 2.4], [0, 2.4, 8.6], [.3, 2.2, 4.6], [0, 2.4, 8.6], U(lt, 2.1, eIO), 46); });
E3('S19', 35.60, 'cut', (lt, t) => { // "ก็ถูกผลักออก" - the doors swing, light and dust pour in
  hallLight({ hemiI: .9 }); Wd.hallAt(t); doorAt(sstep(0, .7, lt)); Wd.raysAt(HALL.localToWorld(V(0, 0, 8.2)), 1, t, '#fff2c0'); tintAt('#fff4d8', .35 * Math.max(0, 1 - Math.abs(lt - .4) * 3));
  dustAt(HALL.localToWorld(V(0, .2, 8)), lt / 1.1, 1.6); SH.a = lt < .5 ? .3 : 0; SH.t = t; pts0(HALL.localToWorld(V(0, 2.5, 6)), 40);
  camH([0, 1.8, 1.2], [0, 2.5, 8.6], [0, 1.7, 2.2], [0, 2.5, 8.6], U(lt, 1.15, eOut), 52); });
E3('S20', 36.75, 'cut', (lt, t) => { // "ชายคนหนึ่งยืนอยู่ตรงนั้น" - a silhouette in the light
  hallLight({ hemiI: .9 }); Wd.hallAt(t); doorAt(1); Wd.raysAt(HALL.localToWorld(V(0, 0, 8.2)), 1, t, '#fff2c0'); Wd.fogAt(HALL.localToWorld(V(0, 0, 7.6)), t, .8, '#fff0d0', 3);
  put(K2_(), HALL, { p: [0, 0, 8.3], ry: 180, ex: 'calm', blink: blinkAt(t, 1) }); EL({ p: [-1.0, 0, 4.6], ry: 10, ex: 'shocked' }); pts0(HALL.localToWorld(V(0, 2.5, 6)), 40);
  camH([-.6, 1.6, 1.0], [-.1, 1.8, 8.3], [-.4, 1.55, 1.8], [-.1, 1.8, 8.3], U(lt, 1.9, eIO), 46); });
E3('S21', 38.63, 'cut', (lt, t) => { // "เสื้อขาด ตัวเปื้อนฝุ่น" - tilt down the dusty traveller
  hallLight({ hemiI: 1.0 }); Wd.hallAt(t); doorAt(1); Wd.raysAt(HALL.localToWorld(V(0, 0, 8.2)), .8, t, '#fff2c0'); POST.sat = .8;
  put(K2_(), HALL, { p: [0, 0, 7.4], ry: 180, ex: 'calm', blink: blinkAt(t, 1) }); for (let i = 0; i < 4; i++) smokeAt(HALL.localToWorld(V((i - 1.5) * .25, .9 + (i % 2) * .4, 7.2)), (lt * .8 + i * .3) % 1.6, { col: '#b8a888', size: .35, life: 1.6 });
  camH([.3, 2.0, 5.6], [0, 1.9, 7.4], [.3, 1.2, 5.4], [0, .9, 7.4], U(lt, 2.3, eIO), 42); }, { noCut: true });
E3('S22', 40.93, 'cut', (lt, t) => { // "แต่รอยยิ้มนั้น ยังเหมือนเดิม" - the smile
  hallLight({ hemiI: 1.1 }); Wd.hallAt(t); doorAt(1); Wd.raysAt(HALL.localToWorld(V(0, 0, 8.2)), .7, t, '#fff2c0');
  put(K2_(), HALL, { p: [0, 0, 7.0], ry: 180, ex: lt > .5 ? 'happy' : 'calm', pop: popAt(lt, .5, .06), blink: false });
  camH([-.35, 1.5, 5.3], [0, 1.45, 7.0], [-.2, 1.47, 5.8], [0, 1.45, 7.0], U(lt, 2.3, eOut), 40); }, { noCut: true });
E3('S23', 43.26, 'cut', (lt, t) => { // "ขอโทษที่มาสาย... เจ้าสาวของฉัน" - over Elena's shoulder
  hallLight({ hemiI: 1.1 }); Wd.hallAt(t); doorAt(1); Wd.raysAt(HALL.localToWorld(V(0, 0, 8.2)), .6, t, '#fff2c0');
  put(K2_(), HALL, { p: [0, 0, 6.2], ry: 180, ex: 'happy', talk: talkAt(t), hR: [.25, .55, .35], pR: [1, -.3, -.3] }); EL({ p: [-.5, 0, 4.4], ry: 10, ex: 'shocked' });
  camH([-2.0, 1.75, 2.4], [0, 1.5, 6.2], [-1.8, 1.72, 2.8], [0, 1.5, 6.2], U(lt, 2.5, eIO), 42); });
E3('S24', 45.79, 'cut', (lt, t) => { // "น้ำตาของเอเลน่าไหลไม่หยุด"
  hallLight({ hemiI: 1.1 }); Wd.hallAt(t); EL({ p: [-.5, 0, 4.4], ry: 5, ex: 'sad', sweat: true, blink: blinkAt(t, 3) });
  debrisAt(W(E_(), [.12, 1.05, .45]), (lt * .9) % 1, { n: 3, seed: Math.floor(lt * .9) + 1, speed: .3, kind: 'spark', col: '#bfe6ff', grav: 2.2, life: 1 });
  camH([-.6, 1.5, 6.6], [-.5, 1.48, 4.4], [-.55, 1.48, 6.0], [-.5, 1.48, 4.4], U(lt, 2.0, eOut), 40); }, { noCut: true });
E3('S25', 47.81, 'cut', (lt, t) => { // "เคล... นายกลับมาจริงๆ เหรอ?"
  hallLight({ hemiI: 1.1 }); Wd.hallAt(t); EL({ p: [-.5, 0, 4.4 + sstep(.4, 1.6, lt) * .5], ry: 5, ex: 'sad', sweat: true, talk: talkAt(t), walk: lt < 1.6 ? { ph: lt * 5, stride: .1 } : undefined });
  put(K2_(), HALL, { p: [0, 0, 6.2], ry: 185, ex: 'happy' });
  camH([1.3, 1.7, 7.8], [-.4, 1.45, 4.6], [1.0, 1.68, 7.2], [-.4, 1.45, 4.8], U(lt, 2.4, eIO), 42); });
E3('S26', 50.27, 'cut', (lt, t) => { // "ฉันบอกแล้วไง ว่าฉันจะกลับมา"
  hallLight({ hemiI: 1.1 }); Wd.hallAt(t); put(K2_(), HALL, { p: [0, 0, 6.2], ry: 185, ex: 'happy', talk: talkAt(t), blink: blinkAt(t, 1) });
  camH([-.3, 1.5, 4.4], [0, 1.45, 6.2], [-.2, 1.47, 4.9], [0, 1.45, 6.2], U(lt, 2.4, eOut), 40); }, { noCut: true });
E3('S27', 52.73, 'dis', (lt, t) => { // "เวท ZERO ไม่ได้ทำลายวิญญาณของเขา" - inside the white light
  cryptLight(); CRYPT.visible = true; CR.demon.visible = false; tintAt('#ffffff', .55 - .2 * sstep(1.5, 2.7, lt)); Wd.rocksAt(CRYPT.localToWorld(V(0, 0, -6)), t, 1);
  put(K2_(), CRYPT, { p: [0, 1.0 + Math.sin(t * 1.2) * .1, -6], ry: 0, ex: 'sleepy', blink: true, hL: [-.4, .5, .1], hR: [.4, .5, .1], pL: [-1, 0, -.5], pR: [1, 0, -.5] });
  runesAt(CRYPT.localToWorld(V(0, 1, -6)), t, .9, { col: '#ffffff', col2: '#ffffff', n: 16, w: 420, h: 600 });
  camC([1.5, 2.0, -1.2], [0, 2.2, -6], [.6, 2.4, -2.6], [0, 2.3, -6], U(lt, 2.8, eIO), 46); });
E3('S28', 55.50, 'dis', (lt, t) => { // "มันส่งเขาไปติดอยู่ระหว่างความเป็นกับความตาย" - limbo
  cryptLight(); CRYPT.visible = true; CR.demon.visible = false; POST.sat = .45; Wd.fogAt(CRYPT.localToWorld(V(0, 0, -6)), t, 1, '#6a5a8a', 9); Wd.rocksAt(CRYPT.localToWorld(V(0, 0, -7)), t, 1); tintAt('#1a1030', .25);
  put(K2_(), CRYPT, { p: [0, .2, -6], ry: 20, ex: 'worried', blink: blinkAt(t, 2) });
  camC([4.0, 3.2, 0.5], [0, 1.4, -6], [2.6, 2.4, -1.8], [0, 1.5, -6], U(lt, 3.4, eIO), 50); });
E3('S29', 58.88, 'cut', (lt, t) => { // "และเขาใช้เวลา 100 ปี เดินหาทางกลับมาหาเธอ" - the long walk towards a far light
  cryptLight(); CRYPT.visible = true; CR.demon.visible = false; POST.sat = .55; const x = -3 + lt * .9; Wd.fogAt(CRYPT.localToWorld(V(0, 0, -6)), t, 1, '#6a5a8a', 9);
  Wd.raysAt(CRYPT.localToWorld(V(5.5, 0, -8)), .8, t, '#fff2c0'); put(K2_(), CRYPT, { p: [x, 0, -6.5], ry: 70, ex: 'determined', walk: { ph: lt * 6, stride: .2 } });
  camC([x - .6, 1.4, -2.4], [x + .4, 1.4, -6.5], [x - .2, 1.5, -2.6], [x + .6, 1.4, -6.5], U(lt, 4.0, eIO), 48); }, { noCut: true });
E3('S30', 62.85, 'blur', (lt, t) => { // "เขาหยิบแหวนบนโต๊ะ แล้วสวมให้เธออีกครั้ง"
  wedNight(); Wd.hallAt(t); NOOK.visible = false; const k = sstep(1.2, 2.4, lt);
  put(K2_(), HALL, { p: [.45, .9, -10.4], ry: -80, ex: 'happy', hR: lp([.3, .45, .3], [.25, .55, .5], k), pR: [1, -.3, -.3] });
  EL({ p: [-.45, .9, -10.4], ry: 80, ex: k > .7 ? 'happy' : 'sad', sweat: k < .7, hL: [-.2, .5, .45], pL: [-1, -.3, -.3] });
  RINGH.visible = true; RINGH.position.copy(W(K2_(), lp([.3, .48, .33], [.25, .58, .53], k))); if (k > .9) sparkAt(RINGH.position.clone(), .8, .6);
  camH([0, 2.0, -7.2], [0, 1.85, -10.4], [0, 1.95, -8.0], [0, 1.85, -10.4], U(lt, 2.9, eOut), 42); }, { noCut: true });
E3('S31', 65.75, 'cut', (lt, t) => { // "คืนนั้น งานแต่งงานที่ไม่เคยมีเจ้าบ่าว" - every candle burns again
  wedNight(); Wd.hallAt(t); nookAt({ webs: 0, lit: 7 }); Wd.raysAt(HALL.localToWorld(V(0, 0, -11)), .5, t, '#ffe0a0');
  put(K2_(), HALL, { p: [.4, .3, -10.0], ry: -20, ex: 'happy', hL: [-.3, .45, .3], pL: [-1, -.3, 0] }); EL({ p: [-.4, .3, -10.0], ry: 20, ex: 'happy', hR: [.3, .45, .3], pR: [1, -.3, 0] });
  debrisAt(HALL.localToWorld(V(0, 5, -9)), (lt * .5) % 1, { n: 22, seed: 4, speed: .6, kind: 'leaf', col: '#f2a0b8', grav: 1.2, life: 3 });
  camH([0, 1.7, -4.4], [0, 1.6, -10.4], [0, 1.9, -6.6], [0, 1.7, -10.4], U(lt, 3.1, eIO), 46); }, { noCut: true });
E3('S32', 68.90, 'cut', (lt, t) => { // "ได้มีเจ้าบ่าวเป็นครั้งแรก" - crane up over the couple
  wedNight(); Wd.hallAt(t); nookAt({ webs: 0, lit: 7 }); Wd.raysAt(HALL.localToWorld(V(0, 0, -11)), .8, t, '#ffe0a0');
  put(K2_(), HALL, { p: [.4, .3, -10.0], ry: -20, ex: 'happy' }); EL({ p: [-.4, .3, -10.0], ry: 20, ex: 'happy', blink: true });
  debrisAt(HALL.localToWorld(V(0, 5, -10)), (lt * .5 + .4) % 1, { n: 22, seed: 6, speed: .6, kind: 'leaf', col: '#f2a0b8', grav: 1.2, life: 3 });
  camH([0, 2.0, -6.6], [0, 1.5, -10.0], [0, 6.5, -5.0], [0, 1.0, -10.0], U(lt, 1.95, eIO), 48); }, { noCut: true });
E3('S33', 70.84, 'dis', (lt, t) => { // "และครั้งนี้ ไม่มีใครพรากพวกเขาจากกันได้อีก" - the balcony under the moon, pull back to the sky
  moonLight(); BALC.visible = true; put(K2_(), BALC, { p: [.15, 0, -1.9], ry: 160, ex: 'happy', hL: [-.32, .4, .2], pL: [-1, -.3, 0] }); put(E_(), BALC, { p: [-.55, 0, -1.9], ry: 200, ex: 'happy', hR: [.32, .4, .2], pR: [1, -.3, 0] });
  camB([-.2, 1.6, 1.6], [-.2, 1.6, -1.9], [-.2, 3.6, 3.8], [3, 14, -40], U(lt, 4.4, eIO), 46); }, { noCut: true });

// =====================================================================
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
