// shots.js: THE PUPPET MASTER ep 1 "ยินดีต้อนรับสู่เมืองนรก" (72.86 s) - times are real seconds (voice sped up 1.12); animation clocks run SP x
import { THREE, setSmoothLight, scene, camera, clamp, lerp, sstep, eIO, eOut, eIn, eSine, D2R, noise1, rng, POST, mesh, rbox, toon, basic, group, cylBetween } from './engine.js';
import * as Wd from './world.js';
import * as ZC from './zc.js';
import { perform, POSES } from './acting.js';
import { CHARS, OVL, lipAt, setRig, lightAt, pose, popAt, sparkAt, dustAt, debrisAt, smokeAt, tintAt, rainAt, shockAt, whisperAt, makeRope, updateRope } from './chars.js';
const { TRUCK, GATE, STREET, ALLEY, Z } = ZC;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const TM = { env: [] };
const SP = 1.12;
const talkAt = (t) => { const c = lipAt(TM, t / SP); return c === 'X' ? 0 : c; }; // v6.9 viseme lip sync (tools/lipsync.py)
let SH = { a: 0, t: 0 };
function look(pos, tgt, fov = 40, roll = 0) { POST.focus = pos.distanceTo(tgt); camera.position.copy(pos); camera.fov = fov; camera.updateProjectionMatrix(); camera.up.set(0, 1, 0); camera.lookAt(tgt); if (roll) camera.rotateZ(roll * D2R);
  if (SH.a > 0) { const t = SH.t * 8;   /* a rumble, not a 22 Hz jitter (read as skipped frames on close shots) */ camera.rotateX(noise1(t) * .02 * SH.a); camera.rotateY(noise1(t + 50) * .02 * SH.a); camera.position.y += noise1(t + 9) * .05 * SH.a; } camera.updateMatrixWorld(); }
const lp = (a, b, u) => a.map((v, i) => lerp(v, b[i], u));
const CAMX = 1.3; /* moves are stretched at the far end only (never closer into faces) */
const ampl = (p0, p1, t0, t1) => { const d0 = Math.hypot(p0[0] - t0[0], p0[1] - t0[1], p0[2] - t0[2]), d1 = Math.hypot(p1[0] - t1[0], p1[1] - t1[1], p1[2] - t1[2]);
  return d0 >= d1 ? [p0.map((v, i) => p1[i] + (v - p1[i]) * CAMX), p1] : [p0, p1.map((v, i) => p0[i] + (v - p0[i]) * CAMX)]; };
let MIND = 2.6;
const keep = (p, t) => { const d = Math.hypot(p[0] - t[0], p[1] - t[1], p[2] - t[2]); if (d >= MIND || d < 1e-3) return p; const k = MIND / d; return p.map((v, i) => t[i] + (v - t[i]) * k); };
const camO = (o) => (p0, t0, p1, t1, u, fov = 40, roll = 0) => { p0 = keep(p0, t0); p1 = keep(p1, t1); const [q0, q1] = ampl(p0, p1, t0, t1); look(V(...lp(q0, q1, u)).add(o.position), V(...lp(t0, t1, u)).add(o.position), fov, roll); };
const camT = camO(TRUCK), camG = camO(GATE), camS = camO(STREET), camA = camO(ALLEY);
function put(C, parent, P) { if (C.g.parent !== parent) parent.add(C.g); pose(C, P); }
const U = (lt, d, e = eIO) => e(clamp(lt / d));
const AR = () => CHARS.aren, GU = () => CHARS.guard, FI = () => CHARS.fire, ST = () => CHARS.strong, T1 = () => CHARS.thug1, T2 = () => CHARS.thug2, T3 = () => CHARS.thug3, GM = () => CHARS.gunman, PX = (i) => CHARS['p' + i];
/* expression changes behind a blink with a small head dip */
function pf(lt, keys) { let i = 0; for (let k = 0; k < keys.length; k++) if (lt >= keys[k][0]) i = k; const o = { ex: keys[i][1] };
  for (let k = 1; k < keys.length; k++) { const d = lt - keys[k][0]; if (d > -.06 && d < .1) o.blink = true; if (d >= 0 && d < .32) o.head = [7 * Math.sin(Math.PI * d / .32), 0, 0]; } return o; }
/* motion principles (the user's study clips): anticipation (a small move the other way first), overshoot + settle
   (back ease), damped wobble for follow-through, offsets so parts never move in sync */
const backOut = (u, s = 1.7) => { u = clamp(u); const c3 = s + 1; return 1 + c3 * (u - 1) ** 3 + s * (u - 1) ** 2; };
const antic = (lt, at, dur, pre = .18, amt = .12, s = 1.7) => lt < at - pre ? 0 : lt < at ? -amt * eSine((lt - at + pre) / pre) : -amt + (1 + amt) * backOut((lt - at) / dur, s);
const settle = (x, f = 11, d = 5) => x <= 0 ? 0 : Math.exp(-d * x) * Math.sin(f * x);
const walk = (lt, rate = 1.7, stride = .22) => ({ walk: { ph: lt * rate * Math.PI * 2, stride } });
// ---------- props ----------
const EYES = [0, 1].map(() => { const s = Wd.glowSprite('#ff2030', .5, { opacity: 0 }); scene.add(s); return s; });
function redEyes(C, k, t) { if (k > 0) { OVL.push({ kind: 'redeyes', C, k: Math.min(1, k), t }); lightAt(headW(C, .3), '#ff2030', .9, .6 * k); } }
function redEyesOld(C, k, t) { scene.updateMatrixWorld(); const h = C.head.getWorldPosition(V()), d = V().subVectors(camera.position, h).normalize(), r = V().crossVectors(d, V(0, 1, 0)).normalize(), s = C.spec.s;
  EYES.forEach((e, i) => { e.position.copy(h).addScaledVector(d, .42 * s).addScaledVector(r, (i ? 1 : -1) * .13 * s).add(V(0, .16 * s, 0)); e.material.opacity = k * (.75 + .15 * Math.sin(t * 9 + i)); e.scale.setScalar(.42 * s * (.6 + .4 * k)); }); }
import { makeFire, faceFires } from './fire.js';
const HF = group({ parent: scene }); const HFF = makeFire(HF, { w: .46, h: .62, seed: 3, embers: 8, ember: .04 });   /* v6.1 shader flame (was 3 cones) */
HF.userData.glow = Wd.glowSprite('#ff8a3a', 1.4, { opacity: .3 }); HF.userData.glow.position.set(0, .15, 0); HF.add(HF.userData.glow); let HFP = null;
function handFire(t, k) { HF.visible = k > .01; if (!HF.visible) return; const lean = HFP ? Math.max(-1, Math.min(1, (HF.position.x - HFP.x) * 20)) : 0; HFP = HF.position.clone();   /* the flame trails behind a moving hand */
  HFF.at(t, k, camera, lean); HF.userData.glow.material.opacity = .3 * k * (.85 + .15 * noise1(t * 9)); }
const THREAD = makeRope('#ff2a3a', .008, 20); THREAD.material.emissive = new THREE.Color('#ff2a3a'); THREAD.material.emissiveIntensity = 1; scene.add(THREAD);
const SEED = Wd.glowSprite('#ff3040', .5, { opacity: 0 }); scene.add(SEED);
const hw = (C, side = 1) => { scene.updateMatrixWorld(); return C.torso.localToWorld(V(side * .3, .45, .2)); };
const headW = (C, up = .1) => { scene.updateMatrixWorld(); return C.head.getWorldPosition(V()).add(V(0, up, 0)); };
// ---------- lights ----------
function nightCity(o = {}) { Wd.applyLight('night', { top: '#0a0a1c', mid: '#1c1838', hor: '#3a2448', glow: '#ff3a6a', glowAmt: .25, hemiS: '#a898e0', hemiG: '#4a3050', hemiI: 2.35, sunC: '#b8c4ff', sunI: 1.35, fog: '#1a1428', fogN: 14, fogF: 90, stars: .2, moon: .7, cloud: '#2a2440', ...o }); }
const neonPt = (i, p, col, I = 6, d = 12) => { const l = Wd.pts[i]; l.position.copy(p); l.color.set(col); l.intensity = I; l.distance = d * 1.6; l.decay = 1.6; };   /* gentle falloff to zero (no hard edge) */
/* character light rigs per set, motivated by the visible sources (neon magenta sign left, cyan sign right; the alley's
   warm lamp left + cool city light right; truck: cold window top light; gate: red ZERO CITY sign from above + white searchlight rim) */
const RIGS = {
  street: { dir: [-.7, .45, .5], cel: .55,  base: 1.02, key: ['#ff4a9a', .32], keySide: -1, fill: ['#2fd0ff', .26], top: ['#c8b8ff', .12], rim: ['#5fe8ff', 0.6], rimDir: [1, .35], rim2: ['#ff4a8a', 0.3], shadow: .15, rimW: .007 },
  alley: { dir: [-.6, .7, .4], cel: .6,  base: .98, key: ['#ffb060', .4], keySide: -1, fill: ['#5a6aff', .2], top: ['#ffd8a0', .1], rim: ['#ff3a5a', 0.55], rimDir: [1, .2], rim2: ['#ffb060', 0.3], shadow: .2, rimW: .007 },
  truck: { dir: [.1, .9, .35], cel: .55,  base: .98, key: ['#a8c4ff', .25], keySide: 1, fill: ['#ffcf8a', .18], top: ['#c8d8ff', .3], rim: ['#c8d8ff', 0.5], rimDir: [0, 1], shadow: .15, rimW: .007 },
  gate: { dir: [0, .9, .4], cel: .55,  base: 1.0, key: ['#ff3040', .38], keySide: -1, fill: ['#8aa0ff', .16], top: ['#ff6070', .25], rim: ['#fff0d8', 0.55], rimDir: [1, .5], shadow: .18, rimW: .007 },
  silhouette: { dir: [0, .2, -1], cel: 1, shadeCol: '#3a3448',  base: .6, key: ['#000000', 0], fill: ['#000000', 0], top: ['#ffd8a0', .1], rim: ['#ffc87a', 1.1], rimDir: [1, .4], rim2: ['#ffc87a', .9], shadow: .6, rimW: .008 },   /* a figure in front of a bright source: dark body, bright edges */
  power: { dir: [0, -.8, .5], cel: .7, shadeCol: '#8a3a4a',  base: .82, key: ['#ff2030', .3], keySide: -1, fill: ['#000000', 0], top: ['#ffffff', .05], rim: ['#ff2a3a', 0.75], rimDir: [1, .2], rim2: ['#ff2a3a', 0.45], shadow: .35, rimW: .009 } };
function streetLight(lt) { setRig(RIGS.street); nightCity(); Wd.setShadowFocus(-600, 1, -10, 14); neonPt(0, STREET.localToWorld(V(-6, 3.5, -4)), '#ff2f6a', 7); neonPt(1, STREET.localToWorld(V(6, 3.5, -12)), '#2fe0ff', 7); neonPt(2, STREET.localToWorld(V(-5, 3, -20)), '#ffd23a', 6); neonPt(3, STREET.localToWorld(V(5.5, 3, -30)), '#c070ff', 6, 14); }
function alleyLight(o = {}) { setRig(RIGS.alley); lightAt(ALLEY.localToWorld(V(-1.3, 3.0, -7)), '#ffbe70', 2.6, .55); nightCity({ hemiI: 1.9, sunI: .9, fog: '#1c1628', fogN: 10, fogF: 48, ...o }); Wd.setShadowFocus(0, 1, -606, 8); neonPt(0, ALLEY.localToWorld(V(-1.4, 3.3, -7)), '#ffc87a', 6, 9); neonPt(1, ALLEY.localToWorld(V(0, 2.5, 3)), '#ff2f6a', 5, 12); neonPt(3, ALLEY.localToWorld(V(.5, 3, -13)), '#7a8aff', 3.5, 9); }
function truckLight() { setRig(RIGS.truck); nightCity({ hemiI: 1.9, sunI: .8, fog: '#14121c', fogN: 10, fogF: 40, stars: 0, moon: 0 }); Wd.setShadowFocus(0, 1, 600, 5); neonPt(0, TRUCK.localToWorld(V(0, 2, -.5)), '#ffcf8a', 3, 6); neonPt(1, TRUCK.localToWorld(V(0, 1.7, -2.6)), '#9ab8ff', 2.5, 5); }
function gateLight() { setRig(RIGS.gate); lightAt(GATE.localToWorld(V(0, 15, -35)), '#ff3048', 9, .45); nightCity({ fogN: 20, fogF: 140, glowAmt: .45 }); Wd.setShadowFocus(600, 1, -18, 16); neonPt(0, GATE.localToWorld(V(0, 15, -34)), '#ff2340', 9, 30); neonPt(1, GATE.localToWorld(V(0, 2, -14)), '#fff0c8', 3, 10); }
const mono = (k) => { POST.sat = lerp(POST.sat, .12, k); if (k > .5) setRig(RIGS.power); };   /* the power: hard red rim, the rest falls into shadow */   // the world drains to grey when Aren uses his power (red stays: it is drawn on top)
// ===================================================================== SHOTS
globalThis.SPRITE_EMISSIVE = .62; globalThis.GLOW = { a: .26, wide: .2, diffuse: .14 }; setSmoothLight(true);   /* two-scale glow: neon/sign halos reach further */
export const SHOTS = [];
function reset(t) { SH.a = 0; SH.t = t; Object.values(CHARS).forEach(C => { C.g.visible = false; }); Wd.hideSets(); Wd.hideSea(); ZC.hideZC(); Wd.pts.forEach(l => { l.intensity = 0; });
  EYES.forEach(e => { e.material.opacity = 0; }); HF.visible = false; THREAD.visible = false; SEED.material.opacity = 0; ZC.laserAt([0, 0, 0], [0, 0, 1], 0);
  Z.car.position.set(3.2, 0, -14); Z.car.rotation.set(0, 0, 0); POST.sat = 1.05; POST.lift = 1; POST.vig = .45; MIND = 2.6; }
const S = (id, t0, tr, set, fn, o = {}) => { const sh = { id, t0, tr, ...o }; sh.fn = (lt, t) => { set.visible = true; ZC.zcAt(t * SP, camera); if (set === STREET) ZC.streetAt(t * SP); if (set === ALLEY) ZC.alleyAt(t * SP); if (set === GATE) ZC.gateAt(t * SP, 0);
  fn(lt * SP, t * SP); scene.updateMatrixWorld(); faceFires(camera); ZC.zcLate(t * SP, camera); if (o.rain !== false && set !== TRUCK) rainAt(t * SP, o.rain ?? .5); Wd.ambientAt(t, null); }; SHOTS.push(sh); };

// ---------------- 0  "ทุกคนในเมืองนี้มีพลังพิเศษ" : neon street, a crane down past prisoners showing their powers ----------------
S('S01', 0, 'cut', STREET, (lt, t) => { streetLight(lt); const u = U(lt, 2.4, eOut);
  put(FI(), STREET, { p: [-.9, .18, -8.2], ry: 25, ex: 'grinTeeth', hR: [.28, .62, .32], pR: [1, -.3, 0] }); HF.visible = true; handFire(t, 1); FI().g.updateMatrixWorld(true); HF.position.copy(hw(FI(), 1)).add(V(0, .05, 0));
  put(ST(), STREET, { p: [1.1, .18, -10.6], ry: -25, ex: 'confident', hL: [-.32, .5, .2], hR: [.34, .5, .2], pL: [-1, 0, 0], pR: [1, 0, 0], lean: -4 });
  put(T1(), STREET, { p: [-.2, .18, -14], ry: 10, ex: 'sly', ...walk(lt, 1.4) }); put(PX(1), STREET, { p: [1.0, .18, -19], ry: -15, ex: 'frown' });
  camS([0, 6.5, -.5], [0, 2.6, -13], [0, 2.0, -3.4], [0, 1.45, -11], u, 46); });
// ---------------- 1  "ยกเว้นผม" : Aren alone under the rain, empty hands ----------------
S('S02', 2.59, 'blur', STREET, (lt, t) => { streetLight(lt); MIND = 2.8;
  put(AR(), STREET, { p: [.2, .18, -8], ry: 0, ...pf(lt, [[0, 'calm'], [.6, 'frown']]), hL: [-.26, .3, .22], hR: [.26, .3, .22], pL: [-1, -.3, 0], pR: [1, -.3, 0], head: [8, 0, 0] });
  camS([.7, 1.7, -5.0], [.2, 1.5, -8], [.6, 1.68, -5.3], [.2, 1.5, -8], U(lt, 1.2), 42); });
// ---------------- 2  "ผมตื่นขึ้นมาในรถขนนักโทษ" : truck interior, Aren opens his eyes ----------------
S('S03', 3.8, 'dis', TRUCK, (lt, t) => { truckLight(); SH.a = .25; SH.t = t;
  put(AR(), TRUCK, { p: [-.9, .64, .2], ry: 90, sit: true, seat: .62, ...pf(lt, [[0, 'sleepy'], [1.0, 'calm'], [1.5, 'worried']]), blink: lt < .9, head: [lt < 1 ? 18 : 0, 0, 0], hL: [-.2, .2, .3], hR: [.2, .2, .3] });
  put(PX(2), TRUCK, { p: [.9, .64, -.6], ry: -90, sit: true, seat: .62, ex: 'frown' }); put(PX(3), TRUCK, { p: [.9, .64, 1.0], ry: -90, sit: true, seat: .62, ex: 'angry' }); put(PX(1), TRUCK, { p: [-.9, .64, 1.6], ry: 90, sit: true, seat: .62, ex: 'sleepy', blink: true });
  Z.truckChain.rotation.z = Math.sin(t * 1.9) * .25; camT([.35, 1.25, -1.6], [-.9, 1.05, .2], [.2, 1.2, -1.4], [-.95, 1.05, .2], U(lt, 2), 46); });
// ---------------- 3  "ที่ข้อมือมีป้ายเหล็กสลักเลข 047" : the wrist tag close-up ----------------
S('S04', 5.93, 'cut', TRUCK, (lt, t) => { truckLight(); MIND = 0; SH.a = 0;
  const raise = antic(lt, .25, .7, .2, .1); put(AR(), TRUCK, { p: [-.9, .64, .2], ry: 90, sit: true, seat: .62, ex: 'worried', hR: lp([.2, .2, .3], [.12, .62, .42], raise), pR: [1, -.4, -.2], head: [14, 0, 0] });
  scene.updateMatrixWorld(); const w = AR().torso.localToWorld(V(.12, .55, .42)); Z.tag.visible = true; Z.tag.position.copy(w).add(V(0, -.07 + .006 * Math.sin(t * 1.6), 0)); Z.tag.rotation.set(0, Math.PI / 2 + Math.sin(t * .9) * .18, Math.sin(t * 1.3) * .06);   /* slow sway on the chain, no jitter */
  const lc = TRUCK.worldToLocal(AR().torso.localToWorld(V(.12, .55, .42)).clone()); camT([lc.x + .55, lc.y + .02, lc.z + .06], [lc.x, lc.y - .07, lc.z + .03], [lc.x + .42, lc.y + .05, lc.z + .04], [lc.x, lc.y - .07, lc.z + .03], U(lt, 2.8), 32); });
// ---------------- 4  "ไม่มีใครบอกว่าผมทำผิดอะไร" : wide inside the truck, the others stare at him ----------------
S('S05', 9.16, 'cut', TRUCK, (lt, t) => { truckLight(); SH.a = .3; SH.t = t;
  put(AR(), TRUCK, { p: [-.9, .64, .2], ry: 90, sit: true, seat: .62, ...pf(lt, [[0, 'worried'], [1.1, 'frown']]), head: [0, lt < 1 ? -30 : 20, 0], hL: [-.2, .2, .3], hR: [.2, .2, .3] });
  put(PX(2), TRUCK, { p: [.9, .64, -.6], ry: -90, sit: true, seat: .62, ex: 'evil', head: [0, 0, 0] }); put(PX(3), TRUCK, { p: [.9, .64, 1.0], ry: -90, sit: true, seat: .62, ex: 'angry' }); put(PX(1), TRUCK, { p: [-.9, .64, 1.6], ry: 90, sit: true, seat: .62, ex: 'sly', head: [0, -40, 0] });
  Z.truckChain.rotation.z = Math.sin(t * 1.9) * .25; camT([0, 2.05, 2.75], [0, 1.15, -.4], [0, 1.95, 2.6], [0, 1.15, -.2], U(lt, 2), 74); });
// ---------------- 5  "รถหยุดหน้ากำแพงสูงร้อยเมตร" : the truck brakes in front of the giant wall, low angle ----------------
S('S06', 11.47, 'blur', GATE, (lt, t) => { gateLight(); const k = U(lt, 1.4, eOut), z = lerp(-4, -18, k); Z.truckX.position.set(0, 0, z); Z.truckX.rotation.x = -.04 * settle(lt - 1.25, 9, 3.5);   // nose dips on the brake
  if (lt > 1.2) dustAt(GATE.localToWorld(V(0, .2, z + 3)), (lt - 1.2) / 1.2, 1.6);
  camG([4.5, .5, 4], [0, 9, -30], [3.2, .6, 1], [0, 16, -36], U(lt, 2.1), 50); }, { shutter: 3 });
// ---------------- 6  "ป้ายเหนือประตูเขียนว่า" : tilt up the wall, searchlights sweep ----------------
S('S07', 13.69, 'cut', GATE, (lt, t) => { gateLight(); Z.truckX.position.set(0, 0, -18); ZC.gateAt(t, 0);
  camG([0, 3, -14], [0, 6, -36], [0, 4.5, -16], [0, 15, -36], U(lt, 1.5), 50); });
// ---------------- 7  "ZERO CITY" : the sign blazes on ----------------
S('S08', 15.26, 'cut', GATE, (lt, t) => { gateLight(); Z.truckX.position.set(0, 0, -18); MIND = 0; const on = lt < .35 ? (Math.sin(lt * 70) > 0 ? 1 : .3) : 1; Z.zsign.userData.m.material.color.setScalar(on);
  camG([-3, 14.5, -24], [0, 16.2, -36.2], [-2, 15.4, -26], [0, 16.2, -36.2], U(lt, 1.4), 44); }, { rain: .5 });
// ---------------- 8  "ลงไป" : the rear doors open, the guard points out ----------------
S('S09', 16.71, 'whip', TRUCK, (lt, t) => { truckLight(); const op = U(lt, .3, eOut); Z.truckDoors.forEach((d, i) => { d.position.x = (i ? 1 : -1) * (.65 + 1.4 * op); }); Z.truckSlit.visible = op < .05; Z.outside.visible = true; neonPt(2, TRUCK.localToWorld(V(0, 1.6, 3.4)), '#ff7a5a', 6 * U(lt, .3), 8);
  put(GU(), TRUCK, { p: [0, .05, 3.6], ry: 180, ex: 'angry', talk: talkAt(t), hR: lp([.3, .35, .1], [.25, .75, .45], antic(lt, .2, .35, .15, .15, 2.2)), pR: [1, 0, -.4], lean: 4 * settle(lt - .2, 9, 4) });
  put(AR(), TRUCK, { p: [-.9, .64, .2], ry: 90, sit: true, seat: .62, ex: 'frown', head: [0, 50, 0] }); put(PX(2), TRUCK, { p: [.9, .64, -.6], ry: -90, sit: true, seat: .62, ex: 'frown', head: [0, -50, 0] });
  camT([-.3, 1.4, -1.8], [0, 1.4, 3.4], [-.25, 1.4, -1.5], [0, 1.45, 3.4], U(lt, .8), 46); });
// ---------------- 9  "ยินดีต้อนรับสู่เมืองนรก" : the gate grinds open, red light floods out, prisoners walk in ----------------
S('S10', 17.55, 'cut', GATE, (lt, t) => { gateLight(); Z.truckX.position.set(0, 0, -18); const op = U(lt, 1.6); ZC.gateAt(t, op);
  put(GU(), GATE, { p: [3.4, 0, -22], ry: -60, ex: 'evil', talk: talkAt(t), hR: [.3, .55, .35], pR: [1, 0, -.3], lean: -3 });
  put(AR(), GATE, { p: [-.5, 0, -24 - lt * .25], ry: 180, ...walk(lt, 1.1, .18) }); put(PX(2), GATE, { p: [.7, 0, -23.3 - lt * .25], ry: 180, ...walk(lt + .3, 1.1, .18) }); put(PX(3), GATE, { p: [-1.6, 0, -22.8 - lt * .25], ry: 180, ...walk(lt + .6, 1.1, .18) });
  camG([4.6, 1.7, -19.5], [-.4, 2.6, -30], [4.3, 1.6, -20.5], [-.4, 3.0, -30], U(lt, 1.6), 50); });
// ---------------- 10 "ที่นี่มีกฎแค่ข้อเดียว" : the guard, one finger up ----------------
S('S11', 19.39, 'cut', GATE, (lt, t) => { gateLight(); Z.truckX.position.set(0, 0, -18); ZC.gateAt(t, 1);
  put(GU(), GATE, { p: [3.4, 0, -22], ry: -20, ex: 'sly', talk: talkAt(t), hR: lp([.3, .4, .2], [.22, .9, .35], antic(lt, .25, .45, .18, .12, 2)), pR: [1, -.2, -.3] });
  camG([1.9, 1.6, -18.6], [3.4, 1.55, -22], [2.1, 1.6, -18.9], [3.4, 1.6, -22], U(lt, 1.6), 42); });
// ---------------- 11-12 "ใครแข็งแกร่ง คนนั้นได้อยู่ต่อ" : through the gate, graffiti, the strong man cracks his knuckles ----------------
S('S12', 21.37, 'blur', STREET, (lt, t) => { streetLight(lt);
  put(ST(), STREET, { p: [-2.6, .18, -15], ry: 60, ex: lt < 1 ? 'confident' : 'evil', hL: [-.05, .5, .38], hR: [.05, .52, .4], pL: [-1, -.2, 0], pR: [1, -.2, 0], head: [-6, 0, 0] });
    camS([3.2, 1.4, -9.5], [-6, 2, -16], [2.5, 1.6, -10.2], [-3, 1.6, -15.4], U(lt, 2.3), 46); });
// ---------------- 13 "ชายข้างๆ ผมจุดไฟขึ้นจากมือ" : the fire man ignites his palm (anticipation: palm up, a spark, then the flame) ----------------
S('S13', 23.74, 'cut', STREET, (lt, t) => { streetLight(lt); const ig = clamp((lt - .45) / .35); neonPt(3, STREET.localToWorld(V(-.9, 1.6, -9)), '#ff8a3a', 1.1 * ig, 4);
  put(FI(), STREET, { p: [-.9, .18, -9.4], ry: 30, ex: ig > .5 ? 'grinTeeth' : 'sly', hR: lp([.3, .3, .1], [.2, .6, .38], antic(lt, .12, .35, .12, .1, 2)), pR: [1, -.3, 0], squash: -.04 * settle(lt - .45, 10, 5) });
  put(AR(), STREET, { p: [.5, .18, -8.6], ry: -40, ...pf(lt, [[0, 'calm'], [.75, 'shocked']]), lean: -7 * clamp((lt - .72) / .12) + 5 * settle(lt - .84, 8, 3.5), head: [-10 * settle(lt - .74, 10, 4), 0, 0] });
  scene.updateMatrixWorld(); HF.position.copy(hw(FI(), 1)).add(V(-.08, .12, .08)); lightAt(HF.position.clone(), '#ff9a40', 1.6, .85 * ig); handFire(t, backOut(ig, 2.4)); setRig({ ...RIGS.street, key: ['#ff9a3a', .12 + .18 * ig], keySide: 1, base: .74, rim: ['#ffb060', .5 * ig], rimDir: [1, -.2], dir: [.6, -.45, .6], cel: .25 + .6 * ig });   /* the flame below the face: under-light grin */   /* motivated: the new flame becomes the key light */ if (ig > 0 && ig < 1) sparkAt(HF.position.clone(), 1 - ig, .4);
  camS([.9, 1.55, -6.4], [-.5, 1.35, -9.2], [.7, 1.5, -6.8], [-.6, 1.4, -9.2], U(lt, 2.2), 42); }, { shutter: 3 });
// ---------------- 14 "อีกคนยกรถทั้งคันได้ด้วยแขนเดียว" : the strong man lifts the car one-handed ----------------
S('S14', 26.09, 'cut', STREET, (lt, t) => { streetLight(lt); const lift = backOut((lt - .5) / 1.1, .7), lift2 = backOut((lt - .6) / 1.1, .7);
  put(ST(), STREET, { p: [1.75, .18, -14], ry: 80, ex: lift > .1 ? 'confident' : 'strain', hR: [.05, .4 + 1.05 * lift, .38], pR: [1, -.2, 0], hL: [-.3, .3, .1], squash: lt < .5 ? -.06 * U(lt, .5) : -.03 * settle(lt - .5, 9, 4), lean: lt < .5 ? 8 * U(lt, .5) : -4 + 6 * settle(lt - .5, 7, 3) });
  neonPt(3, STREET.localToWorld(V(1.0, 3.2, -11.5)), '#ffd8a0', 5, 9);
  Z.car.position.set(3.2, 1.6 * lift + .02 * Math.sin(t * 6) * lift, -14); Z.car.rotation.z = .25 * lift2 - .05 * settle(lt - 1.5, 7, 3);
  if (lt > .5 && lt < 1.4) dustAt(STREET.localToWorld(V(3.2, .1, -14)), (lt - .5) / .9, 1.4); if (lt > .5 && lt < .8) debrisAt(STREET.localToWorld(V(3.2, .2, -14)), lt - .5, { n: 8, seed: 4, speed: 2.5, kind: 'rock', life: 1.5 });
  camS([1.6, 1.1, -8.4], [2.6, 1.5, -14], [1.9, 1.0, -8.9], [2.6, 2.1, -14], U(lt, 2.1), 50); }, { shutter: 3 });
// ---------------- 15-16 "ส่วนผม… ไม่มีอะไรเกิดขึ้นเลย" : Aren strains at his palm; nothing; a laugh behind him ----------------
S('S15', 28.68, 'cut', STREET, (lt, t) => { streetLight(lt); MIND = 2.8;
  put(AR(), STREET, { p: [.4, .18, -9], ry: -15, ...pf(lt, [[0, 'determined'], [.5, 'strain'], [1.55, 'shocked'], [2.0, 'worried']]), hR: [.18, .58, .4], pR: [1, -.3, 0], hL: [-.28, .3, .1], squash: lt > .5 && lt < 1.5 ? -.03 : 0, side: lt > .5 && lt < 1.5 ? Math.sin(t * 38) * 1.3 : 0, lean: lt > 1.5 ? 5 * settle(lt - 1.5, 7, 3) : 0 });
  put(T1(), STREET, { p: [-1.6, .18, -12], ry: 20, ex: lt > 1.6 ? 'grinTeeth' : 'sly', talk: lt > 1.6 ? 1 : 0 });
  if (lt > .9 && lt < 1.5) smokeAt(hw(AR(), 1).add(V(0, .1, 0)), lt - .9, { n: 4, size: .15, life: .8, col: '#9a96a8', seed: 3, sway: .05 });   // a sad little puff instead of a flame
  camS([1.1, 1.55, -6.3], [.3, 1.5, -9], [.9, 1.5, -6.6], [.3, 1.5, -9], U(lt, 2.2), 42); });
// ---------------- 17 "ยังไม่ทันข้ามคืน" : time passes: the street empties, a sign stutters ----------------
S('S16', 31.29, 'dis', STREET, (lt, t) => { streetLight(lt); POST.lift = .96;
  put(PX(1), STREET, { p: [-2, .18, -18 + lt * .6], ry: 0, ...walk(lt, 1.5) }); put(PX(2), STREET, { p: [2.4, .18, -24 + lt * .5], ry: 10, ...walk(lt + .2, 1.5) });
  camS([0, 7, 2], [0, 1, -22], [0, 7.6, 1], [0, 1, -24], U(lt, 1.4), 50); });
// ---------------- 18 "ชายที่จุดไฟได้ก็ถูกจัดการกลางถนน" : a gang closes around the fire man; cut away: his flame goes out ----------------
S('S17', 32.64, 'cut', STREET, (lt, t) => { streetLight(lt); const cl = U(lt, 1.6), out = clamp((lt - 2.0) / .5);
  put(FI(), STREET, { p: [0, .18, -20], ry: 0, ...pf(lt, [[0, 'grinTeeth'], [.9, 'scared']]), hR: [.22, .55, .35], pR: [1, -.3, 0], lean: -cl * 4 });
  [[T2, -1.8, -18.5], [T3, 1.9, -18.8], [PX, 0, -22.3]].forEach(([f, x, z], i) => { const C = f === PX ? PX(3) : f(); put(C, STREET, { p: [lerp(x * 1.6, x, cl), .18, lerp(z - (i === 2 ? 1.5 : -1.2), z, cl)], ry: Math.atan2(-x, -20 - z) / D2R, ex: 'evil', ...(cl < 1 ? walk(lt, 1.4, .2) : {}) }); });
  scene.updateMatrixWorld(); HF.position.copy(hw(FI(), 1)).add(V(-.08, .12, .08)); handFire(t, 1 - eIn(out)); if (out > 0) smokeAt(HF.position.clone(), lt - 2.0, { n: 7, size: .25, life: 1.4, col: '#7a7688', seed: 9 });
  POST.sat = 1.05 - .5 * out; camS([3.5, 2.6, -13.5], [0, 1.2, -20], [3, 2.4, -14.5], [0, 1.2, -20], U(lt, 2.7), 44); }, { shutter: 3 });
// ---------------- 19 "ไม่มีใครหยุด" : people walk straight past ----------------
S('S18', 35.66, 'cut', STREET, (lt, t) => { streetLight(lt); POST.sat = .6;
  put(PX(1), STREET, { p: [-1.4 + lt * .9, .18, -10.5], ry: 90, ex: 'calm', ...walk(lt, 1.6) }); put(PX(2), STREET, { p: [2.5 - lt * .8, .18, -11.5], ry: -90, ex: 'sleepy', ...walk(lt + .4, 1.6) }); put(T1(), STREET, { p: [-3 + lt * .7, .18, -13], ry: 90, ex: 'calm', ...walk(lt + .1, 1.5) });
  camS([0, 1.2, -6], [0, 1.2, -12], [.3, 1.2, -6.3], [0, 1.2, -12], U(lt, 1), 44); });
// ---------------- 20 "ไม่มีใครหันมอง" : Aren alone in the rain, grey world ----------------
S('S19', 36.75, 'cut', STREET, (lt, t) => { streetLight(lt); POST.sat = .5; MIND = 2.8;
  put(AR(), STREET, { p: [0, .18, -10], ry: -15, ex: 'sad', head: [10, 0, 0] });
  camS([-1.0, 3.0, -6.4], [0, 1.4, -10], [-.9, 2.8, -6.9], [0, 1.4, -10], U(lt, 1.4), 42); }, { rain: 1 });
// ---------------- 21 "คืนนั้นมีสามคนเดินตามผมเข้าตรอก" : the alley; three shapes at the entrance behind him ----------------
S('S20', 38.06, 'blur', ALLEY, (lt, t) => { alleyLight();
  put(AR(), ALLEY, { p: [0, 0, -4 - lt * .45], ry: 180, ...walk(lt, 1.3, .2), ex: 'worried' });
  [T1, T2, T3].forEach((f, i) => put(f(), ALLEY, { p: [(i - 1) * .9, 0, 2.6 - lt * .5 - (i % 2) * .5], ry: 180, ex: 'evil', ...walk(lt + i * .3, 1.3, .2) }));
  camA([.4, 1.6, -10], [0, 1.4, 1], [.5, 1.5, -9.2], [0, 1.4, 0], U(lt, 2.4), 46); });
// ---------------- 22-23 "เด็กใหม่ไม่มีพลัง… ขายได้ราคาดี" : the leader talks, the others grin ----------------
S('S21', 40.93, 'cut', ALLEY, (lt, t) => { alleyLight(); MIND = 2.8;
  put(T1(), ALLEY, { p: [0, 0, -3.4], ry: 180, ex: 'sly', talk: talkAt(t), hR: [.25, .55, .3], pR: [1, 0, -.3] }); put(T2(), ALLEY, { p: [-1, 0, -2.6], ry: 170, ex: 'grinTeeth' }); put(T3(), ALLEY, { p: [1, 0, -2.4], ry: 190, ex: 'evil', hL: [-.05, .45, .35], hR: [.05, .45, .35] });
  camA([.3, 1.55, -7.4], [0, 1.45, -3.2], [.5, 1.5, -7.1], [0, 1.45, -3.2], U(lt, 1.4), 44); });
S('S22', 42.47, 'cut', ALLEY, (lt, t) => { alleyLight(); MIND = 2.8;
  put(T2(), ALLEY, { p: [-1, 0, -2.6], ry: 170, ex: 'grinTeeth', talk: talkAt(t), hL: [-.1, .5, .35], hR: [.1, .5, .35], pL: [-1, -.2, 0], pR: [1, -.2, 0] }); put(T1(), ALLEY, { p: [0, 0, -3.4], ry: 180, ex: 'sly' });
  camA([-1.6, 1.5, -6.4], [-1, 1.45, -2.6], [-1.4, 1.5, -6.1], [-1, 1.45, -2.6], U(lt, 1.1), 42); });
// ---------------- 24 "ผมถอยจนหลังชนกำแพง" : back to the brick wall, a little dust ----------------
S('S23', 43.86, 'cut', ALLEY, (lt, t) => { alleyLight(); const back = U(lt, 1.1, eIn), hit = lt > 1.1 ? Math.exp(-(lt - 1.1) * 8) : 0;
  put(AR(), ALLEY, { p: [lerp(0, -1.45, back), 0, -7], ry: 80, ex: lt > 1.1 ? 'scared' : 'nervous', squash: -.05 * hit, head: [-6 * hit, 0, 0] });
  [T1, T2, T3].forEach((f, i) => put(f(), ALLEY, { p: [(i - 1) * .7 + .4, 0, -5.4 + i % 2 * .4 - back * .6], ry: 200, ex: 'evil' }));
  if (lt > 1.1 && lt < 1.9) dustAt(ALLEY.localToWorld(V(-1.8, 1.3, -7)), (lt - 1.1) / .8, .5); SH.a = .5 * hit; SH.t = t;
  camA([1.5, 1.4, -9.6], [-1.1, 1.3, -7], [1.3, 1.4, -9.4], [-1.3, 1.3, -7], U(lt, 1.8), 44); }, { shutter: 3 });
// ---------------- 25 "แล้วผมก็คิดในใจคำเดียว" : eyes close, the world drains to grey ----------------
S('S24', 45.77, 'cut', ALLEY, (lt, t) => { alleyLight(); MIND = 2.8; mono(U(lt, 1.2));
  put(AR(), ALLEY, { p: [-1.45, 0, -7], ry: 90, ex: 'calm', blink: lt > .25, head: [6, 0, 0] });
  camA([.9, 1.6, -5.9], [-1.45, 1.5, -7], [.75, 1.58, -6.05], [-1.45, 1.5, -7], U(lt, 1.6), 40); });
// ---------------- 26 "พวกนายไม่ได้อยากทำแบบนี้หรอก" : eyes snap open red, the thought travels into the leader's head ----------------
S('S25', 47.59, 'cut', ALLEY, (lt, t) => { alleyLight(); mono(1);
  put(AR(), ALLEY, { p: [-1.45, 0, -7], ry: 135, ex: 'determined', head: [-9 * settle(lt, 11, 5), 0, 0] }); [T1, T2, T3].forEach((f, i) => put(f(), ALLEY, { p: [(i - 1) * .7 + .4, 0, -6 + i % 2 * .4], ry: 230, ex: 'evil' }));
  redEyes(AR(), U(lt, .25, eOut), t); whisperAt(headW(AR(), .38), headW(T1(), .4), 'พวกนายไม่ได้อยากทำแบบนี้หรอก', clamp(lt / 1.85), t, { fs: 64, dy: 260 });
  camA([.5, 1.65, -11.4], [-.6, 1.5, -6.7], [.45, 1.65, -11.0], [-.6, 1.5, -6.7], U(lt, 1.8), 50); });
// ---------------- 27 "ทั้งสามคนหยุดนิ่ง" : they freeze mid-step ----------------
S('S26', 49.55, 'cut', ALLEY, (lt, t) => { alleyLight(); mono(1 - U(lt, 1.2) * .6);
  [T1, T2, T3].forEach((f, i) => put(f(), ALLEY, { p: [(i - 1) * .7 + .4, 0, -6 + i % 2 * .4], ry: 230, ex: 'sleepy', still: true, lean: 3 }));
  camA([.6, 1.4, -2.2], [.4, 1.4, -6], [.6, 1.42, -2.5], [.4, 1.4, -6], U(lt, 1.4), 46); });
// ---------------- 28 "แววตาว่างเปล่า" : the leader's empty eyes ----------------
S('S27', 51.09, 'cut', ALLEY, (lt, t) => { alleyLight(); MIND = 2.8; mono(.4);
  put(T1(), ALLEY, { p: [-.3, 0, -6], ry: 330, ex: 'sleepy', still: true, head: [4, 0, 0] });
  camA([-1.7, 1.6, -4.4], [-.3, 1.55, -6], [-1.6, 1.6, -4.55], [-.3, 1.55, -6], U(lt, 1.2), 40); });
// ---------------- 29-30 "แล้วหันหลังเดินจากไป เหมือนไม่เคยเห็นผม" ----------------
S('S28', 52.39, 'cut', ALLEY, (lt, t) => { alleyLight(); const tu = U(lt, .6);
  [T1, T2, T3].forEach((f, i) => { const d = i * .09 + (i === 1 ? .05 : 0), tb = backOut((lt - d) / .6, 1.1), th = backOut((lt - d + .12) / .45, 1.1);
    put(f(), ALLEY, { p: [(i - 1) * .7 + .4, 0, -6 + i % 2 * .4 + Math.max(0, lt - .6 - d) * 1.1], ry: lerp(230, 360, tb), head: [0, clamp((th - tb) * 130, -40, 40), 0], ex: 'calm', ...(lt > .6 + d ? walk(lt - d, 1.4, .2) : {}) }); });
  put(AR(), ALLEY, { p: [-1.45, 0, -7], ry: 60, ex: 'shocked' });
  camA([-.6, 1.5, -10.5], [0, 1.3, -4], [-.4, 1.5, -10.2], [0, 1.3, -3], U(lt, 2.4), 46); }, { shutter: 3 });
S('S29', 53.97, 'cut', ALLEY, (lt, t) => { alleyLight(); MIND = 2.8;
  put(AR(), ALLEY, { p: [-1.45, 0, -7], ry: 125, ...pf(lt, [[0, 'shocked'], [.6, 'worried']]), head: [0, -20, 0] });
  camA([.2, 1.5, -8.7], [-1.45, 1.42, -7], [.1, 1.5, -8.5], [-1.45, 1.42, -7], U(lt, 1.2), 40); });
// ---------------- 31 "ตอนนั้นเองที่ผมรู้" : he looks at his own hand ----------------
S('S30', 55.31, 'cut', ALLEY, (lt, t) => { alleyLight(); MIND = 2.8;
  put(AR(), ALLEY, { p: [-1.2, 0, -7.4], ry: 30, ex: 'calm', hR: lp([.3, .3, .1], [.16, .6, .42], antic(lt, .2, .6, .15, .08, 1.4)), pR: [1, -.3, 0], head: [16 * U(lt - .1, .6), 0, 0] });
  camA([-.4, 1.9, -5.9], [-1.15, 1.35, -7.2], [-.5, 1.85, -6.1], [-1.15, 1.35, -7.2], U(lt, 1.4), 42); });
// ---------------- 32 "พลังของผมสั่งใครไม่ได้" : red threads hang from his fingers, loose: they control nobody ----------------
S('S31', 56.81, 'cut', ALLEY, (lt, t) => { alleyLight(); MIND = 2.8; mono(.5);
  put(AR(), ALLEY, { p: [-1.2, 0, -7.4], ry: 30, ex: 'frown', hR: [.2, .62, .42], pR: [1, -.3, 0] });
  const a = hw(AR(), 1).add(V(0, .1, 0)), dn = clamp(lt / .5); THREAD.visible = true; updateRope(THREAD, a, a.clone().add(V(.25, -1.0 * dn, .1)), { sag: .08, t, sway: .05 });
  camA([.2, 1.6, -6.3], [-1.1, 1.3, -7.3], [.15, 1.55, -6.4], [-1.1, 1.25, -7.3], U(lt, 1.7), 40); });
// ---------------- 33 "มันแค่ใส่ความคิดเล็กๆลงในหัวคน" : a tiny red spark drifts into a passer-by's head ----------------
S('S32', 58.84, 'blur', STREET, (lt, t) => { streetLight(lt); POST.sat = .55; MIND = 2.8;
  put(PX(1), STREET, { p: [0, .18, -10], ry: 20, ex: 'calm' }); const h = headW(PX(1), .2), u = U(lt, 1.6, eIO), p = h.clone().add(V(-1.4 * (1 - u), .6 * (1 - u) + .15 * Math.sin(u * Math.PI), .8 * (1 - u)));
  SEED.position.copy(p); SEED.material.opacity = lt < 1.75 ? .95 : 0; SEED.scale.setScalar(.35 + .1 * Math.sin(t * 9)); if (lt > 1.6 && lt < 2.4) shockAt(h, (lt - 1.6) / .8, .12, '#ff3040');
  camS([1.6, 1.8, -7.6], [0, 1.6, -10], [1.5, 1.75, -7.8], [0, 1.6, -10], U(lt, 2.3), 42); });
// ---------------- 34-35 "แล้วเขาจะเชื่อ ว่ามันเป็นความคิดของตัวเอง" : he nods, sure it was his own idea ----------------
S('S33', 61.43, 'cut', STREET, (lt, t) => { streetLight(lt); POST.sat = .8; MIND = 2.8;
  put(PX(1), STREET, { p: [0, .18, -10], ry: 20, ...pf(lt, [[0, 'calm'], [.8, 'confident']]), hR: lp([.3, .3, .1], [.08, .62, .34], antic(lt, .8, .4, .15, .1, 1.6)), pR: [1, -.3, 0], head: [lt > 1 ? 10 * Math.sin((lt - 1) * 9) * Math.exp(-(lt - 1) * 2) : 0, 0, 0] });
  camS([.9, 1.6, -7.7], [0, 1.55, -10], [.85, 1.6, -7.9], [0, 1.55, -10], U(lt, 2.8), 40); });
// ---------------- 36 "ผมยิ้มเป็นครั้งแรก" : the first smile, neon on wet brick ----------------
S('S34', 64.21, 'cut', ALLEY, (lt, t) => { alleyLight(); MIND = 2.8;
  put(AR(), ALLEY, { p: [-1.2, 0, -7.4], ry: 40, ...pf(lt, [[0, 'calm'], [.5, 'sly']]) });
  camA([.5, 1.6, -5.9], [-1.2, 1.52, -7.4], [.4, 1.58, -6.0], [-1.2, 1.52, -7.4], U(lt, 1.4), 40); });
// ---------------- 37 "นับตั้งแต่มาถึงที่นี่" : pull up and away, the alley tiny under the city ----------------
S('S35', 65.57, 'cut', ALLEY, (lt, t) => { alleyLight();
  put(AR(), ALLEY, { p: [-1.2, 0, -7.4], ry: 40, ex: 'sly' });
  camA([0, 2.2, -3.5], [-1.1, 1, -7.4], [0, 8.5, -2], [-1, .6, -8], U(lt, 1.5, eSine), 44); }, { shutter: 3 });
// ---------------- 38 "แต่จากความมืดท้ายตรอก" : behind the hooded shape in the dark end of the alley ----------------
S('S36', 67.08, 'cut', ALLEY, (lt, t) => { alleyLight({ hemiI: .9 }); setRig(RIGS.silhouette); Z.dark.visible = false;
  put(GM(), ALLEY, { p: [.6, 0, -16.5], ry: 0, ex: 'calm' }); put(AR(), ALLEY, { p: [-1.2, 0, -7.4], ry: 40, ex: 'sly' });
  camA([1.25, 1.75, -18.4], [-1.0, 1.35, -7.4], [1.1, 1.7, -18.0], [-1.0, 1.35, -7.4], U(lt, 1.4), 40); });
// ---------------- 39 "มีปืนกระบอกหนึ่ง" : the barrel slides out of the dark, the laser clicks on ----------------
S('S37', 68.77, 'cut', ALLEY, (lt, t) => { alleyLight({ hemiI: .8 }); MIND = 0; const out = backOut(lt / .6, 1.3), on = lt > .7 ? 1 : 0;
  const from = [.45, 1.45, -16.8 + .45 * out]; ZC.laserAt(from, on ? [-1.2, 1.55, -7.4] : [from[0], from[1], from[2] + .05], 1); Z.laser.visible = !!on;
  neonPt(2, ALLEY.localToWorld(V(1.2, 1.9, -16)), '#ffc8b0', 1.4, 3); camA([1.45, 1.55, -16.0], [.45, 1.45, -16.2], [1.38, 1.53, -15.95], [.45, 1.45, -16.1], U(lt, 1.2), 34); });
// ---------------- 40 "เล็งมาที่หัวผมแล้ว" : the red dot lands on his forehead; his eyes slide to it ----------------
S('S38', 70.14, 'cut', ALLEY, (lt, t) => { alleyLight({ hemiI: .85 }); MIND = 2.8;
  put(AR(), ALLEY, { p: [-1.2, 0, -7.4], ry: 40, ...pf(lt, [[0, 'sly'], [.7, 'sneaky']]), head: [0, -9 * eIO(clamp((lt - 1.0) / .8)), 0] }); const hd = ALLEY.worldToLocal(headW(AR(), .42));
  ZC.laserAt([.45, 1.45, -16.35], [hd.x, hd.y, hd.z + .02], 1); SH.a = 0; OVL.push({ kind: 'dot', p: headW(AR(), .42), k: .9 + .1 * Math.sin(t * 5), r: 16 }); lightAt(headW(AR(), .42), '#ff2030', .5, .7);
  camA([.3, 1.6, -5.6], [-1.2, 1.52, -7.4], [.15, 1.58, -5.8], [-1.2, 1.52, -7.4], U(lt, 2.5, eOut), 38); }, { rain: .6 });

export function initShots(timing) { TM.env = timing.env; for (let i = 0; i < SHOTS.length; i++) SHOTS[i].t1 = i + 1 < SHOTS.length ? SHOTS[i + 1].t0 : timing.end; }
export function runShot(sh, t) { reset(t); sh.fn(t - sh.t0, t); }
export const WHITEK = { k: 0 };
export const COVER = { id: 'COVER', t0: 0, fn: (lt, t, o = {}) => { reset(10); ALLEY.visible = true; alleyLight(); ZC.alleyAt(10, 0);
  put(AR(), ALLEY, { p: [-1.2, 0, -7.4], ry: 30, ex: 'sly' }); redEyes(AR(), .9, 10); THREAD.visible = true; const a = hw(AR(), 1); updateRope(THREAD, a, a.clone().add(V(.4, -.9, .2)), { sag: .1, t: 10 });
  const cm = o.cam || [.9, 1.45, -4.6], g = o.tgt || [-1.1, 1.75, -7.4]; MIND = 0; camA(cm, g, cm, g, 0, o.fov || 44); } };
export const BENCH = { id: 'BENCH', t0: 0, fn: (lt, t, o = {}) => { reset(0); if (o.roof) { ZC.ROOF.visible = true; ZC.roofAt(3); alleyLight(); setRig(RIGS.alley); put(GM(), ZC.ROOF, { p: [0, 0, -6.2], ry: 180, ex: 'evil' }); const c = o.cam, g = o.tgt; look(V(...c).add(ZC.ROOF.position), V(...g).add(ZC.ROOF.position), o.fov || 50); ZC.zcLate(3, camera); return; } STREET.visible = true; streetLight(0); if (o.rig) setRig({ ...RIGS.street, ...o.rig }); const ids = ['aren', 'guard', 'fire', 'strong', 'thug1', 'thug2', 'thug3', 'gunman'];
  if (o.act) { const L = o.act, n = L.length, sp = o.sp ?? .85; ids.forEach((id) => put(CHARS[id], STREET, { p: [0, -50, -30], visible: false }));
    L.forEach((a, i) => { const id = o.who ? o.who[i % o.who.length] : ids[i % ids.length]; const pz = o.beats ? perform(o.lt, o.beats, { seed: i }) : typeof a === 'string' && POSES[a] && !o.faceOnly ? perform(5, [[0, a]], { seed: i, still: true }) : a.includes('|') ? { ex: a.split('|')[0], talk: a.split('|')[1] } : { ex: a };
      put(CHARS[id], STREET, { p: [(i - (n - 1) / 2) * sp, .18, -9], ry: o.ry ?? 0, ...pz, blink: false, still: true }); });
    const bc = o.cam || [0, 1.4, -2.6], bt = o.tgt || [0, 1.1, -9]; camS(bc, bt, bc, bt, 0, o.fov || 44); return; }
  ids.forEach((id, i) => put(CHARS[id], STREET, { p: [(i - 3.5) * .85, .18, -9], ry: o.ry ?? 0, ex: ['sly', 'angry', 'grinTeeth', 'confident', 'evil', 'sneaky', 'frown', 'calm'][i] }));
  const bc = o.cam || [0, 1.4, -2.6], bt = o.tgt || [0, 1.1, -9]; camS(bc, bt, bc, bt, 0, o.fov || 44); } };
