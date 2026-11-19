// shots.js: series "เกมเอาชีวิตรอด"
import { THREE, scene, camera, clamp, lerp, sstep, eIO, eOut, eIn, eSine, D2R, noise1, rng, POST, mesh, rbox, toon, group } from './engine.js';
import * as Wd from './world.js';
import { CHARS, pose, toTorso, blinkAt } from './chars.js';
const { SC, CT, CR, XA } = Wd;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const TM = { env: [] };
const talkAt = (t) => { const e = TM.env[Math.round(t * 30)] || 0; return e > .55 ? 1 : e > .25 ? .5 : 0; };
let SH = { a: 0, t: 0 };
function look(pos, tgt, fov = 40, roll = 0) { POST.focus = pos.distanceTo(tgt); camera.position.copy(pos); camera.fov = fov; camera.updateProjectionMatrix(); camera.up.set(0, 1, 0); camera.lookAt(tgt); if (roll) camera.rotateZ(roll * D2R);
  if (SH.a > 0) { const t = SH.t * 22; camera.rotateX(noise1(t) * .02 * SH.a); camera.rotateY(noise1(t + 50) * .02 * SH.a); camera.position.y += noise1(t + 9) * .08 * SH.a; } camera.updateMatrixWorld(); }
const lp = (a, b, u) => a.map((v, i) => lerp(v, b[i], u));
const camO = (o) => (p0, t0, p1, t1, u, fov = 40, roll = 0) => look(V(...lp(p0, p1, u)).add(o.position), V(...lp(t0, t1, u)).add(o.position), fov, roll);
const camS = camO(SC), camC = camO(CT), camR = camO(CR), camW = camO(scene);
function put(C, parent, P) { if (C.g.parent !== parent) parent.add(C.g); pose(C, P); }
function dof(k) { POST.dof = k; }
const U = (lt, d, e = eIO) => e(clamp(lt / d));
function reset(t) {
  SH.a = 0; SH.t = t; if (benchFloor) benchFloor.visible = false;
  Object.values(CHARS).forEach(C => { C.g.visible = false; C.g.scale.setScalar(C.spec.s); });
  Wd.hideSea3(); Wd.uiAt(0); Wd.flash(0); Wd.hideProps3(); Wd.setRoom('07'); XA.mon.scale.setScalar(1);
  Wd.pts.forEach(l => { l.intensity = 0; });
  POST.sat = 1.22; POST.lift = 1.06;
}
function school(o = {}) { Wd.setScene('sc'); Wd.applyLight('schoolN', o); Wd.setNight(1); Wd.setShadowFocus(300, 1, 0, 12); const p = Wd.pts[3]; p.position.set(300, 4, -9); p.color.set('#ffd8a0'); p.intensity = 30; p.distance = 22; night(); }
function city(o = {}, nite = true) { Wd.setScene('ct'); Wd.applyLight('cityN2', o); Wd.setNight(1); Wd.setShadowFocus(-300, 0, 0, 9); night(); }
function room(o = {}, dim = false) { Wd.setScene('ct'); Wd.applyLight('roomN2', o); Wd.setNight(1); Wd.setShadowFocus(-300, -3, 0, 7); const p = Wd.pts[0]; p.position.set(-300, -.9, 1); p.color.set('#e4ecff'); p.intensity = dim ? .5 : 1.25; night(); }
function night() { POST.sat = .95; POST.lift = .98; POST.vig = .5; }
function propAt(o, C, h, rot) { scene.updateMatrixWorld(); o.visible = true; o.position.copy(C.torso.localToWorld(V(...h))); if (rot) o.rotation.set(...rot); }
const hip = { hL: [-.3, .36, .12], hR: [.3, .36, .12], pL: [-1, 0, -.5], pR: [1, 0, -.5] };
const up2 = { hL: [-.42, 1.02, .3], hR: [.42, 1.02, .3], pL: [-1, -.2, .2], pR: [1, -.2, .2] };
const hug = { hL: [-.14, .5, .34], hR: [.14, .5, .34], pL: [-1, -.3, 0], pR: [1, -.3, 0] };
const fold = { hL: [-.06, .55, .36], hR: [.06, .52, .38], pL: [-1, -.3, 0], pR: [1, -.3, 0] };
const mouthH = { hL: [-.06, .95, .42], hR: [.06, .9, .44], pL: [-1, -.5, 0], pR: [1, -.5, 0] };
const offerR = { hR: [.2, .6, .7], pR: [1, -.5, 0], hL: [-.3, .36, .12], pL: [-1, 0, -.5] };
const chin = { hR: [.06, .82, .36], pR: [1, -.6, 0], hL: [.05, .5, .3], pL: [-1, -.3, 0] };
const pointR = { hR: [.22, .8, .8], pR: [1, -.6, 0], hL: [-.3, .36, .12], pL: [-1, 0, -.5] };
const fist = { hR: [.2, .95, .3], pR: [1, -.4, 0], hL: [-.3, .36, .12], pL: [-1, 0, -.5] };
const runA = (ph) => ({ hL: [-.3, .4 + Math.sin(ph) * .12, .1 + Math.sin(ph) * .3], hR: [.3, .4 - Math.sin(ph) * .12, .1 - Math.sin(ph) * .3], pL: [-1, -.3, 0], pR: [1, -.3, 0] });
const crouch = { hipY: -.46, lean: 22 };
const K = () => CHARS.krai, B = () => CHARS.bruno, N = () => CHARS.neo, A = () => CHARS.ace, BO = () => CHARS.boss, VI = () => CHARS.victor;
const TR = (i) => CHARS['tr' + (i + 1)], STU = (i) => CHARS[['g1', 'b1', 'g2', 'b2'][i]];
const tower = (x, z) => Object.values(XA.towers).find(t => t.x === x && t.z === z);
function deskFall(i, x, z, t0, t, o = {}) { const d = XA.desks[i]; const lt = t - t0; if (lt < 0) return; const h0 = o.h0 ?? 22, g = 13; let y = h0 - .5 * g * lt * lt, tl = 0;
  if (y < 0) { const tl0 = Math.sqrt(2 * h0 / g); tl = lt - tl0; const v = g * tl0 * .25; y = Math.max(0, v * tl - .5 * g * tl * tl); }
  d.visible = true; d.children.forEach(c => { c.visible = true; }); d.position.set(x, y, z).add(o.parent ? o.parent.position : SC.position); const sp = o.spin ?? 2.4, rest = o.rest || [.08, i * 1.3, .05];
  if (tl <= 0) d.rotation.set(lt * sp, i * .7 + lt * sp * .5, lt * sp * .7); else { const k = clamp(tl / .4); d.rotation.set(lerp(Math.sin(i) * .6, rest[0], k), rest[1], lerp(Math.cos(i) * .5, rest[2], k)); }
  d.scale.setScalar(o.s || 1.25); }
const heroDesk = (x, z, ry = 0) => { const d = XA.desks[9]; d.visible = true; d.children[d.children.length - 1].visible = false; d.children[5].visible = false; d.position.set(x, 0, z).add(SC.position); d.rotation.set(0, ry * D2R, 0); d.scale.setScalar(1.5); };
const BOOMT = () => Object.values(XA.towers).filter(t => t.z === -30 && t.top > 6 && t.g).sort((a, b) => Math.abs(a.x) - Math.abs(b.x))[0];
const BILLT = () => Object.values(XA.towers).filter(t => t.by !== undefined && t.z < 0).sort((a, b) => b.by - a.by)[0];
// shared team layout in room 07
const TEAM = { bruno: [-1.4, -.7, 25], neo: [1.4, -.9, -25], ace: [.1, -2.0, 0] };
const team = (t, o = {}) => { put(B(), CR, { p: [TEAM.bruno[0], 0, TEAM.bruno[1]], ry: TEAM.bruno[2], ex: 'frown', blink: blinkAt(t, 2), ...fold, ...(o.b || {}) }); put(N(), CR, { p: [TEAM.neo[0], 0, TEAM.neo[1]], ry: TEAM.neo[2], ex: 'calm', blink: blinkAt(t, 3), ...hip, ...(o.n || {}) }); put(A(), CR, { p: [TEAM.ace[0], 0, TEAM.ace[1]], ry: TEAM.ace[2], ex: 'confident', blink: blinkAt(t, 4), ...hip, ...(o.a || {}) }); };
const WR = (x, y, z) => [x - 300, y - 4, z];
const WC = (x, y, z) => [x - 300, y, z];
// power stones from ep2 on (5 red fist / 6 green wind / 7 yellow gear / 8 blue eye) and the powers they give
const ST = { bruno: 5, ace: 6, neo: 7, krai: 8 };
const hold = (C, i, t, k = 1.6, h = [0, .33, .42]) => { Wd.stoneAt(i, [0, 0, 0], t, k); propAt(XA.stones[i], C, h); };
const muscle = (k) => { B().g.scale.setScalar(B().spec.s * (1 + .14 * k)); };
const headW = (C, off = [0, 0, 0]) => { scene.updateMatrixWorld(); const v = new THREE.Vector3(); C.head.getWorldPosition(v); return [v.x + off[0], v.y + off[1], v.z + off[2]]; };
const eyeGlow = (k, t) => { Wd.auraCol(0, '#4ab8ff'); Wd.auraAt(0, headW(K(), [0, .1, 0]), .6 + .08 * Math.sin(t * 8), .32 * k); };
// =====================================================================
export const SHOTS = [];
const S = (id, t0, tr, fn, o = {}) => SHOTS.push({ id, t0, tr, fn, ...o });
// ===================== EP 2 (107.54 s): the power stones, room 07 exposed, five invaders =====================
const S2 = (id, t0, tr, fn, o = {}) => S(id, t0, tr, (lt, t) => { Object.values(CHARS).forEach(C => C.g.scale.setScalar(C.spec.s)); fn(lt, t); }, o);
const DESKS = [[-4.1, -3.4], [-4.1, -2.0], [-4.1, -.6], [-2.8, -3.6], [-2.8, -2.2], [-2.8, -.8]];
function rm(o = {}, dim = false, grid = false) { room(o, dim); XA.roomDesks.children.forEach((d, i) => { const q = grid ? [-2.4 + Math.floor(i / 2) * 2.4, -1.4 + (i % 2) * 2.4] : DESKS[i]; if (q) { d.position.x = q[0]; d.position.z = q[1]; } }); }
// fight layout in room 07 (team on the left, invaders by the door)
const TM2 = { krai: [-.7, 2.6, 90], bruno: [.4, 1.3, 90], ace: [.3, 3.6, 100], neo: [-.9, .5, 75] };
const INV = [[2.4, 2.1, -90], [2.7, 3.7, -100], [2.9, .8, -80], [3.6, 3.0, -95], [3.8, 1.9, -90]];
const IV = (i) => i < 4 ? STU([1, 0, 3, 2][i]) : CHARS.b3;
function us(t, o = {}) { const P = (k, C, ex, j, pz = {}) => put(C, CR, { p: [TM2[k][0], 0, TM2[k][1]], ry: TM2[k][2], ex, blink: blinkAt(t, j), ...hip, ...pz, ...(o[k] || {}) });
  P('krai', K(), 'determined', 1); P('bruno', B(), 'frown', 2, fist); P('ace', A(), 'confident', 4); P('neo', N(), 'worried', 3, hug); }
function them(t, o = {}) { INV.forEach(([x, z, ry], i) => { const C = IV(i); if (!C) return; put(C, CR, { p: [x, 0, z], ry, ex: i === 0 ? 'sly' : 'frown', blink: blinkAt(t, i + 5), ...(i === 0 ? hip : fist), ...(o[i] || {}) }); }); }
const scrShot2 = (lt, d = 3) => { const u = U(lt, d, eSine); camR([0, 1.85, 2.4], [0, 2.0, -4.9], [0, 1.9, 2.0], [0, 2.0, -4.9], u, 56); };
const redRoom = (k) => { const p = Wd.pts[1]; p.position.set(-300, -2.0, -3.4); p.color.set('#ff3a4a'); p.intensity = 3.5 * k; p.distance = 14; };

// --- back in room 07 ---
S2('E01', 0, 'cut', (lt, t) => { // "หลังจากกลับมาถึงห้อง"
  rm({}, false, true); Wd.screen('goal', 0, 0, .3); XA.doorP.rotation.y = -1.4 * (1 - sstep(1.2, 1.8, lt)); const k = clamp(lt / 1.6);
  put(K(), CR, { p: [lerp(4.6, 2.8, k), 0, lerp(3.6, 2.6, k)], ry: -110, walk: k < 1 ? { ph: lt * 7, stride: .12 } : null, ex: 'determined', blink: blinkAt(t, 1), ...hip });
  const u = U(lt, 1.8, eSine); camR([.2, 1.6, .6], [3.4, 1.1, 3.0], [.4, 1.6, .8], [3.0, 1.1, 2.8], u, 46); dof(.2);
});
S2('E02', 1.75, 'cut', (lt, t) => { // "ไครตัดสินใจอธิบายสิ่งที่เขาพบให้ทุกคนฟัง"
  rm({}, false, true); Wd.screen('stone', 1, 0, .45); put(K(), CR, { p: [1.0, 0, -.4], ry: -10, ex: 'determined', talk: talkAt(t), blink: blinkAt(t, 1), ...offerR }); hold(K(), ST.krai, t, .8, [.2, .6, .7]);
  put(B(), CR, { p: [-.3, 0, 2.4], ry: 160, ex: 'shocked', blink: blinkAt(t, 2), ...fold }); put(N(), CR, { p: [1.7, 0, 2.3], ry: 210, ex: 'happy', blink: blinkAt(t, 3), ...hug }); put(A(), CR, { p: [2.5, 0, 1.9], ry: 220, ex: 'confident', blink: blinkAt(t, 4), ...hip });
  const u = U(lt, 4.0, eSine); camR([.4, 1.6, 4.1], [1.0, 1.3, -.6], [.6, 1.6, 3.7], [1.0, 1.3, -.6], u, 58); dof(.15);
});
// --- the roof at night: four of them look for stones ---
S2('E03', 5.8, 'cut', (lt, t) => { // "ทั้งสี่คนจึงออกไปสำรวจบริเวณใกล้เคียง"
  city(); const x = 3 - lt * 1.1; [K, B, A, N].forEach((C, i) => put(C(), CT, { p: [x - i * .8, 0, 3.9 - (i % 2) * .4], ry: -95, lean: 8, walk: { ph: lt * 6 + i, stride: .1 }, ex: i === 0 ? 'determined' : i === 3 ? 'worried' : 'calm', blink: blinkAt(t, i + 1), ...hip }));
  const u = U(lt, 2.8, eSine); camC([x - 1.0, 2.0, 7.6], [x - 1.4, .9, 3.8], [x - 1.6, 2.1, 7.2], [x - 1.8, .9, 3.8], u, 50); dof(.15);
});
S2('E04', 8.6, 'cut', (lt, t) => { // "เพื่อค้นหาหินพลังพิเศษ": spread out, glints on the roof
  city(); put(K(), CT, { p: [-.4, 0, 2.6], ry: -40, ex: 'calm', head: [18, 0, 0], ...chin }); put(B(), CT, { p: [-2.6, 0, .4], ry: -150, ex: 'calm', head: [20, 0, 0], ...hip }); put(A(), CT, { p: [1.8, 0, .2], ry: 150, ex: 'calm', head: [18, 0, 0], ...hip }); put(N(), CT, { p: [-1.6, 0, 3.6], ry: 120, ex: 'worried', head: [24, 0, 0], ...hug });
  [[-3.4, -.6], [2.6, -.9], [-2.3, 4.2]].forEach(([x, z], i) => Wd.stoneAt(5 + i, WC(x, 0, z), t, .9)); hold(K(), ST.krai, t, .7);
  const u = U(lt, 3.0, eSine); camC([.4, 7.5, 9.5], [-.4, 0, 1.6], [.0, 7.0, 8.6], [-.4, 0, 1.6], u, 50);
});
S2('E05', 11.6, 'cut', (lt, t) => { // "บรูโน่พบหินสีแดงที่มีสัญลักษณ์รูปกำปั้น"
  city(); const k = sstep(.4, 1.4, lt); put(B(), CT, { p: [-2.6, 0, .4], ry: -150, ex: k > .5 ? 'shocked' : 'calm', blink: blinkAt(t, 2), hipY: -.2 * k, lean: 18 * k, head: [20, 0, 0], ...hip });
  Wd.stoneAt(5, WC(-3.4, 0, -.6), t, .7 + .4 * k); const u = U(lt, 4.0, eSine); camC([-4.9, .8, -2.6], [-3.0, .6, .1], [-4.7, .8, -2.3], [-3.0, .7, .1], u, 46); dof(.3);
});
S2('E06', 15.6, 'cut', (lt, t) => { // "เมื่อสัมผัสมัน"
  city(); const r = sstep(0, .8, lt); put(B(), CT, { p: [-3.0, 0, -.1], ry: -150, ex: 'determined', blink: false, ...crouch, hR: [.25, lerp(.4, .05, r), lerp(.3, .6, r)], pR: [1, -.4, 0], hL: [-.3, .36, .12], pL: [-1, 0, -.5] });
  Wd.stoneAt(5, WC(-3.4, 0, -.6), t, .8 + r * .6); Wd.flash(sstep(.75, .9, lt) * .12 * (1 - sstep(.9, 1.1, lt))); const u = U(lt, 1.4, eOut); camC([-1.4, 1.2, -2.2], [-3.2, .45, -.4], [-1.6, 1.15, -2.0], [-3.2, .45, -.4], u, 42); dof(.4);
});
S2('E07', 17.0, 'cut', (lt, t) => { // "ร่างกายของเขาก็เริ่มเปล่งแสง และกล้ามเนื้อขยายใหญ่ขึ้นอย่างน่าตกใจ": low angle, he swells
  city(); const g = sstep(.4, 2.2, lt), m = sstep(1.8, 4.2, lt); put(B(), CT, { p: [-3.0, 0, -.1], ry: 30, ex: m > .3 ? 'shocked' : 'determined', blink: false, head: [-8, 0, 0], ...(m > .5 ? up2 : fist) }); muscle(m);
  Wd.auraCol(1, '#ff4a3a'); Wd.auraAt(1, WC(-3.0, 1.0, -.1), 2.2 + g * .6 + m * .5 + .15 * Math.sin(t * 9), .32 * g); const p = Wd.pts[1]; p.position.set(-303, 1.2, .9); p.color.set('#ff4a3a'); p.intensity = 3 * g; p.distance = 9;
  if (m > .1 && m < .95) SH.a = .2 + .2 * Math.sin(lt * 20); const u = U(lt, 5.7, eSine); camC([-1.9, .4, 2.9], [-3.0, 1.1, -.1], [-2.0, .35, 2.6], [-3.0, 1.2, -.1], u, 50); dof(.2);
});
S2('E08', 22.7, 'cut', (lt, t) => { // "ส่วนเอซได้รับหินสีเขียว"
  city(); const a = A(); put(a, CT, { p: [1.8, 0, .4], ry: -30, ex: lt > 1.0 ? 'happy' : 'shocked', blink: blinkAt(t, 4), head: [10, 0, 0], ...offerR }); hold(a, ST.ace, t, .7 + .2 * Math.sin(t * 4), [.2, .65, .72]);
  Wd.auraCol(1, '#3af08a'); Wd.auraAt(1, WC(1.6, 1.0, .9), 1.6, .12); const u = U(lt, 2.75, eSine); camC([.6, 1.35, 3.6], [1.7, 1.0, .5], [.7, 1.35, 3.3], [1.7, 1.0, .5], u, 40); dof(.4);
});
S2('E09', 25.45, 'whip', (lt, t) => { // "ทำให้ความเร็วและปฏิกิริยาตอบสนองเพิ่มขึ้นหลายเท่า": a blur across the roof
  city(); const run = lt > .5 && lt < 2.6, u0 = clamp((lt - .5) / 2.1), x = lerp(2.6, -3.2, eIO(u0)); put(A(), CT, { p: [x, 0, 2.4], ry: lt < .5 ? 0 : lt < 2.6 ? -90 : 0, lean: run ? 25 : 0, walk: run ? { ph: lt * 26, stride: .3 } : null, ex: run ? 'determined' : 'confident', blink: blinkAt(t, 4), ...(run ? runA(lt * 26) : hip) });
  [0, 1, 2, 3].forEach(i => Wd.streakAt(i, WC(x + .9 + i * .25, .5 + i * .28, 2.4 - .05 * i), 0, 1.6 - i * .2, run ? .55 - i * .1 : 0)); Wd.auraCol(1, '#3af08a'); Wd.auraAt(1, WC(x, .9, 2.4), 1.6, run ? .35 : .1);
  put(B(), CT, { p: [-.5, 0, .6], ry: 0, ex: lt > 1.2 ? 'shocked' : 'calm', head: [0, lerp(0, -40, u0) + 20, 0], ...fold }); muscle(1);
  const u = U(lt, 4.2, eSine); camC([-.2, 1.3, 6.8], [-.2, .9, 2.0], [-.2, 1.3, 6.5], [-.2, .9, 2.0], u, 50); dof(.15);
});
S2('E10', 29.7, 'cut', (lt, t) => { // "นีโอเลือกหินสีเหลือง"
  city(); const n = N(), r = sstep(.3, 1.2, lt); put(n, CT, { p: [-1.6, 0, 3.6], ry: 150, ex: r > .8 ? 'happy' : 'calm', blink: blinkAt(t, 3), head: [lerp(24, 4, r), 0, 0], hipY: -.2 * (1 - r), lean: 14 * (1 - r), ...offerR });
  if (r < .8) Wd.stoneAt(ST.neo, WC(-2.3, 0, 4.2), t, .8); else hold(n, ST.neo, t, .8, [.2, .6, .7]); Wd.stoneAt(ST.ace, WC(-1.2, -10, 0), t, 0);
  const u = U(lt, 3.3, eSine); camC([-2.6, 1.3, 6.6], [-1.9, .8, 3.9], [-2.5, 1.25, 6.3], [-1.9, .9, 3.9], u, 44); dof(.35);
});
S2('E11', 33.0, 'cut', (lt, t) => { // "ซึ่งทำให้เขาสามารถควบคุมและประกอบวัตถุรอบตัวให้กลายเป็นอุปกรณ์ต่าง ๆ ได้"
  city(); const n = N(), k = sstep(.3, 3.6, lt); put(n, CT, { p: [-1.6, 0, 3.6], ry: 150, ex: k > .9 ? 'happy' : 'determined', blink: blinkAt(t, 3), sweat: k < .9, hL: [-.2, .8, .5], hR: [.2, .8, .5], pL: [-1, -.4, 0], pR: [1, -.4, 0] });
  Wd.scrapAt(WC(-1.95, 1.25, 3.0), 150 + lt * 40 * (1 - k), k, t, .55, 0); Wd.auraCol(1, '#ffd23a'); Wd.auraAt(1, WC(-1.95, 1.25, 3.0), 1.4 + .2 * Math.sin(t * 7), .45 * sstep(0, .6, lt));
  const u = U(lt, 4.85, eSine); camC([-1.0, 1.6, 1.7], [-1.8, 1.15, 3.3], [-1.15, 1.55, 1.95], [-1.8, 1.15, 3.3], u, 46); dof(.3);
});
S2('E12', 37.85, 'cut', (lt, t) => { // "ส่วนไครได้รับหินสีน้ำเงินที่มีสัญลักษณ์รูปดวงตา"
  city(); const k = K(); put(k, CT, { p: [-.4, 0, 2.6], ry: 20, ex: 'calm', blink: blinkAt(t, 1), head: [12, 0, 0], ...offerR }); hold(k, ST.krai, t, .75 + .15 * Math.sin(t * 3), [.2, .6, .7]);
  const u = U(lt, 4.6, eIn); camC([.2, 1.3, 4.9], [-.3, 1.0, 2.7], [.1, 1.25, 4.5], [-.3, 1.0, 2.7], u, 40); dof(.45);
});
S2('E13', 42.45, 'cut', (lt, t) => { // "ความสามารถของเขาคือการวิเคราะห์จุดอ่อน": his eyes light up
  city(); const k = sstep(.3, 1.4, lt); put(K(), CT, { p: [-.4, 0, 2.6], ry: 20, ex: 'determined', blink: false, ...hip }); eyeGlow(k, t);
  const u = U(lt, 2.85, eIn); camC([.3, 1.35, 4.8], [-.4, 1.2, 2.6], [.15, 1.35, 4.3], [-.4, 1.25, 2.6], u, 36); dof(.5);
});
S2('E14', 45.3, 'cut', (lt, t) => { // "และคาดการณ์การเคลื่อนไหวของสิ่งที่มองเห็น": what Krai sees
  city(); POST.sat = .7; const ph = lt * 3; const ax = 1.2 + Math.sin(ph) * 1.4, az = .6 + Math.cos(ph * .7) * .5; put(A(), CT, { p: [ax, 0, az], ry: Math.cos(ph) > 0 ? -90 : 90, lean: 20, walk: { ph: lt * 20, stride: .25 }, ex: 'determined', ...runA(lt * 20) });
  put(B(), CT, { p: [-.8, 0, .2], ry: 60, ex: 'frown', ...fist }); muscle(1);
  const fut = []; for (let i = 1; i <= 8; i++) { const q = ph + i * .18; fut.push(WC(1.2 + Math.sin(q) * 1.4, .08, .6 + Math.cos(q * .7) * .5)); } Wd.dotsAt(fut, sstep(.2, .8, lt), t);
  Wd.retAt(WC(-.8, .55, .25), .55, sstep(.6, 1.2, lt), t); const p = Wd.pts[1]; p.position.set(-300, 2.5, 3); p.color.set('#4ab8ff'); p.intensity = 4; p.distance = 12;
  const u = U(lt, 3.4, eSine); camC([.2, 1.5, 4.8], [.3, .7, .4], [.3, 1.45, 4.5], [.3, .7, .4], u, 48);
});
// --- the announcement: room 07 exposed ---
S2('E15', 48.7, 'cut', (lt, t) => { // "แต่ก่อนที่ทุกคนจะได้ทดลองพลัง เสียงประกาศก็ดังขึ้น"
  city(); const on = lt > 2.3; XA.bills.visible = on; if (on) Wd.screen('detect', 0, 0, 0); const tn = sstep(2.3, 2.9, lt);
  put(B(), CT, { p: [-.8, 0, 2.3], ry: lerp(30, 180, tn), ex: on ? 'shocked' : 'happy', blink: blinkAt(t, 2), ...(on ? hug : fist) }); muscle(1 - tn * .5); put(A(), CT, { p: [.9, 0, 2.5], ry: lerp(-30, 170, tn), ex: on ? 'shocked' : 'confident', blink: blinkAt(t, 4), ...hip });
  put(N(), CT, { p: [-.1, 0, 3.4], ry: lerp(0, 190, tn), ex: on ? 'scared' : 'happy', blink: blinkAt(t, 3), ...hug }); put(K(), CT, { p: [.2, 0, 1.8], ry: lerp(0, 180, tn), ex: on ? 'frown' : 'calm', blink: blinkAt(t, 1), ...hip });
  const R = Wd.pts[1]; R.position.set(-300, 6, -20); R.color.set('#ff3a4a'); R.intensity = on ? 30 * (.7 + .3 * Math.sin(t * 8)) : 0; R.distance = 40;
  const u = U(lt, 4.4, eSine); camC([.2, 1.6, 7.8], [0, 1.1, 2.4], [.2, 1.6, 7.3], [0, 1.3, 2.4], u, 46); dof(.15);
});
S2('E16', 53.1, 'cut', (lt, t) => { // "ตรวจพบการใช้พลังพิเศษ"
  city(); XA.bills.visible = true; Wd.screen('detect', 0, 0, 0); put(K(), CT, { p: [.4, 0, 2.6], ry: 180, ex: 'shocked', head: [-10, 0, 0], ...hip });
  const T = BILLT(); const u = U(lt, 2.1, eSine); camC([.8, 1.5, 5.6], [T.x * .97, T.by - 1, T.z], [.6, 1.7, 5.0], [T.x * .97, T.by, T.z], u, 30);
});
S2('E17', 55.2, 'cut', (lt, t) => { // "ห้องหมายเลข 07 ถูกเปิดเผยตำแหน่งแล้ว": our tower lit red, seen from afar
  city(); XA.bills.visible = true; Wd.screen('detect', 1, 0, 0); [K, B, A, N].forEach((C, i) => put(C(), CT, { p: [-.6 + i * .5, 0, 2.2 + (i % 2) * .4], ry: 160, ex: 'scared', ...hug }));
  const R = Wd.pts[1]; R.position.set(-300, 3, 2); R.color.set('#ff2a3a'); R.intensity = 60 * (.6 + .4 * Math.abs(Math.sin(t * 4))); R.distance = 30;
  Wd.monAt([15 - 300, -40, 30 - lt * 1.5], -160 + lt * 8, lt * 1.6, .9, { s: 1.08, hy: lerp(-10, 20, sstep(1, 3, lt)) });
  const u = U(lt, 3.45, eIO); camC([14, 9, 28], [0, -1, 1], [12, 7, 22], [0, -1, 1], u, 42);
});
// --- room 07: the door ---
S2('E18', 58.65, 'cut', (lt, t) => { // "ทันใดนั้น ประตูห้องก็ถูกทุบอย่างรุนแรง"
  rm(); Wd.screen('detect', 1, 0, .4); redRoom(.6); const bang = [.5, 1.2, 1.8, 2.5, 3.0].some(b => lt > b && lt < b + .12); XA.doorP.rotation.y = bang ? -.06 : 0; if (bang) SH.a = .35;
  us(t, { krai: { ry: 70, ex: 'shocked' }, bruno: { ex: 'frown' }, ace: { ex: 'shocked' }, neo: { ex: 'scared', sweat: true, ...up2 } });
  const u = U(lt, 3.65, eSine); camR([-1.8, 2.1, -2.8], [3.0, 1.0, 2.6], [-1.6, 2.05, -2.6], [3.0, 1.0, 2.6], u, 54); dof(.15);
});
S2('E19', 62.3, 'whip', (lt, t) => { // "นักเรียนจากห้องอื่นจำนวนห้าคนบุกเข้ามา"
  rm(); Wd.screen('detect', 1, 0, .4); redRoom(.6); const o = sstep(.15, .35, lt); XA.doorP.rotation.y = -1.6 * o; if (lt > .15 && lt < .6) SH.a = .6; Wd.flash(lt > .15 && lt < .3 ? .3 : 0);
  INV.forEach(([x, z, ry], i) => { const C = IV(i), k = clamp((lt - .35 - i * .22) / 1.3); put(C, CR, { p: [lerp(6.6, x, eOut(k)), 0, lerp(3.6, z, eOut(k))], ry: k < 1 ? -100 : ry, walk: k < 1 ? { ph: lt * 10 + i, stride: .18 } : null, ex: i === 0 ? 'sly' : 'frown', blink: blinkAt(t, i + 5), ...(k < 1 ? runA(lt * 10 + i) : fist) }); });
  const u = U(lt, 3.15, eSine); camR([-1.6, 1.5, 1.4], [3.6, 1.0, 2.8], [-1.4, 1.45, 1.5], [3.6, 1.0, 2.8], u, 50); dof(.1);
});
S2('E20', 65.45, 'cut', (lt, t) => { // "พวกเขาต้องการแย่งหินพลังทั้งหมด"
  rm(); Wd.screen('detect', 1, 0, .4); redRoom(.6); them(t, { 0: { ex: 'sly', talk: talkAt(t), ...pointR } }); const k = K(); us(t, { krai: { ex: 'frown', ...hug } }); hold(k, ST.krai, t, 1.4, [-.1, .5, .38]);
  const u = U(lt, 2.65, eOut); camR([.0, 1.3, .4], [2.4, 1.15, 2.1], [.2, 1.3, .6], [2.4, 1.18, 2.1], u, 40); dof(.4);
});
// --- the fight ---
S2('E21', 68.1, 'whip', (lt, t) => { // "บรูโน่พุ่งเข้าไปต่อยคนแรกจนกระเด็น"
  rm(); redRoom(.4); Wd.screen('detect', 1, 0, .3); const d = clamp(lt / .7), hit = lt > .7, fly = clamp((lt - .7) / .8);
  them(t, { 0: { p: [lerp(2.4, 4.6, eOut(fly)), fly > 0 ? Math.sin(fly * Math.PI) * .6 : 0, lerp(2.1, 2.5, fly)], rx: hit ? -30 * Math.min(1, fly * 2) : 0, ex: hit ? 'shocked' : 'sly', blink: false, ...(hit ? up2 : hip) } });
  put(B(), CR, { p: [lerp(.4, 1.6, eIn(d)), 0, lerp(1.3, 2.0, d)], ry: 80, lean: hit ? 18 : 10, ex: 'frown', blink: false, walk: d < 1 ? { ph: lt * 16, stride: .25 } : null, ...(hit ? { hR: [.15, .95, .9], pR: [1, -.4, 0], hL: [-.3, .5, .2], pL: [-1, 0, -.5] } : runA(lt * 16)) }); muscle(1);
  Wd.auraCol(1, '#ff4a3a'); Wd.auraAt(1, WR(lerp(.4, 1.6, eIn(d)), 1.1, 2.0), 2.2, .22); if (lt > .7 && lt < 1.1) { SH.a = .8; Wd.flash(lt < .8 ? .1 : 0); }
  const u = U(lt, 2.9, eSine); camR([.2, 1.4, -2.2], [2.4, .9, 2.2], [.6, 1.4, -2.0], [2.8, .9, 2.2], u, 50); dof(.15);
});
S2('E22', 71.0, 'cut', (lt, t) => { // "เอซใช้ความเร็วหลบการโจมตี"
  rm(); redRoom(.4); const sw = Math.floor(lt * 1.6) % 2, ph = (lt * 1.6) % 1, dodge = sstep(0, .25, ph);
  put(IV(1), CR, { p: [1.9, 0, 3.6], ry: -95, lean: 15, ex: 'frown', blink: false, ...(ph < .4 ? { hR: [.15, .9, .95], pR: [1, -.4, 0], hL: [-.3, .5, .2], pL: [-1, 0, -.5] } : fist) });
  const az = sw ? lerp(3.6, 4.4, dodge) : lerp(4.4, 3.0, dodge); put(A(), CR, { p: [.9, 0, az], ry: 95, lean: 10, rz: (sw ? -15 : 15) * (1 - dodge), ex: 'confident', blink: blinkAt(t, 4), ...hip });
  [0, 1, 2].forEach(i => Wd.streakAt(i, WR(.9, .6 + i * .35, az + (sw ? -.6 : .6)), 90, .9, (1 - dodge) * .6)); Wd.auraCol(1, '#3af08a'); Wd.auraAt(1, WR(.9, .9, az), 1.5, .3);
  const u = U(lt, 2.55, eSine); camR([-1.9, 1.4, 3.9], [1.4, .9, 3.7], [-1.7, 1.4, 3.85], [1.4, .9, 3.7], u, 46); dof(.2);
});
S2('E23', 73.55, 'cut', (lt, t) => { // "ส่วนนีโอรีบสร้างโล่จากเศษเหล็ก"
  rm(); redRoom(.4); const k = sstep(.1, 1.6, lt), hitT = lt > 1.9 && lt < 2.2; put(N(), CR, { p: [-.9, 0, .5], ry: 75, ex: k > .9 ? 'confident' : 'scared', sweat: k < .9, blink: false, hL: [-.2, .8, .5], hR: [.2, .8, .5], pL: [-1, -.4, 0], pR: [1, -.4, 0] });
  Wd.scrapAt(WR(-.2, 1.0, .7), 75, k, t, 1.25); Wd.auraCol(1, '#ffd23a'); Wd.auraAt(1, WR(-.2, 1.0, .7), 1.6, .2 + (hitT ? .3 : 0));
  put(IV(2), CR, { p: [lerp(2.6, .7, sstep(.8, 1.9, lt)), 0, .85], ry: -85, lean: 15, walk: lt < 1.9 ? { ph: lt * 12, stride: .2 } : null, ex: lt > 2.0 ? 'shocked' : 'frown', blink: false, ...(lt > 1.6 ? { hR: [.15, .9, .95], pR: [1, -.4, 0], hL: [-.3, .5, .2], pL: [-1, 0, -.5] } : fist) }); if (hitT) { SH.a = .5; }
  const u = U(lt, 2.75, eSine); camR([-2.7, 1.5, 3.5], [.2, .9, .6], [-2.6, 1.5, 3.3], [.2, .9, .6], u, 52); dof(.2);
});
S2('E24', 76.3, 'cut', (lt, t) => { // "แต่ฝ่ายตรงข้ามกลับมีคนหนึ่งที่สามารถสร้างกำแพงหิน"
  rm(); redRoom(.4); const b3 = IV(4), k = sstep(.4, 1.4, lt); put(b3, CR, { p: [3.8, 0, 1.9], ry: -90, ex: 'sly', blink: blinkAt(t, 9), hipY: -.15 * k, lean: 10 * k, hR: [.25, lerp(.95, .2, k), .5], pR: [1, -.4, 0], hL: [-.3, .36, .12], pL: [-1, 0, -.5] });
  Wd.auraCol(1, '#d0a060'); Wd.auraAt(1, WR(3.6, .3, 1.9), 2.4, .5 * k); if (k > .9 && lt < 2.0) SH.a = .3; const u = U(lt, 2.5, eOut); camR([1.2, .9, 1.2], [3.8, 1.0, 1.9], [1.4, .9, 1.35], [3.8, 1.0, 1.9], u, 42); dof(.4);
});
S2('E25', 78.8, 'whip', (lt, t) => { // "ขึ้นมาจากพื้นได้": the wall rises, Bruno's punch bounces
  rm(); redRoom(.4); const w = eOut(sstep(0, .7, lt)); Wd.rwallAt([2.8, 0, 1.9], 90, w); XA.rubble.visible = true; XA.rubble.position.set(5.6, 0, 3.4); XA.rubble.scale.setScalar(.35);
  put(IV(4), CR, { p: [3.8, 0, 1.9], ry: -90, ex: 'sly', hipY: -.15, lean: 10, hR: [.25, .2, .5], pR: [1, -.4, 0], hL: [-.3, .36, .12], pL: [-1, 0, -.5] });
  const pk = sstep(1.0, 1.4, lt), bk = sstep(1.4, 1.8, lt); put(B(), CR, { p: [lerp(1.2, 2.0, pk) - bk * .5, 0, 1.9], ry: 90, lean: 15 - bk * 15, ex: bk > 0 ? 'shocked' : 'frown', blink: false, ...(pk > .5 ? { hR: [.15, .95, .9], pR: [1, -.4, 0], hL: [-.3, .5, .2], pL: [-1, 0, -.5] } : fist) }); muscle(1);
  if (lt < .7 || (lt > 1.35 && lt < 1.7)) SH.a = .55; if (lt > 1.35 && lt < 1.45) Wd.flash(.08); const u = U(lt, 2.5, eSine); camR([-.6, 1.6, -1.2], [2.4, 1.0, 1.9], [-.4, 1.6, -1.1], [2.4, 1.0, 1.9], u, 50); dof(.15);
});
S2('E26', 81.3, 'cut', (lt, t) => { // "ไครมองเห็นจุดอ่อนของพลังนั้นทันที": the weak point under his feet
  rm(); redRoom(.3); Wd.rwallAt([2.8, 0, 1.9], 90, 1); put(IV(4), CR, { p: [3.8, 0, 1.9], ry: -90, ex: 'sly', hipY: -.15, lean: 10, hR: [.25, .2, .5], pR: [1, -.4, 0], hL: [-.3, .36, .12], pL: [-1, 0, -.5] });
  if (lt < 1.2) { put(K(), CR, { p: [-.7, 0, 2.6], ry: 90, ex: 'determined', blink: false, ...hip }); eyeGlow(sstep(.1, .6, lt), t); const u = U(lt, 1.2, eIn); camR([.9, 1.35, 3.1], [-.7, 1.25, 2.6], [.7, 1.35, 3.05], [-.7, 1.28, 2.6], u, 38); dof(.5); return; }
  POST.sat = .7; const l2 = lt - 1.2; Wd.retAt(WR(3.8, .03, 1.9), .9, sstep(0, .5, l2), t, true); const p = Wd.pts[1]; p.position.set(-297, -2, 1); p.color.set('#4ab8ff'); p.intensity = 4; p.distance = 10;
  const u = U(l2, 1.8, eSine); camR([3.2, 3.0, -.4], [3.7, .2, 1.9], [3.3, 2.9, -.2], [3.7, .2, 1.9], u, 48);
});
S2('E27', 84.3, 'cut', (lt, t) => { // "บรูโน่ อย่าโจมตีกำแพง โจมตีพื้นใต้เท้าเขา"
  rm(); redRoom(.3); Wd.rwallAt([2.8, 0, 1.9], 90, 1); put(K(), CR, { p: [.0, 0, 2.7], ry: 60, ex: 'frown', talk: talkAt(t), blink: blinkAt(t, 1), ...(lt > 2 ? { hR: [.2, .3, .8], pR: [1, -.6, 0], hL: [-.3, .36, .12], pL: [-1, 0, -.5] } : pointR) }); eyeGlow(.6, t);
  put(B(), CR, { p: [1.1, 0, 1.8], ry: lt > 1.0 ? -130 : 90, ex: lt > 1.0 ? 'shocked' : 'frown', blink: blinkAt(t, 2), ...fist }); muscle(1);
  const u = U(lt, 4.25, eSine); camR([.6, 1.45, 4.7], [.45, 1.1, 2.3], [.55, 1.45, 4.4], [.45, 1.1, 2.3], u, 58); dof(.2);
});
S2('E28', 88.55, 'whip', (lt, t) => { // "บรูโน่ทำตามจนคู่ต่อสู้เสียหลัก"
  rm(); redRoom(.3); const hit = lt > .55, k = clamp((lt - .55) / .9); Wd.rwallAt([2.8, 0, 1.9], 90, 1 - eOut(clamp((lt - .6) / .6)));
  put(B(), CR, { p: [2.2, 0, 1.0], ry: 60, ex: 'frown', blink: false, ...(hit ? crouch : {}), ...(hit ? { hR: [.2, -.3, .7], pR: [1, -.4, 0], hL: [-.3, .36, .12], pL: [-1, 0, -.5] } : up2) }); muscle(1);
  put(IV(4), CR, { p: [3.8 + k * .3, 0, 1.9], ry: -90, rz: 70 * eIn(k), ex: hit ? 'scared' : 'sly', blink: false, ...(hit ? up2 : hip) });
  XA.rubble.visible = hit; XA.rubble.position.set(3.2, 0, 1.6); XA.rubble.scale.setScalar(.25 + .1 * k); if (hit && lt < 1.3) { SH.a = .9; Wd.flash(lt < .65 ? .1 : 0); }
  const u = U(lt, 2.8, eSine); camR([.4, 2.6, -1.6], [3.0, .6, 1.8], [.6, 2.5, -1.4], [3.0, .6, 1.8], u, 52); dof(.15);
});
S2('E29', 91.35, 'cut', (lt, t) => { // "และทีมของพวกเขาก็สามารถขับไล่ผู้บุกรุกได้สำเร็จ"
  rm(); redRoom(.2); INV.forEach(([x, z], i) => { const C = IV(i), k = clamp((lt - i * .2) / 1.6); put(C, CR, { p: [lerp(x, 6.8, eIn(k)), 0, lerp(z, 3.6, k)], ry: 80, walk: { ph: lt * 12 + i, stride: .2 }, ex: 'scared', sweat: true, blink: false, ...runA(lt * 12 + i) }); C.g.visible = k < .98; });
  XA.doorP.rotation.y = -1.6; us(t, { krai: { p: [.6, 0, 2.6], ex: 'calm' }, bruno: { p: [1.2, 0, .3], ry: 60, ex: 'happy', ...up2 }, ace: { p: [1.6, 0, 3.4], ex: 'happy' }, neo: { p: [.9, 0, 3.0], ex: 'happy' } }); muscle(1);
  const u = U(lt, 3.9, eSine); camR([-2.2, 2.2, .2], [3.0, 1.0, 2.6], [-2.0, 2.2, .4], [3.4, 1.0, 2.8], u, 52); dof(.15);
});
// --- the new message ---
S2('E30', 95.25, 'cut', (lt, t) => { // "แต่เมื่อทุกคนกลับเข้าห้อง"
  rm(); Wd.screen('off'); XA.doorP.rotation.y = -1.6 * (1 - sstep(1.6, 1.95, lt)); const k = clamp(lt / 1.7);
  [K, B, A, N].forEach((C, i) => put(C(), CR, { p: [lerp(5.8 - i * .4, 3.0 - i * .7, k), 0, lerp(3.6, 2.6 - (i % 2) * .7, k)], ry: -110, walk: k < 1 ? { ph: lt * 7 + i, stride: .12 } : null, ex: i === 1 ? 'confident' : 'calm', blink: blinkAt(t, i + 1), ...hip }));
  const u = U(lt, 1.95, eSine); camR([.2, 1.6, 4.6], [3.0, 1.1, 2.4], [.4, 1.6, 4.4], [2.6, 1.1, 2.2], u, 50); dof(.15);
});
S2('E31', 97.2, 'cut', (lt, t) => { // "หน้าจอกลับแสดงข้อความใหม่"
  rm(); const g = lt < .9; Wd.screen(g ? 'glitch' : 'target', g ? Math.floor(lt * 14) : 0, 0, .5); if (!g) redRoom(.6 * sstep(.9, 1.4, lt));
  team(t, { b: { p: [-1.5, 0, .9], ry: 180, ex: 'shocked' }, n: { p: [1.5, 0, .8], ry: 170, ex: 'worried' }, a: { p: [-.5, 0, 1.3], ry: 190, ex: 'shocked' } }); put(K(), CR, { p: [.6, 0, 1.2], ry: 180, ex: 'frown', ...hip });
  const u = U(lt, 2.3, eSine); camR([.6, 1.6, 5.0], [0, 1.8, -4.8], [.4, 1.6, 4.4], [0, 1.9, -4.8], u, 52);
});
S2('E32', 99.5, 'cut', (lt, t) => { // "ห้องหมายเลข 07 ถูกจัดอยู่ในกลุ่มเป้าหมายระดับสูง"
  rm(); Wd.screen('target', t > 100.9 ? 1 : 0, 0, .6); redRoom(.7 + .3 * Math.sin(t * 5)); team(t, { b: { p: [-1.5, 0, .9], ry: 180, ex: 'shocked' }, n: { p: [1.5, 0, .8], ry: 170, ex: 'scared', sweat: true }, a: { p: [-.5, 0, 1.3], ry: 190, ex: 'shocked' } }); put(K(), CR, { p: [.6, 0, 1.2], ry: 180, ex: 'frown', ...hip });
  scrShot2(lt, 4.2);
});
S2('E33', 103.7, 'cut', (lt, t) => { // "เกมนี้เพิ่งเริ่มต้นเท่านั้น": Krai at the window, the giant passes outside
  rm({}, true); Wd.screen('target', 1, 0, .5); redRoom(.5); put(K(), CR, { p: [-3.4, 0, 2.2], ry: 90, ex: 'determined', blink: blinkAt(t, 1), ...hip }); eyeGlow(sstep(1.6, 2.6, lt) * .7, t);
  Wd.monAt([-17 - 300, -42.5, 12 - lt * 5], 180, lt * 2.2, .9, { s: 1.08, hy: -50 });
  const u = U(lt, 3.84, eIn); camR([-.8, 1.4, 2.6], [-3.6, 1.55, 2.2], [-1.6, 1.38, 2.4], [-3.6, 1.5, 2.2], u, 44); dof(.25);
});
export const COVER = { id: 'COVER', t0: 0, fn: (lt, t, o = {}) => {
  rm(); redRoom(.5); Wd.screen('detect', 1, 0, .3);
  put(B(), CR, { p: [.2, 0, 1.45], ry: 80, lean: 8, ex: 'frown', ...fist }); muscle(1); Wd.auraCol(1, '#ff4a3a'); Wd.auraAt(1, WR(.2, 1.1, 1.45), 2.4, .3);
  put(K(), CR, { p: [1.0, 0, 2.2], ry: 90, ex: 'determined', blink: false, ...hip }); eyeGlow(.6, 2);
  put(N(), CR, { p: [.2, 0, 2.95], ry: 100, ex: 'determined', hL: [-.2, .8, .5], hR: [.2, .8, .5], pL: [-1, -.4, 0], pR: [1, -.4, 0] }); Wd.scrapAt(WR(.8, .7, 3.2), 100, 1, 2, .5);
  put(A(), CR, { p: [-.6, 0, 2.3], ry: 90, ex: 'confident', ...hip });
  const cm = o.cam || [3.7, 1.25, 2.2], g = o.tgt || [.5, 1.05, 2.2]; camR(cm, g, cm, g, 0, o.fov || 50);
} };

export function initShots(timing) { TM.env = timing.env; for (let i = 0; i < SHOTS.length; i++) SHOTS[i].t1 = i + 1 < SHOTS.length ? SHOTS[i + 1].t0 : timing.end; }
export function runShot(sh, t) { reset(t); POST.vig = .45; sh.fn(t - sh.t0, t); }
let benchFloor = null;
export const BENCH = { id: 'BENCH', t0: 0, fn: (lt, t, o = {}) => {
  Wd.applyLight(o.light || 'day'); Wd.setScene('none'); Wd.hideSea3();
  if (!benchFloor) { benchFloor = group({ parent: scene }); }
  benchFloor.clear(); benchFloor.visible = true;
  const ids = (o.ids || Object.keys(CHARS)), n = ids.length, gap = .8, per = n <= 3 ? n : Math.ceil(n / Math.ceil(n / 3)), rows = Math.ceil(n / per);
  const ex = o.ex || ['neutral', 'sly', 'confident', 'sneaky', 'happy', 'shocked', 'worried', 'calm', 'sad'];
  const wood = toon('#d9b88a');
  for (let r = 0; r < rows; r++) { const k = rows - 1 - r, y = k * 1.35, z = -k * 1.1; mesh(new THREE.BoxGeometry(per * gap + .5, y + .3, 1.0), wood, { p: [0, (y - .3) / 2, z], cast: false, parent: benchFloor }); }
  ids.forEach((id, i) => { const r = Math.floor(i / per), k = rows - 1 - r, inRow = Math.min(per, n - r * per), j = i - r * per;
    put(CHARS[id], scene, { p: [(j - (inRow - 1) / 2) * gap, k * 1.35, -k * 1.1], ry: o.ry ?? 0, ex: ex[i % ex.length], head: [0, 0, 0] }); });
  const d = Math.max(4.5, (per * gap / 2 + .35) / Math.tan(11 * D2R)), cy = ((rows - 1) * 1.35 + 1.25) / 2;
  const c = o.cam || [0, cy + .4, d], g = o.tgt || [0, cy, -(rows - 1) * .55]; camW(c, g, c, g, 0, o.fov || 40);
  Wd.setShadowFocus(0, cy, 0, 4);
} };
