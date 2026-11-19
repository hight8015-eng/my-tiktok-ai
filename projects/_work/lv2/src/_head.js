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