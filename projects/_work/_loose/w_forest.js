
// ======================= "ต้นไม้ผลทองคำ": MAGIC FOREST, the golden tree at the origin =======================
PRESETS.day = { top: '#2f7fe0', mid: '#86c4f6', hor: '#e8f8ff', glow: '#fff6d8', glowAmt: .5, sunDir: [.35, .62, .6], sunC: '#fff4e0', sunI: 3.0, hemiS: '#dcebff', hemiG: '#8ab060', hemiI: 2.5, fog: '#cfeede', fogN: 40, fogF: 420, deep: '#2a78cf', shallow: '#74c2f2', glint: '#ffffff', glintAmt: .8, stars: 0, moon: 0, cloud: '#ffffff' };
PRESETS.gold = { top: '#4a78d0', mid: '#f3b48a', hor: '#ffe0a0', glow: '#ffd28a', glowAmt: .7, sunDir: [-.5, .3, .55], sunC: '#ffd9a8', sunI: 3.0, hemiS: '#d6d8ff', hemiG: '#b08a5a', hemiI: 2.3, fog: '#f6c9a0', fogN: 40, fogF: 420, deep: '#2f6cb8', shallow: '#86b8e8', glint: '#fff0c0', glintAmt: 1, stars: 0, moon: 0, cloud: '#ffd9c0' };
PRESETS.wilt = { top: '#5a6c98', mid: '#9aa0b8', hor: '#d6ccbc', glow: '#e0d0b0', glowAmt: .2, sunDir: [.35, .5, .6], sunC: '#e8e0d4', sunI: 1.9, hemiS: '#c4c8dc', hemiG: '#7a7058', hemiI: 2.3, fog: '#b8b4a8', fogN: 25, fogF: 300, deep: '#3a5a8a', shallow: '#7a94b8', glint: '#e0e0e0', glintAmt: .3, stars: 0, moon: 0, cloud: '#d8d8e0' };
export const FO = group({ parent: scene }); export const FA = {};
const LEAF_G = new THREE.Color('#5cc85a'), LEAF_D = new THREE.Color('#a8824a'), BARK_G = new THREE.Color('#9a6a3c'), BARK_D = new THREE.Color('#7e6c5c');
{
  FA.groundM = toon('#7cc85a', { unique: true }); mesh(new THREE.CylinderGeometry(900, 900, 1, 48), FA.groundM, { p: [0, -.5, 0], parent: FO, cast: false });
  FA.clearM = toon('#a6dc6a', { unique: true }); mesh(new THREE.CylinderGeometry(5.5, 5.5, .02, 40), FA.clearM, { p: [0, .01, 0], parent: FO, cast: false });
  mesh(rbox(1.6, .02, 30), toon('#e6cf98'), { p: [0, .015, 19.5], parent: FO, cast: false });
  const r = rng(41), tr = toon('#8a5a36'), sg = new THREE.SphereGeometry(1, 12, 9), tg = new THREE.CylinderGeometry(.16, .24, 1.6, 7);
  const cols = ['#4fb36a', '#3fa58c', '#62c060', '#7b6fd6', '#4fb36a', '#e07ab8', '#3f9f72', '#5ac0c8'].map(c => toon(c)); FA.trees = [];
  for (let i = 0; i < 150; i++) { const a = r() * Math.PI * 2, R = 8.5 + Math.pow(r(), .8) * 70; const x = Math.sin(a) * R, z = Math.cos(a) * R; if (Math.abs(x) < 1.6 && z > 5) continue;
    const k = .9 + r() * 1.3 + R * .01, g = group({ p: [x, 0, z], parent: FO }); mesh(tg, tr, { p: [0, .8 * k, 0], s: [k, k, k], parent: g, cast: R < 25 });
    const c = cols[(r() * cols.length) | 0];
    if (r() < .3) { mesh(new THREE.ConeGeometry(1.2 * k, 3.4 * k, 8), c, { p: [0, 2.6 * k, 0], parent: g, cast: R < 25 }); }
    else { mesh(sg, c, { p: [0, 2.2 * k, 0], s: [1.25 * k, 1.1 * k, 1.25 * k], parent: g, cast: R < 25 }); mesh(sg, c, { p: [.55 * k, 2.9 * k, .2 * k], s: .8 * k, parent: g, cast: false }); mesh(sg, c, { p: [-.5 * k, 2.7 * k, -.2 * k], s: .75 * k, parent: g, cast: false }); }
    FA.trees.push(g); }
  // bushes around the clearing
  const bc = [toon('#4aa84e'), toon('#5cbc5a'), toon('#3f9f72')];
  for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2 + r() * .1, R = 6.2 + r() * 1.4; if (Math.abs(Math.sin(a) * R) < 1.8 && Math.cos(a) > 0) continue; const k = .45 + r() * .4; mesh(sg, bc[i % 3], { p: [Math.sin(a) * R, k * .55, Math.cos(a) * R], s: [k * 1.3, k, k * 1.3], parent: FO }); }
  // glowing mushrooms
  FA.mushM = toon('#ff7ab0', { emissive: '#ff5a9a', ei: .25, unique: true }); const stem = toon('#fbf2e2');
  for (let i = 0; i < 22; i++) { const a = r() * Math.PI * 2, R = 4.2 + r() * 3.2; if (Math.abs(Math.sin(a) * R) < 1.4 && Math.cos(a) > 0) continue; const k = .5 + r() * .7, g = group({ p: [Math.sin(a) * R, 0, Math.cos(a) * R], parent: FO });
    mesh(new THREE.CylinderGeometry(.05 * k, .07 * k, .3 * k, 8), stem, { p: [0, .15 * k, 0], parent: g }); mesh(new THREE.SphereGeometry(.17 * k, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), FA.mushM, { p: [0, .28 * k, 0], s: [1, .75, 1], parent: g }); }
  // flowers
  const fl = ['#ffd84a', '#ffffff', '#ff8ac0', '#9ad0ff'].map(c => toon(c));
  for (let i = 0; i < 60; i++) { const a = r() * Math.PI * 2, R = 2.4 + r() * 3; const x = Math.sin(a) * R, z = Math.cos(a) * R; if (Math.abs(x) < .9 && z > 0) continue; mesh(new THREE.SphereGeometry(.06, 8, 6), fl[i % 4], { p: [x, .06, z], parent: FO, cast: false }); }
  for (const [x, z, k] of [[-4.6, -2.5, .5], [4.9, -1.2, .4], [-3.2, 4.4, .35], [5.6, 3.6, .45]]) { const m = makeRock(x * 5 + z, k, '#a0a8b8'); m.position.set(x, .1, z); FO.add(m); }
  // far hills
  { const m1 = toon('#7fb6a0'), m2 = toon('#96c4b0'); for (let i = 0; i < 22; i++) { const a = i / 22 * Math.PI * 2 + r() * .1, R = 300 + r() * 90, h = 60 + r() * 70, w = 90 + r() * 60; mesh(new THREE.ConeGeometry(w, h, 6), i % 2 ? m1 : m2, { p: [Math.sin(a) * R, h / 2 - 2, Math.cos(a) * R], parent: FO, cast: false, recv: false }); } }
  // ---------- THE GOLDEN TREE ----------
  const T = group({ parent: FO }); FA.tree = T; FA.barkM = toon('#9a6a3c', { unique: true }); FA.leafM = toon('#5cc85a', { emissive: '#ffd040', ei: 0, unique: true });
  const seg = [[[0, 0, 0], [.06, .7, .02], .3, .25], [[.06, .7, .02], [-.04, 1.35, .06], .25, .2], [[-.04, 1.35, .06], [0, 1.9, 0], .2, .15]];
  for (const [a, b, r0, r1] of seg) { const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A); const m = mesh(new THREE.CylinderGeometry(r1, r0, d.length() + .06, 9), FA.barkM, { parent: T }); m.position.copy(A).addScaledVector(d, .5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); }
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 + .3; cylBetween([0, .25, 0], [Math.sin(a) * .62, .02, Math.cos(a) * .62], .085, FA.barkM, T, 6); }
  FA.br = []; for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + .5; const e = [Math.sin(a) * 1.0, 2.0 + (i % 2) * .35, Math.cos(a) * 1.0]; FA.br.push(cylBetween([0, 1.55 + (i % 3) * .12, 0], e, .06, FA.barkM, T, 6)); }
  FA.can = group({ p: [0, 2.55, 0], parent: T }); FA.canP = [];
  for (const [x, y, z, s] of [[0, .35, 0, 1.15], [.85, 0, .2, .8], [-.8, .05, .3, .82], [.2, 0, .85, .8], [-.15, .1, -.85, .82], [.6, .55, -.4, .7], [-.55, .6, -.3, .7], [0, -.25, 0, .95]]) { FA.canP.push(mesh(new THREE.SphereGeometry(1, 16, 12), FA.leafM, { p: [x, y, z], s, parent: FA.can })); }
  FA.fruitM = toon('#ffc21a', { emissive: '#ffb000', ei: .45, unique: true }); FA.fruits = [];
  const fp = []; for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2 + (i % 2) * .2; const R = 1.0 + (i % 3) * .22; fp.push([Math.sin(a) * R, 1.42 + (i % 4) * .14, Math.cos(a) * R]); }
  for (const p of fp) { const g = group({ p, parent: T }); mesh(new THREE.SphereGeometry(.14, 14, 10), FA.fruitM, { p: [0, -.12, 0], s: [1, 1.08, 1], parent: g }); cylBetween([0, 0, 0], [0, -.03, 0], .012, toon('#6a4a2a'), g, 4); mesh(new THREE.SphereGeometry(.06, 6, 4), toon('#5cc85a'), { p: [.06, -.01, 0], s: [1, .35, .6], parent: g, cast: false }); g.userData.home = p.slice(); FA.fruits.push(g); }
  FA.glow = glowSprite('#ffd25a', 7, { opacity: 0, fog: false }); FA.glow.position.set(0, 2.3, 0); T.add(FA.glow);
  FA.glow2 = glowSprite('#fff2b0', 3, { opacity: 0, fog: false }); FA.glow2.position.set(0, .2, 0); T.add(FA.glow2);
}
// instanced fx: fragments (gold shards), falling leaves, sparkles, water drops, the imagined gold pile
function inst(geo, mat, n) { const m = new THREE.InstancedMesh(geo, mat, n); m.frustumCulled = false; m.count = 0; scene.add(m); return m; }
FA.shard = inst(new THREE.TetrahedronGeometry(.07), toon('#ffcf3a', { emissive: '#ffb000', ei: .6 }), 160);
FA.leafI = inst(new THREE.PlaneGeometry(.16, .1), toon('#ffffff', { side: THREE.DoubleSide, ol: 0 }), 120); FA.leafI.castShadow = false;
FA.spark = inst(new THREE.OctahedronGeometry(.05), basic('#fff6c0', { noInk: true }), 120); FA.spark.material.userData.noInk = true;
FA.drop = inst(new THREE.SphereGeometry(.035, 8, 6), toon('#7cc8ff', { emissive: '#5ab0ff', ei: .3 }), 60); FA.drop.castShadow = false;
FA.pile = inst(new THREE.SphereGeometry(.16, 12, 9), FA.fruitM, 260);
const _M = new THREE.Matrix4(), _Q = new THREE.Quaternion(), _E = new THREE.Euler(), _S = new THREE.Vector3(), _P = new THREE.Vector3(), _C = new THREE.Color();
export function fxClear() { for (const m of [FA.shard, FA.leafI, FA.spark, FA.drop, FA.pile]) m.count = 0; }
export function shatter(origins, f, seed = 1) { // f = seconds since burst; origins = world points
  const r = rng(seed); let n = 0; const per = Math.floor(160 / Math.max(1, origins.length));
  for (const o of origins) for (let i = 0; i < per && n < 160; i++) { const vx = (r() - .5) * 2.2, vy = .3 + r() * 1.6, vz = (r() - .5) * 2.2, s = Math.max(0, 1 - f / 1.3) * (.6 + r() * .8);
    _P.set(o[0] + vx * f, o[1] + vy * f - 2.2 * f * f, o[2] + vz * f); if (_P.y < .03) _P.y = .03; _E.set(f * 9 + i, f * 7, 0); _Q.setFromEuler(_E); _S.setScalar(s); _M.compose(_P, _Q, _S); FA.shard.setMatrixAt(n++, _M); }
  FA.shard.count = n; FA.shard.instanceMatrix.needsUpdate = true;
}
export function leavesFall(t, k, col = '#c8a050', seed = 3, n = 110) { // k 0..1 how many
  const r = rng(seed), m = Math.floor(n * k); let j = 0;
  for (let i = 0; i < m; i++) { const x0 = (r() - .5) * 3.2, z0 = (r() - .5) * 3.2, sp = .35 + r() * .35, ph = r() * 10, y0 = 3.6; const y = y0 - ((t * sp + ph * .37) % 3.6);
    _P.set(x0 + Math.sin(t * 2 + ph) * .3, y, z0 + Math.cos(t * 1.7 + ph) * .3); _E.set(t * 3 + ph, ph, t * 2); _Q.setFromEuler(_E); _S.setScalar(1); _M.compose(_P, _Q, _S); FA.leafI.setMatrixAt(j, _M); FA.leafI.setColorAt(j, _C.set(col).offsetHSL((r() - .5) * .06, 0, (r() - .5) * .12)); j++; }
  FA.leafI.count = j; FA.leafI.instanceMatrix.needsUpdate = true; if (FA.leafI.instanceColor) FA.leafI.instanceColor.needsUpdate = true;
}
export function sparkles(c, rad, t, k = 1, n = 80, seed = 5, up = .4) {
  const r = rng(seed), m = Math.floor(n * k);
  for (let i = 0; i < m; i++) { const a = r() * 6.28, R = rad * Math.sqrt(r()), h = r() * rad * 1.2, ph = r() * 6.28, tw = Math.max(0, Math.sin(t * 5 + ph));
    _P.set(c[0] + Math.sin(a + t * .3) * R, c[1] + h + Math.sin(t + ph) * .15 + up * ((t * .3 + ph) % 1), c[2] + Math.cos(a + t * .3) * R); _E.set(t * 2 + ph, t * 3, 0); _Q.setFromEuler(_E); _S.setScalar(.4 + 1.1 * tw); _M.compose(_P, _Q, _S); FA.spark.setMatrixAt(i, _M); }
  FA.spark.count = m; FA.spark.instanceMatrix.needsUpdate = true;
}
export function waterDrops(o, dir, t, k = 1, n = 50) { // stream from o along dir (falls with gravity)
  const m = Math.floor(n * k);
  for (let i = 0; i < m; i++) { const u = ((t * 1.6 + i / n) % 1), f = u * .55; const sp = (i * 37 % 11) / 11 - .5;
    _P.set(o[0] + dir[0] * f * 1.6 + sp * .05, o[1] + dir[1] * f - 4.9 * f * f, o[2] + dir[2] * f * 1.6 + sp * .04); if (_P.y < 0) continue; _S.setScalar(.8 + (i % 3) * .2); _M.compose(_P, _Q.identity(), _S); FA.drop.setMatrixAt(FA.drop.count = Math.min(n, (FA.drop.count || 0)), _M); FA.drop.count++; }
  FA.drop.instanceMatrix.needsUpdate = true;
}
export function goldPile(c, k = 1) { const r = rng(9), n = Math.floor(260 * k); for (let i = 0; i < n; i++) { const a = r() * 6.28, h = r(), R = (1 - h) * 2.1 * Math.sqrt(r()); _P.set(c[0] + Math.sin(a) * R, c[1] + h * 1.35 + .1, c[2] + Math.cos(a) * R); _S.setScalar(.8 + r() * .5); _M.compose(_P, _Q.identity(), _S); FA.pile.setMatrixAt(i, _M); } FA.pile.count = n; FA.pile.instanceMatrix.needsUpdate = true; }
// tree state: leaf 0..1 (canopy amount), dry 0..1 (green -> brown), glow 0..1, fruitsOn: number of fruits shown (or array of k per fruit 0..1)
export function treeState(o = {}) {
  const leaf = o.leaf ?? 1, dry = o.dry ?? 0, glow = o.glow ?? 0;
  FA.leafM.color.copy(LEAF_G).lerp(LEAF_D, dry); FA.leafM.emissiveIntensity = glow * .55; FA.barkM.color.copy(BARK_G).lerp(BARK_D, dry * .8);
  FA.can.visible = leaf > .02; FA.canP.forEach((m, i) => { const base = [1.15, .8, .82, .8, .82, .7, .7, .95][i]; const k = clamp(leaf * 1.4 - (i % 4) * .12); m.scale.setScalar(base * (.15 + .85 * k)); });
  FA.can.position.y = 2.55 - (o.droop ?? 0) * .25; FA.can.scale.y = 1 - (o.droop ?? 0) * .12;
  const fk = o.fruits ?? 14; FA.fruits.forEach((g, i) => { const k = Array.isArray(fk) ? fk[i] : (i < fk ? 1 : 0); g.visible = k > .01; g.scale.setScalar(Math.max(.01, k)); g.position.set(...g.userData.home); });
  FA.fruitM.emissiveIntensity = .45 + glow * .8;
  FA.glow.material.opacity = (o.halo ?? .25) * (1 - dry) + glow * .55; FA.glow2.material.opacity = glow * .7;
}
export function fruitWorld(i) { scene.updateMatrixWorld(); return FA.fruits[i].localToWorld(new THREE.Vector3(0, -.12, 0)); }
export function forestDry(k) { FA.groundM.color.set('#7cc85a').lerp(_C.set('#b0a878'), k); FA.clearM.color.set('#a6dc6a').lerp(_C.set('#c8b88a'), k); FA.mushM.emissiveIntensity = .25 * (1 - k); }
export function hideSea() { sea.visible = false; seaFar.visible = false; WAVE.amp = 0; }
// fireflies
FA.flies = [];
{ const r = rng(77); for (let i = 0; i < 36; i++) { const s = glowSprite('#fff27a', .35, { opacity: 0, fog: true }); s.userData.c = [(r() - .5) * 11, .5 + r() * 2.6, (r() - .5) * 11]; s.userData.ph = r() * 6.28; scene.add(s); FA.flies.push(s); } }
export function fireflies(t, k) { FA.flies.forEach(s => { const c = s.userData.c, p = s.userData.ph; s.position.set(c[0] + Math.sin(t * .6 + p) * .6, c[1] + Math.sin(t * .9 + p * 2) * .3, c[2] + Math.cos(t * .5 + p) * .6); s.material.opacity = k * (.4 + .6 * Math.max(0, Math.sin(t * 2.4 + p))); s.visible = k > 0; }); }
// ---------- props ----------
FA.sack = group({ parent: scene }); { const m = toon('#c8955a'); FA.sackBody = mesh(new THREE.SphereGeometry(.24, 14, 10), m, { s: [1, .95, 1], parent: FA.sack }); mesh(new THREE.CylinderGeometry(.07, .12, .14, 10), m, { p: [0, .25, 0], parent: FA.sack }); mesh(new THREE.TorusGeometry(.085, .025, 5, 12), toon('#6a4226'), { p: [0, .21, 0], r: [90, 0, 0], parent: FA.sack });
  FA.sackGold = group({ parent: FA.sack }); for (const [x, z] of [[-.05, .02], [.06, -.03], [0, .07]]) mesh(new THREE.SphereGeometry(.07, 10, 8), FA.fruitM, { p: [x, .34, z], parent: FA.sackGold }); }
export function sackFill(k) { FA.sackBody.scale.set(.55 + .45 * k, (.5 + .45 * k), .55 + .45 * k); FA.sackBody.position.y = -.12 * (1 - k); FA.sackGold.visible = k > .6; }
FA.can2 = group({ parent: scene }); { const m = toon('#5a9ade'); mesh(new THREE.CylinderGeometry(.13, .15, .26, 14), m, { parent: FA.can2 }); cylBetween([.12, -.06, 0], [.36, .14, 0], .025, m, FA.can2, 6); mesh(new THREE.CylinderGeometry(.045, .03, .05, 8), m, { p: [.37, .155, 0], r: [0, 0, -55], parent: FA.can2 }); const h = mesh(new THREE.TorusGeometry(.1, .018, 5, 14, Math.PI), m, { p: [-.02, .13, 0], parent: FA.can2 }); }
FA.wand = group({ parent: scene }); { cylBetween([0, 0, 0], [0, .42, 0], .014, toon('#3a2a24'), FA.wand, 5); mesh(new THREE.OctahedronGeometry(.06), toon('#ffd84a', { emissive: '#ffc000', ei: .8 }), { p: [0, .46, 0], parent: FA.wand }); FA.wandGlow = glowSprite('#fff0a0', .6, { opacity: .7 }); FA.wandGlow.position.y = .46; FA.wand.add(FA.wandGlow); }
// magic panels: in-world Thai labels the witch conjures
function panel(w, h) { const tx = canvasTex(512, Math.round(512 * h / w), () => { }); const g = group({ parent: scene }); const m = mesh(new THREE.PlaneGeometry(w, h), basic('#ffffff', { map: tx, transparent: true, side: THREE.DoubleSide, noInk: true, depthWrite: false }), { parent: g, cast: false, recv: false }); m.userData.noInk = true; m.renderOrder = 5; const gl = glowSprite('#bfe4ff', w * 2.2, { opacity: .35 }); g.add(gl); g.userData = { tx, m, gl }; return g; }
FA.pWater = panel(1.1, .62); FA.pFood = panel(1.1, .62); FA.pRes = panel(1.5, .9);
function bubble(x, w, h, col) { x.clearRect(0, 0, w, h); x.fillStyle = 'rgba(255,255,255,.93)'; x.strokeStyle = col; x.lineWidth = 16; x.beginPath(); x.roundRect(10, 10, w - 20, h - 20, 46); x.fill(); x.stroke(); }
{ const x = FA.pWater.userData.tx.userData.ctx, w = 512, h = 289; bubble(x, w, h, '#3a8ee0'); x.fillStyle = '#4aa8f0'; x.strokeStyle = '#1c1420'; x.lineWidth = 8; x.beginPath(); x.moveTo(120, 60); x.bezierCurveTo(150, 120, 185, 150, 185, 185); x.arc(120, 185, 65, 0, Math.PI); x.bezierCurveTo(55, 150, 90, 120, 120, 60); x.fill(); x.stroke(); x.fillStyle = '#1c3a6a'; x.font = '700 104px Prompt'; x.textAlign = 'left'; x.textBaseline = 'middle'; x.fillText('น้ำ', 225, 160); FA.pWater.userData.tx.needsUpdate = true; }
{ const x = FA.pFood.userData.tx.userData.ctx, w = 512, h = 289; bubble(x, w, h, '#3aa655'); x.fillStyle = '#5cc85a'; x.strokeStyle = '#1c1420'; x.lineWidth = 8; x.beginPath(); x.ellipse(105, 150, 52, 92, .6, 0, 7); x.fill(); x.stroke(); x.beginPath(); x.moveTo(60, 225); x.lineTo(150, 80); x.stroke(); x.fillStyle = '#1f5a2c'; x.font = '700 64px Prompt'; x.textAlign = 'left'; x.textBaseline = 'middle'; x.fillText('สารอาหาร', 180, 155); FA.pFood.userData.tx.needsUpdate = true; }
let _rk = -1; export function drawRes(k) { const q = Math.round(k * 40) / 40; if (q === _rk) return; _rk = q; const x = FA.pRes.userData.tx.userData.ctx, w = 512, h = 307; bubble(x, w, h, '#e0a020'); x.fillStyle = '#5a3a10'; x.font = '700 70px Prompt'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('ทรัพยากร', 256, 90);
  x.fillStyle = '#e8e0d0'; x.strokeStyle = '#1c1420'; x.lineWidth = 8; x.beginPath(); x.roundRect(56, 160, 400, 80, 22); x.fill(); x.stroke(); const c = q > .5 ? '#5cc85a' : q > .2 ? '#f2b030' : '#e04a3a'; x.fillStyle = c; if (q > .01) { x.beginPath(); x.roundRect(64, 168, 384 * q, 64, 16); x.fill(); } FA.pRes.userData.tx.needsUpdate = true; }
export function panelAt(g, pos, k, faceTo) { g.visible = k > .01; if (!g.visible) return; g.position.set(...pos); g.scale.setScalar(Math.max(.01, k)); g.userData.m.material.opacity = Math.min(1, k * 1.2); g.userData.gl.material.opacity = .35 * k; if (faceTo) g.lookAt(faceTo); }
// golden saplings for the ending
FA.saps = []; { const r = rng(55), tg = new THREE.CylinderGeometry(.04, .07, .5, 6); for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2 + .35, R = 3.2 + r() * 1.5; const g = group({ p: [Math.sin(a) * R, 0, Math.cos(a) * R], parent: FO }); mesh(tg, toon('#9a6a3c'), { p: [0, .25, 0], parent: g }); mesh(new THREE.SphereGeometry(.32, 12, 9), toon('#62c860', { emissive: '#ffd040', ei: .25 }), { p: [0, .62, 0], parent: g }); mesh(new THREE.SphereGeometry(.07, 8, 6), FA.fruitM, { p: [.18, .45, .12], parent: g }); FA.saps.push(g); } }
export function saplings(k) { FA.saps.forEach((g, i) => { const e = clamp(k * 1.6 - i * .07); g.visible = e > .01; g.scale.setScalar(Math.max(.01, e)); }); }
