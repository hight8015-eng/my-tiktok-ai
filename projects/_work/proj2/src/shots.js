// shots.js: "เกมแห่งชีวิต" (85.64 s timeline incl. the 0.9 s beat at 79.8)
import { THREE, scene, camera, clamp, lerp, sstep, eIO, eOut, eIn, eSine, D2R, noise1, rng, POST, mesh, rbox, toon, group } from './engine.js';
import * as Wd from './world.js';
import { CHARS, pose, toTorso, blinkAt } from './chars.js';
const { MZ, MA } = Wd;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const TM = { env: [] };
const talkAt = (t) => { const e = TM.env[Math.round(t * 30)] || 0; return e > .55 ? 1 : e > .25 ? .5 : 0; };
let SH = { a: 0, t: 0 };
function look(pos, tgt, fov = 40, roll = 0) { POST.focus = pos.distanceTo(tgt); camera.position.copy(pos); camera.fov = fov; camera.updateProjectionMatrix(); camera.up.set(0, 1, 0); if (Math.abs(pos.x - tgt.x) + Math.abs(pos.z - tgt.z) < .05) camera.up.set(0, 0, -1); camera.lookAt(tgt); if (roll) camera.rotateZ(roll * D2R);
  if (SH.a > 0) { const t = SH.t * 22; camera.rotateX(noise1(t) * .02 * SH.a); camera.rotateY(noise1(t + 50) * .02 * SH.a); camera.position.y += noise1(t + 9) * .08 * SH.a; } }
const lp = (a, b, u) => a.map((v, i) => lerp(v, b[i], u));
const TY = (p, g) => p[1] < 4 ? [g[0], g[1] - .16, g[2]] : g;
function camW(p0, t0, p1, t1, u, fov = 40, roll = 0) { look(V(...lp(p0, p1, u)), V(...lp(TY(p0, t0), TY(p1, t1), u)), fov, roll); }
function put(C, parent, P) { if (C.g.parent !== parent) parent.add(C.g); pose(C, P); }
function dof(k) { POST.dof = k; }
const U = (lt, d, e = eIO) => e(clamp(lt / d));
const HIDE = V(0, -50, 0);
function reset(t) {
  SH.a = 0; SH.t = t; if (benchFloor) benchFloor.visible = false;
  Object.values(CHARS).forEach(C => { C.g.visible = false; });
  MZ.visible = true; Wd.hideSea2(); Wd.shadowsOff(); Wd.coinsBegin(); Wd.coinsEnd(); MA.door.position.y = 1.3; Wd.screenGlow(1); MA.glints.forEach(g => { g.material.opacity = 0; });
  for (const o of [...MA.bags, MA.coin1]) { o.position.copy(HIDE); o.rotation.set(0, 0, 0); o.scale.setScalar(1); }
  MA.gateM.emissiveIntensity = .5; MA.banner.visible = true;
}
// light helpers
function room(o = {}) { Wd.applyLight('room', o); POST.inkFade = o.fogF ? [3, 14] : [80, 500]; Wd.setShadowFocus(0, 1, 8.6, 5); const p = Wd.pts[0]; p.position.set(0, 1.7, 10.2); p.color.set(o.scrC || '#7ab0ff'); p.intensity = o.scrI ?? 3.2; }
function maze(o = {}, f = [0, 1, 0, 6]) { Wd.applyLight('maze', o); POST.inkFade = [3, 10]; Wd.setShadowFocus(...f); }
function fin(o = {}) { Wd.applyLight('finish', o); POST.inkFade = [8, 30]; Wd.setShadowFocus(0, 1, -58, 8); const p = Wd.pts[0]; p.position.set(0, 4, -61.5); p.color.set(o.scrC || '#9ad0ff'); p.intensity = o.scrI ?? 4; }
function lit(C, k = 1.6, col = '#cfd8ff') { scene.updateMatrixWorld(); const w = C.g.position.clone(); const p = Wd.pts[1]; p.position.set(w.x + .6, 2.1, w.z + 1.3); p.color.set(col); p.intensity = k; }
function propAt(o, C, h, rot) { scene.updateMatrixWorld(); o.position.copy(C.torso.localToWorld(V(...h))); if (rot) o.rotation.set(...rot); }
const hip = { hL: [-.3, .36, .12], hR: [.3, .36, .12], pL: [-1, 0, -.5], pR: [1, 0, -.5] };
const up2 = { hL: [-.42, 1.02, .3], hR: [.42, 1.02, .3], pL: [-1, -.2, .2], pR: [1, -.2, .2] };
const hug = { hL: [-.14, .5, .34], hR: [.14, .5, .34], pL: [-1, -.3, 0], pR: [1, -.3, 0] };
const runA = (ph) => ({ hL: [-.32, .5 + .12 * Math.sin(ph), .25 + .25 * Math.sin(ph)], hR: [.32, .5 - .12 * Math.sin(ph), .25 - .25 * Math.sin(ph)], pL: [-1, -.3, 0], pR: [1, -.3, 0] });
const H = () => CHARS.hero, P2 = () => CHARS.p2, P3 = () => CHARS.p3;
// =====================================================================
export const SHOTS = [];
const S = (id, t0, tr, fn, o = {}) => SHOTS.push({ id, t0, tr, fn, ...o });
// --- THE ROOM ---
S('G01', 0, 'cut', (lt, t) => { // he wakes on a cot in a dark room ("ชายคนหนึ่ง ตื่นขึ้นมาในห้องมืด")
  room({ scrI: .6 }); Wd.drawScreen('off'); Wd.screenGlow(0); const w = sstep(.6, 1.4, lt);
  put(H(), MZ, { p: [-1.4, 0, 8.6], ry: 20, sit: true, seat: .5, lean: 30 * (1 - w), ex: w > .5 ? 'shocked' : 'sleepy', blink: w < .5, head: [30 * (1 - w), 0, 0], ...hip }); lit(H(), 1.0);
  const u = U(lt, 2.4, eOut); camW([-.4, 1.5, 11.0], [-1.4, .95, 8.6], [-.7, 1.3, 10.4], [-1.4, .95, 8.6], u, 42); dof(.3);
});
S('G02', 2.6, 'cut', (lt, t) => { // the huge screen flickers on ("พร้อมเสียงประกาศจากหน้าจอขนาดใหญ่")
  const on = lt > .9; room({ scrI: on ? 3.2 : 1.2 + Math.random() * 0 }); Wd.drawScreen(on ? 'logo' : 'static', Math.floor(lt * 12)); Wd.screenGlow(on ? 1 : .6);
  put(H(), MZ, { p: [-1.4, 0, 8.6], ry: 25, sit: true, seat: .5, ex: 'shocked', blink: false, head: [-8, 0, 0], ...hip }); lit(H(), .8);
  const u = U(lt, 2.9, eSine); camW([-2.0, 1.5, 6.4], [0, 1.65, 11], [-1.8, 1.5, 6.9], [0, 1.65, 11], u, 52); dof(.2);
});
const scr = (lt, mode, n = 0, d = 2.6, o = {}) => { // push-in on the room screen with the hero's head in the foreground
  room({ scrI: 3.4, scrC: o.c || '#7ab0ff' }); Wd.drawScreen(mode, n); Wd.screenGlow(1, o.c || '#7ab0ff');
  put(H(), MZ, { p: [.72, 0, 7.9], ry: 0, ex: o.ex || 'shocked', blink: blinkAt(SH.t, 1), head: [-10, 0, 0], ...(o.pose || hip) }); lit(H(), 1.2);
  const u = U(lt, d, eSine); camW([.95, 1.95, 6.2], [-.1, 1.75, 11], [.9, 1.95, 6.6], [-.1, 1.75, 11], u, 54); dof(.1); };
S('G03', 5.6, 'whip', (lt, t) => scr(lt, 'welcome', 0, 2.6, { ex: 'worried' }));
S('G04', 8.25, 'cut', (lt, t) => scr(lt, 'finish24', 1, 3.4, { ex: 'calm' }));
S('G05', 11.65, 'whip', (lt, t) => { // 100 million: coins rain in the room
  scr(lt, 'money', 0, 2.9, { ex: lt > .6 ? 'happy' : 'shocked', pose: lt > .6 ? up2 : hip, c: '#ffd884' }); Wd.coinsBegin(); Wd.coinRain([-.5, 0, 8.6], SH.t, clamp(lt * 2), 110, 3.4, 3.2); Wd.coinsEnd();
});
S('G06', 14.55, 'cut', (lt, t) => { // every coin adds a million
  scr(lt, 'coin', 0, 4.6, { ex: 'sly', pose: { hL: [-.12, .68, .4], hR: [.12, .68, .4], pL: [-1, -.4, 0], pR: [1, -.4, 0] }, c: '#ffd884' });
});
S('G07', 19.25, 'cut', (lt, t) => { // the door opens onto fog ("แต่ทันทีที่ประตูเปิด")
  room({ scrI: 2.4, fogN: 3, fogF: 16, fog: '#2a3466' }); Wd.drawScreen('off'); Wd.screenGlow(0); const k = eOut(clamp((lt - .2) / 1.0)); MA.door.position.y = 1.3 + k * 2.6;
  put(H(), MZ, { p: [0, 0, 7.4], ry: 180, ex: 'worried', ...hip }); lit(H(), 1.2);
  const u = U(lt, 1.9, eSine); camW([.5, 1.4, 10.4], [0, 1.2, 5], [.3, 1.35, 9.6], [0, 1.2, 5], u, 42);
});
// --- THE MAZE ---
S('G08', 21.15, 'cut', (lt, t) => { // he can barely see ("แทบมองไม่เห็นอะไรเลย")
  maze({}, [0, 1, 3, 5]); const z = 3.6 - lt * .4; put(H(), MZ, { p: [0, 0, z], ry: 180 + 35 * Math.sin(lt * 1.6), walk: { ph: lt * 4, stride: .08 }, ex: 'worried', blink: blinkAt(t, 1), head: [0, 20 * Math.sin(lt * 1.6 + 1), 0], look: [Math.sin(lt * 1.6 + 1), 0], hL: [-.4, .7, .5], hR: [.4, .7, .5], pL: [-1, -.3, 0], pR: [1, -.3, 0] }); lit(H(), 1.4);
  const u = U(lt, 3.6, eSine); camW([.3, 1.3, z - 2.6], [0, 1.15, z], [.1, 1.25, z - 2.1], [0, 1.15, z], u, 42); dof(.2);
});
S('G09', 24.75, 'cut', (lt, t) => { // only a few metres: the corridor dissolves into fog ("นอกจากระยะไม่กี่เมตรตรงหน้า")
  maze({}, [0, 1, 0, 5]); const z = 2.2 - lt * .6; put(H(), MZ, { p: [0, 0, z], ry: 180, walk: { ph: lt * 5, stride: .1 }, ex: 'worried', ...hip }); lit(H(), 1.2);
  const u = U(lt, 2.4, eSine); camW([0, 2.4, z + 3.4], [0, 1.0, z - 4], [0, 2.0, z + 2.6], [0, 1.0, z - 4], u, 46);
});
S('G10', 27.15, 'dis', (lt, t) => { // a small screen on the wall: the last announcement ("และเสียงประกาศสุดท้าย")
  maze({}, [0, 1, -3, 5]); Wd.drawScreen('silence', 0, Math.sin(t * 8) > 0 ? 1 : 0); Wd.screenGlow(1, '#ff5a5a'); const p = Wd.pts[0]; p.position.set(.9, 1.9, -3.5); p.color.set('#ff5a5a'); p.intensity = 2.2;
  put(H(), MZ, { p: [.35, 0, -3.3], ry: 90, ex: lt > 1.4 ? 'scared' : 'shocked', blink: false, sweat: lt > 1.4, ...hip }); lit(H(), 1.0, '#ffb0b0');
  const u = U(lt, 2.9, eSine); camW([-1.35, 2.0, -3.15], [1.38, 1.8, -3.5], [-1.25, 2.0, -3.3], [1.38, 1.8, -3.5], u, 50); dof(.1);
});
S('G11', 30.5, 'cut', (lt, t) => { // "หากส่งเสียง คุณจะถูกล่า": red eyes open in the fog behind him
  maze({ fog: '#2e2a5a' }, [0, 1, -3, 5]); Wd.drawScreen('hunt', 0, Math.sin(t * 8) > 0 ? 1 : 0); Wd.screenGlow(1, '#ff5a5a'); const p = Wd.pts[0]; p.position.set(.9, 1.9, -3.5); p.color.set('#ff5a5a'); p.intensity = 2.2;
  put(H(), MZ, { p: [-.2, 0, -3.2], ry: 60, ex: 'scared', sweat: true, blink: false, ...hug }); lit(H(), 1.0, '#ffb0b0');
  const ey = sstep(1.3, 1.8, lt); if (ey > 0) { Wd.shadowAt(0, [-1.0, 0, -8.5], 0, t, 0, { eye: ey }); Wd.shadowAt(1, [.9, 0, -9.5], 0, t, 0, { eye: ey }); }
  const u = U(lt, 3.0, eSine); camW([-.2, 1.2, -.3], [-.1, 1.15, -6], [-.2, 1.2, -.9], [-.1, 1.15, -6], u, 40); dof(.1);
});
S('G12', 33.6, 'cut', (lt, t) => { // he feels his way along the wall ("เขาค่อย ๆ คลำทางไปตามกำแพง")
  maze({}, [-1, 1, -7, 5]); const z = -5 - lt * .45; put(H(), MZ, { p: [-1.05, 0, z], ry: 180, walk: { ph: lt * 3.2, stride: .07 }, lean: 6, ex: 'worried', sweat: true, blink: blinkAt(t, 1), look: [-1, 0], head: [0, -20, 0], hL: [-.55, .75, .2 + .1 * Math.sin(lt * 3)], pL: [-1, 0, .3], hR: [.2, .6, .4], pR: [1, -.3, 0] }); lit(H(), 1.3);
  const u = U(lt, 2.6, eSine); camW([.6, 1.25, z - 2.5], [-1.0, 1.1, z], [.5, 1.3, z - 2.0], [-1.0, 1.1, z], u, 42); dof(.2);
});
const TDROP = 37.5;
S('G13', 36.25, 'cut', (lt, t) => { // a coin slips out and hits the floor ("แต่จู่ ๆ เสียงเหรียญก็ตกกระทบพื้น")
  maze({}, [-1, .5, -6.2, 3]); const z = -6.15; const f = t - TDROP; const sh = f > 0;
  put(H(), MZ, { p: [-1.05, 0, z], ry: 180, ex: sh ? 'shocked' : 'worried', sweat: true, blink: false, head: sh ? [24, 0, 0] : [0, -20, 0], hL: [-.55, .75, .2], pL: [-1, 0, .3], hR: [.2, .6, .4], pR: [1, -.3, 0] }); lit(H(), 1.3);
  scene.updateMatrixWorld(); const pk = H().torso.localToWorld(V(.25, .25, .1)); const fall = clamp((t - (TDROP - .45)) / .45);
  if (fall <= 0) MA.coin1.position.copy(HIDE); else if (f < 0) { MA.coin1.position.set(pk.x, lerp(pk.y, .02, fall * fall), pk.z - .15); MA.coin1.rotation.set(fall * 8, 0, fall * 3); } else { const b = Math.abs(Math.sin(f * 14)) * .12 * Math.exp(-f * 3); MA.coin1.position.set(pk.x + f * .15, .02 + b, pk.z - .15 - f * .1); MA.coin1.rotation.set(Math.exp(-f * 3) * Math.sin(f * 20) * .6, 0, Math.exp(-f * 3) * Math.cos(f * 20) * .6); if (f < .15) SH.a = .4; }
  const g = MA.glints[0]; g.position.copy(MA.coin1.position).add(V(0, .05, 0)); g.material.opacity = fall > 0 ? .9 : 0;
  const u = U(lt, 1.2, eOut); camW([0, 1.05, z - 3.2], [-.75, .55, z - .1], [-.1, 1.0, z - 2.8], [-.75, .5, z - .1], u, 42); dof(.3);
});
S('G14', 39.5, 'cut', (lt, t) => { // footsteps far away: a shape stirs in the fog ("เสียงฝีเท้าประหลาดดังขึ้นจากที่ไกล ๆ")
  maze({}, [0, 1, -14, 6]); Wd.shadowAt(0, [.2, 0, -15 + lt * .6], 0, t, .3, { eye: sstep(.5, 1.2, lt) }); Wd.shadowAt(1, [-.8, 0, -18 + lt * .5], 0, t, .3, { eye: sstep(1.4, 2.0, lt) });
  const u = U(lt, 2.8, eSine); camW([.3, .4, -8.0], [0, 1.4, -16], [.2, .45, -9.0], [0, 1.4, -16], u, 40, lerp(0, -4, u));
});
S('G15', 42.85, 'whip', (lt, t) => { // they run at him; he runs ("และสิ่งมีชีวิตสีดำก็เริ่มวิ่งตรงมาหาเขา")
  maze({}, [0, 1, -10, 8]);
  if (lt < 1.7) { const z = -15 + lt * 4.4; [0, 1, 2].forEach(i => Wd.shadowAt(i, [(i - 1) * .7, 0, z - i * 1.5], 0, t, 1)); const u = U(lt, 1.7, eIn); camW([0, 1.1, -6.6], [0, 1.4, -12], [0, 1.0, -7.4], [0, 1.4, -11], u, 42); return; }
  const w = lt - 1.7, z = -7.5 - w * 3.2; put(H(), MZ, { p: [0, 0, z], ry: 180, walk: { ph: w * 13, stride: .2 }, lean: 18, ex: 'scared', sweat: true, ...runA(w * 13) }); lit(H(), 1.4);
  Wd.shadowAt(0, [.3, 0, z + 4.2 - w * .3], 180, t, 1);
  const u = U(w, 1.6, eSine); camW([.2, 1.25, z - 2.6], [0, 1.15, z], [.1, 1.2, z - 2.4], [0, 1.15, z], u, 44); dof(.2);
});
// --- THE COIN HALL ---
const HALL = [0, 0, -29.5];
function hallCoins(n = 40, t = 0) { Wd.coinsBegin(); Wd.coinField([-.2, 0, -28.6], 12, 4, 1.0); Wd.coinField([-1.2, 0, -30.4], n * .5 | 0, 5, 1.0); Wd.coinField([1.2, 0, -29.4], n * .5 | 0, 6, 1.0); Wd.coinsEnd(); }
S('G16', 46.75, 'cut', (lt, t) => { // he stumbles into a wider hall: gold glows on the floor ("ระหว่างทาง")
  maze({ fogF: 13 }, [0, 1, -28, 6]); hallCoins(30); const z = -24.8 - lt * 1.2; put(H(), MZ, { p: [0, 0, z], ry: 180, walk: { ph: lt * 7, stride: .12 }, ex: 'shocked', blink: false, ...hip }); lit(H(), 1.4);
  MA.glints.slice(0, 3).forEach((g, i) => { g.position.set([-.2, -2.6, 2.6][i], .15, [-28.6, -30.5, -29][i]); g.material.opacity = .7 + .3 * Math.sin(t * 6 + i); });
  const u = U(lt, 1.2, eOut); camW([.6, 1.6, -21.6], [0, .6, -28.8], [.4, 1.5, -22.4], [0, .6, -28.8], u, 44);
});
S('G17', 47.9, 'cut', (lt, t) => { // close: a dozen gold coins ("เขาพบเหรียญทองนับสิบเหรียญ")
  maze({ fogF: 13 }, [0, .5, -28.6, 3]); hallCoins(30); MA.glints.slice(0, 3).forEach((g, i) => { g.position.set(-.2 + (i - 1) * .4, .12, -28.6 + i * .2); g.material.opacity = .5 + .5 * Math.max(0, Math.sin(t * 5 + i * 2)); });
  put(H(), MZ, { p: [-.2, 0, -27.3], ry: 180, lean: 20, ex: 'happy', blink: blinkAt(t, 1), head: [30, 0, 0], hL: [-.2, .4, .6], hR: [.2, .4, .6], pL: [-1, -.3, 0], pR: [1, -.3, 0] }); lit(H(), 1.4);
  const u = U(lt, 2.0, eSine); camW([.9, .7, -29.9], [-.2, .35, -28.4], [.7, .8, -29.6], [-.2, .4, -28.4], u, 42); dof(.35);
});
function greedy(C, bag, p, ry, t, lt, k, fast = 1) { const ph = lt * 9 * fast; put(C, MZ, { p, ry, lean: 26, ex: 'happy', sweat: true, blink: blinkAt(t, 2), head: [20, 0, 0], hL: [-.25, .3 + .1 * Math.sin(ph), .6 + .15 * Math.sin(ph)], hR: [.25, .3 - .1 * Math.sin(ph), .6 - .15 * Math.sin(ph)], pL: [-1, -.3, 0], pR: [1, -.3, 0] });
  propAt(bag, C, [-.5, .15, -.1]); bag.scale.setScalar(k); bag.position.y = .3 * k; }
S('G18', 50.35, 'whip', (lt, t) => { // the others scoop gold like mad ("แต่ผู้เล่นคนอื่นกลับกำลังเก็บมันอย่างบ้าคลั่ง")
  maze({ fogF: 13 }, [0, 1, -30, 6]); hallCoins(40 - lt * 8); const k = .9 + lt * .2;
  greedy(P2(), MA.bags[0], [-.7, 0, -29.6], 20, t, lt, k); greedy(P3(), MA.bags[1], [.7, 0, -29.0], -20, t, lt, k, 1.2); lit(P2(), 1.4);
  Wd.pts[2].position.set(2.3, 2.1, -27.4); Wd.pts[2].intensity = 1.4; Wd.pts[2].color.set('#ffe2a0');
  const u = U(lt, 2.5, eSine); camW([0, 1.9, -24.4], [0, .9, -29.4], [0, 1.6, -25.0], [0, .9, -29.4], u, 50); dof(.15);
});
S('G19', 52.9, 'cut', (lt, t) => { // the sack grows, he slows ("จนร่างกายหนักขึ้นเรื่อย ๆ")
  maze({ fogF: 13 }, [-2, 1, -31, 5]); const C = P2(), z = -30.6 + lt * .25, k = 1.3 + lt * .15, ph = lt * 3;
  put(C, MZ, { p: [-2.0, 0, z], ry: -20, walk: { ph, stride: .05 }, lean: 30, hipY: -.04, ex: 'worried', sweat: true, blink: blinkAt(t, 2), hL: [-.4, .25, .2], hR: [.4, .25, .2], pL: [-1, -.3, 0], pR: [1, -.3, 0] });
  propAt(MA.bags[0], C, [0, .2, -.7]); MA.bags[0].scale.setScalar(k); MA.bags[0].position.y = .32 * k; lit(C, 1.4);
  const u = U(lt, 2.3, eSine); camW([-1.5, 1.15, z + 3.0], [-2.0, .95, z], [-1.7, 1.1, z + 2.6], [-2.0, .95, z], u, 44); dof(.25);
});
S('G20', 55.3, 'cut', (lt, t) => { // she can't run any more; eyes in the fog behind ("และไม่สามารถวิ่งหนีได้อีก")
  maze({ fogF: 13 }, [2, 1, -31, 5]); const C = P3(), k = 1.6, ph = lt * 2;
  put(C, MZ, { p: [2.1, 0, -31.2], ry: 20, walk: { ph, stride: .04 }, lean: 24, ex: 'scared', sweat: true, blink: false, hL: [-.4, .3, .15], hR: [.4, .3, .15], pL: [-1, -.3, 0], pR: [1, -.3, 0] });
  propAt(MA.bags[1], C, [0, .2, -.75]); MA.bags[1].scale.setScalar(k); MA.bags[1].position.y = .32 * k; lit(C, 1.4);
  Wd.shadowAt(0, [1.0, 0, -35.5 + lt * .6], 20, t, .4, { eye: sstep(.4, 1, lt) }); Wd.shadowAt(1, [3.2, 0, -36.5 + lt * .5], -20, t, .4, { eye: sstep(.9, 1.5, lt) });
  const u = U(lt, 2.4, eSine); camW([2.6, 1.15, -27.9], [2.1, 1.0, -31.6], [2.5, 1.1, -28.6], [2.1, 1.0, -31.6], u, 42); dof(.1);
});
S('G21', 57.85, 'whip', (lt, t) => { // a scream across the maze; he spins round ("เมื่อเสียงกรีดร้องดังขึ้นทั่วเขาวงกต")
  maze({ fog: '#3a2a5a', fogF: 12 }, [0, 1, -33, 6]); const sp = eOut(clamp(lt / .5));
  put(H(), MZ, { p: [0, 0, -33.2], ry: lerp(180, 20, sp), ex: 'scared', sweat: true, blink: false, ...up2 }); lit(H(), 1.4, '#ffc0c0'); SH.a = .5 * Math.exp(-lt * 1.5);
  [0, 1, 2].forEach(i => Wd.shadowAt(i, [(i - 1) * 2.0, 0, -29.2 - i * .4], 180 + (i - 1) * 20, t, .3, { s: 1.15 }));
  const u = U(lt, 2.9, eOut); camW([.4, 1.2, -36.4], [0, 1.2, -32], [.3, 1.3, -37.4], [0, 1.25, -31], u, 42); dof(.1);
});
S('G22', 60.85, 'cut', (lt, t) => { // he empties his pockets ("เขาจึงตัดสินใจทิ้งเหรียญทั้งหมด")
  maze({}, [0, 1, -37, 5]); const C = H(), op = sstep(.3, .7, lt);
  put(C, MZ, { p: [0, 0, -37], ry: 20, ex: 'determined', blink: blinkAt(t, 1), ...(op > .5 ? { hL: [-.45, .45, .5], hR: [.45, .45, .5], pL: [-1, -.4, 0], pR: [1, -.4, 0] } : { hL: [-.3, .3, .2], hR: [.3, .3, .2], pL: [-1, -.3, 0], pR: [1, -.3, 0] }) }); lit(C, 1.5);
  Wd.coinsBegin(); const r = rng(9); scene.updateMatrixWorld(); for (let i = 0; i < 14; i++) { const hnd = C.torso.localToWorld(V(i % 2 ? .45 : -.45, .45, .5)); const d = clamp(lt - .55 - (i % 7) * .06); const y = Math.max(.015, hnd.y - 4.9 * d * d); if (d > 0) Wd.coinAt(hnd.x + (r() - .5) * .3 + d * (r() - .5), y, hnd.z + (r() - .5) * .2, d * 9 + i, 0, i); } Wd.coinsEnd();
  const u = U(lt, 1.9, eOut); camW([.4, 1.25, -34.2], [0, .9, -37], [.3, 1.2, -34.8], [0, .9, -37], u, 42); dof(.25);
});
S('G23', 63.0, 'whip', (lt, t) => { // he sprints for the line, never looking back ("และวิ่งไปยังเส้นชัยโดยไม่หันกลับมามอง")
  maze({}, [0, 1, -48, 10]); const z = -42 - lt * 4.0; put(H(), MZ, { p: [0, 0, z], ry: 180, walk: { ph: lt * 14, stride: .22 }, lean: 20, ex: 'determined', sweat: true, ...runA(lt * 14) }); lit(H(), 1.5);
  Wd.shadowAt(0, [-.5, 0, z + 4.8 - lt * .2], 180, t, 1); Wd.shadowAt(1, [.6, 0, z + 6.5], 180, t, 1);
  const u = U(lt, 2.9, eSine); camW([.6, 1.2, z - 2.8], [0, 1.15, z + .5], [-.4, 1.4, z - 2.4], [0, 1.15, z + .5], u, 44); dof(.15);
});
S('G24', 66.3, 'cut', (lt, t) => { // the gate ahead in the light ("ในวินาทีสุดท้าย")
  fin({ scrI: 3 }); Wd.drawScreen('count', 3 - Math.floor(lt / .6)); Wd.screenGlow(1, '#ff7a7a'); MA.gateM.emissiveIntensity = .5 + .5 * Math.sin(t * 12);
  const z = -54.5 - lt * 3.4; put(H(), MZ, { p: [0, 0, z], ry: 180, walk: { ph: lt * 14, stride: .22 }, lean: 20, ex: 'determined', sweat: true, ...runA(lt * 14) }); lit(H(), 1.4);
  const u = U(lt, 1.65, eSine); camW([0, .45, z + 2.6], [0, 1.6, -60], [0, .5, z + 2.2], [0, 1.7, -60], u, 46);
});
S('G25', 67.95, 'cut', (lt, t) => { // the leap across the line ("เขากระโดดผ่านเส้นชัยได้สำเร็จ")
  fin({ scrI: 3 }); Wd.drawScreen('count', 1); Wd.screenGlow(1, '#ff7a7a'); const j = clamp(lt / 1.4), z = lerp(-59, -61.2, j), y = Math.sin(Math.PI * j) * .55, land = lt > 1.4;
  put(H(), MZ, { p: [0, 0, z], ry: 180, hipY: land ? 0 : y, lean: land ? 10 : 25, ex: land ? 'happy' : 'determined', ...(land ? up2 : { hL: [-.5, .8, .1], hR: [.5, .8, .1], pL: [-1, -.2, 0], pR: [1, -.2, 0] }) }); lit(H(), 1.6);
  if (land) { MA.gateM.emissiveIntensity = 1.3; Wd.coinsBegin(); Wd.coinRain([0, 0, -61], t, 1, 60, 3.4, 4, 5); Wd.coinsEnd(); if (lt < 1.6) SH.a = .4; }
  const u = U(lt, 2.0, eSine); camW([1.15, 1.0, -57.4], [0, 1.05, -60.2], [1.05, 1.05, -58.0], [0, 1.05, -60.6], u, 48); dof(.15);
});
// --- THE ANNOUNCEMENT ---
const finScr = (lt, mode, n, o = {}) => { fin({ scrI: 4.5, scrC: o.c }); MA.banner.visible = false; Wd.drawScreen(mode, n); Wd.screenGlow(1, o.c || '#9ad0ff'); MA.gateM.emissiveIntensity = 1;
  put(H(), MZ, { p: [0, 0, -61.4], ry: o.ry ?? 180, ex: o.ex || 'happy', blink: blinkAt(SH.t, 1), head: o.head || [-14, 0, 0], ...(o.pose || hip) }); lit(H(), 1.6); };
S('G26', 70.45, 'cut', (lt, t) => { finScr(lt, 'winner', 0, { c: '#7aff9a', ex: 'shocked' }); const u = U(lt, 1.3, eOut); camW([.5, 1.0, -56.4], [0, 3.1, -63], [.4, 1.05, -57.0], [0, 3.2, -63], u, 46); });
S('G27', 71.75, 'cut', (lt, t) => { finScr(lt, 'winner', 1, { c: '#7aff9a', ex: 'happy' }); const u = U(lt, 1.85, eSine); camW([-.8, 1.3, -55.6], [0, 2.5, -63], [-.6, 1.35, -56.4], [0, 2.6, -63], u, 50); });
S('G28', 73.6, 'cut', (lt, t) => { // 100 million: the coin rain ("พร้อมเงินรางวัล 100 ล้านบาท")
  finScr(lt, 'prize', 0, { c: '#ffd884', ex: 'happy', pose: up2, ry: 0, head: [0, 0, 0] }); H().g.position.z = -61.4; pose(H(), { p: [0, .06 * Math.abs(Math.sin(lt * 9)), -61.4], ry: 0, ex: 'happy', blink: blinkAt(t, 1), ...up2 });
  Wd.coinsBegin(); Wd.coinRain([0, 0, -61.4], t, 1, 110, 3.6, 4.2, 6); Wd.coinsEnd();
  const u = U(lt, 2.85, eSine); camW([0, 1.3, -57.6], [0, 1.5, -62], [0, 1.15, -58.4], [0, 1.45, -62], u, 42); dof(.15);
});
S('G29', 76.45, 'whip', (lt, t) => { // the screen changes; he turns ("แต่ข้อความถัดไป")
  const ch = lt > .45; finScr(lt, ch ? 'static' : 'prize', Math.floor(lt * 14), { c: ch ? '#ff7a7a' : '#ffd884', ex: ch ? 'worried' : 'happy', ry: lerp(0, 180, sstep(.5, 1.0, lt)), head: [-10, 0, 0] });
  const u = U(lt, 1.5, eOut); camW([1.6, .9, -58.0], [0, 2.5, -62.5], [1.3, 1.0, -58.6], [0, 2.6, -62.5], u, 44);
});
S('G30', 77.95, 'cut', (lt, t) => { // he freezes (and the silent beat) ("กลับทำให้เขาตัวแข็ง")
  finScr(lt, 'next', 0, { c: '#ff5a5a', ex: lt > .5 ? 'scared' : 'shocked', ry: 0, head: [-6, 0, 0] }); pose(H(), { p: [0, 0, -61.4], ry: 0, ex: lt > .5 ? 'scared' : 'shocked', blink: false, sweat: lt > 1.2, ...hip }); MA.gateM.emissiveIntensity = .3;
  const u = U(lt, 3.0, eSine); camW([0, 1.15, -58.6], [0, 1.15, -61.4], [0, 1.15, -59.6], [0, 1.15, -61.4], u, 40); dof(.4);
});
S('G31', 80.95, 'cut', (lt, t) => { // "เกมถัดไป จะเริ่มใน"
  finScr(lt, 'next', 0, { c: '#ff5a5a', ex: 'scared', ry: 180 }); MA.gateM.emissiveIntensity = .2 + .2 * Math.sin(t * 10);
  const u = U(lt, 2.1, eSine); camW([.4, 1.0, -56.4], [0, 3.1, -63], [.3, 1.05, -57.2], [0, 3.3, -63], u, 46);
});
S('G32', 83.05, 'cut', (lt, t) => { // "10 วินาที": the count starts, push into the screen
  finScr(lt, 'count', lt < 1.1 ? 10 : 9, { c: '#ff5a5a', ex: 'scared', ry: 180 }); MA.gateM.emissiveIntensity = .2;
  const u = U(lt, 2.6, eIn); camW([0, 1.6, -57.5], [0, 4.0, -63], [0, 3.6, -61.0], [0, 4.2, -63], u, 44);
});

export function initShots(timing) { TM.env = timing.env; for (let i = 0; i < SHOTS.length; i++) SHOTS[i].t1 = i + 1 < SHOTS.length ? SHOTS[i + 1].t0 : timing.end; }
export function runShot(sh, t) { reset(t); POST.vig = .32; sh.fn(t - sh.t0, t); }

export const COVER = { id: 'COVER', t0: 0, fn: (lt, t, o = {}) => {
  maze({ fogF: 14 }, [0, 1, -30, 6]); hallCoins(30);
  put(H(), MZ, { p: [0, 0, -27.8], ry: 0, ex: 'scared', sweat: true, ...up2 }); lit(H(), 1.8);
  [0, 1, 2].forEach(i => Wd.shadowAt(i, [(i - 1) * 1.6, 0, -31.5 - Math.abs(i - 1) * .6], (i - 1) * -15, 3, .2, { s: 1.1 }));
  const cm = o.cam || [0, 1.3, -23.2], g = o.tgt || [0, 1.9, -29]; camW(cm, g, cm, g, 0, o.fov || 46); dof(.1);
} };
let benchFloor = null;
export const BENCH = { id: 'BENCH', t0: 0, fn: (lt, t, o = {}) => {
  Wd.applyLight(o.light || 'finish'); MZ.visible = false;
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
