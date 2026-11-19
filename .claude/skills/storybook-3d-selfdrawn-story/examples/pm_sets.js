// zc.js: THE PUPPET MASTER sets for ZERO CITY (night, neon, rain). Each set is a group far from the others.
//   TRUCK  prisoner truck interior      [0, 0, 600]
//   GATE   the 100 m wall + gate        [600, 0, 0]
//   STREET neon street at night         [-600, 0, 0]
//   ALLEY  narrow brick alley           [0, 0, -600]
import { THREE, scene, toon, basic, canvasTex, mesh, rbox, group, cylBetween, rng, noise1 } from './engine.js';
import * as Wd from './world.js';
export const TRUCK = group({ p: [0, 0, 600], parent: scene }), GATE = group({ p: [600, 0, 0], parent: scene }), STREET = group({ p: [-600, 0, 0], parent: scene }), ALLEY = group({ p: [0, 0, -600], parent: scene });
export const Z = {};
const glow = (par, p, col, size, op = .6) => { const s = Wd.glowSprite(col, size, { opacity: op }); s.position.set(...p); par.add(s); return s; };
const lit = (col, ei = 1) => toon(col, { emissive: col, ei });
const neonM = (col) => { const m = basic(col); m.userData.noInk = true; return m; };
/* text sign: canvas texture on a plane, neon look (glow sprite behind) */
function sign(par, txt, p, ry, o = {}) { const w = o.w || 2, h = o.h || .7, col = o.col || '#ff2f6a', fs = o.fs || 0.62;
  const tex = canvasTex(512, Math.round(512 * h / w), (x, W, H) => { x.fillStyle = o.bg || '#140c1c'; x.fillRect(0, 0, W, H); x.strokeStyle = col; x.lineWidth = 10; x.strokeRect(10, 10, W - 20, H - 20);
    x.font = `bold ${Math.round(H * fs)}px Prompt, sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.shadowColor = col; x.shadowBlur = 24; x.fillStyle = o.txtC || '#fff4f8'; x.fillText(txt, W / 2, H / 2 + H * .04); x.fillStyle = col; x.globalAlpha = .55; x.fillText(txt, W / 2, H / 2 + H * .04); });
  const g = group({ p, r: [0, ry || 0, 0], parent: par }); const m = mesh(new THREE.PlaneGeometry(w, h), basic('#ffffff', { map: tex }), { parent: g, cast: false }); m.userData.noInk = !!o.noInk;
  mesh(rbox(w + .08, h + .08, .06), toon('#1a1420'), { p: [0, 0, -.05], parent: g }); if (o.glow !== false) glow(g, [0, 0, .3], col, Math.max(w, h) * 1.5, .32); g.userData.m = m; return g; }
/* building block with lit windows */
const WIN = ['#ffd27a', '#7ad8ff', '#ff7ab8', '#2a2438', '#2a2438', '#2a2438', '#c8b0ff'];
function building(par, p, w, h, d, col, seed, face = 1) { const R = rng(seed), g = group({ p, parent: par }); mesh(rbox(w, h, d), toon(col), { p: [0, h / 2, 0], parent: g });
  const cols = Math.max(2, Math.floor(w / 1.3)), rows = Math.max(2, Math.floor(h / 1.7));
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const wc = WIN[Math.floor(R() * WIN.length)], dark = wc === '#2a2438';
    mesh(rbox(.6, .8, .04), dark ? toon(wc) : lit(wc, .9), { p: [(c + .5) * w / cols - w / 2, 1.6 + r * 1.7, face * (d / 2 + .02)], parent: g, cast: false }); }
  mesh(rbox(w + .2, .25, d + .2), toon('#221a2c'), { p: [0, h + .12, 0], parent: g });   // roof lip
  return g; }
function puddle(par, p, r, col) { const m = mesh(new THREE.CircleGeometry(r, 20), basic(col, { transparent: true, opacity: .55 }), { p, r: [-90, 0, 0], parent: par, cast: false, recv: false }); m.scale.y = .6; m.userData.noInk = true; return m; }
function lamp(par, p, col = '#ffcf8a') { const g = group({ p, parent: par }); cylBetween([0, 0, 0], [0, 4.2, 0], .07, toon('#2a2632'), g, 8); cylBetween([0, 4.2, 0], [.8, 4.4, 0], .05, toon('#2a2632'), g, 6);
  mesh(new THREE.ConeGeometry(.28, .3, 10, 1, true), toon('#2a2632', { side: THREE.DoubleSide }), { p: [.8, 4.3, 0], parent: g }); mesh(new THREE.SphereGeometry(.13, 10, 8), lit(col, 1.4), { p: [.8, 4.18, 0], parent: g, cast: false });
  g.userData.glow = glow(g, [.8, 4.1, 0], col, 3.2, .5); return g; }
function trashBag(par, p, s = 1, col = '#22202a') { mesh(new THREE.SphereGeometry(.35 * s, 10, 8), toon(col), { p: [p[0], .28 * s, p[2]], s: [1, .8, 1.1], parent: par }); }
function crate(par, p, s = .6, ry = 0, col = '#7a5a3a') { const m = mesh(rbox(s, s, s), toon(col), { p: [p[0], (p[1] || 0) + s / 2, p[2]], r: [0, ry, 0], parent: par }); for (const y of [-.3, .3]) mesh(rbox(s * 1.01, s * .12, s * 1.01), toon('#5a4028'), { p: [0, y * s, 0], parent: m }); return m; }
function barrelFire(par, p) { const g = group({ p, parent: par }); mesh(new THREE.CylinderGeometry(.3, .28, .85, 14), toon('#5a3a2a'), { p: [0, .42, 0], parent: g }); for (const y of [.15, .7]) mesh(new THREE.TorusGeometry(.3, .025, 6, 16), toon('#2a2020'), { p: [0, y, 0], r: [90, 0, 0], parent: g });
  g.userData.fl = [0, 1, 2].map(i => { const f = mesh(new THREE.ConeGeometry(.16 - i * .03, .5 - i * .08, 8), basic(['#ff7a2a', '#ffb02a', '#fff0a0'][i]), { p: [(i - 1) * .05, .95, 0], parent: g, cast: false }); f.userData.noInk = true; return f; }); g.userData.glow = glow(g, [0, 1.1, 0], '#ff8a3a', 2.6, .6); FIRES.push(g); return g; }
const FIRES = [];
export function firesAt(t) { FIRES.forEach((g, j) => g.userData.fl.forEach((f, i) => { const s = 1 + .18 * Math.sin(t * (9 + i * 2.3) + j * 1.7 + i) + .1 * noise1(t * 6 + i * 3 + j); f.scale.set(1 + .08 * Math.sin(t * 7 + i), s, 1); f.position.y = .95 + .05 * s; }) ); }
const wanted = (par, p, ry, txt = 'WANTED') => sign(par, txt, p, ry, { w: .7, h: .95, col: '#c8b48a', bg: '#e8dcc0', txtC: '#3a2a1a', fs: .2, glow: false });

// ======================= TRUCK (interior) =======================
{ const T = TRUCK, steel = toon('#4a5060'), dk = toon('#2a2e38');
  mesh(rbox(2.6, .1, 6), toon('#3a3e48'), { p: [0, 0, 0], parent: T }); mesh(rbox(2.6, .1, 6), dk, { p: [0, 2.3, 0], parent: T });
  for (const s of [-1, 1]) { mesh(rbox(.08, 2.3, 6), steel, { p: [s * 1.3, 1.15, 0], parent: T }); mesh(rbox(.5, .45, 5.6), toon('#5a4a3a'), { p: [s * 1.02, .45, 0], parent: T });
    for (let z = -2.6; z <= 2.6; z += .65) mesh(rbox(.06, 2.3, .1), dk, { p: [s * 1.24, 1.15, z], parent: T }); }
  mesh(rbox(2.6, 2.3, .08), steel, { p: [0, 1.15, -3], parent: T });
  // small barred window in the front wall, moonlight shafts through it
  mesh(rbox(.8, .45, .1), basic('#9ab0e0'), { p: [0, 1.75, -2.95], parent: T, cast: false }).userData.noInk = true; for (let i = -1; i <= 1; i++) mesh(rbox(.04, .5, .12), dk, { p: [i * .2, 1.75, -2.93], parent: T });
  Z.truckRay = glow(T, [0, 1.6, -2.4], '#9ab8ff', 2.4, .35);
  // rear doors with a slit of light
  Z.truckDoors = [-1, 1].map(s => mesh(rbox(1.28, 2.2, .08), steel, { p: [s * .65, 1.1, 3], parent: T })); Z.outside = mesh(new THREE.PlaneGeometry(6, 4), basic('#ffb8a0'), { p: [0, 1.6, 6], r: [0, 180, 0], parent: T, cast: false }); Z.outside.userData.noInk = true; Z.outside.visible = false; Z.truckSlit = mesh(rbox(.05, 2.0, .1), basic('#cfd8ff'), { p: [0, 1.1, 2.98], parent: T, cast: false }); Z.truckSlit.userData.noInk = true;
  const ch = group({ p: [0, 2.25, .4], parent: T }); for (let i = 0; i < 6; i++) mesh(new THREE.TorusGeometry(.05, .012, 6, 12), toon('#8a8f9a'), { p: [0, -i * .085, 0], r: [0, i % 2 ? 90 : 0, 0], parent: ch }); Z.truckChain = ch;
  Z.truckLamp = glow(T, [0, 2.1, -.5], '#ffcf8a', 1.4, .45); mesh(new THREE.SphereGeometry(.08, 8, 6), lit('#ffcf8a', 1.2), { p: [0, 2.2, -.5], parent: T, cast: false });
  // wrist tag prop (shown in the close-up)
  Z.tag = group({ parent: scene }); mesh(rbox(.16, .07, .012), toon('#b8bcc6'), { parent: Z.tag }); { const tx = canvasTex(256, 112, (x, W, H) => { x.fillStyle = '#c4c8d0'; x.fillRect(0, 0, W, H); x.font = 'bold 74px Prompt, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#1c1420'; x.fillText('047', W / 2, H / 2 + 4); });
    mesh(new THREE.PlaneGeometry(.15, .062), basic('#ffffff', { map: tx }), { p: [0, 0, .008], parent: Z.tag, cast: false }); } mesh(new THREE.TorusGeometry(.035, .006, 6, 16), toon('#9aa0aa'), { p: [-.1, 0, 0], r: [0, 90, 0], parent: Z.tag }); Z.tag.visible = false; }

// ======================= GATE =======================
{ const G = GATE, wallM = toon('#3a3846'), dk = toon('#26242e');
  mesh(rbox(120, 46, 6), wallM, { p: [0, 23, -40], parent: G });                       // the wall (fog hides the top: reads as ~100 m)
  for (let x = -55; x <= 55; x += 5) mesh(rbox(.6, 46, 6.6), dk, { p: [x, 23, -40], parent: G });
  for (let x = -54; x <= 54; x += 1.2) mesh(rbox(.5, .5, .5), dk, { p: [x, 46.3, -37.5], parent: G });
  mesh(rbox(14, 14, 7), toon('#2c2a34'), { p: [0, 7, -39.8], parent: G });            // gate frame
  Z.gateDoors = [-1, 1].map(s => { const g = group({ p: [s * 5.6, 0, -36.4], parent: G }); mesh(rbox(5.6, 12, .6), toon('#4a4a56'), { p: [-s * 2.8, 6, 0], parent: g });
    for (let y = 1; y < 12; y += 1.4) mesh(rbox(5.6, .15, .7), dk, { p: [-s * 2.8, y, 0], parent: g }); for (const x of [.6, 2.8, 5]) mesh(new THREE.CylinderGeometry(.12, .12, .2, 8), toon('#6a6a78'), { p: [-s * x, 6, .4], r: [90, 0, 0], parent: g }); return g; });
  Z.gateLight = glow(G, [0, 6, -38], '#ff7a5a', 10, 0);
  Z.zsign = sign(G, 'ZERO CITY', [0, 16.2, -36.2], 0, { w: 13, h: 3, col: '#ff2340', fs: .58, txtC: '#ffe6ea' });
  // watchtowers + searchlights
  Z.beams = []; for (const s of [-1, 1]) { const tw = group({ p: [s * 16, 0, -35], parent: G }); mesh(rbox(2.4, 30, 2.4), dk, { p: [0, 15, 0], parent: tw }); mesh(rbox(3.4, 2.2, 3.4), toon('#3a3846'), { p: [0, 31, 0], parent: tw });
    mesh(rbox(3.6, .3, 3.6), dk, { p: [0, 32.3, 0], parent: tw }); const sl = mesh(new THREE.CylinderGeometry(.4, .5, .8, 10), lit('#fff4d0', 1.2), { p: [0, 31, 1.8], r: [70, 0, 0], parent: tw, cast: false });
    const beam = mesh(new THREE.ConeGeometry(2.2, 34, 20, 1, true), basic('#fff4d8', { transparent: true, opacity: .07, add: true, depthWrite: false, side: THREE.DoubleSide }), { parent: G, cast: false, recv: false }); beam.userData.noInk = true; beam.userData.base = [s * 16, 31, -33]; Z.beams.push(beam); }
  // barbed wire on top of a low fence along the road
  for (const s of [-1, 1]) { for (let z = -30; z < 14; z += 3) { cylBetween([s * 7, 0, z], [s * 7, 2.4, z], .05, toon('#3a3a44'), G, 6); }
    mesh(rbox(.04, 2.2, 44), toon('#55586a', { transparent: true, opacity: .35 }), { p: [s * 7, 1.2, -8], parent: G, cast: false });
    for (let z = -30; z < 14; z += .5) mesh(new THREE.TorusGeometry(.18, .015, 4, 8), toon('#8a8e9a'), { p: [s * 7, 2.55, z], r: [0, 90, 0], parent: G, cast: false }); }
  mesh(new THREE.PlaneGeometry(14, 60), toon('#383644'), { p: [0, .01, -10], r: [-90, 0, 0], parent: G, cast: false });  // road
  for (let z = -30; z < 14; z += 4) mesh(new THREE.PlaneGeometry(.25, 2), basic('#8a8270'), { p: [0, .02, z], r: [-90, 0, 0], parent: G, cast: false }).userData.noInk = true;
  [[-2.5, -12, 1.2], [3, -6, 1.6], [-1, 2, 1.4], [2.2, -24, 1.8]].forEach(([x, z, r], i) => puddle(G, [x, .03, z], r, ['#ff4a6a', '#8a9aff', '#ff6a4a', '#ff3050'][i]));
  // guard booth with a lamp
  { const b = group({ p: [5.2, 0, -29], parent: G }); mesh(rbox(2, 2.6, 2), toon('#4a4e5c'), { p: [0, 1.3, 0], parent: b }); mesh(rbox(1.2, .8, .05), lit('#ffd27a', .9), { p: [-1.02, 1.6, 0], r: [0, 90, 0], parent: b, cast: false }); mesh(rbox(2.3, .2, 2.3), toon('#2a2c36'), { p: [0, 2.7, 0], parent: b }); glow(b, [-1.2, 1.6, 0], '#ffd27a', 2.2, .45);
    mesh(rbox(.12, .12, 4), toon('#e2b23c'), { p: [-3, 1.05, 0], r: [0, 90, 0], parent: b }); }
  // prisoner truck (exterior)
  { const tr = group({ p: [0, 0, -18], parent: G }); Z.truckX = tr; mesh(rbox(2.6, 2.6, 5.4), toon('#3e4656'), { p: [0, 1.75, .8], parent: tr }); mesh(rbox(2.5, 1.9, 1.9), toon('#2e3442'), { p: [0, 1.4, -2.9], parent: tr });
    mesh(rbox(2.2, .8, .05), basic('#9ab0e0'), { p: [0, 1.85, -3.86], parent: tr, cast: false }).userData.noInk = true; for (const [x, z] of [[-1.15, -2.9], [1.15, -2.9], [-1.15, 1.8], [1.15, 1.8], [-1.15, 3]]) mesh(new THREE.CylinderGeometry(.45, .45, .35, 14), toon('#141418'), { p: [x, .45, z], r: [0, 0, 90], parent: tr });
    for (const s of [-1, 1]) { mesh(new THREE.CircleGeometry(.16, 12), basic('#fff4c8'), { p: [s * .85, .95, -3.86], r: [0, 180, 0], parent: tr, cast: false }).userData.noInk = true; glow(tr, [s * .85, .95, -4.3], '#fff4c8', 2.4, .5); }
    sign(tr, 'PRISON 07', [1.31, 2.2, .8], 90, { w: 2.4, h: .5, col: '#ffb02a', bg: '#3e4656', txtC: '#ffd27a', glow: false }); }
  Z.gWanted = [wanted(G, [-6.8, 1.6, -14], 90), wanted(G, [-6.8, 1.6, -20], 90, 'ไม่มีกฎ')];
}
export function gateAt(t, open = 0) { Z.gateDoors.forEach((g, i) => { g.position.x = (i ? 1 : -1) * (5.6 + open * 5); }); Z.gateLight.material.opacity = .55 * open;
  Z.beams.forEach((b, i) => { const a = Math.sin(t * .35 + i * 2) * .5, bs = b.userData.base; const dir = new THREE.Vector3(Math.sin(a) * .8, -.55, .9).normalize(); b.position.set(bs[0] + dir.x * 17, bs[1] + dir.y * 17, bs[2] + dir.z * 17);
    b.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir); }); Z.zsign.userData.m.material.color.setScalar(.85 + .15 * (Math.sin(t * 13) > -.85 ? 1 : 0)); }

// ======================= STREET (neon night) =======================
{ const S = STREET, R = rng(5);
  mesh(new THREE.PlaneGeometry(10, 90), toon('#3a3648'), { p: [0, .01, -25], r: [-90, 0, 0], parent: S, cast: false });            // wet road
  for (const s of [-1, 1]) mesh(rbox(3, .18, 90), toon('#4a4658'), { p: [s * 6.5, .09, -25], parent: S });                       // sidewalks
  const cols = ['#3a3048', '#2e3448', '#40323a', '#343a40', '#3c2c44'];
  for (const s of [-1, 1]) for (let z = 8, i = 0; z > -70; i++) { const w = 6 + R() * 5, h = 9 + R() * 16; building(S, [s * (8 + 3), 0, z - w / 2], 6, h, w, cols[i % 5], i * 7 + (s > 0 ? 3 : 0), 1).rotation.y = s * Math.PI / 2; z -= w + .2; }
  const SIG = [['BAR', '#ff2f6a'], ['24H', '#2fe0ff'], ['ร้านยา', '#3aff8a'], ['LIVE', '#ff9a2a'], ['ZERO', '#ff2340'], ['โรงแรม', '#c070ff'], ['ห้ามเข้า', '#ff4a3a'], ['MARKET', '#ffd23a']];
  Z.signs = []; SIG.forEach(([t_, c], i) => { const s = i % 2 ? 1 : -1, z = -2 - i * 7.5; const g = sign(S, t_, [s * 7.85, 4 + (i % 3) * 1.4, z], s > 0 ? -90 : 90, { w: 2.2, h: .8, col: c }); Z.signs.push(g);
    if (i % 3 === 0) { const v = sign(S, t_ === 'BAR' ? 'เบียร์' : 'OPEN', [s * 7.0, 6.6, z - 2.5], 0, { w: .7, h: 2.2, col: c, fs: .22 }); Z.signs.push(v); } });
  Z.lamps = [-6, -20, -34, -48].map((z, i) => lamp(S, [(i % 2 ? 1 : -1) * 5.3, 0, z], i % 2 ? '#ffcf8a' : '#9ad8ff')); Z.lamps.forEach((l, i) => { if (i % 2 === 0) l.rotation.y = Math.PI; });
  for (let i = 0; i < 9; i++) puddle(S, [(R() - .5) * 8, .03, -2 - i * 7 - R() * 3], .7 + R() * 1.2, ['#ff2f6a', '#2fe0ff', '#ffd23a', '#c070ff'][i % 4]);
  for (let i = 0; i < 7; i++) { const s = R() > .5 ? 1 : -1; trashBag(S, [s * (6.6 + R() * .8), 0, -4 - i * 8], .8 + R() * .5); } [[-6.6, -11], [6.8, -27], [-7, -41]].forEach(p => barrelFire(S, [p[0], 0, p[1]]));
  for (let z = -6; z > -60; z -= 9) for (const k of [0, 1]) { const a = [-(8 - .2), 6 + k * 1.3, z], b = [8 - .2, 6.5 + k * 1.1, z - 3 - k]; const mid = [0, (a[1] + b[1]) / 2 - 1.2, (a[2] + b[2]) / 2]; cylBetween(a, mid, .015, toon('#141018'), S, 4); cylBetween(mid, b, .015, toon('#141018'), S, 4); }  // sagging cables
  Z.graf = sign(S, 'STRONG ONLY', [-9.9, 1.8, -16], 90, { w: 3.2, h: 1.1, col: '#ff3a3a', bg: '#4a3848', fs: .4, glow: false });
  Z.sWanted = [wanted(S, [9.86, 1.7, -9], -90), wanted(S, [-9.86, 1.7, -24], 90, 'ระวัง')];
  // the abandoned car the strong man lifts (pushed to the sidewalk)
  { const c = group({ p: [3.2, 0, -14], parent: S }); Z.car = c; const body = toon('#6a2a34'); mesh(rbox(1.8, .7, 3.8), body, { p: [0, .65, 0], parent: c }); mesh(rbox(1.6, .6, 2), toon('#4a1c24'), { p: [0, 1.25, -.2], parent: c });
    mesh(rbox(1.5, .5, .05), basic('#5a7aa8'), { p: [0, 1.25, -1.21], parent: c, cast: false }).userData.noInk = true; for (const [x, z] of [[-.85, -1.2], [.85, -1.2], [-.85, 1.2], [.85, 1.2]]) mesh(new THREE.CylinderGeometry(.34, .34, .25, 14), toon('#141418'), { p: [x, .34, z], r: [0, 0, 90], parent: c });
    for (const s of [-1, 1]) mesh(new THREE.CircleGeometry(.12, 10), basic('#fff0c0'), { p: [s * .6, .75, -1.91], r: [0, 180, 0], parent: c, cast: false }).userData.noInk = true; }
  // steam vent
  Z.vent = [1.8, 0, -8]; mesh(rbox(1, .05, .7), toon('#2a2a32'), { p: [1.8, .03, -8], parent: S });
}
export function streetAt(t) { Z.signs.forEach((g, i) => { const fl = i === 3 && (Math.sin(t * 17) > .6 || Math.sin(t * 5.3) > .9) ? .35 : 1; g.userData.m.material.color.setScalar(fl); }); }

// ======================= ALLEY =======================
{ const A = ALLEY, brick = toon('#5a3a3a'), dk = toon('#2a2028');
  mesh(new THREE.PlaneGeometry(4, 26), toon('#34303e'), { p: [0, .01, -8], r: [-90, 0, 0], parent: A, cast: false });
  const bt = canvasTex(256, 256, (x, W, H) => { x.fillStyle = '#5a3a3a'; x.fillRect(0, 0, W, H); x.strokeStyle = '#3a2428'; x.lineWidth = 6; for (let y = 0; y <= H; y += 32) { x.beginPath(); x.moveTo(0, y); x.lineTo(W, y); x.stroke(); for (let X = (y / 32 % 2) * 32; X <= W; X += 64) { x.beginPath(); x.moveTo(X, y); x.lineTo(X, y + 32); x.stroke(); } } }, { repeat: [7, 4] });
  for (const s of [-1, 1]) { const w = mesh(rbox(.4, 10, 26), toon('#ffffff', { map: bt }), { p: [s * 2.1, 5, -8], parent: A }); w.material.color.set('#8a6a6a');
    for (let z = -18; z < 4; z += 4.5) mesh(rbox(.1, .9, .7), toon('#2a2438'), { p: [s * 1.9, 3.4 + (z % 2), z], parent: A });                    // shut windows
    cylBetween([s * 1.82, 0, -3 + s], [s * 1.82, 9, -3 + s], .07, toon('#4a4e58'), A, 8); cylBetween([s * 1.82, 6, -3 + s], [s * 1.82, 6, -12], .06, toon('#4a4e58'), A, 8); }    // pipes
  // fire escape on the right wall
  { const fe = group({ p: [1.55, 0, -6], parent: A }); for (const y of [3.2, 5.8]) { mesh(rbox(.8, .06, 2.6), dk, { p: [0, y, 0], parent: fe }); for (let z = -1.2; z <= 1.2; z += .3) cylBetween([-.38, y, z], [-.38, y + .8, z], .015, dk, fe, 4); cylBetween([-.38, y + .8, -1.25], [-.38, y + .8, 1.25], .02, dk, fe, 4); }
    for (let k = 0; k < 8; k++) mesh(rbox(.5, .04, .12), dk, { p: [-.1, 3.2 + k * .32, -1 + k * .26], parent: fe }); }
  // dumpster, crates, bags, fence at the far end
  { const d = group({ p: [-1.25, 0, -4], parent: A }); mesh(rbox(1.1, 1.1, 2), toon('#2f5a48'), { p: [0, .58, 0], parent: d }); mesh(rbox(1.2, .1, 2.1), toon('#24463a'), { p: [0, 1.18, 0], r: [0, 0, -8], parent: d }); }
  crate(A, [1.3, 0, -1.5], .6, 20); crate(A, [1.35, .6, -1.6], .5, -10); crate(A, [-1.3, 0, -9], .7, 35); trashBag(A, [1.2, 0, -10]); trashBag(A, [-1.4, 0, -12], 1.2); trashBag(A, [1.1, 0, 1.2], .9, '#1c2a24');
  for (let x = -1.9; x <= 1.9; x += .32) cylBetween([x, 0, -18.5], [x, 3, -18.5], .015, toon('#6a6e78'), A, 4); cylBetween([-1.9, 3, -18.5], [1.9, 3, -18.5], .03, toon('#6a6e78'), A, 4);
  mesh(rbox(3.8, 3, .02), toon('#8a8e9a', { transparent: true, opacity: .25 }), { p: [0, 1.5, -18.5], parent: A, cast: false });
  Z.aLamp = group({ p: [-1.85, 3.6, -7], parent: A }); mesh(rbox(.3, .2, .25), dk, { parent: Z.aLamp }); Z.aBulb = mesh(new THREE.SphereGeometry(.09, 8, 6), lit('#ffc87a', 1.4), { p: [.15, -.1, 0], parent: Z.aLamp, cast: false }); Z.aGlow = glow(Z.aLamp, [.4, -.2, 0], '#ffc87a', 3.4, .55);
  Z.aGraf = sign(A, 'ผู้แข็งแกร่งเท่านั้น', [1.88, 1.9, -13], -90, { w: 3.2, h: .9, col: '#ff4a3a', bg: '#6a4044', fs: .34, glow: false });
  [[.2, -2, .6, '#ffc87a'], [-.4, -7.5, .8, '#ff3a5a'], [.5, -13, .7, '#8a9aff']].forEach(([x, z, r, c]) => puddle(A, [x, .03, z], r, c));
  // the gunman's darkness at the end of the alley (deep black so the gun barrel + laser read)
  Z.dark = mesh(new THREE.PlaneGeometry(4, 6), basic('#05040a', { transparent: true, opacity: .9 }), { p: [0, 3, -17.5], parent: A, cast: false }); Z.dark.userData.noInk = true;
  // the gun + red laser (shown in the last shot)
  Z.gun = group({ parent: A }); Z.gun.scale.setScalar(1.7); mesh(rbox(.06, .1, .38), toon('#3a3a46'), { p: [0, 0, .1], parent: Z.gun }); mesh(new THREE.CylinderGeometry(.022, .022, .26, 10), toon('#2a2a32'), { p: [0, .02, -.18], r: [90, 0, 0], parent: Z.gun }); mesh(rbox(.05, .16, .07), toon('#1c1c22'), { p: [0, -.1, .2], r: [-15, 0, 0], parent: Z.gun });
  Z.laser = mesh(new THREE.CylinderGeometry(.006, .006, 1, 6), basic('#ff2030', { transparent: true, opacity: .85, add: true, depthWrite: false }), { parent: A, cast: false }); Z.laser.userData.noInk = true; Z.dot = glow(A, [0, 0, 0], '#ff2030', .35, 0); Z.gun.visible = Z.laser.visible = false;
}
export function alleyAt(t, flick = 1) { const f = flick && (Math.sin(t * 23) > .82 || (t % 4.1) < .08) ? .25 : 1; Z.aBulb.material.emissiveIntensity = 1.4 * f; Z.aGlow.material.opacity = .55 * f; }
export function laserAt(from, to, k) { Z.gun.visible = Z.laser.visible = k > 0; Z.dot.material.opacity = .9 * k; if (!k) return; const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to), d = b.clone().sub(a);
  Z.gun.position.copy(a); Z.gun.lookAt(ALLEY.localToWorld(b.clone())); Z.gun.rotateY(Math.PI); Z.laser.position.copy(a.clone().add(b).multiplyScalar(.5)); Z.laser.scale.set(1, d.length() * k, 1);
  Z.laser.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()); Z.dot.position.copy(b); }

export function hideZC() { TRUCK.visible = GATE.visible = STREET.visible = ALLEY.visible = false; Z.tag.visible = false; Z.truckDoors.forEach(d => { d.visible = true; }); Z.outside.visible = false; Z.truckSlit.visible = true; Z.truckSlit.scale.x = 1; Z.dark.visible = true; }
export function zcAt(t) { firesAt(t); }
