// shots.js: THE PUPPET MASTER ep 2 "เหยื่อที่เลือกผู้ล่า" (71.33 s) - times are real seconds, clocks run 1:1 (SP = 1)
import { THREE, setSmoothLight, scene, camera, clamp, lerp, sstep, eIO, eOut, eIn, eSine, D2R, noise1, rng, POST, mesh, rbox, toon, basic, group, cylBetween } from './engine.js';
import * as Wd from './world.js';
import * as ZC from './zc.js';
import { perform, POSES } from './acting.js';
import { bigWord } from './text3d.js';
import { sparks } from './fxphys.js';
import { turn, take, hitReact, hold, trauma } from './motion.js';
import { gaze, exShift } from './acting.js';
import { CHARS, OVL, lipAt, scribbleAt, headBall, beamAt, setRig, lightAt, pose, popAt, sparkAt, dustAt, debrisAt, smokeAt, tintAt, rainAt, shockAt, whisperAt, makeRope, updateRope } from './chars.js';
const { TRUCK, GATE, STREET, ALLEY, ROOF, Z } = ZC;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const TM = { env: [] };
const SP = 1;
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
const camT = camO(TRUCK), camG = camO(GATE), camS = camO(STREET), camA = camO(ALLEY), camR = camO(ROOF);
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
  Z.car.position.set(3.2, 0, -14); Z.car.rotation.set(0, 0, 0); POST.sat = 1.05; POST.lift = 1; POST.vig = .45; MIND = 2.6; hideGuns(); }
const S = (id, t0, tr, set, fn, o = {}) => { const sh = { id, t0, tr, ...o }; sh.fn = (lt, t) => { set.visible = true; ZC.zcAt(t * SP, camera); if (set === STREET) ZC.streetAt(t * SP); if (set === ALLEY) ZC.alleyAt(t * SP); if (set === GATE) ZC.gateAt(t * SP, 0); if (set === ROOF) ZC.roofAt(t);
  fn(lt * SP, t * SP); scene.updateMatrixWorld(); faceFires(camera); ZC.zcLate(t * SP, camera); if (o.rain !== false && set !== TRUCK) rainAt(t * SP, o.rain ?? .5); Wd.ambientAt(t, null); }; SHOTS.push(sh); };

// ===================================================================== EP 2 SHOTS
const RF = () => CHARS.thug2;   // the friend on the roof (red bandana reads at a distance)
const G1 = ZC.makeGun(scene), G2 = ZC.makeGun(scene);
function hideGuns() { G1.visible = G2.visible = false; }
const gunR = (g, rot = [90, 180, 0], off = [0, -.02, .02]) => { g.visible = true; return { R: { obj: g, off, rot, mass: .3 } }; };
function roofLight() { setRig(RIGS.alley); nightCity({ hemiI: 1.8, sunI: .9, fog: '#1a1428', fogN: 14, fogF: 70 }); Wd.setShadowFocus(600, 1, 600, 10);
  neonPt(0, ROOF.localToWorld(V(0, 4.5, 6)), '#ff2f6a', 6, 14); neonPt(1, ROOF.localToWorld(V(4.5, 2.4, 3)), '#ffd8a0', 3, 8); }
const AP = [0, 0, -8], GP = [0, 0, -6.45];                       // Aren and the gunman, face to face in the alley
const aimAt = (C, tgt) => { scene.updateMatrixWorld(); return tgt; };
const shiver = (t, k = 1) => [.006 * k * Math.sin(t * 47), .005 * k * Math.sin(t * 61 + 1), 0];   // a trembling hand (small, fast, uneven)
const GUNPOSE = (t, k = 1, up = 0) => { const s = shiver(t, k); return { hR: [.14 + s[0], .98 + up + s[1], .74], pR: [1, -.4, -.2], hL: [-.3, .3, .1] }; };
// ---------------- 0 "ปืนจ่ออยู่ที่หัวผม" : over the gunman's shoulder, the barrel at Aren's forehead ----------------
S('E01', 0, 'cut', ALLEY, (lt, t) => { alleyLight(); MIND = 1.2;
  put(GM(), ALLEY, { p: GP, ry: 180, ex: 'confident', ...GUNPOSE(t, .4), hold: gunR(G1) });
  put(AR(), ALLEY, { p: AP, ry: 0, ex: 'stoic', look: gaze(lt, 'stare') });
  bigWord(ALLEY, 'PUPPET', [0, 3.2, -16], { h: 1.5, k: (lt - .1) / .6, col: '#ff4f8b', op: .8 });
  camA([1.05, 1.85, -4.6], [-.05, 1.62, -8], [.9, 1.8, -4.95], [-.05, 1.62, -8], U(lt, 2.0, eOut), 38); });
// ---------------- 1 "แต่ผมไม่ได้มองปืน" : Aren's face, eyes past the barrel to the man's eyes ----------------
S('E02', 1.8, 'cut', ALLEY, (lt, t) => { alleyLight(); MIND = 2.6;
  put(AR(), ALLEY, { p: AP, ry: 0, ex: 'focused', look: [0, -.15], head: [-3, 0, 0] }); put(GM(), ALLEY, { p: GP, ry: 180, ex: 'confident', ...GUNPOSE(t, .4), hold: gunR(G1) });
  camA([-1.45, 1.7, -5.3], [0, 1.62, -8], [-1.35, 1.69, -5.5], [0, 1.62, -8], U(lt, 1.8), 36); });
// ---------------- 2 "พลังอะไรก็ช่วยแกไม่ได้หรอก" : the gunman sneers (he talks) ----------------
S('E03', 3.6, 'cut', ALLEY, (lt, t) => { alleyLight(); MIND = 2.6;
  put(GM(), ALLEY, { p: GP, ry: 180, ...exShift(lt, .9, 'confident', 'mocking'), talk: talkAt(t), head: [-4, 0, 6], ...GUNPOSE(t, .4), hold: gunR(G1) });
  put(AR(), ALLEY, { p: AP, ry: 0, ex: 'stoic' });
  camA([1.4, 1.65, -9.1], [0, 1.68, -6.45], [1.3, 1.65, -8.9], [0, 1.68, -6.45], U(lt, 2.0), 38); });
// ---------------- 3 "เขาดูมั่นใจมาก" : low angle, chin up ----------------
S('E04', 5.6, 'cut', ALLEY, (lt, t) => { alleyLight(); MIND = 2.6;
  put(GM(), ALLEY, { p: GP, ry: 180, ex: 'confident', head: [-9, 0, 0], lean: -4, ...GUNPOSE(t, .5), hold: gunR(G1) });
  camA([-.6, .7, -9.3], [0, 1.7, -6.45], [-.45, .75, -9.0], [0, 1.72, -6.45], U(lt, 1.8), 40); });
// ---------------- 4 "แต่มือที่ถือปืน สั่นนิด ๆ" : macro on the trembling hand ----------------
S('E05', 7.4, 'cut', ALLEY, (lt, t) => { alleyLight(); MIND = 0;
  put(GM(), ALLEY, { p: GP, ry: 180, ex: 'anxious', ...GUNPOSE(t, 2.2), hold: gunR(G1) }); scene.updateMatrixWorld(); const h = G1.getWorldPosition(V()); const hl = ALLEY.worldToLocal(h.clone());
  camA([hl.x + .55, hl.y + .05, hl.z - .9], [hl.x, hl.y, hl.z], [hl.x + .48, hl.y + .04, hl.z - .82], [hl.x, hl.y, hl.z], U(lt, 2.0), 30); });
// ---------------- 5-6 "และสายตาของเขา คอยเหลือบไปด้านหลังตลอด" : his eyes keep flicking up behind him ----------------
S('E06', 9.65, 'cut', ALLEY, (lt, t) => { alleyLight(); MIND = 2.4; const flick = (lt % 1.3) > .55 && (lt % 1.3) < 1.0;
  put(GM(), ALLEY, { p: GP, ry: 180, ex: flick ? 'anxious' : 'confident', look: flick ? [.8, -.85] : [0, 0], head: [0, flick ? 10 : 0, 0], ...GUNPOSE(t, .6), hold: gunR(G1) });
  camA([.35, 1.68, -9.2], [0, 1.68, -6.45], [.28, 1.68, -9.05], [0, 1.68, -6.45], U(lt, 3.0), 30); });
// ---------------- 7 "เขาไม่ได้มาคนเดียว" : PUSH up to the roof: a second shape at the parapet ----------------
S('E07', 12.85, 'push', ROOF, (lt, t) => { roofLight();
  put(RF(), ROOF, { p: [0, 0, -6.1], ry: 180, ex: 'evil', lean: 14, hipY: -.06, hR: [.12, .95, .62], pR: [1, -.4, -.2], hL: [-.12, .9, .55], hold: gunR(G2) });
  camR([3.4, 2.8, -1.5], [0, 1.2, -6.2], [2.9, 2.6, -2.2], [0, 1.2, -6.2], U(lt, 1.6), 44); }, { dir: 'D' });
// ---------------- 8 "บนหลังคา มีเพื่อนของเขาอีกคน" : the friend, red marker ring ----------------
S('E08', 14.35, 'cut', ROOF, (lt, t) => { roofLight(); MIND = 2.6;
  put(RF(), ROOF, { p: [0, 0, -6.1], ry: 160, ex: 'sneaky', lean: 12, hipY: -.06, hR: [.12, .95, .62], pR: [1, -.4, -.2], hL: [-.12, .9, .55], hold: gunR(G2) });
  scribbleAt(RF(), (lt - .45) / .5, .14);
  camR([-1.3, 1.5, -8.6], [0, 1.45, -6.1], [-1.1, 1.5, -8.4], [0, 1.45, -6.1], U(lt, 2.2), 38); }, { rain: .4 });
// ---------------- 9 "ปืนอีกกระบอก" : the second barrel over the ledge ----------------
S('E09', 16.85, 'cut', ROOF, (lt, t) => { roofLight(); MIND = 0;
  put(RF(), ROOF, { p: [0, 0, -6.1], ry: 180, ex: 'evil', lean: 14, hipY: -.06, hR: [.12, .95, .62], pR: [1, -.4, -.2], hL: [-.12, .9, .55], hold: gunR(G2) }); scene.updateMatrixWorld(); const h = ROOF.worldToLocal(G2.getWorldPosition(V()));
  camR([h.x - .7, h.y + .12, h.z - .55], [h.x, h.y, h.z], [h.x - .6, h.y + .1, h.z - .5], [h.x, h.y, h.z], U(lt, 1.3), 32); }, { rain: .4 });
// ---------------- 10 "ผมไม่ได้พูดอะไรสักคำ" : PUSH back down: Aren silent, eyes steady ----------------
S('E10', 18.1, 'push', ALLEY, (lt, t) => { alleyLight(); MIND = 2.6;
  put(AR(), ALLEY, { p: AP, ry: 0, ex: 'stoic', look: gaze(lt, 'stare'), head: [2, 0, 0] }); put(GM(), ALLEY, { p: GP, ry: 180, ex: 'confident', ...GUNPOSE(t, .5), hold: gunR(G1) });
  camA([.7, 1.62, -5.4], [-.05, 1.62, -8], [.62, 1.62, -5.6], [-.05, 1.62, -8], U(lt, 1.6), 36); }, { dir: 'U' });
// ---------------- 11 "แค่ส่งความคิดหนึ่งประโยคเข้าไป" : the power: grey world, red eyes, a red spark drifts into his head ----------------
S('E11', 19.75, 'cut', ALLEY, (lt, t) => { alleyLight(); MIND = 1.4; mono(U(lt, .8));
  put(AR(), ALLEY, { p: AP, ry: 0, ex: 'menace' }); put(GM(), ALLEY, { p: GP, ry: 180, ex: 'confident', ...GUNPOSE(t, .5), hold: gunR(G1) });
  redEyes(AR(), U(lt - .2, .3, eOut), t); const a = headW(AR(), .38), b = headW(GM(), .4), u = clamp((lt - .5) / 1.3); SEED.position.lerpVectors(a, b, eIO(u)).add(V(0, Math.sin(Math.PI * u) * .25, 0)); SEED.material.opacity = u > 0 && u < 1 ? .9 : 0;
  camA([1.2, 3.0, -11.2], [0, 1.6, -7.0], [1.05, 2.9, -10.8], [0, 1.6, -7.0], U(lt, 2.0), 46); });
// ---------------- 12-14 whisper: "ระวังข้างหลัง… เพื่อนแกกำลังจะยิงแก" : the words float into the gunman's ear ----------------
S('E12', 22.2, 'cut', ALLEY, (lt, t) => { alleyLight(); MIND = 2.4; mono(1);
  put(GM(), ALLEY, { p: GP, ry: 180, ...exShift(lt, 1.5, 'confident', 'dread'), look: lt > 1.6 ? [.6, -.5] : [0, 0], ...GUNPOSE(t, .5 + lt * .5), hold: gunR(G1) });
  put(AR(), ALLEY, { p: AP, ry: 0, ex: 'menace' }); redEyes(AR(), 1, t);
  whisperAt(headW(AR(), .38), headW(GM(), .4), 'ระวังข้างหลัง… เพื่อนแกกำลังจะยิงแก', clamp(lt / 2.5), t, { fs: 60, dy: 240 });
  camA([1.35, 1.72, -9.0], [0, 1.68, -6.45], [1.25, 1.7, -8.8], [0, 1.68, -6.45], U(lt, 2.8), 38); });
// ---------------- 15 "ชายตรงหน้าหันขวับไปด้านหลังทันที" : the whip turn, gun swings up to the roof ----------------
S('E13', 25.05, 'cut', ALLEY, (lt, t) => { alleyLight(); MIND = 2.6; mono(1 - U(lt, .5));
  const T = turn(lt, .1, .45, 180, 20, { snap: 1.6 }), up = U(lt - .25, .35, eOut);
  put(GM(), ALLEY, { p: GP, ...T, ex: 'shocked', hR: [.1, 1.18 + .5 * up, .62], pR: [1, -.4, -.2], hold: gunR(G1), fast: true });
  put(AR(), ALLEY, { p: AP, ry: 0, ex: 'stoic' }); SH.a = .25 * Math.max(0, 1 - lt / .6);
  camA([1.5, 1.55, -5.4], [0, 1.6, -7.0], [1.45, 1.55, -5.5], [0, 1.6, -7.0], U(lt, 2.0), 52); });
// ---------------- 16 "และในวินาทีนั้นเอง" : on the roof the friend sees a gun swing up at him ----------------
S('E14', 27.6, 'cut', ROOF, (lt, t) => { roofLight(); MIND = 2.6;
  put(RF(), ROOF, { p: [0, 0, -6.1], ry: 180, ...exShift(lt, .35, 'evil', 'shocked'), lean: 10 - 12 * U(lt - .3, .3), hipY: -.06, hR: [.12, .95, .62], pR: [1, -.4, -.2], hL: [-.12, .9, .55], hold: gunR(G2) });
  camR([.9, 1.4, -9.0], [0, 1.4, -6.1], [.8, 1.4, -8.7], [0, 1.4, -6.1], U(lt, 1.4), 34); }, { rain: .4 });
// ---------------- 17 "เสียงปืนก็ดังขึ้น" : he fires (2-frame flash), recoil, smoke ----------------
S('E15', 29.0, 'cut', ROOF, (lt, t) => { roofLight(); MIND = 2.6; const age = lt - .18, rc = age > 0 ? Math.exp(-age * 9) * Math.sin(Math.min(Math.PI, age * 14)) : 0;
  put(RF(), ROOF, { p: [0, 0, -6.1], ry: 180, ex: 'rage', lean: 12 - 8 * rc, hipY: -.06, hR: [.12, .95 + .12 * rc, .62 - .1 * rc], pR: [1, -.4, -.2], hL: [-.12, .9, .55], hold: gunR(G2), fast: true });
  scene.updateMatrixWorld(); const fl = ZC.gunFlashAt(G2, age, camera); if (fl) lightAt(G2.getWorldPosition(V()), '#ffd89a', 3.2, 1);
  SH.a = trauma(lt, [[.18, .55]]); SH.t = t;
  camR([2.4, 1.2, -8.4], [0, 1.3, -6.3], [2.3, 1.2, -8.3], [0, 1.3, -6.3], U(lt, 1.3), 40); }, { rain: .4 });
// ---------------- 18 "กระสุนเฉียดไหล่เขาไปอย่างเฉียดฉิว" : slow motion: a streak past his shoulder, sparks on the brick ----------------
S('E16', 30.45, 'cut', ALLEY, (lt, t) => { alleyLight(); MIND = 2.6; const r = Wd.ramp ? lt : lt, u = clamp((lt - .15) / .5);
  put(GM(), ALLEY, { p: GP, ry: 20, ex: lt < .45 ? 'shocked' : 'pain', ...hitReact(lt, .45, 1, .8), hR: [.1, 1.68, .62], pR: [1, -.4, -.2], hold: gunR(G1) });
  put(AR(), ALLEY, { p: AP, ry: 0, ex: 'stoic' });
  const A = ALLEY.localToWorld(V(.6, 9, -4)), B = ALLEY.localToWorld(V(-.35, 1.0, -6.9)), p = V().lerpVectors(A, B, u), q = V().lerpVectors(A, B, Math.max(0, u - .18));
  if (u > 0 && u < 1) beamAt(q, p, t, 1, '#ffe8b0');
  const SP1 = sparks({ at: B, normal: [0, 1, .4], t0: .65, n: 18, speed: 3.2, cone: .9, life: .6, floor: 0, seed: 7 }); SP1.at(lt);
  camA([1.6, 1.4, -4.6], [-.1, 1.5, -6.6], [1.5, 1.38, -4.7], [-.1, 1.5, -6.6], U(lt, 2.0), 46); });
// ---------------- 19 "แก! แกจะยิงฉันเหรอ!" : he screams up at the roof ----------------
S('E17', 33.1, 'cut', ALLEY, (lt, t) => { alleyLight(); MIND = 2.6;
  put(GM(), ALLEY, { p: GP, ry: 20, ex: 'rage', talk: talkAt(t), head: [-18, 0, 0], lean: -6, hR: [.12, 1.75, .55], pR: [1, -.4, -.2], hold: gunR(G1) });
  camA([.9, .9, -4.2], [0, 1.9, -6.45], [.85, .95, -4.35], [0, 1.9, -6.45], U(lt, 1.6), 40); });
// ---------------- 20-21 "ฉันเปล่า! ฉันยิงคนนั้นต่างหาก!" : the friend shouts back, pointing down at Aren ----------------
S('E18', 34.85, 'cut', ROOF, (lt, t) => { roofLight(); MIND = 2.6;
  put(RF(), ROOF, { p: [0, 0, -6.1], ry: 180, ...exShift(lt, .8, 'terror', 'annoyedHard'), talk: talkAt(t), lean: 16, head: [14, 0, 0], hR: [.18, .78, .66], pR: [1, -.4, -.2], hL: [-.4, .9, .4], hold: gunR(G2) });
  camR([-.8, .9, -8.9], [0, 1.5, -6.1], [-.7, .95, -8.7], [0, 1.5, -6.1], U(lt, 1.9), 40); }, { rain: .4 });
// ---------------- 22 "แต่ไม่มีใครเชื่อใครอีกแล้ว" : the gunman's glare, finger tight ----------------
S('E19', 36.9, 'cut', ALLEY, (lt, t) => { alleyLight(); MIND = 2.6;
  put(GM(), ALLEY, { p: GP, ry: 20, ex: 'glare', head: [-16, 0, 0], hR: [.12, 1.75, .55], pR: [1, -.4, -.2], hold: gunR(G1), ...{ side: 2 * Math.sin(t * 1.3) } });
  camA([-.3, 1.15, -4.5], [0, 1.85, -6.45], [-.25, 1.18, -4.65], [0, 1.85, -6.45], U(lt, 1.9), 40); });
// ---------------- 23 "ทั้งสองคนหันปืนเข้าหากัน" : the friend levels his gun down at his partner ----------------
S('E20', 38.9, 'cut', ROOF, (lt, t) => { roofLight(); MIND = 2.6;
  put(RF(), ROOF, { p: [0, 0, -6.1], ry: 180, ex: 'glare', lean: 16, head: [16, 0, 0], hR: [.12, .9, .66], pR: [1, -.4, -.2], hL: [-.12, .88, .58], hold: gunR(G2) });
  camR([2.0, 2.4, -3.6], [0, 1.2, -6.1], [1.85, 2.3, -3.9], [0, 1.2, -6.1], U(lt, 2.2), 44); }, { rain: .4 });
// ---------------- 24 "ส่วนผม… แค่เดินออกจากตรอกเงียบ ๆ" : a dark shape wipes past; Aren walks away behind them ----------------
S('E21', 41.2, 'fgwipe', ALLEY, (lt, t) => { alleyLight(); MIND = 2.6; const z = -8 + lt * 1.1;
  put(GM(), ALLEY, { p: GP.map((v, i) => i === 0 ? .5 : v), ry: 20, ex: 'glare', head: [-16, 0, 0], hR: [.12, 1.75, .55], pR: [1, -.4, -.2], hold: gunR(G1) });
  put(AR(), ALLEY, { p: [-.9, 0, z], ry: 0, ex: 'calm', ...walk(lt, 1.5, .2), hL: [-.18, .42, -.12], hR: [.18, .42, -.12] });
  camA([-.2, 1.5, z + 3.4], [-.9, 1.3, z], [-.25, 1.5, z + 3.2], [-.9, 1.3, z], U(lt, 2.6), 44); });
// ---------------- 25 "ผมไม่ต้องสร้างความเกลียดขึ้นมาใหม่" : tracking beside him, a small knowing look ----------------
S('E22', 44.1, 'cut', ALLEY, (lt, t) => { alleyLight(); MIND = 2.6; const z = -4.6 + lt * 1.1;
  put(AR(), ALLEY, { p: [-.9, 0, z], ry: 0, ex: 'sly', look: gaze(lt, 'idle', 3), ...walk(lt, 1.5, .2), hL: [-.18, .42, -.12], hR: [.18, .42, -.12] });
  camA([.9, 1.55, z + 1.6], [-.9, 1.45, z], [.9, 1.55, z + 1.7], [-.9, 1.45, z], U(lt, 1.9), 40); });
// ---------------- 26 "แค่ทำให้เขาสงสัย ในสิ่งที่เชื่ออยู่แล้ว" : over his shoulder: far behind, the two still aiming ----------------
S('E23', 46.0, 'cut', ALLEY, (lt, t) => { alleyLight(); MIND = 1.2; const z = -2.6 + lt * .9;
  put(AR(), ALLEY, { p: [-.9, 0, z], ry: 160, ...exShift(lt, 1.2, 'sly', 'sinister'), ...walk(lt, 1.2, .14) });
  put(GM(), ALLEY, { p: [.5, 0, -6.45], ry: 20, ex: 'glare', head: [-16, 0, 0], hR: [.12, 1.75, .55], pR: [1, -.4, -.2], hold: gunR(G1) });
  camA([-.2, 1.75, z + 1.5], [.4, 1.5, -6.6], [-.25, 1.72, z + 1.45], [.4, 1.5, -6.6], U(lt, 2.6), 40); });
// ---------------- 27 "ก่อนเลี้ยวพ้นตรอก" : at the mouth of the alley he slows ----------------
S('E24', 49.0, 'cut', ALLEY, (lt, t) => { alleyLight(); MIND = 2.6; const z = 1.4 + .9 * U(lt, 1.0, eOut);
  put(AR(), ALLEY, { p: [-.6, 0, z], ry: lp([0], [-50], U(lt - .4, .6))[0], ex: 'calm', ...(lt < 1 ? walk(lt, 1.2, .12) : {}), head: [0, -20 * U(lt - .5, .5), 0] });
  camA([1.0, 1.5, 5.6], [-.6, 1.4, z], [.9, 1.5, 5.4], [-.6, 1.4, z], U(lt, 1.3), 42); });
// ---------------- 28 "ผมเห็นข้อความพ่นสีบนกำแพง" : he turns to the wall; red spray paint ----------------
const TAG1 = 'ผู้แข็งแกร่งเท่านั้น', TAG2 = 'ที่มีสิทธิ์ครองเขตแดน';
function graffiti(k1, k2) { bigWord(ALLEY, TAG1, [-1.88, 3.0, 2.6], { ry: 90, h: .6, k: k1, col: '#ff3a3a', op: .95, font: '900 200px Prompt' }); bigWord(ALLEY, TAG2, [-1.88, 2.25, 2.6], { ry: 90, h: .5, k: k2, col: '#ff3a3a', op: .95, font: '900 200px Prompt' }); }
S('E25', 50.3, 'cut', ALLEY, (lt, t) => { alleyLight(); MIND = 2.6; graffiti(1, 1);
  put(AR(), ALLEY, { p: [-.6, 0, 2.3], ry: -80, ex: 'thinking', look: [-.3, -.6], head: [-8, 0, 0] });
  camA([1.4, 1.55, 5.2], [-1.0, 1.9, 2.4], [1.3, 1.55, 4.9], [-1.0, 2.0, 2.4], U(lt, 2.2), 52); });
// ---------------- 29-30 "ผู้แข็งแกร่งเท่านั้น / ที่มีสิทธิ์ครองเขตแดน" : slow pan across the words ----------------
S('E26', 52.7, 'cut', ALLEY, (lt, t) => { alleyLight(); MIND = 0; graffiti(1, 1);
  camA([.6, 2.75, 4.2], [-1.88, 2.65, 3.4], [.6, 2.6, 1.0], [-1.88, 2.55, 1.9], U(lt, 3.3), 46); });
// ---------------- 31 "ผมเริ่มเข้าใจเมืองนี้แล้ว" : PUSH out to the neon street ----------------
S('E27', 56.15, 'push', STREET, (lt, t) => { streetLight(lt); MIND = 2.6;
  put(AR(), STREET, { p: [0, .18, -6.5], ry: 180, ex: 'calm' }); put(ST(), STREET, { p: [1.6, .18, -13], ry: -20, ex: 'confident', ...walk(lt, 1.2) }); put(PX(1), STREET, { p: [-1.5, .18, -15], ry: 25, ex: 'frown', ...walk(lt + .4, 1.3) });
  camS([.6, 2.1, -3.2], [0, 1.8, -14], [.4, 2.0, -3.6], [0, 1.8, -14], U(lt, 1.9), 46); }, { dir: 'L' });
// ---------------- 32 "คนที่นี่ไม่ได้สู้เพื่อความถูกต้อง" : the fire man and the strong man square off ----------------
S('E28', 58.05, 'cut', STREET, (lt, t) => { streetLight(lt); MIND = 2.6;
  put(FI(), STREET, { p: [-.9, .18, -11], ry: 60, ex: 'rage', hR: [.3, .9, .4], pR: [1, -.3, 0] }); HF.visible = true; handFire(t, 1); FI().g.updateMatrixWorld(true); HF.position.copy(hw(FI(), 1)).add(V(0, .1, 0));
  put(ST(), STREET, { p: [.9, .18, -11.2], ry: -60, ex: 'annoyedHard', hL: [-.38, .34, .08], hR: [.38, .34, .08], pL: [-1, -.3, -.3], pR: [1, -.3, -.3], lean: 6 });
  camS([-1.0, 1.5, -6.0], [0, 1.4, -11], [-.9, 1.5, -6.3], [0, 1.4, -11], U(lt, 2.2), 44); });
// ---------------- 33 "พวกเขาสู้เพื่ออำนาจ" : low angle, the winner over a man on the ground ----------------
S('E29', 60.45, 'cut', STREET, (lt, t) => { streetLight(lt); MIND = 2.6;
  put(ST(), STREET, { p: [0, .18, -11], ry: -10, ex: 'smug', lean: -6, head: [-10, 0, 0], hL: [-.34, .5, -.05], hR: [.34, .5, -.05], pL: [-1, 0, -.3], pR: [1, 0, -.3] });
  put(T3(), STREET, { p: [1.0, .18, -11.8], ry: -60, sit: true, ex: 'hurtX', lean: 20, head: [20, 0, 0] });
  camS([.8, .6, -7.6], [0, 1.9, -11], [.7, .65, -7.8], [0, 1.95, -11], U(lt, 1.8), 44); });
// ---------------- 34 "และถ้าผมอยากรอด" : Aren close, rain on him ----------------
S('E30', 62.25, 'cut', STREET, (lt, t) => { streetLight(lt); MIND = 2.6;
  put(AR(), STREET, { p: [0, .18, -6.5], ry: 0, ...exShift(lt, .5, 'stoic', 'determinedHard'), head: [-2, 0, 0] });
  camS([.5, 1.75, -3.9], [0, 1.75, -6.5], [.42, 1.74, -4.0], [0, 1.75, -6.5], U(lt, 1.4), 36); });
// ---------------- 35 "ผมต้องมีคนที่ยอมเดินตามความคิดของผม" : red threads from his fingers drift to passers-by ----------------
S('E31', 63.65, 'cut', STREET, (lt, t) => { streetLight(lt); MIND = 2.6; mono(.55 * U(lt, .8));
  put(AR(), STREET, { p: [.4, .18, -7.6], ry: 230, ex: 'menace', hR: [.3, .95, .45], pR: [1, -.3, 0] }); redEyes(AR(), .7, t);
  put(PX(1), STREET, { p: [-1.6, .18, -10.4], ry: 30, ex: 'calm', ...walk(lt, 1.1) }); put(PX(2), STREET, { p: [2.2, .18, -11.2], ry: -30, ex: 'calm', ...walk(lt + .3, 1.1) });
  THREAD.visible = true; const a = hw(AR(), 1); updateRope(THREAD, a, headW(PX(1), .6), { sag: .5, t });
  camS([1.0, 2.1, -14.8], [.2, 1.5, -8.0], [.9, 2.05, -14.3], [.2, 1.5, -8.0], U(lt, 2.4), 44); });
// ---------------- 36 "ตั้งแต่คืนนี้" : his back to us, ZERO CITY ahead, the big word behind the street ----------------
S('E32', 66.5, 'cut', STREET, (lt, t) => { streetLight(lt); MIND = 2.6;
  put(AR(), STREET, { p: [0, .18, -6.5], ry: 180, ex: 'calm' });
  bigWord(STREET, 'PUPPET MASTER', [0, 3.2, -18], { h: 1.3, k: (lt - .1) / .6, col: '#ff2a3a', op: .85 });
  camS([.3, 1.5, -3.2], [0, 2.2, -16], [.25, 1.55, -3.6], [0, 2.3, -16], U(lt, 1.4), 46); });
// ---------------- 37 "ผมจะไม่เป็นฝ่ายถูกล่าอีกแล้ว" : he turns his head to us, red eyes, the first real smile of a hunter ----------------
S('E33', 67.85, 'cut', STREET, (lt, t) => { streetLight(lt); MIND = 2.6;
  put(AR(), STREET, { p: [0, .18, -6.5], ...turn(lt, .3, .7, 180, 20), ...exShift(lt, 1.0, 'calm', 'sinister') }); redEyes(AR(), U(lt - 1.0, .3, eOut), t);
  camS([.6, 1.72, -3.9], [0, 1.72, -6.5], [.5, 1.72, -4.1], [0, 1.72, -6.5], U(lt, 3.3, eOut), 36); });

export function initShots(timing) { TM.env = timing.env; TM.vis = timing.vis; for (let i = 0; i < SHOTS.length; i++) SHOTS[i].t1 = i + 1 < SHOTS.length ? SHOTS[i + 1].t0 : timing.end; }
export function runShot(sh, t) { reset(t); sh.fn(t - sh.t0, t); }
export const WHITEK = { k: 0 };
export const COVER = { id: 'COVER', t0: 0, fn: (lt, t, o = {}) => { reset(10); ALLEY.visible = true; alleyLight(); ZC.alleyAt(10, 0);
  put(AR(), ALLEY, { p: AP, ry: 0, ex: 'sinister' }); redEyes(AR(), .9, 10); put(GM(), ALLEY, { p: GP, ry: 180, ex: 'anxious', ...GUNPOSE(10, 0), hold: gunR(G1) });
  const cm = o.cam || [-1.15, 1.72, -5.0], g = o.tgt || [.05, 1.68, -8]; MIND = 0; camA(cm, g, cm, g, 0, o.fov || 44); } };
export const BENCH = { id: 'BENCH', t0: 0, fn: (lt, t, o = {}) => { reset(0); if (o.roof) { ZC.ROOF.visible = true; ZC.roofAt(3); alleyLight(); setRig(RIGS.alley); put(GM(), ZC.ROOF, { p: [0, 0, -6.2], ry: 180, ex: 'evil' }); const c = o.cam, g = o.tgt; look(V(...c).add(ZC.ROOF.position), V(...g).add(ZC.ROOF.position), o.fov || 50); ZC.zcLate(3, camera); return; } STREET.visible = true; streetLight(0); if (o.rig) setRig({ ...RIGS.street, ...o.rig }); const ids = ['aren', 'guard', 'fire', 'strong', 'thug1', 'thug2', 'thug3', 'gunman'];
  if (o.act) { const L = o.act, n = L.length, sp = o.sp ?? .85; ids.forEach((id) => put(CHARS[id], STREET, { p: [0, -50, -30], visible: false }));
    L.forEach((a, i) => { const id = o.who ? o.who[i % o.who.length] : ids[i % ids.length]; const pz = o.beats ? perform(o.lt, o.beats, { seed: i }) : typeof a === 'string' && POSES[a] && !o.faceOnly ? perform(5, [[0, a]], { seed: i, still: true }) : a.includes('|') ? { ex: a.split('|')[0], talk: a.split('|')[1] } : { ex: a };
      put(CHARS[id], STREET, { p: [(i - (n - 1) / 2) * sp, .18, -9], ry: o.ry ?? 0, ...pz, blink: false, still: true }); });
    const bc = o.cam || [0, 1.4, -2.6], bt = o.tgt || [0, 1.1, -9]; camS(bc, bt, bc, bt, 0, o.fov || 44); return; }
  ids.forEach((id, i) => put(CHARS[id], STREET, { p: [(i - 3.5) * .85, .18, -9], ry: o.ry ?? 0, ex: ['sly', 'angry', 'grinTeeth', 'confident', 'evil', 'sneaky', 'frown', 'calm'][i] }));
  const bc = o.cam || [0, 1.4, -2.6], bt = o.tgt || [0, 1.1, -9]; camS(bc, bt, bc, bt, 0, o.fov || 44); } };
