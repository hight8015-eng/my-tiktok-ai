// shots.js: THE LAST VILLAIN ep 1 "ราชันแห่งบาป" (74.66 s)
import { THREE, scene, camera, clamp, lerp, sstep, eIO, eOut, eIn, eSine, D2R, noise1, rng, POST, mesh, rbox, toon, basic, group } from './engine.js';
import * as Wd from './world.js';
import { CHARS, pose, blinkAt, talkQ, popAt, sparkAt, actHit, actPunch, hitStop, impactAt, dustAt, debrisAt, smokeAt, ramp } from './chars.js';
const { HALL, HA, FIELD, FA, BALC, CRYPT, CR, VILL, VI } = Wd;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const TM = { env: [] };
const talkAt = (t) => talkQ(TM.env, t / SP); // env is in real (sped-up) seconds
let SH = { a: 0, t: 0 };
function look(pos, tgt, fov = 40, roll = 0) { POST.focus = pos.distanceTo(tgt); camera.position.copy(pos); camera.fov = fov; camera.updateProjectionMatrix(); camera.up.set(0, 1, 0); camera.lookAt(tgt); if (roll) camera.rotateZ(roll * D2R);
  if (SH.a > 0) { const t = SH.t * 22; camera.rotateX(noise1(t) * .02 * SH.a); camera.rotateY(noise1(t + 50) * .02 * SH.a); camera.position.y += noise1(t + 9) * .06 * SH.a; } camera.updateMatrixWorld(); }
const lp = (a, b, u) => a.map((v, i) => lerp(v, b[i], u));
const HUP = .32, hup = (v) => { v[1] += HUP * clamp(v[1] / 1.4); return v; }; // taller cast (legs 1.2 heads): framing at head height lifts with the heads, floor framing stays
const camO = (o) => (p0, t0, p1, t1, u, fov = 40, roll = 0) => look(V(...hup(lp(p0, p1, u))).add(o.position), V(...hup(lp(t0, t1, u))).add(o.position), fov, roll);
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
  const i = SHOTS.indexOf(sh), nx = SHOTS[i + 1], d = (nx ? nx.t0 : 74.66 / SP) - sh.t0; if (sh.noCut || d < 2.6 || ltR < d * .55) return;
  camera.updateMatrixWorld(); const cp = camera.position.clone(); camera.getWorldDirection(_f);
  /* stateless + deterministic (segments render in separate browsers): the first character in cast order whose head is near the view axis */
  let best = null; for (const C of Object.values(CHARS)) { let o = C.g, v = true; while (o) { v = v && o.visible; o = o.parent; } if (!v || !C.g.parent) continue;
    const h = C.hc.getWorldPosition(new THREE.Vector3()).add(V(0, C.is2D ? .36 * C.g.getWorldScale(new THREE.Vector3()).x : 0, 0)), rel = h.clone().sub(cp), z = rel.dot(_f); if (z < .5) continue;
    if (rel.clone().addScaledVector(_f, -z).length() / z > .6) continue; best = h; break; }
  if (!best) return; const dist = cp.distanceTo(best); if (dist < 2.2) return;
  const back = cp.clone().sub(best).setY(0).normalize(), sg = i % 2 ? 1 : -1, a = sg * .5, ca = Math.cos(a), sa = Math.sin(a);
  const dir = new THREE.Vector3(back.x * ca - back.z * sa, 0, back.x * sa + back.z * ca), nd = Math.max(1.25, dist * .45);
  const tgt = best.clone().add(V(0, -.18, 0)); /* just below the face centre: face in the upper third */ camera.position.copy(tgt).addScaledVector(dir, nd).add(V(0, .06, 0)); camera.lookAt(tgt); camera.updateMatrixWorld(); POST.focus = camera.position.distanceTo(tgt); }
const S = (id, t0, tr, fn, o = {}) => { const sh = { id, t0: t0 / SP, tr, ...o }; sh.fn = (lt, t) => { fn(lt * SP, t * SP); coverage(sh, (globalThis.FRAME_T ?? t) - sh.t0); Wd.ambientAt(t, o.amb ?? AMBK()); Wd.clothAt(t); Wd.flamesAt(t); }; SHOTS.push(sh); };
// --- hook: the forced engagement ---
S('S01', 0, 'cut', (lt, t) => { // "เจ้าหญิงคนนี้ ถูกบังคับให้แต่งงาน"
  hallLight(); Wd.hallAt(t); put(E_(), HALL, { p: [-.55, 0, -10.2], ry: 8, ex: 'sad', blink: blinkAt(t, 2), ...hands });
  put(L(), HALL, { p: [.6, 0, -10.2], ry: -12, ex: 'sly', blink: blinkAt(t, 1), ...hip });
  const u = U(lt, 2.85, eSine); camH([-.75, 1.35, -7.0], [-.55, 1.35, -10.2], [-.62, 1.4, -8.1], [-.55, 1.42, -10.2], u, 38); dof(.5);
});
S('S02', 2.85, 'cut', (lt, t) => { // "กับชายที่ฆ่าคนรักของเธอ" : reveal Lucien beside her
  hallLight(); Wd.hallAt(t); put(E_(), HALL, { p: [-.55, 0, -10.2], ry: 30, ex: 'frown', blink: blinkAt(t, 2), look: [.8, 0], ...hands });
  put(L(), HALL, { p: [.6, 0, -10.2], ry: -25, ex: 'smug', pop: popAt(lt, .9), blink: blinkAt(t, 1), ...hip });
  const u = U(lt, 2.4, eSine); camH([1.2, 1.45, -6.4], [0, 1.25, -10.3], [.9, 1.42, -6.9], [0, 1.27, -10.3], u, 44);
});
// --- 100 years ago: the King of Sin ---
S('S03', 5.25, 'dis', (lt, t) => { // "เรื่องเริ่มเมื่อ 100 ปีก่อน"
  past(); fieldDusk(); FIELD.visible = true; Wd.armyAt(1, t); Wd.cityAt(false, t);
  const u = U(lt, 3.0, eSine); camF([-9, 6, -6], [0, 1, 20], [-6, 9, -3], [0, 1, 24], u, 48);
});
S('S04', 8.2, 'cut', (lt, t) => { // "โลกมีจอมเวทคนหนึ่งชื่อเคล"
  past(); fieldDusk(); FIELD.visible = true; Wd.armyAt(1, t); put(K(), FIELD, { p: [0, 1.16, .2], ry: 0, ex: 'calm', blink: blinkAt(t, 1), ...hip }); aura(K(), sstep(.3, 1.4, lt), t);
  const u = U(lt, 2.3, eSine); camF([1.6, .6, 4.6], [0, 2.3, 0], [1.2, .8, 3.8], [0, 2.4, 0], u, 46);
});
S('S05', 10.5, 'cut', (lt, t) => { // "ฉายาราชันแห่งบาป" : close, the eyes ignite
  past(); fieldDusk(); FIELD.visible = true; Wd.armyAt(1, t); put(K(), FIELD, { p: [0, 1.16, .2], ry: 20, ex: 'sly', blink: false, eyeC: lt > .75 ? '#ff2030' : '', pop: popAt(lt, .7, .1), ...hip }); aura(K(), 1, t);
  const u = U(lt, 2.0, eIn); camF([.6, 2.45, 2.2], [0, 2.38, .2], [.45, 2.45, 1.8], [0, 2.4, .2], u, 36); redEyes(K(), sstep(.5, 1.0, lt), t); dof(.6);
});
S('S06', 12.5, 'whip', (lt, t) => { // "แค่สะบัดมือครั้งเดียว"
  past(); fieldDusk(); FIELD.visible = true; Wd.armyAt(1, t); const k = sstep(.55, .75, lt); put(K(), FIELD, { p: [0, 1.16, .2], ry: 0, ex: k > .5 ? 'evil' : 'sly', blink: false, ...flick(k), fast: true }); aura(K(), 1, t);
  if (lt > .7) { const a = lt - .7; WAVE.position.copy(FIELD.position).add(V(0, 1.6, 1.2)); WAVE.scale.setScalar(.5 + a * 22); WAVE.material.opacity = Math.max(0, .9 - a * .9); SH.a = .5 * Math.exp(-a * 4); }
  const u = U(lt, 1.6, eSine); camF([1.0, 2.6, -4.0], [.2, 1.75, 6], [.9, 2.5, -3.6], [.2, 1.75, 7], u, 48);
});
S('S07', 14.0, 'cut', (lt, t) => { // "กองทัพนับหมื่นก็หายไปจากแผนที่"
  past(); fieldDusk(); FIELD.visible = true; const g = sstep(.1, 2.6, lt); Wd.armyAt(1, t, g); put(K(), FIELD, { p: [0, 1.16, .2], ry: 0, ex: 'evil', ...flick(1) }); aura(K(), .8, t);
  WAVE.position.copy(FIELD.position).add(V(0, 1.6, 1.2)); WAVE.scale.setScalar(16 + lt * 14); WAVE.material.opacity = Math.max(0, .5 - lt * .25);
  for (let r = 0; r < 4; r++) debrisAt(FIELD.localToWorld(V((r - 1.5) * 7, 1, 15 + g * 10)), lt - r * .3, { n: 18, seed: r + 3, speed: 3.4, up: 1, kind: 'spark', grav: -1.2, col: '#c08aff', life: 1.6 });
  const u = U(lt, 2.9, eSine); camF([-1.4, 3.0, -4.6], [.6, 1, 18], [-1.8, 3.8, -5.6], [.6, 1, 22], u, 50);
});
S('S08', 16.95, 'cut', (lt, t) => { // "เขาเผาเมือง ล้มอาณาจักร"
  past(); warLight(); FIELD.visible = true; FA.rock.visible = false; Wd.cityAt(true, t); put(K(), FIELD, { p: [1.2, 0, -32], ry: 180, ex: 'calm', ...hip }); aura(K(), .6, t, '#ff5a3a', 3);
  smokeAt(FIELD.localToWorld(V(-6, 4, -48)), (lt % 2.2), { size: 3, seed: 2, life: 2.4 });
  const u = U(lt, 2.0, eSine); camF([3.2, 1.3, -26.5], [0, 3.2, -45], [2.6, 1.0, -27.6], [0, 3.6, -45], u, 50);
});
S('S09', 18.9, 'cut', (lt, t) => { // "จนทั้งโลกประกาศให้เขาเป็นศัตรูของมนุษยชาติ"
  past(); warLight(); FIELD.visible = true; FA.rock.visible = false; Wd.cityAt(true, t); Wd.posterAt(true);
  const u = U(lt, 3.4, eSine); camF([6.6, 1.9, -1.4], [6, 1.85, -6], [6.1, 1.82, -3.0], [6, 1.8, -6], u, 40);
});
// --- the princess who never feared him ---
S('S10', 22.35, 'dis', (lt, t) => { // "แต่มีคนเดียวที่ไม่เคยกลัวเขา"
  past(); moonLight(); BALC.visible = true; put(K(), BALC, { p: [.3, 0, -2.0], ry: 180, ex: 'sad', ...hip }); put(E_(), BALC, { p: [-1.3 + sstep(0, 2.1, lt) * 1.1, 0, -.8], ry: 115, ex: 'calm', walk: lt < 2.0 ? { ph: lt * 8, stride: .14 * (1 - sstep(1.6, 2.0, lt)) } : undefined });
  const u = U(lt, 2.5, eSine); camB([1.6, 1.6, 3.6], [-.3, 1.5, -2], [1.2, 1.55, 3.0], [-.4, 1.45, -2], u, 44);
});
S('S11', 24.8, 'cut', (lt, t) => { // "เอเลน่า"
  past(); moonLight(); BALC.visible = true; put(E_(), BALC, { p: [-1.2, 0, -.6], ry: lerp(75, 22, sstep(0, .5, lt)), ex: 'happy', pop: popAt(lt, .25), blink: blinkAt(t, 2) });
  camB([-.3, 1.38, 1.4], [-1.2, 1.32, -.6], [-.35, 1.38, 1.25], [-1.2, 1.33, -.6], U(lt, .9), 36); dof(.5);
});
S('S12', 25.65, 'cut', (lt, t) => { // "เจ้าหญิงแม่มดที่แข็งแกร่งที่สุดในยุค"
  past(); moonLight(); BALC.visible = true; const k = sstep(.2, .8, lt);
  put(E_(), BALC, { p: [-1.2, 0, -.6], ry: 120, ex: 'confident', open: 'R', hR: lp([.3, .3, .1], [.3, .62, .5], k), pR: [1, -.3, -.3], ...{ hL: [-.3, .3, .1], pL: [-1, 0, -.5] } });
  put(K(), BALC, { p: [.4, 0, -1.6], ry: -70, ex: lt > 1 ? 'shocked' : 'calm', pop: popAt(lt, 1.0), ...hip });
  if (k > .5) { const h = W(E_(), [.3, .75, .55]); sparkAt(h, .6 + .4 * Math.sin(t * 10), 1.4); debrisAt(h, (lt * 1.5) % 1, { n: 10, seed: Math.floor(lt * 1.5), speed: 1.4, up: 1, kind: 'spark', grav: -1, col: '#c9a0ff', life: 1 }); }
  camB([-.75, 1.4, 3.6], [-.7, 1.2, -1.1], [-.7, 1.4, 3.2], [-.7, 1.2, -1.1], U(lt, 2.6), 48);
});
S('S13', 28.3, 'cut', (lt, t) => { // "และเธอ ตกหลุมรักเขา"
  past(); moonLight(); BALC.visible = true; put(E_(), BALC, { p: [-.35, 0, -1.6], ry: 70, ex: 'happy', blink: blinkAt(t, 2), hR: [.18, .5, .42], pR: [1, -.3, 0] });
  put(K(), BALC, { p: [.35, 0, -1.6], ry: -70, ex: 'smug', blink: blinkAt(t, 1), hL: [-.18, .5, .42], pL: [-1, -.3, 0] });
  for (let i = 0; i < 3; i++) sparkAt(BALC.localToWorld(V(-1 + i, 2.4 + .3 * Math.sin(t * 2 + i), -1.2)), .4 + .3 * Math.sin(t * 3 + i * 2), .5);
  const a = lerp(-20, 15, U(lt, 2.4, eSine)); camB([Math.sin(a * D2R) * 3.4, 1.6, -1.6 + Math.cos(a * D2R) * 3.4], [0, 1.4, -1.6], [Math.sin(a * D2R) * 3.4, 1.6, -1.6 + Math.cos(a * D2R) * 3.4], [0, 1.4, -1.6], 0, 40);
});
// --- the heroes come ---
S('S14', 30.7, 'whip', (lt, t) => { // "จนวันหนึ่ง"
  past(); dawnLight(); FIELD.visible = true; FA.rock.visible = false; put(L(), FIELD, { p: [0, 0, -8], ry: 0, ex: 'determined', ...hip }); [1, 2, 3, 4].forEach(i => put(KN(i), FIELD, { p: [(i - 2.5) * 1.3, 0, -9.3 - (i % 2) * .5], ry: 0, ex: 'frown', blink: blinkAt(t, i), hR: [.3, .32, .12], pR: [.3, -.5, -1], hold: { R: { obj: (SPEARS[i - 1].visible = true, SPEARS[i - 1]), off: [0, -.02, 0], rot: [-8, 0, 0], mass: .5 } } }));
  HOLY.position.copy(FIELD.localToWorld(V(0, 2.4, -10))); HOLY.material.opacity = .6 * sstep(0, 1, lt); HOLY.scale.setScalar(12);
  camF([0, .9, -1.5], [0, 1.6, -8.5], [0, 1.0, -2.2], [0, 1.65, -8.5], U(lt, 1.1), 46);
});
S('S15', 31.8, 'cut', (lt, t) => { // "ลูเซียน วีรบุรุษแห่งแสง"
  past(); dawnLight(); FIELD.visible = true; FA.rock.visible = false; put(L(), FIELD, { p: [0, 0, -8], ry: 0, ex: 'confident', pop: popAt(lt, .1), blink: blinkAt(t, 1), hR: [.32, .45, .2], pR: [1, -.3, -.3], hold: { R: { obj: SWORD, off: [0, -.01, .02], rot: [0, 0, 0], mass: .3 } } });
  HOLY.position.copy(FIELD.localToWorld(V(.4, 2.3, -9))); HOLY.material.opacity = .65; HOLY.scale.setScalar(5 + .3 * Math.sin(t * 3));
  camF([.7, 1.5, -5.6], [0, 1.45, -8], [.55, 1.48, -6.1], [0, 1.47, -8], U(lt, 2.3, eSine), 38); dof(.4);
});
S('S16', 34.1, 'whip', (lt, t) => { // "นำเหล่าวีรบุรุษบุกมา"
  past(); dawnLight(); FIELD.visible = true; FA.rock.visible = false; const run = (C, x, z0, ph) => { const z = z0 + lt * 3.2; put(C, FIELD, { p: [x, 0, z], ry: 0, ex: 'angry', walk: { ph: (z - z0) / .5 * Math.PI + ph, stride: .3, run: 1 } }); };
  run(L(), 0, -10, 0); [1, 2, 3, 4].forEach(i => run(KN(i), (i - 2.5) * 1.4, -11.5 - (i % 2), i)); SH.a = .25;
  const u = U(lt, 1.4, eSine); camF([-.6, .6, -2.4 + lt * 1.4], [0, 1.2, -8 + lt * 3.2], [-.6, .6, -2.4 + lt * 1.4], [0, 1.2, -8 + lt * 3.2], 0, 50);
});
S('S17', 35.5, 'cut', (lt0, t) => { // "สังหารเคล ก่อนสิ้นใจ"
  past(); dawnLight(); FIELD.visible = true; FA.rock.visible = false; const AT = .55, lt = hitStop(lt0, AT, 5);
  put(L(), FIELD, { p: [-.75, 0, 1.0], ry: 90, ex: 'angry', ...actPunch(lt, AT), hold: { R: { obj: SWORD, off: [0, -.01, .02], rot: [lt < AT ? 60 : 110, 0, 0], mass: .4 } } });
  const H = actHit(lt, AT, { dist: .25 }); put(K(), FIELD, { p: [.05 + (H.kb || 0), 0, 1.0], ry: -90, ...(lt < AT ? { ex: 'shocked' } : { ...H, ex: lt > 1.2 ? 'sad' : 'ouch' }) });
  if (lt0 >= AT) { impactAt(FIELD.localToWorld(V(-.05, 1.25, 1.1)), clamp((lt0 - AT) / .4), 1); SH.a = 1.1 * Math.exp(-(lt0 - AT) * 5); }
  camF([-.1, 1.3, 4.6], [-.1, 1.2, 1], [.15, 1.25, 4.2], [.15, 1.2, 1], U(lt0, 2), 42);
});
S('S18', 37.55, 'cut', (lt, t) => { // "เคลมองเธอเป็นครั้งสุดท้าย"
  past(); dawnLight(); FIELD.visible = true; FA.rock.visible = false; put(K(), FIELD, { p: [.6, 0, 1.0], ry: -150, ex: 'sad', sit: true, seat: .1, lean: 22, head: [-6, 0, 0], blink: blinkAt(t, 1), hL: [-.3, .1, .3], hR: [.3, .1, .3], pL: [-1, 0, 0], pR: [1, 0, 0] });
  put(E_(), FIELD, { p: [-2.4, 0, -4.5], ry: 30, ex: 'scared', sweat: true, hL: [-.4, .9, .5], hR: [.4, .9, .5], pL: [-1, -.3, 0], pR: [1, -.3, 0] }); put(KN(1), FIELD, { p: [-3.1, 0, -4.8], ry: 60, ex: 'frown', hR: [.2, .6, .5] }); put(KN(2), FIELD, { p: [-1.7, 0, -4.9], ry: -40, ex: 'frown', hL: [-.2, .6, .5] });
  camF([-.5, 1.0, -1.6], [.6, .85, 1.0], [-.35, .98, -1.2], [.6, .85, 1.0], U(lt, 2.1, eSine), 42); dof(.35);
});
S('S19', 39.7, 'cut', (lt, t) => { // "ถ้าโลกนี้ไม่ยอมให้เรารักกัน ฉันจะกลับมา"
  past(); dawnLight(); FIELD.visible = true; FA.rock.visible = false; put(K(), FIELD, { p: [.6, 0, 1.0], ry: -150, ex: 'sad', sit: true, seat: .1, lean: 18, head: [-4, 0, 0], talk: talkAt(t), blink: blinkAt(t, 1), hL: [-.3, .1, .3], hR: [-.1, .55, .55], pL: [-1, 0, 0], pR: [1, -.4, 0] });
  camF([-.4, .95, -.6], [.6, .95, 1.0], [-.3, .95, -.35], [.6, .95, 1.0], U(lt, 3.6, eSine), 36); dof(.6);
});
S('S20', 43.35, 'cut', (lt, t) => { // "ในโลกที่ไม่มีใครพรากเธอไปจากฉันได้" : her tears
  past(); dawnLight(); FIELD.visible = true; FA.rock.visible = false; put(E_(), FIELD, { p: [-2.4, 0, -4.5], ry: 30, ex: 'sad', sweat: true, blink: blinkAt(t, 2), hL: [-.1, .75, .45], hR: [.1, .75, .45], pL: [-1, -.3, 0], pR: [1, -.3, 0] });
  camF([-1.85, 1.45, -3.1], [-2.4, 1.42, -4.5], [-1.95, 1.45, -3.3], [-2.4, 1.43, -4.5], U(lt, 1.3), 46); dof(.5);
});
S('S21', 44.6, 'cut', (lt, t) => { // last breath: he closes his eyes, the world goes white
  past(); dawnLight(); FIELD.visible = true; FA.rock.visible = false; put(K(), FIELD, { p: [.6, 0, 1.0], ry: -150, ex: lt > .6 ? 'sleepy' : 'sad', blink: lt > .9, sit: true, seat: .1, lean: lerp(18, 22, sstep(.6, 1.4, lt)), head: [lerp(-4, 18, sstep(.6, 1.4, lt)), 0, lerp(0, 10, sstep(.6, 1.4, lt))], hL: [-.3, .1, .3], hR: [.3, .05, .35], pL: [-1, 0, 0], pR: [1, 0, 0] });
  camF([-.45, .98, -1.0], [.6, .85, 1.0], [-.7, 1.05, -1.6], [.6, .85, 1.0], U(lt, 1.6, eSine), 38); { const w = sstep(.9, 1.6, lt); POST.lift = lerp(1.02, 3.2, w); POST.sat = lerp(.78, .2, w); }
});
// --- 100 years later ---
S('S22', 46.2, 'dis', (lt, t) => { // "100 ปีต่อมา"
  hallLight({ hemiI: 2.0 }); Wd.hallAt(t, { glass: 90 });
  camH([0, 2.2, 3.5], [0, 4.5, -16], [0, 1.8, .5], [0, 4.2, -16], U(lt, 1.7, eSine), 50);
});
S('S23', 47.8, 'cut', (lt, t) => { // "เอเลน่ายังมีชีวิตอยู่ด้วยเวทมนตร์โบราณ"
  hallLight(); Wd.hallAt(t, { glass: 80 }); put(E_(), HALL, { p: [1.6, 0, -13.6], ry: 25, ex: 'calm', blink: blinkAt(t, 2), hR: [.12, .55, .45], pR: [1, -.3, 0], hL: [-.3, .3, .1], pL: [-1, 0, -.5] });
  const w = W(E_(), [.12, .52, .5]); for (let i = 0; i < 3; i++) sparkAt(w.clone().add(V(Math.cos(t * 2 + i * 2.1) * .14, .05 * i, Math.sin(t * 2 + i * 2.1) * .14)), .5 + .3 * Math.sin(t * 5 + i), .35);
  camH([2.6, 1.5, -10.8], [1.6, 1.4, -13.6], [2.3, 1.45, -11.4], [1.6, 1.4, -13.6], U(lt, 2.8, eSine), 38); dof(.4);
});
S('S24', 50.6, 'cut', (lt, t) => { // "และวันนี้คือวันหมั้นของเธอกับลูเซียน"
  hallLight(); Wd.hallAt(t); const k = sstep(.4, 1.4, lt);
  put(E_(), HALL, { p: [-.5, 0, -10.2], ry: 25, ex: 'frown', blink: blinkAt(t, 2), hR: lp([.3, .3, .1], [.25, .5, .5], k), pR: [1, -.3, 0], hL: [-.3, .3, .1], pL: [-1, 0, -.5] });
  put(L(), HALL, { p: [.55, 0, -10.2], ry: -25, ex: 'smug', blink: blinkAt(t, 1), hL: lp([-.3, .3, .1], [-.25, .52, .5], k), pL: [-1, -.3, 0], hR: [.3, .3, .1], pR: [1, 0, -.5] });
  camH([0, 1.3, -6.6], [0, 1.15, -10.2], [0, 1.32, -7.2], [0, 1.12, -10.2], U(lt, 3.2, eSine), 44);
});
S('S25', 53.85, 'cut', (lt, t) => { // "แต่ไม่มีใครรู้เลยว่า พิธีนี้คือกับดักของมหาปุโรหิตอาร์คัส"
  hallLight(); Wd.hallAt(t); put(E_(), HALL, { p: [-.5, 0, -10.2], ry: 25, ex: 'frown', ...hands }); put(L(), HALL, { p: [.55, 0, -10.2], ry: -25, ex: 'smug', ...hip });
  BOOK.visible = true; put(A(), HALL, { p: [0, .9, -13.1], ry: 0, ex: lt > 1.0 ? 'evil' : 'calm', pop: popAt(lt, 1.0), blink: blinkAt(t, 3), hL: [-.18, .55, .45], hR: [.18, .55, .45], pL: [-1, -.3, 0], pR: [1, -.3, 0], hold: { R: { obj: BOOK, off: [-.1, .06, .05], rot: [-70, 0, 0] } } });
  camH([0, 1.6, -7.4], [0, 1.9, -12.5], [0, 2.3, -10.6], [0, 2.4, -13.1], U(lt, 2.2, eIO), 42); dof(.3);
});
S('S26', 56.1, 'cut', (lt, t) => { // close on Arcus, the magic circle wakes under the altar
  hallLight(); Wd.hallAt(t, { circle: sstep(.2, 1.4, lt) }); STAFF.visible = true; put(A(), HALL, { p: [0, .9, -13.1], ry: 0, ex: 'evil', blink: false, hL: [-.3, .7, .4], hR: [.3, .7, .4], pL: [-1, -.3, 0], pR: [1, -.3, 0], hold: { R: { obj: STAFF, off: [0, -.02, 0], rot: [0, 0, 0], mass: .6 } } });
  camH([.4, 1.4, -10.6], [0, 2.45, -13.1], [.3, 1.6, -11.2], [0, 2.5, -13.1], U(lt, 2.4, eSine), 40);
});
S('S27', 58.5, 'dis', (lt, t) => { // "เขาจะใช้ร่างของเธอ ปลุกเทพปีศาจ"
  cryptLight(); Wd.cryptAt(t, 0); camC([0, 1.2, 10], [0, 3, -12], [0, .8, 6], [0, 8.5, -12], U(lt, 2.5, eSine), 50);
});
S('S28', 61.0, 'cut', (lt, t) => { // "ที่ถูกผนึกมานับพันปี" : one eye opens
  cryptLight(); Wd.cryptAt(t, sstep(.4, 1.3, lt)); SH.a = .25 * sstep(.4, 1.3, lt);
  camC([2.4, 8.4, 4.0], [0, 10.4, -10.8], [1.8, 8.8, 2.0], [0, 10.4, -10.8], U(lt, 2.1, eIn), 42);
});
// --- the same night, a faraway village ---
S('S29', 63.0, 'dis', (lt, t) => { // "ในคืนเดียวกัน ที่หมู่บ้านห่างไกล"
  villNight(); VILL.visible = true; camV([8, 5, 14], [0, 2, -8], [5, 3.6, 10], [0, 2, -9], U(lt, 2.8, eSine), 48);
});
S('S30', 65.75, 'cut', (lt, t) => { // "ชายหนุ่มธรรมดาคนหนึ่งสะดุ้งตื่นกลางดึก"
  villNight({ hemiI: 1.2, sunI: .6 }); VILL.visible = true; const J = 1.0, up = sstep(J, J + .15, lt);
  put(K2(), VI.hut, { p: [-1.2, .2, -1.7], ry: 0, sit: true, seat: .05, lean: lerp(30, -6, up), head: [lerp(28, -8, up), 0, 0], ex: up > .5 ? 'shocked' : 'sleepy', blink: up < .5, sweat: up > .5, pop: popAt(lt, J + .05, .16), hL: [-.3, .2, .3], hR: [.3, .2, .3], pL: [-1, 0, 0], pR: [1, 0, 0] });
  if (lt > J) SH.a = .5 * Math.exp(-(lt - J) * 4); const P = Wd.pts[0]; P.position.copy(VILL.localToWorld(V(41.4, 2.4, -2))); P.color.set('#9ab4ff'); P.intensity = 8; P.distance = 8;
  camV([39.6, 1.1, 1.6], [38.8, .95, -1.6], [39.5, 1.1, 1.2], [38.8, 1.0, -1.6], U(lt, 2.3, eSine), 42);
});
S('S31', 68.45, 'cut', (lt, t) => { // "ดวงตาของเขา เปลี่ยนเป็นสีแดง"
  villNight({ hemiI: 1.1, sunI: .5 }); VILL.visible = true; put(K2(), VI.hut, { p: [-1.2, .2, -1.7], ry: 0, sit: true, seat: .05, lean: -4, ex: lt > 1.3 ? 'determined' : 'shocked', blink: false, eyeC: lt > 1.5 ? '#ff2030' : '', hL: [-.3, .2, .3], hR: [.3, .2, .3], pL: [-1, 0, 0], pR: [1, 0, 0] });
  const P = Wd.pts[0]; P.position.copy(VILL.localToWorld(V(41.4, 2.4, -2))); P.color.set('#9ab4ff'); P.intensity = 8; P.distance = 8;
  camV([38.8, 1.02, -.3], [38.8, .9, -1.7], [38.8, 1.0, -.6], [38.8, .9, -1.7], U(lt, 2.6, eIn), 34); redEyes(K2(), sstep(1.2, 1.9, lt), t); POST.sat = lerp(1, .6, sstep(1.2, 2, lt));
});
S('S32', 71.1, 'cut', (lt, t) => { // "เขาจำได้แล้ว ว่าตัวเองคือใคร"
  villNight({ hemiI: 1.0, sunI: .4 }); VILL.visible = true; put(K2(), VI.hut, { p: [-1.2, .2, -1.7], ry: 0, sit: true, seat: .05, lean: -4, ex: 'sly', pop: popAt(lt, .8, .1), blink: false, eyeC: '#ff2030', hL: [-.3, .2, .3], hR: [.3, .2, .3], pL: [-1, 0, 0], pR: [1, 0, 0] });
  aura(K2(), sstep(.6, 2.0, lt), t, '#9a4aff', 3); redEyes(K2(), 1, t); POST.sat = .6; POST.vig = .6;
  camV([39.3, 1.1, .7], [38.8, .9, -1.7], [38.95, 1.02, -.2], [38.8, .9, -1.7], U(lt, 3.4, eSine), 38); dof(.4);
});
// =====================================================================
export function initShots(timing) { TM.env = timing.env; for (let i = 0; i < SHOTS.length; i++) SHOTS[i].t1 = i + 1 < SHOTS.length ? SHOTS[i + 1].t0 : timing.end; }
export function runShot(sh, t) { reset(t); sh.fn(t - sh.t0, t); }
export const WHITEK = WHITE;
export const COVER = { id: 'COVER', t0: 0, fn: (lt, t, o = {}) => {
  reset(10); past(); POST.sat = 1; warLight(); FIELD.visible = true; FA.rock.visible = true; Wd.cityAt(true, 10); Wd.armyAt(1, 10, .35);
  put(K(), FIELD, { p: [0, 1.16, .2], ry: 0, ex: 'sly', eyeC: '#ff2030', ...flick(.6) }); aura(K(), 1, 10); redEyes(K(), 1, 10);
  const cm = o.cam || [.6, 1.9, 3.6], g = o.tgt || [0, 2.3, 0]; camF(cm, g, cm, g, 0, o.fov || 46);
} };
export const BENCH = { id: 'BENCH', t0: 0, fn: (lt, t, o = {}) => {
  reset(0); hallLight(); Wd.hallAt(0); const ids = ['kael', 'elena', 'lucien', 'arcus', 'kael2', 'k1'];
  ids.forEach((id, i) => put(CHARS[id], HALL, { p: [(i - 2.5) * .9, 0, -6], ry: o.ry ?? 0, ex: ['sly', 'happy', 'smug', 'evil', 'shocked', 'frown'][i] }));
  const bc = o.cam || [0, 1.3, -.8], bt = o.tgt || [0, 1.0, -6]; camH(bc, bt, bc, bt, 0, o.fov || 40);
} };
