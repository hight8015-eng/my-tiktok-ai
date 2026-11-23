// shots.js: THE PUPPET MASTER ep 3 "ราชาแห่งเขตตะวันออก" (93.56 s) - times are real seconds, clocks run 1:1 (SP = 1)
import { THREE, setSmoothLight, scene, camera, clamp, lerp, sstep, eIO, eOut, eIn, eSine, D2R, noise1, rng, POST, mesh, rbox, toon, basic, group, cylBetween } from './engine.js';
import * as Wd from './world.js';
import * as ZC from './zc.js';
import { perform, POSES } from './acting.js';
import { bigWord } from './text3d.js';
import { sparks } from './fxphys.js';
import { turn, take, hitReact, hold, trauma } from './motion.js';
import { gaze, exShift } from './acting.js';
import { CHARS, OVL, lipAt, scribbleAt, headBall, beamAt, actPunch, actHit, impactAt, setRig, lightAt, pose, popAt, sparkAt, dustAt, debrisAt, smokeAt, tintAt, rainAt, shockAt, whisperAt, makeRope, updateRope } from './chars.js';
const { TRUCK, GATE, STREET, ALLEY, ROOF, WAREHOUSE, Z } = ZC;
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
const camT = camO(TRUCK), camG = camO(GATE), camS = camO(STREET), camA = camO(ALLEY), camR = camO(ROOF), camW = camO(WAREHOUSE);
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

// ===================================================================== EP 3 SHOTS (rules: geography, moves for nearby beats, varied transitions,
// natural acting, literal actions, framing incl. props, level camera on prop beats, lit faces for key characters)
const VI = () => CHARS.strong, CL = () => CHARS.cloak;    // Victor = the strong man of ep 2, now in his king's coat
const live = (lt, sd, P, k = .8) => { const h = hold(lt, sd, k); return { ...P, side: (P.side || 0) + h.side, twist: (P.twist || 0) + h.twist, head: (P.head || [0, 0, 0]).map((v, i) => v + h.head[i]) }; };
function hideGuns() { [PILLAR, HOLE, CRACK, HOLE2, CRACK2, DOORL, POUCH].forEach(m => { m.visible = false; }); }
const PILLAR = mesh(rbox(1.2, 9, 1.2), toon('#8a8690'), { p: [0, 4.5, -1.9], parent: WAREHOUSE });
const HOLE = Z.whHole.clone(), CRACK = Z.whCrack.clone(); [HOLE, CRACK].forEach((m, i) => { m.position.set(.45, 1.78, -2.52 - i * .005); m.rotation.set(0, Math.PI, 0); WAREHOUSE.add(m); }); HOLE.scale.setScalar(.6); CRACK.scale.setScalar(.7);
const HOLE2 = Z.whHole.clone(), CRACK2 = Z.whCrack.clone(); [HOLE2, CRACK2].forEach((m, i) => { m.position.set(7.77 - i * .005, 1.6, 4); m.rotation.set(0, -Math.PI / 2, 0); WAREHOUSE.add(m); });
const DOORL = mesh(new THREE.PlaneGeometry(2.8, 3.8), basic('#ffd8b0', { transparent: true, opacity: .9 }), { p: [0, 1.95, 11.45], r: [0, 180, 0], parent: WAREHOUSE, cast: false }); DOORL.material.depthWrite = false; DOORL.renderOrder = 2;
const POUCH = mesh(new THREE.SphereGeometry(.09, 14, 10), toon('#8a6a3a'), { parent: scene });
const TABLE = Z.whPaper.parent; TABLE.position.set(1.7, 0, -3.4); TABLE.rotation.y = Math.PI / 2;
Z.whPaper.material.map = canvasTexP(); Z.whPaper.material.needsUpdate = true; Z.whPaper.rotation.z -= Math.PI / 2;
function canvasTexP() { const c = document.createElement('canvas'); c.width = 256; c.height = 352; const x = c.getContext('2d'); x.fillStyle = '#f4eee2'; x.fillRect(0, 0, 256, 352); x.fillStyle = '#2a2230'; x.font = '700 30px Prompt'; x.fillText('คนสนิท', 24, 46);
  x.font = '600 24px Prompt'; [['ดำ', '12,000'], ['เสือ', '8,500'], ['ไบค์', '21,000'], ['หมาป่า', '6,000']].forEach(([n, v], i) => { x.fillStyle = '#2a2230'; x.fillText(n, 24, 104 + i * 58); x.fillStyle = '#c0202a'; x.fillText(v, 150, 104 + i * 58); });
  x.strokeStyle = '#c0202a'; x.lineWidth = 3; x.beginPath(); x.ellipse(190, 200, 64, 26, 0, 0, 7); x.stroke(); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
for (const l of Z.whLamps) l.visible = true; Z.whCrowd.forEach(m => { m.scale.set(1.25, 1.25, 1); m.position.y *= 1.25; });
function whLight(o = {}) { PILLAR.visible = true; Z.whPaper.visible = false; setRig({ ...RIGS.alley, key: ['#ffc88a', .42], fill: ['#7080c0', .18], rim: ['#ff9a50', .55], base: 1.0 }); nightCity({ hemiI: 1.6, sunI: .7, fog: '#1c1612', fogN: 12, fogF: 45, stars: 0, moon: 0, ...o });
  Wd.setShadowFocus(-600, 1, 600, 12); neonPt(0, WAREHOUSE.localToWorld(V(0, 6, -3)), '#ffcc88', 7, 14); neonPt(1, WAREHOUSE.localToWorld(V(0, 2, -8.6)), '#ff9a40', 5, 9); neonPt(2, WAREHOUSE.localToWorld(V(0, 6, 5)), '#ffcc88', 5, 12); }
const faceLight = (C, col = '#ffd0a8', side = 1) => { const h = WAREHOUSE.worldToLocal(headW(C, .45)); neonPt(3, WAREHOUSE.localToWorld(V(h.x + side * .9, h.y + .4, h.z + 1.1)), col, 4, 4); };
const wEnd = (t, look = 1) => { ZC.warehouseAt(t, camera); Z.whCrowd.forEach((m, i) => { const k = clamp(look * 1.6 - (i % 9) * .07); m.scale.x = .3 + .7 * k; }); };
const AW = (t) => Math.max(-3.0, 9.5 - Math.max(0, t - 15.0) * 1.45);   // Aren walks in from the door along x = 0 and stops in front of the pillar
const LT = [[T1, [-2.0, .4, -8.3], 20], [T2, [2.0, .4, -8.3], -20], [T3, [-3.2, 0, -7.2], 30], [GU, [3.2, 0, -7.2], -30]];   // Victor's inner circle
function inner(lt, t, ex = 'smug', P = {}) { LT.forEach(([f, p, ry], i) => put(f(), WAREHOUSE, live(lt, 11 + i, { p, ry, ex: typeof ex === 'function' ? ex(i) : ex, ...P }, .6))); }
// ---------------- 0 "ชายคนนี้ทุบกำแพงคอนกรีตพังได้ ด้วยหมัดเดียว" : the wind-up, the punch, the wall breaks (cracks, chips, dust) ----------------
S('W01', 0, 'cut', WAREHOUSE, (lt, t) => { whLight(); MIND = 2.4; const at = 1.75, p = actPunch(lt, at, { side: 1 });
  put(VI(), WAREHOUSE, live(lt, 5, { p: [6.55, 0, 4], ry: 90, ex: lt < at ? 'determinedHard' : 'smug', ...p }, .5)); faceLight(VI(), '#ffd0a8', -1);
  HOLE2.visible = CRACK2.visible = lt > at; const hp = WAREHOUSE.localToWorld(V(7.6, 1.6, 4));
  if (lt > at && lt < at + .25) impactAt(hp, (lt - at) / .25, 1.4); debrisAt(hp, lt - at, { n: 26, seed: 3, speed: 3.4, kind: 'rock', col: '#8a8690' }); smokeAt(hp, lt - at - .05, { n: 10, seed: 5, size: .7, col: '#a8a4ac' });
  SH.a = trauma(lt, [[at, .6]]); SH.t = t;
  camW([3.6, 1.9, 6.9], [6.7, 1.9, 4.0], [3.9, 1.9, 6.6], [6.8, 1.9, 4.0], U(lt, 3.8, eIO), 50); wEnd(t, 0); }, { rain: false });
// ---------------- 1-2 "เขาชื่อวิกเตอร์ / ราชาแห่งเขตตะวันออก" : he turns to us; name + red ring; the camera pulls back to his kingdom ----------------
S('W02', 3.85, 'blur', WAREHOUSE, (lt, t) => { whLight(); MIND = 2.4; put(VI(), WAREHOUSE, live(lt, 5, { p: [6.55, 0, 4], ...turn(lt, .1, .7, 90, -150), ex: 'smug', head: [-8, 0, 0], hL: [-.34, .5, -.05], hR: [.34, .5, -.05], pL: [-1, 0, -.3], pR: [1, 0, -.3] }, .5));
  HOLE2.visible = CRACK2.visible = true; faceLight(VI(), '#ffd0a8', -1); scribbleAt(VI(), (lt - .8) / .5, .16);
  const u = U(lt - 1.5, 1.6, eIO); camW(lp([4.6, 1.95, 2.0], [2.2, 2.6, .2], u), lp([6.55, 1.95, 4], [6.0, 1.7, 4.0], u), lp([4.6, 1.95, 2.0], [2.2, 2.6, .2], u), lp([6.55, 1.95, 4], [6.0, 1.7, 4.0], u), 0, 40); wEnd(t, 0); }, { rain: false });
// ---------------- 3 "เขตที่อันตรายที่สุดใน ZERO CITY" : PUSH out to the east district street ----------------
S('W03', 7.1, 'push', STREET, (lt, t) => { streetLight(lt); MIND = 2.6; put(T1(), STREET, live(lt, 2, { p: [-1.4, .18, -10], ry: 30, ex: 'menace', hL: [-.34, .5, -.05], hR: [.34, .5, -.05], pL: [-1, 0, -.3], pR: [1, 0, -.3] }));
  put(T2(), STREET, live(lt, 4, { p: [1.6, .18, -12.5], ry: -30, ex: 'evil' })); put(PX(2), STREET, { p: [0, .18, -15 + lt * .8], ry: 0, ex: 'scared', ...walk(lt, 1.8, .2) });
  camS([.4, 3.2, -3.4], [0, 1.6, -13], [.3, 2.4, -4.4], [0, 1.6, -13], U(lt, 2.9), 48); }, { dir: 'L' });
// ---------------- 4-5 "คนอ่อนแอที่นั่น ต้องจ่ายส่วย / แลกกับการมีลมหายใจ" : a thug takes a pouch from a shaking man, pats his cheek ----------------
S('W04', 9.95, 'cut', STREET, (lt, t) => { streetLight(lt); MIND = 2.6; const give = U(lt - .9, .6), pat = lt > 2.8;
  put(PX(1), STREET, live(lt, 8, { p: [-.45, .18, -9.6], ry: 70, ...perform(lt, [[0, 'anxious'], [.8, 'offer', { ex: 'scared' }], [2.4, 'relief', { ex: 'hurt' }]], { seed: 8 }) }));
  put(T1(), STREET, live(lt, 2, { p: [.55, .18, -9.6], ry: -70, ex: pat ? 'smug' : 'menace', hR: pat ? [.22, 1.25, .5] : lp([.3, .3, .1], [.24, .66, .5], give), pR: [1, -.5, 0] }));
  POUCH.visible = true; scene.updateMatrixWorld(); POUCH.position.copy(give < 1 ? hw(PX(1), 1) : hw(T1(), 1));
  camS([-.6, 1.6, -5.4], [0, 1.6, -9.6], [-.3, 1.6, -5.7], [0, 1.6, -9.6], U(lt, 4.2), 48); });
// ---------------- 6 "และผม… เดินเข้าไปในฐานของเขา คนเดียว" : the door opens, a lone figure in the light ----------------
S('W05', 14.45, 'fgwipe', WAREHOUSE, (lt, t) => { whLight(); MIND = 2.6; DOORL.visible = true; DOORL.material.opacity = .9 * U(lt, .5);
  put(AR(), WAREHOUSE, live(lt, 1, { p: [0, 0, AW(t)], ry: 180, ex: 'stoic', ...walk(t, 1.45, .21) }, .3)); setRig(RIGS.silhouette);
  camW([.9, 1.4, 2.5], [0, 1.5, 9.5], [.7, 1.4, 2.9], [0, 1.5, 8.5], U(lt, 3.9), 44); wEnd(t, 0); }, { rain: false });
// ---------------- 7 "ทันทีที่ก้าวเข้าไป" : his steps on the concrete, the crowd still turned away ----------------
S('W06', 18.35, 'cut', WAREHOUSE, (lt, t) => { whLight(); MIND = 0; put(AR(), WAREHOUSE, { p: [0, 0, AW(t)], ry: 180, ex: 'stoic', ...walk(t, 1.45, .21) });
  camW([-1.4, .45, AW(t) - 2.4], [0, .5, AW(t)], [-1.3, .5, AW(t) - 2.2], [0, .6, AW(t)], U(lt, 1.4), 46); wEnd(t, 0); }, { rain: false });
// ---------------- 8-9 "คนของวิกเตอร์กว่าห้าสิบคน หันมามองผมพร้อมกัน" : the camera pans along the walls as every head turns, a wave ----------------
S('W07', 19.75, 'cut', WAREHOUSE, (lt, t) => { whLight(); MIND = 2.6; put(AR(), WAREHOUSE, live(lt, 1, { p: [0, 0, AW(t)], ry: 180, ex: 'calm', ...walk(t, 1.45, .21) }, .3));
  const u = U(lt, 3.8, eIO); camW(lp([4.6, 2.2, 4.0], [-4.0, 2.4, 3.5], u), lp([-6.0, 1.4, -2.0], [6.0, 1.4, -4.0], u), lp([4.6, 2.2, 4.0], [-4.0, 2.4, 3.5], u), lp([-6.0, 1.4, -2.0], [6.0, 1.4, -4.0], u), 0, 52);
  ZC.warehouseAt(t, camera); Z.whCrowd.forEach((m, i) => { const k = clamp((lt - .3 - (i % 12) * .12) / .35); m.scale.x = .3 + .7 * eOut(k); }); }, { rain: false });
// ---------------- 10 "แกมาจากไหน" : Victor, in front of his throne, lit by the fire drums ----------------
S('W08', 23.6, 'cut', WAREHOUSE, (lt, t) => { whLight(); MIND = 2.6; put(VI(), WAREHOUSE, live(lt, 5, { p: [0, .4, -8.4], ry: 0, ex: 'stoic', talk: talkAt(t), head: [-6, 0, 0], hL: [-.34, .5, -.05], hR: [.34, .5, -.05], pL: [-1, 0, -.3], pR: [1, 0, -.3] }, .5));
  inner(lt, t, 'smug'); faceLight(VI());
  camW([.5, 2.1, -5.2], [0, 2.3, -8.4], [.45, 2.1, -5.4], [0, 2.3, -8.4], U(lt, 1.1), 40); wEnd(t); }, { rain: false });
// ---------------- 11 "ผมมาเสนอผลประโยชน์ให้คุณ" : Aren, calm, in the middle of the room ----------------
S('W09', 24.6, 'cut', WAREHOUSE, (lt, t) => { whLight(); MIND = 2.6; put(AR(), WAREHOUSE, live(lt, 1, { p: [0, 0, -3.0], ry: 180, ex: 'calm', talk: talkAt(t), look: gaze(lt, 'stare') }, .5)); faceLight(AR(), '#ffd0a8', -1);
  camW([-.5, 1.62, -5.6], [0, 1.62, -3.0], [-.42, 1.62, -5.4], [0, 1.62, -3.0], U(lt, 2.0), 38); wEnd(t); }, { rain: false });
// ---------------- 12 "เขาหัวเราะลั่นทั้งโกดัง" : Victor laughs, head back; the inner circle laughs; he walks down to Aren ----------------
const VZ = (t) => -8.4 + 3.75 * U(t - 27.1, 1.6, eIO);
S('W10', 26.7, 'cut', WAREHOUSE, (lt, t) => { whLight(); MIND = 2.6; const k = Math.sin(lt * 13) * .5 + .5;
  put(VI(), WAREHOUSE, live(lt, 5, { p: [0, VZ(t) < -8.2 ? .4 : 0, VZ(t)], ry: 0, ...perform(lt, [[0, 'laugh']], { seed: 5 }), head: [-14 - 4 * k, 0, 4], ...(VZ(t) > -8.3 && lt < 1.9 ? walk(t, 1.3, .2) : {}) }, .4));
  inner(lt, t, 'laugh', { head: [-8, 0, 0] }); put(AR(), WAREHOUSE, { p: [0, 0, -3.0], ry: 180, ex: 'stoic' }); faceLight(VI());
  camW([1.5, 1.9, -2.0], [0, 1.8, -6.6], [1.3, 1.9, -2.4], [0, 1.8, -5.6], U(lt, 2.0), 50); wEnd(t); }, { rain: false });
// ---------------- 13 "แล้วหมัดของเขาก็พุ่งผ่านข้างหัวผม" : the punch flies past Aren's head ----------------
S('W11', 28.7, 'cut', WAREHOUSE, (lt, t) => { whLight(); MIND = 2.4; const at = 1.1, p = actPunch(lt, at, { side: 1 });
  put(VI(), WAREHOUSE, { p: [-.15, 0, -4.65], ry: 0, ex: lt < at ? 'angry' : 'smug', ...p, hR: lt > at - .06 && lt < at + .5 ? [.42, 1.5, .95] : p.hR });
  put(AR(), WAREHOUSE, { p: [0, 0, -3.0], ry: 180, ex: 'stoic', blink: false, look: [0, 0] }); HOLE.visible = CRACK.visible = lt > at; faceLight(AR(), '#ffd0a8', -1);
  const hp = WAREHOUSE.localToWorld(V(.45, 1.78, -2.55)); if (lt > at && lt < at + .25) impactAt(hp, (lt - at) / .25, 1.2); debrisAt(hp, lt - at, { n: 22, seed: 9, speed: 3, kind: 'rock', col: '#8a8690' });
  SH.a = trauma(lt, [[at, .55]]); SH.t = t;
  camW([3.3, 1.75, -3.85], [-.05, 1.8, -3.85], [3.2, 1.75, -3.8], [-.05, 1.8, -3.8], U(lt, 2.4), 54); wEnd(t); }, { rain: false });
// ---------------- 14 "กำแพงด้านหลัง แตกเป็นรู" : behind Aren: the hole in the concrete pillar beside his head, dust falling ----------------
S('W12', 31.4, 'cut', WAREHOUSE, (lt, t) => { whLight(); MIND = 2.4; HOLE.visible = CRACK.visible = true;
  put(VI(), WAREHOUSE, { p: [-.15, 0, -4.65], ry: 0, ex: 'smug', hR: [.42, 1.5, .95], pR: [1, -.4, -.2], hL: [-.3, .4, .2] }); put(AR(), WAREHOUSE, { p: [0, 0, -3.0], ry: 180, ex: 'stoic', blink: false });
  const hp = WAREHOUSE.localToWorld(V(.45, 1.78, -2.55)); debrisAt(hp, lt + 2.3, { n: 22, seed: 9, speed: 3, kind: 'rock', col: '#8a8690' }); smokeAt(hp, lt + .3, { n: 10, seed: 6, size: .5, col: '#a8a4ac' });
  camW([1.7, 1.75, -5.6], [.3, 1.75, -2.8], [1.55, 1.75, -5.4], [.3, 1.75, -2.8], U(lt, 2.0), 40); wEnd(t); }, { rain: false });
// ---------------- 15 "ผมไม่กะพริบตาเลย" : Aren, still, not one blink ----------------
S('W13', 33.65, 'cut', WAREHOUSE, (lt, t) => { whLight(); MIND = 2.2; HOLE.visible = CRACK.visible = true; put(AR(), WAREHOUSE, { p: [0, 0, -3.0], ry: 180, ex: 'stoic', blink: false, look: [0, 0] }); faceLight(AR(), '#ffd0a8', -1);
  camW([.3, 1.62, -5.2], [0, 1.62, -3.0], [.25, 1.62, -5.05], [0, 1.62, -3.0], U(lt, 1.6), 34); wEnd(t); }, { rain: false });
// ---------------- 16 "เพราะผมไม่ได้มาท้าทายเขา" : two-shot; Victor pulls the fist back; Aren's small smile ----------------
S('W14', 35.15, 'blur', WAREHOUSE, (lt, t) => { whLight(); MIND = 2.6; HOLE.visible = CRACK.visible = true; const back = U(lt, .8, eIO);
  put(VI(), WAREHOUSE, live(lt, 5, { p: [-.15, 0, -4.65], ry: 0, ex: 'suspicious', hR: lp([.42, 1.5, .95], [.3, .3, .1], back), pR: [1, -.4, -.2] }, .5)); put(AR(), WAREHOUSE, live(lt, 1, { p: [0, 0, -3.0], ry: 180, ex: lt > .9 ? 'sly' : 'stoic' }, .4));
  camW([3.4, 1.8, -3.9], [0, 1.8, -3.85], [3.3, 1.8, -3.85], [0, 1.8, -3.85], U(lt, 1.9), 54); wEnd(t); }, { rain: false });
// ---------------- 17 "ผมมาดูว่า… เขาไว้ใจใครมากที่สุด" : Aren's eyes go over Victor's shoulder; the camera pans across the inner circle ----------------
S('W15', 37.15, 'cut', WAREHOUSE, (lt, t) => { whLight(); MIND = 2.6; put(VI(), WAREHOUSE, live(lt, 5, { p: [-.15, 0, -4.65], ry: 0, ex: 'suspicious' }, .5)); inner(lt, t, i => ['smug', 'calm', 'sly', 'stoic'][i]);
  put(AR(), WAREHOUSE, { p: [0, 0, -3.0], ry: 180, ex: 'focused', look: gaze(lt, 'search', 4) });
  const u = U(lt, 2.8, eIO); camW([1.6, 2.6, -1.0], lp([-2.6, 1.7, -8.0], [2.6, 1.7, -8.0], u), [1.6, 2.6, -1.0], lp([-2.6, 1.7, -8.0], [2.6, 1.7, -8.0], u), 0, 52); wEnd(t); }, { rain: false });
// ---------------- 18 "ผมวางกระดาษแผ่นหนึ่งลงบนโต๊ะ" : level macro: his hand puts one sheet on the table ----------------
S('W16', 40.3, 'cut', WAREHOUSE, (lt, t) => { whLight(); MIND = 0; const d = U(lt - .2, .9, eIO);
  put(AR(), WAREHOUSE, live(lt, 1, { p: [.75, 0, -3.25], ry: 90, ex: 'calm', lean: 12 * d, hR: lp([.25, .7, .3], [.12, .55, .62], d), pR: [1, -.4, 0] }, .3));
  Z.whPaper.visible = d > .95; const tp = TABLE.localToWorld(V(.1, 1.05, .05)), tl = WAREHOUSE.worldToLocal(tp.clone());
  camW([tl.x - .9, tl.y + .35, tl.z + .9], [tl.x, tl.y, tl.z], [tl.x - .8, tl.y + .32, tl.z + .8], [tl.x, tl.y, tl.z], U(lt, 2.1), 40); wEnd(t); }, { rain: false });
// ---------------- 19-20 "รายชื่อคนสนิทของวิกเตอร์ / พร้อมตัวเลข ว่าใครแอบเก็บส่วยไว้เท่าไร" : over the list: names, numbers, a red ring ----------------
S('W17', 42.35, 'cut', WAREHOUSE, (lt, t) => { whLight(); MIND = 0; Z.whPaper.visible = true; const tp = TABLE.localToWorld(V(.1, 1.02, .05)), tl = WAREHOUSE.worldToLocal(tp.clone());
  const u = U(lt, 4.6, eIO); camW([tl.x + .05, tl.y + .62, tl.z + .1 + .15 * u], [tl.x + .02, tl.y, tl.z + .12 - .2 * u], [tl.x + .05, tl.y + .62, tl.z + .1 + .15 * u], [tl.x + .02, tl.y, tl.z + .12 - .2 * u], 0, 36); wEnd(t); }, { rain: false });
// ---------------- 21 "รู้ไหมว่าทำไม คนที่แข็งแกร่งที่สุด มักถูกทรยศ" : Aren speaks, over Victor's shoulder ----------------
S('W18', 47.2, 'blur', WAREHOUSE, (lt, t) => { whLight(); MIND = 2.6; Z.whPaper.visible = true; put(VI(), WAREHOUSE, live(lt, 5, { p: [-.15, 0, -4.65], ry: 0, ex: 'suspicious' }, .5));
  put(AR(), WAREHOUSE, live(lt, 1, { p: [.3, 0, -3.0], ry: 200, ...perform(lt, [[0, 'neutral'], [.6, 'explain']], { seed: 1 }), ex: 'calm', talk: talkAt(t) }, .4)); faceLight(AR(), '#ffd0a8', -1);
  camW([-1.6, 1.9, -6.9], [.3, 1.62, -3.0], [-1.45, 1.88, -6.7], [.3, 1.62, -3.0], U(lt, 3.6), 44); wEnd(t); }, { rain: false });
// ---------------- 22-23 "เพราะคนที่ยืนใกล้คุณที่สุด / รู้ว่าจุดอ่อนคุณอยู่ตรงไหน" : ONE move from Aren to the men behind the king ----------------
S('W19', 50.95, 'cut', WAREHOUSE, (lt, t) => { whLight(); MIND = 2.6; Z.whPaper.visible = true; put(VI(), WAREHOUSE, live(lt, 5, { p: [-.15, 0, -4.65], ry: 0, ex: 'stoic' }, .5));
  put(AR(), WAREHOUSE, live(lt, 1, { p: [.3, 0, -3.0], ry: 200, ex: 'sly', talk: talkAt(t) }, .4)); inner(lt, t, i => ['guilty', 'anxious', 'stoic', 'ashamed'][i]);
  const u = U(lt - .9, 2.9, eIO), bz = (A, C, B) => A.map((v, i) => (1 - u) ** 2 * v + 2 * u * (1 - u) * C[i] + u * u * B[i]), cp = bz([-1.6, 1.9, -6.9], [-1.6, 4.2, -4.6], [1.3, 3.4, -1.6]), ct = lp([.3, 1.62, -3.0], [0, 1.6, -8.0], u); camW(cp, ct, cp, ct, 0, 50); wEnd(t); }, { rain: false });
// ---------------- 24 "รอยยิ้มของวิกเตอร์ค่อย ๆ หายไป" : slow push on the king's face as the smile drains ----------------
S('W20', 55.0, 'cut', WAREHOUSE, (lt, t) => { whLight(); MIND = 2.2; put(VI(), WAREHOUSE, live(lt, 5, { p: [-.15, 0, -4.65], ry: 0, ...exShift(lt, 1.0, 'smug', 'stoic'), ...(lt > 1.8 ? exShift(lt, 1.8, 'stoic', 'dread') : {}) }, .4)); faceLight(VI());
  camW([-.2, 2.05, -2.0], [-.15, 2.05, -4.65], [-.18, 2.05, -2.35], [-.15, 2.05, -4.65], U(lt, 2.6), 36); wEnd(t); }, { rain: false });
// ---------------- 25 "เขาหันไปมองคนรอบตัวทีละคน" : over his shoulder, his head turns from man to man ----------------
S('W21', 57.75, 'cut', WAREHOUSE, (lt, t) => { whLight(); MIND = 2.6; const yaw = lt < .9 ? 0 : lt < 1.6 ? 35 : -35;
  put(VI(), WAREHOUSE, { p: [-.15, 0, -4.65], ...turn(lt, .9, .5, 0, 160), ...(lt > 1.6 ? turn(lt, 1.6, .5, 160, 200) : {}), ex: 'suspicious', look: [.6 * Math.sign(yaw), 0] });
  inner(lt, t, i => ['guilty', 'anxious', 'stoic', 'ashamed'][i], { look: [0, .5] });
  camW([-.9, 2.8, -.6], [-.1, 1.7, -8.0], [-.8, 2.75, -.9], [.1, 1.7, -8.0], U(lt, 2.2), 54); wEnd(t); }, { rain: false });
// ---------------- 26 "และคนรอบตัว ก็เริ่มมองกันเอง" : the inner circle glance at each other; the crowd shifts ----------------
S('W22', 60.15, 'cut', WAREHOUSE, (lt, t) => { whLight(); MIND = 2.6; inner(lt, t, i => ['suspicious', 'anxious', 'suspicious', 'guilty'][i]);
  LT.forEach(([f], i) => { const C = f(); C._lk = gaze(lt, 'shifty', 20 + i); }); LT.forEach(([f, p, ry], i) => put(f(), WAREHOUSE, live(lt, 11 + i, { p, ry: ry + 25 * Math.sin(lt * 1.7 + i), ex: ['suspicious', 'anxious', 'suspicious', 'guilty'][i], look: f()._lk }, .6)));
  camW([0, 2.6, -1.6], [0, 1.6, -8.0], [0, 2.5, -2.2], [0, 1.6, -8.0], U(lt, 2.3), 56); wEnd(t); }, { rain: false });
// ---------------- 27 "แกต้องการอะไร" : Victor, cold ----------------
S('W23', 62.45, 'cut', WAREHOUSE, (lt, t) => { whLight(); MIND = 2.6; put(VI(), WAREHOUSE, live(lt, 5, { p: [-.15, 0, -4.65], ry: 0, ex: 'frown', talk: talkAt(t) }, .5)); faceLight(VI());
  camW([.4, 2.0, -2.3], [-.15, 2.05, -4.65], [.35, 2.0, -2.4], [-.15, 2.05, -4.65], U(lt, 1.0), 38); wEnd(t); }, { rain: false });
// ---------------- 28 "แค่อยากให้คุณ… มีชีวิตอยู่ต่ออีกสักหน่อย" : Aren, a slow push, the faint smile ----------------
S('W24', 63.45, 'cut', WAREHOUSE, (lt, t) => { whLight(); MIND = 2.2; put(AR(), WAREHOUSE, live(lt, 1, { p: [.3, 0, -3.0], ry: 180, ...exShift(lt, 1.8, 'calm', 'sinister'), talk: talkAt(t) }, .4)); faceLight(AR(), '#ffd0a8', -1);
  camW([.0, 1.62, -5.4], [.3, 1.62, -3.0], [.1, 1.62, -5.1], [.3, 1.62, -3.0], U(lt, 3.4), 36); wEnd(t); }, { rain: false });
// ---------------- 29 "ผมเดินออกจากฐานมาโดยไม่มีใครกล้าขวาง" : he walks to the door; the men step out of his way ----------------
const OZ = (t) => -3.0 + Math.max(0, t - 67.2) * 1.45;
S('W25', 66.95, 'sweep', WAREHOUSE, (lt, t) => { whLight(); MIND = 2.6; DOORL.visible = true; DOORL.material.opacity = .6;
  put(AR(), WAREHOUSE, { p: [.3 + .9 * clamp(1 - Math.abs(OZ(t) + 1.9) / 2.0), 0, OZ(t)], ry: 0, ex: 'calm', ...walk(t, 1.45, .21) }); put(VI(), WAREHOUSE, live(lt, 5, { p: [-.15, 0, -4.65], ry: 0, ex: 'dread' }, .5));
  Z.whCrowd.forEach(m => { m.userData.x0 ??= m.position.x; const near = Math.abs(m.position.z - OZ(t)) < 2.5 ? 1 : 0; m.position.x = m.userData.x0 + Math.sign(m.userData.x0) * .4 * near; });
  camW([.9, 1.75, 4.8], [.7, 1.5, OZ(t)], [.8, 1.75, 5.6], [.5, 1.5, OZ(t)], U(lt, 3.0), 46); wEnd(t); Z.whCrowd.forEach(m => { m.position.x = m.userData.x0; }); }, { rain: false });
// ---------------- 30-31 "ทุกอย่างเป็นไปตามแผน / อย่างน้อย ผมก็คิดแบบนั้น" : WHIP to the street; he walks, pleased with himself ----------------
const SZ = (t) => -4.5 - Math.max(0, t - 70.0) * 1.3;
S('W26', 69.95, 'whip', STREET, (lt, t) => { streetLight(lt); MIND = 2.6; put(AR(), STREET, live(lt, 1, { p: [0, .18, SZ(t)], ry: 180, ...exShift(lt, 2.3, 'sly', 'calm'), ...walk(t, 1.35, .2) }, .3));
  camS([.7, 1.65, SZ(t) + 2.6], [0, 1.6, SZ(t) - 1.0], [.6, 1.65, SZ(t) + 2.9], [0, 1.6, SZ(t) - 1.0], U(lt, 4.0), 44); });
// ---------------- 32 "จนชายในเสื้อคลุมดำคนหนึ่ง ยืนขวางทาง" : a black-cloaked figure under the lamp, in his path; Aren stops ----------------
S('W27', 74.0, 'cut', STREET, (lt, t) => { streetLight(lt); MIND = 2.6; const z = Math.min(SZ(t), -10.2), stop = U(lt - .4, .5);
  put(AR(), STREET, live(lt, 1, { p: [0, .18, Math.max(z, -10.6)], ry: 180, ex: 'calm', ...(lt < .9 ? walk(t, 1.35, .2 * (1 - stop)) : {}) }, .3));
  put(CL(), STREET, live(lt, 9, { p: [0, .18, -14.2], ry: 0, ex: 'veiled' }, .3)); setRig(RIGS.silhouette); lightAt(STREET.localToWorld(V(0, 3.5, -14.6)), '#d8e4ff', 2.6, .6);
  camS([1.1, 1.3, -7.6], [0, 1.6, -13.0], [1.0, 1.35, -7.9], [0, 1.6, -13.0], U(lt, 3.4), 44); });
// ---------------- 33-34 "ผมมองไม่เห็นหน้าเขา / เห็นแค่รอยยิ้มบาง ๆ" : medium close-up: shadow where a face should be, a thin smile; red ring ----------------
S('W28', 77.35, 'cut', STREET, (lt, t) => { streetLight(lt); MIND = 2.4; put(CL(), STREET, live(lt, 9, { p: [0, .18, -14.2], ry: 0, ex: 'veiled', head: [6, 0, 0] }, .3)); scribbleAt(CL(), (lt - .9) / .5, .15);
  lightAt(headW(CL(), .4), '#c8d4ff', .9, .5); camS([.25, 1.75, -11.6], [0, 1.8, -14.2], [.2, 1.75, -11.85], [0, 1.8, -14.2], U(lt, 3.1), 38); });
// ---------------- 35-36 "เด็กใหม่ไม่มีพลัง… กล้าเดินเข้าไปหาเจ้าถิ่น" : he speaks (only the mouth moves) ----------------
S('W29', 80.5, 'cut', STREET, (lt, t) => { streetLight(lt); MIND = 2.4; put(CL(), STREET, live(lt, 9, { p: [0, .18, -14.2], ry: 0, ex: 'veiled', talk: talkAt(t), head: [6, 0, 4] }, .3));
  put(AR(), STREET, { p: [0, .18, -10.6], ry: 180, ex: 'stoic' }); lightAt(headW(CL(), .4), '#c8d4ff', .9, .5);
  camS([-.9, 1.85, -9.4], [0, 1.75, -14.2], [-.8, 1.85, -9.7], [0, 1.75, -14.2], U(lt, 3.3), 40); });
// ---------------- 37 "หรือแกกำลังทำให้ทุกคนคิดว่าแกอ่อนแอ?" : he steps closer; the camera holds on Aren past the cloak ----------------
S('W30', 83.85, 'blur', STREET, (lt, t) => { streetLight(lt); MIND = 2.4; const z = -14.2 + 1.4 * U(lt - .3, 1.6, eIO);
  put(CL(), STREET, live(lt, 9, { p: [.15, .18, z], ry: 0, ex: 'veiled', talk: talkAt(t), ...(lt > .3 && lt < 1.9 ? walk(t, 1.0, .14) : {}) }, .3));
  put(AR(), STREET, live(lt, 1, { p: [0, .18, -10.6], ry: 180, ...exShift(lt, 1.6, 'stoic', 'focused') }, .3));
  camS([.8, 1.9, -15.6], [0, 1.65, -10.6], [.7, 1.88, -15.2], [0, 1.65, -10.6], U(lt, 3.1), 40); });
// ---------------- 38 "ผมหยุดเดิน" : Aren frozen ----------------
S('W31', 87.0, 'cut', STREET, (lt, t) => { streetLight(lt); MIND = 2.4; put(AR(), STREET, { p: [0, .18, -10.6], ry: 180, ...perform(lt, [[0, 'frozen']]), ex: 'realize', still: true });
  camS([.35, 1.62, -12.9], [0, 1.62, -10.6], [.3, 1.62, -12.75], [0, 1.62, -10.6], U(lt, 1.2), 36); });
// ---------------- 39-40 "เป็นครั้งแรก… ที่มีคนมองออกว่าผมกำลังเล่นเกม" : slow push into his eyes; the cloak's smile in the background ----------------
S('W32', 88.2, 'cut', STREET, (lt, t) => { streetLight(lt); MIND = 2.0; put(AR(), STREET, live(lt, 1, { p: [0, .18, -10.6], ry: 180, ...exShift(lt, 2.2, 'realize', 'focused'), look: gaze(lt, 'stare') }, .3));
  put(CL(), STREET, live(lt, 9, { p: [.95, .18, -12.9], ry: -15, ex: 'veiled' }, .3)); bigWord(STREET, 'GAME', [0, 3.6, -20], { h: 1.6, k: (lt - 1.6) / .8, col: '#ff2a3a', op: .8 });
  camS([-.15, 1.66, -14.0], [0, 1.64, -10.6], [-.08, 1.65, -12.5], [0, 1.64, -10.6], U(lt, 5.3, eOut), 36); });

export function initShots(timing) { TM.env = timing.env; TM.vis = timing.vis; for (let i = 0; i < SHOTS.length; i++) SHOTS[i].t1 = i + 1 < SHOTS.length ? SHOTS[i + 1].t0 : timing.end; }
export function runShot(sh, t) { reset(t); sh.fn(t - sh.t0, t); }
export const WHITEK = { k: 0 };
export const COVER = { id: 'COVER', t0: 0, fn: (lt, t, o = {}) => { reset(30); WAREHOUSE.visible = true; whLight(); HOLE.visible = CRACK.visible = true; PILLAR.visible = true;
  put(VI(), WAREHOUSE, { p: [-.15, 0, -4.65], ry: 0, ex: 'angry', hR: [.42, 1.5, .95], pR: [1, -.4, -.2], hL: [-.3, .4, .2] }); put(AR(), WAREHOUSE, { p: [0, 0, -3.0], ry: 180, ex: 'sinister' }); redEyes(AR(), .8, 30); faceLight(AR(), '#ffd0a8', -1);
  MIND = 0; const cm = o.cam || [-1.3, 2.0, -7.6], g = o.tgt || [.1, 2.0, -3.0]; camW(cm, g, cm, g, 0, o.fov || 44); ZC.warehouseAt(30, camera); } };
export const BENCH = { id: 'BENCH', t0: 0, fn: (lt, t, o = {}) => { reset(0); if (o.roof) { ZC.ROOF.visible = true; ZC.roofAt(3); alleyLight(); setRig(RIGS.alley); put(GM(), ZC.ROOF, { p: [0, 0, -6.2], ry: 180, ex: 'evil' }); const c = o.cam, g = o.tgt; look(V(...c).add(ZC.ROOF.position), V(...g).add(ZC.ROOF.position), o.fov || 50); ZC.zcLate(3, camera); return; } STREET.visible = true; streetLight(0); if (o.rig) setRig({ ...RIGS.street, ...o.rig }); const ids = ['aren', 'guard', 'fire', 'strong', 'thug1', 'thug2', 'thug3', 'gunman'];
  if (o.act) { const L = o.act, n = L.length, sp = o.sp ?? .85; ids.forEach((id) => put(CHARS[id], STREET, { p: [0, -50, -30], visible: false }));
    L.forEach((a, i) => { const id = o.who ? o.who[i % o.who.length] : ids[i % ids.length]; const pz = o.beats ? perform(o.lt, o.beats, { seed: i }) : typeof a === 'string' && POSES[a] && !o.faceOnly ? perform(5, [[0, a]], { seed: i, still: true }) : a.includes('|') ? { ex: a.split('|')[0], talk: a.split('|')[1] } : { ex: a };
      put(CHARS[id], STREET, { p: [(i - (n - 1) / 2) * sp, .18, -9], ry: o.ry ?? 0, ...pz, blink: false, still: true }); });
    const bc = o.cam || [0, 1.4, -2.6], bt = o.tgt || [0, 1.1, -9]; camS(bc, bt, bc, bt, 0, o.fov || 44); return; }
  ids.forEach((id, i) => put(CHARS[id], STREET, { p: [(i - 3.5) * .85, .18, -9], ry: o.ry ?? 0, ex: ['sly', 'angry', 'grinTeeth', 'confident', 'evil', 'sneaky', 'frown', 'calm'][i] }));
  const bc = o.cam || [0, 1.4, -2.6], bt = o.tgt || [0, 1.1, -9]; camS(bc, bt, bc, bt, 0, o.fov || 44); } };
