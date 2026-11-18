// shots.js: "สะพานสองหมู่บ้าน" (58.68 s timeline incl. the 0.9 s beat at 41.47)
import { THREE, scene, camera, clamp, lerp, sstep, eIO, eOut, eIn, eSine, D2R, noise1, rng, POST, mesh, rbox, toon, group } from './engine.js';
import * as Wd from './world.js';
import { CHARS, pose, toTorso, blinkAt, talkQ } from './chars.js';
const { VL, VA, DY, desk, DK, boat, BT } = Wd;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const TM = { env: [] };
const talkAt = (t) => talkQ(TM.env, t); // v4: held 3 frames, no 1-frame mouth flicker
let SH = { a: 0, t: 0 };
function look(pos, tgt, fov = 40, roll = 0) { POST.focus = pos.distanceTo(tgt); camera.position.copy(pos); camera.fov = fov; camera.updateProjectionMatrix(); camera.up.set(0, 1, 0); if (Math.abs(pos.x - tgt.x) + Math.abs(pos.z - tgt.z) < .05) camera.up.set(0, 0, -1); camera.lookAt(tgt); if (roll) camera.rotateZ(roll * D2R);
  if (SH.a > 0) { const t = SH.t * 22; camera.rotateX(noise1(t) * .02 * SH.a); camera.rotateY(noise1(t + 50) * .02 * SH.a); camera.position.y += noise1(t + 9) * .08 * SH.a; } }
const lp = (a, b, u) => a.map((v, i) => lerp(v, b[i], u));
const TY = (p, g) => p[1] < 4 ? [g[0], g[1] - .16, g[2]] : g; // v2: short figures, keep heads above the caption band
function camW(p0, t0, p1, t1, u, fov = 40, roll = 0) { look(V(...lp(p0, p1, u)), V(...lp(TY(p0, t0), TY(p1, t1), u)), fov, roll); }
const camO = (o) => (p0, t0, p1, t1, u, fov = 40, roll = 0) => look(V(...lp(p0, p1, u)).add(o.position), V(...lp(t0, t1, u)).add(o.position), fov, roll);
const camD = camO(desk);
function put(C, parent, P) { if (C.g.parent !== parent) parent.add(C.g); pose(C, P); }
const orb = (c, r, a, h) => [c[0] + Math.sin(a * D2R) * r, c[1] + h, c[2] + Math.cos(a * D2R) * r];
function dof(k) { POST.dof = k; }
const U = (lt, d, e = eIO) => e(clamp(lt / d));
function moonAt(dx, dy) { const d = V(); camera.getWorldDirection(d); const r = V().crossVectors(d, V(0, 1, 0)).normalize(); Wd.skyState.moonDir.copy(d).addScaledVector(r, dx).add(V(0, dy, 0)).normalize(); }
const HIDE = V(0, -50, 0);
function reset(t) {
  SH.a = 0; SH.t = t; if (benchFloor) benchFloor.visible = false;
  Object.values(CHARS).forEach(C => { C.g.visible = false; });
  VL.visible = true; desk.visible = false; boat.visible = false; Wd.sea.visible = true; Wd.WAVE.amp = .22; Wd.gullsAt(t, [0, 19, 0], 0);
  Wd.bridgeAt(0, 0); Wd.valleyNight(0); Wd.flagsAt(t); Wd.crowd([]); VA.toll.visible = false; VA.spark.material.opacity = 0; Wd.drawSign('ปีที่ไม่มีสะพาน', 50); Wd.lanternOn(VA.lamp, 0);
  for (const o of [VA.bagR, VA.bagB, VA.ham[0], VA.ham[1], VA.lamp, VA.coin, VA.plank[0], VA.plank[1]]) { o.position.copy(HIDE); o.rotation.set(0, 0, 0); } VA.coin.rotation.x = Math.PI / 2;
}
// light helpers
const _ca = new THREE.Color(), _cb = new THREE.Color();
function mixP(a, b, k) { const A = Wd.PRESETS[a], B = Wd.PRESETS[b], o = {}; for (const key in A) { const x = A[key], y = B[key]; if (typeof x === 'number') o[key] = lerp(x, y, k); else if (Array.isArray(x)) o[key] = x.map((v, i) => lerp(v, y[i], k)); else o[key] = '#' + _ca.set(x).lerp(_cb.set(y), k).getHexString(); } return o; }
function day(o = {}, f = [0, 1.3, 0, 14]) { Wd.applyLight('day', o); Wd.setShadowFocus(...f); }
function night(o = {}, f = [0, 1.3, 0, 14]) { Wd.applyLight('night', { hemiI: 2.0, sunI: 1.7, ...o }); Wd.valleyNight(1); Wd.setShadowFocus(...f); }
function lampAt(C, k = 1, h = [.36, .3, .34]) { scene.updateMatrixWorld(); const w = C.torso.localToWorld(V(h[0], h[1] - .42, h[2])); VA.lamp.position.copy(w); Wd.lanternOn(VA.lamp, k); Wd.pts[0].position.copy(w).add(V(0, .9, 1.3)); Wd.pts[0].intensity = 1.0 * k * (1 + .06 * Math.sin(SH.t * 17)); Wd.pts[0].color.set('#ffb35a'); }
function propAt(o, C, h, rot) { scene.updateMatrixWorld(); o.position.copy(C.torso.localToWorld(V(...h))); if (rot) o.rotation.set(...rot); }
// crowds
const R = rng(31), BANK = [], DECK = [];
for (let i = 0; i < 70; i++) { const s = i % 2 ? 1 : -1; BANK.push([s * (6.5 + R() * 4.2), 1, (R() < .5 ? -1 : 1) * (1.5 + R() * 5.5), s, R() * 6, .1]); }
for (let i = 0; i < 44; i++) { const s = i % 2 ? 1 : -1; DECK.push([s * (.5 + R() * 5.2), DY, -.8 + R() * 1.6, s, R() * 6, .1]); }
const deckCrowd = (k, n = 44) => DECK.slice(0, n).filter(c => 6 - Math.abs(c[0]) <= k * 6 - .5);
// ---------- common character poses ----------
const hip = { hL: [-.3, .36, .12], hR: [.3, .36, .12], pL: [-1, 0, -.5], pR: [1, 0, -.5] };
const up2 = { hL: [-.42, 1.02, .3], hR: [.42, 1.02, .3], pL: [-1, -.2, .2], pR: [1, -.2, .2] };
const pointR = { hR: [.22, .78, .78], pR: [1, -.6, 0] }, pointL = { hL: [-.22, .78, .78], pL: [-1, -.6, 0] };
const cross = { hL: [.12, .5, .3], hR: [-.12, .5, .3], pL: [-1, -.3, 0], pR: [1, -.3, 0] };
const C_ = () => CHARS;
// =====================================================================
export const SHOTS = [];
const S = (id, t0, tr, fn, o = {}) => SHOTS.push({ id, t0, tr, fn, ...o });
// --- HOOK ---
// B01 the carpenter alone on the finished bridge, sly ("ช่างไม้คนหนึ่ง หลอก")
S('B01', 0, 'cut', (lt, t) => {
  day(); Wd.bridgeAt(1, 1); Wd.gullsAt(t, [0, 16, -10], 1); const c = CHARS.carp;
  put(c, VL, { p: [0, DY, 0], ry: 0, ex: lt > .9 ? 'sly' : 'happy', blink: blinkAt(t, 1), ...hip, head: [0, 0, lt > .9 ? 5 : 0] });
  const u = U(lt, 1.9, eOut); camW([0, DY + .8, 11], [0, DY + 1.2, 0], [0, DY + 1.3, 4.3], [0, DY + 1.12, 0], u, 42, lerp(-5, 0, u)); dof(.25);
});
// B02 the two chiefs nose to nose ("สองหมู่บ้านที่เกลียดกัน")
function faceOff(t, ex = ['frown', 'frown'], o = {}) { const r = CHARS.redc, b = CHARS.bluec, j = .03 * Math.sin(t * 20);
  put(r, VL, { p: [-.72, DY, 0], ry: 90, lean: 10, ex: ex[0], blink: blinkAt(t, 2), hR: [.22, .8 + j, .7], pR: [1, -.6, 0], hL: [-.3, .36, .12], ...(o.r || {}) });
  put(b, VL, { p: [.72, DY, 0], ry: -90, lean: 10, ex: ex[1], blink: blinkAt(t, 3), hL: [-.22, .8 - j, .7], pL: [-1, -.6, 0], hR: [.3, .36, .12], ...(o.b || {}) }); }
S('B02', 1.86, 'whip', (lt, t) => {
  day(); Wd.bridgeAt(1, 1); faceOff(t, ['frown', 'determined']);
  const u = U(lt, 1.7, eOut); camW([1.4, DY + 1.5, 6.6], [0, DY + 1.1, 0], [0, DY + 1.25, 5.0], [0, DY + 1.1, 0], u, 40); dof(.3);
});
// B03 crane up: the whole bridge and both villages ("ให้ช่วยกันสร้างสะพาน โดยไม่มีใครรู้ตัว")
S('B03', 3.4, 'cut', (lt, t) => {
  day({}, [0, 1.3, 0, 30]); Wd.bridgeAt(1, 1); faceOff(t, ['frown', 'determined']); const c = CHARS.carp; put(c, VL, { p: [0, DY, 1.0], ry: 0, ex: 'sly', blink: blinkAt(t, 1), ...hip });
  Wd.crowd(BANK.slice(0, 50), t);
  const u = U(lt, 2.6, eIO); camW([0, DY + 1.6, 6.5], [0, DY + 1, 0], [0, 27, 31], [0, 1, -3], u, 42); dof(.2 * (1 - u));
});
// --- SETUP ---
// B04 low flight down the river, red houses left, blue houses right
S('B04', 6.0, 'sweep', (lt, t) => {
  day({}, [0, 1.3, 6, 30]); const rv = CHARS.redv, bv = CHARS.bluev;
  put(rv, VL, { p: [-6.7, 1, 1.5], ry: 90, ex: 'frown', blink: blinkAt(t, 1), ...cross }); put(bv, VL, { p: [6.7, 1, 1.5], ry: -90, ex: 'frown', blink: blinkAt(t, 2), ...cross });
  Wd.gullsAt(t, [0, 12, 8], 1);
  const u = U(lt, 3.1, eSine); camW([0, 34, 66], [0, 1, 4], [0, 17, 38], [0, 1, 0], u, 42);
});
// B05 the signboard: years without a bridge 49 -> 50 ("และเถียงกันมาห้าสิบปี")
function sign(t, t0, a, b, o = {}) { const f = clamp((t - t0) / .36); const sec = f >= .5; Wd.drawSign(sec ? (o.title2 || 'ปีที่ไม่มีสะพาน') : 'ปีที่ไม่มีสะพาน', sec ? b : a, sec ? (o.col2 || Wd.RED) : Wd.RED, f); }
S('B05', 9.08, 'whip', (lt, t) => {
  day({}, [-8, 1.3, 3, 10]); sign(t, 9.92, 49, 50); const v = CHARS.redv2;
  put(v, VL, { p: [-6.75, 1, 3.9], ry: -28, ex: t > 10.0 ? 'sad' : 'sleepy', blink: blinkAt(t, 2), ...hip, head: [0, -20, 0] });
  const u = U(lt, 1.5, eOut); camW([-6.2, 2.6, 12.6], [-7.9, 2.6, 3.4], [-7.3, 2.9, 10.6], [-7.9, 2.65, 3.4], u, 46); dof(.25);
});
// B06 over the red chief's shoulder: shouting across the river ("ว่าใครควรจ่ายค่าสะพาน")
S('B06', 10.75, 'cut', (lt, t) => {
  day({}, [0, 1.3, 0, 12]); const r = CHARS.redc, b = CHARS.bluec, k = Math.floor(lt / .45) % 2, j = .04 * Math.sin(t * 24);
  put(r, VL, { p: [-6.55, 1, 0], ry: 90, lean: 8, ex: 'frown', hR: [.2, .85 + (k ? 0 : j), .7], pR: [1, -.6, 0], hL: [-.3, .36, .12] });
  put(b, VL, { p: [6.55, 1, 0], ry: -90, lean: 8, ex: 'frown', talk: k ? 1 : 0, hL: [-.42, 1.02 + j, .3], hR: [.42, 1.02 - j, .3], pL: [-1, -.2, .2], pR: [1, -.2, .2] });
  const u = U(lt, 1.9, eSine); camW([-10.4, 2.9, .9], [6.55, 1.9, 0], [-9.7, 2.75, .5], [6.55, 1.9, 0], u, 34); dof(.15);
});
// B07 / B08 nobody pays: each chief hugs his purse
function miser(t, lt, s) { const C = s < 0 ? CHARS.redc : CHARS.bluec, bagO = s < 0 ? VA.bagR : VA.bagB; day({}, [s * 7.4, 1.3, 1, 6]);
  const tw = eOut(clamp(lt / .5)); put(C, VL, { p: [s * 7.3, 1, 1.2], ry: -s * 20 + s * 26 * tw, ex: lt > .35 ? 'sly' : 'frown', blink: blinkAt(t, 2), head: [0, s * 22 * tw, 0], hL: [-.14, .5, .34], hR: [.14, .5, .34], pL: [-1, -.3, 0], pR: [1, -.3, 0] });
  propAt(bagO, C, [0, .52, .42]); bagO.rotation.y = C.g.rotation.y;
  const u = U(lt, 1.2, eOut); camW([s * 5.2, 2.5, 6.2], [s * 7.3, 2.0, 1.2], [s * 6.3, 2.3, 5.0], [s * 7.3, 2.05, 1.2], u, 40); dof(.4); }
S('B07', 12.62, 'whip', (lt, t) => miser(t, lt, -1));
S('B08', 13.78, 'whip', (lt, t) => miser(t, lt, 1));
// B09 rowing the long way round ("ทุกคนเลยต้องพายเรืออ้อมกันครึ่งวัน")
S('B09', 15.18, 'sweep', (lt, t) => {
  Wd.applyLight('gold'); const bz = 30 - lt * 1.6, bx = 1.2 * Math.sin(lt * .6); Wd.boatAt(bx, bz, t, 180, .5); Wd.setShadowFocus(bx, 1, bz, 8); const v = CHARS.bluev, ph = lt * 4.2, rw = Math.sin(ph);
  BT.oars.forEach((o, i) => { o.rotation.y = (i ? 1 : -1) * rw * .5; }); put(v, boat, { p: [0, BT.deckY, .2], ry: 0, lean: 8 + rw * 12, ex: 'worried', sweat: true, blink: blinkAt(t, 3), hL: [-.5, .5, .3 + rw * .22], hR: [.5, .5, .3 + rw * .22], pL: [-1, -.3, 0], pR: [1, -.3, 0] });
  const u = U(lt, 2.75, eSine); camW([bx + 3.6, 3.2, bz - 7.5], [bx, 1.2, bz], [bx - 2.2, 2.6, bz - 6.4], [bx, 1.3, bz], u, 42); dof(.2);
});
// --- THE LIE ---
// B10 night: the carpenter sneaks to the red chief's door with a lantern
S('B10', 17.88, 'dis', (lt, t) => {
  night({}, [-9, 1.3, 0, 9]); const c = CHARS.carp, x = lerp(-6.4, -10.3, clamp(lt / 3.1)), z = lerp(.6, -.9, clamp(lt / 3.1));
  put(c, VL, { p: [x, 1, z], ry: -76, lean: 14, walk: { ph: lt * 8, stride: .13 }, ex: 'sneaky', blink: blinkAt(t, 1), look: [Math.sin(lt * 3) * .8, 0], hR: [.36, .5, .34], pR: [1, -.3, 0] }); lampAt(c, 1, [.36, .5, .34]);
  const u = U(lt, 3.1, eSine); camW([x - 4.6, 2.0, 5.6], [x - .4, 1.9, z], [x - 3.4, 2.2, 5.0], [x - .5, 1.95, z], u, 40); moonAt(.2, .22); dof(.2);
});
// B11 / B13 the whisper at the door (mirrored for the two chiefs)
function whisper(t, lt, s, tShock) { night({}, [s * 11.2, 1.3, -1, 7]); const c = CHARS.carp, ch = s < 0 ? CHARS.redc : CHARS.bluec; const sh = lt > tShock, pop = sh ? eOut(clamp((lt - tShock) / .25)) : 0;
  put(ch, VL, { p: [s * 11.75, 1, -1.55], ry: -s * 24, ex: sh ? 'shocked' : 'sleepy', blink: !sh && blinkAt(t, 2), head: [0, -s * 14, 0], hipY: pop * .06 * Math.sin((lt - tShock) * 30) * (lt - tShock < .4 ? 1 : 0), ...(sh ? up2 : hip) });
  put(c, VL, { p: [s * 10.55, 1, -.75], ry: s * 58, lean: 14, ex: 'sneaky', talk: talkAt(t), blink: blinkAt(t, 1), ...(s < 0 ? { hR: [.2, .98, .4], pR: [1, -.2, .3], hL: [-.36, .5, .34], pL: [-1, -.3, 0] } : { hL: [-.2, .98, .4], pL: [-1, -.2, .3], hR: [.36, .5, .34], pR: [1, -.3, 0] }) });
  lampAt(c, 1, s < 0 ? [-.36, .5, .34] : [.36, .5, .34]);
  const u = U(lt, 2.2, eOut); camW([s * 10.2, 2.4, 5.4], [s * 11.15, 2.0, -1.1], [s * 10.9, 2.2, 4.0], [s * 11.15, 2.05, -1.1], u, 40); dof(.3); }
S('B11', 21.0, 'cut', (lt, t) => whisper(t, lt, -1, 1.55));
// B12 what the chief imagines: a blue toll gate ("ถ้าเขาเสร็จก่อน เขาจะเก็บค่าข้ามจากพวกท่าน")
S('B12', 23.2, 'cut', (lt, t) => {
  Wd.applyLight('twilight', { hemiI: 2.5, sunI: 2.2, stars: 0, moon: 0 }); Wd.setShadowFocus(0, 1.3, 0, 8); Wd.bridgeAt(1, 1); VA.toll.visible = true; Wd.drawToll(); POST.vig = .62;
  const b = CHARS.bluec, v = CHARS.redv, give = sstep(1.1, 1.7, lt);
  put(b, VL, { p: [.8, DY, .35], ry: -62, ex: 'sly', blink: blinkAt(t, 3), hL: [-.3, .62, .6], pL: [-1, -.4, 0], hR: [.3, .36, .12] });
  put(v, VL, { p: [-.85, DY, .35], ry: 66, ex: 'sad', blink: blinkAt(t, 1), lean: 6, hR: [.2, .56 + give * .06, .5 + give * .2], pR: [1, -.4, 0] });
  propAt(VA.coin, v, [.2, .64 + give * .06, .56 + give * .2]);
  const u = U(lt, 2.9, eOut); camW([0, DY + 2.1, 7.8], [0, DY + 1.35, 0], [0, DY + 1.5, 6.2], [0, DY + 1.35, 0], u, 40, lerp(4, 0, u)); dof(.25);
});
S('B13', 26.22, 'whip', (lt, t) => whisper(t, lt, 1, 1.5));
// B14 he strolls off grinning, windows lighting up behind him
S('B14', 28.35, 'cut', (lt, t) => {
  night({}, [9, 1.3, 2, 9]); const c = CHARS.carp, z = 1.2 + lt * .85;
  put(c, VL, { p: [8.6, 1, z], ry: 0, walk: { ph: lt * 7, stride: .12 }, ex: 'sly', blink: blinkAt(t, 1), hR: [.36, .5, .34], pR: [1, -.3, 0], head: [0, 0, 4] }); lampAt(c, 1, [.36, .5, .34]);
  const u = U(lt, 1.8, eSine); camW([7.6, 1.9, z + 4.6], [8.7, 2.0, z], [8.0, 2.1, z + 3.6], [8.7, 2.05, z], u, 40); moonAt(-.25, .2); dof(.35);
});
// --- THE RACE ---
// B15 sunrise from above: both banks start driving piles
S('B15', 30.1, 'dis', (lt, t) => {
  Wd.applyLight('sunrise', { sunDir: [.5, .3, .6], hemiI: 2.4 }); Wd.setShadowFocus(0, 1.3, 0, 30); const k = .06 + .2 * U(lt, 1.9, eOut); Wd.bridgeAt(k, k); Wd.crowd(BANK.concat(deckCrowd(k)), t); Wd.gullsAt(t, [0, 14, 6], 1);
  const u = U(lt, 1.9, eSine); camW([0, 42, 54], [0, 1, -2], [0, 27, 38], [0, 1, -1], u, 42);
});
// B16 / B17 hammering close-ups
function hammerer(t, lt, s) { day({}, [s * 4.6, 1.3, 0, 6]); Wd.bridgeAt(.3, .3); const C = s < 0 ? CHARS.redv : CHARS.bluev, hm = VA.ham[s < 0 ? 0 : 1]; const hp = (lt * 3.6) % 1, hy = hp < .22 ? 1 - hp / .22 : (hp - .22) / .78; if (hp < .08) SH.a = .4;
  put(C, VL, { p: [s * 4.75, DY, .25], ry: -s * 52, lean: 16 - hy * 10, ex: 'determined', sweat: true, blink: blinkAt(t, 1), ...(s < 0 ? { hR: [.24, .36 + hy * .42, .5], pR: [1, -.3, .2], hL: [-.3, .4, .3] } : { hL: [-.24, .36 + hy * .42, .5], pL: [-1, -.3, .2], hR: [.3, .4, .3] }) });
  propAt(hm, C, [s < 0 ? .24 : -.24, .36 + hy * .42, .5]); hm.scale.setScalar(.7); hm.rotation.set(0, C.g.rotation.y, 0); hm.rotateX(1.5 - hy * 1.1);
  Wd.crowd(BANK.filter(c => c[3] === s && Math.abs(c[2]) > 3.2 && Math.abs(c[0]) > 7.5).slice(0, 14), t);
  const u = U(lt, 1.1, eOut); camW([s * 1.6, 2.6, 4.6], [s * 4.5, 2.0, .2], [s * 2.4, 2.4, 3.9], [s * 4.5, 2.05, .2], u, 40); dof(.35); }
S('B16', 31.95, 'whip', (lt, t) => hammerer(t, lt, -1));
S('B17', 33.05, 'whip', (lt, t) => hammerer(t, lt, 1));
// B18 one-point time lapse down the river: days and nights roll by while the halves grow
S('B18', 34.12, 'cut', (lt, t) => {
  const ph = lt * 2.6, nk = clamp(.5 - .5 * Math.cos(ph * Math.PI * 2) * 1.3 + 0, 0, 1) * (lt < .25 ? lt / .25 : 1); Wd.applyLight('day', { ...mixP('day', 'night', nk), moon: 0 }); Wd.valleyNight(nk); Wd.setShadowFocus(0, 1.3, 0, 14);
  const k = lerp(.3, .84, U(lt, 2.45, eSine)); Wd.bridgeAt(k, k); Wd.crowd(deckCrowd(k).concat(BANK.slice(0, 30)), t * 2);
  const u = U(lt, 2.5, eSine); camW([0, 5.0, 31], [0, 2.6, 0], [0, 6.0, 24], [0, 1.8, 0], u, 46);
});
// B19 thirty days later: the last gap closes ("สะพานสองท่อนก็มาชนกัน")
const TJOIN = 39.1;
function lastPlanks(t) { const d = clamp((t - (TJOIN - .5)) / .5), e = eIn(d); VA.plank.forEach((p, i) => { const s = i ? 1 : -1; p.position.set(s * .25, DY - .06 + (1 - e) * 1.6, 0); p.rotation.z = s * (1 - e) * .5; }); const f = t - TJOIN; VA.spark.material.opacity = f > 0 ? Math.max(0, 1 - f / .6) : 0; VA.spark.scale.setScalar(3 + Math.max(0, f) * 6); if (f > 0 && f < .15) SH.a = .5; }
S('B19', 36.6, 'sweep', (lt, t) => {
  day({}, [0, 1.3, 0, 12]); const k = 11 / 12; Wd.bridgeAt(k, k); lastPlanks(t); const rv = CHARS.redv2, bv = CHARS.bluev2, up = t < TJOIN;
  put(rv, VL, { p: [-.88, DY, .1], ry: 70, ex: up ? 'determined' : 'shocked', blink: blinkAt(t, 1), ...(up ? up2 : hip), sweat: up }); put(bv, VL, { p: [.88, DY, .1], ry: -70, ex: up ? 'determined' : 'shocked', blink: blinkAt(t, 2), ...(up ? up2 : hip), sweat: up });
  Wd.crowd(deckCrowd(.8, 30).concat(BANK.slice(0, 30)), t);
  const u = U(lt, 2.9, eIO); camW([-3, 9, 15], [0, 1.3, 0], [0, DY + 1.9, 6.0], [0, DY + .7, 0], u, 42, lerp(-4, 0, u)); dof(.25 * u);
});
// B20 straight down on the seam: a perfect fit ("พอดีเป๊ะ ตรงกลางแม่น้ำ")
S('B20', 39.62, 'cut', (lt, t) => {
  day({}, [0, 1.3, 0, 8]); Wd.bridgeAt(1, 1); const rv = CHARS.redv2, bv = CHARS.bluev2;
  VA.spark.material.opacity = .35 + .25 * Math.sin(lt * 9); VA.spark.scale.setScalar(1.6);
  const u = U(lt, 1.75, eOut); camW([0, DY + 9, .02], [0, DY, 0], [0, DY + 6.6, .02], [0, DY, 0], u, 40, lerp(-24, 0, u));
});
// B21 the silent beat: the chiefs stare at the seam, at each other, then get suspicious ("พอดีเกินไปด้วยซ้ำ")
S('B21', 41.36, 'cut', (lt, t) => {
  day({}, [0, 1.3, 0, 8]); Wd.bridgeAt(1, 1); const r = CHARS.redc, b = CHARS.bluec; const a = sstep(.75, 1.0, lt), c = sstep(1.5, 1.85, lt);
  put(r, VL, { p: [-.8, DY, 0], ry: 90 - c * 62, ex: c > .5 ? 'sly' : a > .5 ? 'worried' : 'shocked', blink: lt > .3 && lt < .42, head: [(1 - a) * 26, c * -14, 0], look: [c * .6, 0], ...(c > .5 ? { hR: [.1, .78, .3], pR: [1, -.4, .3], hL: [-.3, .36, .12] } : hip) });
  put(b, VL, { p: [.8, DY, 0], ry: -90 + c * 62, ex: c > .5 ? 'sly' : a > .5 ? 'worried' : 'shocked', blink: lt > .36 && lt < .48, head: [(1 - a) * 26, c * 14, 0], look: [-c * .6, 0], ...(c > .5 ? { hL: [-.1, .78, .3], pL: [-1, -.4, .3], hR: [.3, .36, .12] } : hip) });
  const u = U(lt, 2.6, eSine); camW([0, DY + 1.5, 6.6], [0, DY + 1.05, 0], [0, DY + 1.3, 5.5], [0, DY + 1.1, 0], u, 40); dof(.3);
});
// --- THE REVEAL ---
function deskOn(t, o = {}) { desk.visible = true; VL.visible = false; Wd.sea.visible = false; Wd.applyLight('night', { sunI: .5, hemiI: o.hemi ?? 1.5, stars: 0, moon: 0 }); Wd.drawPlans(); scene.updateMatrixWorld(); const lw = V(); DK.lamp.localToWorld(lw.set(0, .2, 0)); const fl = 1 + .06 * Math.sin(t * 17) + .04 * Math.sin(t * 29); Wd.pts[0].position.copy(lw); Wd.pts[0].intensity = (o.lamp ?? 2.6) * fl; Wd.pts[0].color.set('#ffb35a'); Wd.pts[1].position.copy(desk.position).add(V(-1.5, 2.4, 1.6)); Wd.pts[1].intensity = 1.6; Wd.pts[1].color.set('#ffd9a0'); Wd.setShadowFocus(desk.position.x, desk.position.y + 1, desk.position.z, 5); DK.pencil.position.set(0, -5, 0); }
// B22 top-down: the two paid-for plans slide together into one bridge
S('B22', 44.0, 'whip', (lt, t) => {
  deskOn(t, { hemi: 2.1 }); const k = eOut(clamp((lt - .15) / .7)); DK.plan[0].position.x = lerp(-1.5, -.625, k); DK.plan[1].position.x = lerp(1.5, .625, k); DK.plan[0].rotation.z = (1 - k) * .25; DK.plan[1].rotation.z = -(1 - k) * .25;
  const u = U(lt, 1.6, eOut); camD([0, 4.6, .17], [0, .99, .15], [0, 3.2, .17], [0, .99, .15], u, 40, lerp(8, 0, u));
});
// B23 he drew both himself
S('B23', 45.62, 'cut', (lt, t) => {
  deskOn(t); DK.plan[0].position.x = -.625; DK.plan[1].position.x = .625; DK.plan[0].rotation.z = DK.plan[1].rotation.z = 0; const c = CHARS.carp, dx = .12 * Math.sin(lt * 9), dz = .05 * Math.sin(lt * 13);
  put(c, desk, { p: [0, .5, -1.05], ry: 0, lean: 16, ex: 'sly', blink: blinkAt(t, 1), head: [10, 0, 0], look: [dx * 3, .6], hR: [.22 + dx, .34, .8 + dz], pR: [1, -.3, 0], hL: [-.36, .32, .7], pL: [-1, -.3, 0] });
  scene.updateMatrixWorld(); const hw = c.torso.localToWorld(V(.22 + dx, .34, .8 + dz)); desk.worldToLocal(hw); DK.pencil.position.set(hw.x, 1.02, hw.z); DK.pencil.rotation.set(.35, 0, -.3);
  const u = U(lt, 1.7, eOut); camD([1.6, 2.2, 3.2], [0, 1.25, -.4], [.9, 1.95, 2.5], [0, 1.3, -.5], u, 40); dof(.3);
});
// B24 and he was paid by both sides
S('B24', 47.3, 'cut', (lt, t) => {
  deskOn(t, { lamp: 3.0, hemi: 1.8 }); DK.plan[0].position.x = -.625; DK.plan[1].position.x = .625; DK.plan[0].rotation.z = DK.plan[1].rotation.z = 0; const c = CHARS.carp, k = eOut(clamp((lt - .2) / .45)), j = .04 * Math.sin(lt * 14);
  const hl = [-.44, lerp(.4, 1.0, k) + j, .34], hr = [.44, lerp(.4, 1.0, k) - j, .34];
  put(c, desk, { p: [0, .5, -1.05], ry: 0, ex: k > .5 ? 'happy' : 'sly', blink: blinkAt(t, 1), hL: hl, hR: hr, pL: [-1, -.2, .2], pR: [1, -.2, .2] });
  propAt(VA.bagR, c, [hl[0], hl[1] - .2, hl[2] + .05]); propAt(VA.bagB, c, [hr[0], hr[1] - .2, hr[2] + .05]);
  const u = U(lt, 2.0, eOut); camD([0, 1.9, 3.6], [0, 1.45, -.9], [0, 1.7, 2.2], [0, 1.5, -.9], u, 40); dof(.35);
});
// --- THE RESULT ---
// B25 nobody owns it: both villages cross freely
S('B25', 49.45, 'sweep', (lt, t) => {
  day({}, [0, 1.3, 0, 10]); Wd.bridgeAt(1, 1); Wd.gullsAt(t, [0, 14, -8], 1); const rv = CHARS.redv, bv = CHARS.bluev, r2 = CHARS.redv2, b2 = CHARS.bluev2, w = lt * .85;
  put(rv, VL, { p: [-1.5 + w, DY, .55], ry: 90, walk: { ph: lt * 8, stride: .14 }, ex: 'happy', blink: blinkAt(t, 1), ...(Math.abs(-1.5 + w) < 1.1 ? { hR: [.4, 1.05, .2], pR: [1, -.2, .2] } : {}) });
  put(bv, VL, { p: [1.5 - w, DY, -.5], ry: -90, walk: { ph: lt * 8 + 2, stride: .14 }, ex: 'happy', blink: blinkAt(t, 2), ...(Math.abs(1.5 - w) < 1.1 ? { hL: [-.4, 1.05, .2], pL: [-1, -.2, .2] } : {}) });
  put(r2, VL, { p: [-3.6 + w, DY, -.45], ry: 90, walk: { ph: lt * 8 + 1, stride: .13 }, ex: 'calm' }); put(b2, VL, { p: [3.6 - w, DY, .5], ry: -90, walk: { ph: lt * 8 + 3, stride: .13 }, ex: 'calm' });
  const u = U(lt, 1.65, eSine); camW([-1.2, DY + 2.2, 8.6], [0, DY + 1, 0], [.6, DY + 1.6, 6.6], [0, DY + 1.05, 0], u, 42); dof(.2);
});
// B26 nobody can charge a toll: both chiefs hold out a hand, then shrug
S('B26', 51.1, 'cut', (lt, t) => {
  day({}, [0, 1.3, 0, 8]); Wd.bridgeAt(1, 1); const r = CHARS.redc, b = CHARS.bluec; const a = sstep(.75, 1.0, lt), c = sstep(1.15, 1.4, lt);
  put(r, VL, { p: [-.62, DY, 0], ry: 8 + a * 30, ex: c > .5 ? 'sad' : a > .5 ? 'frown' : 'confident', blink: blinkAt(t, 2), head: [0, a * 20 - c * 20, 0], ...(c > .5 ? { hL: [-.5, .7, .2], hR: [.5, .7, .2], pL: [-1, -.6, 0], pR: [1, -.6, 0] } : { hR: [.3, .6, .62], pR: [1, -.5, 0], hL: [-.3, .36, .12] }) });
  put(b, VL, { p: [.62, DY, 0], ry: -8 - a * 30, ex: c > .5 ? 'sad' : a > .5 ? 'frown' : 'confident', blink: blinkAt(t, 3), head: [0, -a * 20 + c * 20, 0], ...(c > .5 ? { hL: [-.5, .7, .2], hR: [.5, .7, .2], pL: [-1, -.6, 0], pR: [1, -.6, 0] } : { hL: [-.3, .6, .62], pL: [-1, -.5, 0], hR: [.3, .36, .12] }) });
  const u = U(lt, 1.75, eOut); camW([0, DY + 1.6, 6.2], [0, DY + 1.05, 0], [0, DY + 1.3, 5.0], [0, DY + 1.1, 0], u, 40); dof(.3);
});
// B27 the signboard flips: day 1 with a bridge ("และห้าสิบปีที่เถียงกัน ก็จบลง")
const GREEN = '#3aa655';
S('B27', 52.85, 'whip', (lt, t) => {
  day({}, [-8, 1.3, 3, 10]); Wd.bridgeAt(1, 1); sign(t, 54.0, 50, 1, { title2: 'วันที่มีสะพาน', col2: GREEN }); const v = CHARS.redv2, w = CHARS.bluev2, hp = t > 54.2, j = hp ? .08 * Math.abs(Math.sin(lt * 10)) : 0;
  put(v, VL, { p: [-6.75, 1, 3.9], ry: -28, hipY: j, ex: hp ? 'happy' : 'calm', blink: blinkAt(t, 2), head: [0, -20, 0], ...(hp ? up2 : hip) });
  put(w, VL, { p: [-9.9, 1, 4.3], ry: 24, hipY: hp ? .08 * Math.abs(Math.cos(lt * 10)) : 0, ex: hp ? 'happy' : 'calm', blink: blinkAt(t, 1), head: [0, 18, 0], ...(hp ? up2 : hip) });
  const u = U(lt, 2.3, eOut); camW([-6.6, 2.5, 14.5], [-8.35, 2.5, 3.6], [-8.3, 2.9, 12.6], [-8.35, 2.55, 3.6], u, 46); dof(.25);
});
// B28 golden hour crane out: the carpenter walks off with both purses ("เพราะคำโกหกประโยคเดียว")
S('B28', 55.2, 'dis', (lt, t) => {
  Wd.applyLight('gold'); Wd.setShadowFocus(0, 1.3, 0, 30); Wd.bridgeAt(1, 1); Wd.gullsAt(t, [0, 16, 0], 1); const c = CHARS.carp, z = 3.2 + lt * .8;
  put(c, VL, { p: [8.2, 1, z], ry: 0, walk: { ph: lt * 7, stride: .12 }, ex: 'happy', blink: blinkAt(t, 1), hL: [-.4, .42, .2], hR: [.4, .42, .2], head: [0, 0, 5] });
  propAt(VA.bagR, c, [-.4, .2, .2]); propAt(VA.bagB, c, [.4, .2, .2]);
  const rv = CHARS.redv, bv = CHARS.bluev; put(rv, VL, { p: [-1.2 + lt * .5, DY, .4], ry: 90, walk: { ph: lt * 8, stride: .13 }, ex: 'happy' }); put(bv, VL, { p: [1.6 - lt * .5, DY, -.4], ry: -90, walk: { ph: lt * 8 + 2, stride: .13 }, ex: 'happy' });
  Wd.crowd(BANK.filter(c => c[0] < 0 || Math.abs(c[2]) < 2.6).slice(0, 24), t * .5);
  const u = U(lt, 3.4, eIO); camW([9.6, 2.3, z + 5.2], [8.3, 1.9, z], [16, 24, 40], [0, 1, 0], u, 42);
});

export function initShots(timing) { TM.env = timing.env; for (let i = 0; i < SHOTS.length; i++) SHOTS[i].t1 = i + 1 < SHOTS.length ? SHOTS[i + 1].t0 : timing.end; }
export function runShot(sh, t) { reset(t); POST.vig = .2; sh.fn(t - sh.t0, t); }

export const COVER = { id: 'COVER', t0: 0, fn: (lt, t, o = {}) => {
  day({}, [0, 1.3, 0, 8]); Wd.bridgeAt(1, 1); faceOff(3.3, ['frown', 'determined'], { r: { p: [-1.02, DY, 0] }, b: { p: [1.02, DY, 0] } }); const c = CHARS.carp; put(c, VL, { p: [0, DY, .9], ry: 0, ex: 'sly', ...hip, head: [0, 0, 5] });
  const cm = o.cam || [0, DY + 1.0, 6.9], g = o.tgt || [0, DY + 1.75, 0]; camW(cm, g, cm, g, 0, o.fov || 44); dof(.15);
} };
let benchFloor = null;
export const BENCH = { id: 'BENCH', t0: 0, fn: (lt, t, o = {}) => {
  Wd.applyLight(o.light || 'day'); VL.visible = false; Wd.WAVE.amp = .2;
  if (!benchFloor) { benchFloor = group({ parent: scene }); }
  benchFloor.clear(); benchFloor.visible = true;
  const ids = Object.keys(CHARS), n = ids.length, gap = .8, per = n <= 3 ? n : Math.ceil(n / Math.ceil(n / 3)), rows = Math.ceil(n / per);
  const ex = o.ex || ['neutral', 'sly', 'confident', 'sneaky', 'happy', 'shocked', 'worried', 'calm', 'sad'];
  const wood = toon('#d9b88a');
  for (let r = 0; r < rows; r++) { const k = rows - 1 - r, y = k * 1.35, z = -k * 1.1; mesh(new THREE.BoxGeometry(per * gap + .5, y + .3, 1.0), wood, { p: [0, (y - .3) / 2, z], cast: false, parent: benchFloor }); }
  ids.forEach((id, i) => { const r = Math.floor(i / per), k = rows - 1 - r, inRow = Math.min(per, n - r * per), j = i - r * per;
    put(CHARS[id], scene, { p: [(j - (inRow - 1) / 2) * gap, k * 1.35, -k * 1.1], ry: o.ry ?? 0, ex: ex[i % ex.length], head: [0, 0, 0] }); });
  const d = Math.max(4.5, (per * gap / 2 + .35) / Math.tan(11 * D2R)), cy = ((rows - 1) * 1.35 + 1.25) / 2;
  const c = o.cam || [0, cy + .4, d], g = o.tgt || [0, cy, -(rows - 1) * .55]; camW(c, g, c, g, 0, o.fov || 40);
  Wd.setShadowFocus(0, cy, 0, 4);
} };
