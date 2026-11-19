// shots.js: "นาฬิกาพกสีทอง" (130.76 s timeline incl. the 0.9 s beat at 123.73)
import { THREE, scene, camera, clamp, lerp, sstep, eIO, eOut, eIn, eSine, D2R, noise1, rng, POST, mesh, rbox, toon, group } from './engine.js';
import * as Wd from './world.js';
import { CHARS, pose, toTorso, blinkAt } from './chars.js';
const { ST, TW, HL, XA } = Wd;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const TM = { env: [] };
const talkAt = (t) => { const e = TM.env[Math.round(t * 30)] || 0; return e > .55 ? 1 : e > .25 ? .5 : 0; };
let SH = { a: 0, t: 0 };
function look(pos, tgt, fov = 40, roll = 0) { POST.focus = pos.distanceTo(tgt); camera.position.copy(pos); camera.fov = fov; camera.updateProjectionMatrix(); camera.up.set(0, 1, 0); camera.lookAt(tgt); if (roll) camera.rotateZ(roll * D2R);
  if (SH.a > 0) { const t = SH.t * 22; camera.rotateX(noise1(t) * .02 * SH.a); camera.rotateY(noise1(t + 50) * .02 * SH.a); camera.position.y += noise1(t + 9) * .08 * SH.a; } camera.updateMatrixWorld(); }
const lp = (a, b, u) => a.map((v, i) => lerp(v, b[i], u));
const TY = (p, g) => p[1] < 4 ? [g[0], g[1] - .16, g[2]] : g;
const camO = (o) => (p0, t0, p1, t1, u, fov = 40, roll = 0) => look(V(...lp(p0, p1, u)).add(o.position), V(...lp(TY(p0, t0), TY(p1, t1), u)).add(o.position), fov, roll);
const camS = camO(ST), camT = camO(TW), camH = camO(HL);
function put(C, parent, P) { if (C.g.parent !== parent) parent.add(C.g); pose(C, P); }
function dof(k) { POST.dof = k; }
const U = (lt, d, e = eIO) => e(clamp(lt / d));
const HIDE = V(0, -50, 0);
function reset(t) {
  SH.a = 0; SH.t = t; if (benchFloor) benchFloor.visible = false;
  Object.values(CHARS).forEach(C => { C.g.visible = false; });
  Wd.hideSea3(); Wd.uiAt(0); Wd.flash(0); XA.watchGlow.material.opacity = 0; XA.dust.count = 0; XA.bed.visible = false; XA.hallDeco.visible = true; XA.ped.visible = true; Wd.drawWatch(.85);
  for (const o of [XA.watch, XA.mag, XA.sword, XA.scroll, XA.helmet, XA.spear, XA.candle]) { if (o.parent !== scene) scene.add(o); o.position.copy(HIDE); o.rotation.set(0, 0, 0); o.scale.setScalar(1); }
  POST.sat = 1.22; POST.lift = 1.06;
}
// light helpers
function street(o = {}) { Wd.setScene('st'); Wd.applyLight('dusk', { fogN: 40, fogF: 260, ...o }); Wd.setShadowFocus(300, 1, 0, 8); }
function town(o = {}) { Wd.setScene('tw'); Wd.applyLight('day', o); Wd.setShadowFocus(0, 1, 2, 10); }
function hall(o = {}, night = false) { Wd.setScene('hl'); Wd.applyLight(night ? 'insideN' : 'inside', o); Wd.setShadowFocus(-300, 1, -1, 8); const p = Wd.pts[0]; p.position.set(-302, 3.2, 1.5); p.color.set(night ? '#8aa0ff' : '#ffe2b0'); p.intensity = night ? 1.2 : 2.4; }
function candleLight(w) { const p = Wd.pts[1]; p.position.copy(w).add(V(0, .4, .3)); p.color.set('#ffb05a'); p.intensity = 2.2 * (1 + .06 * Math.sin(SH.t * 17)); }
function propAt(o, C, h, rot) { scene.updateMatrixWorld(); o.position.copy(C.torso.localToWorld(V(...h))); if (rot) o.rotation.set(...rot); }
const hip = { hL: [-.3, .36, .12], hR: [.3, .36, .12], pL: [-1, 0, -.5], pR: [1, 0, -.5] };
const up2 = { hL: [-.42, 1.02, .3], hR: [.42, 1.02, .3], pL: [-1, -.2, .2], pR: [1, -.2, .2] };
const hug = { hL: [-.14, .5, .34], hR: [.14, .5, .34], pL: [-1, -.3, 0], pR: [1, -.3, 0] };
const offerR = { hR: [.2, .6, .7], pR: [1, -.5, 0], hL: [-.3, .36, .12], pL: [-1, 0, -.5] };
const chin = { hR: [.06, .82, .36], pR: [1, -.6, 0], hL: [.05, .5, .3], pL: [-1, -.3, 0] };
const pointR = { hR: [.22, .8, .8], pR: [1, -.6, 0], hL: [-.3, .36, .12], pL: [-1, 0, -.5] };
const Y = () => CHARS.you, X = () => CHARS.stranger, D = () => CHARS.duke, B = () => CHARS.butler, G = () => CHARS.daughter, R = () => CHARS.guard;
const watchIn = (C, h = [.18, .6, .5]) => { propAt(XA.watch, C, h); XA.watch.rotation.set(0, C.g.rotation.y, 0); };
// =====================================================================
export const SHOTS = [];
const S = (id, t0, tr, fn, o = {}) => SHOTS.push({ id, t0, tr, fn, ...o });
// --- THE OFFER (modern street at dusk) ---
S('A01', 0, 'cut', (lt, t) => { // walking home ("วันหนึ่ง ขณะที่คุณกำลังเดินกลับบ้าน")
  street(); const z = 6 - lt * 1.1; put(Y(), ST, { p: [-.4, 0, z], ry: 0, walk: { ph: lt * 7, stride: .12 }, ex: 'calm', blink: blinkAt(t, 1), ...hip });
  const u = U(lt, 3.1, eSine); camS([1.6, 1.2, z + 4.2], [-.4, 1.1, z], [.8, 1.25, z + 3.4], [-.4, 1.1, z], u, 42); dof(.3);
});
S('A02', 3.1, 'cut', (lt, t) => { // a stranger steps out and blocks the way
  street(); const st = eOut(clamp(lt / .8)); put(Y(), ST, { p: [-.4, 0, 2.4], ry: 0, ex: lt > .6 ? 'shocked' : 'calm', blink: false, ...hip });
  put(X(), ST, { p: [lerp(1.6, .1, st), 0, 4.0], ry: 180, walk: st < 1 ? { ph: lt * 8, stride: .12 } : null, ex: 'sly', blink: blinkAt(t, 2), ...hip });
  const u = U(lt, 2.6, eSine); camS([2.6, 1.3, .6], [0, 1.2, 3.4], [2.2, 1.3, 1.2], [0, 1.2, 3.4], u, 42); dof(.25);
});
S('A03', 5.75, 'cut', (lt, t) => { // a strange offer: he holds out a card... his hand ("พร้อมยื่นข้อเสนอสุดประหลาด")
  street(); put(X(), ST, { p: [.1, 0, 4.0], ry: 180, ex: 'sly', blink: blinkAt(t, 2), ...offerR, head: [0, 0, 5] }); 
  const u = U(lt, 2.2, eOut); camS([1.3, 1.3, 1.6], [.1, 1.2, 4.0], [1.0, 1.3, 2.2], [.1, 1.2, 4.0], u, 40); dof(.35);
});
S('A04', 7.95, 'whip', (lt, t) => { // two fingers: two choices ("เขาบอกว่า คุณมีทางเลือกเพียงสองทาง")
  street(); put(X(), ST, { p: [.1, 0, 4.0], ry: 185, ex: 'confident', talk: talkAt(t), blink: blinkAt(t, 2), hR: [.12, .95, .45], pR: [1, -.4, 0], hL: [-.3, .36, .12], pL: [-1, 0, -.5] });
  const u = U(lt, 3.6, eSine); camS([-.2, 1.25, 1.4], [.1, 1.25, 4.0], [-.1, 1.25, 2.0], [.1, 1.25, 4.0], u, 40); dof(.35);
});
S('A05', 11.6, 'cut', (lt, t) => { // the choice window ("ปฏิเสธ... หรือเข้าร่วมเกมของเขา เพื่อรับเงิน 10 ล้านบาท")
  street(); put(X(), ST, { p: [.1, 0, 4.0], ry: 185, ex: 'sly', blink: blinkAt(t, 2), ...hip }); const sel = t < 14.3 ? 1 : 2;
  Wd.uiAt(eOut(clamp(lt / .3)), 'choice', sel); const u = U(lt, 6.5, eSine); camS([-.2, 1.4, 1.0], [.1, 1.4, 4.0], [-.1, 1.4, 1.4], [.1, 1.4, 4.0], u, 40); dof(.5);
});
S('A06', 18.1, 'whip', (lt, t) => { // he says yes at once ("คุณตอบตกลงแทบจะทันที")
  street(); const nod = Math.sin(lt * 12) * (lt < 1.2 ? 1 : 0); put(Y(), ST, { p: [-.3, 0, 2.4], ry: 15, ex: 'happy', blink: blinkAt(t, 1), head: [nod * 12, 0, 0], hR: [.22, .78, .5], pR: [1, -.5, 0], hL: [-.3, .36, .12], pL: [-1, 0, -.5] });
  const u = U(lt, 2.3, eOut); camS([.5, 1.2, 5.6], [-.3, 1.15, 2.4], [.3, 1.2, 4.9], [-.3, 1.15, 2.4], u, 40); dof(.35);
});
S('A07', 20.45, 'cut', (lt, t) => { // the stranger smiles ("ชายแปลกหน้ายิ้ม")
  street(); put(X(), ST, { p: [.1, 0, 4.0], ry: 185, ex: lt > .3 ? 'sly' : 'calm', blink: blinkAt(t, 2), head: [6, 0, 6], ...hip });
  const u = U(lt, 1.5, eOut); camS([-.2, 1.3, 1.9], [.1, 1.3, 4.0], [-.1, 1.3, 2.3], [.1, 1.3, 4.0], u, 40); dof(.4);
});
S('A08', 21.95, 'cut', (lt, t) => { // a golden pocket watch ("ก่อนจะยื่นนาฬิกาพกสีทองให้คุณ")
  street(); const x = X(); put(x, ST, { p: [.1, 0, 4.0], ry: 185, ex: 'sly', blink: blinkAt(t, 2), ...offerR }); propAt(XA.watch, x, [.2, .6, .7]); XA.watch.rotation.set(0, Math.PI, Math.sin(t * 2) * .2); XA.watchGlow.material.opacity = .3; Wd.drawWatch((t * .05) % 1);
  scene.updateMatrixWorld(); const w = XA.watch.position.clone().sub(ST.position); const u = U(lt, 2.6, eSine); camS([w.x - .5, w.y + .15, w.z - 1.3], [w.x, w.y, w.z], [w.x - .3, w.y + .05, w.z - .9], [w.x, w.y, w.z], u, 40); dof(.55);
});
S('A09', 24.65, 'cut', (lt, t) => { // a flash of light ("แสงสว่างวาบขึ้น")
  street(); put(Y(), ST, { p: [-.3, 0, 2.4], ry: 0, ex: 'shocked', blink: false, ...hug }); watchIn(Y(), [0, .55, .45]); XA.watch.rotation.y += Math.PI; XA.watchGlow.material.opacity = lt * .9; XA.watchGlow.scale.setScalar(.7 + lt * 2);
  Wd.flash(sstep(.6, 1.6, lt)); const u = U(lt, 1.9, eIn); camS([.2, 1.25, 5.2], [-.3, 1.1, 2.4], [0, 1.2, 4.0], [-.3, 1.1, 2.4], u, 40);
});
// --- THE MEDIEVAL TOWN ---
S('A10', 26.5, 'dis', (lt, t) => { // he opens his eyes ("และเมื่อคุณลืมตาอีกครั้ง")
  town(); Wd.flash(1 - sstep(0, .5, lt)); put(Y(), TW, { p: [0, 0, 3.5], ry: 0, ex: lt < .7 ? 'sleepy' : 'shocked', blink: lt < .5, head: [0, 15 * Math.sin(lt * 3) * sstep(.8, 1.2, lt), 0], ...hip }); watchIn(Y(), [.3, .36, .2]);
  const u = U(lt, 1.8, eOut); camT([0, 1.25, 5.4], [0, 1.2, 3.5], [0, 1.25, 5.0], [0, 1.2, 3.5], u, 40); dof(.35);
});
S('A11', 28.25, 'cut', (lt, t) => { // crane up: a medieval town, hundreds of years ago
  town(); put(Y(), TW, { p: [0, 0, 3.5], ry: 180, ex: 'shocked', ...hip, head: [-10, 0, 0] });
  const u = U(lt, 4.0, eIO); camT([.6, 1.1, 5.6], [0, 1.4, 2], [3, 9, 15], [0, 2, -16], u, 44);
});
S('A12', 32.25, 'whip', (lt, t) => { // the mission window ("ภารกิจของคุณคือ สืบหาคนขโมยเพชรประจำตระกูลดยุค")
  town(); put(Y(), TW, { p: [0, 0, 3.5], ry: 0, ex: 'worried', blink: blinkAt(t, 1), ...hip }); Wd.uiAt(eOut(clamp(lt / .3)), 'mission', 0);
  const u = U(lt, 4.7, eSine); camT([0, 1.5, 6.6], [0, 1.5, 3.5], [0, 1.5, 6.1], [0, 1.5, 3.5], u, 42); dof(.5);
});
S('A13', 36.95, 'cut', (lt, t) => { // only three days: the watch starts ticking ("โดยมีเวลาเพียง 3 วัน")
  town(); put(Y(), TW, { p: [0, 0, 3.5], ry: 0, ex: 'determined', blink: blinkAt(t, 1), ...hug }); watchIn(Y(), [0, .55, .45]); XA.watch.rotation.y += Math.PI; Wd.drawWatch((t - 36.95) * .1 % 1); XA.watchGlow.material.opacity = .4;
  Wd.uiAt(1, 'mission', 1, 0, -1.4, .14);
  const u = U(lt, 2.2, eSine); camT([0, 1.3, 5.5], [0, 1.25, 3.5], [0, 1.3, 5.1], [0, 1.25, 3.5], u, 42); dof(.4);
});
// --- DAY ONE: three suspects (the duke's hall) ---
const LINEUP = [[-1.3, -1.2], [0, -1.6], [1.3, -1.2]];
S('A14', 39.15, 'sweep', (lt, t) => { // "วันแรก": the three suspects line up
  hall(); Wd.uiAt(1 - sstep(.7, 1.0, lt), 'day', 1, 0, -1.4, .14);
  put(B(), HL, { p: [LINEUP[0][0], 0, LINEUP[0][1]], ry: 10, ex: 'calm', blink: blinkAt(t, 1), ...hip }); put(G(), HL, { p: [LINEUP[1][0], 0, LINEUP[1][1]], ry: 0, ex: 'worried', blink: blinkAt(t, 2), ...hug });
  put(R(), HL, { p: [LINEUP[2][0], 0, LINEUP[2][1]], ry: -10, ex: 'frown', blink: blinkAt(t, 3), ...hip }); R().g.visible = lt > 0; R().g.traverse(o => { if (o.material) o.material.opacity = 1; });
  put(Y(), HL, { p: [-2.4, 0, 2.2], ry: 150, ex: 'determined', ...chin });
  const u = U(lt, 3.8, eSine); camH([.5, 1.5, 5.0], [0, 1.0, -1.3], [.2, 1.4, 4.4], [0, 1.0, -1.3], u, 50); dof(.2);
});
S('A15', 43.0, 'cut', (lt, t) => { // the butler: he never entered the treasure room
  hall(); put(B(), HL, { p: [-1.3, 0, -1.2], ry: 15, ex: 'calm', talk: talkAt(t) * .6, blink: blinkAt(t, 1), head: [-6, 0, 0], hR: [.02, .62, .38], pR: [1, -.4, 0], hL: [-.3, .36, .12], pL: [-1, 0, -.5] });
  const u = U(lt, 3.4, eSine); camH([-1.0, 1.25, 1.4], [-1.3, 1.15, -1.2], [-1.1, 1.25, 1.0], [-1.3, 1.15, -1.2], u, 40); dof(.4);
});
S('A16', 46.45, 'cut', (lt, t) => { // the daughter: a long list of debts
  hall(); const g = G(), unroll = eOut(clamp((lt - .3) / .8)); put(g, HL, { p: [0, 0, -1.6], ry: 0, ex: 'worried', sweat: true, blink: blinkAt(t, 2), hL: [-.18, .7, .55], hR: [.18, .7, .55], pL: [-1, -.4, 0], pR: [1, -.4, 0] });
  propAt(XA.scroll, g, [0, .72, .58]); XA.scroll.rotation.set(0, g.g.rotation.y, 0); XA.scroll.scale.set(1, Math.max(.05, unroll), 1);
  const u = U(lt, 3.6, eSine); camH([.3, 1.1, 1.1], [0, .9, -1.6], [.2, 1.1, .7], [0, .9, -1.6], u, 40); dof(.35);
});
S('A17', 50.2, 'cut', (lt, t) => { // the guard's post, empty on the night it happened
  hall({}, true); XA.helmet.position.set(-300 + 4.8, .08, 2.6); XA.helmet.rotation.set(.3, 0, .5); XA.spear.position.set(-300 + 5.9, 0, 3.2); XA.spear.rotation.set(0, 0, .2); Wd.pts[1].position.set(-300 + 5, 1.5, 3.6); Wd.pts[1].color.set('#ffb05a'); Wd.pts[1].intensity = 1.2;
  const u = U(lt, 3.4, eSine); camH([3.2, 1.2, 6.2], [5.2, .6, 2.8], [3.6, 1.0, 5.4], [5.2, .6, 2.8], u, 42); dof(.2);
});
S('A18', 53.65, 'whip', (lt, t) => { // he thinks: the strangest thing ("แต่สิ่งที่แปลกที่สุดคือ")
  hall(); put(Y(), HL, { p: [.6, 0, 1.4], ry: -20, ex: 'calm', blink: blinkAt(t, 1), look: [-.6, .4], ...chin }); const u = U(lt, 2.0, eOut); camH([.3, 1.3, 3.6], [.6, 1.15, 1.4], [.4, 1.3, 3.1], [.6, 1.15, 1.4], u, 40); dof(.4);
});
S('A19', 55.65, 'cut', (lt, t) => { // the empty glass case ("ไม่มีใครเห็นคนร้ายเลย")
  hall(); const u = U(lt, 2.1, eSine); camH([1.0, 1.5, .6], [1.6, 1.2, -1.6], [1.25, 1.45, -.2], [1.6, 1.25, -1.6], u, 42); dof(.3);
});
S('A20', 57.75, 'cut', (lt, t) => { // magnifying glass ("คุณตรวจสอบห้องเก็บสมบัติอย่างละเอียด")
  hall(); const y = Y(), sw = Math.sin(lt * 2.2); put(y, HL, { p: [-3.6 + lt * .2, 0, -.2], ry: -60 + sw * 20, lean: 18, ex: 'determined', blink: blinkAt(t, 1), head: [20, 0, 0], hR: [.18, .55, .55], pR: [1, -.4, 0], hL: [-.3, .36, .12], pL: [-1, 0, -.5] }); propAt(XA.mag, y, [.18, .7, .58]); XA.mag.rotation.set(0, y.g.rotation.y, 0);
  const u = U(lt, 2.4, eSine); camH([-1.2, 1.3, 2.6], [-3.5, .9, -.2], [-1.5, 1.25, 2.2], [-3.4, .9, -.2], u, 42); dof(.3);
});
S('A21', 60.2, 'cut', (lt, t) => { // tiny glass shards under the window ("และพบเศษแก้วเล็ก ๆ ติดอยู่ใต้หน้าต่าง")
  hall(); XA.shardGlints.forEach((g, i) => { g.material.opacity = .15 + .3 * Math.max(0, Math.sin(t * 6 + i * 2)); });
  const u = U(lt, 2.85, eSine); camH([-4.6, .55, 1.0], [-5.6, .05, .1], [-4.9, .45, .7], [-5.6, .05, .1], u, 40); dof(.5);
});
S('A22', 63.05, 'cut', (lt, t) => { // but the window is locked from inside
  hall(); const u = U(lt, 3.0, eSine); camH([-4.9, 2.3, 1.1], [-6.0, 2.15, 0], [-5.3, 2.2, .6], [-6.0, 2.15, 0], u, 40); dof(.4);
});
// --- NIGHT TWO: the daughter's room ---
function bedroom(t) { hall({}, true); XA.bed.visible = true; XA.hallDeco.visible = false; XA.ped.visible = false; scene.updateMatrixWorld(); const w = V(); XA.candleG.localToWorld(w.set(0, .3, 0)); candleLight(w); }
S('A23', 66.1, 'sweep', (lt, t) => { // he sneaks in with a candle ("คืนที่ 2 คุณแอบเข้าไปค้นห้องของลูกสาวดยุค")
  bedroom(t); const y = Y(), x = lerp(.6, -1.2, clamp(lt / 3.4)); put(y, HL, { p: [x, 0, -1.6], ry: -100, lean: 12, walk: { ph: lt * 6, stride: .08 }, ex: 'sneaky', blink: blinkAt(t, 1), hR: [.3, .55, .45], pR: [1, -.3, 0], hL: [-.3, .36, .12], pL: [-1, 0, -.5] });
  propAt(XA.candle, y, [.3, .5, .45]); scene.updateMatrixWorld(); const p = Wd.pts[2]; p.position.copy(XA.candle.position).add(V(0, .4, .4)); p.color.set('#ffb05a'); p.intensity = 1.6;
  const u = U(lt, 3.5, eSine); camH([x + 1.6, 1.35, 1.4], [x - .2, 1.0, -2.0], [x + 1.2, 1.3, 1.0], [x - .3, 1.0, -2.0], u, 42); dof(.25);
});
S('A24', 69.65, 'cut', (lt, t) => { // the letter: she plans to run away
  bedroom(t); const u = U(lt, 3.6, eSine); camH([-2.35, 1.8, -3.2], [-2.4, .9, -3.75], [-2.35, 1.62, -3.35], [-2.4, .9, -3.75], u, 40);
});
S('A25', 73.4, 'cut', (lt, t) => { // everything points to her: she appears at the door
  bedroom(t); put(Y(), HL, { p: [-1.6, 0, -2.6], ry: 60, ex: 'frown', blink: blinkAt(t, 1), ...hip }); put(G(), HL, { p: [1.2, 0, 1.4], ry: -130, ex: 'shocked', blink: false, ...hug });
  Wd.pts[2].position.set(-300 + 1.2, 1.6, 2.4); Wd.pts[2].color.set('#9ab0ff'); Wd.pts[2].intensity = 1.2;
  const u = U(lt, 2.4, eSine); camH([-2.6, 1.3, -.4], [1.0, 1.0, 1.0], [-2.4, 1.3, -.8], [1.0, 1.0, 1.0], u, 42); dof(.2);
});
S('A26', 75.8, 'whip', (lt, t) => { // he moves to arrest her ("แต่ก่อนที่คุณจะจับกุมได้")
  bedroom(t); const k = eOut(clamp(lt / .6)); put(Y(), HL, { p: [lerp(-.6, -.1, k), 0, lerp(-.6, -.1, k)], ry: 50, lean: 10, ex: 'determined', blink: blinkAt(t, 1), ...pointR }); put(G(), HL, { p: [1.2, 0, 1.4], ry: -130, ex: 'scared', sweat: true, blink: false, ...up2 });
  const u = U(lt, 1.9, eOut); camH([1.4, 1.25, 3.6], [.4, 1.0, .5], [1.2, 1.25, 3.1], [.4, 1.0, .5], u, 44); dof(.2);
});
S('A27', 77.7, 'cut', (lt, t) => { // the missing guard bursts in, hands up ("ทหารยามที่หายตัวไป กลับประกาศตัวขึ้น")
  bedroom(t); const k = eOut(clamp(lt / .7)); put(R(), HL, { p: [lerp(3.8, 2.2, k), 0, 2.4], ry: -110, walk: k < 1 ? { ph: lt * 10, stride: .14 } : null, ex: 'worried', sweat: true, blink: blinkAt(t, 3), ...up2 });
  put(Y(), HL, { p: [-.1, 0, -.1], ry: 80, ex: 'shocked', blink: false, ...hip }); put(G(), HL, { p: [1.1, 0, .9], ry: -60, ex: 'shocked', blink: false, ...hug });
  const u = U(lt, 3.1, eSine); camH([1.0, 1.3, 5.6], [2.0, 1.0, 1.6], [1.3, 1.3, 5.1], [2.1, 1.0, 1.6], u, 46); dof(.15);
});
S('A28', 80.85, 'cut', (lt, t) => { // he confesses: he stole the diamond
  bedroom(t); const kn = sstep(0, .6, lt); put(R(), HL, { p: [2.0, 0, 2.2], ry: -120, lean: 20 * kn, hipY: -.12 * kn, ex: 'sad', talk: talkAt(t), sweat: true, blink: blinkAt(t, 3), head: [18, 0, 0], ...hug });
  const u = U(lt, 2.8, eSine); camH([-.3, 1.15, .9], [2.0, .85, 2.2], [-.05, 1.1, 1.1], [2.0, .85, 2.2], u, 40); dof(.35);
});
S('A29', 83.7, 'cut', (lt, t) => { // case closed, he thinks ("คุณคิดว่าคดีจบแล้ว")
  bedroom(t); put(Y(), HL, { p: [-.1, 0, -.1], ry: 30, ex: 'happy', blink: blinkAt(t, 1), head: [-6, 0, 6], hL: [-.3, .36, .12], pL: [-1, 0, -.5], hR: [.12, .62, .4], pR: [1, -.4, 0] });
  const u = U(lt, 1.7, eOut); camH([.9, 1.25, 2.4], [-.1, 1.1, -.1], [.7, 1.25, 2.0], [-.1, 1.1, -.1], u, 40); dof(.35);
});
// --- THE DUKE ---
S('A30', 85.45, 'sweep', (lt, t) => { // he brings the guard to the duke ("จึงรีบนำตัวเขาไปยังดยุค")
  hall(); const z = 2.6 - lt * .9; put(Y(), HL, { p: [.5, 0, z], ry: 180, walk: { ph: lt * 7, stride: .12 }, ex: 'confident', ...hip }); put(R(), HL, { p: [-.5, 0, z + .4], ry: 180, walk: { ph: lt * 7 + 1, stride: .1 }, ex: 'sad', head: [18, 0, 0], ...hug });
  put(D(), HL, { p: [0, .3, -3.6], sit: true, seat: .5, ry: 0, ex: 'calm', blink: blinkAt(t, 4), ...hip });
  const u = U(lt, 2.0, eSine); camH([1.6, 1.4, z + 3.6], [0, 1.0, -2.6], [1.2, 1.4, z + 3.2], [0, 1.0, -2.6], u, 46); dof(.15);
});
S('A31', 87.4, 'cut', (lt, t) => { // the guard sees the duke: he freezes ("แต่ทันทีที่ทหารยามเห็นดยุค")
  hall(); put(R(), HL, { p: [-.4, 0, .8], ry: 180 + 30 * sstep(.2, .6, lt) - 30, ex: lt > .5 ? 'shocked' : 'sad', blink: false, head: [lt > .5 ? -6 : 18, 0, 0], ...(lt > .5 ? up2 : hug) });
  const u = U(lt, 2.1, eOut); camH([-.9, 1.2, -1.2], [-.4, 1.1, .8], [-.7, 1.2, -.8], [-.4, 1.1, .8], u, 40); dof(.35);
});
S('A32', 89.6, 'cut', (lt, t) => { // he goes pale ("เขากลับหน้าซีดและพูดว่า")
  hall(); POST.sat = .9; put(R(), HL, { p: [-.4, 0, .8], ry: 160, ex: 'scared', sweat: true, blink: false, ...hug }); const u = U(lt, 2.6, eSine); camH([-.6, 1.2, -.9], [-.4, 1.15, .8], [-.55, 1.2, -.5], [-.4, 1.15, .8], u, 38); dof(.45);
});
S('A33', 92.2, 'cut', (lt, t) => { // "ท่าน... ท่านบอกว่าข้าจะได้รับเงิน หากช่วยซ่อนเพชรให้ท่าน"
  hall(); put(R(), HL, { p: [-.4, 0, .8], ry: 170, lean: 10, ex: 'worried', talk: talkAt(t), sweat: true, blink: blinkAt(t, 3), ...offerR }); put(D(), HL, { p: [0, .3, -3.6], sit: true, seat: .5, ry: 0, ex: 'frown', blink: blinkAt(t, 4), ...hip });
  const u = U(lt, 4.7, eSine); camH([-1.3, 1.3, 2.6], [-.1, 1.1, -2.0], [-1.0, 1.3, 2.1], [-.1, 1.1, -2.0], u, 42); dof(.2);
});
S('A34', 96.9, 'cut', (lt, t) => { // dead silence ("ห้องทั้งห้องเงียบสนิท")
  hall(); put(R(), HL, { p: [-.4, 0, .8], ry: 170, ex: 'scared', blink: false, ...hug }); put(Y(), HL, { p: [.6, 0, .6], ry: 190, ex: 'shocked', blink: false, ...hip }); put(D(), HL, { p: [0, .3, -3.6], sit: true, seat: .5, ry: 0, ex: 'calm', blink: false, ...hip });
  const u = U(lt, 1.8, eSine); camH([0, 3.4, 5.6], [0, .9, -1.2], [0, 3.2, 5.2], [0, .9, -1.2], u, 44);
});
S('A35', 98.65, 'whip', (lt, t) => { // he turns to the duke ("คุณหันไปมองดยุค")
  hall(); const k = eOut(clamp(lt / .5)); put(Y(), HL, { p: [.6, 0, .6], ry: lerp(150, 200, k), ex: 'worried', sweat: true, blink: false, head: [0, lerp(-20, 0, k), 0], ...hip });
  const u = U(lt, 1.4, eOut); camH([.9, 1.2, -1.0], [.6, 1.15, .6], [.8, 1.2, -.7], [.6, 1.15, .6], u, 40); dof(.4);
});
function dukeSword(t, lt, P, sw) { const d = D(); put(d, HL, { p: [0, 0, -2.8], ry: 0, blink: blinkAt(t, 4), ...P }); propAt(XA.sword, d, P.hR || [.3, .6, .4]); XA.sword.rotation.set(sw[0], d.g.rotation.y + (sw[1] || 0), sw[2] || 0); }
S('A36', 100.05, 'cut', (lt, t) => { // the duke draws his sword and laughs ("แต่เขากลับชักดาบออกมา พร้อมหัวเราะอย่างเยือกเย็น")
  hall(); const dr = eOut(clamp((lt - .2) / .6)); dukeSword(t, lt, { ex: lt > .9 ? 'sly' : 'calm', talk: lt > .9 ? (Math.sin(lt * 18) > 0 ? 1 : .5) : 0, head: [lt > .9 ? -8 : 0, 0, 0], hR: [lerp(-.25, .38, dr), lerp(.4, .95, dr), .3], pR: [1, -.2, 0], hL: [-.3, .36, .12], pL: [-1, 0, -.5] }, [lerp(2.4, .2, dr), 0, lerp(.8, -.3, dr)]);
  if (dr > .9 && lt < 1.0) SH.a = .3; const u = U(lt, 3.6, eSine); camH([.4, .9, -.1], [0, 1.3, -2.8], [.3, 1.0, -.5], [0, 1.3, -2.8], u, 42); dof(.3);
});
S('A37', 103.75, 'cut', (lt, t) => { // "ฉลาดดีนี่"
  hall(); dukeSword(t, lt, { ex: 'sly', talk: talkAt(t), head: [0, 0, 6], hR: [.38, .95, .3], pR: [1, -.2, 0], hL: [-.3, .36, .12], pL: [-1, 0, -.5] }, [.2, 0, -.3]);
  const u = U(lt, 1.5, eOut); camH([-.15, 1.3, -.9], [0, 1.25, -2.8], [-.1, 1.3, -1.3], [0, 1.25, -2.8], u, 40); dof(.4);
});
S('A38', 105.25, 'cut', (lt, t) => { // "แต่เจ้าลืมไปอย่างหนึ่ง": the sword levels at him
  hall(); const k = eOut(clamp(lt / .6)); dukeSword(t, lt, { lean: 6, ex: 'sly', talk: talkAt(t), hR: [.25, lerp(.95, .7, k), lerp(.3, .75, k)], pR: [1, -.4, 0], hL: [-.3, .36, .12], pL: [-1, 0, -.5] }, [lerp(.2, 1.5, k), 0, 0]);
  XA.ped.visible = false; D().g.position.z = -1.9; put(Y(), HL, { p: [.3, 0, .1], ry: 200, ex: 'scared', sweat: true, blink: false, ...up2 });
  const u = U(lt, 1.7, eSine); camH([5.8, 1.35, -.9], [.15, 1.1, -.9], [5.5, 1.35, -.9], [.15, 1.1, -.9], u, 54); dof(.2);
});
S('A39', 106.95, 'cut', (lt, t) => { // he points at the watch in your hand
  hall(); const y = Y(); put(y, HL, { p: [.3, 0, .3], ry: 200, ex: 'scared', sweat: true, blink: false, hR: [.18, .6, .5], pR: [1, -.4, 0], hL: [-.3, .36, .12], pL: [-1, 0, -.5] }); watchIn(y, [.18, .66, .52]); Wd.drawWatch(.92 + lt * .025); XA.watchGlow.material.opacity = .4;
  scene.updateMatrixWorld(); const w = XA.watch.position.clone().sub(HL.position); const u = U(lt, 2.6, eSine); camH([w.x + .2, w.y + .25, w.z - .9], [w.x, w.y, w.z], [w.x + .1, w.y + .15, w.z - .65], [w.x, w.y, w.z], u, 40); dof(.55);
});
S('A40', 109.6, 'cut', (lt, t) => { // "เวลาของเจ้าหมดแล้ว": the hand reaches twelve, red glow
  hall(); const y = Y(); put(y, HL, { p: [.3, 0, .3], ry: 200, ex: 'scared', sweat: true, blink: false, hR: [.18, .6, .5], pR: [1, -.4, 0], hL: [-.3, .36, .12], pL: [-1, 0, -.5] }); watchIn(y, [.18, .66, .52]);
  const r = lt > 1.2; Wd.drawWatch(r ? 1 : .985 + lt * .012, r ? 1 : 0); XA.watchGlow.material.color.set(r ? '#ff4a4a' : '#ffe080'); XA.watchGlow.material.opacity = r ? .9 : .4; if (r && lt < 1.4) SH.a = .4;
  scene.updateMatrixWorld(); const w = XA.watch.position.clone().sub(HL.position); const u = U(lt, 2.4, eIn); camH([w.x + .1, w.y + .15, w.z - .6], [w.x, w.y, w.z], [w.x + .05, w.y + .08, w.z - .38], [w.x, w.y, w.z], u, 40); dof(.6);
});
// --- TIME STOPS ---
function frozen(t) { hall(); POST.sat = .35; POST.lift = 1.1; Wd.dust([-300, 0, -1], 112.0, 110, 6);
  put(Y(), HL, { p: [.3, 0, .3], ry: 200, ex: 'scared', blink: false, ...up2 }); dukeSword(112, 0, { lean: 14, ex: 'sly', hR: [.25, .7, .75], pR: [1, -.4, 0], hL: [-.4, .7, .1], pL: [-1, -.3, 0] }, [1.5, 0, 0]); D().g.position.z = -1.9;
  put(R(), HL, { p: [-1.2, 0, .9], ry: 160, ex: 'scared', blink: false, ...hug }); }
S('A41', 112.0, 'cut', (lt, t) => { // everything stops ("ทันใดนั้น ทุกอย่างรอบตัวก็หยุดนิ่ง")
  frozen(t); if (lt < .2) SH.a = .5; const u = U(lt, 3.1, eSine); camH([2.6, 1.6, 2.4], [0, 1.1, -.8], [2.0, 1.8, 3.0], [0, 1.1, -.8], u, 46);
});
S('A42', 115.1, 'dis', (lt, t) => { // the stranger walks out of the frozen moment ("ชายแปลกหน้าปรากฏตัวขึ้น")
  frozen(t); const ap = sstep(.1, .9, lt); const x = X(); put(x, HL, { p: [1.8, 0, 1.4], ry: -50, walk: lt > .9 && lt < 2.4 ? { ph: lt * 6, stride: .1 } : null, ex: 'sly', talk: lt > 2 ? talkAt(t) : 0, blink: blinkAt(t, 2), ...hip }); x.g.visible = ap > .2;
  XA.watchGlow.material.opacity = 0; Wd.flash(ap < .6 ? Math.sin(ap / .6 * Math.PI) * .5 : 0); x.g.position.x = 1.8 - sstep(.9, 2.4, lt) * .6;
  const u = U(lt, 3.2, eSine); camH([.4, 1.3, 4.6], [1.0, 1.1, .8], [.6, 1.3, 4.2], [1.0, 1.1, .8], u, 44); dof(.2);
});
S('A43', 118.35, 'cut', (lt, t) => { // "ยินดีด้วย เจ้าสืบคดีแรกสำเร็จ": he claps
  frozen(t); POST.sat = .55; const c = Math.abs(Math.sin(lt * 9)) * (lt < 1.3 ? 1 : 0); put(X(), HL, { p: [1.2, 0, 1.4], ry: 10, ex: 'happy', talk: talkAt(t), blink: blinkAt(t, 2), hL: [-.08 - c * .12, .62, .45], hR: [.08 + c * .12, .62, .45], pL: [-1, -.4, 0], pR: [1, -.4, 0] });
  Wd.uiAt(sstep(1.3, 1.6, lt), 'done', 0, 0, -1.4, .22); const u = U(lt, 3.0, eSine); camH([1.0, 1.55, 3.9], [1.2, 1.5, 1.4], [1.0, 1.55, 3.5], [1.2, 1.5, 1.4], u, 40); dof(.4);
});
S('A44', 121.4, 'cut', (lt, t) => { // the mission window glitches (and the silent beat) ("แต่หน้าจอภารกิจกลับเปลี่ยนไป")
  frozen(t); POST.sat = .55; put(X(), HL, { p: [1.2, 0, 1.4], ry: 10, ex: 'sly', blink: blinkAt(t, 2), ...hip }); const gl = lt > .6; Wd.uiAt(1, gl ? 'glitch' : 'done', gl ? Math.floor(lt * 10) : 0, 0, -1.4 + lt * .05, .22);
  if (gl && lt < 2.2) SH.a = .25; const u = U(lt, 3.3, eSine); camH([1.0, 1.55, 3.9], [1.2, 1.5, 1.4], [1.0, 1.55, 3.6], [1.2, 1.5, 1.4], u, 40); dof(.5);
});
S('A45', 124.75, 'cut', (lt, t) => { // "ภารกิจต่อไป"
  frozen(t); POST.sat = .55; put(X(), HL, { p: [1.2, 0, 1.4], ry: 10, ex: 'sly', blink: blinkAt(t, 2), ...hip }); Wd.uiAt(1, 'next', 0, 0, -1.3, .22);
  const u = U(lt, 1.5, eOut); camH([1.0, 1.55, 3.9], [1.2, 1.5, 1.4], [1.0, 1.55, 3.6], [1.2, 1.5, 1.4], u, 40); dof(.6);
});
S('A46', 126.2, 'cut', (lt, t) => { // "จงหาว่าใครเป็นคนฆ่าชายแปลกหน้า": he smiles behind the window
  frozen(t); POST.sat = .55; put(X(), HL, { p: [1.2, 0, 1.4], ry: 5, ex: lt > 1.5 ? 'sly' : 'calm', blink: blinkAt(t, 2), head: [0, 0, lt > 1.5 ? 6 : 0], ...hip }); Wd.uiAt(1 - sstep(2.2, 2.8, lt) * .45, 'next', lt > .9 ? 1 : 0, 0, -1.3 - sstep(2.2, 2.8, lt) * .9, .16);
  const u = U(lt, 4.4, eIn); camH([1.1, 1.55, 4.0], [1.2, 1.5, 1.4], [1.15, 1.5, 3.0], [1.2, 1.5, 1.4], u, 40); dof(.3);
});

export function initShots(timing) { TM.env = timing.env; for (let i = 0; i < SHOTS.length; i++) SHOTS[i].t1 = i + 1 < SHOTS.length ? SHOTS[i + 1].t0 : timing.end; }
export function runShot(sh, t) { reset(t); POST.vig = .25; sh.fn(t - sh.t0, t); }

export const COVER = { id: 'COVER', t0: 0, fn: (lt, t, o = {}) => {
  hall(); put(Y(), HL, { p: [-.45, 0, .9], ry: 10, ex: 'determined', ...hug }); watchIn(Y(), [0, .55, .45]); XA.watch.rotation.y += Math.PI; XA.watch.scale.setScalar(1.6); XA.watchGlow.material.opacity = .6; XA.watchGlow.scale.setScalar(1.4);
  put(X(), HL, { p: [.75, 0, .2], ry: -15, ex: 'sly', head: [0, 0, 6], ...hip }); put(D(), HL, { p: [0, .3, -3.6], sit: true, seat: .5, ry: 0, ex: 'sly', ...hip });
  const cm = o.cam || [0, 1.25, 5.0], g = o.tgt || [0, 1.75, -.5]; camH(cm, g, cm, g, 0, o.fov || 46); dof(.12);
} };
let benchFloor = null;
export const BENCH = { id: 'BENCH', t0: 0, fn: (lt, t, o = {}) => {
  Wd.applyLight(o.light || 'day'); Wd.setScene('none'); Wd.hideSea3();
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
