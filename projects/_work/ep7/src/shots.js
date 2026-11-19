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
// ===================== EP 7 (90.58 s): the Director's truth, the countdown, the escape, the energy wall, the origin wakes =====================
const FAC = Wd.FAC, camF = camO(FAC), DI = () => CHARS.dir;
function ctrl(o = {}, lit = 1, red = 0) { Wd.setScene('none'); Wd.applyLight('roomN2', o); Wd.setNight(1); FAC.visible = true; Wd.setShadowFocus(30, 1, 300, 9); const p = Wd.pts[0]; p.position.set(30, 3.6, 301); p.color.set('#c8e0ff'); p.intensity = 1.0 * lit; p.distance = 22; night();
  if (red) { const q = Wd.pts[1]; q.position.set(30, 2.5, 298); q.color.set('#ff3a4a'); q.intensity = 4 * red; q.distance = 16; Wd.redTint(red * .12); } }
const WF = (x, y, z) => [x, y, z + 300];
const linkFrom = (C) => { scene.updateMatrixWorld(); const v = new THREE.Vector3(); C.torso.getWorldPosition(v); return [v.x, v.y + .5, v.z]; };
// control room layout: Krai held by two guards, the Director by the big screen
const KP = [29.0, 1.2], DP = [31.2, -1.2];
function held(t, o = {}) { put(K(), FAC, { p: [KP[0], 0, KP[1]], ry: 140, ex: 'frown', blink: blinkAt(t, 1), ...hug, ...(o.k || {}) }); put(TR(0), FAC, { p: [28.3, 0, 1.9], ry: 140, ex: 'frown', blink: blinkAt(t, 7), ...fold }); put(TR(1), FAC, { p: [29.8, 0, 2.0], ry: 150, ex: 'frown', blink: blinkAt(t, 8), ...fold }); }
const dir = (t, o = {}) => put(DI(), FAC, { p: [DP[0], 0, DP[1]], ry: -20, ex: 'sly', talk: talkAt(t), blink: blinkAt(t, 6), ...hip, ...o });
const outside = (t, o = {}) => { put(N(), FAC, { p: [40.4, 0, -2.5], ry: 90, ex: 'determined', sweat: true, blink: blinkAt(t, 3), hL: [-.12 + .03 * Math.sin(t * 20), .62, .45], hR: [.12, .62 + .03 * Math.sin(t * 17), .45], pL: [-1, -.4, 0], pR: [1, -.4, 0], ...(o.n || {}) });
  put(B(), FAC, { p: [38.9, 0, .2], ry: -90, ex: 'frown', blink: blinkAt(t, 2), ...fist, ...(o.b || {}) }); put(A(), FAC, { p: [39.6, 0, 1.8], ry: -110, ex: 'worried', blink: blinkAt(t, 4), ...hip, ...(o.a || {}) }); };
const OP = [15, -115];   // the origin, city coords (ground y -40)

S('G01', 0, 'cut', (lt, t) => { // "ชายชุดดำเปิดเผยชื่อของเขาว่า ไดเรกเตอร์"
  ctrl(); Wd.screen('dir', 0, 0, .45); dir(t, { ry: -20 }); held(t); const u = U(lt, 3.55, eSine); camF([33.8, 1.5, 2.8], [31.0, 1.3, -1.0], [33.4, 1.5, 2.5], [31.0, 1.3, -1.0], u, 50); dof(.15);
});
S('G02', 3.55, 'cut', (lt, t) => { // "และอธิบายว่า เกมทั้งหมดนี้เป็นการทดลอง"
  ctrl(); Wd.screen('dir', 0, 0, .45); dir(t, { ...(lt % 2.4 < 1.2 ? offerR : hip) }); held(t, { k: { ex: 'shocked' } }); const u = U(lt, 3.65, eSine); camF([32.6, 1.45, 1.6], [31.2, 1.35, -1.2], [32.4, 1.45, 1.3], [31.2, 1.35, -1.2], u, 42); dof(.35);
});
S('G03', 7.2, 'cut', (lt, t) => { // "เพื่อค้นหามนุษย์ที่สามารถใช้หินพลังต้นกำเนิดได้"
  ctrl(); Wd.screen('origin', 0, 0, .5); held(t, { k: { ex: 'frown' } }); dir(t, { ry: 160, ...pointR }); const u = U(lt, 3.85, eSine); camF([28.6, 1.8, .2], [30, 1.6, -5.8], [28.8, 1.8, -.4], [30, 1.6, -5.8], u, 52);
});
S('G04', 11.05, 'cut', (lt, t) => { // "เขาเผยว่า"
  ctrl(); dir(t, { ry: -30, ex: 'sly' }); const u = U(lt, 1.35, eOut); camF([30.5, 1.35, .4], [31.2, 1.35, -1.2], [30.6, 1.35, .2], [31.2, 1.37, -1.2], u, 40); dof(.45);
});
S('G05', 12.4, 'cut', (lt, t) => { // the origin, asleep ("หินพลังทั้งหมดถูกสร้างขึ้นจากพลังของสิ่งมีชีวิตประหลาดที่เรียกว่า ออริจิน")
  city(); Wd.originAt([OP[0], -40, OP[1]], 180, 0, t, { drain: .5 }); const R = Wd.pts[1]; R.position.set(OP[0] - 300, 10, OP[1] + 40); R.color.set('#b06aff'); R.intensity = 50; R.distance = 120; const u = U(lt, 5.9, eSine); camC([20, -30, -40], [OP[0], -10, OP[1]], [22, -32, -50], [OP[0], 10, OP[1]], u, 48);
});
S('G06', 18.3, 'cut', (lt, t) => { // "ส่วนปีศาจยักษ์ที่เดินอยู่ในเมือง ก็คืออาวุธที่ใช้ควบคุมผู้เล่น"
  city(); const z = -100 + lt * 4.0; Wd.monAt([15 - 300, -40, z], 180, lt * 2.2, .9, { s: 1.08, hy: Math.sin(lt * .8) * 25 }); SH.a = Math.abs(Math.sin(lt * 2.2)) > .97 ? .35 : 0;
  const u = U(lt, 6.5, eSine); camC([13, 3, -24], [15, -14, -85], [13.5, 2.5, -26], [15, -12, -80], u, 50);
});
S('G07', 24.8, 'cut', (lt, t) => { // "ไครถามว่า แล้วทำไมต้องจับนักเรียนมาทดลอง"
  ctrl(); held(t, { k: { ex: 'frown', talk: talkAt(t), ...(lt > 1.4 ? fist : hug) } }); dir(t, { talk: 0 }); const u = U(lt, 3.7, eIn); camF([30.6, 1.4, -.2], [29.0, 1.3, 1.2], [30.4, 1.38, .1], [29.0, 1.3, 1.2], u, 42); dof(.45);
});
S('G08', 28.5, 'cut', (lt, t) => { // "ไดเรกเตอร์ตอบว่า เพราะเด็กที่มีความสามารถพิเศษ"
  ctrl(); dir(t, { ...offerR }); held(t); const u = U(lt, 3.7, eSine); camF([29.4, 1.45, 1.2], [31.2, 1.35, -1.2], [29.6, 1.45, 1.0], [31.2, 1.35, -1.2], u, 42); dof(.35);
});
S('G09', 32.2, 'cut', (lt, t) => { // "สามารถปรับตัวเข้ากับพลังเหล่านี้ได้ดีกว่าผู้ใหญ่": he walks along the monitors
  ctrl(); Wd.screen('stone', 1, 0, .4); const k = clamp(lt / 3.4); put(DI(), FAC, { p: [lerp(26.5, 33.5, k), 0, -4.2], ry: 90, walk: { ph: lt * 5, stride: .1 }, ex: 'sly', talk: talkAt(t), blink: blinkAt(t, 6), ...hip }); held(t);
  const u = U(lt, 3.7, eSine); camF([lerp(26, 32, k), 1.6, 1.4], [lerp(27, 33, k), 1.5, -4.6], [lerp(26.4, 32.4, k), 1.6, 1.2], [lerp(27.4, 33.4, k), 1.5, -4.6], u, 52); dof(.15);
});
S('G10', 35.9, 'cut', (lt, t) => { // "แต่สิ่งที่น่าตกใจที่สุดคือ"
  ctrl({}, .8); held(t, { k: { ex: 'shocked', blink: false } }); const u = U(lt, 2.5, eIn); camF([28.2, 1.35, .1], [29.0, 1.3, 1.2], [28.35, 1.35, .3], [29.0, 1.32, 1.2], u, 40); dof(.5);
});
S('G11', 38.4, 'cut', (lt, t) => { // "เกมนี้ไม่ได้มีผู้ชนะเพียงห้องเดียวอย่างที่ประกาศ"
  ctrl({}, .8); Wd.screen('goal', 0, 0, .45); if (lt > 1.6) Wd.screen('glitch', Math.floor(lt * 14), 0, .45); dir(t, { ry: -40, ex: lt > 1.6 ? 'happy' : 'sly' }); held(t, { k: { ex: 'shocked' } });
  const u = U(lt, 3.7, eSine); camF([33.4, 1.5, 2.2], [30.4, 1.5, -3.5], [33.1, 1.5, 1.9], [30.4, 1.5, -3.5], u, 52); dof(.15);
});
S('G12', 42.1, 'cut', (lt, t) => { // "ผู้เล่นที่เหลือทั้งหมดจะถูกนำไปทดลองต่อ": students led away on the monitors' side
  ctrl({}, .8, .3); [0, 1, 2, 3].forEach(i => { const k = clamp((lt - i * .3) / 3.2); put(STU(i), FAC, { p: [lerp(24, 36, k) - i * 1.2, 0, -4.3], ry: 90, walk: { ph: lt * 6 + i, stride: .12 }, ex: 'scared', sweat: true, blink: blinkAt(t, i), ...hug }); });
  put(TR(2), FAC, { p: [lerp(24, 36, clamp((lt + .6) / 3.2)) - 4.8, 0, -4.0], ry: 90, walk: { ph: lt * 6 + 5, stride: .12 }, ex: 'frown', ...fold }); const u = U(lt, 3.2, eSine); camF([29.0, 1.3, -.4], [29.0, 1.0, -4.3], [30.0, 1.3, -.4], [30.0, 1.0, -4.3], u, 54); dof(.2);
});
S('G13', 45.3, 'cut', (lt, t) => { // "ส่วนผู้ที่ไม่ผ่านการคัดเลือกจะถูกกำจัดออกจากระบบ"
  ctrl({}, .6, .6); dir(t, { ry: -30, ex: 'sly', ...chin }); const u = U(lt, 4.0, eIn); camF([30.7, 1.5, .6], [31.2, 1.35, -1.2], [30.85, 1.45, .2], [31.2, 1.36, -1.2], u, 40); dof(.45);
});
S('G14', 49.3, 'cut', (lt, t) => { // "ไครแอบส่งสัญญาณให้นีโอ"
  ctrl({}, .8); const k = K(); held(t, { k: { ex: 'sneaky', hL: [-.15, .3, -.25], hR: [.15, .3, -.25], pL: [-1, 0, .5], pR: [1, 0, .5] } }); propAt(XA.comm, k, [.12, .3, -.3], [0, k.g.rotation.y, 0]); TR(0).g.visible = false; TR(1).g.visible = false; XA.commGlow.material.opacity = (t * 3) % 1 < .5 ? .9 : .2;
  const u = U(lt, 2.3, eSine); camF([28.2, .8, 2.9], [29.0, .75, 1.2], [28.3, .8, 2.7], [29.0, .75, 1.2], u, 40); dof(.45);
});
S('G15', 51.6, 'cut', (lt, t) => { // "ซึ่งกำลังพยายามเจาะระบบอยู่ด้านนอก"
  ctrl({}, .7); outside(t); const n = N(); propAt(XA.gadget, n, [0, .62, .5], [-.4, n.g.rotation.y, 0]); XA.led.material.opacity = (t * 6) % 1 < .5 ? .9 : .1; XA.cpanelGl.material.opacity = .4 + .3 * Math.sin(t * 9);
  const u = U(lt, 2.6, eSine); camF([38.0, 1.6, -1.2], [40.6, 1.1, -2.4], [38.2, 1.6, -.9], [40.6, 1.1, -2.4], u, 50); dof(.2);
});
S('G16', 54.2, 'whip', (lt, t) => { // "ทันใดนั้น หน้าจอทุกจอก็เปลี่ยนเป็นสีแดง"
  ctrl({}, .6, sstep(.2, .6, lt)); Wd.screen(lt < .3 ? 'dir' : 'destroy', 600, 0, .6); dir(t, { ry: 160, ex: 'shocked', talk: 0, ...up2 }); held(t, { k: { ex: 'shocked' } });
  const u = U(lt, 2.7, eSine); camF([33.6, 1.6, 2.9], [30, 1.6, -5.0], [33.2, 1.6, 2.5], [30, 1.6, -5.0], u, 54);
});
S('G17', 56.9, 'cut', (lt, t) => { // "ระบบเริ่มนับถอยหลัง": every billboard in the city
  city(); XA.bills.visible = true; Wd.screen('destroy', 600 - Math.floor(lt), 0, 0); const R = Wd.pts[1]; R.position.set(-300, 6, -20); R.color.set('#ff3a4a'); R.intensity = 40; R.distance = 60;
  const T = BILLT(); const u = U(lt, 2.6, eSine); camC([2, 3, 6], [T.x * .97, T.by - 1, T.z], [1.6, 3.4, 5.4], [T.x * .97, T.by, T.z], u, 34);
});
S('G18', 59.5, 'cut', (lt, t) => { // "เริ่มกระบวนการทำลายพื้นที่ทดลองในอีก 10 นาที"
  ctrl({}, .5, 1); Wd.screen('destroy', 599 - Math.floor(lt), 0, .7); const u = U(lt, 3.7, eIn); camF([30, 1.6, -1.6], [30, 1.6, -5.8], [30, 1.6, -2.6], [30, 1.6, -5.8], u, 50);
});
S('G19', 63.2, 'whip', (lt, t) => { // "ไดเรกเตอร์รีบวิ่งไปยังห้องควบคุม": he runs out, the door slams on Krai
  ctrl({}, .5, 1); Wd.screen('destroy', 595, 0, .6); const k = clamp(lt / 1.6); put(DI(), FAC, { p: [lerp(31.2, 38.5, eIn(k)), 0, lerp(-1.2, 0, k)], ry: 90, walk: { ph: lt * 12, stride: .2 }, ex: 'frown', ...runA(lt * 12) }); DI().g.visible = k < .98;
  [0, 1].forEach(i => { const q = clamp((lt - .3) / 1.6); put(TR(i), FAC, { p: [lerp(28.3 + i * 1.5, 38.5, eIn(q)), 0, lerp(1.9, 0, q)], ry: 90, walk: { ph: lt * 12 + i, stride: .2 }, ex: 'frown', ...runA(lt * 12 + i) }); TR(i).g.visible = q < .98; });
  put(K(), FAC, { p: [KP[0], 0, KP[1]], ry: 90, ex: 'determined', blink: blinkAt(t, 1), ...hip }); const u = U(lt, 2.6, eSine); camF([26.4, 1.5, 3.4], [34.0, 1.2, .2], [26.8, 1.5, 3.2], [35.0, 1.2, .2], u, 50); dof(.15);
});
S('G20', 65.8, 'cut', (lt, t) => { // "แต่ไครใช้พลังใหม่เชื่อมโยงความสามารถกับบรูโน่และเอซ": beams through the door
  ctrl({}, .5, .8); Wd.screen('destroy', 593, 0, .5); put(K(), FAC, { p: [33.6, 0, .4], ry: 90, ex: 'determined', blink: false, ...offerR }); eyeGlow(sstep(.1, .6, lt), t); outside(t, { b: { ex: 'shocked' }, a: { ex: 'shocked' } }); muscle(sstep(1.2, 2.4, lt));
  const s = linkFrom(K()); Wd.linkAt(0, s, linkFrom(B()), sstep(.6, 1.2, lt), '#ff4a3a'); Wd.linkAt(1, s, linkFrom(A()), sstep(1.0, 1.6, lt), '#3af08a');
  const u = U(lt, 3.2, eSine); camF([31.4, 2.0, 4.2], [35.2, 1.1, .2], [31.6, 1.9, 3.9], [35.2, 1.1, .2], u, 58);
});
S('G21', 69.0, 'whip', (lt, t) => { // "บรูโน่ทำลายประตู"
  ctrl({}, .5, .8); const k = eOut(clamp((lt - .5) / .5)); Wd.doorBreak(k); if (lt > .5 && lt < 1.1) { SH.a = .9; Wd.flash(.1); }
  put(B(), FAC, { p: [lerp(39.0, 37.8, sstep(.2, .5, lt)), 0, .1], ry: -90, lean: 18, ex: 'frown', blink: false, ...(lt > .4 ? { hR: [.15, .95, .9], pR: [1, -.4, 0], hL: [-.3, .5, .2], pL: [-1, 0, -.5] } : fist) }); muscle(1); Wd.auraCol(1, '#ff4a3a'); Wd.auraAt(1, WF(38.2, 1.1, .1), 2.4, .3);
  put(K(), FAC, { p: [33.6, 0, .4], ry: 90, ex: lt > 1 ? 'happy' : 'determined', ...hip }); eyeGlow(.5, t); const u = U(lt, 2.3, eSine); camF([34.4, 1.3, 3.6], [37.2, 1.2, .1], [34.6, 1.3, 3.3], [37.2, 1.2, .1], u, 52); dof(.15);
});
S('G22', 71.3, 'cut', (lt, t) => { // "ส่วนเอซพุ่งเข้าไปช่วยนีโอ"
  ctrl({}, .5, .8); Wd.doorBreak(1); const d = clamp(lt / .6), hit = lt > .6, fly = clamp((lt - .6) / .7);
  put(TR(2), FAC, { p: [40.0, 0, lerp(-1.2, -4.8, eOut(fly))], ry: hit ? 0 : 180, rx: hit ? -25 * Math.min(1, fly * 2) : 0, ex: hit ? 'shocked' : 'frown', blink: false, ...(hit ? up2 : pointR) });
  put(A(), FAC, { p: [lerp(39.8, 40.1, d), 0, lerp(2.4, -.6, eIn(d))], ry: 180, lean: 22, ex: 'determined', blink: false, walk: d < 1 ? { ph: lt * 24, stride: .3 } : null, ...(hit ? { hR: [.15, .95, .9], pR: [1, -.4, 0], hL: [-.3, .5, .2], pL: [-1, 0, -.5] } : runA(lt * 24)) });
  [0, 1, 2].forEach(i => Wd.streakAt(i, WF(40.0, .6 + i * .3, lerp(2.4, -.6, d) + 1 + i * .2), 90, 1.4, d < 1 ? .5 - i * .1 : 0)); if (lt > .6 && lt < .9) SH.a = .5;
  put(N(), FAC, { p: [40.4, 0, -2.5], ry: lt > 1 ? 0 : 90, ex: lt > 1 ? 'happy' : 'scared', sweat: lt < 1, ...hug }); const u = U(lt, 3.2, eSine); camF([37.6, 1.4, -2.6], [40.2, 1.0, -.8], [37.7, 1.4, -2.3], [40.2, 1.0, -.8], u, 56); dof(.15);
});
S('G23', 74.5, 'cut', (lt, t) => { // "ทั้งสี่คนสามารถหนีออกมาได้สำเร็จ"
  ctrl({}, .5, .9); Wd.doorBreak(1); [K, B, A, N].forEach((C, i) => put(C(), FAC, { p: [39.3 + (i % 2) * .8, 0, lerp(-1.5, 5.4, clamp((lt - i * .15) / 2.4)) - i * .5], ry: 0, walk: { ph: lt * 13 + i, stride: .22 }, ex: 'determined', blink: blinkAt(t, i + 1), ...runA(lt * 13 + i) })); muscle(1);
  const u = U(lt, 2.6, eSine); camF([39.7, 1.3, 5.6], [39.7, 1.1, 0], [39.7, 1.35, 5.8], [39.7, 1.1, 1.0], u, 54); dof(.15);
});
// --- out on the street: the wall, the origin ---
const STR = (x, z) => [x, -40, z];
S('G24', 77.1, 'cut', (lt, t) => { // "แต่เมื่อมาถึงทางออก"
  city(); Wd.ewallAt(sstep(1.6, 2.8, lt) * .6, t); const k = clamp(lt / 2.0); [K, B, A, N].forEach((C, i) => put(C(), CT, { p: STR(13.6 + (i % 2) * 1.2, lerp(-48, -54, k) - i * .7), ry: 180, walk: k < 1 ? { ph: lt * 12 + i, stride: .2 } : null, ex: k < 1 ? 'determined' : 'shocked', blink: blinkAt(t, i + 1), ...(k < 1 ? runA(lt * 12 + i) : hug) })); muscle(1);
  const u = U(lt, 2.9, eSine); camC([15.6, -38.6, -60.5], [14.2, -39, -50], [15.2, -38.8, -59.5], [14.2, -39, -50], u, 50); dof(.15);
});
S('G25', 80.0, 'cut', (lt, t) => { // "พวกเขากลับพบว่า เมืองทั้งเมืองกำลังถูกปิดล้อมด้วยกำแพงพลังงานขนาดยักษ์"
  city(); Wd.ewallAt(.6 + .4 * sstep(0, 1.5, lt), t); XA.gate.visible = true; Wd.originAt([OP[0], -40, OP[1]], 180, 0, t, { drain: .2 }); [K, B, A, N].forEach((C, i) => put(C(), CT, { p: STR(13.6 + (i % 2) * 1.2, -54 - i * .7), ry: 180, ex: 'shocked', head: [-20, 0, 0], ...hug }));
  const u = U(lt, 4.2, eIO); camC([16, -37.5, -46], [15, -20, -100], [40, 60, 140], [0, -20, -40], u, 50);
});
S('G26', 84.2, 'cut', (lt, t) => { // "และตรงหน้าพวกเขา"
  city(); Wd.ewallAt(.8, t); XA.gate.visible = true; Wd.originAt([OP[0], -40, OP[1]], 180, 0, t, { drain: .3 }); [K, B, A, N].forEach((C, i) => put(C(), CT, { p: STR(13.6 + (i % 2) * 1.2, -54 - i * .7), ry: 180, ex: 'scared', sweat: true, blink: false, head: [-26, 0, 0], ...hug })); SH.a = .1;
  const u = U(lt, 1.8, eSine); camC([14.4, -39.4, -57.8], [14.2, -38.4, -53], [14.4, -39.5, -57.6], [14.2, -38.3, -53], u, 50);
});
S('G27', 86.0, 'cut', (lt, t) => { // "ออริจินกำลังลืมตาขึ้นเป็นครั้งแรก"
  city(); Wd.ewallAt(.8, t); const e = sstep(1.0, 2.6, lt); Wd.originAt([OP[0], -40, OP[1]], 180, e, t, { drain: .3 + .5 * e }); if (e > .2 && e < 1) SH.a = .3; const R = Wd.pts[1]; R.position.set(OP[0] - 300, 25, OP[1] + 30); R.color.set('#9ad8ff'); R.intensity = 80 * e; R.distance = 120;
  const u = U(lt, 4.58, eIn); camC([OP[0] + 10, 18, OP[1] + 60], [OP[0], 22, OP[1]], [OP[0] + 4, 22, OP[1] + 40], [OP[0], 24, OP[1]], u, 40);
});
export const COVER = { id: 'COVER', t0: 0, fn: (lt, t, o = {}) => {
  city(); Wd.ewallAt(.8, 2); XA.gate.visible = true; Wd.originAt([OP[0], -40, OP[1]], 180, 1, 2, { drain: .8 }); const R = Wd.pts[1]; R.position.set(OP[0] - 300, 25, OP[1] + 30); R.color.set('#9ad8ff'); R.intensity = 80; R.distance = 120;
  [K, B, A, N].forEach((C, i) => put(C(), CT, { p: STR(13.0 + i * .7, -54 - (i % 2) * .5), ry: 180, ex: 'determined', ...(i === 1 ? fist : hip) })); muscle(1);
  const cm = o.cam || [14.4, -39.2, -49.5], g = o.tgt || [15, -2, -100]; camC(cm, g, cm, g, 0, o.fov || 54);
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
