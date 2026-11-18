
// ======================= THE LAST VILLAIN sets =======================
export { seaFar };
export function hideSea() { sea.visible = false; seaFar.visible = false; clouds.visible = false; }
const T = (w, h, f, o) => canvasTex(w, h, f, o);
const stoneTex = T(512, 512, (x, w, h) => { x.fillStyle = '#6e6a82'; x.fillRect(0, 0, w, h); const r = rng(5); for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { const v = 96 + (r() * 22 | 0); x.fillStyle = `rgb(${v},${v - 4},${v + 18})`; x.fillRect(i * 128 + 4, j * 128 + 4, 120, 120); } x.strokeStyle = '#3a3650'; x.lineWidth = 6; for (let i = 0; i <= 4; i++) { x.beginPath(); x.moveTo(i * 128, 0); x.lineTo(i * 128, h); x.moveTo(0, i * 128); x.lineTo(w, i * 128); x.stroke(); } }, { repeat: [6, 10] });
const wallTex = T(512, 512, (x, w, h) => { x.fillStyle = '#5c5874'; x.fillRect(0, 0, w, h); const r = rng(9); for (let j = 0; j < 8; j++) for (let i = 0; i < 4; i++) { const v = 84 + (r() * 20 | 0); x.fillStyle = `rgb(${v},${v - 2},${v + 16})`; x.fillRect(i * 128 + (j % 2) * 64 + 3, j * 64 + 3, 122, 58); } }, { repeat: [3, 3] });
const woodTex = T(512, 512, (x, w, h) => { const c = ['#8a5a36', '#7d4f2e', '#94623c']; for (let i = 0; i < 8; i++) { x.fillStyle = c[i % 3]; x.fillRect(i * 64, 0, 64, h); x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(i * 64, 0, 3, h); } }, { repeat: [2, 2] });
const glassTex = T(512, 512, (x, w, h) => { const cx = 256, cy = 256; const cols = ['#d8483e', '#3a6fd8', '#f2c94c', '#7a4ac8', '#3aa86a']; for (let k = 0; k < 16; k++) { x.fillStyle = cols[k % 5]; x.beginPath(); x.moveTo(cx, cy); x.arc(cx, cy, 250, k / 16 * 6.283, (k + 1) / 16 * 6.283); x.fill(); }
  x.fillStyle = '#ffe7a0'; x.beginPath(); x.arc(cx, cy, 70, 0, 7); x.fill(); x.strokeStyle = '#2a2236'; x.lineWidth = 10; for (let k = 0; k < 16; k++) { x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(k / 16 * 6.283) * 250, cy + Math.sin(k / 16 * 6.283) * 250); x.stroke(); } x.beginPath(); x.arc(cx, cy, 70, 0, 7); x.arc(cx, cy, 160, 0, 7); x.stroke(); x.lineWidth = 16; x.beginPath(); x.arc(cx, cy, 246, 0, 7); x.stroke(); });
const circleTex = T(512, 512, (x, w, h) => { x.strokeStyle = '#ff3a5a'; x.lineWidth = 10; x.lineCap = 'round'; for (const r of [240, 200, 120]) { x.beginPath(); x.arc(256, 256, r, 0, 7); x.stroke(); } x.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * 6.283 * 2 - 1.57; x.lineTo(256 + Math.cos(a) * 200, 256 + Math.sin(a) * 200); } x.closePath(); x.stroke(); x.font = 'bold 34px serif'; x.fillStyle = '#ff3a5a'; for (let k = 0; k < 12; k++) { x.save(); x.translate(256, 256); x.rotate(k / 12 * 6.283); x.fillText('ᚱᛟᚾ'[k % 3], -10, -212); x.restore(); } });
// ---------- HALL: cathedral / engagement altar (local origin, carpet along -z, altar at z -12) ----------
export const HALL = group({ parent: scene }); export const HA = {};
{
  mesh(rbox(12, .4, 34), toon('#ffffff', { map: stoneTex }), { p: [0, -.2, -6], parent: HALL, cast: false });
  mesh(rbox(1.6, .012, 26), toon('#9a2232'), { p: [0, .006, -2], parent: HALL, cast: false });
  for (const s of [-1, 1]) { mesh(rbox(.4, 12, 34), toon('#ffffff', { map: wallTex }), { p: [s * 6, 6, -6], parent: HALL, cast: false });
    for (let z = 4; z >= -13; z -= 3.4) { mesh(new THREE.CylinderGeometry(.42, .5, 9, 14), toon('#8a86a0'), { p: [s * 3.4, 4.5, z], parent: HALL }); mesh(rbox(1.2, .4, 1.2), toon('#6e6a86'), { p: [s * 3.4, .2, z], parent: HALL });
      mesh(rbox(.9, 2.6, .05), toon('#5a2f72', { side: THREE.DoubleSide }), { p: [s * 5.75, 5.6, z - 1.7], r: [0, 90, 0], parent: HALL, cast: false }); } }
  mesh(rbox(12, 14, .4), toon('#ffffff', { map: wallTex }), { p: [0, 7, -16.5], parent: HALL, cast: false });
  HA.glass = mesh(new THREE.CircleGeometry(2.6, 40), basic('#ffffff', { map: glassTex }), { p: [0, 7.2, -16.25], parent: HALL, cast: false }); HA.glass.userData.noInk = true;
  for (let i = 0; i < 3; i++) mesh(rbox(7 - i * 1.2, .3, 2.2 - i * .5), toon('#7a7690'), { p: [0, .15 + i * .3, -11.8 - i * .1], parent: HALL });
  HA.altar = mesh(rbox(2.2, 1.0, .9), toon('#d8d2e4'), { p: [0, 1.4, -12.4], parent: HALL });
  HA.circle = mesh(new THREE.CircleGeometry(3.2, 48), basic('#ffffff', { map: circleTex, transparent: true, opacity: 0, add: true, depthWrite: false }), { r: [-90, 0, 0], p: [0, .93, -11.6], parent: HALL, cast: false }); HA.circle.userData.noInk = true;
  HA.candles = []; for (const s of [-1, 1]) for (const z of [-10.5, -6, -1.5]) { const g = group({ p: [s * 2.4, 0, z], parent: HALL }); mesh(new THREE.CylinderGeometry(.05, .12, 1.6, 8), toon('#c9a24a'), { p: [0, .8, 0], parent: g }); mesh(new THREE.CylinderGeometry(.07, .07, .3, 8), toon('#f4efe2'), { p: [0, 1.75, 0], parent: g });
    const f = glowSprite('#ffb04a', .7, { opacity: .9 }); f.position.set(0, 2.0, 0); g.add(f); HA.candles.push(f); }
  HALL.visible = false;
}
export function hallAt(t, o = {}) { HALL.visible = true; HA.circle.material.opacity = o.circle || 0; HA.circle.rotation.z = t * .4; HA.candles.forEach((f, i) => { f.scale.setScalar(.6 + .08 * Math.sin(t * 13 + i * 2)); });
  const L = pts; L[0].position.set(0, 4, -8); L[0].color.set('#ffcf8a'); L[0].intensity = o.warm ?? 60; L[0].distance = 30;
  L[1].position.set(0, 7, -15); L[1].color.set(o.circle ? '#ff3a5a' : '#c9b4ff'); L[1].intensity = (o.glass ?? 50) + (o.circle || 0) * 120; L[1].distance = 26; }
// ---------- FIELD: plains, army, burning city (group at x 300) ----------
export const FIELD = group({ p: [300, 0, 0], parent: scene }); export const FA = {};
{
  mesh(rbox(400, 2, 400), toon('#6a7a4a'), { p: [0, -1, -100], parent: FIELD, cast: false });
  const R = rng(4); for (let i = 0; i < 9; i++) { const m = mesh(new THREE.ConeGeometry(30 + R() * 30, 40 + R() * 40, 5), toon('#5a5a7a'), { p: [-180 + i * 45 + R() * 20, 15, -190 - R() * 40], parent: FIELD, cast: false }); m.userData.noInk = false; }
  FA.rock = mesh(new THREE.DodecahedronGeometry(1.4, 0), toon('#6e6878'), { p: [0, .3, 0], s: [1.6, .7, 1.3], parent: FIELD });
  // army: instanced little soldiers (capsule body, head ball, helmet) on a grid in front of the rock
  const N = 260, bodyG = new THREE.CapsuleGeometry(.22, .4, 4, 8), headG = new THREE.SphereGeometry(.2, 10, 8), helmG = new THREE.SphereGeometry(.215, 10, 6, 0, 6.283, 0, 1.5), spearG = new THREE.CylinderGeometry(.02, .02, 1.6, 4);
  FA.army = [new THREE.InstancedMesh(bodyG, toon('#6a7486'), N), new THREE.InstancedMesh(headG, toon('#f4efe4'), N), new THREE.InstancedMesh(helmG, toon('#9aa4b4'), N), new THREE.InstancedMesh(spearG, toon('#5a4430'), N)];
  FA.armyPos = []; for (let i = 0; i < N; i++) { const r = i / 26 | 0, c = i % 26; FA.armyPos.push([(c - 12.5) * 1.1 + R() * .3, -14 - r * 1.3 - R() * .3, R() * 6.283]); }
  FA.army.forEach(m => { m.castShadow = true; FIELD.add(m); });
  // the burning city (houses + flames) far back
  FA.city = group({ p: [0, 0, -45], parent: FIELD }); FA.flames = [];
  for (let i = 0; i < 14; i++) { const x = (i - 7) * 4 + R() * 1.5, z = -R() * 8, h = 2 + R() * 3; mesh(rbox(3, h, 3), toon('#7a5a4a'), { p: [x, h / 2, z], parent: FA.city }); mesh(new THREE.ConeGeometry(2.4, 1.8, 4), toon('#5a2a2a'), { p: [x, h + .9, z], r: [0, 45, 0], parent: FA.city });
    for (let k = 0; k < 2; k++) { const f = mesh(new THREE.ConeGeometry(.9, 2.6, 6), basic('#ff8a2a', { transparent: true, opacity: .9 }), { p: [x + (k - .5) * 1.4, h + 1.6, z], parent: FA.city, cast: false }); f.userData.noInk = true; FA.flames.push(f); }
    const g = glowSprite('#ff6a2a', 9, { opacity: .5 }); g.position.set(x, h + 2, z); FA.city.add(g); }
  FA.poster = mesh(new THREE.PlaneGeometry(1.6, 2.2), basic('#ffffff'), { p: [6, 1.8, -6], parent: FIELD, cast: false }); FA.poster.userData.noInk = true;
  mesh(rbox(2.2, 3.2, .2), toon('#6a4a30'), { p: [6, 1.8, -6.12], parent: FIELD });
  FIELD.visible = false;
}
const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3();
export function armyAt(k, t, gone = 0) { // gone 0..1: front rows vanish first
  const N = FA.armyPos.length; for (let i = 0; i < N; i++) { const [x, z, ph] = FA.armyPos[i], row = Math.floor(i / 26), v = clamp((gone * 12 - row * .9) / 1.2), sc = (1 - v) * k, bob = Math.abs(Math.sin(t * 3 + ph)) * .04;
    _q.setFromEuler(new THREE.Euler(0, Math.PI, 0)); _s.setScalar(Math.max(1e-4, sc));
    [[0, .55 + bob], [0, 1.05 + bob], [0, 1.08 + bob], [.3, .9 + bob]].forEach(([dx, y], j) => { _p.set(x + dx, y * Math.max(.001, sc) + v * 1.2, z); _m4.compose(_p, _q, _s); FA.army[j].setMatrixAt(i, _m4); }); }
  FA.army.forEach(m => { m.instanceMatrix.needsUpdate = true; m.visible = k > 0; }); if (FA.standards) armyStandards(k, gone); }
export function cityAt(on, t) { FA.city.visible = on; FA.flames.forEach((f, i) => { f.scale.set(1 + .15 * Math.sin(t * 9 + i), 1 + .3 * Math.sin(t * 7 + i * 1.7), 1); }); }
export function posterAt(on) { FA.poster.visible = on; if (on && !FA.posterDrawn) { FA.posterDrawn = true; FA.poster.material.map = canvasTex(512, 704, (x, w, h) => {
  x.fillStyle = '#e8d4a8'; x.fillRect(0, 0, w, h); x.strokeStyle = '#7a5a30'; x.lineWidth = 18; x.strokeRect(9, 9, w - 18, h - 18); x.fillStyle = '#5a1a1a'; x.textAlign = 'center'; x.font = 'bold 78px Prompt'; x.fillText('ประกาศจับ', 256, 110);
  x.fillStyle = '#f7f2e8'; x.beginPath(); x.arc(256, 330, 140, 0, 7); x.fill(); x.lineWidth = 10; x.strokeStyle = '#22223a'; x.stroke(); x.fillStyle = '#221c30'; x.beginPath(); x.arc(256, 300, 142, Math.PI * 1.02, Math.PI * 1.98); x.fill();
  x.fillStyle = '#c0182a'; for (const s of [-1, 1]) { x.beginPath(); x.ellipse(256 + s * 48, 345, 14, 18, 0, 0, 7); x.fill(); } x.strokeStyle = '#22223a'; x.lineWidth = 8; x.beginPath(); x.moveTo(220, 410); x.quadraticCurveTo(256, 395, 300, 405); x.stroke();
  x.fillStyle = '#5a1a1a'; x.font = 'bold 50px Prompt'; x.fillText('ราชันแห่งบาป', 256, 540); x.font = '600 34px Prompt'; x.fillText('ศัตรูของมนุษยชาติ', 256, 600); x.font = 'bold 40px Prompt'; x.fillStyle = '#9a2a1a'; x.fillText('ค่าหัว ∞', 256, 660); });
  FA.poster.material.needsUpdate = true; } }
// ---------- BALCONY: castle balcony under the moon (group at x -300) ----------
export const BALC = group({ p: [-300, 0, 0], parent: scene });
{
  mesh(rbox(10, .4, 9.6), toon('#ffffff', { map: stoneTex }), { p: [0, -.2, 1.8], parent: BALC, cast: false });
  mesh(rbox(10, .18, .5), toon('#9a96b0'), { p: [0, 1.0, -2.8], parent: BALC });
  for (let x = -4.6; x <= 4.6; x += .46) mesh(new THREE.CylinderGeometry(.09, .12, .9, 8), toon('#8a86a0'), { p: [x, .48, -2.8], parent: BALC });
  mesh(rbox(10, 8, .4), toon('#ffffff', { map: wallTex }), { p: [0, 4, 4.6], parent: BALC, cast: false });
  for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(.35, .4, 5, 12), toon('#8a86a0'), { p: [s * 4.2, 2.5, 4.0], parent: BALC });
  const tw = group({ p: [-14, 0, -40], parent: BALC }); mesh(new THREE.CylinderGeometry(3, 3.4, 26, 14), toon('#5a5674'), { p: [0, 13, 0], parent: tw, cast: false }); mesh(new THREE.ConeGeometry(4, 8, 14), toon('#3a2a5a'), { p: [0, 30, 0], parent: tw, cast: false });
  for (let i = 0; i < 5; i++) { const w = mesh(rbox(.8, 1.2, .1), basic('#ffd27a'), { p: [Math.sin(i) * 1, 6 + i * 4, 3.4], parent: tw, cast: false }); w.userData.noInk = true; }
  BALC.visible = false;
}
// ---------- CRYPT: the sealed demon god (group at z 300) ----------
export const CRYPT = group({ p: [0, 0, 300], parent: scene }); export const CR = {};
{
  mesh(rbox(40, .4, 40), toon('#3a3448'), { p: [0, -.2, 0], parent: CRYPT, cast: false });
  CR.circle = mesh(new THREE.CircleGeometry(9, 48), basic('#ffffff', { map: circleTex, transparent: true, opacity: .8, add: true, depthWrite: false }), { r: [-90, 0, 0], p: [0, .03, -10], parent: CRYPT, cast: false }); CR.circle.userData.noInk = true;
  const d = CR.demon = group({ p: [0, 0, -12], parent: CRYPT }), skin = toon('#2a1f3a'), horn = toon('#d8cbb8');
  mesh(new THREE.SphereGeometry(4.6, 24, 16), skin, { p: [0, 5, 0], s: [1, 1.15, .8], parent: d });                       // hunched body
  CR.head = group({ p: [0, 10.2, 1.2], parent: d }); mesh(new THREE.SphereGeometry(2.4, 24, 16), skin, { s: [1.1, 1, 1], parent: CR.head });
  for (const s of [-1, 1]) { const h = mesh(new THREE.ConeGeometry(.6, 3.6, 10), horn, { p: [s * 1.6, 2.2, 0], r: [0, 0, -s * 32], parent: CR.head });
    mesh(new THREE.SphereGeometry(1.3, 14, 10), skin, { p: [s * 4.6, 5.5, 1.2], s: [1, 1.8, 1], parent: d });
    CR['eye' + s] = mesh(new THREE.SphereGeometry(.42, 14, 10), basic('#ff2a3a'), { p: [s * .85, .2, 2.15], s: [1.4, .7, .5], parent: CR.head }); CR['eye' + s].userData.noInk = true;
    for (const k of [0, 1]) { const a = [s * 13, 7 - k * 3, -6 + k * 6]; cylBetween([s * 4.4, 6 - k * 2, 0], a, .16, toon('#7a7a88'), d, 6); mesh(new THREE.CylinderGeometry(.7, .9, 14, 10), toon('#4a4458'), { p: [a[0] - s * 0, 7, a[2] - 12 + 12], parent: d }); } }
  CR.eyeGlow = glowSprite('#ff2a3a', 6, { opacity: 0 }); CR.eyeGlow.position.set(0, 10.4, 3.6); d.add(CR.eyeGlow);
  CRYPT.visible = false;
}
export function cryptAt(t, eye = 0) { CRYPT.visible = true; CR.circle.rotation.z = -t * .3; CR.head.rotation.set(Math.sin(t * .5) * .03, Math.sin(t * .3) * .05, 0);
  for (const s of [-1, 1]) { CR['eye' + s].scale.set(1.4, .05 + .65 * eye, .5); CR['eye' + s].visible = eye > .02; } CR.eyeGlow.material.opacity = .7 * eye;
  pts[0].position.set(0, 3, 290); pts[0].color.set('#ff3a5a'); pts[0].intensity = 80 + 40 * Math.sin(t * 3); pts[0].distance = 40; }
// ---------- VILLAGE: houses outside (group at z -300) + the hut interior at local x 40 ----------
export const VILL = group({ p: [0, 0, -300], parent: scene }); export const VI = {};
{
  mesh(rbox(120, .4, 120), toon('#4a5a3a'), { p: [0, -.2, 0], parent: VILL, cast: false });
  const R = rng(7); for (let i = 0; i < 6; i++) { const x = (i - 2.5) * 7 + R() * 2, z = -8 - (i % 2) * 6; mesh(rbox(4, 3, 4), toon('#9a7a5a'), { p: [x, 1.5, z], parent: VILL }); mesh(new THREE.ConeGeometry(3.4, 2.4, 4), toon('#6a4a3a'), { p: [x, 4.2, z], r: [0, 45, 0], parent: VILL });
    const w = mesh(rbox(.9, .9, .05), basic(i === 2 ? '#ffd27a' : '#3a3a5a'), { p: [x, 1.6, z + 2.03], parent: VILL, cast: false }); w.userData.noInk = true; }
  VI.hut = group({ p: [40, 0, 0], parent: VILL });
  mesh(rbox(6, .2, 6), toon('#ffffff', { map: woodTex }), { p: [0, -.1, 0], parent: VI.hut, cast: false });
  for (const [x, z, ry] of [[0, -3, 0], [-3, 0, 90], [3, 0, 90]]) mesh(rbox(6, 4, .2), toon('#ffffff', { map: woodTex }), { p: [x, 2, z], r: [0, ry, 0], parent: VI.hut, cast: false });
  VI.win = mesh(rbox(1, 1, .05), basic('#9ab4ff'), { p: [1.4, 2.4, -2.88], parent: VI.hut, cast: false }); VI.win.userData.noInk = true;
  mesh(rbox(1.6, .35, 2.4), toon('#7a5434'), { p: [-1.2, .25, -1.5], parent: VI.hut }); VI.blanket = mesh(rbox(1.5, .14, 1.6), toon('#4a6a9a'), { p: [-1.2, .5, -1.1], parent: VI.hut }); mesh(rbox(1.2, .16, .5), toon('#efe9dc'), { p: [-1.2, .5, -2.4], parent: VI.hut });
  VILL.visible = false;
}
export function hideSets() { HALL.visible = FIELD.visible = BALC.visible = CRYPT.visible = VILL.visible = false; }

// ---------- v4.22 AMBIENCE: floating particles in front of the camera + waving banners/flags, moon, stars ----------
const dotTex = T(64, 64, (x, w, h) => { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.35, 'rgba(255,255,255,.6)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); });
const AMB_N = 160, ambGeo = new THREE.BufferGeometry(), ambPos = new Float32Array(AMB_N * 3), ambCol = new Float32Array(AMB_N * 3);
ambGeo.setAttribute('position', new THREE.BufferAttribute(ambPos, 3)); ambGeo.setAttribute('color', new THREE.BufferAttribute(ambCol, 3));
const ambMat = new THREE.PointsMaterial({ size: .07, map: dotTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: true, sizeAttenuation: true, fog: false });
noOutline(ambMat); ambMat.userData.noInk = true;
const AMB = new THREE.Points(ambGeo, ambMat); AMB.frustumCulled = false; AMB.userData.noInk = true; AMB.renderOrder = 5; scene.add(AMB);
const AR = rng(77), ASEED = Array.from({ length: AMB_N }, () => [AR(), AR(), AR(), AR(), AR()]);
const AMB_KIND = { // colour, drift (x, y), size, twinkle speed, how many
  dust: { c: [1, .88, .66], v: [.05, .04], s: .065, tw: .6, n: 140, a: .8 },
  firefly: { c: [.85, 1, .45], v: [.08, .05], s: .08, tw: 2.2, n: 70, a: .9 },
  ember: { c: [1, .5, .15], v: [.1, .35], s: .075, tw: 3, n: 130, a: 1 },
  spark: { c: [1, .3, .4], v: [.06, .22], s: .06, tw: 2.5, n: 90, a: .9 },
  star: { c: [.8, .85, 1], v: [.01, .01], s: .045, tw: 1.4, n: 80, a: .6 } };
export function ambientAt(t, kind) { const K = AMB_KIND[kind]; AMB.visible = !!K; if (!K) return;
  camera.updateMatrixWorld(); AMB.position.copy(camera.position); AMB.quaternion.copy(camera.quaternion); ambMat.size = K.s;
  for (let i = 0; i < AMB_N; i++) { const [a, b, c, d, e] = ASEED[i], on = i < K.n; const z = -(1.6 + c * 7), hw = -z * .45, hh = -z * .8;
    let x = (a * 2 - 1) * hw + K.v[0] * t * (d - .5) * 2 + Math.sin(t * .7 + e * 9) * .12, y = (b * 2 - 1) * hh + K.v[1] * t + Math.sin(t * .5 + d * 7) * .08;
    x = ((x + hw) % (2 * hw) + 2 * hw) % (2 * hw) - hw; y = ((y + hh) % (2 * hh) + 2 * hh) % (2 * hh) - hh;
    ambPos.set(on ? [x, y, z] : [0, 0, 10], i * 3); const tw = K.a * (.45 + .55 * Math.max(0, Math.sin(t * K.tw + e * 20))) * (on ? 1 : 0);
    ambCol.set([K.c[0] * tw, K.c[1] * tw, K.c[2] * tw], i * 3); }
  ambGeo.attributes.position.needsUpdate = true; ambGeo.attributes.color.needsUpdate = true; }
// waving cloth: a subdivided plane hanging from its top edge
const CLOTHS = [];
function cloth(parent, p, w, h, col, o = {}) { const g = new THREE.PlaneGeometry(w, h, 8, 10); g.translate(0, -h / 2, 0);
  const m = mesh(g, toon(col, { side: THREE.DoubleSide, map: o.map || null }), { p, r: o.r || [0, 0, 0], parent, cast: false }); m.userData.base = g.attributes.position.array.slice(); m.userData.h = h; m.userData.amp = o.amp ?? .06; m.userData.ph = CLOTHS.length * 1.7; CLOTHS.push(m); return m; }
export function clothAt(t) { for (const m of CLOTHS) { let o = m, v = true; while (o) { v = v && o.visible; o = o.parent; } if (!v) continue;
  const P = m.geometry.attributes.position, B = m.userData.base, h = m.userData.h;
  for (let i = 0; i < P.count; i++) { const by = B[i * 3 + 1], k = Math.min(1, -by / h), bx = B[i * 3]; P.setZ(i, B[i * 3 + 2] + Math.sin(t * 2.2 + m.userData.ph + by * 3 + bx * 2) * m.userData.amp * k * k); P.setX(i, bx + Math.sin(t * 1.6 + m.userData.ph + by * 2) * m.userData.amp * .4 * k); }
  P.needsUpdate = true; m.geometry.computeVertexNormals(); } }
const crestTex = (bg, fg) => T(128, 256, (x, w, h) => { x.fillStyle = bg; x.fillRect(0, 0, w, h); x.fillStyle = '#e2b23c'; x.fillRect(0, 0, w, 14); x.fillRect(8, 0, 6, h); x.fillRect(w - 14, 0, 6, h);
  x.beginPath(); x.moveTo(0, h - 40); x.lineTo(w / 2, h); x.lineTo(w, h - 40); x.lineTo(w, h); x.lineTo(0, h); x.fillStyle = 'rgba(0,0,0,0)'; x.clearRect(0, h - 40, w, 40); x.fillStyle = bg; x.beginPath(); x.moveTo(0, h - 41); x.lineTo(w / 2, h - 2); x.lineTo(w, h - 41); x.fill();
  x.fillStyle = fg; x.beginPath(); for (let k = 0; k < 10; k++) { const a = k / 10 * 6.283 - 1.57, r = k % 2 ? 16 : 36; x.lineTo(w / 2 + Math.cos(a) * r, 110 + Math.sin(a) * r); } x.fill(); }, {});
// hall: long crest banners on the walls + hanging chandeliers
{ for (const s of [-1, 1]) for (let z = 2.3; z >= -11; z -= 3.4) { const b = cloth(HALL, [s * 5.72, 6.2, z], 1.0, 3.0, '#ffffff', { map: crestTex('#6a2a8c', '#f2c94c'), r: [0, -s * 90, 0], amp: .025 }); }
  HA.chand = []; for (const z of [-1, -6.5]) { const c = group({ p: [0, 7.2, z], parent: HALL }); cylBetween([0, 0, 0], [0, 6, 0], .02, toon('#3a3040'), c, 4);
    mesh(new THREE.TorusGeometry(.9, .06, 8, 24), toon('#c9a24a'), { r: [90, 0, 0], parent: c });
    for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283; mesh(new THREE.CylinderGeometry(.04, .04, .22, 6), toon('#f4ecd8'), { p: [Math.cos(a) * .9, .15, Math.sin(a) * .9], parent: c });
      const f = mesh(new THREE.SphereGeometry(.06, 8, 6), basic('#ffd27a', { add: true, transparent: true, opacity: .9 }), { p: [Math.cos(a) * .9, .32, Math.sin(a) * .9], parent: c, cast: false }); f.userData.noInk = true; HA.chand.push(f); } } }
// balcony: big moon + glow, a few banners on the wall
{ BALC.userData.moon = mesh(new THREE.CircleGeometry(4, 40), basic('#fff6d8', { fog: false }), { p: [8, 22, -60], parent: BALC, cast: false }); BALC.userData.moon.userData.noInk = true;
  const gl = mesh(new THREE.CircleGeometry(9, 40), basic('#b8c8ff', { fog: false, transparent: true, opacity: .18, add: true, depthWrite: false }), { p: [8, 22, -60.5], parent: BALC, cast: false }); gl.userData.noInk = true;
  for (const x of [-2.6, 2.6]) cloth(BALC, [x, 3.6, -2.95], .9, 2.2, '#ffffff', { map: crestTex('#24468e', '#f2c94c'), amp: .07 }); }
// field: battle flags along the army

// ---------- v4.23 PROP LIBRARY (refs: barrels, crates, carts, tents, racks, shields, lanterns, skulls...) ----------
const PM = (c) => toon(c), WOOD = '#8a5a36', WOOD2 = '#6e4426', IRON = '#5a5a68', GOLD = '#d9a93a';
const stripeTex2 = (a, b, n = 8) => T(256, 64, (x, w, h) => { for (let i = 0; i < n; i++) { x.fillStyle = i % 2 ? b : a; x.fillRect(i * w / n, 0, w / n + 1, h); } }, {});
function barrel(par, p, s = 1, ry = 0) { const g = group({ p, s: [s, s, s], r: [0, ry, 0], parent: par });
  const pts = []; for (let i = 0; i <= 8; i++) { const y = i / 8; pts.push(new THREE.Vector2(.36 + Math.sin(y * Math.PI) * .07, y * 1.0)); }
  mesh(new THREE.LatheGeometry(pts, 16), PM(WOOD), { parent: g }); mesh(new THREE.CircleGeometry(.36, 16), PM(WOOD2), { p: [0, 1, 0], r: [-90, 0, 0], parent: g });
  for (const y of [.14, .5, .86]) mesh(new THREE.TorusGeometry(.36 + Math.sin(y * Math.PI) * .07 + .005, .022, 6, 20), PM(IRON), { p: [0, y, 0], r: [90, 0, 0], parent: g }); return g; }
function crate(par, p, s = 1, ry = 0) { const g = group({ p, s: [s, s, s], r: [0, ry, 0], parent: par }); mesh(rbox(.8, .8, .8), toon('#ffffff', { map: woodTex }), { p: [0, .4, 0], parent: g });
  for (const sg of [-1, 1]) { mesh(rbox(.1, 1.05, .04), PM(WOOD2), { p: [0, .4, sg * .41], r: [0, 0, 45], parent: g }); mesh(rbox(.04, 1.05, .1), PM(WOOD2), { p: [sg * .41, .4, 0], r: [45, 0, 0], parent: g }); } return g; }
function wheel(par, p, r = .55, ry = 0) { const g = group({ p, r: [0, ry, 0], parent: par }); mesh(new THREE.TorusGeometry(r, .05, 6, 20), PM(WOOD2), { parent: g }); mesh(new THREE.CylinderGeometry(.09, .09, .16, 10), PM(IRON), { r: [90, 0, 0], parent: g });
  for (let k = 0; k < 8; k++) mesh(rbox(.04, r * 2, .04), PM(WOOD), { r: [0, 0, k * 22.5], parent: g }); return g; }
function cart(par, p, ry = 0, load = 'hay') { const g = group({ p, r: [0, ry, 0], parent: par }); mesh(rbox(1.6, .14, 2.4), toon('#ffffff', { map: woodTex }), { p: [0, .75, 0], parent: g });
  for (const sg of [-1, 1]) { mesh(rbox(.08, .4, 2.4), PM(WOOD), { p: [sg * .8, .98, 0], parent: g }); wheel(g, [sg * .9, .55, -.3], .55, 90); mesh(rbox(.06, .06, 1.6), PM(WOOD2), { p: [sg * .35, .62, 2.0], parent: g }); }
  if (load === 'hay') mesh(new THREE.SphereGeometry(.9, 12, 8), PM('#d9b85a'), { p: [0, .95, 0], s: [.85, .55, 1.3], parent: g }); else { barrel(g, [-.35, .82, -.5], .7); barrel(g, [.35, .82, -.5], .7); crate(g, [0, .82, .55], .7, 20); } return g; }
function tent(par, p, s = 1, c1 = '#efe6d2', c2 = '#b0303a', ry = 0) { const g = group({ p, s: [s, s, s], r: [0, ry, 0], parent: par });
  mesh(new THREE.ConeGeometry(1.8, 2.6, 8, 1, true), toon('#ffffff', { map: stripeTex2(c1, c2), side: THREE.DoubleSide }), { p: [0, 1.3, 0], parent: g });
  cylBetween([0, 2.5, 0], [0, 3.3, 0], .03, PM(WOOD2), g, 4); const f = mesh(new THREE.PlaneGeometry(.5, .28), toon(c2, { side: THREE.DoubleSide }), { p: [.26, 3.15, 0], parent: g, cast: false }); return g; }
function spearRack(par, p, ry = 0) { const g = group({ p, r: [0, ry, 0], parent: par }); for (const x of [-.7, .7]) cylBetween([x, 0, 0], [x, 1.1, 0], .04, PM(WOOD2), g, 6); cylBetween([-.75, 1, 0], [.75, 1, 0], .035, PM(WOOD2), g, 6);
  for (let k = 0; k < 5; k++) { const x = -.5 + k * .25; cylBetween([x, 0, .12], [x - .08, 2.2, -.05], .02, PM(WOOD), g, 4); mesh(new THREE.ConeGeometry(.05, .22, 4), PM('#c8ced8'), { p: [x - .085, 2.3, -.06], parent: g }); } return g; }
function shield(par, p, r = .45, ry = 0, c = '#24468e', rim = GOLD) { const g = group({ p, r: [0, ry, 0], parent: par }); mesh(new THREE.CylinderGeometry(r, r, .06, 24), PM(c), { r: [90, 0, 0], parent: g });
  mesh(new THREE.TorusGeometry(r, .04, 6, 24), PM(rim), { parent: g }); mesh(new THREE.SphereGeometry(r * .22, 12, 8), PM('#d8dde6'), { p: [0, 0, .04], s: [1, 1, .6], parent: g }); return g; }
function armorStand(par, p, ry = 0) { const g = group({ p, r: [0, ry, 0], parent: par }); mesh(new THREE.CylinderGeometry(.35, .4, .25, 12), PM('#5a5470'), { p: [0, .12, 0], parent: g });
  cylBetween([0, .25, 0], [0, 1.0, 0], .04, PM(IRON), g, 6); mesh(new THREE.CapsuleGeometry(.32, .45, 6, 12), PM('#c8ced8'), { p: [0, 1.35, 0], s: [1, 1, .8], parent: g });
  mesh(new THREE.SphereGeometry(.28, 14, 10), PM('#d8dde6'), { p: [0, 2.0, 0], parent: g }); mesh(rbox(.36, .05, .1), PM('#2a2a34'), { p: [0, 2.0, .25], parent: g });
  mesh(new THREE.ConeGeometry(.07, .3, 6), PM('#b0303a'), { p: [0, 2.35, 0], parent: g }); for (const sg of [-1, 1]) mesh(new THREE.SphereGeometry(.16, 10, 8), PM('#d8dde6'), { p: [sg * .36, 1.65, 0], s: [1, .7, 1], parent: g }); return g; }
function lantern(par, p, h = 1.8, warm = '#ffcf6a') { const g = group({ p, parent: par }); if (h > 0) cylBetween([0, 0, 0], [0, h, 0], .035, PM('#3a3040'), g, 6);
  mesh(rbox(.22, .3, .22), basic(warm, { transparent: true, opacity: .95 }), { p: [0, h + .05, 0], parent: g, cast: false }); mesh(new THREE.ConeGeometry(.2, .16, 4), PM('#3a3040'), { p: [0, h + .28, 0], r: [0, 45, 0], parent: g });
  const gl = glowSprite(warm, 1.6, { opacity: .55 }); gl.position.set(0, h + .05, 0); g.add(gl); return g; }
function candles(par, p, n = 3) { const g = group({ p, parent: par }); const R = rng(n * 13); for (let k = 0; k < n; k++) { const h = .2 + R() * .3, x = (R() - .5) * .4, z = (R() - .5) * .3;
  mesh(new THREE.CylinderGeometry(.045, .05, h, 8), PM('#efe6d2'), { p: [x, h / 2, z], parent: g }); const f = mesh(new THREE.SphereGeometry(.035, 6, 6), basic('#ffd27a'), { p: [x, h + .04, z], s: [1, 1.6, 1], parent: g, cast: false }); f.userData.noInk = true; }
  const gl = glowSprite('#ffb84a', 1.4, { opacity: .5 }); gl.position.set(0, .45, 0); g.add(gl); return g; }
function skull(par, p, s = 1, ry = 0) { const g = group({ p, s: [s, s, s], r: [0, ry, 0], parent: par }); mesh(new THREE.SphereGeometry(.16, 12, 10), PM('#e8e0cc'), { p: [0, .16, 0], s: [1, .95, 1.05], parent: g });
  mesh(rbox(.18, .08, .14), PM('#e8e0cc'), { p: [0, .05, .04], parent: g }); for (const sg of [-1, 1]) mesh(new THREE.SphereGeometry(.045, 8, 6), PM('#1a1420'), { p: [sg * .06, .17, .13], parent: g }); return g; }
function bone(par, p, ry = 0) { const g = group({ p, r: [0, ry, 90], parent: par }); cylBetween([0, -.22, 0], [0, .22, 0], .025, PM('#e8e0cc'), g, 6); for (const y of [-.24, .24]) for (const x of [-.03, .03]) mesh(new THREE.SphereGeometry(.035, 6, 6), PM('#e8e0cc'), { p: [x, y, 0], parent: g }); return g; }
function cloud(par, p, s = 1) { const g = group({ p, s: [s, s, s], parent: par }); const R = rng(Math.round(p[0] * 7 + p[2])); for (let k = 0; k < 6; k++) { const m = mesh(new THREE.SphereGeometry(1 + R() * .8, 12, 8), basic('#ffffff', { transparent: true, opacity: .92 }), { p: [(k - 2.5) * 1.3, R() * .6, R() * .5], parent: g, cast: false }); m.userData.noInk = true; } return g; }
function castle(par, p, s = 1, roof = '#2a4f9e') { const g = group({ p, s: [s, s, s], parent: par }); const st = toon('#d8d2c4');
  mesh(rbox(10, 3.2, 1), st, { p: [0, 1.6, 0], parent: g }); for (let k = 0; k < 9; k++) mesh(rbox(.6, .5, 1.05), st, { p: [-4.5 + k * 1.12, 3.4, 0], parent: g });
  for (const x of [-5.2, 5.2, 0]) { const h = x ? 5 : 7; mesh(new THREE.CylinderGeometry(1.1, 1.2, h, 12), st, { p: [x, h / 2, .3], parent: g }); mesh(new THREE.ConeGeometry(1.4, 2.4, 12), PM(roof), { p: [x, h + 1.2, .3], parent: g });
    const f = cloth(g, [x, h + 3.4, .3], .5, .9, '#ffffff', { map: crestTex('#b0303a', '#f2c94c'), r: [0, 0, 90], amp: .08 }); cylBetween([x, h + 2.2, .3], [x, h + 3.5, .3], .04, PM(WOOD2), g, 4); }
  mesh(rbox(1.8, 2.2, .3), PM('#3a2a20'), { p: [0, 1.1, .55], parent: g }); return g; }
function grassField(par, n, area, seed = 3, col = '#7aa64a') { const R = rng(seed), geo = new THREE.ConeGeometry(.028, .2, 3), im = new THREE.InstancedMesh(geo, toon(col), n * 3); let i = 0;
  for (let k = 0; k < n; k++) { const x = area[0] + R() * (area[1] - area[0]), z = area[2] + R() * (area[3] - area[2]); for (let j = 0; j < 3; j++) { _p.set(x + (j - 1) * .07, .15, z + (R() - .5) * .06); _q.setFromEuler(new THREE.Euler((R() - .5) * .5, 0, (j - 1) * .35)); _s.set(1, .7 + R() * .6, 1); _m4.compose(_p, _q, _s); im.setMatrixAt(i++, _m4); } }
  im.castShadow = false; im.userData.noInk = true; par.add(im); return im; }
function stones(par, n, area, seed = 5, col = '#a89a84') { const R = rng(seed), im = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(.12, 0), toon(col), n);
  for (let k = 0; k < n; k++) { _p.set(area[0] + R() * (area[1] - area[0]), .01, area[2] + R() * (area[3] - area[2])); _q.setFromEuler(new THREE.Euler(0, R() * 6, 0)); const s = .5 + R() * 1.2; _s.set(s, .25 * s, s * (.7 + R() * .6)); _m4.compose(_p, _q, _s); im.setMatrixAt(k, _m4); }
  im.castShadow = false; par.add(im); return im; }

// ---------- dressing each set ----------
{ // FIELD: dirt road, grass tufts, army camp (tents, racks, barrels, crates, cart), snow-capped peaks, rolling hills, clouds, a castle on the hill
  mesh(rbox(5, .02, 80), PM('#9a8060'), { p: [0, .005, 0], parent: FIELD, cast: false }); stones(FIELD, 160, [-2.4, 2.4, -30, 30], 11);
  grassField(FIELD, 700, [-16, 16, -22, 22], 3, '#7e9a50'); grassField(FIELD, 300, [-30, 30, -60, -22], 4, '#728e48');
  for (const [x, z] of [[-60, -150], [-20, -170], [30, -160], [75, -150]]) { mesh(new THREE.SphereGeometry(40, 20, 12), PM('#5f8a4a'), { p: [x, -22, z + 60], s: [1.4, .6, 1], parent: FIELD, cast: false }); }
  const R = rng(21); for (let i = 0; i < 9; i++) { const x = -180 + i * 45 + R() * 20, z = -190 - R() * 40, h = 40 + R() * 40; mesh(new THREE.ConeGeometry(9 + R() * 4, 12, 5), PM('#f4f2ec'), { p: [x, 15 + h / 2 - 2, z + 1], parent: FIELD, cast: false }); }
  for (const [x, y, z, s] of [[-40, 40, -120, 4], [20, 48, -140, 5], [60, 36, -110, 3.5], [-80, 52, -150, 5], [0, 30, -90, 3]]) cloud(FIELD, [x, y, z], s);
  castle(FIELD, [-28, 4, -60], 1.6); }
{ // HALL: armour stands along the carpet, shields + crossed spears on the pillars, candelabras, chests
  for (const s of [-1, 1]) for (let z = 4; z >= -13; z -= 3.4) { shield(HALL, [s * 3.0, 3.2, z], .5, s * 90, s < 0 ? '#6a2a8c' : '#24468e'); }
  for (const [x, z] of [[-2.2, -9.8], [2.2, -9.8], [-1.8, 3.6], [1.8, 3.6]]) { cylBetween([x, 0, z], [x, 1.6, z], .05, PM(GOLD), HALL, 6); candles(HALL, [x, 1.6, z], 3); }
  for (const [x, z] of [[-4.6, -3], [4.6, 0.5]]) { crate(HALL, [x, 0, z], .9, 15); barrel(HALL, [x + .2, 0, z + 1.2], .85); } }
{ // BALCONY: lanterns on the railing, potted plants, a far castle with lit windows on the hill, clouds across the moon
  for (const x of [-4, -1.4, 1.4, 4]) lantern(BALC, [x, 1.1, -2.8], .35, '#ffcf6a');
  for (const x of [-3.2, 3.2]) { mesh(new THREE.CylinderGeometry(.32, .24, .5, 12), PM('#a0583a'), { p: [x, .25, -2.2], parent: BALC }); mesh(new THREE.SphereGeometry(.45, 12, 10), PM('#3e7a4a'), { p: [x, .75, -2.2], s: [1, .9, 1], parent: BALC }); }
  castle(BALC, [18, -6, -70], 2.2, '#3a2a5a'); for (const [x, y, z, s] of [[2, 26, -58, 2.4], [16, 30, -64, 3]]) { const c = cloud(BALC, [x, y, z], s); c.children.forEach(m => m.material = basic('#8a90c0', { transparent: true, opacity: .8 })); } }
{ // CRYPT: skulls, bones, candle clusters, broken pillars, hanging chains, a coffin
  const R = rng(31); for (let i = 0; i < 18; i++) skull(CRYPT, [(R() - .5) * 18, 0, -4 - R() * 14], .9 + R() * .6, R() * 6);
  for (let i = 0; i < 24; i++) bone(CRYPT, [(R() - .5) * 18, .03, -3 - R() * 15], R() * 6);
  for (const [x, z] of [[-4, -5], [4, -5.5], [-6.5, -9], [6.5, -9.5], [-2.5, -2.5], [2.8, -2.8]]) candles(CRYPT, [x, 0, z], 5);
  for (const [x, z, h] of [[-7.5, -6, 3.5], [7.5, -6.5, 2.2], [-9, -12, 6], [9, -13, 4.5]]) { mesh(new THREE.CylinderGeometry(.55, .65, h, 10), PM('#5a5470'), { p: [x, h / 2, z], parent: CRYPT }); mesh(rbox(1.5, .3, 1.5), PM('#4a4460'), { p: [x, .15, z], parent: CRYPT }); }
  for (const [x, z] of [[-3, -7], [3.4, -7.5]]) for (let k = 0; k < 9; k++) mesh(new THREE.TorusGeometry(.09, .025, 6, 10), PM(IRON), { p: [x, 8 - k * .17, z], r: [0, k % 2 ? 90 : 0, 0], parent: CRYPT });
  const cf = group({ p: [5, 0, -3.6], r: [0, -30, 0], parent: CRYPT }); mesh(rbox(1, .6, 2.3), PM('#4a3020'), { p: [0, .3, 0], parent: cf }); mesh(rbox(1.08, .12, 2.38), PM('#3a2418'), { p: [.15, .66, -.1], r: [0, 8, 0], parent: cf }); cylBetween([0, .73, -.6], [0, .73, .4], .03, PM(GOLD), cf, 4); cylBetween([-.3, .73, -.3], [.3, .73, -.3], .03, PM(GOLD), cf, 4); }
{ // VILLAGE: fences, a well, haystacks, barrels, lanterns, trees; the hut gets a table, a chair, a candle and a shelf
  for (let i = 0; i < 12; i++) { const x = -14 + i * 2.4; cylBetween([x, 0, -2], [x, 1, -2], .06, PM(WOOD2), VILL, 5); if (i < 11) { cylBetween([x, .7, -2], [x + 2.4, .7, -2], .04, PM(WOOD), VILL, 4); cylBetween([x, .35, -2], [x + 2.4, .35, -2], .04, PM(WOOD), VILL, 4); } }
  const wl = group({ p: [6, 0, -4], parent: VILL }); mesh(new THREE.CylinderGeometry(.9, .95, .9, 14, 1, true), toon('#8a8494', { side: THREE.DoubleSide }), { p: [0, .45, 0], parent: wl }); for (const x of [-.9, .9]) cylBetween([x, .9, 0], [x, 2.2, 0], .06, PM(WOOD2), wl, 5); mesh(new THREE.ConeGeometry(1.4, .8, 4), PM('#6a4a3a'), { p: [0, 2.5, 0], r: [0, 45, 0], parent: wl });
  for (const [x, z] of [[-9, -4], [-7.6, -4.6]]) mesh(new THREE.SphereGeometry(.9, 12, 8), PM('#d9b85a'), { p: [x, .5, z], s: [1, .8, 1], parent: VILL });
  for (const [x, z] of [[2, -4.5], [2.8, -4.2], [-3, -4.4]]) barrel(VILL, [x, 0, z], .9, x);
  for (const x of [-11, -4, 3, 10]) lantern(VILL, [x, 0, -1.4], 2.0);
  const R = rng(41); for (let i = 0; i < 10; i++) { const x = -26 + i * 5.6 + R() * 2, z = -22 - R() * 6; cylBetween([x, 0, z], [x, 2, z], .25, PM('#5a4030'), VILL, 6); mesh(new THREE.ConeGeometry(1.8, 4, 8), PM('#2f5a3a'), { p: [x, 3.6, z], parent: VILL }); }
  mesh(rbox(1.2, .08, .8), PM(WOOD), { p: [1.2, .75, -1.6], parent: VI.hut }); for (const [x, z] of [[.7, -1.9], [1.7, -1.9], [.7, -1.3], [1.7, -1.3]]) cylBetween([x, 0, z], [x, .72, z], .03, PM(WOOD2), VI.hut, 4);
  candles(VI.hut, [1.3, .79, -1.6], 1); mesh(rbox(1.6, .06, .35), PM(WOOD), { p: [-.4, 2.2, -2.75], parent: VI.hut }); for (let k = 0; k < 5; k++) mesh(rbox(.14, .3 + (k % 2) * .08, .22), PM(['#8a3a3a', '#3a5a8a', '#6a8a3a'][k % 3]), { p: [-1 + k * .2, 2.4, -2.75], parent: VI.hut }); }

// ---------- v4.24 more props (refs: bunting, market stalls, baskets, herbs, torches, campfires) ----------
function bunting(par, a, b, n = 14, cols = ['#b0303a', '#e2b23c', '#24468e']) { cylBetween(a, b, .012, PM('#3a3040'), par, 4);
  for (let k = 0; k < n; k++) { const u = (k + .5) / n, x = a[0] + (b[0] - a[0]) * u, z = a[2] + (b[2] - a[2]) * u, y = a[1] + (b[1] - a[1]) * u - Math.sin(u * Math.PI) * .6;
    const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-.16, 0, 0), new THREE.Vector3(.16, 0, 0), new THREE.Vector3(0, -.34, 0)]); g.computeVertexNormals();
    const m = mesh(g, toon(cols[k % cols.length], { side: THREE.DoubleSide }), { p: [x, y, z], r: [0, Math.atan2(b[0] - a[0], b[2] - a[2]) * 57.3 + 90, 0], parent: par, cast: false }); } }
function basket(par, p, fill = '#d8822a', s = 1) { const g = group({ p, s: [s, s, s], parent: par }); mesh(new THREE.CylinderGeometry(.32, .24, .26, 14, 1, true), toon('#b8863a', { side: THREE.DoubleSide }), { p: [0, .13, 0], parent: g });
  mesh(new THREE.TorusGeometry(.32, .025, 6, 16), PM('#9a6a2a'), { p: [0, .26, 0], r: [90, 0, 0], parent: g }); const R = rng(Math.round(p[0] * 10 + p[2]));
  for (let k = 0; k < 9; k++) { const a = k / 9 * 6.283, r = k ? .17 : 0; mesh(new THREE.SphereGeometry(.09, 10, 8), PM(fill), { p: [Math.cos(a) * r, .26 + (k ? 0 : .06), Math.sin(a) * r], parent: g }); } return g; }
function sack(par, p, s = 1) { const g = group({ p, s: [s, s, s], parent: par }); mesh(new THREE.SphereGeometry(.3, 12, 10), PM('#c8b088'), { p: [0, .3, 0], s: [1, 1.2, .9], parent: g }); mesh(new THREE.ConeGeometry(.1, .18, 8), PM('#b89a70'), { p: [0, .72, 0], parent: g }); return g; }
function stall(par, p, ry = 0, c1 = '#b0303a') { const g = group({ p, r: [0, ry, 0], parent: par }); mesh(rbox(2.2, .9, .8), toon('#ffffff', { map: woodTex }), { p: [0, .45, 0], parent: g });
  for (const x of [-1.05, 1.05]) for (const z of [-.35, .35]) cylBetween([x, 0, z], [x, 2.1, z], .04, PM(WOOD2), g, 5);
  mesh(rbox(2.5, .05, 1.3), toon('#ffffff', { map: stripeTex2('#efe6d2', c1, 10) }), { p: [0, 2.15, .15], r: [14, 0, 0], parent: g });
  basket(g, [-.6, .9, 0], '#d8442a', .9); basket(g, [.1, .9, 0], '#c88a3a', .9); basket(g, [.75, .9, 0], '#7ab04a', .9); sack(g, [1.4, 0, .4], .9); sack(g, [-1.4, 0, .3], .8); return g; }
function woodpile(par, p, ry = 0) { const g = group({ p, r: [0, ry, 0], parent: par }); for (let r = 0; r < 3; r++) for (let k = 0; k < 4 - r; k++) mesh(new THREE.CylinderGeometry(.1, .1, .9, 8), PM(k % 2 ? '#8a5a36' : '#9a6a40'), { p: [(k - (3 - r) / 2) * .21, .1 + r * .18, 0], r: [90, 0, 0], parent: g });
  const ax = group({ p: [.6, 0, .2], r: [0, 0, -20], parent: g }); cylBetween([0, 0, 0], [0, .7, 0], .025, PM(WOOD), ax, 5); mesh(rbox(.2, .12, .03), PM('#9aa0ae'), { p: [.08, .65, 0], parent: ax }); return g; }
function torch(par, p, ry = 0) { const g = group({ p, r: [0, ry, 0], parent: par }); cylBetween([0, 0, 0], [0, .5, .15], .03, PM('#3a3040'), g, 5); mesh(new THREE.CylinderGeometry(.07, .05, .14, 8), PM('#5a4030'), { p: [0, .55, .17], parent: g });
  const f = mesh(new THREE.ConeGeometry(.08, .28, 8), basic('#ffb03a', { transparent: true, opacity: .95 }), { p: [0, .74, .17], parent: g, cast: false }); f.userData.noInk = true; FLAMES.push(f);
  const gl = glowSprite('#ff8a2a', 1.8, { opacity: .55 }); gl.position.set(0, .75, .17); g.add(gl); return g; }
function campfire(par, p) { const g = group({ p, parent: par }); for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283; mesh(new THREE.DodecahedronGeometry(.14, 0), PM('#7a7484'), { p: [Math.cos(a) * .45, .06, Math.sin(a) * .45], parent: g }); }
  for (let k = 0; k < 3; k++) mesh(new THREE.CylinderGeometry(.05, .05, .7, 6), PM('#6a4426'), { p: [0, .12, 0], r: [80, k * 60, 0], parent: g });
  for (let k = 0; k < 3; k++) { const f = mesh(new THREE.ConeGeometry(.16 - k * .03, .55 - k * .1, 8), basic(['#ff8a2a', '#ffb03a', '#ffe08a'][k], { transparent: true, opacity: .9 }), { p: [0, .32, 0], parent: g, cast: false }); f.userData.noInk = true; FLAMES.push(f); }
  for (const x of [-.55, .55]) cylBetween([x, 0, 0], [x, 1.1, 0], .03, PM(WOOD2), g, 4); cylBetween([-.6, 1.05, 0], [.6, 1.05, 0], .025, PM(WOOD2), g, 4);
  mesh(new THREE.SphereGeometry(.22, 12, 8, 0, 6.283, Math.PI / 2, Math.PI / 2), PM('#3a3a44'), { p: [0, .78, 0], parent: g }); const gl = glowSprite('#ff7a2a', 3, { opacity: .5 }); gl.position.set(0, .5, 0); g.add(gl); return g; }
function herbs(par, p) { const g = group({ p, parent: par }); cylBetween([0, 0, 0], [0, -.25, 0], .01, PM('#3a3040'), g, 3); const R = rng(Math.round(p[0] * 9));
  for (let k = 0; k < 5; k++) mesh(new THREE.ConeGeometry(.06, .35, 5), PM(['#5a8a4a', '#7a9a4a', '#4a7a3a'][k % 3]), { p: [(R() - .5) * .14, -.42, (R() - .5) * .1], r: [180 + (R() - .5) * 20, 0, (R() - .5) * 20], parent: g }); return g; }
function flowerBox(par, p, l = 1.2) { const g = group({ p, parent: par }); mesh(rbox(l, .22, .3), PM('#7a4a2a'), { p: [0, .11, 0], parent: g }); const R = rng(Math.round(p[0] * 13));
  for (let k = 0; k < 7; k++) { const x = (k / 6 - .5) * (l - .2); mesh(new THREE.SphereGeometry(.1, 8, 6), PM('#3e7a4a'), { p: [x, .3, 0], parent: g }); mesh(new THREE.SphereGeometry(.05, 8, 6), PM(['#e2445a', '#f2c94c', '#e8a0d0'][k % 3]), { p: [x + .03, .4, .06], parent: g }); } return g; }
const FLAMES = [];
export function flamesAt(t) { FLAMES.forEach((f, i) => { f.scale.set(1 + .12 * Math.sin(t * 11 + i * 2), 1 + .25 * Math.sin(t * 8.3 + i * 1.3), 1 + .12 * Math.cos(t * 9 + i)); }); }
{ // HALL: bunting across the nave + flower urns by the altar
  for (const x of [-3.4, 3.4]) { mesh(new THREE.CylinderGeometry(.3, .2, .6, 12), PM('#d8d2e4'), { p: [x, .3 + .9, -11.4], parent: HALL }); for (let k = 0; k < 5; k++) mesh(new THREE.SphereGeometry(.12, 8, 6), PM(['#e2445a', '#f4ecd8', '#f2c94c'][k % 3]), { p: [x + (k - 2) * .1, 1.65 + (k % 2) * .08, -11.4], parent: HALL }); } }
{ // BALCONY: flower boxes on the railing
  for (const x of [-2.7, 0, 2.7]) flowerBox(BALC, [x, 1.09, -2.8], 1.1); }
{ // CRYPT: wall torches ring the ritual circle
  for (const [x, z] of [[-8, -4], [8, -4], [-9, -10], [9, -10], [-5, -16], [5, -16]]) { mesh(rbox(1.2, 3, .4), PM('#4a4460'), { p: [x, 1.5, z - .3], parent: CRYPT }); torch(CRYPT, [x, 1.6, z - .1], 0); } }
{ // VILLAGE: market stalls, woodpile, string lights; hut: hanging herbs, pots on a shelf, bread basket, broom
  for (const x of [-14, -4, 6]) { const a = [x, 2.4, -1.5], b = [x + 10, 2.4, -1.5]; cylBetween(a, b, .01, PM('#3a3040'), VILL, 3); for (let k = 1; k < 10; k++) { const l = mesh(new THREE.SphereGeometry(.07, 8, 6), basic(['#ffcf6a', '#ff8a5a', '#fff2b0'][k % 3]), { p: [x + k, 2.4 - Math.sin(k / 10 * Math.PI) * .35, -1.5], parent: VILL, cast: false }); l.userData.noInk = true; } }
  for (const x of [-2, -1.4, -.8, .4, 1]) herbs(VI.hut, [x, 3.95, -1.8]);
  for (const [x, c] of [[-1.8, '#5a5a68'], [-1.45, '#a0583a'], [-1.1, '#5a5a68']]) mesh(new THREE.CylinderGeometry(.13, .1, .22, 10), PM(c), { p: [x, 2.36, -2.75], parent: VI.hut });
  basket(VI.hut, [1.0, .79, -1.5], '#c88a3a', .6); const br = group({ p: [2.6, 0, -2.6], r: [0, 0, 12], parent: VI.hut }); cylBetween([0, 0, 0], [0, 1.4, 0], .025, PM(WOOD), br, 4); mesh(new THREE.ConeGeometry(.16, .4, 8), PM('#d9b85a'), { p: [0, .15, 0], r: [180, 0, 0], parent: br }); }

// ---------- v4.25 STORY DRESSING: props that belong to what happens in each scene ----------
{ // BATTLEFIELD (Kael vs the army, then the heroes' charge): standards carried IN the army's front rank, war debris on the ground
  FA.standards = []; for (const c of [2, 7, 12.5, 18, 23]) { const g = group({ parent: FIELD }); g.userData.x = (c - 12.5) * 1.1; cylBetween([0, 0, 0], [0, 3.6, 0], .04, PM(WOOD2), g, 6); mesh(new THREE.ConeGeometry(.06, .2, 6), PM(GOLD), { p: [0, 3.7, 0], parent: g });
    cloth(g, [.03, 3.5, 0], .55, 1.0, '#ffffff', { map: crestTex(c === 12.5 ? '#e2b23c' : '#b0303a', c === 12.5 ? '#b0303a' : '#f2c94c'), r: [0, 0, 90], amp: .08 }); g.visible = false; FA.standards.push(g); }
  const R = rng(61); for (let i = 0; i < 14; i++) { const x = (R() - .5) * 12, z = -2 - R() * 9; if (Math.abs(x) < 1.6) continue; const g = group({ p: [x, 0, z], r: [(R() - .5) * 40, R() * 180, (R() - .5) * 40], parent: FIELD });   // broken spears stuck in the ground
    cylBetween([0, 0, 0], [0, .7 + R() * .6, 0], .018, PM('#6a4a2a'), g, 4); }
  for (let i = 0; i < 7; i++) { const x = (R() - .5) * 11, z = -1 - R() * 8; if (Math.abs(x) < 1.8) continue; const sh = shield(FIELD, [x, .04, z], .34, 0, R() < .5 ? '#b0303a' : '#6a7486', '#9aa0ae'); sh.rotation.set(-Math.PI / 2 + (R() - .5) * .3, 0, R() * 6); }
  for (let i = 0; i < 6; i++) { const m = mesh(new THREE.CircleGeometry(.8 + R() * .9, 20), basic('#2a2228', { transparent: true, opacity: .35, depthWrite: false }), { p: [(R() - .5) * 10, .02, -1 - R() * 9], r: [-90, 0, 0], parent: FIELD, cast: false }); m.userData.noInk = true; } }   // scorch marks
export function armyStandards(k, gone = 0) { FA.standards.forEach((g, i) => { const on = k > .05 && gone < .08; g.visible = on; g.position.set(g.userData.x, 0, -13.6); g.scale.setScalar(Math.max(.001, k)); }); }
{ // WEDDING HALL (the forced engagement): pews for the guests, a flower arch over the altar, rose petals on the carpet, white + gold swags
  for (const s of [-1, 1]) for (let z = 2.6; z >= -8.2; z -= 1.8) { const g = group({ p: [s * 2.7, 0, z], parent: HALL }); mesh(rbox(2.2, .12, .5), PM('#7a4a2e'), { p: [0, .48, 0], parent: g }); mesh(rbox(2.2, .55, .08), PM('#6a3e26'), { p: [0, .8, -.24], parent: g });
    for (const x of [-1.05, 1.05]) mesh(rbox(.08, .5, .5), PM('#5a3420'), { p: [x, .25, 0], parent: g }); mesh(new THREE.SphereGeometry(.13, 8, 6), PM('#f4ecd8'), { p: [-s * 1.1, .95, .05], parent: g }); }
  const ar = group({ p: [0, .9, -11.9], parent: HALL }); mesh(new THREE.TorusGeometry(1.7, .07, 8, 40, Math.PI), PM('#e8e0cc'), { p: [0, 1.4, 0], parent: ar });
  for (let k = 0; k <= 22; k++) { const a = k / 22 * Math.PI, x = Math.cos(a) * 1.7, y = 1.4 + Math.sin(a) * 1.7; mesh(new THREE.SphereGeometry(.13 + (k % 3) * .02, 8, 6), PM(['#f4ecd8', '#e8a0b0', '#f2c94c', '#3e7a4a'][k % 4]), { p: [x, y, .08], parent: ar }); }
  for (const x of [-1.7, 1.7]) cylBetween([x, -.9, 0], [x, 1.4, 0], .06, PM('#e8e0cc'), ar, 6);
  const R = rng(71), pg = new THREE.CircleGeometry(.05, 6), pim = new THREE.InstancedMesh(pg, basic('#e8708a'), 160); for (let i = 0; i < 160; i++) { _p.set((R() - .5) * 1.4, .045, 3 - R() * 13); _q.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, R() * 6)); _s.setScalar(.7 + R() * .8); _m4.compose(_p, _q, _s); pim.setMatrixAt(i, _m4); }
  pim.userData.noInk = true; HALL.add(pim);
  for (let z = 4; z >= -13; z -= 3.4) for (const s of [-1, 1]) { const sw = mesh(new THREE.TorusGeometry(.75, .07, 6, 20, Math.PI), PM('#f4ecd8'), { p: [s * 3.4, 6.1, z - 1.7], r: [0, 90, 180], s: [1, .45, 1], parent: HALL }); mesh(new THREE.SphereGeometry(.16, 8, 6), PM(GOLD), { p: [s * 3.4, 6.1, z], parent: HALL }); } }
{ // BALCONY (the love scene): climbing roses on the pillars and railing
  for (const s of [-1, 1]) for (let k = 0; k < 16; k++) { const a = k * 1.1, y = .2 + k * .3; mesh(new THREE.SphereGeometry(.16, 8, 6), PM('#2f6a3a'), { p: [s * 4.2 + Math.cos(a) * .42, y, 4.0 + Math.sin(a) * .42], parent: BALC }); if (k % 2) mesh(new THREE.SphereGeometry(.09, 8, 6), PM('#d0304a'), { p: [s * 4.2 + Math.cos(a) * .5, y + .05, 4.0 + Math.sin(a) * .5], parent: BALC }); }
  for (let x = -4.4; x <= 4.4; x += .55) { mesh(new THREE.SphereGeometry(.12, 8, 6), PM('#2f6a3a'), { p: [x, 1.12, -2.62], parent: BALC }); if (Math.round(x * 10) % 3 === 0) mesh(new THREE.SphereGeometry(.07, 8, 6), PM('#d0304a'), { p: [x + .05, 1.2, -2.52], parent: BALC }); } }
{ // VILLAGE (a quiet farming village at night): the woodpile stays, plus a plough and a water trough
  woodpile(VILL, [-1, 0, -4.6], 0); mesh(rbox(1.6, .4, .6), PM('#6a4a2a'), { p: [4, .2, -3], parent: VILL }); mesh(rbox(1.5, .05, .5), basic('#4a6a9a'), { p: [4, .38, -3], parent: VILL, cast: false }); }
