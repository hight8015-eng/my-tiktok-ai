
// ======================= "เกมแห่งชีวิต": the wake-up room (z 6..11) + the foggy maze (main corridor along -z) + the finish (z -60) =======================
PRESETS.room = { top: '#1a2050', mid: '#24306a', hor: '#2e3a78', glow: '#5a6ab0', glowAmt: .1, sunDir: [.2, 1, .3], sunC: '#b8c8ff', sunI: 1.1, hemiS: '#9aa8ff', hemiG: '#3a3060', hemiI: 1.9, fog: '#1e2654', fogN: 14, fogF: 40, deep: '#16286a', shallow: '#3d5cb0', glint: '#cfe0ff', glintAmt: 0, stars: 0, moon: 0, cloud: '#4a5aa0' };
PRESETS.maze = { top: '#26306a', mid: '#2e3a78', hor: '#3a4686', glow: '#5a6ab0', glowAmt: .1, sunDir: [.3, 1, .4], sunC: '#aebcff', sunI: 1.3, hemiS: '#a0acff', hemiG: '#3c3466', hemiI: 2.0, fog: '#2a3466', fogN: 2.2, fogF: 11, deep: '#16286a', shallow: '#3d5cb0', glint: '#cfe0ff', glintAmt: 0, stars: 0, moon: 0, cloud: '#4a5aa0' };
PRESETS.finish = { top: '#3a4a9e', mid: '#5a6ac0', hor: '#9ab0ff', glow: '#ffffff', glowAmt: .3, sunDir: [.2, .8, -.6], sunC: '#e8f0ff', sunI: 2.2, hemiS: '#c4ccff', hemiG: '#4c4a7a', hemiI: 2.3, fog: '#4a5aa0', fogN: 6, fogF: 30, deep: '#16286a', shallow: '#3d5cb0', glint: '#cfe0ff', glintAmt: 0, stars: 0, moon: 0, cloud: '#6a7ac0' };
export const MZ = group({ parent: scene }); export const MA = {};
const HW2 = 1.6, WH = 2.6;
{
  const tile = canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#3c4574'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(15,12,30,.55)'; x.lineWidth = 6; x.strokeRect(0, 0, w, h); x.fillStyle = 'rgba(255,255,255,.05)'; x.fillRect(10, 10, w / 2, h / 2); }, { repeat: [120, 120] });
  mesh(new THREE.PlaneGeometry(240, 240), toon('#ffffff', { map: tile }), { r: [-90, 0, 0], p: [0, 0, -30], parent: MZ, cast: false });
  const brick = canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#4d5994'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(18,14,36,.55)'; x.lineWidth = 5; for (let r = 0; r < 4; r++) { x.beginPath(); x.moveTo(0, r * 64); x.lineTo(w, r * 64); x.stroke(); for (let c = 0; c < 3; c++) { const bx = c * 96 + (r % 2) * 48; x.beginPath(); x.moveTo(bx, r * 64); x.lineTo(bx, r * 64 + 64); x.stroke(); } } }, { repeat: [1, 1] });
  const wallM = (len) => { const t = brick.clone(); t.needsUpdate = true; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(len / 1.4, WH / 1.4); return toon('#ffffff', { map: t, unique: true }); };
  const top = toon('#7a86c4');
  const wall = (x0, z0, x1, z1) => { const len = Math.hypot(x1 - x0, z1 - z0), g = group({ p: [(x0 + x1) / 2, 0, (z0 + z1) / 2], parent: MZ }); g.rotation.y = Math.atan2(x1 - x0, z1 - z0); mesh(rbox(.4, WH, len), wallM(len), { p: [0, WH / 2, 0], parent: g }); mesh(rbox(.5, .12, len + .1), top, { p: [0, WH + .06, 0], parent: g, cast: false }); return g; };
  MA.wall = wall;
  // main corridor (x = +-HW2) with side openings, the coin hall z -25..-35 (x = +-4.5)
  const gaps = [-8, -17, -44, -52];
  for (const s of [-1, 1]) {
    let z = 6; const stops = [];
    for (const g of gaps) { stops.push([z, g + 1.3]); z = g - 1.3; } stops.push([z, -60]);
    for (const [a, b] of stops) { if (a > -25 && b < -25) { wall(s * HW2, a, s * HW2, -25); wall(s * HW2, -25, s * 4.5, -25); wall(s * 4.5, -25, s * 4.5, -35); wall(s * 4.5, -35, s * HW2, -35); wall(s * HW2, -35, s * HW2, b); } else wall(s * HW2, a, s * HW2, b); }
    for (const g of gaps) { wall(s * HW2, g + 1.3, s * 9, g + 1.3); wall(s * HW2, g - 1.3, s * 7, g - 1.3); }
  }
  // the outer maze: random blocks so the fog has shapes in it
  { const r = rng(61); for (let i = 0; i < 70; i++) { const x = (r() < .5 ? -1 : 1) * (5 + r() * 25), z = 4 - r() * 66, l = 3 + r() * 6; if (r() < .5) wall(x, z, x, z - l); else wall(x, z, x + l * (x < 0 ? -1 : 1), z); } }
  // ---------- the wake-up room (z 6 .. 11) ----------
  const RW = 2.6; wall(-RW, 6, -RW, 11.2); wall(RW, 6, RW, 11.2); wall(-RW, 11.2, RW, 11.2); wall(-RW, 6, -.75, 6); wall(.75, 6, RW, 6);
  mesh(rbox(5.6, .2, 5.6), toon('#2a3260'), { p: [0, WH + .1, 8.6], parent: MZ, cast: false });
  MA.door = mesh(rbox(1.5, WH, .2), toon('#8a94b8'), { p: [0, WH / 2, 6], parent: MZ }); mesh(rbox(1.7, .2, .5), toon('#c8483a', { emissive: '#c8483a', ei: .4 }), { p: [0, WH + .02, 6], parent: MZ });
  MA.cot = group({ p: [-1.4, 0, 8.8], parent: MZ }); mesh(rbox(1.0, .3, 2.0), toon('#6a6f8a'), { p: [0, .25, 0], parent: MA.cot }); mesh(rbox(.95, .12, 1.95), toon('#c8cce0'), { p: [0, .46, 0], parent: MA.cot }); mesh(rbox(.7, .12, .4), toon('#ffffff'), { p: [0, .56, -.7], parent: MA.cot });
  // ---------- the screen texture (shared by the room screen and the finish screen) ----------
  MA.scrTex = canvasTex(1024, 576, () => { });
  const scrM = basic('#ffffff', { map: MA.scrTex, noInk: true }); scrM.userData.noInk = true;
  const screen = (p, ry, w) => { const g = group({ p, parent: MZ }); g.rotation.y = ry * D2R; mesh(rbox(w + .25, w * .5625 + .25, .14), toon('#1a1a26'), { parent: g }); const m = mesh(new THREE.PlaneGeometry(w, w * .5625), scrM, { p: [0, 0, .08], parent: g, cast: false }); m.userData.noInk = true; const gl = glowSprite('#7ab0ff', w * 2.4, { opacity: .35, fog: false }); gl.position.z = .3; g.add(gl); g.userData.gl = gl; return g; };
  MA.scrRoom = screen([0, 1.65, 11.0], 180, 2.8);
  MA.scrFin = screen([0, 4.2, -63], 0, 4.6); cylBetween([-2.2, 0, -63.1], [-2.2, 3, -63.1], .08, toon('#1a1a26'), MZ, 6); cylBetween([2.2, 0, -63.1], [2.2, 3, -63.1], .08, toon('#1a1a26'), MZ, 6);
  // small corridor screen (the last announcement)
  MA.scrWall = screen([1.38, 1.9, -3.5], -90, 1.1);
  // ---------- finish gate (z -60) ----------
  const chk = canvasTex(512, 64, (x, w, h) => { for (let i = 0; i < 16; i++) for (let j = 0; j < 2; j++) { x.fillStyle = (i + j) % 2 ? '#111' : '#fff'; x.fillRect(i * 32, j * 32, 32, 32); } });
  mesh(new THREE.PlaneGeometry(3.2, .4), toon('#ffffff', { map: chk }), { r: [-90, 0, 0], p: [0, .012, -60], parent: MZ, cast: false });
  MA.gateM = toon('#3ad070', { emissive: '#3ad070', ei: .5, unique: true });
  for (const s of [-1, 1]) mesh(rbox(.3, 3.2, .3), MA.gateM, { p: [s * 1.45, 1.6, -60], parent: MZ });
  const ban = canvasTex(512, 128, (x, w, h) => { x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h); x.fillStyle = '#1a8a46'; x.font = '700 92px Prompt'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('เส้นชัย', w / 2, h / 2 + 4); });
  MA.banner = mesh(rbox(3.2, .7, .12), toon('#ffffff', { map: ban }), { p: [0, 3.0, -60], parent: MZ });
  MA.finGlow = glowSprite('#e8fff0', 14, { opacity: .5, fog: false }); MA.finGlow.position.set(0, 2, -64); MZ.add(MA.finGlow);
}
let _sk2 = ''; const fit = (x, s, max, size, w = 'Prompt') => { let f = size; x.font = `700 ${f}px ${w}`; while (x.measureText(s).width > max && f > 20) { f -= 4; x.font = `700 ${f}px ${w}`; } };
export function drawScreen(mode, n = 0, flick = 0) { // all screen states; redraws only when the key changes
  const key = mode + '|' + n + '|' + (flick > .5 ? 1 : 0); if (key === _sk2) return; _sk2 = key; const x = MA.scrTex.userData.ctx, W = 1024, H = 576;
  const red = mode === 'hunt' || mode === 'silence' || mode === 'next' || mode === 'count';
  x.fillStyle = red ? '#2a0610' : '#081028'; x.fillRect(0, 0, W, H); x.textAlign = 'center'; x.textBaseline = 'middle';
  const line = (s, y, size, col) => { fit(x, s, W - 90, size); x.fillStyle = col; x.fillText(s, W / 2, y); };
  if (mode === 'off') { x.fillStyle = '#05060c'; x.fillRect(0, 0, W, H); }
  else if (mode === 'static') { const r = rng(n + 1); for (let i = 0; i < 1400; i++) { const v = 40 + r() * 200 | 0; x.fillStyle = `rgb(${v},${v},${v + 20})`; x.fillRect(r() * W, r() * H, 6 + r() * 20, 4); } }
  else if (mode === 'logo') { line('เกมแห่งชีวิต', 300, 150, '#ffd84a'); x.strokeStyle = '#ffd84a'; x.lineWidth = 10; x.strokeRect(70, 110, W - 140, 380); }
  else if (mode === 'welcome') { line('ยินดีต้อนรับสู่', 190, 90, '#ffffff'); line('เกมแห่งชีวิต', 340, 150, '#ffd84a'); }
  else if (mode === 'finish24') { line('เดินถึงเส้นชัย', 150, 92, '#ffffff'); x.fillStyle = '#000'; x.fillRect(150, 250, W - 300, 210); line(n > 0 ? '24:00:00' : '24:00:00', 360, 170, '#3ad070'); }
  else if (mode === 'money') { line('เงินรางวัล', 140, 90, '#ffffff'); line('100,000,000', 300, 170, '#ffd84a'); line('บาท', 450, 100, '#ffd84a'); }
  else if (mode === 'coin') { x.fillStyle = '#ffc21a'; x.strokeStyle = '#7a5200'; x.lineWidth = 12; x.beginPath(); x.arc(250, 290, 120, 0, 7); x.fill(); x.stroke(); x.fillStyle = '#7a5200'; x.font = '700 120px Prompt'; x.fillText('฿', 250, 296); fit(x, '+1,000,000', 560, 120); x.fillStyle = '#ffd84a'; x.textAlign = 'left'; x.fillText('+1,000,000', 400, 250); x.fillStyle = '#ffffff'; x.font = '700 80px Prompt'; x.fillText('ต่อเหรียญ', 400, 380); x.textAlign = 'center'; }
  else if (mode === 'silence') { line('ห้ามส่งเสียง', 290, 170, flick > .5 ? '#ff4a4a' : '#ff8a8a'); }
  else if (mode === 'hunt') { line('หากส่งเสียง', 180, 110, '#ffffff'); line('คุณจะถูกล่า', 360, 150, flick > .5 ? '#ff3a3a' : '#ff9a9a'); }
  else if (mode === 'winner') { line('ผู้ชนะ', 200, 170, '#3ad070'); if (n > 0) line('เพียง 1 คน', 400, 120, '#ffffff'); }
  else if (mode === 'prize') { line('100,000,000 บาท', 260, 140, '#ffd84a'); line('เป็นของคุณ', 420, 90, '#ffffff'); }
  else if (mode === 'next') { line('เกมถัดไป', 190, 130, '#ffffff'); line('จะเริ่มใน', 360, 120, '#ff4a4a'); }
  else if (mode === 'count') { line(String(n), 300, 380, '#ff3a3a'); }
  x.fillStyle = 'rgba(255,255,255,.04)'; for (let y = 0; y < H; y += 8) x.fillRect(0, y, W, 3);
  MA.scrTex.needsUpdate = true;
}
export function screenGlow(k, col = '#7ab0ff') { for (const s of [MA.scrRoom, MA.scrFin, MA.scrWall]) { s.userData.gl.material.opacity = .35 * k; s.userData.gl.material.color.set(col); } }
// ---------- instanced coins ----------
MA.coinM = toon('#ffc21a', { emissive: '#ffb000', ei: .55 });
MA.coins = new THREE.InstancedMesh(new THREE.CylinderGeometry(.1, .1, .025, 16), MA.coinM, 300); MA.coins.frustumCulled = false; MA.coins.count = 0; scene.add(MA.coins);
const _M2 = new THREE.Matrix4(), _Q2 = new THREE.Quaternion(), _E2 = new THREE.Euler(), _S2 = new THREE.Vector3(1, 1, 1), _P2 = new THREE.Vector3();
let _cn = 0; export function coinsBegin() { _cn = 0; } export function coinsEnd() { MA.coins.count = _cn; MA.coins.instanceMatrix.needsUpdate = true; }
export function coinAt(x, y, z, rx = 0, rz = 0, ry = 0, s = 1) { if (_cn >= 300) return; _P2.set(x, y, z); _E2.set(rx, ry, rz); _Q2.setFromEuler(_E2); _S2.setScalar(s); _M2.compose(_P2, _Q2, _S2); MA.coins.setMatrixAt(_cn++, _M2); }
export function coinRain(c, t, k = 1, n = 90, w = 3, h = 4, seed = 3) { const r = rng(seed); for (let i = 0; i < n * k; i++) { const x = c[0] + (r() - .5) * w, z = c[2] + (r() - .5) * w * .6, sp = 1.2 + r(), ph = r(); const y = c[1] + h - ((t * sp + ph * h) % h); coinAt(x, y, z, t * 6 + i, t * 4 + i * .3, i); } }
export function coinField(c, n = 14, seed = 7, rad = 1.6) { const r = rng(seed); for (let i = 0; i < n; i++) { const a = r() * 6.28, R = Math.sqrt(r()) * rad; coinAt(c[0] + Math.sin(a) * R, .015, c[2] + Math.cos(a) * R, 0, 0, r() * 6); } }
MA.glints = []; for (let i = 0; i < 6; i++) { const g = glowSprite('#ffe27a', .7, { opacity: 0, fog: true }); scene.add(g); MA.glints.push(g); }
// ---------- shadow creatures ----------
MA.shadows = [];
{ const bm = toon('#141020'), sp = new THREE.ConeGeometry(.12, .45, 6);
  for (let i = 0; i < 4; i++) { const g = group({ parent: scene }); g.visible = false; const body = group({ p: [0, 1.35, 0], parent: g });
    mesh(new THREE.SphereGeometry(.55, 16, 12), bm, { s: [1, 1.2, .9], parent: body });
    for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2, m = mesh(sp, bm, { parent: body }); m.position.set(Math.sin(a) * .5, .25 + Math.cos(a * 2) * .15, Math.cos(a) * .42); m.lookAt(m.position.clone().multiplyScalar(3)); m.rotateX(Math.PI / 2); }
    const eyes = []; for (const s of [-1, 1]) { const e = mesh(new THREE.SphereGeometry(.075, 10, 8), basic('#fff2f2', { noInk: true }), { p: [s * .17, .12, .48], parent: body, cast: false }); e.userData.noInk = true; const gl = glowSprite('#ff3a3a', .7, { opacity: .8, fog: false }); gl.position.copy(e.position); body.add(gl); eyes.push(gl); }
    const limbs = []; for (const [x, y, len, leg] of [[-.25, -.45, 1.0, 1], [.25, -.45, 1.0, 1], [-.5, .0, .95, 0], [.5, .0, .95, 0]]) { const piv = group({ p: [x, y, 0], parent: body }); cylBetween([0, 0, 0], [0, -len, 0], .03, bm, piv, 5); mesh(new THREE.SphereGeometry(.06, 8, 6), bm, { p: [0, -len, 0], parent: piv }); piv.userData.leg = leg; limbs.push(piv); }
    g.userData = { body, eyes, limbs }; MA.shadows.push(g); } }
export function shadowAt(i, p, ry, t, run = 0, o = {}) { const g = MA.shadows[i]; g.visible = true; g.position.set(...p); g.rotation.y = ry * D2R; g.scale.setScalar(o.s ?? 1); const { body, eyes, limbs } = g.userData; const ph = t * (run ? 11 : 3) + i * 1.7;
  body.position.y = 1.35 + Math.abs(Math.sin(ph)) * .12 * run + Math.sin(t * 2 + i) * .04; body.rotation.x = .25 * run; body.rotation.z = Math.sin(ph) * .08;
  limbs.forEach((l, k) => { const s = k % 2 ? 1 : -1; l.rotation.x = (l.userData.leg ? 1 : -1.2) * s * Math.sin(ph) * (.25 + .6 * run); l.rotation.z = l.userData.leg ? 0 : s * .5; });
  eyes.forEach(e => { e.material.opacity = (o.eye ?? 1) * (.7 + .3 * Math.sin(t * 9 + i)); }); }
export function shadowsOff() { MA.shadows.forEach(g => { g.visible = false; }); }
// ---------- props ----------
MA.bags = [0, 1].map(() => { const g = group({ parent: scene }); const m = toon('#c8955a'); const b = mesh(new THREE.SphereGeometry(.3, 14, 10), m, { s: [1, .95, 1], parent: g }); mesh(new THREE.CylinderGeometry(.09, .15, .16, 10), m, { p: [0, .3, 0], parent: g }); for (const [x, z] of [[-.06, .03], [.07, -.03], [0, .08]]) mesh(new THREE.CylinderGeometry(.09, .09, .02, 12), MA.coinM, { p: [x, .4, z], r: [20, 0, 10], parent: g }); g.userData.b = b; return g; });
MA.coin1 = mesh(new THREE.CylinderGeometry(.1, .1, .025, 16), MA.coinM, { parent: scene });
MA.heroLight = pts[1];
export function hideSea2() { sea.visible = false; seaFar.visible = false; WAVE.amp = 0; clouds.visible = false; }
