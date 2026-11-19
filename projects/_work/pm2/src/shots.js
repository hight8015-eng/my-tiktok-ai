// shots.js: THE PUPPET MASTER ep 2 "เหยื่อที่เลือกผู้ล่า" (71.33 s) - times are real seconds, clocks run 1:1 (SP = 1)
import { THREE, setSmoothLight, scene, camera, clamp, lerp, sstep, eIO, eOut, eIn, eSine, D2R, noise1, rng, POST, mesh, rbox, toon, basic, group, cylBetween } from './engine.js';
import * as Wd from './world.js';
import * as ZC from './zc.js';
import { perform, POSES } from './acting.js';
import { bigWord } from './text3d.js';
import { sparks } from './fxphys.js';
import { turn, take, hitReact, hold, trauma } from './motion.js';
import { gaze, exShift } from './acting.js';
import { CHARS, OVL, lipAt, scribbleAt, headBall, beamAt, actPunch, actHit, impactAt, setRig, lightAt, pose, popAt, sparkAt, dustAt, debrisAt, smokeAt, tintAt, rainAt, shockAt, whisperAt, makeRope, updateRope } from './chars.js';
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

// ===================================================================== EP 2 SHOTS (v2: user rules - geography, camera moves for nearby beats, natural acting, literal actions)
const RF = () => CHARS.thug2;
const G1 = ZC.makeGun(scene), G2 = ZC.makeGun(scene);
const TH2 = makeRope('#ff2a3a', .014, 20), TH3 = makeRope('#ff2a3a', .014, 20); [TH2, TH3].forEach(r => { r.material.emissive = new THREE.Color('#ff2a3a'); r.material.emissiveIntensity = 1; scene.add(r); });
function hideGuns() { G1.visible = G2.visible = false; TH2.visible = TH3.visible = false; }
const gunR = (g, rot = [90, 180, 0], off = [0, -.02, .02]) => { g.visible = true; return { R: { obj: g, off, rot, mass: .3 } }; };
const AP = [0, 0, -8], GP0 = [0, 0, -6.45], GP1 = [.45, 0, -6.3];          // Aren, the gunman (before / after his turn)
const FE = [2.1, 10.02, -4.9], FERY = -120;   // ON THE ROOF EDGE (top of the right wall, 10 m) - the narration says 'บนหลังคา'                                    // the friend crouched on the fire escape, behind + above the gunman
const live = (lt, sd, P, k = .8) => { const h = hold(lt, sd, k); return { ...P, side: (P.side || 0) + h.side, twist: (P.twist || 0) + h.twist, head: (P.head || [0, 0, 0]).map((v, i) => v + h.head[i]) }; };
const shiver = (t, k = 1) => [.006 * k * Math.sin(t * 47) + .003 * k * Math.sin(t * 23), .005 * k * Math.sin(t * 61 + 1), 0];
const GUNPOSE = (t, k = 1, up = 0) => { const s = shiver(t, k); return { hR: [.14 + s[0], .98 + up + s[1], .74], pR: [1, -.4, -.2], hL: [-.3, .32, .1] }; };
const UPGUN = (t, k = .6) => { const s = shiver(t, k); return { hR: [.14 + s[0], 1.72 + s[1], .55], pR: [1, -.4, -.2], hL: [-.32, .4, .15] }; };
const flicks = (lt, per = 1.35, on = .55, off = .95) => { const u = lt % per; return u > on && u < off; };
function gunman(lt, t, P = {}) { put(GM(), ALLEY, live(lt, 3, { p: GP0, ry: 180, ...GUNPOSE(t, P.shake ?? .5), hold: gunR(G1), ...P })); }
function friendLight() { const h = ALLEY.worldToLocal(headW(RF(), .45)); neonPt(3, ALLEY.localToWorld(V(h.x - 1.0, h.y + .3, h.z - 1.2)), '#ffc8a0', 5, 4); lightAt(headW(RF(), .45), '#ffb890', 1.0, .7); }
function friend(lt, t, P = {}) { put(RF(), ALLEY, live(lt, 7, { p: FE, ry: FERY, ex: 'evil', lean: 18, hipY: -.07, head: [22, 0, 0], hR: [.12, .82, .62], pR: [1, -.4, -.2], hL: [-.12, .8, .55], hold: gunR(G2), ...P }, .5)); }
function aren(lt, P = {}) { put(AR(), ALLEY, live(lt, 1, { p: AP, ry: 0, ex: 'stoic', look: gaze(lt, 'stare'), ...P }, .5)); }
// ---------------- 0 "ปืนจ่ออยู่ที่หัวผม" : ESTABLISH - crane down the alley (fire escape, both men) onto the barrel at Aren's head ----------------
S('F01', 0, 'cut', ALLEY, (lt, t) => { alleyLight(); MIND = 1.2; gunman(lt, t, { ex: 'confident' }); aren(lt); friend(lt, t, { ex: 'sneaky' });
  bigWord(ALLEY, 'PUPPET', [0, 3.4, -17], { h: 1.4, k: (lt - .2) / .6, col: '#ff4f8b', op: .75 });
  camA([-.6, 6.2, 1.6], [0, 2.4, -7.2], [.95, 1.84, -4.75], [-.05, 1.62, -8], U(lt, 1.9, eIO), 44); });
// ---------------- 1 "แต่ผมไม่ได้มองปืน" : Aren's eyes go past the barrel to the man ----------------
S('F02', 1.8, 'blur', ALLEY, (lt, t) => { alleyLight(); MIND = 2.6; gunman(lt, t, { ex: 'confident' }); aren(lt, { ex: 'focused', look: [0, -.12], head: [-3, 0, 0] });
  camA([-1.45, 1.7, -5.25], [0, 1.62, -8], [-1.3, 1.68, -5.5], [0, 1.62, -8], U(lt, 1.8), 36); });
// ---------------- 2-3 "พลังอะไรก็ช่วยแกไม่ได้หรอก / เขาดูมั่นใจมาก" : ONE move: from beside Aren around to a low angle on the gunman ----------------
S('F03', 3.6, 'cut', ALLEY, (lt, t) => { alleyLight(); MIND = 2.6; const sp = lt < 1.9;
  gunman(lt, t, { ...exShift(lt, .7, 'confident', 'mocking'), ...(sp ? { talk: talkAt(t), head: [-4 - 6 * U(lt - 1.2, .6), 0, 6] } : { ex: 'confident', head: [-10, 0, 0], lean: -4 }) });
  aren(lt);
  camA([1.4, 1.65, -9.1], [0, 1.7, -6.45], [-.55, .8, -9.1], [0, 1.75, -6.45], U(lt, 3.6, eIO), 40); });
// ---------------- 4 "แต่มือที่ถือปืน สั่นนิด ๆ" : macro: the hand really shakes ----------------
S('F04', 7.4, 'cut', ALLEY, (lt, t) => { alleyLight(); MIND = 0; gunman(lt, t, { ex: 'anxious', shake: 2.4 }); scene.updateMatrixWorld(); const hl = ALLEY.worldToLocal(G1.getWorldPosition(V()));
  camA([hl.x + 1.2, hl.y + .25, hl.z - .5], [hl.x, hl.y, hl.z], [hl.x + 1.0, hl.y + .2, hl.z - .4], [hl.x, hl.y, hl.z], U(lt, 2.2), 38); });
// ---------------- 5-6 "และสายตาของเขา คอยเหลือบไปด้านหลังตลอด" : the eyes flick up and back, again and again ----------------
S('F05', 9.65, 'blur', ALLEY, (lt, t) => { alleyLight(); MIND = 2.4; const f = flicks(lt);
  gunman(lt, t, { ex: f ? 'anxious' : 'confident', look: f ? [.8, -.9] : [0, 0], head: [f ? -6 : 0, f ? 14 : 0, 0], shake: .9 });
  camA([1.35, 1.72, -9.0], [0, 1.68, -6.45], [1.2, 1.7, -8.75], [0, 1.68, -6.45], U(lt, 3.2), 34); });
// ---------------- 7-9 "เขาไม่ได้มาคนเดียว / บนหลังคามีเพื่อน / ปืนอีกกระบอก" : ONE tilt up from the gunman to the fire escape, ring, down to the gun ----------------
S('F06', 12.85, 'cut', ALLEY, (lt, t) => { alleyLight(); MIND = 1; gunman(lt, t, { ex: 'anxious', look: [.8, -.9], head: [-6, 14, 0] }); friend(lt, t);
  neonPt(3, ALLEY.localToWorld(V(1.4, 11.5, -4.0)), '#ff4a6a', 3, 6); scribbleAt(RF(), (lt - 2.0) / .5, .16);
  scene.updateMatrixWorld(); const g2 = ALLEY.worldToLocal(G2.getWorldPosition(V())); const u1 = U(lt, 1.9, eIO), u2 = U(lt - 3.5, 1.4, eIO);
  friendLight(); const tgt = lp(lp([0, 1.7, -6.45], [2.1, 10.7, -4.9], u1), [2.05, 11.3, -4.95], u2), pos = lp(lp([-1.3, 1.5, -2.4], [-1.2, 2.4, -.6], u1), [1.05, 10.6, -6.9], u2);
  camA(pos, tgt, pos, tgt, 0, 44); }, { rain: .5 });
// ---------------- 10 "ผมไม่ได้พูดอะไรสักคำ" : Aren, silent, steady ----------------
S('F07', 18.1, 'cut', ALLEY, (lt, t) => { alleyLight(); MIND = 2.6; aren(lt, { ex: 'stoic' }); gunman(lt, t, { ex: 'confident' });
  camA([.7, 1.62, -5.4], [-.05, 1.62, -8], [.6, 1.62, -5.65], [-.05, 1.62, -8], U(lt, 1.6), 36); });
// ---------------- 11 "แค่ส่งความคิดหนึ่งประโยคเข้าไป" : the power - grey world, red eyes, a bright red spark crosses into his ear ----------------
S('F08', 19.75, 'sweep', ALLEY, (lt, t) => { alleyLight(); MIND = 1.4; mono(U(lt, .7)); aren(lt, { ex: 'menace', look: [0, 0] }); gunman(lt, t, { ex: 'confident' });
  redEyes(AR(), U(lt - .15, .3, eOut), t); const a = headW(AR(), .38), b = headW(GM(), .42), u = clamp((lt - .45) / 1.4), q = V().lerpVectors(a, b, eIO(u)).add(V(0, Math.sin(Math.PI * u) * .3, 0));
  SEED.position.copy(q); SEED.material.opacity = u > 0 && u < 1 ? 1 : 0; SEED.scale.setScalar(.7); if (u > 0 && u < 1) { lightAt(q, '#ff3040', .8, .9); sparkAt(q, .8, .6); }
  camA([1.2, 3.0, -11.2], [0, 1.6, -7.0], [1.05, 2.85, -10.7], [0, 1.6, -7.0], U(lt, 2.4), 46); });
// ---------------- 12-14 whisper "ระวังข้างหลัง… เพื่อนแกกำลังจะยิงแก" : words float into his ear; eyes widen, sweat, the shaking grows ----------------
S('F09', 22.2, 'cut', ALLEY, (lt, t) => { alleyLight(); MIND = 2.4; mono(1); gunman(lt, t, { ...exShift(lt, 1.3, 'confident', 'dread'), look: lt > 1.8 ? [.7, -.6] : [0, 0], shake: .5 + lt * .7 });
  aren(lt, { ex: 'menace' }); redEyes(AR(), 1, t);
  whisperAt(headW(AR(), .38), headW(GM(), .42), 'ระวังข้างหลัง… เพื่อนแกกำลังจะยิงแก', clamp(lt / 2.5), t, { fs: 60, dy: 240 });
  camA([1.35, 1.72, -9.0], [0, 1.68, -6.45], [1.15, 1.7, -8.6], [0, 1.68, -6.45], U(lt, 2.8), 34); });
// ---------------- 15 "ชายตรงหน้าหันขวับไปด้านหลังทันที" : full-body whip turn, a step aside, the gun swings up at the fire escape ----------------
S('F10', 25.05, 'cut', ALLEY, (lt, t) => { alleyLight(); MIND = 2.6; mono(1 - U(lt, .4)); const T = turn(lt, .08, .42, 180, 40, { snap: 1.6 }), up = U(lt - .22, .32, eOut), st = U(lt - .05, .35);
  put(GM(), ALLEY, { p: lp(GP0, GP1, st), ...T, ex: 'shocked', ...(up > .05 ? UPGUN(t, .4) : GUNPOSE(t, .4)), hR: lp(GUNPOSE(t, .4).hR, UPGUN(t, .4).hR, up), hold: gunR(G1), fast: true });
  aren(lt); friend(lt, t); SH.a = .2 * Math.max(0, 1 - lt / .5); SH.t = t;
  camA([1.5, 1.5, -10.2], [.3, 1.8, -6.2], [1.45, 1.6, -10.0], [.6, 2.3, -6.0], U(lt, 2.4), 52); });
// ---------------- 16-18 "และในวินาทีนั้นเอง / เสียงปืนก็ดังขึ้น" : HIGH shot - both guns, the friend fires down; the streak, the sparks ----------------
S('F11', 27.6, 'whip', ALLEY, (lt, t) => { alleyLight(); MIND = 2.6; const sh = 29.18 - 27.6, age = lt - sh;
  put(GM(), ALLEY, live(lt, 3, { p: GP1, ry: 40, ex: 'angry', ...UPGUN(t, .6), hold: gunR(G1), head: [-24, 0, 0] }));
  friend(lt, t, { ...exShift(lt, .4, 'evil', 'shocked'), ...(age > 0 ? { ex: 'angry' } : {}), hR: [.12, .82 + .14 * Math.max(0, Math.exp(-age * 8) * (age > 0)), .62] , fast: true }); aren(lt);
  scene.updateMatrixWorld(); if (ZC.gunFlashAt(G2, age, camera)) lightAt(G2.getWorldPosition(V()), '#ffd89a', 3.6, 1);
  const A = G2.getWorldPosition(V()), B = ALLEY.localToWorld(V(-.55, 1.4, -7.2)), u = clamp(age / .12); if (age > 0 && u < 1) beamAt(V().lerpVectors(A, B, Math.max(0, u - .35)), V().lerpVectors(A, B, u), t, 1, '#fff2c0');
  sparks({ at: B, normal: [1, .3, .2], t0: sh + .12, n: 26, speed: 3.6, cone: .9, life: .7, floor: 0, seed: 7 }).at(lt);
  SH.a = trauma(lt, [[sh, .5]]); SH.t = t;
  friendLight(); { const u = U(lt - sh - .03, .38, eIO), pos = lp([1.05, 10.6, -6.9], [1.4, 1.65, -4.4], u), tg = lp([2.05, 11.3, -4.95], [.3, 1.6, -6.6], u); camA(pos, tg, pos, tg, 0, 40); } });
// ---------------- 18 "กระสุนเฉียดไหล่เขาไปอย่างเฉียดฉิว" : closer: a big flinch and stagger; sparks by Aren; Aren does not even blink ----------------
S('F12', 30.45, 'cut', ALLEY, (lt, t) => { alleyLight(); MIND = 2.6; const hr = hitReact(lt, .05, 1, 1.6), kb = hr.p_off ? hr.p_off[0] : 0;
  put(GM(), ALLEY, { p: [GP1[0] + kb, 0, GP1[2]], ry: 40, ex: lt < .5 ? 'shocked' : 'terror', ...hr, ...UPGUN(t, 1.2), hold: gunR(G1) });
  put(AR(), ALLEY, { p: AP, ry: 0, ex: 'stoic', blink: false, look: [.3, 0] });
  sparks({ at: ALLEY.localToWorld(V(-.55, 1.4, -7.2)), normal: [1, .3, .2], t0: -.3, n: 26, speed: 3.6, cone: .9, life: .7, floor: 0, seed: 7 }).at(lt);
  SH.a = trauma(lt, [[.05, .35]]); SH.t = t;
  camA([1.45, 1.55, -4.4], [0, 1.55, -7.0], [1.4, 1.52, -4.6], [0, 1.55, -7.0], U(lt, 2.4), 50); });
// ---------------- 19 "แก! แกจะยิงฉันเหรอ!" : he screams up, jabbing the gun at the fire escape ----------------
S('F13', 33.1, 'cut', ALLEY, (lt, t) => { alleyLight(); MIND = 2.6; const jab = .08 * Math.max(0, Math.sin(lt * 9)) * (lt < 1.4);
  put(GM(), ALLEY, live(lt, 3, { p: GP1, ry: 40, ex: 'angry', talk: talkAt(t), head: [-22, 0, 0], lean: -6, ...UPGUN(t, .8), hR: [.14, 1.72 + jab, .55 + jab], hold: gunR(G1) }));
  camA([1.0, .9, -3.9], [.4, 1.9, -6.3], [.95, .95, -4.1], [.4, 1.95, -6.3], U(lt, 1.7), 42); });
// ---------------- 20-21 "ฉันเปล่า! ฉันยิงคนนั้นต่างหาก!" : looking up at the fire escape - he points down at Aren, then aims at his partner ----------------
S('F14', 34.85, 'cut', ALLEY, (lt, t) => { alleyLight(); MIND = 2.6; const sw = U(lt - .9, .4);
  friend(lt, t, { ...exShift(lt, .7, 'terror', 'annoyedHard'), talk: talkAt(t), lean: 14, head: [16, 0, 0], ry: FERY + 25 * (1 - sw) });
  friendLight(); camA([1.1, 10.65, -6.8], [2.05, 11.3, -4.95], [1.15, 10.7, -6.7], [2.05, 11.3, -4.95], U(lt, 2.0), 36); });
// ---------------- 22-23 "แต่ไม่มีใครเชื่อใครอีกแล้ว / ทั้งสองคนหันปืนเข้าหากัน" : HIGH again - the standoff, slow crane ----------------
S('F15', 36.9, 'blur', ALLEY, (lt, t) => { alleyLight(); MIND = 2.6;
  put(GM(), ALLEY, live(lt, 3, { p: GP1, ry: 40, ex: 'angry', head: [-24, 0, 0], ...UPGUN(t, .5), hold: gunR(G1) })); friend(lt, t, { ex: 'angry' }); aren(lt, { ex: 'calm' });
  { const u = U(lt - 1.6, 1.4, eIO), pos = lp([1.2, .9, -4.0], [1.05, 10.6, -6.9], u), tg = lp([.45, 1.95, -6.3], [2.05, 11.3, -4.95], u); friendLight(); camA(pos, tg, pos, tg, 0, 40); } });
// ---------------- 24 "ส่วนผม แค่เดินออกจากตรอกเงียบ ๆ" : he walks away (clear path x -0.25, past the dumpster); they stay locked above ----------------
const walkZ = (t) => -8 + Math.max(0, t - 41.3) * 1.15;   // one continuous walk from 41.3 s (path x = -0.25: dumpster is x -0.7..-1.8)
const arenWalk = (lt, t, P = {}) => put(AR(), ALLEY, { p: [-.25, 0, walkZ(t)], ry: 0, ex: 'calm', ...walk(t - 41.3, 1.55, .21), ...P });
S('F16', 41.2, 'fgwipe', ALLEY, (lt, t) => { alleyLight(); MIND = 2.6; arenWalk(lt, t);
  put(GM(), ALLEY, live(lt, 3, { p: GP1, ry: 40, ex: 'angry', head: [-24, 0, 0], ...UPGUN(t, .5), hold: gunR(G1) })); friend(lt, t, { ex: 'angry' });
  camA([-1.0, 1.8, -10.6], [-.2, 1.5, -5.5], [-.95, 1.82, -10.3], [-.2, 1.5, -4.6], U(lt, 2.9), 44); });
// ---------------- 25-26 "ผมไม่ต้องสร้างความเกลียด / แค่ทำให้เขาสงสัย" : from the mouth of the alley: he comes toward us, they are small behind ----------------
S('F17', 44.1, 'cut', ALLEY, (lt, t) => { alleyLight(); MIND = 2.6; arenWalk(lt, t, { ...exShift(lt, 2.4, 'sly', 'sinister'), look: gaze(lt, 'idle', 3) });
  put(GM(), ALLEY, { p: GP1, ry: 40, ex: 'angry', head: [-24, 0, 0], ...UPGUN(t, .5), hold: gunR(G1) }); friend(lt, t, { ex: 'angry' });
  camA([.5, 1.65, 4.6], [-.25, 1.6, walkZ(t)], [.6, 1.62, 5.4], [-.25, 1.55, walkZ(t)], U(lt, 4.8), 40); });
// ---------------- 27-30 "ก่อนเลี้ยวพ้นตรอก / ผมเห็นข้อความพ่นสี / ผู้แข็งแกร่งเท่านั้น..." : he stops, looks; the camera pans to the wall and drifts across the words ----------------
const TAG1 = 'ผู้แข็งแกร่งเท่านั้น', TAG2 = 'ที่มีสิทธิ์ครองเขตแดน';
function graffiti() { bigWord(ALLEY, TAG1, [-1.88, 3.0, 2.6], { ry: 90, h: .6, col: '#ff3a3a', op: .95, font: '900 200px Prompt' }); bigWord(ALLEY, TAG2, [-1.88, 2.25, 2.6], { ry: 90, h: .5, col: '#ff3a3a', op: .95, font: '900 200px Prompt' }); }
S('F18', 49.0, 'cut', ALLEY, (lt, t) => { alleyLight(); MIND = 0; graffiti(); const z = Math.min(2.3, walkZ(t)), stop = U(lt - .3, .6);
  put(AR(), ALLEY, live(lt, 1, { p: [-.25, 0, z], ry: -70 * U(lt - .6, .7), ex: lt < 1.8 ? 'calm' : 'thinking', ...(lt < .9 ? walk(t - 41.3, 1.55, .21 * (1 - stop)) : {}), look: [-.4, -.5], head: [-8 * U(lt - 1, .5), 0, 0] }));
  const u1 = U(lt - .9, 1.3, eIO), u2 = U(lt - 3.6, 3.4, eIO);
  const tgt = lp(lp([-.25, 1.55, 2.2], [-1.88, 2.7, 2.6], u1), [-1.88, 2.6, 1.6], u2), pos = lp(lp([1.3, 1.6, 5.3], [1.1, 2.2, 4.6], u1), [.7, 2.5, .6], u2);
  camA(pos, tgt, pos, tgt, 0, 48); });
// ---------------- 31 "ผมเริ่มเข้าใจเมืองนี้แล้ว" : WHIP out to the neon street: he steps into the city ----------------
S('F19', 56.15, 'whip', STREET, (lt, t) => { streetLight(lt); MIND = 2.6; put(AR(), STREET, { p: [0, .18, -6.2 - .9 * U(lt, 1.6)], ry: 180, ex: 'calm', ...walk(lt, 1.2, .16 * (1 - U(lt - 1.2, .4))) });
  put(PX(1), STREET, { p: [-1.6, .18, -14 + lt * .7], ry: 0, ex: 'frown', ...walk(lt, 1.3) }); put(PX(2), STREET, { p: [1.7, .18, -16 + lt * .6], ry: -10, ex: 'calm', ...walk(lt + .4, 1.2) });
  camS([.6, 1.7, -3.0], [0, 1.6, -12], [.5, 3.2, -2.6], [0, 2.0, -14], U(lt, 1.9), 46); });
// ---------------- 32 "คนที่นี่ไม่ได้สู้เพื่อความถูกต้อง" : a REAL fight - guard, the strong man's punch, the fire man's flaming counter ----------------
const FX0 = [-.75, .18, -11], SX0 = [.75, .18, -11];
S('F20', 58.05, 'cut', STREET, (lt, t) => { streetLight(lt); MIND = 2.6;
  const p1 = actPunch(lt, .7, { side: 1 }), h1 = actHit(lt, .72, { dist: .5, side: 1 }), p2 = actPunch(lt, 1.55, { side: 1 }), h2 = actHit(lt, 1.57, { dist: .35, side: -1 });
  const fGuard = { hL: [-.06, 1.0, .42], hR: [.14, .92, .3], pL: [-1, -.4, 0], pR: [1, -.4, 0], hipY: -.06, lean: 8 };
  const fP = lt > 1.25 ? { ...fGuard, ...p2 } : lt > .72 ? { ...fGuard, ...h1 } : fGuard;
  put(FI(), STREET, { p: [FX0[0] - (lt > .72 && lt < 1.3 ? h1.kb : 0), .18, FX0[2]], ry: 90, ex: lt > .72 && lt < 1.3 ? 'pain' : 'rage', ...fP });
  const sP = lt < 1.0 ? { ...fGuard, ...p1 } : lt > 1.57 ? { ...fGuard, ...h2 } : fGuard;
  put(ST(), STREET, { p: [SX0[0] + (lt > 1.57 ? h2.kb : 0), .18, SX0[2]], ry: -90, ex: lt > 1.57 ? 'hurtX' : 'rage', ...sP });
  HF.visible = true; handFire(t, .6 + .8 * Math.max(0, 1 - Math.abs(lt - 1.55) * 3)); FI().g.updateMatrixWorld(true); HF.position.copy(hw(FI(), 1)).add(V(0, .05, 0));
  if (Math.abs(lt - 1.57) < .1) impactAt(STREET.localToWorld(V(.55, 1.6, -11)), (lt - 1.47) / .2, 1); if (Math.abs(lt - .72) < .1) impactAt(STREET.localToWorld(V(-.55, 1.6, -11)), (lt - .62) / .2, .8);
  put(PX(1), STREET, { p: [-2.2, .18, -13.2], ry: 30, ...perform(lt, [[0, 'recoil']], { seed: 2 }) });
  SH.a = trauma(lt, [[.72, .35], [1.57, .45]]); SH.t = t;
  camS([-.6, 1.35, -7.0], [0, 1.5, -11], [.5, 1.4, -7.3], [0, 1.5, -11], U(lt, 2.35), 48); });
// ---------------- 33 "พวกเขาสู้เพื่ออำนาจ" : the strong man's finishing blow; the fire man drops; the winner stands over him; people back away ----------------
S('F21', 60.45, 'cut', STREET, (lt, t) => { streetLight(lt); MIND = 2.6; const p1 = actPunch(lt, .3, { side: 1 }), h1 = actHit(lt, .32, { dist: .9, side: 1 }), down = U(lt - .55, .4, eOut);
  put(ST(), STREET, lt < .8 ? { p: SX0, ry: -90, ex: 'angry', ...p1 } : live(lt, 5, { p: SX0, ry: -110, ex: 'smug', lean: -6, head: [-12, 0, 0], hL: [-.34, .5, -.05], hR: [.34, .5, -.05], pL: [-1, 0, -.3], pR: [1, 0, -.3] }));
  put(FI(), STREET, lt < .55 ? { p: [FX0[0] - h1.kb, .18, FX0[2]], ry: 90, ex: 'pain', ...h1 } : { p: [FX0[0] - .9, .18, FX0[2]], ry: 90, sit: true, ex: 'ko', lean: -30 * down, head: [-20 * down, 0, 0], hL: [-.4, .1, -.2], hR: [.4, .1, -.2] });
  HF.visible = true; handFire(t, Math.max(0, 1 - lt * 2)); FI().g.updateMatrixWorld(true); HF.position.copy(hw(FI(), 1));
  if (lt > .25 && lt < .5) impactAt(STREET.localToWorld(V(-.6, 1.6, -11)), (lt - .25) / .25, 1.2); if (lt > .55 && lt < .9) dustAt(STREET.localToWorld(V(-1.65, .2, -11)), (lt - .55) / .35, 1.2);
  [[1, -2.3, -13.4, 30], [2, 2.4, -13.0, -40], [3, -2.6, -9.6, 120]].forEach(([i, x, z, ry]) => put(PX(i), STREET, { p: [x - Math.sign(x) * .5 * U(lt - .4, .8), .18, z], ry, ...perform(lt, [[0, 'neutral'], [.4, 'recoil']], { seed: i }) }));
  SH.a = trauma(lt, [[.32, .5]]); SH.t = t;
  camS([-.45, 1.0, -5.9], [-.45, 1.45, -11], [-.5, 1.05, -6.2], [-.45, 1.5, -11], U(lt, 1.8), 64); });
// ---------------- 34 "และถ้าผมอยากรอด" : Aren close; resolve forms ----------------
S('F22', 62.25, 'blur', STREET, (lt, t) => { streetLight(lt); MIND = 2.6; put(AR(), STREET, live(lt, 1, { p: [0, .18, -6.5], ry: 0, ...exShift(lt, .6, 'stoic', 'determinedHard'), look: gaze(lt, 'stare') }, .5));
  camS([.5, 1.75, -3.9], [0, 1.75, -6.5], [.42, 1.74, -4.05], [0, 1.75, -6.5], U(lt, 1.4), 36); });
// ---------------- 35 "ผมต้องมีคนที่ยอมเดินตามความคิดของผม" : threads from his fingers; each passer-by STOPS when one touches him ----------------
S('F23', 63.65, 'cut', STREET, (lt, t) => { streetLight(lt); MIND = 2.6; mono(.55 * U(lt, .8));
  put(AR(), STREET, live(lt, 1, { p: [.4, .18, -7.6], ry: 200, ex: 'menace', hR: [.3, 1.0, .45], pR: [1, -.3, 0] }, .4)); redEyes(AR(), .8, t);
  const R = [THREAD, TH2, TH3], P3 = [[1, -1.6, -10.6, 20, .5], [2, 2.0, -11.6, -25, .9], [3, -.4, -13.2, 5, 1.3]]; const a = hw(AR(), 1);
  P3.forEach(([i, x, z, ry, tt], k) => { const hit = lt > tt + .5, sd = 1 - U(lt - tt - .5, .35);
    put(PX(i), STREET, { p: [x, .18, z + .5 * Math.min(lt, tt + .5)], ry: hit ? ry + 160 * U(lt - tt - .6, .5) : ry, ex: hit ? 'calm' : 'neutral', ...walk(lt, 1.1, .2 * sd) });
    const reach = U(lt - tt, .5, eOut); R[k].visible = reach > 0; if (reach > 0) { const h = headW(PX(i), .6); updateRope(R[k], a, V().lerpVectors(a, h, reach), { sag: .4 * reach, t }); } });
  camS([2.6, 1.8, -5.6], [-.2, 1.6, -10.0], [2.4, 1.8, -6.0], [-.2, 1.6, -10.0], U(lt, 2.7), 56); });
// ---------------- 36 "ตั้งแต่คืนนี้" : his back to us; the big word behind the street ----------------
S('F24', 66.5, 'sweep', STREET, (lt, t) => { streetLight(lt); MIND = 2.6; put(AR(), STREET, live(lt, 1, { p: [0, .18, -6.5], ry: 180, ex: 'calm' }, .4));
  bigWord(STREET, 'PUPPET MASTER', [0, 3.2, -18], { h: 1.3, k: (lt - .1) / .6, col: '#ff2a3a', op: .85 });
  camS([.3, 1.5, -3.2], [0, 2.2, -16], [.25, 1.55, -3.6], [0, 2.3, -16], U(lt, 1.4), 46); });
// ---------------- 37 "ผมจะไม่เป็นฝ่ายถูกล่าอีกแล้ว" : the turn of the head, red eyes, the hunter's smile ----------------
S('F25', 67.85, 'cut', STREET, (lt, t) => { streetLight(lt); MIND = 2.6;
  put(AR(), STREET, { p: [0, .18, -6.5], ...turn(lt, .3, .8, 180, 20), ...exShift(lt, 1.1, 'calm', 'sinister') }); redEyes(AR(), U(lt - 1.1, .3, eOut), t);
  camS([.6, 1.72, -3.9], [0, 1.72, -6.5], [.5, 1.72, -4.1], [0, 1.72, -6.5], U(lt, 3.3, eOut), 36); });

export function initShots(timing) { TM.env = timing.env; TM.vis = timing.vis; for (let i = 0; i < SHOTS.length; i++) SHOTS[i].t1 = i + 1 < SHOTS.length ? SHOTS[i + 1].t0 : timing.end; }
export function runShot(sh, t) { reset(t); sh.fn(t - sh.t0, t); }
export const WHITEK = { k: 0 };
export const COVER = { id: 'COVER', t0: 0, fn: (lt, t, o = {}) => { reset(10); ALLEY.visible = true; alleyLight(); ZC.alleyAt(10, 0);
  put(AR(), ALLEY, { p: AP, ry: 0, ex: 'sinister' }); redEyes(AR(), .9, 10); put(GM(), ALLEY, { p: GP0, ry: 180, ex: 'anxious', ...GUNPOSE(10, 0), hR: [.3, 1.05, .74], hold: gunR(G1) });
  const cm = o.cam || [-1.15, 1.72, -5.0], g = o.tgt || [.05, 1.68, -8]; MIND = 0; camA(cm, g, cm, g, 0, o.fov || 44); } };
export const BENCH = { id: 'BENCH', t0: 0, fn: (lt, t, o = {}) => { reset(0); if (o.roof) { ZC.ROOF.visible = true; ZC.roofAt(3); alleyLight(); setRig(RIGS.alley); put(GM(), ZC.ROOF, { p: [0, 0, -6.2], ry: 180, ex: 'evil' }); const c = o.cam, g = o.tgt; look(V(...c).add(ZC.ROOF.position), V(...g).add(ZC.ROOF.position), o.fov || 50); ZC.zcLate(3, camera); return; } STREET.visible = true; streetLight(0); if (o.rig) setRig({ ...RIGS.street, ...o.rig }); const ids = ['aren', 'guard', 'fire', 'strong', 'thug1', 'thug2', 'thug3', 'gunman'];
  if (o.act) { const L = o.act, n = L.length, sp = o.sp ?? .85; ids.forEach((id) => put(CHARS[id], STREET, { p: [0, -50, -30], visible: false }));
    L.forEach((a, i) => { const id = o.who ? o.who[i % o.who.length] : ids[i % ids.length]; const pz = o.beats ? perform(o.lt, o.beats, { seed: i }) : typeof a === 'string' && POSES[a] && !o.faceOnly ? perform(5, [[0, a]], { seed: i, still: true }) : a.includes('|') ? { ex: a.split('|')[0], talk: a.split('|')[1] } : { ex: a };
      put(CHARS[id], STREET, { p: [(i - (n - 1) / 2) * sp, .18, -9], ry: o.ry ?? 0, ...pz, blink: false, still: true }); });
    const bc = o.cam || [0, 1.4, -2.6], bt = o.tgt || [0, 1.1, -9]; camS(bc, bt, bc, bt, 0, o.fov || 44); return; }
  ids.forEach((id, i) => put(CHARS[id], STREET, { p: [(i - 3.5) * .85, .18, -9], ry: o.ry ?? 0, ex: ['sly', 'angry', 'grinTeeth', 'confident', 'evil', 'sneaky', 'frown', 'calm'][i] }));
  const bc = o.cam || [0, 1.4, -2.6], bt = o.tgt || [0, 1.1, -9]; camS(bc, bt, bc, bt, 0, o.fov || 44); } };
