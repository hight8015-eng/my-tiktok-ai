// zc.js: THE PUPPET MASTER sets for ZERO CITY (night, neon, rain). Each set is a group far from the others.
//   TRUCK  prisoner truck interior      [0, 0, 600]
//   GATE   the 100 m wall + gate        [600, 0, 0]
//   STREET neon street at night         [-600, 0, 0]
//   ALLEY  narrow brick alley           [0, 0, -600]
import { THREE, scene, toon, basic, canvasTex, mesh, rbox, group, cylBetween, rng, noise1, sstep } from './engine.js';
import * as Wd from './world.js';
import { makeFire } from './fire.js';
import { beam, beamMat, spill, streak, glowAt, RAD, steam, steamAt } from './glow.js';
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
function puddle(par, p, r, col) { /* v5.9 a wet patch: darker soft base + the neon colour reflected, both feathered to nothing at the edge */
  const d = mesh(new THREE.PlaneGeometry(r * 2.6, r * 2.6), basic('#05040a', { transparent: true, opacity: .35, map: RAD, depthWrite: false }), { p, r: [-90, 0, 0], parent: par, cast: false, recv: false }); d.scale.y = .6; d.userData.noInk = true; d.renderOrder = 2;
  const m = mesh(new THREE.PlaneGeometry(r * 2.2, r * 2.2), basic(col, { transparent: true, opacity: .32, map: RAD, add: true, depthWrite: false }), { p: [p[0], p[1] + .005, p[2]], r: [-90, 0, 0], parent: par, cast: false, recv: false }); m.scale.y = .6; m.userData.noInk = true; m.renderOrder = 3; return m; }
function lamp(par, p, col = '#ffcf8a') { const g = group({ p, parent: par }); cylBetween([0, 0, 0], [0, 4.2, 0], .07, toon('#2a2632'), g, 14); cylBetween([0, 4.2, 0], [.8, 4.4, 0], .05, toon('#2a2632'), g, 14);
  mesh(new THREE.ConeGeometry(.28, .3, 10, 1, true), toon('#2a2632', { side: THREE.DoubleSide }), { p: [.8, 4.3, 0], parent: g }); mesh(new THREE.SphereGeometry(.13, 16, 12), lit(col, 1.4), { p: [.8, 4.18, 0], parent: g, cast: false });
  g.userData.glow = glow(g, [.8, 4.1, 0], col, 3.2, .5); return g; }
function trashBag(par, p, s = 1, col = '#22202a') { mesh(new THREE.SphereGeometry(.35 * s, 16, 12), toon(col), { p: [p[0], .28 * s, p[2]], s: [1, .8, 1.1], parent: par }); }
function crate(par, p, s = .6, ry = 0, col = '#7a5a3a') { const m = mesh(rbox(s, s, s), toon(col), { p: [p[0], (p[1] || 0) + s / 2, p[2]], r: [0, ry, 0], parent: par }); for (const y of [-.3, .3]) mesh(rbox(s * 1.01, s * .12, s * 1.01), toon('#5a4028'), { p: [0, y * s, 0], parent: m }); return m; }
function barrelFire(par, p) { const g = group({ p, parent: par }); mesh(new THREE.CylinderGeometry(.3, .28, .85, 14), toon('#5a3a2a'), { p: [0, .42, 0], parent: g }); for (const y of [.15, .7]) mesh(new THREE.TorusGeometry(.3, .025, 10, 24), toon('#2a2020'), { p: [0, y, 0], r: [90, 0, 0], parent: g });
  g.userData.fire = makeFire(g, { w: .62, h: 1.0, seed: p[0] * 3.1 + p[2], embers: 9 }); g.userData.fire.g.position.y = .82; g.userData.glow = glow(g, [0, 1.25, 0], '#ff8a3a', 2.6, .45); FIRES.push(g); return g; }
const FIRES = [];
export function firesAt(t, cam) { FIRES.forEach((g, j) => { if (g.parent && g.parent.visible) { g.userData.fire.at(t + j * 3.3, 1, cam); g.userData.glow.material.opacity = .42 + .08 * Math.sin(t * 7 + j); } }); }
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
  const ch = group({ p: [0, 2.25, .4], parent: T }); for (let i = 0; i < 6; i++) mesh(new THREE.TorusGeometry(.05, .012, 10, 24), toon('#8a8f9a'), { p: [0, -i * .085, 0], r: [0, i % 2 ? 90 : 0, 0], parent: ch }); Z.truckChain = ch;
  Z.truckLamp = glow(T, [0, 2.1, -.5], '#ffcf8a', 1.4, .45); mesh(new THREE.SphereGeometry(.08, 16, 12), lit('#ffcf8a', 1.2), { p: [0, 2.2, -.5], parent: T, cast: false });
  // wrist tag prop (shown in the close-up)
  Z.tag = group({ parent: scene }); mesh(rbox(.16, .07, .012), toon('#b8bcc6'), { parent: Z.tag }); { const tx = canvasTex(256, 112, (x, W, H) => { x.fillStyle = '#c4c8d0'; x.fillRect(0, 0, W, H); x.font = 'bold 74px Prompt, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#1c1420'; x.fillText('047', W / 2, H / 2 + 4); });
    mesh(new THREE.PlaneGeometry(.15, .062), basic('#ffffff', { map: tx }), { p: [0, 0, .008], parent: Z.tag, cast: false }); } mesh(new THREE.TorusGeometry(.035, .006, 10, 24), toon('#9aa0aa'), { p: [-.1, 0, 0], r: [0, 90, 0], parent: Z.tag }); Z.tag.visible = false; }

// ======================= GATE =======================
{ const G = GATE, wallM = toon('#3a3846'), dk = toon('#26242e');
  mesh(rbox(120, 46, 6), wallM, { p: [0, 23, -40], parent: G });                       // the wall (fog hides the top: reads as ~100 m)
  for (let x = -55; x <= 55; x += 5) mesh(rbox(.6, 46, 6.6), dk, { p: [x, 23, -40], parent: G });
  for (let x = -54; x <= 54; x += 1.2) mesh(rbox(.5, .5, .5), dk, { p: [x, 46.3, -37.5], parent: G });
  mesh(rbox(14, 14, 7), toon('#2c2a34'), { p: [0, 7, -39.8], parent: G });            // gate frame
  Z.gateDoors = [-1, 1].map(s => { const g = group({ p: [s * 5.6, 0, -36.4], parent: G }); mesh(rbox(5.6, 12, .6), toon('#4a4a56'), { p: [-s * 2.8, 6, 0], parent: g });
    for (let y = 1; y < 12; y += 1.4) mesh(rbox(5.6, .15, .7), dk, { p: [-s * 2.8, y, 0], parent: g }); for (const x of [.6, 2.8, 5]) mesh(new THREE.CylinderGeometry(.12, .12, .2, 18), toon('#6a6a78'), { p: [-s * x, 6, .4], r: [90, 0, 0], parent: g }); return g; });
  Z.gateLight = glow(G, [0, 6, -38], '#ff7a5a', 10, 0);
  Z.zsign = sign(G, 'ZERO CITY', [0, 16.2, -36.2], 0, { w: 13, h: 3, col: '#ff2340', fs: .58, txtC: '#ffe6ea' });
  // watchtowers + searchlights
  Z.beams = []; for (const s of [-1, 1]) { const tw = group({ p: [s * 16, 0, -35], parent: G }); mesh(rbox(2.4, 30, 2.4), dk, { p: [0, 15, 0], parent: tw }); mesh(rbox(3.4, 2.2, 3.4), toon('#3a3846'), { p: [0, 31, 0], parent: tw });
    mesh(rbox(3.6, .3, 3.6), dk, { p: [0, 32.3, 0], parent: tw }); const sl = mesh(new THREE.CylinderGeometry(.4, .5, .8, 18), lit('#fff4d0', 1.2), { p: [0, 31, 1.8], r: [70, 0, 0], parent: tw, cast: false });
    const beam = mesh(new THREE.ConeGeometry(2.2, 34, 20, 1, true), basic('#fff4d8', { transparent: true, opacity: .07, add: true, depthWrite: false, side: THREE.DoubleSide }), { parent: G, cast: false, recv: false }); beam.userData.noInk = true; beam.userData.base = [s * 16, 31, -33]; Z.beams.push(beam); }
  // barbed wire on top of a low fence along the road
  for (const s of [-1, 1]) { for (let z = -30; z < 14; z += 3) { cylBetween([s * 7, 0, z], [s * 7, 2.4, z], .05, toon('#3a3a44'), G, 14); }
    mesh(rbox(.04, 2.2, 44), toon('#55586a', { transparent: true, opacity: .35 }), { p: [s * 7, 1.2, -8], parent: G, cast: false });
    for (let z = -30; z < 14; z += .5) mesh(new THREE.TorusGeometry(.18, .015, 10, 24), toon('#8a8e9a'), { p: [s * 7, 2.55, z], r: [0, 90, 0], parent: G, cast: false }); }
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
export function gateAt(t, open = 0) { Z.gateDoors.forEach((g, i) => { g.position.x = (i ? 1 : -1) * (5.6 + open * 5); }); Z.gateLight.material.opacity = .55 * open; if (Z.gateBeam) { Z.gateBeam.visible = open > .02; Z.gateBeam.material.uniforms.uOp.value = .14 * open; }
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
  for (let z = -6; z > -60; z -= 9) for (const k of [0, 1]) { const a = [-(8 - .2), 6 + k * 1.3, z], b = [8 - .2, 6.5 + k * 1.1, z - 3 - k]; const mid = [0, (a[1] + b[1]) / 2 - 1.2, (a[2] + b[2]) / 2]; cylBetween(a, mid, .015, toon('#141018'), S, 14); cylBetween(mid, b, .015, toon('#141018'), S, 14); }  // sagging cables
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
    cylBetween([s * 1.82, 0, -3 + s], [s * 1.82, 9, -3 + s], .07, toon('#4a4e58'), A, 14); cylBetween([s * 1.82, 6, -3 + s], [s * 1.82, 6, -12], .06, toon('#4a4e58'), A, 14); }    // pipes
  // fire escape on the right wall
  { const fe = group({ p: [1.55, 0, -6], parent: A }); for (const y of [3.2, 5.8]) { mesh(rbox(.8, .06, 2.6), dk, { p: [0, y, 0], parent: fe }); for (let z = -1.2; z <= 1.2; z += .3) cylBetween([-.38, y, z], [-.38, y + .8, z], .015, dk, fe, 14); cylBetween([-.38, y + .8, -1.25], [-.38, y + .8, 1.25], .02, dk, fe, 14); }
    for (let k = 0; k < 8; k++) mesh(rbox(.5, .04, .12), dk, { p: [-.1, 3.2 + k * .32, -1 + k * .26], parent: fe }); }
  // dumpster, crates, bags, fence at the far end
  { const d = group({ p: [-1.25, 0, -4], parent: A }); mesh(rbox(1.1, 1.1, 2), toon('#2f5a48'), { p: [0, .58, 0], parent: d }); mesh(rbox(1.2, .1, 2.1), toon('#24463a'), { p: [0, 1.18, 0], r: [0, 0, -8], parent: d }); }
  crate(A, [1.3, 0, -1.5], .6, 20); crate(A, [1.35, .6, -1.6], .5, -10); crate(A, [-1.3, 0, -9], .7, 35); trashBag(A, [1.2, 0, -10]); trashBag(A, [-1.4, 0, -12], 1.2); trashBag(A, [1.1, 0, 1.2], .9, '#1c2a24');
  for (let x = -1.9; x <= 1.9; x += .32) cylBetween([x, 0, -18.5], [x, 3, -18.5], .015, toon('#6a6e78'), A, 14); cylBetween([-1.9, 3, -18.5], [1.9, 3, -18.5], .03, toon('#6a6e78'), A, 14);
  mesh(rbox(3.8, 3, .02), toon('#8a8e9a', { transparent: true, opacity: .25 }), { p: [0, 1.5, -18.5], parent: A, cast: false });
  Z.aLamp = group({ p: [-1.85, 3.6, -7], parent: A }); mesh(rbox(.3, .2, .25), dk, { parent: Z.aLamp }); Z.aBulb = mesh(new THREE.SphereGeometry(.09, 16, 12), lit('#ffc87a', 1.4), { p: [.15, -.1, 0], parent: Z.aLamp, cast: false }); Z.aGlow = glow(Z.aLamp, [.4, -.2, 0], '#ffc87a', 3.4, .55);
  Z.aGraf = sign(A, 'ผู้แข็งแกร่งเท่านั้น', [1.88, 1.9, -13], -90, { w: 3.2, h: .9, col: '#ff4a3a', bg: '#6a4044', fs: .34, glow: false });
  [[.2, -2, .6, '#ffc87a'], [-.4, -7.5, .8, '#ff3a5a'], [.5, -13, .7, '#8a9aff']].forEach(([x, z, r, c]) => puddle(A, [x, .03, z], r, c));
  // the gunman's darkness at the end of the alley (deep black so the gun barrel + laser read)
  Z.dark = mesh(new THREE.PlaneGeometry(4, 6), basic('#05040a', { transparent: true, opacity: .9 }), { p: [0, 3, -17.5], parent: A, cast: false }); Z.dark.userData.noInk = true;
  // the gun + red laser (shown in the last shot)
  Z.gun = group({ parent: A }); Z.gun.scale.setScalar(1.7); mesh(rbox(.06, .1, .38), toon('#3a3a46'), { p: [0, 0, .1], parent: Z.gun }); mesh(new THREE.CylinderGeometry(.022, .022, .26, 18), toon('#2a2a32'), { p: [0, .02, -.18], r: [90, 0, 0], parent: Z.gun }); mesh(rbox(.05, .16, .07), toon('#1c1c22'), { p: [0, -.1, .2], r: [-15, 0, 0], parent: Z.gun });
  Z.laser = mesh(new THREE.CylinderGeometry(.006, .006, 1, 6), basic('#ff2030', { transparent: true, opacity: .85, add: true, depthWrite: false }), { parent: A, cast: false }); Z.laser.userData.noInk = true; Z.dot = glow(A, [0, 0, 0], '#ff2030', .35, 0); Z.gun.visible = Z.laser.visible = false;
}
export function alleyAt(t, flick = 1) { const f = flick ? 1 - .35 * sstep(.55, .85, noise1(t * .9 + 3)) : 1;   /* v6.3 a rare, soft brown-out dip (a hard on/off every .27 s pulsed the whole frame = stutter) */ Z.aBulb.material.emissiveIntensity = 1.4 * f; Z.aGlow.material.opacity = .55 * f; if (Z.aBeam) Z.aBeam.material.uniforms.uOp.value = .2 * f; }
export function laserAt(from, to, k) { Z.gun.visible = Z.laser.visible = k > 0; Z.dot.material.opacity = .9 * k; if (!k) return; const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to), d = b.clone().sub(a);
  Z.gun.position.copy(a); Z.gun.lookAt(ALLEY.localToWorld(b.clone())); Z.gun.rotateY(Math.PI); Z.laser.position.copy(a.clone().add(b).multiplyScalar(.5)); Z.laser.scale.set(1, d.length() * k, 1);
  Z.laser.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()); Z.dot.position.copy(b); }

export function hideZC() { TRUCK.visible = GATE.visible = STREET.visible = ALLEY.visible = false; Z.tag.visible = false; Z.truckDoors.forEach(d => { d.visible = true; }); Z.outside.visible = false; Z.truckSlit.visible = true; Z.truckSlit.scale.x = 1; Z.dark.visible = true; }
export function zcAt(t, cam) { firesAt(t, cam); propsAt(t); glowAt(t); }
export function zcLate(t, cam) { steamAt(t, cam); }   /* after the camera is placed */

// ======================= v2 SET DRESSING (story props, user: "more props that fit each scene") =======================
const stencil = (par, txt, p, ry, w = 1.2, h = .4, col = '#d8d0b8', bg = '#4a5060') => sign(par, txt, p, ry, { w, h, col: bg, bg, txtC: col, fs: .6, glow: false });
function cctv(par, p, ry = 0, tilt = -20) { const g = group({ p, r: [0, ry, 0], parent: par }); mesh(rbox(.08, .08, .3), toon('#3a3a44'), { p: [0, 0, -.15], parent: g });
  const b = group({ p: [0, -.08, 0], r: [tilt, 0, 0], parent: g }); mesh(rbox(.16, .14, .34), toon('#d8dce4'), { p: [0, 0, .12], parent: b }); mesh(new THREE.CylinderGeometry(.05, .05, .04, 18), toon('#141418'), { p: [0, 0, .3], r: [90, 0, 0], parent: b });
  const led = mesh(new THREE.SphereGeometry(.018, 16, 12), basic('#ff2030'), { p: [.05, .05, .29], parent: b, cast: false }); led.userData.noInk = true; CAMS.push({ g: b, led, ry }); return g; }
const CAMS = [];
function tvStack(par, p, ry = 0) { const g = group({ p, r: [0, ry, 0], parent: par }); const scr = [];
  [[0, .3, .9, .7], [.95, .3, .7, .55], [.45, 1.0, .8, .6], [-.1, 1.0, .5, .45]].forEach(([x, y, w, h]) => { mesh(rbox(w, h, .5), toon('#2a2630'), { p: [x, y + h / 2, 0], parent: g }); const s = mesh(new THREE.PlaneGeometry(w * .8, h * .72), basic('#9ab0d0'), { p: [x, y + h / 2, .26], parent: g, cast: false }); s.userData.noInk = true; scr.push(s); });
  TVS.push(...scr); glow(g, [.4, .8, .6], '#9ab8ff', 2.4, .3); return g; }
const TVS = [];
function vending(par, p, ry, col = '#d83a4a') { const g = group({ p, r: [0, ry, 0], parent: par }); mesh(rbox(1, 1.9, .8), toon(col), { p: [0, .95, 0], parent: g });
  const f = mesh(new THREE.PlaneGeometry(.7, 1.1), basic('#fff6e0'), { p: [-.08, 1.15, .41], parent: g, cast: false }); f.userData.noInk = true;
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) mesh(new THREE.CylinderGeometry(.045, .045, .14, 18), toon(['#3a8ae0', '#e0b03a', '#3ac07a', '#e04a8a'][(r + c) % 4]), { p: [-.35 + c * .17, .72 + r * .27, .43], parent: g, cast: false });
  mesh(rbox(.22, .5, .05), toon('#2a2630'), { p: [.38, 1.2, .42], parent: g }); glow(g, [0, 1.2, .8], '#fff0d0', 2.4, .35); return g; }
function moto(par, p, ry, col = '#2a5a9a') { const g = group({ p, r: [0, ry, 0], parent: par }); for (const z of [-.55, .55]) mesh(new THREE.TorusGeometry(.28, .08, 10, 24), toon('#141418'), { p: [0, .32, z], r: [0, 90, 0], parent: g });
  mesh(rbox(.3, .32, .9), toon(col), { p: [0, .62, 0], parent: g }); mesh(rbox(.26, .1, .5), toon('#1a1a1e'), { p: [0, .82, -.15], parent: g }); cylBetween([0, .62, .5], [0, 1.05, .62], .025, toon('#8a8e9a'), g, 14); cylBetween([-.3, 1.05, .62], [.3, 1.05, .62], .02, toon('#1a1a1e'), g, 14); return g; }
function stall(par, p, ry) { const g = group({ p, r: [0, ry, 0], parent: par }); mesh(rbox(2, .9, .9), toon('#8a5a3a'), { p: [0, .45, 0], parent: g });
  for (const x of [-.95, .95]) cylBetween([x, .9, .4], [x, 2.3, .4], .03, toon('#3a3040'), g, 14); const aw = mesh(rbox(2.3, .08, 1.3), toon('#c8343a'), { p: [0, 2.35, .2], r: [-12, 0, 0], parent: g }); for (let i = 0; i < 6; i++) mesh(rbox(.18, .1, 1.31), toon('#f0e6d8'), { p: [-1 + i * .4, 2.36, .2], r: [-12, 0, 0], parent: g });
  mesh(new THREE.CylinderGeometry(.28, .22, .22, 14), toon('#9aa0aa'), { p: [-.45, 1.02, 0], parent: g }); [[.2, '#e0a050'], [.55, '#c06040']].forEach(([x, c]) => mesh(rbox(.28, .06, .2), toon(c), { p: [x, .93, 0], parent: g }));
  for (const x of [-.7, .7]) { const l = mesh(new THREE.SphereGeometry(.13, 16, 12), lit('#ff6a3a', 1.2), { p: [x, 2.05, .75], s: [1, 1.25, 1], parent: g, cast: false }); glow(g, [x, 2.0, .9], '#ff8a4a', 1.6, .5); }
  sign(g, 'ก๋วยเตี๋ยว', [0, 2.75, .65], 0, { w: 1.6, h: .45, col: '#ffd23a', fs: .55 }); STEAMS.push(par.localToWorld ? [g, [-.45, 1.2, 0]] : null); return g; }
const STEAMS = [];
function acUnit(par, p, ry) { const g = group({ p, r: [0, ry, 0], parent: par }); mesh(rbox(.7, .5, .4), toon('#b8bcc4'), { parent: g }); mesh(new THREE.CircleGeometry(.17, 14), toon('#3a3e48'), { p: [.1, 0, .21], parent: g, cast: false }); for (let k = -2; k <= 2; k++) mesh(rbox(.3, .02, .01), toon('#6a6e78'), { p: [.1, k * .06, .215], parent: g, cast: false }); return g; }
function tireStack(par, p, n = 3) { for (let i = 0; i < n; i++) mesh(new THREE.TorusGeometry(.32, .13, 10, 24), toon('#1c1c22'), { p: [p[0] + (i % 2) * .04, .13 + i * .24, p[2]], r: [90, 0, 0], parent: par }); }
function barrier(par, p, ry = 0) { const g = group({ p, r: [0, ry, 0], parent: par }); mesh(new THREE.CylinderGeometry(.18, .4, .8, 4, 1), toon('#c8c4b8'), { p: [0, .4, 0], s: [3.4, 1, 1], r: [0, 45, 0], parent: g }); mesh(rbox(1.8, .14, .02), toon('#e0b020'), { p: [0, .5, .33], parent: g }); for (let k = 0; k < 4; k++) mesh(rbox(.18, .14, .03), toon('#1c1c22'), { p: [-.6 + k * .4, .5, .34], r: [0, 0, 35], parent: g }); return g; }
function sandbags(par, p, ry = 0) { const g = group({ p, r: [0, ry, 0], parent: par }); for (let r = 0; r < 3; r++) for (let c = 0; c < 4 - r; c++) mesh(new THREE.CapsuleGeometry(.14, .3, 4, 8), toon('#a8946a'), { p: [-.5 + c * .36 + r * .18, .14 + r * .24, 0], r: [0, 0, 90], parent: g }); return g; }
function cones(par, p, n, dz) { for (let i = 0; i < n; i++) { const g = group({ p: [p[0], 0, p[2] + i * dz], parent: par }); mesh(new THREE.ConeGeometry(.16, .5, 12), toon('#ff6a2a'), { p: [0, .27, 0], parent: g }); mesh(new THREE.CylinderGeometry(.1, .12, .08, 18), toon('#f4f0e8'), { p: [0, .3, 0], parent: g }); mesh(rbox(.36, .04, .36), toon('#2a2a30'), { p: [0, .02, 0], parent: g }); } }
function pallet(par, p, ry = 0, lean = 0) { const g = group({ p, r: [lean, ry, 0], parent: par }); for (let k = 0; k < 5; k++) mesh(rbox(.14, .03, 1), toon('#a8885a'), { p: [-.4 + k * .2, .1, 0], parent: g }); for (const z of [-.42, 0, .42]) mesh(rbox(1, .08, .1), toon('#8a6a42'), { p: [0, .04, z], parent: g }); return g; }
function bottles(par, p, n = 5, seed = 3) { const R = rng(seed); for (let i = 0; i < n; i++) { const s = R() > .4; mesh(new THREE.CylinderGeometry(.03, .04, .22, 18), toon(['#2a6a3a', '#7a4a1a', '#3a5a8a'][i % 3], { transparent: true, opacity: .8 }), { p: [p[0] + (R() - .5) * .8, s ? .11 : .04, p[2] + (R() - .5) * .8], r: s ? [0, 0, 0] : [90, R() * 180, 0], parent: par, cast: false }); } }
function poster(par, p, ry, txt, col = '#e8dcc0', ink = '#3a2a1a') { return sign(par, txt, p, ry, { w: .6, h: .8, col, bg: col, txtC: ink, fs: .22, glow: false }); }
function boxes(par, p, ry = 0) { const g = group({ p, r: [0, ry, 0], parent: par }); [[0, 0, 0, .55], [.5, 0, .1, .45], [.2, .55, 0, .4], [-.1, 0, .5, .4]].forEach(([x, y, z, s]) => mesh(rbox(s, s * .8, s), toon('#b89a6a'), { p: [x, y + s * .4, z], r: [0, (x * 50) | 0, 0], parent: g })); return g; }
function wire(par, a, b, sag = .8, col = '#141018') { const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - sag, (a[2] + b[2]) / 2]; cylBetween(a, mid, .012, toon(col), par, 14); cylBetween(mid, b, .012, toon(col), par, 14); }
// ---- TRUCK: the prison van has a story: shackles, ID stencil, a cage partition, a tin cup, scratched tally marks
{ const T = TRUCK;
  for (const s of [-1, 1]) for (let z = -2.2; z <= 2.2; z += 1.1) { mesh(rbox(.06, .12, .12), toon('#6a6e78'), { p: [s * 1.24, 1.0, z], parent: T }); for (let i = 0; i < 4; i++) mesh(new THREE.TorusGeometry(.035, .01, 10, 24), toon('#9aa0aa'), { p: [s * 1.2, .93 - i * .06, z], r: [0, i % 2 ? 90 : 0, 0], parent: T, cast: false }); mesh(new THREE.TorusGeometry(.06, .015, 10, 24), toon('#9aa0aa'), { p: [s * 1.2, .68, z], r: [90, 0, 0], parent: T, cast: false }); }
  stencil(T, 'PRISON TRANSPORT 07', [1.25, 1.9, -.8], -90, 2.0, .3); stencil(T, 'ห้ามพูดคุย', [-1.25, 1.9, 1.0], 90, 1.4, .32, '#e8c040');
  for (let x = -1.2; x <= 1.2; x += .14) cylBetween([x, .1, -2.4], [x, 2.25, -2.4], .012, toon('#5a5e68'), T, 14); cylBetween([-1.25, 1.2, -2.4], [1.25, 1.2, -2.4], .02, toon('#5a5e68'), T, 14);   // cage partition behind the driver
  mesh(new THREE.CylinderGeometry(.06, .05, .12, 12, 1, true), toon('#9aa0aa', { side: THREE.DoubleSide }), { p: [.3, .06, .8], parent: T, cast: false }); mesh(rbox(.4, .02, .55), toon('#c8b890'), { p: [-.2, .02, -1.2], r: [0, 25, 0], parent: T, cast: false });
  const tl = canvasTex(256, 128, (x, W, H) => { x.fillStyle = '#4a5060'; x.fillRect(0, 0, W, H); x.strokeStyle = '#c8ccd4'; x.lineWidth = 5; for (let k = 0; k < 4; k++) { const x0 = 20 + k * 58; for (let i = 0; i < 4; i++) { x.beginPath(); x.moveTo(x0 + i * 10, 30); x.lineTo(x0 + i * 10 + 3, 100); x.stroke(); } x.beginPath(); x.moveTo(x0 - 6, 90); x.lineTo(x0 + 42, 40); x.stroke(); } });
  mesh(new THREE.PlaneGeometry(.6, .3), basic('#ffffff', { map: tl }), { p: [-1.25, 1.45, -.4], r: [0, 90, 0], parent: T, cast: false }).userData.noInk = true;
  Z.cup = mesh(new THREE.CylinderGeometry(.05, .04, .1, 18), toon('#8a8e98'), { p: [.95, .74, .25], parent: T }); }
// ---- GATE: a checkpoint at the end of the world: barriers, sandbags, cones, cameras, warning boards, razor wire
{ const G = GATE;
  barrier(G, [-3.4, 0, -25], 0); barrier(G, [-1.4, 0, -25.6], 0); sandbags(G, [4.4, 0, -26.2], 0); sandbags(G, [-5.4, 0, -27], 20); cones(G, [2.2, 0, -10], 5, -2.6); tireStack(G, [-5.8, 0, -10], 3); boxes(G, [5.6, 0, -12], 30);
  cctv(G, [4.2, 2.9, -28.2], 200); cctv(G, [-6.2, 3.2, -22], 140, -25); cylBetween([-6.2, 0, -22.3], [-6.2, 3.3, -22.3], .06, toon('#3a3a44'), G, 14);
  sign(G, 'ห้ามหลบหนี', [-6.88, 3.0, -8], 90, { w: 1.8, h: .55, col: '#ffd23a', bg: '#c83030', txtC: '#ffffff', fs: .55, glow: false }); sign(G, 'NO RETURN', [6.88, 3.0, -14], -90, { w: 1.8, h: .55, col: '#ffd23a', bg: '#1c1c22', txtC: '#ffd23a', fs: .5, glow: false });
  for (let x = -55; x <= 55; x += .8) mesh(new THREE.TorusGeometry(.5, .03, 10, 24), toon('#8a8e9a'), { p: [x, 46.9, -37.4], r: [0, 90, 0], parent: G, cast: false });
  for (const x of [-3.2, 3.2]) { const g = group({ p: [x, 0, -32], parent: G }); mesh(rbox(.5, .5, .5), toon('#3a3a44'), { p: [0, .25, 0], parent: g }); mesh(new THREE.CylinderGeometry(.3, .22, .3, 18), lit('#fff4d0', 1), { p: [0, .65, 0], r: [-35, 0, 0], parent: g, cast: false }); glow(g, [0, 1.2, .6], '#fff0d0', 3.5, .4); }
  poster(G, [-6.82, 1.6, -4], 90, '047'); }
// ---- STREET: a lived-in neon block: noodle stall with steam, vending machines, bikes, stacked TVs, AC units, cameras, hydrant
{ const S = STREET;
  stall(S, [-6.6, .18, -6.5], 90); vending(S, [6.7, .18, -4.5], -90, '#d83a4a'); vending(S, [6.7, .18, -5.6], -90, '#2a7ad8'); vending(S, [-6.8, .18, -30], 90, '#3ab07a');
  moto(S, [5.8, .18, -18], 15, '#2a5a9a'); moto(S, [5.9, .18, -19.4], -10, '#c83a3a'); moto(S, [-5.8, .18, -36], 160, '#e0b030');
  tvStack(S, [-6.9, .18, -22], 90); tireStack(S, [6.6, .18, -24], 4); pallet(S, [6.9, .18, -32], -90, -70);
  for (const [s, z, y] of [[-1, -3, 5.2], [1, -11, 4.6], [-1, -15, 6.4], [1, -27, 5.6], [-1, -33, 4.8], [1, -40, 6.8]]) acUnit(S, [s * 7.8, y, z], s > 0 ? -90 : 90);
  cctv(S, [4.9, 4.4, -6], 220); cctv(S, [-4.9, 4.4, -20], 140); cctv(S, [4.9, 4.4, -34], 220);
  { const h = group({ p: [-5.3, .18, -12.5], parent: S }); mesh(new THREE.CylinderGeometry(.14, .17, .55, 18), toon('#c83030'), { p: [0, .28, 0], parent: h }); mesh(new THREE.SphereGeometry(.15, 16, 12), toon('#c83030'), { p: [0, .58, 0], parent: h }); for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(.05, .05, .12, 18), toon('#a82828'), { p: [s * .17, .35, 0], r: [0, 0, 90], parent: h }); }
  poster(S, [7.86, 1.7, -2.5], -90, 'ห้องเช่า'); poster(S, [-7.86, 1.7, -27], 90, 'FIGHT', '#2a2a30', '#ff4a4a'); bottles(S, [-6.2, .18, -14], 6, 4);
  for (let i = 0; i < 5; i++) { const z = -8 - i * 9; wire(S, [-7.8, 7 + (i % 2), z], [7.8, 7.5, z - 2], 1.1); }
  for (let i = 0; i < 6; i++) { const z = -4 - i * 8, s = i % 2 ? 1 : -1, g = group({ p: [s * 7.3, 3 + (i % 3) * .5, z], r: [0, s > 0 ? -90 : 90, 0], parent: S }); cylBetween([-.5, 0, 0], [.5, 0, 0], .015, toon('#2a2632'), g, 14);   // hanging laundry
    ['#e8e0d0', '#5a8ac8', '#c85a5a'].forEach((c, k) => mesh(rbox(.24, .32, .01), toon(c, { side: THREE.DoubleSide }), { p: [-.3 + k * .3, -.18, 0], parent: g, cast: false })); }
  sign(S, '←', [-7.5, 2.6, -36.5], 90, { w: .9, h: .5, col: '#2fe0ff', fs: .8 }); }
// ---- ALLEY: cardboard bed of someone who lives here, pallets, a broken chair, bottles, AC dripping, a camera watching (red LED)
{ const A = ALLEY;
  pallet(A, [-1.75, 0, -2.2], 90, -75); pallet(A, [1.7, 0, -11.5], -90, -72); boxes(A, [1.3, 0, -15], 15); bottles(A, [-.8, 0, -10.5], 7, 9);
  mesh(rbox(.8, .05, 1.8), toon('#a88a5a'), { p: [-1.45, .03, -14.5], parent: A }); mesh(rbox(.6, .25, .35), toon('#5a5a6a'), { p: [-1.45, .15, -13.8], parent: A });   // cardboard bed + rolled blanket
  { const c = group({ p: [1.2, 0, -8.6], r: [0, 30, 75], parent: A }); mesh(rbox(.45, .05, .45), toon('#6a4a3a'), { p: [0, .45, 0], parent: c }); for (const [x, z] of [[-.2, -.2], [.2, -.2], [-.2, .2]]) cylBetween([x, 0, z], [x, .45, z], .02, toon('#4a3428'), c, 14); }   // broken chair on its side
  acUnit(A, [1.7, 4.4, -9], -90); acUnit(A, [-1.7, 5.2, -12], 90); acUnit(A, [-1.7, 2.8, -1], 90);
  cctv(A, [-1.75, 4.6, -10.5], 120, -30); poster(A, [-1.88, 1.6, -9.5], 90, 'หายตัว'); poster(A, [1.88, 1.7, -4], -90, 'WANTED', '#d8ccb0');
  for (let i = 0; i < 4; i++) wire(A, [-1.9, 6 + i * .4, -2 - i * 3.5], [1.9, 6.3 + i * .3, -3.5 - i * 3.5], .5);
  sign(A, 'BAR', [-1.88, 3.6, 2.2], 90, { w: 1.2, h: .45, col: '#ff2f6a', fs: .65 }); }
export function propsAt(t) { CAMS.forEach((c, i) => { c.g.rotation.y = .35 * Math.sin(t * .4 + i * 1.7); c.led.visible = Math.sin(t * 6 + i) > -.2; });
  TVS.forEach((s, i) => { const k = .55 + .45 * Math.abs(Math.sin(t * (13 + i * 3) + i)); s.material.color.setRGB(.55 * k, .65 * k, .85 * k + .1); }); }

// ======================= v3 GLOW PASS (light you can see; user refs: haze beams, spill, wet reflections, silhouettes) =======================
{ // GATE: the searchlights become real volumetric beams; the red ZERO CITY sign spills red down the wall and onto the wet road
  Z.beams.forEach(b => { b.material = beamMat('#fff2d8', .4, 34, 1.2); });
  spill(GATE, [0, 12, -36.1], 9, '#ff2340', .35, [0, 0, 0]); spill(GATE, [0, .05, -30], 8, '#ff2340', .22); streak(GATE, [0, .04, -34], 5, 26, '#ff3048', .3);
  beam(GATE, [0, 7, -36], [0, -.5, -24], 5.5, '#ff7a5a', .1);   // the light pouring out of the gate when it opens (opacity driven in gateAt)
  Z.gateBeam = GATE.children[GATE.children.length - 1]; Z.gateBeam.visible = false;
  for (const s of [-1, 1]) beam(GATE, [s * 3.2, 1.0, -31.5], [s * 2.5, 4.5, -22], 1.6, '#fff0d0', .12);   // ground floods up through the haze
  spill(GATE, [5.2 - 1.3, .05, -29], 2, '#ffd27a', .3);   // booth window light pool
}
{ // STREET: every sign gets a wet-road reflection streak and a colour pool; lamps get light cones; the stall glows warm
  const SIGC = ['#ff2f6a', '#2fe0ff', '#3aff8a', '#ff9a2a', '#ff2340', '#c070ff', '#ff4a3a', '#ffd23a'];
  SIGC.forEach((c, i) => { const s = i % 2 ? 1 : -1, z = -2 - i * 7.5; streak(STREET, [s * 4.4, .03, z], 1.6, 9, c, .32); spill(STREET, [s * 6.4, .05, z], 2.2, c, .28); spill(STREET, [s * 7.82, 3.2 + (i % 3) * 1.4, z], 1.8, c, .25, [0, s > 0 ? -90 : 90, 0]); });
  Z.lamps.forEach((l, i) => { const sx = l.position.x + (i % 2 === 0 ? -.8 : .8); beam(STREET, [sx, 4.15, l.position.z], [sx, 0, l.position.z], 1.5, i % 2 ? '#ffcf8a' : '#9ad8ff', .3); spill(STREET, [sx, .05, l.position.z], 1.8, i % 2 ? '#ffcf8a' : '#9ad8ff', .3); });
  spill(STREET, [-5.8, .2, -6.5], 2.4, '#ff8a4a', .3);   // the noodle stall's lanterns
  [[-6.6, -11], [6.8, -27], [-7, -41]].forEach(([x, z]) => spill(STREET, [x, .05, z], 2.2, '#ff8a3a', .35));   // fire barrels
}
{ // ALLEY: the bulb throws a visible cone down the wall, a warm pool on the wet bricks, the BAR sign bleeds pink at the mouth
  beam(ALLEY, [-1.45, 3.45, -7], [-.6, 0, -7], 1.7, '#ffc87a', .2); Z.aBeam = ALLEY.children[ALLEY.children.length - 1];
  spill(ALLEY, [-.9, .05, -7], 1.8, '#ffc87a', .35); spill(ALLEY, [-1.86, 3.6, 2.2], 1.4, '#ff2f6a', .35, [0, 90, 0]); streak(ALLEY, [-1.2, .03, 2.0], .8, 6, '#ff2f6a', .35);
  spill(ALLEY, [.2, .05, -15], 2.2, '#5a6aff', .18);
}
{ // TRUCK: a cold shaft from the barred window slices through the dusty air
  beam(TRUCK, [0, 1.75, -2.9], [.2, .1, -.6], .7, '#b8ccff', .22);
}

// ======================= v4 STEAM (the city breathes) =======================
steam(STREET, [-5.85, 1.35, -6.5], { n: 9, size: .32, rise: 1.1, op: .32, seed: 2 });      // noodle pot
steam(STREET, [1.8, .05, -8], { n: 12, size: .7, rise: 2.4, op: .22, life: 3, seed: 5 });  // street vent
steam(ALLEY, [1.6, 4.2, -9], { n: 5, size: .4, rise: .9, op: .16, life: 2.6, seed: 7 });   // AC exhaust in the cold rain
for (const [x, z] of [[-6.6, -11], [6.8, -27], [-7, -41]]) steam(STREET, [x, 1.9, z], { n: 7, size: .5, rise: 1.6, op: .22, life: 2.4, col: '#5a5260', seed: x * z });   // barrel fire smoke (dark)
