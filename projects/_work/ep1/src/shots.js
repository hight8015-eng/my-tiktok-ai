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
// power stones from ep2 on (5 red fist / 6 green wind / 7 yellow gear / 8 blue eye) and the powers they give
const ST = { bruno: 5, ace: 6, neo: 7, krai: 8 };
const hold = (C, i, t, k = 1.6, h = [0, .33, .42]) => { Wd.stoneAt(i, [0, 0, 0], t, k); propAt(XA.stones[i], C, h); };
const muscle = (k) => { B().g.scale.setScalar(B().spec.s * (1 + .14 * k)); };
const headW = (C, off = [0, 0, 0]) => { scene.updateMatrixWorld(); const v = new THREE.Vector3(); C.head.getWorldPosition(v); return [v.x + off[0], v.y + off[1], v.z + off[2]]; };
const eyeGlow = (k, t) => { Wd.auraCol(0, '#4ab8ff'); Wd.auraAt(0, headW(K(), [0, .1, 0]), .6 + .08 * Math.sin(t * 8), .32 * k); };
// =====================================================================
export const SHOTS = [];
const S = (id, t0, tr, fn, o = {}) => SHOTS.push({ id, t0, tr, fn, ...o });
// ===================== EP 1 (105.86 s) =====================
const KIDS = [[-1.3, -.8], [1.4, -.5], [-2.4, -2.0], [2.5, -1.8]];
S('A01', 0, 'cut', (lt, t) => { // class is over: students walk out ("ในขณะที่นักเรียนกำลังเดินออกจากห้องเรียนหลังหมดคาบ")
  school(); const z = -7 + lt * 1.0; put(K(), SC, { p: [0, 0, z], ry: 0, walk: { ph: lt * 7, stride: .12 }, ex: 'calm', blink: blinkAt(t, 1), ...hip });
  KIDS.forEach(([x, dz], i) => put(STU(i), SC, { p: [x, 0, z + dz], ry: i % 2 ? -8 : 8, walk: { ph: lt * 7 + i, stride: .12 }, ex: ['happy', 'confident', 'neutral', 'happy'][i], talk: i < 2 ? (Math.sin(t * 9 + i) > .3 ? .5 : 0) : 0, blink: blinkAt(t, i + 2), ...hip }));
  const u = U(lt, 3.8, eSine); camS([1.4, 1.5, z + 5.6], [0, 1.2, z - 1], [.8, 1.4, z + 4.9], [0, 1.2, z - 1], u, 42); dof(.2);
});
S('A02', 3.75, 'cut', (lt, t) => { // a roar of helicopters: everybody looks up ("จู่ ๆ เสียงเฮลิคอปเตอร์จำนวนมาก ก็ดังขึ้นเหนือโรงเรียน")
  school(); const z = -3.3, up = sstep(.2, .8, lt); SH.a = .15 + up * .2;
  put(K(), SC, { p: [0, 0, z], ry: 0, ex: lt > .5 ? 'shocked' : 'calm', blink: false, head: [-28 * up, 0, 0], ...hip });
  KIDS.forEach(([x, dz], i) => put(STU(i), SC, { p: [x, 0, z + dz], ry: i % 2 ? -10 : 10, ex: lt > .6 ? ['scared', 'shocked', 'worried', 'shocked'][i] : 'neutral', blink: false, head: [-25 * sstep(.3 + i * .1, .9 + i * .1, lt), (i % 2 ? 10 : -10), 0], ...(i === 0 ? hug : hip) }));
  for (let i = 0; i < 3; i++) Wd.heliAt(i, [300 + (i - 1) * 9, 21 + i * 2, -24 + lt * 6 + i * 3], 180, t, .12);
  const u = U(lt, 2.2, eSine); camS([0, .55, 1.4], [0, 3.2, -5], [0, .6, 1.0], [0, 3.6, -5], u, 52); dof(.15);
});
S('A03', 5.95, 'cut', (lt, t) => { // the helicopters sweep over the school roof
  school(); SH.a = .25; for (let i = 0; i < 3; i++) Wd.heliAt(i, [300 + (i - 1) * 10, 15 + i * 1.5, -32 + lt * 6 + i * 3], 180 + (i - 1) * 6, t, .1);
  const u = U(lt, 2.6, eSine); camS([4, 1.2, 10], [0, 11, -16], [3, 1.2, 9], [0, 12, -14], u, 50);
});
S('A04', 8.55, 'whip', (lt, t) => { // not bombs: a school desk tumbles out ("แต่สิ่งที่พวกมันปล่อยลงมา ไม่ใช่ระเบิด")
  school(); SH.a = .2; Wd.heliAt(0, [300, 22, -4], 180, t, .05); Wd.heliAt(1, [312, 24, -10], 170, t, .05); deskFall(0, 0, -4, 8.55 + .7, t, { h0: 19.5, s: 1.3 });
  const u = U(lt, 2.9, eSine); camS([3, 1.6, 9], [0, 15, -4], [2.6, 1.6, 8.4], [0, 13, -4], u, 50);
});
const RAIN = [[-3, -2, 11.7], [4, -5, 11.9], [2.6, 4.2, 12.2], [-5, 3, 12.4], [6, 1, 12.6], [-1, -6, 12.8], [3, 5, 13.0], [-6, -4, 13.3], [2, -1, 13.5]];
const rain = (t) => RAIN.forEach(([x, z, t0], i) => deskFall(i, x, z, t0, t, { h0: 22 }));
S('A05', 11.75, 'cut', (lt, t) => { // desks rain down on the courtyard ("กลับเป็นโต๊ะเรียนจำนวนมหาศาล")
  school(); rain(t); SH.a = .25; for (let i = 0; i < 3; i++) Wd.heliAt(i, [300 + (i - 1) * 12, 20, -6 + i * 4], 180, t, .05);
  KIDS.forEach(([x, dz], i) => { const k = lt * 2.2; put(STU(i), SC, { p: [x * (1 + lt * .35), 0, -2 + dz + (i % 2 ? k : -k) * .3], ry: x < 0 ? -60 : 60, walk: { ph: lt * 13 + i, stride: .2 }, ex: 'scared', blink: false, ...runA(lt * 13 + i) }); });
  const u = U(lt, 2.9, eSine); camS([7, 5.5, 15], [0, 3.5, -2], [6, 5, 14], [0, 3.5, -2], u, 52);
});
S('A06', 14.65, 'cut', (lt, t) => { // Krai freezes ("ก่อนที่ทุกคนจะทันตั้งตัว")
  school(); rain(t); SH.a = .2; put(K(), SC, { p: [.4, 0, 1.6], ry: -10, ex: 'shocked', sweat: true, blink: false, head: [-10, 0, 0], ...hug });
  const u = U(lt, 2.1, eOut); camS([.2, 1.35, 4.3], [.4, 1.25, 1.6], [.25, 1.35, 3.8], [.4, 1.25, 1.6], u, 40); dof(.5);
});
S('A07', 16.75, 'cut', (lt, t) => { // dozens of strangers rappel down ("ชายแปลกหน้าหลายสิบคน ก็โรยตัวลงมาจากเฮลิคอปเตอร์")
  school(); rain(t); SH.a = .12; Wd.heliAt(0, [300, 14, -3], 180, t, 0); Wd.heliAt(1, [312, 16, -9], 170, t, 0);
  [[-1.2, -3.1, 0], [1.2, -3.1, .5], [-.4, -2.0, 1.0]].forEach(([x, z, d], i) => { const y = Math.max(0, 12.2 - Math.max(0, lt - d) * 4.2); Wd.ropeAt(i, [300 + x, 12.4, z], 12.4); put(TR(i), SC, { p: [x, y, z + .25], ry: 180 + (i - 1) * 20, ex: 'frown', blink: false, ...(y > 0 ? up2 : hip), fL: y > 0 ? [-.1, -.5, .1] : undefined, fR: y > 0 ? [.12, -.6, -.05] : undefined }); });
  const u = U(lt, 4.3, eSine); camS([5, 2.2, 9], [0, 6, -3], [4.4, 1.8, 8.2], [0, 4, -3], u, 48);
});
S('A08', 21.1, 'whip', (lt, t) => { // they chase students like madmen ("พวกมันเริ่มไล่จับนักเรียนอย่างบ้าคลั่ง")
  school(); rain(30); const x = -4 + lt * 3.2;
  put(STU(1), SC, { p: [x + 1.7, 0, 2.0], ry: 90, walk: { ph: lt * 14, stride: .22 }, ex: 'scared', blink: false, ...runA(lt * 14) }); put(STU(0), SC, { p: [x + 2.6, 0, 2.8], ry: 95, walk: { ph: lt * 14 + 1, stride: .22 }, ex: 'scared', sweat: true, blink: false, ...up2 });
  put(TR(0), SC, { p: [x, 0, 2.3], ry: 90, walk: { ph: lt * 14 + 2, stride: .24 }, ex: 'frown', blink: false, ...pointR }); put(TR(1), SC, { p: [x - 1.0, 0, 3.2], ry: 85, walk: { ph: lt * 14 + 3, stride: .24 }, ex: 'frown', blink: false, ...runA(lt * 14 + 3) });
  const u = U(lt, 3.3, eSine); camS([x + .9, 1.4, 10.5], [x + .9, 1.0, 2.5], [x + 1.3, 1.4, 10.0], [x + 1.3, 1.0, 2.5], u, 46); dof(.15);
});
S('A09', 24.35, 'cut', (lt, t) => { // Krai dashes and ducks under a fallen desk ("ไครรีบวิ่งไปหลบใต้โต๊ะที่ตกลงมา")
  school(); rain(30); heroDesk(0, 0, 0); const k = clamp(lt / 1.4), dn = sstep(1.2, 1.7, lt);
  put(K(), SC, { p: [lerp(3.2, .1, k), 0, lerp(2.6, .25, k)], ry: lerp(-60, 0, dn), walk: k < 1 ? { ph: lt * 14, stride: .22 } : null, ex: 'scared', sweat: true, blink: false, hipY: -.46 * dn, lean: 22 * dn, ...(k < 1 ? runA(lt * 14) : hug) });
  if (lt < 2) put(TR(2), SC, { p: [-3 + lt * 1.5, 0, -3], ry: 70, walk: { ph: lt * 12, stride: .22 }, ex: 'frown', ...runA(lt * 12) });
  const u = U(lt, 2.9, eSine); camS([3.6, 1.4, 5.4], [.8, .8, .5], [2.6, 1.1, 4.4], [.1, .7, .3], u, 44); dof(.2);
});
S('A10', 27.25, 'cut', (lt, t) => { // holding his breath ("พยายามกลั้นหายใจ และไม่ส่งเสียง")
  school(); rain(30); heroDesk(0, 0, 0); put(K(), SC, { p: [.1, 0, .25], ry: 0, ex: 'scared', sweat: true, blink: false, look: [Math.sin(lt * 2) * .6, 0], ...crouch, ...mouthH });
  const u = U(lt, 2.9, eSine); camS([.25, .7, 2.3], [.1, .72, .25], [.2, .7, 2.0], [.1, .72, .25], u, 40); dof(.5);
});
S('A11', 30.15, 'cut', (lt, t) => { // footsteps stop right in front of him ("แต่แล้ว เสียงฝีเท้าก็หยุดอยู่ตรงหน้าเขา")
  school(); rain(30); heroDesk(0, 0, 0); const k = clamp(lt / 2.2); put(BO(), SC, { p: [.1, 0, lerp(6, 2.0, k)], ry: 180, walk: k < 1 ? { ph: lt * 6, stride: .12 } : null, ex: 'calm', ...hip });
  SH.a = k < 1 && Math.sin(lt * 6) > .9 ? .15 : 0; const u = U(lt, 3.6, eSine); camS([.05, .38, .7], [.1, .45, 4], [.05, .36, .8], [.1, .42, 4], u, 46); dof(.2);
});
S('A12', 33.75, 'cut', (lt, t) => { // a man dressed unlike the others bends down to look ("ชายคนหนึ่งที่แต่งตัวแตกต่างจากคนอื่น ก้มลงมอง")
  school(); rain(30); heroDesk(0, 0, 0); const b = sstep(1.8, 3.2, lt); put(BO(), SC, { p: [.1, 0, 2.0], ry: 180, lean: 34 * b, hipY: -.12 * b, ex: b > .5 ? 'sly' : 'calm', blink: blinkAt(t, 5), head: [10 * b, 0, 12 * b], hR: [.3, .36, .12], pR: [1, 0, -.5], hL: [-.25, .3, .3], pL: [-1, 0, 0] });
  const u = U(lt, 4.2, eSine); camS([.05, .62, .5], [.1, 1.6, 2.0], [.05, .6, .55], [.1, 1.05, 1.9], u, 46); dof(.3);
});
S('A13', 37.95, 'cut', (lt, t) => { // the needle, then darkness ("ก่อนจะฉีดยาใส่เขาจนหมดสติ")
  school(); rain(30); heroDesk(0, 0, 0); const st = sstep(.4, .8, lt); const bo = BO();
  put(bo, SC, { p: [.7, 0, 1.6], ry: 205, lean: 30, hipY: -.12, ex: 'sly', blink: blinkAt(t, 5), hR: [.2, lerp(.6, .45, st), lerp(.5, .78, st)], pR: [1, -.4, 0], hL: [-.3, .36, .12], pL: [-1, 0, -.5] });
  XA.syr.visible = true; XA.syr.position.set(300 + lerp(.55, .4, st), lerp(1.15, .95, st), lerp(1.05, .62, st)); XA.syr.rotation.set(1.2, 0, -.3);
  put(K(), SC, { p: [.1, 0, .3], ry: 0, ex: lt > .8 ? (lt > 1.4 ? 'sleepy' : 'shocked') : 'scared', sweat: true, blink: lt > 1.7, ...crouch, ...hug });
  Wd.black(sstep(1.2, 2.3, lt)); const u = U(lt, 2.4, eSine); camS([-.7, .85, 3.1], [.15, .8, .4], [-.6, .85, 2.8], [.15, .8, .4], u, 44); dof(.3);
});
// --- THE STRANGE CLASSROOM ---
S('A14', 40.65, 'cut', (lt, t) => { // he opens his eyes ("เมื่อไครลืมตาขึ้นอีกครั้ง")
  room(); const op = sstep(.2, 1.4, lt); Wd.black(1 - op + (lt > .6 && lt < .8 ? .6 : 0)); put(K(), CR, { p: [.2, 0, 3.2], ry: 20, sit: true, seat: .05, ex: op < .8 ? 'sleepy' : 'shocked', blink: lt < .9, head: [8, 0, 10 * (1 - op)], ...hip });
  const u = U(lt, 2.3, eOut); camR([.6, 1.15, 5.0], [.2, .75, 3.2], [.5, 1.1, 4.6], [.2, .75, 3.2], u, 40); dof(.45);
});
S('A15', 42.95, 'cut', (lt, t) => { // a strange classroom ("เขากลับพบว่า ตัวเองอยู่ในห้องเรียนประหลาด")
  room(); put(K(), CR, { p: [.6, 0, 1.8], ry: lerp(30, -40, eSine(clamp(lt / 2.8))), ex: 'worried', blink: blinkAt(t, 1), head: [-8, 0, 0], ...hip });
  const u = U(lt, 3.2, eSine); camR([3.4, 2.0, 5.0], [-.2, 1.1, -.6], [3.0, 1.9, 4.8], [0, 1.1, -.8], u, 50); dof(.1);
});
S('A16', 46.05, 'cut', (lt, t) => { // three other students ("พร้อมนักเรียนอีก 3 คน")
  room(); team(t); put(K(), CR, { p: [.4, 0, 2.6], ry: 180, ex: 'worried', ...hip });
  const u = U(lt, 2.2, eSine); camR([.9, 1.6, 4.7], [0, 1.1, -1.0], [.8, 1.55, 4.4], [0, 1.1, -1.0], u, 56); dof(.15);
});
S('A17', 48.25, 'cut', (lt, t) => { // Bruno, the big guy
  room(); team(t, { b: { ex: lt > .6 ? 'confident' : 'frown', head: [-6, 0, 0] } }); const u = U(lt, 2.2, eOut); camR([-.8, 1.45, 1.3], [-1.4, 1.35, -.7], [-.85, 1.45, 1.0], [-1.4, 1.35, -.7], u, 40); dof(.45);
});
S('A18', 50.45, 'cut', (lt, t) => { // Neo, the inventor, with a blinking gadget
  room(); const n = N(); team(t, { n: { ex: 'happy', head: [16, 0, 0], hL: [-.12, .55, .45], hR: [.12, .55, .45], pL: [-1, -.4, 0], pR: [1, -.4, 0] } }); propAt(XA.gadget, n, [0, .62, .5], [-.4, n.g.rotation.y, 0]); XA.led.material.opacity = (t * 3) % 1 < .5 ? .9 : .1;
  const u = U(lt, 1.9, eOut); camR([.9, 1.35, .9], [1.4, 1.15, -.9], [.95, 1.35, .6], [1.4, 1.15, -.9], u, 40); dof(.45);
});
S('A19', 52.35, 'cut', (lt, t) => { // Ace, the athlete, bouncing a ball
  room(); const a = A(), bc = Math.abs(Math.sin(lt * 5)); team(t, { a: { ex: 'confident', hR: [.3, .2 + bc * .25, .35], pR: [1, -.3, 0] } }); scene.updateMatrixWorld(); const h = a.torso.localToWorld(V(.3, .2 + bc * .25, .35)); XA.ball.visible = true; XA.ball.position.set(h.x, lerp(-4 + .12, h.y - .14, bc), h.z);
  const u = U(lt, 2.5, eOut); camR([.3, 1.3, .3], [.1, 1.1, -2.0], [.25, 1.3, -.05], [.1, 1.1, -2.0], u, 40); dof(.45);
});
S('A20', 54.85, 'cut', (lt, t) => { // the giant screen flickers on ("ทันใดนั้น หน้าจอขนาดใหญ่ก็เปิดขึ้น")
  room(); const on = lt > .5; Wd.screen(!on ? 'off' : lt < .9 ? 'glitch' : 'boot', lt < .9 ? Math.floor(lt * 20) : Math.round(clamp((lt - .9) / 1.6) * 10) / 10, 0, on ? .5 : 0);
  team(t, { b: { ry: 180 }, n: { ry: 170, ex: 'shocked' }, a: { ry: 190, ex: 'shocked' } }); put(K(), CR, { p: [.4, 0, 1.4], ry: 180, ex: 'shocked', ...hip });
  if (lt > .5 && lt < .7) SH.a = .3; const u = U(lt, 3.5, eSine); camR([.6, 1.6, 5.0], [0, 1.8, -4.8], [.4, 1.6, 4.4], [0, 1.9, -4.8], u, 52);
});
S('A21', 58.35, 'cut', (lt, t) => { // "ยินดีต้อนรับสู่เกมเอาชีวิตรอด"
  room(); Wd.screen('welcome', 0, 0, .55); team(t, { b: { ry: 180 }, n: { ry: 170, ex: 'shocked' }, a: { ry: 190, ex: 'worried' } }); put(K(), CR, { p: [.4, 0, 1.4], ry: 180, ex: 'shocked', ...hip });
  const u = U(lt, 2.7, eSine); camR([0, 1.85, 2.4], [0, 2.0, -4.9], [0, 1.9, 2.0], [0, 2.0, -4.9], u, 56);
});
S('A22', 61.05, 'cut', (lt, t) => { // their faces in the blue light ("เป้าหมายของพวกคุณ คือเป็นห้องสุดท้ายที่ยังเหลืออยู่")
  room(); Wd.screen('goal', 0, 0, .6); team(t, { b: { p: [-1.5, 0, .2], ry: 180, ex: 'frown' }, n: { p: [1.5, 0, .1], ry: 170, ex: 'worried', sweat: true }, a: { p: [-.55, 0, .7], ry: 190, ex: 'determined' } }); put(K(), CR, { p: [.5, 0, .6], ry: 180, ex: 'determined', blink: blinkAt(t, 1), ...hip });
  const p = Wd.pts[1]; p.position.set(-300, -2.0, -3.6); p.color.set('#6ad0ff'); p.intensity = 3; XA.roomDesks.visible = false; const u = U(lt, 3.9, eSine); camR([.2, 2.3, -4.4], [0, 1.0, .5], [.15, 2.2, -4.1], [0, 1.0, .5], u, 56); dof(.15);
});
S('A23', 64.95, 'cut', (lt, t) => { // Krai walks out to look around ("ไครเดินไปสำรวจด้านนอก")
  room(); Wd.screen('goal', 0, 0, .4); const k = clamp(lt / 2.0); put(K(), CR, { p: [lerp(2.4, 4.6, k), 0, lerp(2.0, 3.6, k)], ry: 60, walk: { ph: lt * 7, stride: .12 }, ex: 'determined', ...hip }); XA.doorP.rotation.y = -1.4 * sstep(.3, 1.0, lt);
  const u = U(lt, 2.2, eSine); camR([.8, 1.4, .8], [3.8, 1.1, 3.0], [1.2, 1.4, .9], [4.4, 1.1, 3.4], u, 44); dof(.2);
});
// --- THE ROOFTOP & THE CITY ---
S('A24', 67.15, 'cut', (lt, t) => { // he steps onto the roof: crane up ("และพบว่าตัวเองอยู่ในตึกสูงใจกลางเมือง")
  city(); const k = clamp(lt / 2.6); put(K(), CT, { p: [lerp(2.9, 1.0, k), 0, lerp(-1.6, 3.6, k)], ry: -20, walk: k < 1 ? { ph: lt * 7, stride: .12 } : null, ex: 'shocked', blink: false, head: [-6, 0, 0], ...hip });
  const u = U(lt, 5.0, eIO); camC([1.0, 1.5, 7.5], [1.8, 1.0, 1.0], [6, 14, 26], [0, -4, -20], u, 46);
});
S('A25', 72.15, 'whip', (lt, t) => { // more frightening: Krai at the edge ("แต่สิ่งที่น่ากลัวกว่านั้นคือ")
  city(); put(K(), CT, { p: [1.0, 0, 4.4], ry: -30, ex: 'scared', sweat: true, blink: false, head: [12, 0, 0], ...hip }); SH.a = .1;
  const u = U(lt, 2.4, eSine); camC([-.6, 1.5, 6.8], [1.0, 1.2, 4.4], [-.4, 1.4, 6.4], [1.0, 1.2, 4.4], u, 42); dof(.3);
});
S('A26', 74.55, 'cut', (lt, t) => { // a black giant patrols between the towers
  city(); const z = -100 + lt * 4.0; Wd.monAt([15 - 300, -40, z], 180, lt * 2.2, .55, { s: 1.08, hy: Math.sin(lt * .8) * 15 }); SH.a = Math.abs(Math.sin(lt * 2.2)) > .97 ? .35 : 0;
  const u = U(lt, 4.3, eSine); camC([13, 3, -24], [15, -14, -85], [13.5, 2.5, -26], [15, -12, -85], u, 50);
});
S('A27', 78.85, 'cut', (lt, t) => { // Krai walks on, and finds strange stones ("ระหว่างทาง ไครพบหินประหลาดที่มีสัญลักษณ์แตกต่างกัน")
  city(); const k = clamp(lt / 2.2); put(K(), CT, { p: [lerp(1.0, -1.9, k), 0, lerp(3.0, 1.6, k)], ry: -100, walk: k < 1 ? { ph: lt * 7, stride: .12 } : null, ex: k < 1 ? 'worried' : 'shocked', head: [k * 20, 0, 0], blink: false, ...hip });
  [[-3.2, .9], [-2.9, 1.7], [-3.7, 1.5], [-3.4, 2.4]].forEach(([x, z], i) => Wd.stoneAt([5, 8, 6, 7][i], [x - 300, 0, z], t));
  const u = U(lt, 4.3, eSine); camC([-.4, 1.6, 6.6], [-2.2, .8, 1.6], [-1.0, 1.4, 5.8], [-2.5, .7, 1.6], u, 44); dof(.15);
});
const STONES = (t, k = 1) => [[-3.2, .9], [-2.9, 1.7], [-3.7, 1.5], [-3.4, 2.4]].forEach(([x, z], i) => Wd.stoneAt([5, 8, 6, 7][i], [x - 300, 0, z], t, i === 1 ? k : 1));
S('A28', 83.5, 'cut', (lt, t) => { // he touches one ("เมื่อสัมผัสมัน")
  city(); const r = sstep(0, .7, lt); STONES(t, 1 + r * .7); put(K(), CT, { p: [-2.1, 0, 1.75], ry: -95, ex: 'determined', blink: false, ...crouch, hR: [.25, lerp(.4, .05, r), lerp(.3, .55, r)], pR: [1, -.4, 0], hL: [-.3, .36, .12], pL: [-1, 0, -.5] });
  Wd.flash(sstep(.6, .9, lt) * .35 * (1 - sstep(.9, 1.3, lt))); const u = U(lt, 1.4, eOut); camC([-1.6, 1.3, 4.8], [-2.5, .55, 1.6], [-1.7, 1.25, 4.5], [-2.5, .55, 1.6], u, 40); dof(.4);
});
S('A29', 84.9, 'cut', (lt, t) => { // a window pops up ("หน้าจอก็ปรากฏข้อความว่า หินพลังพิเศษ ...")
  city(); STONES(t); const k = K(); put(k, CT, { p: [-2.0, 0, 2.2], ry: 20, ex: lt > 3.9 ? 'happy' : 'shocked', blink: blinkAt(t, 1), ...hug }); Wd.stoneAt(8, [0, 0, 0], t, 1.2); propAt(XA.stones[8], k, [0, .33, .42]);
  Wd.uiAt(eOut(clamp(lt / .35)), 'stone', t > 88.7 ? 1 : 0, 0, -1.6, .3); const u = U(lt, 7.5, eSine); camC([-1.4, 1.55, 6.0], [-2.0, 1.25, 2.2], [-1.6, 1.5, 5.2], [-2.0, 1.2, 2.2], u, 42); dof(.25);
});
S('A30', 92.4, 'whip', (lt, t) => { // an explosion on the tower across ("ทันใดนั้น เสียงระเบิดก็ดังขึ้นจากตึกฝั่งตรงข้าม")
  city(); const T = BOOMT(); Wd.boomAt([T.x - 300, T.top - 5, -30 + T.d / 2 + 1], Math.max(0, lt - .25) * 1.4); if (lt > .25 && lt < 1.3) SH.a = .7 * (1 - (lt - .25)); Wd.flash(lt > .25 && lt < .6 ? .35 : 0);
  put(K(), CT, { p: [.6, 0, 1.0], ry: lerp(0, 160, sstep(.4, .9, lt)), ex: 'shocked', blink: false, ...(lt > .5 ? up2 : hug) }); const p = Wd.pts[1]; p.position.set(T.x - 300, T.top - 4, -20); p.color.set('#ff9a4a'); p.intensity = lt > .25 ? 60 * Math.max(0, 1 - (lt - .25) / 2) : 0; p.distance = 80;
  const u = U(lt, 3.2, eSine); camC([1.6, 3.6, 5.4], [T.x * .8, T.top - 5, -28], [1.4, 3.6, 5.0], [T.x * .8, T.top - 5, -28], u, 46);
});
S('A31', 95.65, 'cut', (lt, t) => { // he runs back ("ไครรีบวิ่งกลับห้องพร้อมพูดว่า")
  city(); const T = BOOMT(); Wd.boomAt([T.x - 300, T.top - 5, -30 + T.d / 2 + 1], 3.2 * 1.4 + lt * .6); const k = clamp(lt / 2.6);
  put(K(), CT, { p: [lerp(.6, 2.9, k), 0, lerp(1.0, -1.8, k)], ry: 140, walk: { ph: lt * 14, stride: .22 }, ex: 'determined', blink: false, ...runA(lt * 14) });
  const u = U(lt, 3.5, eSine); camC([-1.5, 1.5, 4.6], [1.6, 1.0, -.6], [-1.0, 1.5, 3.8], [2.6, 1.0, -1.6], u, 46); dof(.15);
});
S('A32', 99.15, 'cut', (lt, t) => { // back in the room: "เราต้องเตรียมตัวให้พร้อม"
  room(); Wd.screen('goal', 0, 0, .35); const k = eOut(clamp(lt / .8)); put(K(), CR, { p: [lerp(2.2, 1.2, k), 0, lerp(-.6, -.2, k)], ry: -8, ex: 'determined', talk: talkAt(t), blink: blinkAt(t, 1), ...fist });
  put(B(), CR, { p: [-.3, 0, 2.5], ry: 160, ex: 'shocked', blink: blinkAt(t, 2), ...fold }); put(N(), CR, { p: [1.7, 0, 2.3], ry: 210, ex: 'worried', blink: blinkAt(t, 3), ...hug }); put(A(), CR, { p: [2.4, 0, 2.0], ry: 220, ex: 'calm', blink: blinkAt(t, 4), ...hip });
  const u = U(lt, 2.9, eSine); camR([0, 1.8, 4.9], [1.0, 1.2, -.2], [.2, 1.75, 4.7], [1.0, 1.2, -.2], u, 58); dof(.15);
});
S('A33', 102.05, 'cut', (lt, t) => { // "เพราะเกมนี้ไม่ได้มีแค่พวกนักเรียนที่เป็นศัตรูของเรา": the giant passes the window
  room(); put(K(), CR, { p: [-3.4, 0, 2.2], ry: 90, ex: 'determined', talk: talkAt(t), blink: blinkAt(t, 1), ...hip }); Wd.monAt([-17 - 300, -42.5, 12 - lt * 5], 180, lt * 2.2, .9, { s: 1.08, hy: -50 });
  const u = U(lt, 3.8, eIn); camR([-.8, 1.4, 2.6], [-3.6, 1.55, 2.2], [-1.6, 1.38, 2.4], [-3.6, 1.5, 2.2], u, 44); dof(.25);
});
export const COVER = { id: 'COVER', t0: 0, fn: (lt, t, o = {}) => {
  city(); Wd.monAt([10 - 300, -40, -48], 200, .6, 1, { s: 1.5, hy: 25 }); const k = K(); put(k, CT, { p: [.4, 0, 2.6], ry: 10, ex: 'determined', ...hug }); Wd.stoneAt(8, [0, 0, 0], 3, 1.3); propAt(XA.stones[8], k, [0, .45, .42]);
  put(B(), CT, { p: [-.9, 0, 1.6], ry: 20, ex: 'frown', ...fold }); put(N(), CT, { p: [1.6, 0, 1.7], ry: -15, ex: 'worried', ...hip }); put(A(), CT, { p: [.5, 0, .9], ry: 0, ex: 'confident', ...hip });
  const cm = o.cam || [.4, 1.7, 8.2], g = o.tgt || [.8, 3.4, -10]; camC(cm, g, cm, g, 0, o.fov || 52); dof(.1);
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
