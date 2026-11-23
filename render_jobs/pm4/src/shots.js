// shots.js: THE PUPPET MASTER ep 3 "ราชาแห่งเขตตะวันออก" (93.56 s) - times are real seconds, clocks run 1:1 (SP = 1)
import { THREE, canvasTex, setSmoothLight, scene, camera, clamp, lerp, sstep, eIO, eOut, eIn, eSine, D2R, noise1, rng, POST, mesh, rbox, toon, basic, group, cylBetween } from './engine.js';
import * as Wd from './world.js';
import * as ZC from './zc.js';
import { perform, POSES, walkAlong } from './acting.js';
import { bigWord } from './text3d.js';
import { sparks, shatter } from './fxphys.js';
import { turn, take, hitReact, hold, trauma } from './motion.js';
import { gaze, exShift } from './acting.js';
import { LK, CHARS, OVL, lipAt, scribbleAt, headBall, beamAt, actPunch, actHit, impactAt, setRig, lightAt, pose, popAt, sparkAt, dustAt, debrisAt, smokeAt, tintAt, rainAt, shockAt, whisperAt, makeRope, updateRope } from './chars.js';
const { TRUCK, GATE, STREET, ALLEY, ROOF, WAREHOUSE, Z } = ZC;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const TM = { env: [] };
const SP = 1;
const talkAt = (t) => { const c = lipAt(TM, t / SP); return c === 'X' ? 0 : c; }; // v6.9 viseme lip sync (tools/lipsync.py)
let SH = { a: 0, t: 0 };
const pushed = (pos, tgt) => { if (PUSH.r <= 0 || LTF <= 0) return pos; const d = pos.clone().sub(tgt), L = d.length(); if (L < 1e-3) return pos; const nl = Math.max(Math.min(L, PUSH.min), L * Math.pow(1 - PUSH.r, LTF * 30)); return tgt.clone().add(d.multiplyScalar(nl / L)); };
function look(pos, tgt, fov = 40, roll = 0) { pos = pushed(pos, tgt); POST.focus = pos.distanceTo(tgt); camera.position.copy(pos); camera.fov = fov; camera.updateProjectionMatrix(); camera.up.set(0, 1, 0); camera.lookAt(tgt); if (roll) camera.rotateZ(roll * D2R);
  if (SH.a > 0) { const t = SH.t * 8;   /* a rumble, not a 22 Hz jitter (read as skipped frames on close shots) */ camera.rotateX(noise1(t) * .02 * SH.a); camera.rotateY(noise1(t + 50) * .02 * SH.a); camera.position.y += noise1(t + 9) * .05 * SH.a; } camera.updateMatrixWorld(); }
const lp = (a, b, u) => a.map((v, i) => lerp(v, b[i], u));
const CAMX = 1.3; /* moves are stretched at the far end only (never closer into faces) */
const ampl = (p0, p1, t0, t1) => { const d0 = Math.hypot(p0[0] - t0[0], p0[1] - t0[1], p0[2] - t0[2]), d1 = Math.hypot(p1[0] - t1[0], p1[1] - t1[1], p1[2] - t1[2]);
  return d0 >= d1 ? [p0.map((v, i) => p1[i] + (v - p1[i]) * CAMX), p1] : [p0, p1.map((v, i) => p0[i] + (v - p0[i]) * CAMX)]; };
let MIND = 2.6;
const keep = (p, t) => { const d = Math.hypot(p[0] - t[0], p[1] - t[1], p[2] - t[2]); if (d >= MIND || d < 1e-3) return p; const k = MIND / d; return p.map((v, i) => t[i] + (v - t[i]) * k); };
const camO = (o) => (p0, t0, p1, t1, u, fov = 40, roll = 0) => { p0 = keep(p0, t0); p1 = keep(p1, t1); const [q0, q1] = ampl(p0, p1, t0, t1); look(V(...lp(q0, q1, u)).add(o.position), V(...lp(t0, t1, u)).add(o.position), fov, roll); };
const camT = camO(TRUCK), camG = camO(GATE), camS = camO(STREET), camA = camO(ALLEY), camR = camO(ROOF), camW = camO(WAREHOUSE);
let NOW = 0, LTF = 0; const PUSH = { r: .0012, min: 1.4 };   /* ep4: every shot pushes in slowly (0.12 %/f, ricksclips/stick-toon measurements) */   /* world clock, set by S() each frame: idle motion is a function of world time so it never restarts at a cut */
const hs = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
/* IDLE LAYER (user: movement looked unnatural; audit: Aren and the thugs were FROZEN 57-100% of W10-W32, head speed .02 m/s):
   breathing, weight shift (side/twist), a new gaze target every ~1.9 s eased over .35 s, a small nod, hand fidgets + an occasional small hand lift.
   Never on walkers, and the hands are left alone when the character holds a prop. Deterministic per (seed, world time). */
const idle = (seed, P, t, k = 1) => {
  if (P.walk || P.noIdle) return P;
  const ph = seed * 1.7, br = Math.sin(t * 1.9 + ph), sw = Math.sin(t * 1.7 + ph * .6), sw2 = Math.sin(t * 1.7 + ph * .6 - .5);
  const gx = t / 1.9 + seed * .13, gi = Math.floor(gx), ge = eIO(clamp((gx - gi) * 1.9 / .35)), yaw = lerp((hs(gi - 1 + seed) - .5) * 9, (hs(gi + seed) - .5) * 9, ge) * k;
  const fd = (p2) => [.03 * Math.sin(t * 1.3 + ph + p2), .035 * Math.sin(t * 1.1 + ph * 1.3 + p2) + Math.max(0, Math.sin(t * 1.45 + ph + p2)) ** 5 * .07, .02 * Math.sin(t * .9 + ph * .7 + p2)].map(v => v * k);
  const o = { ...P, side: (P.side || 0) + 3.2 * sw * k, twist: (P.twist || 0) + 2.2 * sw2 * k, lean: (P.lean || 0) + .6 * br * k, hipY: (P.hipY || 0) + .004 * br * k,
    head: (P.head || [0, 0, 0]).map((v, i) => v + (i === 0 ? (2.2 * Math.sin(t * 2.3 + ph) + 1.2 * br) * k : i === 1 ? yaw : 1.8 * sw * k)) };
  if (!P.hold) { const R = P.hR || [.3, .26, .07], Lh = P.hL || [-.3, .26, .07], dr = fd(0), dl = fd(2.1); o.hR = R.map((v, i) => v + dr[i]); o.hL = Lh.map((v, i) => v + dl[i]); }
  o.__idle = 1; return o; };
const idSeed = (C) => { const e = Object.entries(CHARS).find(([k, v]) => v === C); let h = 7; for (const ch of String(e ? e[0] : 'x')) h = (h * 31 + ch.charCodeAt(0)) % 997; return h; };   /* a different phase per character: no synchronised swaying */
/* BLINKS instead of idle sway (measured on the reference: no idle loops, blinks every 0.5-2.3 s lasting 4 f = shut for the middle 2 frames) */
const BLK = new Map();
const blinkTimes = (seed) => { if (BLK.has(seed)) return BLK.get(seed); const a = []; let t = .4 + hs(seed) * 1.2; while (t < 120) { a.push(t); t += .5 + 1.8 * hs(seed * 3.7 + a.length * 1.3) ; } BLK.set(seed, a); return a; };
const blinkLayer = (seed, P, t) => { if (P.blink !== undefined || P.noBlink) return P; const a = blinkTimes(seed); for (let i = 0; i < a.length; i++) { if (t < a[i]) break; if (t >= a[i] + 1 / 30 && t < a[i] + 3 / 30) return { ...P, blink: true }; } return P; };
function put(C, parent, P) { if (C.g.parent !== parent) parent.add(C.g);
  if (parent === WAREHOUSE && P.p && Math.abs(P.p[0]) < 2.45 && P.p[2] < -7.9 && P.p[2] > -11.3 && P.p[1] < .3) P = { ...P, p: [P.p[0], P.p[1] + .4, P.p[2]] };   /* the dais top is at y .4: stand on it, not in it */
  P = blinkLayer(idSeed(C), P, NOW); pose(C, P); }
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
const S = (id, t0, tr, set, fn, o = {}) => { const sh = { id, t0, tr, ...o }; sh.fn = (lt, t) => { NOW = t; LTF = lt; PUSH.r = o.push ?? .0012; set.visible = true; ZC.zcAt(t * SP, camera); if (set === STREET) ZC.streetAt(t * SP); if (set === ALLEY) ZC.alleyAt(t * SP); if (set === GATE) ZC.gateAt(t * SP, 0); if (set === ROOF) ZC.roofAt(t);
  fn(lt * SP, t * SP); scene.updateMatrixWorld(); faceFires(camera); ZC.zcLate(t * SP, camera); if (o.rain !== false && set !== TRUCK) rainAt(t * SP, o.rain ?? .5); Wd.ambientAt(t, null); }; SHOTS.push(sh); };

// ===================================================================== EP 3 SHOTS (rules: geography, moves for nearby beats, varied transitions,
// natural acting, literal actions, framing incl. props, level camera on prop beats, lit faces for key characters)
const VI = () => CHARS.strong, CL = () => CHARS.cloak;    // Victor = the strong man of ep 2, now in his king's coat
const live = (lt, sd, P, k = .8) => { const h = hold(lt, sd, k); return idle(sd, { ...P, side: (P.side || 0) + h.side, twist: (P.twist || 0) + h.twist, head: (P.head || [0, 0, 0]).map((v, i) => v + h.head[i]) }, NOW, Math.min(1, k + .2)); };
function hideGuns() { [PILLAR, HOLE, CRACK, HOLE2, CRACK2, DOORL, POUCH].forEach(m => { m.visible = false; }); }
const PILLAR = mesh(rbox(1.2, 9, 1.2), toon('#4a3446'), { p: [0, 4.5, -1.9], parent: WAREHOUSE });
const HOLE = Z.whHole.clone(), CRACK = Z.whCrack.clone(); [HOLE, CRACK].forEach((m, i) => { m.position.set(.45, 1.78, -2.52 - i * .005); m.rotation.set(0, Math.PI, 0); WAREHOUSE.add(m); }); HOLE.scale.setScalar(.6); CRACK.scale.setScalar(.7);
const HOLE2 = Z.whHole.clone(), CRACK2 = Z.whCrack.clone(); [HOLE2, CRACK2].forEach((m, i) => { m.position.set(7.77 - i * .005, 1.6, 4); m.rotation.set(0, -Math.PI / 2, 0); WAREHOUSE.add(m); });
/* wall-break debris (fxphys.shatter, fixed 1/240 s integration, deterministic): chunks burst out of the wall at the exact punch frame and stay as rubble. W01 hits the right wall at 1.75 s, W11 hits the pillar at 28.7 + 1.1 s */
const _wb = (at, tBreak, dir, seed, power) => { const w = new THREE.Group(); WAREHOUSE.add(w); return shatter(WAREHOUSE, { kind: 'rock', whole: w, at, size: .5, tBreak, dir, power, n: 30, seed }); };
const WB1 = _wb([7.55, 1.6, 4], 1.75, [-1, .25, 0], 31, 3.4), WB2 = _wb([.45, 1.78, -2.55], 29.8, [0, .2, -1], 32, 3.2);
const DOORL = mesh(new THREE.PlaneGeometry(2.8, 3.8), basic('#ffd8b0', { transparent: true, opacity: .9 }), { p: [0, 1.95, 11.45], r: [0, 180, 0], parent: WAREHOUSE, cast: false }); DOORL.material.depthWrite = false; DOORL.renderOrder = 2;
const POUCH = mesh(new THREE.SphereGeometry(.09, 14, 10), toon('#8a6a3a'), { parent: scene });
const TABLE = Z.whPaper.parent; TABLE.position.set(1.7, 0, -3.4); TABLE.rotation.y = Math.PI / 2;
Z.whPaper.material.map = canvasTexP(); Z.whPaper.material.needsUpdate = true; Z.whPaper.rotation.z -= Math.PI / 2;
function canvasTexP() { const c = document.createElement('canvas'); c.width = 256; c.height = 352; const x = c.getContext('2d'); x.fillStyle = '#f4eee2'; x.fillRect(0, 0, 256, 352); x.fillStyle = '#2a2230'; x.font = '700 30px Prompt'; x.fillText('คนสนิท', 24, 46);
  x.font = '600 24px Prompt'; [['ดำ', '12,000'], ['เสือ', '8,500'], ['ไบค์', '21,000'], ['หมาป่า', '6,000']].forEach(([n, v], i) => { x.fillStyle = '#2a2230'; x.fillText(n, 24, 104 + i * 58); x.fillStyle = '#c0202a'; x.fillText(v, 150, 104 + i * 58); });
  x.strokeStyle = '#c0202a'; x.lineWidth = 3; x.beginPath(); x.ellipse(190, 200, 64, 26, 0, 0, 7); x.stroke(); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
for (const l of Z.whLamps) l.visible = true; Z.whCrowd.forEach(m => { m.scale.set(1.25, 1.25, 1); m.position.y *= 1.25; });
function whLight(o = {}) { PILLAR.visible = false; Z.whPaper.visible = false; setRig({ ...RIGS.alley, key: ['#ffc88a', .42], fill: ['#7080c0', .18], rim: ['#ff9a50', .55], base: 1.0 }); nightCity({ hemiI: 1.6, sunI: .7, fog: '#1c1612', fogN: 12, fogF: 45, stars: 0, moon: 0, ...o });
  Wd.setShadowFocus(-600, 1, 600, 12); neonPt(0, WAREHOUSE.localToWorld(V(0, 6, -3)), '#ffcc88', 7, 14); neonPt(1, WAREHOUSE.localToWorld(V(0, 2, -8.6)), '#ff9a40', 5, 9); neonPt(2, WAREHOUSE.localToWorld(V(0, 6, 5)), '#ffcc88', 5, 12); }
const faceLight = (C, col = '#ffd0a8', side = 1) => { const h = WAREHOUSE.worldToLocal(headW(C, .45)); neonPt(3, WAREHOUSE.localToWorld(V(h.x + side * .9, h.y + .4, h.z + 1.1)), col, 4, 4); };
const wEnd = (t, look = 1) => { ZC.warehouseAt(t, camera); Z.whCrowd.forEach((m, i) => { const k = clamp(look * 1.6 - (i % 9) * .07); m.scale.x = .3 + .7 * k; }); };
const AW = (t) => Math.max(-3.0, 9.5 - Math.max(0, t - 15.0) * 1.45);   // Aren walks in from the door along x = 0 and stops in front of the pillar
/* Aren walks AROUND the pillar (x 0, z -1.9, 1.2 m wide): he sidesteps left while passing it - the old straight path went THROUGH it (user screen recording 16:18) */
const AX = (z) => -1.05 * eIO(clamp((1.4 - z) / 1.3));   /* sidestep left of the pillar's edge (x -.6) with room for his body, and stay there: W08 cuts to Victor right after */
const LT = [[T1, [-2.0, .4, -8.3], 20], [T2, [2.0, .4, -8.3], -20], [T3, [-3.2, 0, -7.2], 30], [GU, [3.2, 0, -7.2], -30]];   // Victor's inner circle
function inner(lt, t, ex = 'smug', P = {}) { LT.forEach(([f, p, ry], i) => put(f(), WAREHOUSE, live(lt, 11 + i, { p, ry, ex: typeof ex === 'function' ? ex(i) : ex, ...P }, .6))); }
// ===================================================================== EP 4 "นักล่าที่มองไม่เห็น" (The Invisible Hunter)
// Rules applied from the start (ricksclips/stick-toon measurements + the user's ep3 notes): every shot keeps a slow push-in (PUSH, global in look()),
// camera moves are eased glides, blinks every 0.5-2.3 s (blinkP) instead of idle sway, reactions land 0-3 f before the word, whisper line + text = Aren's POWER only,
// props never block a lens (MIND), characters are placed off every prop footprint, no frozen camera hold >= 12 f.
const NO = () => CHARS.noah, P1 = () => CHARS.p1, P2 = () => CHARS.p2;
const ARX = (z) => ({ p: [0, .18, z], ry: 180 });
/* ---------- FX: rain that parts around an invisible human shape ---------- */
const GAPN = 900, gapG = new THREE.Group(), gapGeo = new THREE.BufferGeometry(), dotGeo = new THREE.BufferGeometry(), gapPos = new Float32Array(GAPN * 6), dotPos = new Float32Array(GAPN * 3);
gapGeo.setAttribute('position', new THREE.BufferAttribute(gapPos, 3)); dotGeo.setAttribute('position', new THREE.BufferAttribute(dotPos, 3));
const gapLines = new THREE.LineSegments(gapGeo, new THREE.LineBasicMaterial({ color: '#c4d8ff', transparent: true, opacity: .3, depthWrite: false, blending: THREE.AdditiveBlending }));
const gapDots = new THREE.Points(dotGeo, new THREE.PointsMaterial({ color: '#f0f6ff', size: .055, transparent: true, opacity: .95, depthWrite: false, blending: THREE.AdditiveBlending }));
[gapLines, gapDots].forEach(m => { m.frustumCulled = false; m.userData.noInk = true; gapG.add(m); });
const gapTex = canvasTex(256, 512, (x, w, h) => { x.clearRect(0, 0, w, h); x.lineJoin = 'round'; x.lineCap = 'round'; x.strokeStyle = 'rgba(210,228,255,.9)'; x.lineWidth = 5; x.shadowColor = '#9fc4ff'; x.shadowBlur = 14;
  x.beginPath(); x.arc(128, 70, 34, 0, 7); x.stroke(); x.beginPath(); x.moveTo(60, 190); x.quadraticCurveTo(70, 118, 128, 112); x.quadraticCurveTo(186, 118, 196, 190); x.lineTo(184, 330); x.lineTo(168, 480); x.moveTo(72, 330); x.lineTo(88, 480); x.moveTo(60, 190); x.lineTo(72, 330); x.moveTo(196, 190); x.lineTo(184, 330); x.stroke(); });
const gapOutline = mesh(new THREE.PlaneGeometry(.95, 1.9), basic('#ffffff', { transparent: true, opacity: 0, map: gapTex, depthWrite: false }), { parent: gapG, cast: false }); gapOutline.renderOrder = 6; gapOutline.userData.noInk = true;
gapG.visible = false;
function gapAt(set, x, z, k, t, h = 1.75) {
  if (gapG.parent !== set) set.add(gapG);
  gapG.visible = k > .01; if (!gapG.visible) return; gapG.position.set(x, 0, z);
  const R = .3 * k, RH = .17 * k; let n = 0, m = 0;
  for (let i = 0; i < GAPN; i++) {
    const a = hs(i * 1.7 + 3), b = hs(i * 3.1 + 7), c = hs(i * 5.3 + 11), px = (a - .5) * 2.2, pz = (b - .5) * 2.2, sp = 11 + c * 4, top = 6.2;
    const y0 = (((c * 9 - t * sp) % top) + top) % top, y1 = y0 + .3, r = Math.hypot(px, pz), surf = r < RH ? (h + .03) * k : r < R ? 1.45 * k : 0;
    if (surf > 0) { if (y0 < surf + .02) { if (y1 > surf - .08 && y0 < surf + .6 && m < GAPN) { dotPos.set([px, surf, pz], m * 3); m++; } continue; } }
    gapPos.set([px, y0, pz, px - .03, y1, pz], n * 6); n++;
  }
  gapGeo.setDrawRange(0, n * 2); gapGeo.attributes.position.needsUpdate = true; dotGeo.setDrawRange(0, m); dotGeo.attributes.position.needsUpdate = true;
  gapOutline.position.set(0, h * .5, 0); gapOutline.quaternion.copy(camera.quaternion); gapOutline.material.opacity = .26 * k;
}
const gapPoint = (set, x, z, up = 1.62) => { set.updateMatrixWorld(); return set.localToWorld(V(x, up, z)); };
/* a sprite character that fades in / out (Noah appears and vanishes in the rain) */
function setAlpha(C, a) { const L = []; C.g.traverse(o => { if (o.material) L.push(o); }); [C.sb, C.sh].forEach(o => { if (o && o.material) L.push(o); });
  for (const o of L) for (const m of [].concat(o.material)) { if (!m.colorWrite) continue; m.transparent = a < .999; m.opacity = a; m.depthWrite = a > .98; m.needsUpdate = true; } }
/* ---------- props ---------- */
const KNIFE = group({ parent: scene }); mesh(new THREE.BoxGeometry(.03, .012, .26), basic('#eef4ff'), { p: [0, 0, .13], parent: KNIFE, cast: false }); mesh(new THREE.BoxGeometry(.036, .034, .11), basic('#241c26'), { p: [0, 0, -.055], parent: KNIFE, cast: false }); KNIFE.scale.setScalar(2.2); KNIFE.visible = false;
const KTRAIL = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3)), new THREE.LineBasicMaterial({ color: '#dfeaff', transparent: true, opacity: .7, depthWrite: false, blending: THREE.AdditiveBlending })); KTRAIL.frustumCulled = false; KTRAIL.visible = false; scene.add(KTRAIL);
const BAG = group({ parent: scene }); mesh(rbox(.46, .22, .3), toon('#5a3e28'), { p: [0, .11, 0], parent: BAG }); const BAGLID = group({ p: [0, .22, -.15], parent: BAG }); mesh(rbox(.46, .05, .32), toon('#6e4a30'), { p: [0, .02, .16], parent: BAGLID }); BAG.visible = false;
const docTex = (fn, w = 1024, h = 1448) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); fn(x, w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
const CONTRACT_LINE = 'เมื่องานสำเร็จ ให้กำจัดมือสังหารทิ้ง';
const CONTRACT = mesh(new THREE.PlaneGeometry(.42, .594), basic('#ffffff', { map: docTex((x, w, h) => { x.fillStyle = '#f2ecdc'; x.fillRect(0, 0, w, h); x.fillStyle = '#2a2230'; x.textAlign = 'center'; x.font = '700 64px Prompt'; x.fillText('สัญญาจ้างงาน', w / 2, 130);
  x.textAlign = 'left'; x.font = '500 40px Prompt'; ['ผู้ว่าจ้าง : วิกเตอร์', 'เป้าหมาย : นักโทษหมายเลข 047', 'ผู้รับงาน : โนอาห์', 'ค่าตอบแทน : 5,000,000', 'ระยะเวลา : ภายในคืนนี้'].forEach((s, i) => x.fillText(s, 90, 270 + i * 92));
  x.strokeStyle = '#2a2230'; x.lineWidth = 3; for (let i = 0; i < 6; i++) { x.beginPath(); x.moveTo(90, 760 + i * 56); x.lineTo(w - 90, 760 + i * 56); x.stroke(); }
  x.font = '700 38px Prompt'; x.fillText('ลงชื่อ  ________', 90, 1180); x.font = '400 17px Prompt'; x.fillStyle = '#6a6070'; x.fillText(CONTRACT_LINE, 90, 1366); }) }), { parent: scene, cast: false }); CONTRACT.visible = false;
const SEALP = mesh(new THREE.PlaneGeometry(.3, .4), basic('#ffffff', { map: docTex((x, w, h) => { x.fillStyle = '#efe6d2'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(60,40,30,.25)'; x.lineWidth = 2; for (let i = 0; i < 9; i++) { x.beginPath(); x.moveTo(60, 120 + i * 40); x.lineTo(w - 60, 120 + i * 40); x.stroke(); }
  x.save(); x.translate(w / 2, h * .56); x.rotate(-.16); x.strokeStyle = '#8a1c34'; x.fillStyle = '#8a1c34'; x.lineWidth = 12; x.beginPath(); x.arc(0, 0, 230, 0, 7); x.stroke(); x.beginPath(); x.arc(0, 0, 196, 0, 7); x.lineWidth = 5; x.stroke();
  x.beginPath(); x.moveTo(-120, -20); x.quadraticCurveTo(0, -120, 120, -20); x.quadraticCurveTo(0, 70, -120, -20); x.lineWidth = 12; x.stroke(); x.beginPath(); x.arc(0, -22, 40, 0, 7); x.fill(); x.fillStyle = '#efe6d2'; x.beginPath(); x.arc(0, -22, 14, 0, 7); x.fill();
  x.fillStyle = '#8a1c34'; x.beginPath(); x.moveTo(-34, 70); x.lineTo(34, 70); x.lineTo(18, 180); x.lineTo(-18, 180); x.closePath(); x.fill(); x.restore(); }, 768, 1024) }), { parent: scene, cast: false }); SEALP.visible = false;
const POSTER = group({ parent: STREET, p: [-1.55, .18, -9.1] }); mesh(rbox(.1, 2.3, .1), toon('#2a2430'), { p: [-.6, 1.15, 0], parent: POSTER }); mesh(rbox(.1, 2.3, .1), toon('#2a2430'), { p: [.6, 1.15, 0], parent: POSTER });
mesh(new THREE.PlaneGeometry(1.12, 1.52), basic('#ffffff', { map: docTex((x, w, h) => { x.fillStyle = '#e9dcc0'; x.fillRect(0, 0, w, h); x.fillStyle = '#7a1424'; x.fillRect(0, 0, w, 150); x.fillStyle = '#fff'; x.textAlign = 'center'; x.font = '800 100px Prompt'; x.fillText('ค่าหัว', w / 2, 112);
  x.fillStyle = '#14101c'; x.beginPath(); x.arc(w / 2, 480, 190, 0, 7); x.fill(); x.fillStyle = '#16131d'; for (let i = 0; i < 11; i++) { const a = -3.1 + i * .62; x.beginPath(); x.moveTo(w / 2 + Math.cos(a) * 150, 480 + Math.sin(a) * 150); x.lineTo(w / 2 + Math.cos(a + .12) * 250, 480 + Math.sin(a + .12) * 250); x.lineTo(w / 2 + Math.cos(a + .28) * 150, 480 + Math.sin(a + .28) * 150); x.fill(); }
  x.fillStyle = '#f4efe4'; x.beginPath(); x.ellipse(w / 2, 520, 128, 118, 0, 0, 7); x.fill(); x.fillStyle = '#16131d'; x.fillRect(w / 2 - 70, 515, 34, 10); x.fillRect(w / 2 + 36, 515, 34, 10);
  x.fillStyle = '#2a2230'; x.font = '800 84px Prompt'; x.fillText('หมายเลข 047', w / 2, 800); x.fillStyle = '#7a1424'; x.font = '800 120px Prompt'; x.fillText('5,000,000', w / 2, 930); x.font = '600 50px Prompt'; x.fillStyle = '#2a2230'; x.fillText('ใครจับตัวได้ — วิกเตอร์จ่ายเอง', w / 2, 1010); }, 768, 1040) }), { p: [0, 1.62, .06], parent: POSTER, cast: false }); POSTER.visible = false;
const TOWER = group({ parent: STREET, p: [14, 0, -70] }); mesh(new THREE.BoxGeometry(7, 64, 7), toon('#17122a'), { p: [0, 32, 0], parent: TOWER, cast: false }); mesh(new THREE.BoxGeometry(9, 3, 9), toon('#241a3c'), { p: [0, 61, 0], parent: TOWER, cast: false });
const EYEM = mesh(new THREE.PlaneGeometry(9, 5.4), basic('#ffffff', { transparent: true, fog: false, map: docTex((x, w, h) => { x.clearRect(0, 0, w, h); x.shadowColor = '#ff2a3a'; x.shadowBlur = 40; x.fillStyle = '#ff2a3a'; x.beginPath(); x.moveTo(30, h / 2); x.quadraticCurveTo(w / 2, -60, w - 30, h / 2); x.quadraticCurveTo(w / 2, h + 60, 30, h / 2); x.fill(); x.shadowBlur = 0; x.fillStyle = '#ffd8c0'; x.beginPath(); x.arc(w / 2, h / 2, h * .26, 0, 7); x.fill(); x.fillStyle = '#18060a'; x.beginPath(); x.ellipse(w / 2, h / 2, h * .09, h * .24, 0, 0, 7); x.fill(); }, 512, 308) }), { p: [0, 58, 3.6], parent: TOWER, cast: false }); EYEM.renderOrder = 4;
const EYEG = Wd.glowSprite('#ff2a3a', 16, { opacity: .55 }); EYEG.position.set(14, 58, -66); STREET.add(EYEG); TOWER.visible = false; EYEG.visible = false;
const RIPN = 8, RIPS = Array.from({ length: RIPN }, () => { const m = mesh(new THREE.RingGeometry(.9, 1, 28), basic('#cfe0ff', { transparent: true, opacity: 0, depthWrite: false }), { parent: STREET, r: [-90, 0, 0], cast: false }); m.visible = false; m.userData.noInk = true; return m; });
const POLE = mesh(rbox(.28, 2.8, .28), toon('#3a2c24'), { p: [.1, 1.58, -5.9], parent: STREET, cast: false }); POLE.visible = false;   // the post the knife sticks into
function p4reset() { scene.updateMatrixWorld(true); POLE.visible = false; gapG.visible = false; KNIFE.visible = false; KTRAIL.visible = false; BAG.visible = false; CONTRACT.visible = false; SEALP.visible = false; POSTER.visible = false; TOWER.visible = false; EYEG.visible = false; RIPS.forEach(m => { m.visible = false; });
  for (const C of Object.values(CHARS)) setAlpha(C, 1); }
function ripples(set, t, stepRate, zAt, xAt = () => 0) {   // an expanding ring at every heel strike of a walker (soft puddle ripples)
  let i = 0; const k1 = Math.floor(t * 2 * stepRate - .5);
  for (let k = k1; k > k1 - 4; k--) { const ts = (k + .5) / (2 * stepRate), age = t - ts; if (age < 0 || age > .9 || i >= RIPN) continue; const m = RIPS[i++]; if (m.parent !== set) set.add(m); m.visible = true; const s = .12 + age * .75; m.scale.set(s, s, 1); m.position.set(xAt(ts) + (k % 2 ? -.13 : .13), .215, zAt(ts)); m.material.opacity = .55 * (1 - age / .9) ** 1.5; }
}
const kn = (A, B, u) => A.map((v, i) => v + (B[i] - v) * u);
const clearSets = () => { };
// -------------------------------------------------------------------- shots
const SZ4 = (t) => -9 - Math.max(0, t - 4.36) * 1.35;            // Aren walks away along the street in the gossip beat
const HOME = (t) => -2.0 - Math.max(0, t - 27.94) * .94;         // the walk home (27.94 ...), slow and quiet; he stops at 36.5 (z -10)
const hz = (t) => Math.min(HOME(36.5), HOME(t));
const NZ = -15.2;                                                // the invisible hunter's spot, ahead of Aren
// ---- 0 hook: "คืนนี้มีคนรับงานฆ่าผม… และผมมองไม่เห็นเขา" : Aren, a rain gap forming out of focus behind him
S('N01', 0, 'cut', STREET, (lt, t) => { p4reset(); streetLight(lt); MIND = 2.4; put(AR(), STREET, { p: [0, .18, -9.6], ...turn(lt, 2.4, .7, 12, -22), ex: pf(lt, [[0, 'calm'], [2.2, 'suspicious']]).ex, head: [0, 0, 0] });
  gapAt(STREET, 1.5, -13.8, .12 + .5 * U(lt - 2.4, 1.4), t); if (lt < 2.2) camS([-.75, 1.5, -6.7], [0, 1.55, -9.6], [-.5, 1.55, -6.3], [0, 1.58, -9.6], U(lt, 2.2), 40); else camS([.5, 1.55, -8.3], [0, 1.62, -9.6], [.35, 1.58, -8.0], [0, 1.64, -9.6], U(lt - 2.2, 2.2), 34); });
// ---- "หลังจากคืนนั้น … ชื่อของผมเริ่มถูกพูดถึงในหมู่นักโทษ" : prisoners talk, Aren walks away in the distance
S('N02', 4.36, 'blur', STREET, (lt, t) => { p4reset(); streetLight(lt); MIND = 2.6; put(P1(), STREET, { p: [-1.5, .18, -8.2], ry: 50, ...perform(lt, [[0, 'whisper'], [2.5, 'point']], { seed: 3 }) }); put(P2(), STREET, { p: [-.45, .18, -8.4], ry: -40, ...perform(lt, [[0, 'neutral'], [1.2, 'thinking'], [3.8, 'shrug']], { seed: 4 }) });
  put(AR(), STREET, { p: [1.6, .18, SZ4(t)], ry: 180, ex: 'stoic', ...walkAlong(t, (u) => [1.6, SZ4(u)], { stride: .21, LK, s: AR().spec.s, t0: 4.36, id: 'aren' }) }); if (lt < 2.9) camS([1.2, 1.65, -3.6], [-.9, 1.5, -9.6], [.9, 1.65, -4.0], [-1.0, 1.5, -9.8], U(lt, 2.9), 44); else camS([.2, 1.6, -5.9], [-1.0, 1.55, -8.3], [-.1, 1.6, -5.6], [-1.0, 1.58, -8.3], U(lt - 2.9, 2.7), 36); });
// ---- "บางคนบอกว่าผมเป็นนักเจรจา บางคนบอกว่าผมเป็นสายลับ" (typed labels carry the two guesses)
S('N03', 9.96, 'cut', STREET, (lt, t) => { p4reset(); streetLight(lt); MIND = 2.6; put(P1(), STREET, { p: [-.5, .18, -9.6], ry: 70, ...perform(lt, [[0, 'whisper', { ex: 'suspicious' }], [2.3, 'accuse', { ex: 'smug' }]], { seed: 3 }) });
  put(P2(), STREET, { p: [.5, .18, -9.6], ry: -70, ...perform(lt, [[0, 'thinking'], [2.3, 'handsBehind', { ex: 'skeptical' }]], { seed: 4 }) }); camS([-.2, 1.55, -4.6], [0, 1.6, -9.6], [.1, 1.55, -4.3], [0, 1.6, -9.6], U(lt, 4.7), 46); });
// ---- "แต่สำหรับวิกเตอร์… ผมคือคนที่อันตรายเกินกว่าจะปล่อยไว้" : Victor on his dais
S('N04', 14.68, 'blur', WAREHOUSE, (lt, t) => { p4reset(); whLight(); MIND = 2.4; put(VI(), WAREHOUSE, { p: [0, .4, -8.4], ry: 0, ...perform(lt, [[0, 'armsCrossed', { ex: 'stoic' }], [1.9, 'fists', { ex: 'glare' }]], { seed: 5 }), talk: 0 });
  camW([1.2, 1.9, -4.5], [0, 2.0, -8.4], [.7, 1.9, -4.9], [0, 2.1, -8.4], U(lt, 4.2), 42); wEnd(t, 0); }, { rain: false });
// ---- "เขาตั้งค่าหัวผม และคนที่รับงาน คือโนอาห์" : the bounty poster (power-red price), then Noah's name
S('N05', 18.92, 'cut', STREET, (lt, t) => { p4reset(); streetLight(lt); MIND = 0; POSTER.visible = true; lightAt(STREET.localToWorld(V(-1.0, 2.6, -7.6)), '#ffd8b0', 3.2, 4);
  camS([-.6, 1.72, -6.4], [-1.55, 1.78, -9.1], [-1.1, 1.74, -6.0], [-1.55, 1.78, -9.1], U(lt, 2.6), 40); });
// ---- "มือสังหารที่ล่องหนได้" : on the rooftop a rain-shaped figure stands at the parapet looking down on the street
S('N06', 21.3, 'blur', ROOF, (lt, t) => { p4reset(); alleyLight(); setRig(RIGS.alley); MIND = 2.6; gapAt(ZC.ROOF, 0, -6.2, .35 + .65 * U(lt, 1.4), t); lightAt(ZC.ROOF.localToWorld(V(2.2, 1.9, -4.8)), '#ff2a3a', 1.1, 2.4);
  camR([1.6, 1.5, -2.6], [0, 1.55, -6.2], [1.0, 1.55, -3.2], [0, 1.65, -6.2], U(lt, 3.7), 42); });
// ---- "ไม่เคยมีใครเห็นหน้าเขา แล้วรอดกลับมา" : a dropped hat on the wet street; rain parts as something steps over it
S('N07', 24.98, 'cut', STREET, (lt, t) => { p4reset(); streetLight(lt); MIND = 0; mesh(new THREE.CylinderGeometry(.16, .2, .1, 18), toon('#3a3a44'), { p: [0, .24, -9], parent: STREET, cast: false }); gapAt(STREET, .15 + .5 * U(lt, 1.6, eIO), -10.4, .85, t);
  camS([.3, .7, -6.2], [0, .6, -9.4], [.15, .75, -6.0], [0, .75, -9.8], U(lt, 3.0), 38); });
// ---- "คืนนั้น ผมเดินกลับที่พักตามปกติ" : Aren walks home (place label)
S('N08', 27.94, 'blur', STREET, (lt, t) => { p4reset(); streetLight(lt); MIND = 2.6; put(AR(), STREET, { p: [0, .18, hz(t)], ry: 180, ex: 'calm', ...walkAlong(t, (u) => [0, hz(u)], { stride: .21, LK, s: AR().spec.s, t0: 27.94, id: 'aren' }) }); camS([1.5, 1.75, hz(t) + 3.8], [0, 1.55, hz(t) - 1.0], [1.35, 1.75, hz(t) + 3.5], [0, 1.58, hz(t) - 1.0], U(lt, 2.8), 44); });
// ---- "ไม่มีเสียงฝีเท้า ไม่มีเงา" : low shot, ripples under Aren's steps, none behind him
S('N09', 30.78, 'cut', STREET, (lt, t) => { p4reset(); streetLight(lt); MIND = 0; put(AR(), STREET, { p: [0, .18, hz(t)], ry: 180, ex: 'calm', ...walkAlong(t, (u) => [0, hz(u)], { stride: .21, LK, s: AR().spec.s, t0: 27.94, id: 'aren' }) }); ripples(STREET, t, .95, (ts) => hz(ts));
  camS([.9, .55, hz(t) + 2.4], [0, .35, hz(t) - 1.2], [.7, .5, hz(t) + 2.2], [0, .45, hz(t) - 1.2], U(lt, 2.6), 36); });
// ---- "แต่สายฝนตรงหน้า แหวกออกเป็นรูปคน" : the rain ahead of him parts into a human shape
S('N10', 33.36, 'cut', STREET, (lt, t) => { p4reset(); streetLight(lt); MIND = 2.6; put(AR(), STREET, { p: [0, .18, hz(t)], ry: 180, ex: 'suspicious', ...walkAlong(t, (u) => [0, hz(u)], { stride: .21, LK, s: AR().spec.s, t0: 27.94, id: 'aren' }) }); gapAt(STREET, .05, NZ, U(lt - .3, 2.0, eIO), t);
  camS([1.3, 1.6, hz(t) + 3.2], [.1, 1.55, NZ + 2], [1.1, 1.55, hz(t) + 3.0], [.05, 1.6, NZ + 1], U(lt, 3.2), 40); });
// ---- "ผมหยุดเดิน" : he freezes (only the camera moves)
S('N11', 36.5, 'cut', STREET, (lt, t) => { p4reset(); streetLight(lt); MIND = 2.4; put(AR(), STREET, { p: [0, .18, HOME(36.5)], ry: 180, ...perform(lt, [[0, 'frozen']], { seed: 1 }), ex: 'realize', still: true }); gapAt(STREET, .05, NZ, 1, t);
  camS([.7, 1.65, HOME(36.5) + 2.6], [0, 1.6, HOME(36.5)], [.45, 1.65, HOME(36.5) + 2.3], [0, 1.6, HOME(36.5)], U(lt, 1.3), 38); });
// ---- "เสี้ยววินาทีต่อมา มีดเล่มหนึ่ง" : the knife leaves the gap (trail)
const KA = [.1, 1.55, NZ], KB = [-.1, 1.52, HOME(36.5) - .15];
S('N12', 37.76, 'cut', STREET, (lt, t) => { p4reset(); POLE.visible = true; streetLight(lt); MIND = 2.4; put(AR(), STREET, { p: [0, .18, HOME(36.5)], ry: 180, ex: 'stoic', ...perform(lt, [[0, 'frozen']], { seed: 1 }), still: true }); gapAt(STREET, .05, NZ, 1, t);
  const u = clamp((lt - .55) / 1.6); KNIFE.visible = u > 0; if (u > 0) { const q = kn(KA, KB, Math.pow(u, 1.35)); KNIFE.position.copy(STREET.localToWorld(V(...q))); KNIFE.lookAt(STREET.localToWorld(V(...KB))); KNIFE.rotateZ(u * 40);
    const tl = STREET.localToWorld(V(...kn(KA, KB, Math.max(0, eIn(u) - .1)))); const ar = KTRAIL.geometry.attributes.position; ar.set([tl.x, tl.y, tl.z, KNIFE.position.x, KNIFE.position.y, KNIFE.position.z]); ar.needsUpdate = true; KTRAIL.visible = true; }
  camS([-1.0, 1.55, HOME(36.5) - 3.2], [0, 1.55, NZ + 2], [-.8, 1.55, HOME(36.5) - 3.0], [0, 1.52, HOME(36.5) + .8], U(lt, 2.2), 40); });
// ---- "พุ่งผ่านตรงที่คอผมเคยอยู่" : he leans his head aside (anticipation 3 f), the knife passes where his neck was and sticks in the wall behind
const KW = [.1, 1.5, -5.9 - .14];
S('N13', 39.94, 'cut', STREET, (lt, t) => { p4reset(); POLE.visible = true; streetLight(lt); MIND = 0; const lean = backOut(clamp((lt - 1.05) / .3));
  put(AR(), STREET, { p: [0, .18, HOME(36.5)], ry: 150, ex: 'stoic', head: [0, 0, -16 * lean], side: -7 * lean, still: true }); const u = clamp((lt - .3) / 1.15);
  KNIFE.visible = true; const q = kn([0, 1.52, HOME(36.5) - 1.6], KW, Math.pow(u, 1.3)); KNIFE.position.copy(STREET.localToWorld(V(...q))); KNIFE.lookAt(STREET.localToWorld(V(...KW))); KNIFE.rotateZ(1.4 + (u >= 1 ? Math.sin((lt - 1.45) * 40) * .08 * Math.exp(-(lt - 1.45) * 5) : u * 12));
  if (u > 0 && u < 1) { const tl = STREET.localToWorld(V(...kn([0, 1.52, HOME(36.5) - 1.6], KW, Math.max(0, Math.pow(u, 1.3) - .22)))); const ar = KTRAIL.geometry.attributes.position; ar.set([tl.x, tl.y, tl.z, KNIFE.position.x, KNIFE.position.y, KNIFE.position.z]); ar.needsUpdate = true; KTRAIL.visible = true; }
  if (lt > 1.45 && lt < 2.2) dustAt(STREET.localToWorld(V(...KW)), (lt - 1.45) / .75, .9);
  { const cz = -10.6 + 4.0 * clamp((lt - .1) / 1.5, 0, 1) * clamp((lt - .1) / 1.5, 0, 1) * (3 - 2 * clamp((lt - .1) / 1.5, 0, 1)) + .0; camS([2.7, 1.55, cz - .3], [0, 1.52, cz + .5], [2.7, 1.55, cz - .3], [0, 1.52, cz + .5], 0, 38); } });
// ---- "ผมไม่ได้ตกใจ เพราะผมรู้ว่าเขาต้องมา" : Aren calm, a blink (the knife stays in the wall)
S('N14', 42.28, 'cut', STREET, (lt, t) => { p4reset(); streetLight(lt); MIND = 2.2; put(AR(), STREET, { p: [0, .18, HOME(36.5)], ry: 20, ...exShift(lt, 1.7, 'calm', 'sly'), head: [0, 0, 0] }); gapAt(STREET, .05, NZ, 1, t);
  camS([.6, 1.55, HOME(36.5) + 2.5], [0, 1.58, HOME(36.5)], [.35, 1.58, HOME(36.5) + 2.1], [0, 1.6, HOME(36.5)], U(lt, 3.2), 38); });
// ---- "ถ้าคุณฆ่าผมตอนนี้ คุณจะไม่ได้เงินรางวัล" : he speaks to the dark (Aren faces the gap)
S('N15', 45.64, 'cut', STREET, (lt, t) => { p4reset(); streetLight(lt); MIND = 2.4; put(AR(), STREET, { p: [0, .18, HOME(36.5)], ry: 175, ex: 'calm', talk: talkAt(t) }); gapAt(STREET, .05, NZ, 1, t);
  camS([1.2, 1.6, HOME(36.5) + 2.8], [0, 1.58, HOME(36.5) - 1.8], [.9, 1.6, HOME(36.5) + 2.6], [0, 1.6, HOME(36.5) - 2.4], U(lt, 3.0), 42); });
// ---- "เสียงหนึ่งดังจากความมืด" : the dark end of the street, the rain-shaped figure and two cold glints
S('N16', 49.0, 'cut', STREET, (lt, t) => { p4reset(); streetLight(lt); MIND = 2.6; gapAt(STREET, .05, NZ, 1, t); lightAt(STREET.localToWorld(V(.05, 1.7, NZ + .6)), '#9fb0ff', .5, 2.2);
  camS([-.5, 1.45, NZ + 5.2], [.05, 1.6, NZ], [-.3, 1.5, NZ + 4.4], [.05, 1.62, NZ], U(lt, 2.9), 40); });
// ---- "ผมส่งความคิดเข้าไปหนึ่งประโยค" : the POWER: Aren's face, red rim, the world drains (mono), the whisper line + text go to the hunter's head
S('N17', 51.9, 'cut', STREET, (lt, t) => { p4reset(); streetLight(lt); MIND = 2.2; const k = U(lt - .1, 1.0); mono(k); put(AR(), STREET, { p: [0, .18, HOME(36.5)], ry: 160, ex: 'focused', ...(lt > .8 ? { head: [-3, 0, 0] } : {}), still: true }); gapAt(STREET, .05, NZ, 1, t);
  scribbleAt(AR(), (lt - 1.0) / .5, .14); camS([.5, 1.6, HOME(36.5) + 2.0], [0, 1.62, HOME(36.5)], [.3, 1.62, HOME(36.5) + 1.7], [0, 1.64, HOME(36.5)], U(lt, 1.8), 34); });
S('N18', 54.12, 'cut', STREET, (lt, t) => { p4reset(); streetLight(lt); MIND = 2.4; mono(1); put(AR(), STREET, { p: [0, .18, HOME(36.5)], ry: 175, ex: 'focused', still: true }); gapAt(STREET, .05, NZ, 1, t);
  whisperAt(headW(AR(), .38), gapPoint(STREET, .05, NZ, 1.78), 'ลองเปิดดูสัญญาในกระเป๋า… อ่านให้จบทุกบรรทัด', clamp((lt - .05) / 3.2), t, { fs: 52, dy: 240 });
  camS([1.0, 1.55, HOME(36.5) + 1.8], [0, 1.6, HOME(36.5) - 2.2], [.8, 1.58, HOME(36.5) + 1.5], [0, 1.64, NZ + 3], U(lt, 3.7), 42); });
// ---- "โนอาห์ปรากฏตัวขึ้นช้า ๆ" : Noah fades in out of the rain (the gap fills with him)
S('N19', 57.82, 'cut', STREET, (lt, t) => { p4reset(); streetLight(lt); MIND = 2.4; const a = U(lt, 1.6, eIO); put(NO(), STREET, { p: [.05, .18, NZ], ry: 0, ex: 'stoic', ...perform(lt, [[0, 'handsBehind']], { seed: 9 }) }); setAlpha(NO(), a); gapAt(STREET, .05, NZ, 1 - a, t);
  camS([.9, 1.55, NZ + 3.4], [.05, 1.5, NZ], [.5, 1.52, NZ + 2.8], [.05, 1.5, NZ], U(lt, 2.2), 40); });
// ---- "เขาก้มลงเปิดกระเป๋าโดยไม่รู้ตัว" : Noah crouches over the bag and opens it (sprite stays 2D: lean + crouch)
S('N20', 59.98, 'cut', STREET, (lt, t) => { p4reset(); streetLight(lt); MIND = 2.0; const d = U(lt - .15, 1.2, eIO); put(NO(), STREET, { p: [.05, .18, NZ], ry: 0, ex: pf(lt, [[0, 'stoic'], [1.0, 'dazed']]).ex, lean: 18 * d, hipY: -.1 * d, head: [14 * d, 0, 0], hR: lp([.3, .26, .07], [.18, .12, .5], d), hL: lp([-.3, .26, .07], [-.16, .12, .5], d) });
  BAG.visible = true; BAG.position.copy(STREET.localToWorld(V(.05, .18, NZ + .55))); BAGLID.rotation.x = -1.7 * U(lt - 1.0, .7); camS([.5, 1.2, NZ + 2.4], [.05, 1.0, NZ + .3], [.3, 1.1, NZ + 2.0], [.05, .95, NZ + .3], U(lt, 2.3), 38); });
// ---- "ในสัญญาจ้างฆ่าผม" : the contract (insert)
S('N21', 62.62, 'cut', STREET, (lt, t) => { p4reset(); streetLight(lt); MIND = 0; CONTRACT.visible = true; CONTRACT.position.copy(STREET.localToWorld(V(0, 1.4, -6.6))); CONTRACT.quaternion.copy(camera.quaternion); lightAt(STREET.localToWorld(V(.3, 2.2, -5.6)), '#fff0d8', 2.4, 3);
  camS([0, 1.4, -5.9], [0, 1.4, -6.6], [.01, 1.42, -6.15], [0, 1.4, -6.6], U(lt, 1.5), 40); CONTRACT.quaternion.copy(camera.quaternion); });
// ---- "มีบรรทัดสุดท้ายที่ตัวเล็กมาก" : push down to the tiny last line (red ring = power)
S('N22', 64.22, 'cut', STREET, (lt, t) => { p4reset(); streetLight(lt); MIND = 0; CONTRACT.visible = true; CONTRACT.position.copy(STREET.localToWorld(V(0, 1.4, -6.6))); lightAt(STREET.localToWorld(V(.3, 2.2, -5.6)), '#fff0d8', 2.4, 3);
  const u = U(lt, 1.6, eIO); camS([0, 1.4, -6.1], [0, 1.4, -6.6], [0, 1.2, -6.37], [0, 1.148, -6.6], u, 34 - 8 * u); CONTRACT.quaternion.copy(camera.quaternion); });
// ---- "เมื่องานสำเร็จ ให้กำจัดมือสังหารทิ้ง" : the line, big, then Noah's reaction
S('N23', 66.5, 'cut', STREET, (lt, t) => { p4reset(); streetLight(lt); MIND = 0; const show = lt < 1.9; CONTRACT.visible = show; CONTRACT.position.copy(STREET.localToWorld(V(0, 1.4, -6.6))); lightAt(STREET.localToWorld(V(.3, 2.2, -5.6)), '#fff0d8', 2.4, 3);
  if (show) { camS([0, 1.17, -6.34], [0, 1.148, -6.6], [0, 1.16, -6.3], [0, 1.148, -6.6], U(lt, 1.9), 26); CONTRACT.quaternion.copy(camera.quaternion); }
  else { MIND = 2.0; put(NO(), STREET, { p: [.05, .18, NZ], ry: 0, ...perform(lt - 1.9, [[0, 'stoic'], [.35, 'gasp', { ex: 'terror' }]], { seed: 9 }) }); camS([.4, 1.55, NZ + 2.6], [.05, 1.62, NZ], [.2, 1.58, NZ + 2.2], [.05, 1.64, NZ], U(lt - 1.9, 1.0), 34); } });
// ---- "ผมไม่ได้เขียนมัน" / "ผมแค่ทำให้เขาอยากอ่านให้จบ" : Aren, deadpan then sly
S('N24', 69.76, 'cut', STREET, (lt, t) => { p4reset(); streetLight(lt); MIND = 2.2; mono(.6); put(AR(), STREET, { p: [0, .18, HOME(36.5)], ry: 10, ex: 'stoic', head: [0, 0, 0] }); camS([.5, 1.58, HOME(36.5) + 2.4], [0, 1.6, HOME(36.5)], [.3, 1.6, HOME(36.5) + 2.1], [0, 1.62, HOME(36.5)], U(lt, 1.4), 36); });
S('N25', 71.06, 'cut', STREET, (lt, t) => { p4reset(); streetLight(lt); MIND = 2.2; mono(.6); put(AR(), STREET, { p: [0, .18, HOME(36.5)], ry: -12, ...exShift(lt, .5, 'stoic', 'sly') }); camS([-.5, 1.58, HOME(36.5) + 2.4], [0, 1.6, HOME(36.5)], [-.3, 1.6, HOME(36.5) + 2.0], [0, 1.62, HOME(36.5)], U(lt, 1.7), 36); });
// ---- "ผมไม่ได้ต้องการลูกน้อง / ผมต้องการแค่คนที่ไม่คิดจะฆ่าผม" : both men in frame, then Aren close (talking)
S('N26', 73.02, 'cut', STREET, (lt, t) => { p4reset(); streetLight(lt); MIND = 2.6; setRig(RIGS.street); put(AR(), STREET, { p: [-.7, .18, -10.4], ry: 25, ex: 'calm', talk: talkAt(t) }); put(NO(), STREET, { p: [.9, .18, -11.2], ry: -30, ex: 'dazed' });
  camS([0, 1.6, -6.2], [.1, 1.58, -10.8], [.1, 1.6, -6.7], [.1, 1.6, -10.8], U(lt, 1.7), 46); });
S('N27', 74.62, 'cut', STREET, (lt, t) => { p4reset(); streetLight(lt); MIND = 2.2; put(AR(), STREET, { p: [-.7, .18, -10.4], ry: 20, ex: 'sly', talk: talkAt(t) }); put(NO(), STREET, { p: [.9, .18, -11.2], ry: -30, ex: 'dazed' });
  camS([-1.4, 1.55, -8.0], [-.7, 1.6, -10.4], [-1.2, 1.57, -8.3], [-.7, 1.62, -10.4], U(lt, 2.3), 38); });
// ---- "โนอาห์ไม่ตอบ แล้วหายไปในสายฝน" : he fades out, the rain closes over where he stood
S('N28', 77.34, 'blur', STREET, (lt, t) => { p4reset(); streetLight(lt); MIND = 2.4; const a = 1 - U(lt - .9, 1.5, eIO); put(NO(), STREET, { p: [.9, .18, -11.2], ry: -20, ex: 'stoic' }); setAlpha(NO(), a); gapAt(STREET, .9, -11.2, (1 - a) * .9, t);
  camS([.2, 1.6, -7.6], [.9, 1.6, -11.2], [.4, 1.6, -7.9], [.9, 1.6, -11.2], U(lt, 3.0), 42); });
// ---- "แต่ก่อนหายไป เขาทำกระดาษหล่นไว้หนึ่งแผ่น" : the paper falls (flyPath-like drift) into the puddle
S('N29', 80.24, 'cut', STREET, (lt, t) => { p4reset(); streetLight(lt); MIND = 0; SEALP.visible = true; const u = clamp(lt / 1.7), y = 2.2 - 2.0 * eIn(u) + .02 * Math.sin(lt * 6) * (1 - u), x = .9 + .45 * Math.sin(u * 3.2) * (1 - u * .4);
  SEALP.position.copy(STREET.localToWorld(V(x, Math.max(.22, y), -11.0))); SEALP.rotation.set(-1.1 * u - .2, .5 * Math.sin(u * 4), .5 * Math.sin(u * 5) * (1 - u)); gapAt(STREET, .9, -11.2, Math.max(0, .35 - lt * .12), t);
  camS([.2, 1.4, -8.0], [.9, 1.2, -11.0], [.5, .9, -8.3], [.9, .45, -11.0], U(lt, 2.6), 38); });
// ---- "ตราประทับบนนั้นไม่ใช่ของวิกเตอร์" : the seal close-up (red eye over a tower)
S('N30', 83.48, 'cut', STREET, (lt, t) => { p4reset(); streetLight(lt); MIND = 0; SEALP.visible = true; SEALP.position.copy(STREET.localToWorld(V(.9, 1.2, -9.4))); lightAt(STREET.localToWorld(V(1.1, 2.0, -8.4)), '#fff0d8', 2.2, 3);
  camS([.9, 1.2, -8.6], [.9, 1.2, -9.4], [.9, 1.2, -8.85], [.9, 1.2, -9.4], U(lt, 2.6), 36); SEALP.quaternion.copy(camera.quaternion); });
// ---- "มันคือรูปดวงตา บนยอดหอคอย" : tilt up from the paper to the real tower
S('N31', 86.1, 'cut', STREET, (lt, t) => { p4reset(); streetLight(lt); MIND = 0; TOWER.visible = true; EYEG.visible = true; EYEM.quaternion.identity(); const u = U(lt, 2.4, eIO); put(AR(), STREET, { p: [-.7, .18, -9.4], ry: 200, ex: 'realize' });
  camS([-.7, 1.4, -6.4], [lp([-.7, 1.4, -9.4], [14, 56, -68], u)[0], lp([-.7, 1.4, -9.4], [14, 56, -68], u)[1], lp([-.7, 1.4, -9.4], [14, 56, -68], u)[2]], [-.7, 1.5, -6.2], [14, 56, -68], u, 52); });
// ---- "แปลว่าโนอาห์มีนายจ้างอีกคน" : Aren looks up, the eye glows behind him
S('N32', 88.88, 'cut', STREET, (lt, t) => { p4reset(); streetLight(lt); MIND = 2.4; TOWER.visible = true; EYEG.visible = true; put(AR(), STREET, { p: [-.4, .18, -9.4], ry: 160, ...exShift(lt, .8, 'realize', 'focused'), head: [-12, 0, 0] });
  camS([.4, 1.2, -6.6], [-.4, 2.2, -10.2], [.2, 1.3, -6.4], [-.1, 2.6, -11], U(lt, 2.9), 48); });
// ---- "และคนคนนั้น กำลังเฝ้าดูผมอยู่" : the eye, close; the end card dims the frame
S('N33', 91.68, 'cut', STREET, (lt, t) => { p4reset(); streetLight(lt); MIND = 0; TOWER.visible = true; EYEG.visible = true; EYEG.material.opacity = .5 + .1 * Math.sin(t * 3); EYEM.scale.setScalar(1 + .015 * Math.sin(t * 2.4));
  camS([13, 40, -50], [14, 55, -68], [13.5, 46, -58], [14, 58, -66], U(lt, 4.8, eIO), 34); });

export function initShots(timing) { TM.env = timing.env; TM.vis = timing.vis; for (let i = 0; i < SHOTS.length; i++) SHOTS[i].t1 = i + 1 < SHOTS.length ? SHOTS[i + 1].t0 : timing.end; }
export function runShot(sh, t) { reset(t); sh.fn(t - sh.t0, t); }
export const WHITEK = { k: 0 };
export const COVER = { id: 'COVER', t0: 0, fn: (lt, t, o = {}) => { reset(30); p4reset(); STREET.visible = true; ZC.zcAt(30, camera); ZC.streetAt(30); streetLight(0); TOWER.visible = true; EYEG.visible = true;
  put(AR(), STREET, { p: [-.2, .18, -9.6], ry: 12, ex: 'sinister' }); gapAt(STREET, 1.15, -12.8, 1, 30); MIND = 0; const cm = o.cam || [.5, 1.5, -6.4], g = o.tgt || [.25, 1.6, -10.2]; camS(cm, g, cm, g, 0, o.fov || 40); rainAt(30, .5); } };
export const BENCH = { id: 'BENCH', t0: 0, fn: (lt, t, o = {}) => { reset(0); if (o.roof) { ZC.ROOF.visible = true; ZC.roofAt(3); alleyLight(); setRig(RIGS.alley); put(GM(), ZC.ROOF, { p: [0, 0, -6.2], ry: 180, ex: 'evil' }); const c = o.cam, g = o.tgt; look(V(...c).add(ZC.ROOF.position), V(...g).add(ZC.ROOF.position), o.fov || 50); ZC.zcLate(3, camera); return; } STREET.visible = true; streetLight(0); if (o.rig) setRig({ ...RIGS.street, ...o.rig }); const ids = ['aren', 'guard', 'fire', 'strong', 'thug1', 'thug2', 'thug3', 'gunman'];
  if (o.act) { const L = o.act, n = L.length, sp = o.sp ?? .85; ids.forEach((id) => put(CHARS[id], STREET, { p: [0, -50, -30], visible: false }));
    L.forEach((a, i) => { const id = o.who ? o.who[i % o.who.length] : ids[i % ids.length]; const pz = o.beats ? perform(o.lt, o.beats, { seed: i }) : typeof a === 'string' && POSES[a] && !o.faceOnly ? perform(5, [[0, a]], { seed: i, still: true }) : a.includes('|') ? { ex: a.split('|')[0], talk: a.split('|')[1] } : { ex: a };
      put(CHARS[id], STREET, { p: [(i - (n - 1) / 2) * sp, .18, -9], ry: o.ry ?? 0, ...pz, blink: false, still: true }); });
    const bc = o.cam || [0, 1.4, -2.6], bt = o.tgt || [0, 1.1, -9]; camS(bc, bt, bc, bt, 0, o.fov || 44); return; }
  ids.forEach((id, i) => put(CHARS[id], STREET, { p: [(i - 3.5) * .85, .18, -9], ry: o.ry ?? 0, ex: ['sly', 'angry', 'grinTeeth', 'confident', 'evil', 'sneaky', 'frown', 'calm'][i] }));
  const bc = o.cam || [0, 1.4, -2.6], bt = o.tgt || [0, 1.1, -9]; camS(bc, bt, bc, bt, 0, o.fov || 44); } };
