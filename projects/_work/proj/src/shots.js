// shots.js: "ต้นไม้ผลทองคำ" (55.72 s timeline incl. the 0.9 s beat at 39.45)
import { THREE, scene, camera, clamp, lerp, sstep, eIO, eOut, eIn, eSine, D2R, noise1, rng, POST, mesh, rbox, toon, group } from './engine.js';
import * as Wd from './world.js';
import { CHARS, pose, toTorso, blinkAt } from './chars.js';
const { FO, FA } = Wd;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const TM = { env: [] };
const talkAt = (t) => { const e = TM.env[Math.round(t * 30)] || 0; return e > .55 ? 1 : e > .25 ? .5 : 0; };
let SH = { a: 0, t: 0 };
function look(pos, tgt, fov = 40, roll = 0) { POST.focus = pos.distanceTo(tgt); camera.position.copy(pos); camera.fov = fov; camera.updateProjectionMatrix(); camera.up.set(0, 1, 0); if (Math.abs(pos.x - tgt.x) + Math.abs(pos.z - tgt.z) < .05) camera.up.set(0, 0, -1); camera.lookAt(tgt); if (roll) camera.rotateZ(roll * D2R);
  if (SH.a > 0) { const t = SH.t * 22; camera.rotateX(noise1(t) * .02 * SH.a); camera.rotateY(noise1(t + 50) * .02 * SH.a); camera.position.y += noise1(t + 9) * .08 * SH.a; } }
const lp = (a, b, u) => a.map((v, i) => lerp(v, b[i], u));
const TY = (p, g) => p[1] < 4 ? [g[0], g[1] - .16, g[2]] : g; // short figures: keep heads above the caption band
function camW(p0, t0, p1, t1, u, fov = 40, roll = 0) { look(V(...lp(p0, p1, u)), V(...lp(TY(p0, t0), TY(p1, t1), u)), fov, roll); }
function put(C, parent, P) { if (C.g.parent !== parent) parent.add(C.g); pose(C, P); }
const orb = (c, r, a, h) => [c[0] + Math.sin(a * D2R) * r, c[1] + h, c[2] + Math.cos(a * D2R) * r];
function dof(k) { POST.dof = k; }
const U = (lt, d, e = eIO) => e(clamp(lt / d));
const HIDE = V(0, -50, 0);
function reset(t) {
  SH.a = 0; SH.t = t; if (benchFloor) benchFloor.visible = false;
  Object.values(CHARS).forEach(C => { C.g.visible = false; });
  FO.visible = true; Wd.hideSea(); Wd.fxClear(); Wd.fireflies(t, .5); Wd.forestDry(0); Wd.saplings(0);
  Wd.treeState({});
  for (const o of [FA.sack, FA.can2, FA.wand]) { o.position.copy(HIDE); o.rotation.set(0, 0, 0); o.scale.setScalar(1); }
  Wd.sackFill(1); for (const p of [FA.pWater, FA.pFood, FA.pRes]) p.visible = false;
}
// light helpers
const _ca = new THREE.Color(), _cb = new THREE.Color();
function mixP(a, b, k) { const A = Wd.PRESETS[a], B = Wd.PRESETS[b], o = {}; for (const key in A) { const x = A[key], y = B[key]; if (typeof x === 'number') o[key] = lerp(x, y, k); else if (Array.isArray(x)) o[key] = x.map((v, i) => lerp(v, y[i], k)); else o[key] = '#' + _ca.set(x).lerp(_cb.set(y), k).getHexString(); } return o; }
function day(o = {}, f = [0, 1.3, 0, 8]) { Wd.applyLight('day', o); Wd.setShadowFocus(...f); }
function wilt(k, o = {}, f = [0, 1.3, 0, 8]) { Wd.applyLight('day', { ...mixP('day', 'wilt', k), ...o }); Wd.setShadowFocus(...f); }
function gold(o = {}, f = [0, 1.3, 0, 8]) { Wd.applyLight('gold', o); Wd.setShadowFocus(...f); }
function propAt(o, C, h, rot) { scene.updateMatrixWorld(); o.position.copy(C.torso.localToWorld(V(...h))); if (rot) o.rotation.set(...rot); }
// ---------- common character poses ----------
const hip = { hL: [-.3, .36, .12], hR: [.3, .36, .12], pL: [-1, 0, -.5], pR: [1, 0, -.5] };
const up2 = { hL: [-.42, 1.02, .3], hR: [.42, 1.02, .3], pL: [-1, -.2, .2], pR: [1, -.2, .2] };
const pointR = { hR: [.22, .78, .78], pR: [1, -.6, 0] }, pointL = { hL: [-.22, .78, .78], pL: [-1, -.6, 0] };
const hug = { hL: [-.14, .5, .34], hR: [.14, .5, .34], pL: [-1, -.3, 0], pR: [1, -.3, 0] };
const B = () => CHARS.boy, Wt = () => CHARS.witch;
// the tree states along the story
const ALL = 14;
const fruitsLeft = (n) => FA.fruits.map((_, i) => i < n ? 1 : 0);
// witch with her wand in the right hand
function witchAt(t, P, k = 1) { const w = Wt(); const hr = P.hR || [.3, .62, .5]; put(w, FO, { blink: blinkAt(t, 3), pR: [1, -.4, 0], hL: [-.3, .36, .12], ...P, hR: hr }); propAt(FA.wand, w, hr); FA.wand.rotation.set(0, w.g.rotation.y, -.25); FA.wandGlow.material.opacity = .7 * k; }
// =====================================================================
export const SHOTS = [];
const S = (id, t0, tr, fn, o = {}) => SHOTS.push({ id, t0, tr, fn, ...o });
// --- HOOK: the magic forest and the strange tree ---
S('F01', 0, 'cut', (lt, t) => { // crane down through the forest to the clearing ("ในป่าเวทมนตร์แห่งหนึ่ง")
  day({}, [0, 1.3, 0, 14]); Wd.treeState({ halo: .5 }); Wd.fireflies(t, 1); Wd.sparkles([0, .4, 0], 4, t, .6, 60, 2, .6);
  const u = U(lt, 2.1, eOut); camW([6, 16, 22], [0, 2, 0], [2.4, 3.4, 9.5], [0, 2.1, 0], u, 42, lerp(-6, 0, u)); dof(.15);
});
S('F02', 2.0, 'cut', (lt, t) => { // the tree, low and slow push ("มีต้นไม้ประหลาด")
  day(); Wd.treeState({ halo: .6, glow: .15 }); Wd.fireflies(t, 1); Wd.sparkles([0, 1.0, 0], 2.2, t, .8, 70, 3);
  const u = U(lt, 1.7, eSine); camW([0, .9, 7.8], [0, 2.1, 0], [0, 1.1, 6.3], [0, 2.15, 0], u, 44);
});
S('F03', 3.6, 'whip', (lt, t) => { // a golden fruit swinging, glint ("ที่ออกผลเป็นทองคำ")
  day(); Wd.treeState({ halo: .6, glow: .3 }); const f = FA.fruits[0]; f.rotation.z = Math.sin(t * 2.2) * .12; Wd.sparkles([f.position.x, 1.0, f.position.z], .45, t, 1, 30, 4);
  const p = Wd.fruitWorld(0); const u = U(lt, 1.5, eOut); camW([p.x + .9, p.y + .1, p.z + 2.6], [p.x, p.y + .25, p.z], [p.x + .5, p.y + .05, p.z + 2.0], [p.x, p.y + .2, p.z], u, 38); dof(.45);
});
// --- THE YOUNG MAN ---
S('F04', 5.1, 'whip', (lt, t) => { // he walks in on the path and stops dead ("ชายหนุ่มคนหนึ่ง พบมันเข้า")
  day(); Wd.treeState({ halo: .6, glow: .15 }); const st = 1.15, w = clamp(lt / st), z = lerp(6.0, 3.0, eOut(w)); const stop = lt > st;
  put(B(), FO, { p: [.15, 0, z], ry: 180, walk: stop ? null : { ph: lt * 8, stride: .14 }, ex: stop ? 'shocked' : 'calm', blink: blinkAt(t, 1), hipY: stop ? .04 * Math.max(0, 1 - (lt - st) * 4) : 0, ...(stop ? up2 : {}) });
  const u = U(lt, 2.0, eSine); camW([2.9, 1.2, 1.1], [.15, 1.05, z], [2.6, 1.25, 1.4], [.15, 1.05, z], u, 42); dof(.25);
});
S('F05', 7.1, 'cut', (lt, t) => { // close: gold in his eyes, the smile spreads ("และคิดว่าตัวเอง")
  day(); Wd.treeState({ halo: .6, glow: .25 }); const ex = lt < .5 ? 'shocked' : lt < 1.0 ? 'happy' : 'sly';
  put(B(), FO, { p: [.15, 0, 3.6], ry: 190, ex, blink: blinkAt(t, 1), head: [-12, 0, lt > 1 ? 6 : 0], ...(lt > 1 ? { hL: [-.12, .68, .4], hR: [.12, .68, .4], pL: [-1, -.4, 0], pR: [1, -.4, 0] } : hip) });
  Wd.sparkles([.15, 1.2, 3.2], .5, t, .7, 20, 6);
  const u = U(lt, 1.5, eOut); camW([1.0, 1.2, 1.2], [.15, 1.12, 3.6], [.8, 1.2, 1.55], [.15, 1.12, 3.6], u, 40); dof(.4);
});
S('F06', 8.6, 'whip', (lt, t) => { // daydream: king of a golden hill ("กำลังจะร่ำรวยมหาศาล")
  Wd.applyLight('gold', { hemiI: 2.6 }); Wd.setShadowFocus(0, 1.3, 0, 6); POST.vig = .6; Wd.treeState({ leaf: 0, fruits: 0, halo: 0 }); FA.tree.visible = false;
  Wd.goldPile([0, 0, 0], 1); Wd.sparkles([0, .4, 0], 2.4, t, 1, 90, 7, .8);
  const b = clamp(lt * 3); put(B(), FO, { p: [0, 1.42, 0], ry: 0, ex: 'happy', blink: blinkAt(t, 1), hipY: .06 * Math.abs(Math.sin(lt * 9)), ...up2, head: [-6, 0, 0] });
  const u = U(lt, 1.9, eOut); camW([0, .8, 6.2], [0, 1.9, 0], [0, 1.4, 4.6], [0, 2.1, 0], u, 42, lerp(5, 0, u)); dof(.25);
});
// --- GREED ---
function grab(t, lt, from, to, d, cam) { // picks fruits from..to-1 one after another, each in d seconds
  day(); const b = B(); const k = Math.min(to - 1, from + Math.floor(lt / d)), ph = (lt % d) / d; const left = FA.fruits.map((_, i) => i < from ? 0 : i < k ? 0 : 1);
  Wd.treeState({ fruits: left, halo: .5, glow: .1 }); const fw = Wd.fruitWorld(k); const a = Math.atan2(fw.x, fw.z); const R = Math.hypot(fw.x, fw.z) + .55;
  const p = [Math.sin(a) * R, 0, Math.cos(a) * R]; const ry = a / D2R + 180;
  put(b, FO, { p, ry, lean: 6, ex: 'sly', blink: blinkAt(t, 1), sweat: true, hL: [-.3, .5, .3], pL: [-1, -.3, 0], hR: [.12, .5, .5], pR: [1, -.4, 0] });
  const reach = ph < .55 ? eOut(ph / .55) : 1 - eIn((ph - .55) / .45); const tw = toTorso(b, fw); const hr = V(.12, .5, .5).lerp(tw, reach);
  pose(b, { p, ry, lean: 6 + reach * 10, ex: 'sly', blink: blinkAt(t, 1), sweat: true, hL: [-.32, .45, .32], pL: [-1, -.3, 0], hR: hr, pR: [1, -.4, 0] });
  if (ph > .55) FA.fruits[k].visible = false; // snatched
  propAt(FA.sack, b, [-.34, .3, .32]); FA.sack.rotation.y = b.g.rotation.y; Wd.sackFill(clamp(.3 + (k - from + ph) / (to - from) * .7));
  cam(p, a);
}
S('F07', 10.5, 'cut', (lt, t) => grab(t, lt, 0, 7, .3, (p, a) => { const u = U(lt, 2.1, eSine); camW(orb([0, 0, 0], 4.4, a / D2R + 35, 1.4), [p[0] * .6, 1.3, p[2] * .6], orb([0, 0, 0], 4.0, a / D2R + 20, 1.5), [p[0] * .6, 1.35, p[2] * .6], u, 42); dof(.25); }));
S('F08', 12.6, 'whip', (lt, t) => { // the last ones, then he turns his back on the tree ("โดยไม่สนใจต้นไม้")
  if (lt < 1.2) return grab(t, lt, 7, 14, .17, (p, a) => { camW(orb([0, 0, 0], 5.0, a / D2R + 30, 1.5), [p[0] * .6, 1.35, p[2] * .6], orb([0, 0, 0], 5.0, a / D2R + 30, 1.5), [p[0] * .6, 1.35, p[2] * .6], 0, 44); dof(.2); });
  day(); Wd.treeState({ fruits: 0, halo: .3 }); const w = lt - 1.2; const b = B();
  put(b, FO, { p: [.4 + w * .2, 0, 1.6 + w * 1.1], ry: 10, walk: { ph: w * 8, stride: .13 }, ex: 'happy', blink: blinkAt(t, 1), head: [0, 0, 6], hL: [-.3, .45, .3], pL: [-1, -.3, 0], hR: [.3, .4, .2] });
  propAt(FA.sack, b, [-.34, .25, .32]); FA.sack.rotation.y = b.g.rotation.y; Wd.sackFill(1);
  camW([0, 1.6, 6.8], [0, 1.6, 0], [0, 1.6, 6.8], [0, 1.6, 0], 0, 44);
});
// --- THE TREE DIES ---
S('F09', 14.7, 'dis', (lt, t) => { // the tree alone; the light drains ("แต่ไม่นาน")
  const k = U(lt, 1.3, eSine) * .55; wilt(k); Wd.treeState({ fruits: 0, halo: .2, dry: k * .3 }); Wd.fireflies(t, .5 - k * .8);
  const u = U(lt, 1.3, eSine); camW([-1.8, 1.0, 6.6], [0, 2.0, 0], [-1.2, 1.1, 5.6], [0, 2.05, 0], u, 42);
});
S('F10', 15.95, 'cut', (lt, t) => { // wilting time lapse ("ต้นไม้กลับเริ่มเหี่ยวเฉา")
  const k = U(lt, 1.9, eIO); wilt(.55 + .4 * k); Wd.treeState({ fruits: 0, halo: 0, dry: .2 + .7 * k, droop: k, leaf: 1 - .3 * k }); Wd.forestDry(k * .4); Wd.fireflies(t, 0);
  Wd.leavesFall(t, k * .3, '#b8964a');
  const u = U(lt, 2.0, eSine); camW([2.6, .6, 4.6], [0, 2.2, 0], [2.0, .7, 4.0], [0, 2.3, 0], u, 46, lerp(0, -4, u));
});
S('F11', 18.0, 'cut', (lt, t) => { // leaves fall ("ใบไม้ร่วง")
  const k = U(lt, 1.3, eOut); wilt(.95); Wd.treeState({ fruits: 0, halo: 0, dry: .9, droop: 1, leaf: .7 - .55 * k }); Wd.forestDry(.4); Wd.fireflies(t, 0);
  Wd.leavesFall(t + 3, .5 + .5 * k, '#c09848', 4);
  const u = U(lt, 1.4, eSine); camW([.6, .35, 2.4], [0, 3.2, 0], [.4, .4, 2.0], [0, 3.0, 0], u, 50);
});
S('F12', 19.4, 'whip', (lt, t) => { // the gold in his sack crumbles ("และผลทองคำก็แตกสลาย")
  wilt(.95, {}, [1.5, 1, 4, 6]); Wd.treeState({ fruits: 0, halo: 0, dry: .9, droop: 1, leaf: .15 }); Wd.forestDry(.4); Wd.fireflies(t, 0);
  const b = B(), hit = 20.25, f = t - hit, sh = f > 0; Wd.leavesFall(t, .25, '#c09848', 4);
  put(b, FO, { p: [1.3, 0, 4.3], ry: 200, ex: sh ? 'shocked' : 'happy', blink: !sh && blinkAt(t, 1), head: [18, 0, 0], ...(sh ? { hL: [-.36, .55, .4], hR: [.36, .55, .4], pL: [-1, -.3, 0], pR: [1, -.3, 0] } : hug) });
  propAt(FA.sack, b, [0, .48, .45]); FA.sack.rotation.y = b.g.rotation.y; Wd.sackFill(sh ? lerp(1, .25, clamp(f / .5)) : 1); FA.sackGold.visible = !sh;
  if (sh) { scene.updateMatrixWorld(); const o = FA.sack.position; Wd.shatter([[o.x, o.y + .3, o.z], [o.x + .08, o.y + .25, o.z], [o.x - .08, o.y + .25, o.z]], f, 11); if (f < .2) SH.a = .6; }
  const u = U(lt, 1.9, eOut); camW([2.0, 1.25, 1.0], [1.3, 1.0, 4.3], [1.9, 1.2, 1.3], [1.3, 1.0, 4.3], u, 40); dof(.35);
});
S('F13', 21.35, 'cut', (lt, t) => { // gold dust slips through his fingers ("ไปต่อหน้าต่อตา")
  wilt(.95, {}, [1.5, 1, 4, 6]); Wd.treeState({ fruits: 0, halo: 0, dry: .9, droop: 1, leaf: .15 }); Wd.forestDry(.4); Wd.fireflies(t, 0);
  const b = B(); put(b, FO, { p: [1.3, 0, 4.3], ry: 200, ex: 'scared', sweat: true, blink: false, head: [22, 0, 0], hL: [-.2, .55, .5], hR: [.2, .55, .5], pL: [-1, -.3, 0], pR: [1, -.3, 0] });
  propAt(FA.sack, b, [0, .4, .5]); FA.sack.rotation.y = b.g.rotation.y; Wd.sackFill(.2); FA.sackGold.visible = false;
  scene.updateMatrixWorld(); const h = b.torso.localToWorld(V(0, .55, .5)); Wd.shatter([[h.x, h.y, h.z]], .25 + (lt % .9), 12);
  const u = U(lt, 1.3, eOut); camW([1.9, 1.2, 1.5], [1.3, 1.05, 4.3], [1.8, 1.18, 1.8], [1.3, 1.05, 4.3], u, 40); dof(.4);
});
// --- THE WITCH EXPLAINS ---
S('F14', 22.6, 'dis', (lt, t) => { // she appears in a swirl of sparkles ("นักเวทหญิงจึงอธิบายว่า")
  wilt(.85, {}, [-1, 1, 2, 6]); Wd.treeState({ fruits: 0, halo: 0, dry: .9, droop: 1, leaf: .15 }); Wd.forestDry(.4); Wd.fireflies(t, 0);
  const ap = sstep(.1, .55, lt); Wd.sparkles([-.65, 0, 2.4], .7 * (1 - ap * .5), t, 1 - ap * .6, 90, 8, 1.2);
  if (ap > .4) witchAt(t, { p: [-.65, 0, 2.4], ry: 50, ex: lt > 1.2 ? 'calm' : 'confident', talk: lt > 1.0 ? talkAt(t) : 0, hR: [.3, .9, .4] });
  put(B(), FO, { p: [.6, 0, 2.9], ry: -120, ex: 'sad', blink: blinkAt(t, 1), ...hip });
  const u = U(lt, 2.2, eSine); camW([.2, 1.4, 8.4], [-.05, 1.3, 2.6], [-.1, 1.3, 7.4], [-.05, 1.25, 2.6], u, 42); dof(.25);
});
S('F15', 25.0, 'cut', (lt, t) => { // water and nutrients: two magic labels pop up by the roots ("ต้นไม้ต้องการน้ำและสารอาหาร")
  wilt(.8, {}, [0, 1, 1, 6]); Wd.treeState({ fruits: 0, halo: 0, dry: .9, droop: 1, leaf: .15 }); Wd.forestDry(.4); Wd.fireflies(t, 0);
  const k1 = eOut(clamp((lt - .55) / .35)), k2 = eOut(clamp((lt - 1.45) / .35)); const cam = V(...lp([-.4, 1.5, 7.4], [.2, 1.45, 6.6], U(lt, 3.0, eSine)));
  witchAt(t, { p: [-.8, 0, 2.0], ry: 40, ex: 'calm', talk: talkAt(t), hR: lt > .4 ? [.36, .95, .45] : [.3, .62, .5] });
  Wd.panelAt(FA.pWater, [-.2, 1.75 + .05 * Math.sin(t * 2), 1.6], k1 * .85, cam); Wd.panelAt(FA.pFood, [.55, 1.15 + .05 * Math.sin(t * 2 + 1), 1.7], k2 * .85, cam);
  Wd.sparkles([0, .1, .5], .9, t, .5, 30, 9);
  const u = U(lt, 3.0, eSine); camW([-.4, 1.5, 7.4], [-.1, 1.3, 1.4], [.2, 1.45, 6.6], [0, 1.3, 1.4], u, 42); dof(.2);
});
S('F16', 28.5, 'whip', (lt, t) => { // she points at his empty sack ("หากมนุษย์เอาแต่เก็บเกี่ยวโดยไม่ดูแล")
  wilt(.8, {}, [0, 1, 2.6, 6]); Wd.treeState({ fruits: 0, halo: 0, dry: .9, droop: 1, leaf: .15 }); Wd.forestDry(.4); Wd.fireflies(t, 0);
  witchAt(t, { p: [-.75, 0, 2.6], ry: 80, ex: 'frown', talk: talkAt(t), hR: [.22, .8, .7] });
  const b = B(); put(b, FO, { p: [.75, 0, 2.6], ry: -80, ex: 'worried', sweat: true, blink: blinkAt(t, 1), head: [14, 0, 0], ...hug }); propAt(FA.sack, b, [0, .45, .42]); FA.sack.rotation.y = b.g.rotation.y; Wd.sackFill(.2); FA.sackGold.visible = false;
  const u = U(lt, 2.4, eOut); camW([0, 1.35, 7.6], [0, 1.15, 2.6], [0, 1.3, 6.8], [0, 1.15, 2.6], u, 40); dof(.3);
});
S('F17', 31.1, 'cut', (lt, t) => { // the resource gauge drains to nothing ("ทรัพยากรที่มีค่า ก็จะหมดไป")
  wilt(.85, {}, [0, 1, 1, 6]); Wd.treeState({ fruits: 0, halo: 0, dry: .95, droop: 1, leaf: .1 }); Wd.forestDry(.5); Wd.fireflies(t, 0);
  const k = 1 - U(lt - .3, 1.3, eIn); Wd.drawRes(k); const cam = V(...lp([0, 1.6, 5.2], [0, 1.65, 4.6], U(lt, 1.6, eSine)));
  Wd.panelAt(FA.pRes, [0, 1.75, 1.6], .9, cam); if (k < .02 && lt < 1.8) SH.a = .3;
  witchAt(t, { p: [-1.0, 0, 1.5], ry: 30, ex: 'sad', talk: talkAt(t), hR: [.36, .95, .45] });
  const u = U(lt, 1.6, eSine); camW([0, 1.6, 5.2], [0, 1.55, 1.3], [0, 1.65, 4.6], [0, 1.57, 1.3], u, 42); dof(.25);
});
S('F18', 32.6, 'cut', (lt, t) => { // crane up: the whole clearing turns dry around the dead tree ("ในที่สุด")
  const k = U(lt, 1.6, eSine); wilt(.9, {}, [0, 1, 0, 20]); Wd.treeState({ fruits: 0, halo: 0, dry: 1, droop: 1, leaf: .08 }); Wd.forestDry(.5 + .5 * k); Wd.fireflies(t, 0);
  witchAt(t, { p: [-1.0, 0, 1.5], ry: 30, ex: 'sad' }); put(B(), FO, { p: [1.1, 0, 2.2], ry: -30, ex: 'sad', ...hip, head: [20, 0, 0] });
  const u = U(lt, 1.7, eIO); camW([3, 3, 9], [0, 1.4, 0], [6, 13, 16], [0, 1, 0], u, 42);
});
// --- HE MAKES AMENDS ---
S('F19', 34.2, 'cut', (lt, t) => { // head down; the empty sack drops ("ชายหนุ่มสำนึกผิด")
  wilt(.8, {}, [1, 1, 2.5, 5]); Wd.treeState({ fruits: 0, halo: 0, dry: 1, droop: 1, leaf: .08 }); Wd.forestDry(.8); Wd.fireflies(t, 0);
  const b = B(), dr = clamp((lt - .5) / .35); put(b, FO, { p: [.9, 0, 2.4], ry: 15, lean: 8, ex: 'sad', blink: blinkAt(t, 1), head: [26, 0, 0], ...(dr > 0 ? hip : hug) });
  if (dr <= 0) { propAt(FA.sack, b, [0, .45, .42]); } else { scene.updateMatrixWorld(); const s0 = b.torso.localToWorld(V(0, .45, .42)); FA.sack.position.set(s0.x, Math.max(.08, s0.y - 4.9 * Math.pow(dr * .35, 2) * 4), s0.z); }
  FA.sack.rotation.y = b.g.rotation.y; Wd.sackFill(.2); FA.sackGold.visible = false;
  const u = U(lt, 1.7, eOut); camW([.9, 1.1, 5.6], [.9, 1.0, 2.4], [.9, 1.1, 4.9], [.9, 1.0, 2.4], u, 40, lerp(-3, 0, u)); dof(.35);
});
function watering(t, lt) { const b = B(); put(b, FO, { p: [.95, 0, 1.0], ry: -110, lean: 10, ex: 'determined', blink: blinkAt(t, 1), hR: [.2, .62, .5], pR: [1, -.4, 0], hL: [-.1, .55, .45], pL: [-1, -.3, 0] });
  propAt(FA.can2, b, [.08, .62, .5]); FA.can2.rotation.set(0, b.g.rotation.y - Math.PI / 2, -.5 - .1 * Math.sin(t * 3));
  scene.updateMatrixWorld(); const sp = FA.can2.localToWorld(V(.38, .15, 0)); const d = V(-.6, 0, -.4).normalize(); Wd.waterDrops([sp.x, sp.y, sp.z], [d.x * .5, .3, d.z * .5], t, 1, 26); }
S('F20', 35.9, 'sweep', (lt, t) => { // he waters the roots, she adds her magic ("เขาจึงช่วยเธอรดน้ำต้นไม้")
  wilt(.6, {}, [0, 1, 1, 6]); Wd.treeState({ fruits: 0, halo: 0, dry: .9, droop: 1, leaf: .08 }); Wd.forestDry(.7); Wd.fireflies(t, 0);
  watering(t, lt); witchAt(t, { p: [-1.05, 0, .9], ry: 110, ex: 'happy', hR: [.3, .7 + .06 * Math.sin(t * 6), .6] }); Wd.sparkles([0, 0, .2], .8, t, .8, 50, 10, .5);
  const u = U(lt, 1.6, eSine); camW([0, 1.4, 5.6], [0, 1.0, .6], [0, 1.25, 4.6], [0, 1.0, .6], u, 42); dof(.2);
});
S('F21', 37.4, 'cut', (lt, t) => { // close on the roots: the water sinks in, a faint glow starts
  wilt(.5, {}, [0, .5, .5, 3]); Wd.treeState({ fruits: 0, halo: 0, dry: .9, droop: 1, leaf: .08 }); Wd.forestDry(.7); FA.glow2.material.opacity = .25 * U(lt, 1, eIn); Wd.fireflies(t, 0);
  watering(t, lt); Wd.sparkles([0, 0, 0], .7, t, .5, 30, 11, .3);
  const u = U(lt, 1.0, eOut); camW([-1.4, .85, 2.6], [.3, .5, .5], [-1.2, .85, 2.3], [.3, .52, .5], u, 42); dof(.3);
});
S('F22', 38.45, 'cut', (lt, t) => { // they wait (and the silent beat) ("และไม่นาน")
  wilt(.5, {}, [0, 1, 1, 6]); Wd.treeState({ fruits: 0, halo: 0, dry: .9, droop: 1, leaf: .08 }); Wd.forestDry(.7); FA.glow2.material.opacity = .25 + .2 * Math.sin(t * 3); Wd.fireflies(t, 0);
  put(B(), FO, { p: [.6, 0, 2.2], ry: 175, ex: lt > 1.3 ? 'worried' : 'calm', blink: blinkAt(t, 1), head: [-14, 0, 0], ...hip }); propAt(FA.can2, B(), [.3, .36, .14]); FA.can2.rotation.set(0, Math.PI, 0);
  witchAt(t, { p: [-.6, 0, 2.2], ry: 185, ex: 'calm', head: [-14, 0, 0], hR: [.3, .5, .3] });
  const u = U(lt, 1.95, eSine); camW([0, 1.2, 6.4], [0, 1.55, 0], [0, 1.15, 5.7], [0, 1.6, 0], u, 42); dof(.15);
});
// --- REVIVAL ---
S('F23', 40.4, 'cut', (lt, t) => { // burst of gold: leaves and fruit come back ("ต้นไม้ก็กลับมาเปล่งประกายอีกครั้ง")
  const k = U(lt, 1.4, eOut); Wd.applyLight('day', { ...mixP('wilt', 'day', k) }); Wd.setShadowFocus(0, 1.3, 0, 8); Wd.forestDry(.7 * (1 - k)); Wd.fireflies(t, k);
  const fr = FA.fruits.map((_, i) => eOut(clamp((lt - .5 - i * .07) / .3)));
  Wd.treeState({ fruits: fr, halo: .6, dry: .9 * (1 - k), droop: 1 - k, leaf: .08 + .92 * k, glow: Math.max(0, 1 - Math.abs(lt - .5) * 1.1) }); if (lt < .3) SH.a = .7;
  Wd.sparkles([0, .3, 0], 2.6, t, 1, 120, 12, 1.4);
  put(B(), FO, { p: [.75, 0, 2.6], ry: 170, ex: 'shocked', blink: false, head: [-22, 0, 0], ...up2 }); witchAt(t, { p: [-.75, 0, 2.6], ry: 190, ex: 'happy', head: [-22, 0, 0], hR: [.36, 1.0, .4] });
  const u = U(lt, 2.5, eIO); camW([0, .8, 6.8], [0, 1.6, 0], [0, 2.4, 8.4], [0, 2.2, 0], u, 44);
});
S('F24', 43.0, 'cut', (lt, t) => { // he smiles up at the tree ("เขาได้เรียนรู้ว่า")
  day(); Wd.treeState({ halo: .7, glow: .3 }); Wd.fireflies(t, 1); Wd.sparkles([0, 1, 0], 2, t, .6, 50, 13);
  put(B(), FO, { p: [.6, 0, 2.0], ry: 25, ex: 'happy', blink: blinkAt(t, 1), head: [-8, 0, 6], hL: [-.12, .6, .4], hR: [.12, .6, .4], pL: [-1, -.4, 0], pR: [1, -.4, 0] }); witchAt(t, { p: [-.75, 0, 2.6], ry: 160, ex: 'calm', head: [0, 20, 0], hR: [.3, .5, .3] });
  const u = U(lt, 1.7, eOut); camW([1.3, 1.1, 5.2], [.4, 1.35, 1.6], [1.1, 1.1, 4.5], [.4, 1.4, 1.6], u, 40); dof(.3);
});
S('F25', 44.7, 'cut', (lt, t) => { // he touches a fruit gently and lets it hang ("ความร่ำรวยที่แท้จริง")
  day(); Wd.treeState({ halo: .7, glow: .3 }); Wd.fireflies(t, 1); const b = B(), fw = Wd.fruitWorld(0), p = [fw.x + .6, 0, fw.z + .3], ry = -45;
  const reach = sstep(.1, .7, lt) * (1 - sstep(1.2, 1.6, lt)); put(b, FO, { p, ry, ex: 'calm', blink: blinkAt(t, 1), head: [-10, 0, 0], ...hip });
  const tw = toTorso(b, fw.clone().add(V(.05, -.08, .02))); pose(b, { p, ry, ex: reach > .5 ? 'happy' : 'calm', blink: blinkAt(t, 1), head: [-10, 0, 0], hL: [-.3, .36, .12], pL: [-1, 0, -.5], hR: V(.3, .36, .12).lerp(tw, reach), pR: [1, -.4, 0] });
  FA.fruits[0].rotation.z = reach > .8 ? Math.sin(t * 5) * .08 : 0; Wd.sparkles([fw.x, fw.y - .3, fw.z], .35, t, .8, 20, 14);
  const u = U(lt, 1.6, eSine); camW([fw.x - 1.5, 1.2, fw.z + 3.8], [fw.x + .3, 1.05, fw.z + .2], [fw.x - 1.2, 1.2, fw.z + 3.3], [fw.x + .3, 1.07, fw.z + .2], u, 40); dof(.35);
});
S('F26', 46.5, 'whip', (lt, t) => { // empty-handed and happy, the sack left on the grass ("ไม่ได้เกิดจากการเอาทุกอย่างมาเป็นของตัวเอง")
  day(); Wd.treeState({ halo: .7, glow: .25 }); Wd.fireflies(t, 1); const op = sstep(.6, 1.2, lt);
  put(B(), FO, { p: [.5, 0, 2.6], ry: 0, ex: op > .5 ? 'happy' : 'calm', blink: blinkAt(t, 1), ...(op > .5 ? { hL: [-.5, .7, .3], hR: [.5, .7, .3], pL: [-1, -.6, 0], pR: [1, -.6, 0] } : hip) });
  FA.sack.position.set(1.2, .1, 2.9); FA.sack.rotation.set(0, .4, 1.2); Wd.sackFill(.2); FA.sackGold.visible = false;
  const u = U(lt, 2.6, eSine); camW([.8, 1.1, 6.0], [.6, 1.25, 2.6], [.7, 1.2, 5.0], [.6, 1.3, 2.6], u, 40); dof(.3);
});
S('F27', 49.7, 'sweep', (lt, t) => { // seasons of care: he waters, golden saplings sprout ("แต่เกิดจากการรู้จักรักษา")
  gold({ hemiI: 2.6 }); Wd.treeState({ halo: .8, glow: .35 }); Wd.fireflies(t, 1); Wd.saplings(U(lt, 1.9, eOut) * .7); watering(t, lt);
  const u = U(lt, 1.9, eSine); camW(orb([0, 0, 0], 6.4, 30 + u * 25, 2.2), [0, 1.3, 0], orb([0, 0, 0], 5.8, 40 + u * 25, 2.0), [0, 1.35, 0], u, 44);
});
S('F28', 51.6, 'cut', (lt, t) => { // both sitting under the glowing tree ("สิ่งที่ทำให้เรามีความสุข")
  gold({ hemiI: 2.6 }); Wd.treeState({ halo: .8, glow: .4 }); Wd.fireflies(t, 1); Wd.saplings(.75); Wd.sparkles([0, 1, 0], 2.2, t, .5, 40, 15);
  put(B(), FO, { p: [.45, .18, 1.45], ry: 10, sit: true, seat: .18, ex: 'happy', blink: blinkAt(t, 1), head: [0, -12, 0], ...hip }); witchAt(t, { p: [-.45, .18, 1.45], ry: -10, sit: true, seat: .18, ex: 'happy', head: [0, 12, 0], hR: [.3, .45, .3] });
  const u = U(lt, 1.8, eOut); camW([0, 1.0, 5.6], [0, 1.2, 1.4], [0, 1.0, 4.9], [0, 1.25, 1.4], u, 42); dof(.25);
});
S('F29', 53.3, 'dis', (lt, t) => { // crane out: the forest glows and grows ("และเติบโต")
  gold({ hemiI: 2.6 }, [0, 1.3, 0, 20]); Wd.treeState({ halo: 1, glow: .5 }); Wd.fireflies(t, 1); Wd.saplings(.75 + .25 * U(lt, 1.6, eOut)); Wd.sparkles([0, .5, 0], 4, t, 1, 120, 16, 1);
  put(B(), FO, { p: [.45, .18, 1.45], ry: 10, sit: true, seat: .18, ex: 'happy', blink: blinkAt(t, 1), ...hip }); witchAt(t, { p: [-.45, .18, 1.45], ry: -10, sit: true, seat: .18, ex: 'happy', hR: [.3, .45, .3] });
  const u = U(lt, 2.4, eIO); camW([0, 1.6, 6.2], [0, 1.6, 0], [5, 11, 17], [0, 1.5, 0], u, 42);
});

export function initShots(timing) { TM.env = timing.env; for (let i = 0; i < SHOTS.length; i++) SHOTS[i].t1 = i + 1 < SHOTS.length ? SHOTS[i + 1].t0 : timing.end; }
export function runShot(sh, t) { reset(t); FA.tree.visible = true; POST.vig = .2; sh.fn(t - sh.t0, t); }

export const COVER = { id: 'COVER', t0: 0, fn: (lt, t, o = {}) => {
  day(); Wd.treeState({ halo: .8, glow: .35 }); Wd.fireflies(3, 1); Wd.sparkles([0, 1, 0], 2.2, 3, .7, 60, 3);
  put(B(), FO, { p: [.55, 0, 2.3], ry: -12, ex: 'happy', head: [-4, 0, 6], hL: [-.3, .36, .12], pL: [-1, 0, -.5], hR: [.42, 1.02, .3], pR: [1, -.2, .2] });
  witchAt(3, { p: [-.6, 0, 2.3], ry: 14, ex: 'confident', hR: [.3, .62, .5] });
  const cm = o.cam || [0, 1.25, 7.0], g = o.tgt || [0, 1.95, 0]; camW(cm, g, cm, g, 0, o.fov || 44); dof(.12);
} };
let benchFloor = null;
export const BENCH = { id: 'BENCH', t0: 0, fn: (lt, t, o = {}) => {
  Wd.applyLight(o.light || 'day'); FO.visible = false; Wd.WAVE.amp = .2;
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
