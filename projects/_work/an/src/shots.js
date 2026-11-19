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
// ===================== EP 8 (116.26 s): the origin awake, the final test, three pillars, freedom, the ship =====================
const DI = () => CHARS.dir;
const OP = [15, -115], STR = (x, z) => [x, -40, z], PIL = [[-15, -75], [45, -75], [-45, -105]];
const DAWN = { top: '#101a48', mid: '#3a3a7a', hor: '#e8845a', glow: '#ff9a5a', glowAmt: .9, sunDir: [.1, .08, -1], sunC: '#ffb890', sunI: 1.7, hemiS: '#8a8ad0', hemiG: '#3a2a40', hemiI: 1.6, fog: '#4a3a6a', stars: .4, moon: .3 };
const OHEAD = [OP[0], 22, OP[1] + 18];
const linkFrom = (C) => { scene.updateMatrixWorld(); const v = new THREE.Vector3(); C.torso.getWorldPosition(v); return [v.x, v.y + .5, v.z]; };
// the four on the street, facing the origin
const SQ = { krai: [14.4, -54.0], bruno: [13.2, -54.6], ace: [15.6, -54.6], neo: [13.4, -52.8] };
function four(t, o = {}) { const P = (k, C, ex, j, pz) => put(C, CT, { p: STR(SQ[k][0], SQ[k][1]), ry: 180, ex, blink: blinkAt(t, j), ...pz, ...(o[k] || {}) });
  P('krai', K(), 'determined', 1, hip); P('bruno', B(), 'frown', 2, fist); P('ace', A(), 'determined', 4, hip); P('neo', N(), 'worried', 3, hug); muscle(o.m ?? 1); }
function stage(t, o = {}) { city(o.light || {}); Wd.ewallAt(o.wall ?? .8, t); XA.gate.visible = true; Wd.gateAt(o.gate || 0); if (o.origin !== false) { Wd.originAt([OP[0], -40, OP[1]], 180, 1, t, { drain: o.drain ?? .5, dis: o.dis || 0, lean: o.lean || 0 }); const R = Wd.pts[1]; R.position.set(OP[0] - 300, 25, OP[1] + 30); R.color.set('#9ad8ff'); R.intensity = 70 * (1 - (o.dis || 0)); R.distance = 120; }
  PIL.forEach((_, i) => Wd.pillarAt(i, (o.alive || [1, 1, 1])[i], (o.broken || [0, 0, 0])[i], o.beams ? OHEAD : null, t)); }
const low = (u, a = [14.4, -39.2, -50.5], b = [14.6, -39.5, -51.5], tg = [15, 5, -110], fov = 54) => camC(a, tg, b, tg, u, fov);

S('H01', 0, 'cut', (lt, t) => { // "ออริจิน"
  stage(t, { drain: .7 }); SH.a = .15; const u = U(lt, 2.1, eSine); camC([16, -38.5, -40], [15, 15, -110], [16.5, -38.8, -44], [15, 18, -110], u, 56);
});
S('H02', 2.1, 'cut', (lt, t) => { // "สิ่งมีชีวิตต้นกำเนิดของหินพลัง": its crystals
  stage(t, { drain: .9 }); const u = U(lt, 1.8, eSine); camC([OP[0] + 34, 10, OP[1] + 34], [OP[0] + 10, 20, OP[1]], [OP[0] + 30, 12, OP[1] + 30], [OP[0] + 8, 24, OP[1]], u, 46);
});
S('H03', 3.9, 'cut', (lt, t) => { // "ได้ตื่นขึ้นแล้ว มันมีขนาดใหญ่กว่าปีศาจทุกตัวที่พวกเขาเคยพบ"
  stage(t, { drain: .6 }); Wd.monAt([45 - 300, -40, -85 + lt], 160, lt * 1.6, .7, { s: 1.08, hy: 30 }); const u = U(lt, 5.1, eIO); camC([90, 55, 20], [25, 0, -100], [80, 48, 10], [25, 8, -100], u, 52);
});
S('H04', 9.0, 'whip', (lt, t) => { // "และเพียงแค่ขยับตัว อาคารรอบข้างก็เริ่มสั่นสะเทือน"
  stage(t, { drain: .6, lean: Math.sin(lt * 1.5) * .1 }); SH.a = .5 + .3 * Math.sin(lt * 9); [15, 16, 17].forEach((n, i) => { const T = XA.towers[n]; if (T && T.g) T.g.rotation.set(Math.sin(lt * 8 + i) * .01, 0, Math.sin(lt * 7 + i) * .012); });
  four(t, { krai: { ex: 'shocked', ...up2 }, bruno: { ex: 'shocked' }, ace: { ex: 'scared', sweat: true }, neo: { ex: 'scared', sweat: true, ...up2 } }); const u = U(lt, 4.3, eSine); low(u, [15.2, -38.8, -50], [15.0, -38.9, -50.6], [14.4, -38.5, -56], 50); dof(.15);
});
S('H05', 13.3, 'cut', (lt, t) => { // "ไดเรกเตอร์ปรากฏตัวบนหน้าจอพร้อมประกาศว่า"
  stage(t, { drain: .5 }); four(t, { krai: { ex: 'frown', head: [-20, 0, 0] }, bruno: { head: [-20, 0, 0] }, ace: { head: [-20, 0, 0] }, neo: { head: [-20, 0, 0] } }); Wd.uiAt(eOut(clamp((lt - .3) / .4)), lt < .5 ? 'glitch' : 'dir', lt < .5 ? Math.floor(lt * 20) : Math.floor(lt * 4) % 2, 0, -1.6, .35);
  const u = U(lt, 3.8, eSine); camC([14.6, -38.9, -49.8], [14.6, -38.0, -56], [14.6, -38.9, -50.2], [14.6, -38.0, -56], u, 52);
});
S('H06', 17.1, 'cut', (lt, t) => { // "นี่คือการทดสอบสุดท้าย"
  stage(t, { drain: .5 }); Wd.uiAt(1, 'final', 0, 0, -1.4, .2); const u = U(lt, 2.2, eSine); camC([16, -38.5, -44], [15, 15, -110], [16.2, -38.4, -45], [15, 15, -110], u, 56);
});
S('H07', 19.3, 'cut', (lt, t) => { // "หากพวกเจ้าสามารถหยุดมันได้ พวกเจ้าจะได้รับอิสรภาพ"
  stage(t, { drain: .5 }); Wd.uiAt(1, 'final', 1, 0, -1.4, .2); four(t, { krai: { ex: 'determined', head: [-15, 0, 0] }, bruno: { ex: 'confident', ...fist }, ace: { ex: 'determined' }, neo: { ex: 'worried' } });
  const u = U(lt, 4.5, eSine); camC([15.0, -39.3, -59], [14.4, -38.6, -54.5], [15.0, -39.3, -58.4], [14.4, -38.6, -54.5], u, 52); dof(.2);
});
// --- Krai reads the origin ---
S('H08', 23.8, 'cut', (lt, t) => { // "ไครมองเห็นข้อมูลของออริจิน"
  stage(t, { drain: .5 }); four(t); eyeGlow(sstep(.1, .7, lt), t); Wd.uiAt(sstep(.8, 1.2, lt), 'odata', 0, 0, -2.4, -.62); const u = U(lt, 2.6, eIn); camC([14.6, -38.6, -55.6], [14.4, -38.65, -54.0], [14.55, -38.62, -55.3], [14.4, -38.65, -54.0], u, 40); dof(.4);
});
S('H09', 26.4, 'cut', (lt, t) => { // "และพบว่ามันไม่มีจุดอ่อนตามร่างกายเลย": the reticle finds nothing
  stage(t, { drain: .5 }); POST.sat = .7; const ph = Math.floor(lt * 2.2) % 4, P = [[0, 40, -100], [-12, 25, -105], [10, 55, -110], [20, 30, -100]][ph]; Wd.retAt([P[0] + OP[0] - 300, P[1] - 40 + 10, P[2]], 5, 1 - ((lt * 2.2) % 1) * .6, t, false, lt > 2.4 ? '#ff3a4a' : '#4ab8ff');
  Wd.uiAt(1, 'odata', 0, 0, -1.7, -.35); const u = U(lt, 3.2, eSine); camC([14.6, -38.6, -55.6], [15, 10, -110], [14.6, -38.6, -55.6], [15, 14, -110], u, 52);
});
S('H10', 29.6, 'cut', (lt, t) => { // "แต่มีสิ่งหนึ่งที่เขาสังเกตเห็น"
  stage(t, { drain: .6 }); four(t, { krai: { ex: 'calm', ...chin } }); eyeGlow(.7, t); const u = U(lt, 2.6, eIn); camC([13.6, -38.7, -56.0], [14.4, -38.65, -54.0], [13.8, -38.66, -55.6], [14.4, -38.65, -54.0], u, 40); dof(.45);
});
S('H11', 32.2, 'cut', (lt, t) => { // "หินพลังทั้งหมดในเมืองกำลังส่องแสงพร้อมกัน"
  stage(t, { drain: .8 }); Wd.cstonesAt(sstep(0, 1.2, lt), t); const u = U(lt, 3.7, eSine); camC([-60, 40, 80], [0, -15, -10], [-50, 46, 70], [0, -15, -20], u, 56);
});
S('H12', 35.9, 'cut', (lt, t) => { // "เขาจึงเข้าใจว่า ออริจินกำลังดูดพลังจากหินทุกก้อน เพื่อฟื้นฟูตัวเอง"
  stage(t, { drain: 1, beams: true }); Wd.cstonesAt(1, t); const u = U(lt, 5.7, eSine); camC([-25, 50, -20], [5, -5, -100], [-20, 54, -28], [5, 0, -100], u, 54);
});
// --- the plan ---
S('H13', 41.6, 'cut', (lt, t) => { // "ไครวางแผนให้นีโอสร้างเครื่องรบกวนสัญญาณ"
  stage(t, { drain: 1, beams: true }); const n = N(), k = sstep(.8, 3.0, lt); four(t, { krai: { ry: 120, ex: 'determined', talk: talkAt(t), ...pointR }, neo: { ry: -60, ex: 'determined', hL: [-.2, .8, .5], hR: [.2, .8, .5], pL: [-1, -.4, 0], pR: [1, -.4, 0] } });
  scene.updateMatrixWorld(); const hp = n.torso.localToWorld(V(0, .8, .7)); Wd.scrapAt([hp.x, hp.y, hp.z], -60, k, t, .5, -40); Wd.auraCol(1, '#ffd23a'); Wd.auraAt(1, [hp.x, hp.y, hp.z], 1.2, .2);
  const u = U(lt, 3.6, eSine); camC([12.4, -38.6, -52.4], [14.2, -39.0, -55.0], [12.6, -38.6, -52.2], [14.2, -39.0, -55.0], u, 48); dof(.25);
});
S('H14', 45.2, 'cut', (lt, t) => { // "บรูโน่รับหน้าที่ถ่วงเวลา"
  stage(t, { drain: 1, beams: true }); put(B(), CT, { p: STR(13.2, -57.0), ry: 180, ex: 'frown', blink: false, ...up2 }); muscle(1.3); Wd.auraCol(1, '#ff4a3a'); Wd.auraAt(1, [13.2 - 300, -39, -57], 3.0, .35); SH.a = .1;
  const u = U(lt, 2.5, eSine); camC([12.8, -39.6, -53.4], [13.5, -36, -70], [12.9, -39.6, -53.9], [13.5, -35, -70], u, 56);
});
S('H15', 47.7, 'cut', (lt, t) => { // "ส่วนเอซต้องวิ่งไปทำลายเสาหลักพลังงานทั้ง 3 จุด": the three pillars from above
  stage(t, { drain: 1, beams: true }); PIL.forEach(([x, z], i) => { if (lt > .5 + i * .6) Wd.retAt([x - 300, -8, z], 9, 1, t, false, '#ff3a4a'); }); const k = clamp(lt / 3.8);
  put(A(), CT, { p: STR(15.5, lerp(-56, -72, k)), ry: 180, lean: 22, walk: { ph: lt * 24, stride: .3 }, ex: 'determined', ...runA(lt * 24) }); [0, 1, 2].forEach(i => Wd.streakAt(i, [15.5 - 300, -39.4 + i * .3, lerp(-56, -72, k) + 1.5 + i * .3], 90, 2.4, .5 - i * .1));
  const u = U(lt, 3.8, eSine); camC([60, 50, -20], [15, -40, -80], [56, 54, -26], [15, -40, -85], u, 54);
});
S('H16', 51.5, 'cut', (lt, t) => { // "เมื่อทุกอย่างพร้อม"
  stage(t, { drain: 1, beams: true }); four(t, { krai: { ry: 0, ex: 'determined' }, bruno: { ry: 20, ex: 'confident', ...fist }, ace: { ry: -20, ex: 'confident' }, neo: { ry: 10, ex: 'determined', ...hug } }); propAt(XA.gadget, N(), [0, .5, .45]); XA.led.material.opacity = (t * 6) % 1 < .5 ? .9 : .1;
  const u = U(lt, 1.5, eSine); camC([14.4, -38.6, -51.2], [14.4, -38.8, -55.0], [14.4, -38.6, -51.6], [14.4, -38.8, -55.0], u, 52); dof(.2);
});
S('H17', 53.0, 'cut', (lt, t) => { // "ไครใช้พลังเชื่อมโยงความสามารถของเพื่อนทั้งสามเข้าด้วยกัน"
  stage(t, { drain: 1, beams: true }); four(t, { krai: { ry: 180, ex: 'determined', blink: false, ...up2 } }); eyeGlow(1, t); const s = linkFrom(K());
  [[B, '#ff4a3a', .3], [A, '#3af08a', .8], [N, '#ffd23a', 1.3]].forEach(([C, c, d], i) => Wd.linkAt(i, s, linkFrom(C()), sstep(d, d + .5, lt), c)); Wd.auraCol(2, '#6ad0ff'); Wd.auraAt(2, [14.4 - 300, -38.8, -54.6], 4 + Math.sin(t * 6) * .3, .3 * sstep(1.5, 2.5, lt));
  const u = U(lt, 4.1, eSine); camC([16.6, -37.6, -50.4], [14.4, -39.0, -54.8], [16.2, -37.8, -50.8], [14.4, -39.0, -54.8], u, 52);
});
// --- the pillars fall ---
S('H18', 57.1, 'whip', (lt, t) => { // "บรูโน่ใช้พลังทำลายเสาหลักต้นแรก"
  const br = eIn(clamp((lt - .8) / 1.2)); stage(t, { drain: 1, beams: true, alive: [1 - sstep(.7, 1.0, lt), 1, 1], broken: [br, 0, 0] }); const P = PIL[0];
  put(B(), CT, { p: STR(P[0] + 3.4, P[1] + 3.4), ry: -135, lean: 15, ex: 'frown', blink: false, ...(lt > .6 ? { hR: [.15, .95, .9], pR: [1, -.4, 0], hL: [-.3, .5, .2], pL: [-1, 0, -.5] } : fist) }); muscle(1.4); Wd.auraCol(1, '#ff4a3a'); Wd.auraAt(1, [P[0] + 3.2 - 300, -39, P[1] + 3.2], 3.2, .35);
  if (lt > .7 && lt < 1.4) { SH.a = .8; Wd.flash(lt < .8 ? .12 : 0); } const u = U(lt, 3.0, eSine); camC([P[0] + 7, -38.2, P[1] + 8], [P[0] + 1, -34, P[1] + 1], [P[0] + 7.5, -38.3, P[1] + 8.5], [P[0] + 1, -34.5, P[1] + 1], u, 58);
});
S('H19', 60.1, 'whip', (lt, t) => { // "เอซทำลายต้นที่สอง"
  const br = eIn(clamp((lt - .6) / 1.2)); stage(t, { drain: .8, beams: true, alive: [0, 1 - sstep(.5, .8, lt), 1], broken: [1, br, 0] }); const P = PIL[1]; const d = clamp(lt / .6);
  put(A(), CT, { p: STR(lerp(P[0] - 12, P[0] - 2.5, eIn(d)), P[1] + 2), ry: 90, lean: 22, walk: d < 1 ? { ph: lt * 24, stride: .3 } : null, ex: 'determined', blink: false, ...(d >= 1 ? { hR: [.15, .95, .9], pR: [1, -.4, 0], hL: [-.3, .5, .2], pL: [-1, 0, -.5] } : runA(lt * 24)) });
  [0, 1, 2].forEach(i => Wd.streakAt(i, [lerp(P[0] - 12, P[0] - 2.5, eIn(d)) - 1.6 - i * .3 - 300, -39.4 + i * .35, P[1] + 2], 0, 2.6, d < 1 ? .55 - i * .12 : 0)); if (lt > .5 && lt < 1.1) SH.a = .7;
  const u = U(lt, 2.1, eSine); camC([P[0] - 6, -38, P[1] + 12], [P[0] - 3, -36, P[1] + 1], [P[0] - 6.5, -38.2, P[1] + 12.5], [P[0] - 3, -36, P[1] + 1], u, 56);
});
S('H20', 62.2, 'cut', (lt, t) => { // "และนีโอเปิดระบบตัดการเชื่อมต่อของต้นที่สาม"
  const off = sstep(1.2, 1.8, lt); stage(t, { drain: .6, beams: true, alive: [0, 0, 1 - off], broken: [1, 1, 0] }); const n = N(); put(n, CT, { p: STR(-43.4, -99.6), ry: 200, ex: off > .5 ? 'happy' : 'determined', sweat: off < .5, blink: blinkAt(t, 3), hL: [-.12, .6, .45], hR: [.12, .6, .45], pL: [-1, -.4, 0], pR: [1, -.4, 0] });
  propAt(XA.gadget, n, [0, .62, .5], [-.4, n.g.rotation.y, 0]); XA.led.material.opacity = (t * 6) % 1 < .5 ? .9 : .1; scene.updateMatrixWorld(); Wd.ringsAt([XA.gadget.position.x, XA.gadget.position.y, XA.gadget.position.z], t, 1 - off * .5, 0);
  const u = U(lt, 2.8, eSine); camC([-40.0, -38.4, -94.6], [-44, -35.5, -103], [-40.4, -38.4, -95.0], [-44, -36, -103], u, 56); dof(.1);
});
S('H21', 65.0, 'cut', (lt, t) => { // "ออริจินเริ่มสูญเสียพลัง ก่อนจะสลายตัวไปในที่สุด"
  const dk = sstep(1.0, 4.6, lt); stage(t, { drain: 1 - dk, dis: dk, alive: [0, 0, 0], broken: [1, 1, 0] }); SH.a = .25 * (1 - dk); const u = U(lt, 5.1, eSine); camC([15, 42, -20], [15, 8, -115], [15, 46, -10], [15, 4, -115], u, 54);
});
// --- freedom ---
S('H22', 70.1, 'cut', (lt, t) => { // "ทันใดนั้น กำแพงพลังงานก็หายไป"
  stage(t, { origin: false, alive: [0, 0, 0], broken: [1, 1, 0], wall: .8 * (1 - sstep(.6, 2.6, lt)) }); const f = sstep(.6, .9, lt) * (1 - sstep(.9, 1.6, lt)); Wd.flash(f * .12); const u = U(lt, 3.3, eSine); camC([40, 60, 140], [0, -20, -40], [44, 66, 150], [0, -20, -40], u, 52);
});
S('H23', 73.4, 'cut', (lt, t) => { // "ประตูทางออกเปิดออก"
  stage(t, { origin: false, alive: [0, 0, 0], broken: [1, 1, 0], wall: 0, gate: eIO(sstep(.2, 1.7, lt)) }); four(t, { krai: { ex: 'happy' }, bruno: { ex: 'happy', ...up2 }, ace: { ex: 'happy' }, neo: { ex: 'happy' } }); const R = Wd.pts[2]; R.position.set(15 - 300, -25, -128); R.color.set('#ffe0a0'); R.intensity = 50 * sstep(.2, 1.7, lt); R.distance = 90;
  const u = U(lt, 1.9, eSine); camC([15.6, -38.6, -50.0], [15, -26, -134], [15.4, -38.6, -50.4], [15, -26, -134], u, 52);
});
S('H24', 75.3, 'cut', (lt, t) => { // "และนักเรียนที่เหลือเริ่มทยอยออกจากเมือง"
  stage(t, { origin: false, alive: [0, 0, 0], broken: [1, 1, 0], wall: 0, gate: 1 }); const R = Wd.pts[2]; R.position.set(15 - 300, -25, -128); R.color.set('#ffe0a0'); R.intensity = 50; R.distance = 90;
  [0, 1, 2, 3].forEach(i => put(STU(i), CT, { p: STR(12.6 + (i % 2) * 2.4 + Math.sin(i) * .4, -64 - lt * 1.6 - i * 2.2), ry: 180, walk: { ph: lt * 7 + i, stride: .14 }, ex: 'happy', blink: blinkAt(t, i), ...hip })); put(CHARS.b3, CT, { p: STR(16.2, -60 - lt * 1.6), ry: 180, walk: { ph: lt * 7 + 5, stride: .14 }, ex: 'calm', ...hip });
  const u = U(lt, 2.9, eSine); camC([16.4, -38.4, -55.6], [15, -37, -80], [16.0, -38.4, -56.4], [15, -37, -80], u, 50); dof(.1);
});
S('H25', 78.2, 'cut', (lt, t) => { // "ไครมองไปยังหน้าจอที่กำลังดับลง พร้อมถามไดเรกเตอร์ว่า"
  stage(t, { origin: false, alive: [0, 0, 0], broken: [1, 1, 0], wall: 0, gate: 1 }); four(t, { krai: { ry: 160, ex: 'frown', head: [-18, 0, 0] } }); const fl = (lt * 7) % 1 < .3; Wd.uiAt(fl ? .7 : .9, fl ? 'glitch' : 'dir', Math.floor(lt * 9), 0, -1.6, .35);
  const u = U(lt, 4.4, eSine); camC([15.0, -39.0, -51.6], [14.4, -38.4, -54.0], [15.0, -39.0, -52.0], [14.4, -38.4, -54.0], u, 50); dof(.2);
});
S('H26', 82.6, 'cut', (lt, t) => { // "ทำไมถึงต้องทำเรื่องทั้งหมดนี้"
  stage(t, { origin: false, alive: [0, 0, 0], broken: [1, 1, 0], wall: 0, gate: 1 }); four(t, { krai: { ry: 160, ex: 'frown', talk: talkAt(t), head: [-14, 0, 0], ...fist } });
  const u = U(lt, 2.2, eIn); camC([14.0, -38.7, -55.6], [14.4, -38.6, -54.0], [14.05, -38.68, -55.3], [14.4, -38.62, -54.0], u, 40); dof(.45);
});
S('H27', 84.8, 'cut', (lt, t) => { // "แต่ไดเรกเตอร์กลับหัวเราะ และตอบว่า พวกเจ้าคิดว่าชนะเกมแล้วจะได้กลับบ้านงั้นเหรอ"
  stage(t, { origin: false, alive: [0, 0, 0], broken: [1, 1, 0], wall: 0, gate: 1 }); Wd.uiAt(1, 'dir', Math.floor(lt * 5) % 2, 0, -1.25, .05); SH.a = .05; Wd.redTint(.06);
  const u = U(lt, 5.8, eSine); camC([14.6, -38.9, -50.0], [14.6, -38.0, -56], [14.6, -38.9, -50.4], [14.6, -38.0, -56], u, 52);
});
S('H28', 90.6, 'cut', (lt, t) => { // "หน้าจอสุดท้ายปรากฏข้อความ"
  stage(t, { origin: false, alive: [0, 0, 0], broken: [1, 1, 0], wall: 0, gate: 1 }); four(t, { krai: { ex: 'shocked' }, bruno: { ex: 'shocked' }, ace: { ex: 'shocked' }, neo: { ex: 'scared' } }); Wd.uiAt(1, lt < 1.2 ? 'glitch' : 'phase1', Math.floor(lt * 16), 0, -1.6, .35);
  const u = U(lt, 2.6, eSine); camC([14.6, -38.9, -49.8], [14.6, -38.0, -56], [14.6, -38.9, -50.2], [14.6, -38.0, -56], u, 52);
});
S('H29', 93.2, 'cut', (lt, t) => { // "การทดสอบระยะที่ 1 เสร็จสมบูรณ์"
  stage(t, { origin: false, alive: [0, 0, 0], broken: [1, 1, 0], wall: 0, gate: 1 }); Wd.uiAt(1, 'phase1', 0, 0, -1.25, .05); const u = U(lt, 3.1, eSine); camC([16, -38.5, -44], [15, 0, -110], [16.2, -38.4, -45], [15, 2, -110], u, 56);
});
S('H30', 96.3, 'cut', (lt, t) => { // "มนุษย์ 4 คนผ่านการคัดเลือก"
  stage(t, { origin: false, alive: [0, 0, 0], broken: [1, 1, 0], wall: 0, gate: 1 }); Wd.uiAt(1, 'phase1', 1, 0, -1.25, .05); Wd.redTint(.05); const u = U(lt, 2.6, eSine); camC([16, -38.5, -44], [15, 0, -110], [16.2, -38.4, -45], [15, 2, -110], u, 56);
});
// --- dawn, and the ship ---
S('H31', 98.9, 'cut', (lt, t) => { // "ทั้ง 4 คนเงยหน้ามองท้องฟ้า"
  stage(t, { light: DAWN, origin: false, alive: [0, 0, 0], broken: [1, 1, 0], wall: 0, gate: 1 }); const k = sstep(.3, 1.4, lt); four(t, { krai: { head: [-30 * k, 0, 0], ex: 'calm' }, bruno: { head: [-30 * k, 0, 0], ex: 'calm' }, ace: { head: [-30 * k, 0, 0], ex: 'calm' }, neo: { head: [-30 * k, 0, 0], ex: 'calm' } });
  const u = U(lt, 2.6, eSine); camC([14.6, -39.4, -59.5], [14.4, -38.4, -54.6], [14.6, -39.5, -59.0], [14.4, -38.2, -54.6], u, 50); dof(.2);
});
S('H32', 101.5, 'cut', (lt, t) => { // "แต่สิ่งที่พวกเขาเห็นกลับไม่ใช่ดวงอาทิตย์": a shadow slides over the dawn
  stage(t, { light: DAWN, origin: false, alive: [0, 0, 0], broken: [1, 1, 0], wall: 0, gate: 1 }); Wd.shipAt(sstep(0, 3.0, lt) * .6, t); XA.ship.position.z = -120 - (1 - sstep(0, 3, lt)) * 200;
  const u = U(lt, 3.0, eSine); camC([14.4, -38.6, -54], [14, 60, -160], [14.4, -38.6, -54], [14, 80, -150], u, 60);
});
S('H33', 104.5, 'cut', (lt, t) => { // "มันคือยานอวกาศขนาดมหึมา ที่กำลังลอยอยู่เหนือเมือง"
  stage(t, { light: DAWN, origin: false, alive: [0, 0, 0], broken: [1, 1, 0], wall: 0, gate: 1 }); Wd.shipAt(1, t); SH.a = .08; const u = U(lt, 4.3, eIO); camC([150, -10, 200], [0, 80, -100], [180, 20, 240], [0, 100, -100], u, 54);
});
S('H34', 108.8, 'cut', (lt, t) => { // "ไครกำหมัดแน่นก่อนจะพูดว่า"
  stage(t, { light: DAWN, origin: false, alive: [0, 0, 0], broken: [1, 1, 0], wall: 0, gate: 1 }); Wd.shipAt(1, t); const k = sstep(.4, 1.2, lt); put(K(), CT, { p: STR(SQ.krai[0], SQ.krai[1]), ry: 180, ex: 'determined', blink: blinkAt(t, 1), head: [-12, 0, 0], ...hip, hR: [.25, lerp(.36, .75, k), lerp(.12, .4, k)], pR: [1, -.4, 0] });
  const u = U(lt, 2.7, eIn); camC([14.0, -38.9, -56.6], [14.4, -38.75, -54.0], [14.1, -38.85, -56.1], [14.4, -38.72, -54.0], u, 42); dof(.4);
});
S('H35', 111.5, 'cut', (lt, t) => { // "ดูเหมือนว่า เกมจริง ๆ เพิ่งจะเริ่มต้น"
  stage(t, { light: DAWN, origin: false, alive: [0, 0, 0], broken: [1, 1, 0], wall: 0, gate: 1 }); Wd.shipAt(1, t); four(t, { krai: { ex: 'determined', talk: talkAt(t), head: [-10, 0, 0], ...fist }, bruno: { ex: 'frown', head: [-25, 0, 0] }, ace: { ex: 'determined', head: [-25, 0, 0] }, neo: { ex: 'worried', head: [-25, 0, 0] } });
  Wd.black(sstep(3.9, 4.7, lt)); const u = U(lt, 4.7, eIO); camC([14.6, -38.8, -57.6], [14.4, -38.5, -54.0], [16, -36, -46], [14, 20, -110], u, 52);
});
export const COVER = { id: 'COVER', t0: 0, fn: (lt, t, o = {}) => {
  stage(2, { drain: 1, beams: true }); Wd.cstonesAt(1, 2); four(2, { krai: { ex: 'determined', ...up2 } }); eyeGlow(1, 2); const s = linkFrom(K()); [[B, '#ff4a3a'], [A, '#3af08a'], [N, '#ffd23a']].forEach(([C, c], i) => Wd.linkAt(i, s, linkFrom(C()), 1, c));
  const cm = o.cam || [14.6, -39.3, -50.2], g = o.tgt || [15, -10, -100]; camC(cm, g, cm, g, 0, o.fov || 56);
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
