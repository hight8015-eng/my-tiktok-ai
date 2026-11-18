// shots.js: THE LAST VILLAIN ep 2 "เวทสุดท้าย" (61.0 s) - times are real seconds (voice already sped up); animation clocks run SP x
import { THREE, scene, camera, clamp, lerp, sstep, eIO, eOut, eIn, eSine, D2R, noise1, rng, POST, mesh, rbox, toon, basic, group } from './engine.js';
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
const ampl = (p0, p1) => [p0.map((v, i) => (v + p1[i]) / 2 + (v - (v + p1[i]) / 2) * CAMX), p1.map((v, i) => (v + p0[i]) / 2 + (v - (v + p0[i]) / 2) * CAMX)];
const camO = (o) => (p0, t0, p1, t1, u, fov = 40, roll = 0) => { const [q0, q1] = ampl(p0, p1); look(V(...hup(lp(q0, q1, u))).add(o.position), V(...hup(lp(t0, t1, u))).add(o.position), fov, roll); };
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
function coverage(sh, ltR) { // v4.27: one clear change of angle per long shot - a close-up on the main character from ~30 deg to the same side, about 2x closer.
  // (small punch-ins of the same framing read as skipped frames / jump cuts, so they are not used)
  const i = SHOTS.indexOf(sh), nx = SHOTS[i + 1], d = (nx ? nx.t0 : 61.0) - sh.t0; if (sh.noCut || d < 2.6 || ltR < d * .55) return;
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
// ===================== EP2 set pieces =====================
const K2_ = () => CHARS.kael2;   // Kael reborn: the village boy with the red eyes
const PR = Wd.PROP;
// cathedral door at the entrance (blows open)
const DOOR = group({ p: [0, 0, 8.6], parent: HALL }); { const st = toon('#5a5470'); for (const s of [-1, 1]) mesh(rbox(1.2, 5.6, .6), st, { p: [s * 2.2, 2.8, .1], parent: DOOR }); mesh(rbox(5.6, 1.4, .6), st, { p: [0, 4.9, .1], parent: DOOR });
  mesh(rbox(12, 12, .4), toon('#ffffff', { map: null }), { p: [0, 6, .5], s: [1, 1, 1], parent: DOOR }).visible = false;
  const sky = mesh(new THREE.PlaneGeometry(3.4, 4.3), basic('#fff4dc'), { p: [0, 2.1, .7], r: [0, 180, 0], parent: DOOR, cast: false }); sky.userData.noInk = true; sky.material.side = THREE.DoubleSide;
  DOOR.userData.leaves = [-1, 1].map(s => { const g = group({ p: [s * 1.6, 0, -.25], parent: DOOR }); mesh(rbox(1.6, 4.2, .18), toon('#6a3e26'), { p: [-s * .8, 2.1, 0], parent: g });
    for (const y of [1.0, 3.2]) mesh(rbox(1.5, .12, .22), toon('#3a3040'), { p: [-s * .8, y, 0], parent: g }); return g; }); }
function doorAt(k) { DOOR.userData.leaves.forEach((g, i) => { const s = i ? 1 : -1; g.rotation.y = s * k * 2.2; g.position.z = .1 - k * 1.2; }); }
// magic chains from the pillars to Elena on the altar steps
const CHAINS = group({ parent: HALL }); { const E0 = V(0, 1.55, -11.6);
  for (const [x, y, z] of [[-3.4, 4.6, -9.6], [3.4, 4.6, -9.6], [-3.4, 3.2, -13], [3.4, 3.2, -13]]) { const g = group({ parent: CHAINS }), A = V(x, y, z), n = 16;
    for (let k = 0; k <= n; k++) { const p = A.clone().lerp(E0, k / n); p.y -= Math.sin(k / n * Math.PI) * .35; mesh(new THREE.TorusGeometry(.07, .022, 6, 10), basic('#c8a0ff'), { p: p.toArray(), r: [0, k % 2 ? 90 : 0, Math.atan2(E0.y - A.y, E0.x - A.x) * 57], parent: g, cast: false }); }
    g.children.forEach(m => { m.userData.noInk = true; }); } CHAINS.visible = false; }
function chainsOn(k) { CHAINS.visible = true; CHAINS.children.forEach((g, i) => { g.visible = k * 4 <= i + .5 ? true : false; }); }   // k 0..1: chains snap one by one
// ruins after ZERO: fallen pillars, rubble, sunlight
const RUIN = group({ parent: HALL }); { const R = rng(51);
  for (const [x, z, r] of [[-2.2, -4, 70], [2.6, -7.5, -60], [-1.4, 1.5, 100]]) mesh(new THREE.CylinderGeometry(.42, .5, 6, 14), toon('#8a86a0'), { p: [x, .45, z], r: [90, r, 0], parent: RUIN });
  for (let i = 0; i < 40; i++) mesh(new THREE.DodecahedronGeometry(.15 + R() * .35, 0), toon('#7a7690'), { p: [(R() - .5) * 9, .1, -12 + R() * 16], r: [R() * 90, R() * 90, 0], parent: RUIN });
  RUIN.visible = false; }
// the ring left on the floor
const RING = group({ p: [.4, .06, -9.4], parent: HALL }); { const r = mesh(new THREE.TorusGeometry(.12, .03, 10, 28), toon('#e2b23c', { emissive: '#e2b23c', ei: .35 }), { r: [80, 0, 0], parent: RING });
  const j = mesh(new THREE.OctahedronGeometry(.05, 0), basic('#ff2040'), { p: [0, .02, .12], parent: RING }); j.userData.noInk = true; RING.visible = false; }
// a white dome for ZERO over the capital
const DOME = mesh(new THREE.SphereGeometry(1, 40, 24), basic('#ffffff', { transparent: true, opacity: .0, add: true, depthWrite: false }), { parent: FIELD, cast: false }); DOME.userData.noInk = true;
const SPELL = ['#ff3a2a', '#7a2aff', '#3ab0ff', '#ffd23a', '#3aff8a', '#ff3ad8', '#ffffff'];
function ep2Reset() { DOOR.visible = true; doorAt(0); CHAINS.visible = false; RUIN.visible = false; RING.visible = false; DOME.material.opacity = 0; DOME.visible = false; HA.glass.visible = true;
  Wd.cracksAt(0, [0, 0, 0], 0); Wd.cracksAt(1, [0, 0, 0], 0); Wd.raysAt([0, 0, 0], 0); Wd.fogAt([0, 0, 0], 0, 0); Wd.rocksAt([0, 0, 0], 0, 0); }
const E2 = (id, t0, tr, fn, o) => S(id, t0, tr, (lt, t) => { ep2Reset(); fn(lt, t); }, o);
const ruinLight = () => hallLight({ hemiI: 2.2, sunI: 1.6, hemiS: '#e8e0ff', fog: '#8a84a8' });
const W2 = (C, v) => W(C, v);

// ===================== EP2 SHOTS (real seconds) =====================
E2('S01', 0, 'cut', (lt, t) => { // "กลางพิธีหมั้นของเจ้าหญิง" - push in on the ceremony
  hallLight(); Wd.hallAt(t, { circle: .3 }); CHAINS.visible = false;
  put(E_(), HALL, { p: [-.45, .9, -11.6], ry: 10, ex: 'sad', blink: blinkAt(t, 2) }); put(L(), HALL, { p: [.75, .9, -11.55], ry: -15, ex: 'calm', blink: blinkAt(t, 1) });
  put(A(), HALL, { p: [0, .9, -13.1], ry: 0, ex: 'sly', hL: [-.3, .7, .4], hR: [.3, .7, .4], pL: [-1, -.3, 0], pR: [1, -.3, 0] });
  camH([0, 2.6, -3.0], [0, 1.7, -12], [0, 2.0, -7.6], [0, 1.85, -12], U(lt, 2.2, eIO), 44); });
E2('S02', 2.02, 'whip', (lt, t) => { // "ประตูมหาวิหารก็ระเบิดออก"
  hallLight(); Wd.hallAt(t); const k = sstep(.15, .45, lt); doorAt(k); const P = HALL.localToWorld(V(0, 1.8, 8.4));
  impactAt(P, (lt - .15) / .5, 1.6); shockAt(HALL.localToWorld(V(0, .1, 8)), (lt - .15) / .7, 1.4, '#ffd0a0');
  for (let i = 0; i < 6; i++) smokeAt(P.clone().add(V((i - 2.5) * .6, -.8 + (i % 2) * .5, -.5)), lt - .2 - i * .04, { size: 1.6, life: 3 });
  debrisAt(P, lt - .15, { n: 24, seed: 3, speed: 9, kind: 'rock', size: .2 }); SH.a = lt > .15 && lt < .9 ? 1 : 0; SH.t = t; tintAt('#ffe0b0', .5 * Math.max(0, 1 - Math.abs(lt - .2) * 5));
  camH([1.2, 1.2, 1.5], [0, 2.2, 8.6], [.5, 1.0, 2.6], [0, 2.4, 8.6], U(lt, 2.4, eOut), 52); });
E2('S03', 4.41, 'cut', (lt, t) => { // "เอเลน่าถูกล่ามด้วยโซ่เวทมนตร์บนแท่นบูชา" - crane up from the chains to her face
  hallLight(); Wd.hallAt(t, { circle: .7 }); chainsOn(0);
  put(E_(), HALL, { p: [0, .9, -11.6], ry: 0, ex: 'scared', sweat: true, hL: [-.62, .78, .1], hR: [.62, .78, .1], pL: [-1, -.3, -.3], pR: [1, -.3, -.3] });
  put(A(), HALL, { p: [1.6, .6, -12.4], ry: -40, ex: 'evil', hR: [.32, .7, .3], pR: [1, -.3, -.3], hold: { R: { obj: (STAFF.visible = true, STAFF), off: [0, -.02, 0], rot: [0, 0, 0] } } });
  runesAt(HALL.localToWorld(V(0, .95, -11.6)), t, .9, { col: '#a050ff', col2: '#e8d0ff', n: 14, w: 300, h: 380 });
  camH([.6, 1.0, -8.6], [0, 1.2, -11.6], [.4, 2.2, -8.4], [0, 2.0, -11.6], U(lt, 3.3, eIO), 46); });
E2('S04', 7.76, 'blur', (lt, t) => { // "เหนือหัวเธอ เทพปีศาจกำลังลืมตา" - the eyes open in the dark
  cryptLight(); CRYPT.visible = true; Wd.cryptAt(t, sstep(.9, 2.4, lt)); tintAt('#300010', .25); Wd.fogAt(CRYPT.localToWorld(V(0, 0, -9)), t, .9, '#6a3a6a', 8);
  camC([0, 5.5, 6], [0, 9.0, -11], [0, 7.2, 2.5], [0, 9.6, -11], U(lt, 3.2, eOut), 50); });
E2('S05', 10.96, 'blur', (lt, t) => { // "แล้วชายคนหนึ่งก็เดินฝ่ากลุ่มควันเข้ามา" - tracking back as he walks out of the smoke
  hallLight(); Wd.hallAt(t); doorAt(1); const z = 7.6 - lt * 1.1;
  put(K2_(), HALL, { p: [0, 0, z], ry: 180, ex: 'sly', eyeC: '#ff2030', walk: { ph: lt * 7, stride: .2 }, blink: false });
  for (let i = 0; i < 7; i++) smokeAt(HALL.localToWorld(V((i - 3) * .8 + (i < 3 ? -.9 : .9), .05, 8.6 + (i % 2) * .6)), 1.2 + lt * .8 + i * .1, { size: .9, life: 4 });
  camH([.8, .9, z - 3.8], [0, 1.75, z], [-.4, 1.1, z - 3.0], [0, 1.8, z], U(lt, 2.7, eIO), 50); }, { noCut: true });
E2('S06', 14.16, 'cut', (lt, t) => { // "ขอโทษที่มาช้า... เจ้าหญิง" - slow push to the smirk
  hallLight(); Wd.hallAt(t); doorAt(1); put(K2_(), HALL, { p: [0, 0, 5.4], ry: 180, ex: 'smug', eyeC: '#ff2030', talk: talkAt(t), blink: false, ...hip });
  Wd.fogAt(HALL.localToWorld(V(0, 0, 6.5)), t, .7, '#b8b0d8', 4);
  camH([-.5, 1.5, 2.6], [0, 1.42, 5.4], [-.2, 1.45, 3.6], [0, 1.42, 5.4], U(lt, 2.3, eOut), 44); });
E2('S07', 16.46, 'cut', (lt, t) => { // "ลูเซียนหน้าซีด ดาบในมือสั่น"
  hallLight(); Wd.hallAt(t); SWORD.visible = true; const sh = Math.sin(t * 60) * 6;
  put(L(), HALL, { p: [.75, .6, -11.0], ry: 180, ex: 'scared', sweat: true, hR: [.3, .5, .3], pR: [1, -.3, -.3], hold: { R: { obj: SWORD, off: [0, -.01, .02], rot: [40 + sh, sh * .5, 0], mass: .4 } } });
  camH([1.3, 2.05, -13.8], [.75, 2.0, -11.0], [1.0, 2.0, -13.0], [.75, 2.0, -11.0], U(lt, 2.5, eOut), 44); });
E2('S08', 19.35, 'cut', (lt, t) => { // "เป็นไปไม่ได้... ข้าฆ่าเจ้าไปแล้ว" - over Kael's shoulder
  hallLight(); Wd.hallAt(t); SWORD.visible = true;
  put(L(), HALL, { p: [.75, .6, -11.0], ry: 180, ex: 'angry', talk: talkAt(t), sweat: true, hR: [.35, .62, .45], pR: [1, -.3, -.3], hold: { R: { obj: SWORD, off: [0, -.01, .02], rot: [85, 0, 0], mass: .4 } } });
  put(K2_(), HALL, { p: [-.2, 0, -7.6], ry: 170, ex: 'calm', eyeC: '#ff2030', ...hip });
  camH([-1.8, 2.1, -4.6], [.6, 1.7, -11], [-1.5, 2.0, -5.4], [.7, 1.7, -11], U(lt, 2.3, eIO), 40); });
E2('S09', 21.97, 'cut', (lt, t) => { // "เขาไม่แม้แต่จะหันไปมอง" - he walks straight past Lucien
  hallLight(); Wd.hallAt(t); SWORD.visible = true; const z = -8.2 - lt * .9;
  put(L(), HALL, { p: [1.4, .3, -10.4], ry: -110, ex: 'shocked', hR: [.35, .55, .4], pR: [1, -.3, -.3], hold: { R: { obj: SWORD, off: [0, -.01, .02], rot: [70, 0, 0] } } });
  put(K2_(), HALL, { p: [0, Math.max(0, (-z - 10.7) * .25), z], ry: 180, ex: 'calm', eyeC: '#ff2030', walk: { ph: lt * 7, stride: .2 } });
  camH([3.4, 1.6, -7.2], [0, 1.4, z], [3.0, 1.7, -8.4], [0, 1.4, z - .5], U(lt, 2.1, eIO), 48); });
E2('S10', 24.02, 'cut', (lt, t) => { // "แค่ดีดนิ้ว" - the snap
  hallLight(); Wd.hallAt(t); const k = sstep(.25, .45, lt);
  put(K2_(), HALL, { p: [0, .3, -10.2], ry: 180, ex: k > .5 ? 'evil' : 'sly', eyeC: '#ff2030', ...flick(k), fast: true }); const h = W2(K2_(), [.62, .8, .55]);
  if (lt > .4) { sparkAt(h, 1, 1.3); shockAt(h, (lt - .4) / .6, .5, '#ff5070'); }
  camH([-.9, 1.7, -11.8], [.3, 1.55, -10.2], [-.6, 1.65, -11.4], [.3, 1.55, -10.2], U(lt, 1.3, eOut), 40); });
E2('S11', 25.35, 'cut', (lt, t) => { // "โซ่ทุกเส้นก็ขาดสะบั้น" - chains burst, she drops free
  hallLight(); Wd.hallAt(t, { circle: .6 * (1 - lt) }); const k = sstep(0, .8, lt); chainsOn(k);
  put(E_(), HALL, { p: [0, .9 - sstep(.7, 1.1, lt) * .15, -11.6], ry: 0, ex: k > .9 ? 'shocked' : 'scared', hL: lp([-.62, .78, .1], [-.3, .35, .1], sstep(.7, 1.1, lt)), hR: lp([.62, .78, .1], [.3, .35, .1], sstep(.7, 1.1, lt)), pL: [-1, -.3, -.3], pR: [1, -.3, -.3] });
  for (let i = 0; i < 4; i++) if (lt > i * .2) sparkAt(HALL.localToWorld(V(i % 2 ? 1.2 : -1.2, i < 2 ? 2.8 : 2.2, -11.4)), Math.max(0, 1 - (lt - i * .2) * 3), 1.1);
  camH([0, 1.6, -7.6], [0, 1.7, -11.6], [0, 1.6, -8.6], [0, 1.7, -11.6], U(lt, 2.2, eIO), 48); });
E2('S12', 27.54, 'cut', (lt, t) => { // "แต่ทุกอย่างสายไปแล้ว" - red cracks race across the floor
  hallLight(); Wd.hallAt(t, { circle: 1 }); Wd.cracksAt(0, HALL.localToWorld(V(0, 0, -10.5)), lt / 1.4, 11); tintAt('#400010', .25 * sstep(.2, 1.4, lt)); SH.a = .25; SH.t = t;
  put(E_(), HALL, { p: [-.6, .6, -11.2], ry: 20, ex: 'scared' }); put(K2_(), HALL, { p: [.5, .6, -11.0], ry: -20, ex: 'shocked', eyeC: '#ff2030' });
  camH([0, 5.5, -5.6], [0, .4, -10.8], [0, 4.4, -6.6], [0, .6, -10.8], U(lt, 1.6, eOut), 50); });
E2('S13', 29.10, 'blur', (lt, t) => { // "เทพปีศาจตื่นขึ้นเต็มตัว" - crane up the waking giant
  cryptLight(); CRYPT.visible = true; Wd.cryptAt(t, 1); tintAt('#400010', .3); SH.a = .4 * (1 - sstep(1, 2, lt)); SH.t = t; Wd.cracksAt(1, CRYPT.localToWorld(V(0, 0, -9)), 1.2, 14);
  Wd.rocksAt(CRYPT.localToWorld(V(0, 0, -7)), t, sstep(0, 1, lt));
  camC([2.5, 1.2, 2.0], [0, 6, -12], [1.2, 4.5, -.5], [0, 9.5, -12], U(lt, 2.1, eIO), 52); });
E2('S14', 31.19, 'blur', (lt, t) => { // "เขาปล่อยเวทต้องห้ามทีละบท" - spells fly in different colours
  hallLight(); Wd.hallAt(t); const i = Math.min(6, Math.floor(lt * 2.6)), c = SPELL[i];
  put(K2_(), HALL, { p: [0, .6, -10.6], ry: 180, ex: 'angry', eyeC: '#ff2030', hR: [.4, .95, .55], pR: [1, -.3, -.3], hL: [-.4, .9, .5], pL: [-1, -.3, -.3] });
  const h = W2(K2_(), [.4, .95, .6]); beamAt(h, HALL.localToWorld(V(-.6, 9, -15)), t, 1, c); tintAt(c, .12); SH.a = .3; SH.t = t;
  camH([2.6, 1.0, -12.4], [0, 2.0, -10.6], [2.2, 1.1, -12.8], [0, 2.3, -10.6], U(lt, 1.9, eIO), 56); });
E2('S15', 33.02, 'whip', (lt, t) => { // "จนครบทั้ง 7" - seven hits on the demon
  cryptLight(); CRYPT.visible = true; Wd.cryptAt(t, 1); const i = Math.min(6, Math.floor(lt * 6)), u = (lt * 6) % 1;
  impactAt(CRYPT.localToWorld(V((i - 3) * .9, 6 + (i % 3) * 1.5, -9.5)), u, 1.4); tintAt(SPELL[i], .25 * (1 - u)); SH.a = .5; SH.t = t;
  camC([0, 4, 2], [0, 8, -12], [0, 5, 0], [0, 8.5, -12], U(lt, 1.2, eIO), 54); });
E2('S16', 34.18, 'blur', (lt, t) => { // "มหาวิหารพังทลาย" - stones fall, glass shatters
  hallLight({ hemiI: 1.4 }); Wd.hallAt(t); SH.a = .9; SH.t = t; RUIN.visible = lt > 1.2;
  for (let k = 0; k < 3; k++) debrisAt(HALL.localToWorld(V((k - 1) * 3, 9, -8 - k * 2)), lt - k * .25, { n: 16, seed: 5 + k, speed: 2, kind: 'rock', size: .35, grav: 9.8 });
  debrisAt(HALL.localToWorld(V(0, 7.2, -16)), lt - .3, { n: 26, seed: 9, speed: 5, kind: 'spark', col: '#9ad0ff', grav: 6 }); dustAt(HALL.localToWorld(V(0, .2, -8)), (lt - .6) / 1.2, 2.6);
  camH([2.4, 1.2, -2.0], [0, 4.5, -12], [1.6, 1.5, -4.0], [0, 4.2, -12], U(lt, 2.1, eIO), 56); });
E2('S17', 36.23, 'whip', (lt, t) => { // "แต่เทพปีศาจไม่มีแม้แต่รอยขีดข่วน" - smoke clears, not a scratch
  cryptLight(); CRYPT.visible = true; Wd.cryptAt(t, 1); for (let i = 0; i < 6; i++) smokeAt(CRYPT.localToWorld(V((i - 2.5) * 1.6, 5 + (i % 2) * 2, -8)), 1.4 + lt * .9, { size: 3, life: 3.4 });
  camC([-2.5, 7.5, 4], [0, 9.6, -11], [-1.2, 8.2, 1.5], [0, 9.8, -11], U(lt, 3.2, eOut), 46); });
E2('S18', 39.39, 'blur', (lt, t) => { // "เหลืออยู่ทางเดียว"
  hallLight(); Wd.hallAt(t); RUIN.visible = true; put(K2_(), HALL, { p: [0, .6, -10.6], ry: 180, ex: 'determined', eyeC: '#ff2030', blink: false, ...hip });
  camH([.3, 1.9, -12.6], [0, 1.85, -10.6], [.15, 1.85, -12.0], [0, 1.85, -10.6], U(lt, 1.4, eOut), 38); });
E2('S19', 40.79, 'cut', (lt, t) => { // "เขาหันมายิ้มให้เอเลน่า" - over Elena's shoulder
  hallLight(); Wd.hallAt(t); RUIN.visible = true; put(E_(), HALL, { p: [-.4, .6, -11.4], ry: 30, ex: 'sad', blink: blinkAt(t, 2) });
  put(K2_(), HALL, { p: [.6, .6, -10.4], ry: lerp(160, 230, sstep(0, .8, lt)), ex: lt > .6 ? 'happy' : 'determined', eyeC: '#ff2030', pop: popAt(lt, .7, .08) });
  camH([-1.3, 2.0, -13.4], [.6, 1.85, -10.4], [-1.0, 1.95, -13.0], [.6, 1.85, -10.4], U(lt, 1.9, eIO), 46); });
E2('S20', 42.68, 'dis', (lt, t) => { // "ยิ้มแบบที่เธอจำได้ดี" - a flash of the old smile, 100 years ago
  moonLight(); BALC.visible = true; past(); POST.sat = .5; burnAt(.55); put(K(), BALC, { p: [.3, 0, -1.6], ry: 20, ex: 'happy', blink: blinkAt(t, 1), ...hip });
  camB([-.6, 1.75, .9], [.3, 1.75, -1.6], [-.3, 1.75, .3], [.3, 1.75, -1.6], U(lt, 1.9, eOut), 40); });
E2('S21', 44.60, 'dis', (lt, t) => { // "ยิ้มก่อนเขาจะทำเรื่องบ้าๆ" - the same grin, now
  hallLight(); Wd.hallAt(t); RUIN.visible = true; put(K2_(), HALL, { p: [.6, .6, -10.4], ry: 230, ex: 'smug', eyeC: '#ff2030', blink: false, ...hip });
  camH([-.6, 1.8, -12.0], [.6, 1.75, -10.4], [-.3, 1.78, -11.5], [.6, 1.75, -10.4], U(lt, 2.0, eOut), 38); });
E2('S22', 46.66, 'cut', (lt, t) => { // "รอฉันนะ"
  hallLight(); Wd.hallAt(t); RUIN.visible = true; put(K2_(), HALL, { p: [.6, .6, -10.4], ry: 230, ex: 'calm', eyeC: '#ff2030', talk: talkAt(t), blink: false });
  camH([-.25, 1.85, -11.4], [.6, 1.8, -10.4], [-.15, 1.82, -11.2], [.6, 1.8, -10.4], U(lt, .9, eOut), 34); });
E2('S23', 47.54, 'cut', (lt, t) => { // "เวทบทสุดท้าย" - white runes ring him, low angle
  hallLight({ hemiI: 1.2 }); Wd.hallAt(t); RUIN.visible = true; put(K2_(), HALL, { p: [0, .6, -10.6], ry: 180, ex: 'determined', eyeC: '#ffffff', hR: [.3, 1.05, .2], pR: [1, -.3, -.3], hL: [-.3, .3, .1], pL: [-1, 0, -.5] });
  runesAt(HALL.localToWorld(V(0, .7, -10.6)), t, 1, { col: '#ffffff', col2: '#ffffff', n: 22, w: 520, h: 700 }); Wd.raysAt(HALL.localToWorld(V(0, 0, -10.6)), .8, t, '#ffffff');
  camH([.6, 1.0, -7.4], [0, 2.2, -10.6], [.3, 1.1, -8.2], [0, 2.4, -10.6], U(lt, 1.3, eOut), 54); });
E2('S24', 48.83, 'cut', (lt, t) => { // "ZERO"
  hallLight(); Wd.hallAt(t); RUIN.visible = true; put(K2_(), HALL, { p: [0, .6, -10.6], ry: 180, ex: 'angry', eyeC: '#ffffff', talk: talkAt(t), hR: [.4, 1.1, .5], pR: [1, -.3, -.3], hL: [-.4, 1.05, .45], pL: [-1, -.3, -.3] });
  tintAt('#ffffff', sstep(.1, .85, lt)); SH.a = .8; SH.t = t; shockAt(W2(K2_(), [0, 1, .5]), lt / .8, 1.8);
  camH([.2, 1.8, -13.0], [0, 1.9, -10.6], [.1, 1.85, -12.0], [0, 1.9, -10.6], U(lt, .9, eIn), 44); });
E2('S25', 49.70, 'blur', (lt, t) => { // "แสงสีขาวกลืนกินทั้งเมืองหลวง" - a white dome swallows the capital
  dawnLight(); FIELD.visible = true; FA.rock.visible = false; Wd.cityAt(false, t); DOME.visible = true; const k = sstep(0, 2.2, lt);
  DOME.position.set(-28, 4, -60); DOME.scale.setScalar(2 + k * 70); DOME.material.opacity = .85; tintAt('#ffffff', .55 * (1 - sstep(1.6, 2.4, lt)) + .25 * k);
  camF([10, 14, 30], [-28, 6, -60], [6, 18, 36], [-28, 12, -60], U(lt, 2.6, eOut), 46); });
E2('S26', 52.36, 'blur', (lt, t) => { // "เมื่อแสงจางลง เทพปีศาจหายไปแล้ว" - empty, broken, quiet
  ruinLight(); Wd.hallAt(t); RUIN.visible = true; HA.glass.visible = false; DOOR.visible = false; tintAt('#ffffff', .6 * (1 - sstep(0, 1.2, lt)));
  Wd.raysAt(HALL.localToWorld(V(0, 0, -11)), .9, t); Wd.fogAt(HALL.localToWorld(V(0, 0, -7)), t, .6, '#e0dcff', 6);
  camH([0, 7.5, -1.5], [0, 1.0, -11], [0, 5.5, -4.0], [0, 1.0, -11], U(lt, 3.0, eIO), 50); });
E2('S27', 55.41, 'cut', (lt, t) => { // "และเขาก็หายไปด้วย" - Elena alone in the ruins
  ruinLight(); Wd.hallAt(t); RUIN.visible = true; HA.glass.visible = false; DOOR.visible = false; Wd.raysAt(HALL.localToWorld(V(0, 0, -11)), .7, t);
  put(E_(), HALL, { p: [0, .3, -10.2], ry: lerp(-40, 40, sstep(0, 1.6, lt)), ex: 'sad', sweat: true, blink: blinkAt(t, 2) });
  camH([2.6, 1.2, -6.2], [0, 1.3, -10.2], [1.6, 1.4, -7.4], [0, 1.4, -10.2], U(lt, 2.0, eIO), 46); });
E2('S28', 57.44, 'cut', (lt, t) => { // "บนพื้น เหลือเพียงแหวนวงเดียว" - slow push to the ring
  ruinLight(); Wd.hallAt(t); RUIN.visible = true; HA.glass.visible = false; DOOR.visible = false; RING.visible = true; Wd.raysAt(HALL.localToWorld(V(.4, 0, -9.4)), .9, t);
  sparkAt(HALL.localToWorld(V(.45, .14, -9.35)), .5 + .5 * Math.sin(t * 4), .5);
  camH([1.3, .7, -7.4], [.4, .05, -9.4], [.7, .35, -8.6], [.4, .06, -9.4], U(lt, 3.6, eOut), 40); }, { noCut: true });

// =====================================================================
export function initShots(timing) { TM.env = timing.env; for (let i = 0; i < SHOTS.length; i++) SHOTS[i].t1 = i + 1 < SHOTS.length ? SHOTS[i + 1].t0 : timing.end; }
export function runShot(sh, t) { reset(t); sh.fn(t - sh.t0, t); }
export const WHITEK = WHITE;
export const COVER = { id: 'COVER', t0: 0, fn: (lt, t, o = {}) => {
  reset(10); ep2Reset(); hallLight(); Wd.hallAt(10, { circle: .8 }); RUIN.visible = false; doorAt(1);
  const cm = o.cam || [.4, 1.7, -7.4], g = o.tgt || [0, 1.95, -10.6]; camH(cm, g, cm, g, 0, o.fov || 46);
  put(K2_(), HALL, { p: [0, .6, -10.6], ry: 0, ex: 'evil', eyeC: '#ff2030', hR: [.3, 1.05, .2], pR: [1, -.3, -.3], hL: [-.3, .3, .1], pL: [-1, 0, -.5] });
  runesAt(HALL.localToWorld(V(0, .7, -10.6)), 10, 1, { col: '#ff2a4a', n: 22, w: 520, h: 700 }); Wd.raysAt(HALL.localToWorld(V(0, 0, -10.6)), .6, 10, '#ffd0d8');
} };
export const BENCH = { id: 'BENCH', t0: 0, fn: (lt, t, o = {}) => {
  reset(0); hallLight(); Wd.hallAt(0); const ids = ['kael', 'elena', 'lucien', 'arcus', 'kael2', 'k1'];
  ids.forEach((id, i) => put(CHARS[id], HALL, { p: [(i - 2.5) * .9, 0, -6], ry: o.ry ?? 0, ex: ['sly', 'happy', 'smug', 'evil', 'shocked', 'frown'][i] }));
  const bc = o.cam || [0, 1.3, -.8], bt = o.tgt || [0, 1.0, -6]; camH(bc, bt, bc, bt, 0, o.fov || 40);
} };
