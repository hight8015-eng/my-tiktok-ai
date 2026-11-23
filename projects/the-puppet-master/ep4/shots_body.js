// ===================================================================== EP 4 "นักล่าที่มองไม่เห็น" (The Invisible Hunter)
// Rules applied from the start (ricksclips/stick-toon measurements + the user's ep3 notes): every shot keeps a slow push-in (PUSH, global in look()),
// camera moves are eased glides, blinks every 0.5-2.3 s (blinkP) instead of idle sway, reactions land 0-3 f before the word, whisper line + text = Aren's POWER only,
// props never block a lens (MIND), characters are placed off every prop footprint, no frozen camera hold >= 12 f.
const NO = () => CHARS.noah, P1 = () => CHARS.p1, P2 = () => CHARS.p2;
const ARX = (z) => ({ p: [0, .18, z], ry: 180 });
/* ---------- FX: rain that parts around an invisible human shape ---------- */
const GAPN = 900, gapG = new THREE.Group(), gapGeo = new THREE.BufferGeometry(), dotGeo = new THREE.BufferGeometry(), gapPos = new Float32Array(GAPN * 6), dotPos = new Float32Array(GAPN * 3);
gapGeo.setAttribute('position', new THREE.BufferAttribute(gapPos, 3)); dotGeo.setAttribute('position', new THREE.BufferAttribute(dotPos, 3));
const gapLines = new THREE.LineSegments(gapGeo, new THREE.LineBasicMaterial({ color: '#c4d8ff', transparent: true, opacity: .5, depthWrite: false, blending: THREE.AdditiveBlending }));
const gapDots = new THREE.Points(dotGeo, new THREE.PointsMaterial({ color: '#f0f6ff', size: .055, transparent: true, opacity: .95, depthWrite: false, blending: THREE.AdditiveBlending }));
[gapLines, gapDots].forEach(m => { m.frustumCulled = false; m.userData.noInk = true; gapG.add(m); });
const gapTex = canvasTex(256, 512, (x, w, h) => { x.clearRect(0, 0, w, h); x.lineJoin = 'round'; x.lineCap = 'round'; x.strokeStyle = 'rgba(210,228,255,.9)'; x.lineWidth = 5; x.shadowColor = '#9fc4ff'; x.shadowBlur = 14;
  x.beginPath(); x.arc(128, 70, 34, 0, 7); x.stroke(); x.beginPath(); x.moveTo(60, 190); x.quadraticCurveTo(70, 118, 128, 112); x.quadraticCurveTo(186, 118, 196, 190); x.lineTo(184, 330); x.lineTo(168, 480); x.moveTo(72, 330); x.lineTo(88, 480); x.moveTo(60, 190); x.lineTo(72, 330); x.moveTo(196, 190); x.lineTo(184, 330); x.stroke(); });
const gapOutline = mesh(new THREE.PlaneGeometry(.95, 1.9), basic('#ffffff', { transparent: true, opacity: 0, map: gapTex, depthWrite: false }), { parent: gapG, cast: false }); gapOutline.renderOrder = 6; gapOutline.userData.noInk = true;
gapG.visible = false;
function gapAt(set, x, z, k, t, h = 1.75) {
  if (gapG.parent !== set) set.add(gapG);
  gapG.visible = k > .01; if (!gapG.visible) return; gapG.position.set(x, 0, z);
  const R = .3 * k, RH = .17 * k; let n = 0, m = 0;
  for (let i = 0; i < GAPN; i++) {
    const a = hs(i * 1.7 + 3), b = hs(i * 3.1 + 7), c = hs(i * 5.3 + 11), px = (a - .5) * 3.6, pz = (b - .5) * 3.6, sp = 11 + c * 4, top = 6.2;
    const y0 = (((c * 9 - t * sp) % top) + top) % top, y1 = y0 + .5, r = Math.hypot(px, pz), surf = r < RH ? (h + .03) * k : r < R ? 1.45 * k : 0;
    if (surf > 0) { if (y0 < surf + .02) { if (y1 > surf - .08 && y0 < surf + .6 && m < GAPN) { dotPos.set([px, surf, pz], m * 3); m++; } continue; } }
    gapPos.set([px, y0, pz, px, y1, pz], n * 6); n++;
  }
  gapGeo.setDrawRange(0, n * 2); gapGeo.attributes.position.needsUpdate = true; dotGeo.setDrawRange(0, m); dotGeo.attributes.position.needsUpdate = true;
  gapOutline.position.set(0, h * .5, 0); gapOutline.quaternion.copy(camera.quaternion); gapOutline.material.opacity = .26 * k;
}
const gapPoint = (set, x, z, up = 1.62) => { set.updateMatrixWorld(); return set.localToWorld(V(x, up, z)); };
/* a sprite character that fades in / out (Noah appears and vanishes in the rain) */
function setAlpha(C, a) { const L = []; C.g.traverse(o => { if (o.material) L.push(o); }); [C.sb, C.sh].forEach(o => { if (o && o.material) L.push(o); });
  for (const o of L) for (const m of [].concat(o.material)) { m.transparent = true; m.opacity = a; m.depthWrite = a > .98; m.needsUpdate = true; } }
/* ---------- props ---------- */
const KNIFE = group({ parent: scene }); mesh(new THREE.BoxGeometry(.03, .012, .26), basic('#eef4ff'), { p: [0, 0, .13], parent: KNIFE, cast: false }); mesh(new THREE.BoxGeometry(.036, .034, .11), basic('#241c26'), { p: [0, 0, -.055], parent: KNIFE, cast: false }); KNIFE.visible = false;
const KTRAIL = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3)), new THREE.LineBasicMaterial({ color: '#dfeaff', transparent: true, opacity: .7, depthWrite: false, blending: THREE.AdditiveBlending })); KTRAIL.frustumCulled = false; KTRAIL.visible = false; scene.add(KTRAIL);
const BAG = group({ parent: scene }); mesh(rbox(.46, .22, .3), toon('#5a3e28'), { p: [0, .11, 0], parent: BAG }); const BAGLID = group({ p: [0, .22, -.15], parent: BAG }); mesh(rbox(.46, .05, .32), toon('#6e4a30'), { p: [0, .02, .16], parent: BAGLID }); BAG.visible = false;
const docTex = (fn, w = 1024, h = 1448) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); fn(x, w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
const CONTRACT_LINE = 'เมื่องานสำเร็จ ให้กำจัดมือสังหารทิ้ง';
const CONTRACT = mesh(new THREE.PlaneGeometry(.42, .594), basic('#ffffff', { map: docTex((x, w, h) => { x.fillStyle = '#f2ecdc'; x.fillRect(0, 0, w, h); x.fillStyle = '#2a2230'; x.textAlign = 'center'; x.font = '700 64px Prompt'; x.fillText('สัญญาจ้างงาน', w / 2, 130);
  x.textAlign = 'left'; x.font = '500 40px Prompt'; ['ผู้ว่าจ้าง : วิกเตอร์', 'เป้าหมาย : นักโทษหมายเลข 047', 'ผู้รับงาน : โนอาห์', 'ค่าตอบแทน : 5,000,000', 'ระยะเวลา : ภายในคืนนี้'].forEach((s, i) => x.fillText(s, 90, 270 + i * 92));
  x.strokeStyle = '#2a2230'; x.lineWidth = 3; for (let i = 0; i < 6; i++) { x.beginPath(); x.moveTo(90, 760 + i * 56); x.lineTo(w - 90, 760 + i * 56); x.stroke(); }
  x.font = '700 38px Prompt'; x.fillText('ลงชื่อ  ________', 90, 1180); x.font = '400 17px Prompt'; x.fillStyle = '#6a6070'; x.fillText(CONTRACT_LINE, 90, 1366); }) }), { parent: scene, cast: false }); CONTRACT.visible = false;
const SEALP = mesh(new THREE.PlaneGeometry(.3, .4), basic('#ffffff', { map: docTex((x, w, h) => { x.fillStyle = '#efe6d2'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(60,40,30,.25)'; x.lineWidth = 2; for (let i = 0; i < 9; i++) { x.beginPath(); x.moveTo(60, 120 + i * 40); x.lineTo(w - 60, 120 + i * 40); x.stroke(); }
  x.save(); x.translate(w / 2, h * .56); x.rotate(-.16); x.strokeStyle = '#8a1c34'; x.fillStyle = '#8a1c34'; x.lineWidth = 12; x.beginPath(); x.arc(0, 0, 230, 0, 7); x.stroke(); x.beginPath(); x.arc(0, 0, 196, 0, 7); x.lineWidth = 5; x.stroke();
  x.beginPath(); x.moveTo(-120, -20); x.quadraticCurveTo(0, -120, 120, -20); x.quadraticCurveTo(0, 70, -120, -20); x.lineWidth = 12; x.stroke(); x.beginPath(); x.arc(0, -22, 40, 0, 7); x.fill(); x.fillStyle = '#efe6d2'; x.beginPath(); x.arc(0, -22, 14, 0, 7); x.fill();
  x.fillStyle = '#8a1c34'; x.beginPath(); x.moveTo(-34, 70); x.lineTo(34, 70); x.lineTo(18, 180); x.lineTo(-18, 180); x.closePath(); x.fill(); x.restore(); }, 768, 1024) }), { parent: scene, cast: false }); SEALP.visible = false;
const POSTER = group({ parent: STREET, p: [-1.55, .18, -9.1] }); mesh(rbox(.1, 2.3, .1), toon('#2a2430'), { p: [-.6, 1.15, 0], parent: POSTER }); mesh(rbox(.1, 2.3, .1), toon('#2a2430'), { p: [.6, 1.15, 0], parent: POSTER });
mesh(new THREE.PlaneGeometry(1.12, 1.52), basic('#ffffff', { map: docTex((x, w, h) => { x.fillStyle = '#e9dcc0'; x.fillRect(0, 0, w, h); x.fillStyle = '#7a1424'; x.fillRect(0, 0, w, 150); x.fillStyle = '#fff'; x.textAlign = 'center'; x.font = '800 100px Prompt'; x.fillText('ค่าหัว', w / 2, 112);
  x.fillStyle = '#14101c'; x.beginPath(); x.arc(w / 2, 480, 190, 0, 7); x.fill(); x.fillStyle = '#16131d'; for (let i = 0; i < 11; i++) { const a = -3.1 + i * .62; x.beginPath(); x.moveTo(w / 2 + Math.cos(a) * 150, 480 + Math.sin(a) * 150); x.lineTo(w / 2 + Math.cos(a + .12) * 250, 480 + Math.sin(a + .12) * 250); x.lineTo(w / 2 + Math.cos(a + .28) * 150, 480 + Math.sin(a + .28) * 150); x.fill(); }
  x.fillStyle = '#f4efe4'; x.beginPath(); x.ellipse(w / 2, 520, 128, 118, 0, 0, 7); x.fill(); x.fillStyle = '#16131d'; x.fillRect(w / 2 - 70, 515, 34, 10); x.fillRect(w / 2 + 36, 515, 34, 10);
  x.fillStyle = '#2a2230'; x.font = '800 84px Prompt'; x.fillText('หมายเลข 047', w / 2, 800); x.fillStyle = '#7a1424'; x.font = '800 120px Prompt'; x.fillText('5,000,000', w / 2, 930); x.font = '600 50px Prompt'; x.fillStyle = '#2a2230'; x.fillText('ใครจับตัวได้ — วิกเตอร์จ่ายเอง', w / 2, 1010); }, 768, 1040) }), { p: [0, 1.62, .06], parent: POSTER, cast: false }); POSTER.visible = false;
const TOWER = group({ parent: STREET, p: [14, 0, -70] }); mesh(new THREE.BoxGeometry(7, 64, 7), toon('#17122a'), { p: [0, 32, 0], parent: TOWER, cast: false }); mesh(new THREE.BoxGeometry(9, 3, 9), toon('#241a3c'), { p: [0, 61, 0], parent: TOWER, cast: false });
const EYEM = mesh(new THREE.PlaneGeometry(9, 5.4), basic('#ffffff', { transparent: true, fog: false, map: docTex((x, w, h) => { x.clearRect(0, 0, w, h); x.shadowColor = '#ff2a3a'; x.shadowBlur = 40; x.fillStyle = '#ff2a3a'; x.beginPath(); x.moveTo(30, h / 2); x.quadraticCurveTo(w / 2, -60, w - 30, h / 2); x.quadraticCurveTo(w / 2, h + 60, 30, h / 2); x.fill(); x.shadowBlur = 0; x.fillStyle = '#ffd8c0'; x.beginPath(); x.arc(w / 2, h / 2, h * .26, 0, 7); x.fill(); x.fillStyle = '#18060a'; x.beginPath(); x.ellipse(w / 2, h / 2, h * .09, h * .24, 0, 0, 7); x.fill(); }, 512, 308) }), { p: [0, 58, 3.6], parent: TOWER, cast: false }); EYEM.renderOrder = 4;
const EYEG = Wd.glowSprite('#ff2a3a', 16, { opacity: .55 }); EYEG.position.set(14, 58, -66); STREET.add(EYEG); TOWER.visible = false; EYEG.visible = false;
const RIPN = 8, RIPS = Array.from({ length: RIPN }, () => { const m = mesh(new THREE.RingGeometry(.9, 1, 28), basic('#cfe0ff', { transparent: true, opacity: 0, depthWrite: false }), { parent: STREET, r: [-90, 0, 0], cast: false }); m.visible = false; m.userData.noInk = true; return m; });
const POLE = mesh(rbox(.28, 2.8, .28), toon('#3a2c24'), { p: [.1, 1.58, -5.9], parent: STREET, cast: false }); POLE.visible = false;   // the post the knife sticks into
function p4reset() { scene.updateMatrixWorld(true); POLE.visible = false; gapG.visible = false; KNIFE.visible = false; KTRAIL.visible = false; BAG.visible = false; CONTRACT.visible = false; SEALP.visible = false; POSTER.visible = false; TOWER.visible = false; EYEG.visible = false; RIPS.forEach(m => { m.visible = false; });
  for (const C of Object.values(CHARS)) setAlpha(C, 1); }
function ripples(set, t, stepRate, zAt, xAt = () => 0) {   // an expanding ring at every heel strike of a walker (soft puddle ripples)
  let i = 0; const k1 = Math.floor(t * 2 * stepRate - .5);
  for (let k = k1; k > k1 - 4; k--) { const ts = (k + .5) / (2 * stepRate), age = t - ts; if (age < 0 || age > .9 || i >= RIPN) continue; const m = RIPS[i++]; if (m.parent !== set) set.add(m); m.visible = true; const s = .12 + age * .75; m.scale.set(s, s, 1); m.position.set(xAt(ts) + (k % 2 ? -.13 : .13), .215, zAt(ts)); m.material.opacity = .55 * (1 - age / .9) ** 1.5; }
}
const kn = (A, B, u) => A.map((v, i) => v + (B[i] - v) * u);
const clearSets = () => { };
// -------------------------------------------------------------------- shots
const SZ4 = (t) => -9 - Math.max(0, t - 4.36) * 1.35;            // Aren walks away along the street in the gossip beat
const HOME = (t) => -2.0 - Math.max(0, t - 27.94) * .94;         // the walk home (27.94 ...), slow and quiet; he stops at 36.5 (z -10)
const hz = (t) => Math.min(HOME(36.5), HOME(t));
const NZ = -15.2;                                                // the invisible hunter's spot, ahead of Aren
// ---- 0 hook: "คืนนี้มีคนรับงานฆ่าผม… และผมมองไม่เห็นเขา" : Aren, a rain gap forming out of focus behind him
S('N01', 0, 'cut', STREET, (lt, t) => { p4reset(); streetLight(lt); MIND = 2.4; put(AR(), STREET, { p: [0, .18, -9.6], ...turn(lt, 2.4, .7, 12, -22), ex: pf(lt, [[0, 'calm'], [2.2, 'suspicious']]).ex, head: [0, 0, 0] });
  gapAt(STREET, 1.5, -13.8, .12 + .5 * U(lt - 2.4, 1.4), t); camS([.55, 1.5, -6.7], [0, 1.55, -9.6], [.3, 1.55, -6.3], [0, 1.58, -9.6], U(lt, 4.3), 40); });
// ---- "หลังจากคืนนั้น … ชื่อของผมเริ่มถูกพูดถึงในหมู่นักโทษ" : prisoners talk, Aren walks away in the distance
S('N02', 4.36, 'blur', STREET, (lt, t) => { p4reset(); streetLight(lt); MIND = 2.6; put(P1(), STREET, { p: [-3.3, .18, -8.2], ry: 50, ...perform(lt, [[0, 'whisper'], [2.5, 'point']], { seed: 3 }) }); put(P2(), STREET, { p: [-1.8, .18, -8.4], ry: -40, ...perform(lt, [[0, 'neutral'], [1.2, 'thinking'], [3.8, 'shrug']], { seed: 4 }) });
  put(AR(), STREET, { p: [1.6, .18, SZ4(t)], ry: 180, ex: 'stoic', ...walk(t, 1.3, .2) }); camS([2.8, 1.7, -3.8], [-1.6, 1.5, -10], [2.3, 1.7, -4.2], [-1.8, 1.5, -10.4], U(lt, 5.6), 44); });
// ---- "บางคนบอกว่าผมเป็นนักเจรจา บางคนบอกว่าผมเป็นสายลับ" (typed labels carry the two guesses)
S('N03', 9.96, 'cut', STREET, (lt, t) => { p4reset(); streetLight(lt); MIND = 2.6; put(P1(), STREET, { p: [-.8, .18, -9.6], ry: 70, ...perform(lt, [[0, 'whisper', { ex: 'suspicious' }], [2.3, 'accuse', { ex: 'smug' }]], { seed: 3 }) });
  put(P2(), STREET, { p: [.8, .18, -9.6], ry: -70, ...perform(lt, [[0, 'thinking'], [2.3, 'handsBehind', { ex: 'skeptical' }]], { seed: 4 }) }); camS([-.2, 1.55, -5.7], [0, 1.6, -9.6], [.1, 1.55, -5.4], [0, 1.6, -9.6], U(lt, 4.7), 46); });
// ---- "แต่สำหรับวิกเตอร์… ผมคือคนที่อันตรายเกินกว่าจะปล่อยไว้" : Victor on his dais
S('N04', 14.68, 'blur', WAREHOUSE, (lt, t) => { p4reset(); whLight(); MIND = 2.4; put(VI(), WAREHOUSE, { p: [0, .4, -8.4], ry: 0, ...perform(lt, [[0, 'armsCrossed', { ex: 'stoic' }], [1.9, 'fists', { ex: 'glare' }]], { seed: 5 }), talk: 0 });
  camW([1.2, 1.9, -4.5], [0, 2.0, -8.4], [.7, 1.9, -4.9], [0, 2.1, -8.4], U(lt, 4.2), 42); wEnd(t, 0); }, { rain: false });
// ---- "เขาตั้งค่าหัวผม และคนที่รับงาน คือโนอาห์" : the bounty poster (power-red price), then Noah's name
S('N05', 18.92, 'cut', STREET, (lt, t) => { p4reset(); streetLight(lt); MIND = 0; POSTER.visible = true; lightAt(STREET.localToWorld(V(-1.0, 2.6, -7.6)), '#ffd8b0', 3.2, 4);
  camS([-.6, 1.72, -6.4], [-1.55, 1.78, -9.1], [-1.1, 1.74, -6.0], [-1.55, 1.78, -9.1], U(lt, 2.6), 40); });
// ---- "มือสังหารที่ล่องหนได้" : on the rooftop a rain-shaped figure stands at the parapet looking down on the street
S('N06', 21.3, 'blur', ROOF, (lt, t) => { p4reset(); alleyLight(); setRig(RIGS.alley); MIND = 2.6; gapAt(ZC.ROOF, 0, -6.2, .35 + .65 * U(lt, 1.4), t); lightAt(ZC.ROOF.localToWorld(V(2.2, 1.9, -4.8)), '#ff2a3a', 1.1, 2.4);
  camR([2.6, 1.5, -2.6], [0, 1.55, -6.2], [1.7, 1.55, -3.2], [0, 1.65, -6.2], U(lt, 3.7), 42); });
// ---- "ไม่เคยมีใครเห็นหน้าเขา แล้วรอดกลับมา" : a dropped hat on the wet street; rain parts as something steps over it
S('N07', 24.98, 'cut', STREET, (lt, t) => { p4reset(); streetLight(lt); MIND = 0; mesh(new THREE.CylinderGeometry(.16, .2, .1, 18), toon('#3a3a44'), { p: [0, .24, -9], parent: STREET, cast: false }); gapAt(STREET, .15 + .5 * U(lt, 1.6, eIO), -10.4, .85, t);
  camS([.3, .7, -6.2], [0, .6, -9.4], [.15, .75, -6.0], [0, .75, -9.8], U(lt, 3.0), 38); });
// ---- "คืนนั้น ผมเดินกลับที่พักตามปกติ" : Aren walks home (place label)
S('N08', 27.94, 'blur', STREET, (lt, t) => { p4reset(); streetLight(lt); MIND = 2.6; put(AR(), STREET, { p: [0, .18, hz(t)], ry: 180, ex: 'calm', ...walk(t, .95, .18) }); camS([1.5, 1.75, hz(t) + 3.8], [0, 1.55, hz(t) - 1.0], [1.35, 1.75, hz(t) + 3.5], [0, 1.58, hz(t) - 1.0], U(lt, 2.8), 44); });
// ---- "ไม่มีเสียงฝีเท้า ไม่มีเงา" : low shot, ripples under Aren's steps, none behind him
S('N09', 30.78, 'cut', STREET, (lt, t) => { p4reset(); streetLight(lt); MIND = 0; put(AR(), STREET, { p: [0, .18, hz(t)], ry: 180, ex: 'calm', ...walk(t, .95, .18) }); ripples(STREET, t, .95, (ts) => hz(ts));
  camS([.9, .55, hz(t) + 2.4], [0, .35, hz(t) - 1.2], [.7, .5, hz(t) + 2.2], [0, .45, hz(t) - 1.2], U(lt, 2.6), 36); });
// ---- "แต่สายฝนตรงหน้า แหวกออกเป็นรูปคน" : the rain ahead of him parts into a human shape
S('N10', 33.36, 'cut', STREET, (lt, t) => { p4reset(); streetLight(lt); MIND = 2.6; put(AR(), STREET, { p: [0, .18, hz(t)], ry: 180, ex: 'suspicious', ...walk(t, .95, .18 * (1 - U(lt - 2.7, .4))) }); gapAt(STREET, .05, NZ, U(lt - .3, 2.0, eIO), t);
  camS([1.3, 1.6, hz(t) + 3.2], [.1, 1.55, NZ + 2], [1.1, 1.55, hz(t) + 3.0], [.05, 1.6, NZ + 1], U(lt, 3.2), 40); });
// ---- "ผมหยุดเดิน" : he freezes (only the camera moves)
S('N11', 36.5, 'cut', STREET, (lt, t) => { p4reset(); streetLight(lt); MIND = 2.4; put(AR(), STREET, { p: [0, .18, HOME(36.5)], ry: 180, ...perform(lt, [[0, 'frozen']], { seed: 1 }), ex: 'realize', still: true }); gapAt(STREET, .05, NZ, 1, t);
  camS([.7, 1.65, HOME(36.5) + 2.6], [0, 1.6, HOME(36.5)], [.45, 1.65, HOME(36.5) + 2.3], [0, 1.6, HOME(36.5)], U(lt, 1.3), 38); });
// ---- "เสี้ยววินาทีต่อมา มีดเล่มหนึ่ง" : the knife leaves the gap (trail)
const KA = [.1, 1.55, NZ], KB = [-.1, 1.52, HOME(36.5) - .15];
S('N12', 37.76, 'cut', STREET, (lt, t) => { p4reset(); POLE.visible = true; streetLight(lt); MIND = 2.4; put(AR(), STREET, { p: [0, .18, HOME(36.5)], ry: 180, ex: 'stoic', ...perform(lt, [[0, 'frozen']], { seed: 1 }), still: true }); gapAt(STREET, .05, NZ, 1, t);
  const u = clamp((lt - .55) / 1.6); KNIFE.visible = u > 0; if (u > 0) { const q = kn(KA, KB, eIn(u)); KNIFE.position.copy(STREET.localToWorld(V(...q))); KNIFE.lookAt(STREET.localToWorld(V(...KB))); KNIFE.rotateZ(u * 40);
    const tl = STREET.localToWorld(V(...kn(KA, KB, Math.max(0, eIn(u) - .1)))); const ar = KTRAIL.geometry.attributes.position; ar.set([tl.x, tl.y, tl.z, KNIFE.position.x, KNIFE.position.y, KNIFE.position.z]); ar.needsUpdate = true; KTRAIL.visible = true; }
  camS([-1.0, 1.55, HOME(36.5) - 3.2], [0, 1.55, NZ + 2], [-.8, 1.55, HOME(36.5) - 3.0], [0, 1.52, HOME(36.5) + .8], U(lt, 2.2), 40); });
// ---- "พุ่งผ่านตรงที่คอผมเคยอยู่" : he leans his head aside (anticipation 3 f), the knife passes where his neck was and sticks in the wall behind
const KW = [.1, 1.5, -5.9 - .14];
S('N13', 39.94, 'cut', STREET, (lt, t) => { p4reset(); POLE.visible = true; streetLight(lt); MIND = 0; const lean = backOut(clamp((lt - .5) / .22));
  put(AR(), STREET, { p: [0, .18, HOME(36.5)], ry: 150, ex: 'stoic', head: [0, 0, -16 * lean], side: -7 * lean, still: true }); const u = clamp((lt - .55) / .5);
  KNIFE.visible = true; const q = kn([0, 1.52, HOME(36.5) - 1.6], KW, eIn(u)); KNIFE.position.copy(STREET.localToWorld(V(...q))); KNIFE.lookAt(STREET.localToWorld(V(...KW))); KNIFE.rotateZ(1.4 + (u >= 1 ? Math.sin((lt - 1.05) * 40) * .08 * Math.exp(-(lt - 1.05) * 5) : u * 20));
  if (u > 0 && u < 1) { const tl = STREET.localToWorld(V(...kn([0, 1.52, HOME(36.5) - 1.6], KW, Math.max(0, eIn(u) - .18)))); const ar = KTRAIL.geometry.attributes.position; ar.set([tl.x, tl.y, tl.z, KNIFE.position.x, KNIFE.position.y, KNIFE.position.z]); ar.needsUpdate = true; KTRAIL.visible = true; }
  if (lt > 1.05 && lt < 1.7) dustAt(STREET.localToWorld(V(...KW)), (lt - 1.05) / .65, .9);
  camS([1.9, 1.5, HOME(36.5) + 1.2], [0, 1.5, HOME(36.5) + 2.0], [1.6, 1.5, HOME(36.5) + 1.5], [0, 1.5, HOME(36.5) + 2.4], U(lt, 1.9), 36); });
// ---- "ผมไม่ได้ตกใจ เพราะผมรู้ว่าเขาต้องมา" : Aren calm, a blink (the knife stays in the wall)
S('N14', 42.28, 'cut', STREET, (lt, t) => { p4reset(); streetLight(lt); MIND = 2.2; put(AR(), STREET, { p: [0, .18, HOME(36.5)], ry: 20, ...exShift(lt, 1.7, 'calm', 'sly'), head: [0, 0, 0] }); gapAt(STREET, .05, NZ, 1, t);
  camS([.6, 1.55, HOME(36.5) + 2.5], [0, 1.58, HOME(36.5)], [.35, 1.58, HOME(36.5) + 2.1], [0, 1.6, HOME(36.5)], U(lt, 3.2), 38); });
// ---- "ถ้าคุณฆ่าผมตอนนี้ คุณจะไม่ได้เงินรางวัล" : he speaks to the dark (Aren faces the gap)
S('N15', 45.64, 'cut', STREET, (lt, t) => { p4reset(); streetLight(lt); MIND = 2.4; put(AR(), STREET, { p: [0, .18, HOME(36.5)], ry: 175, ex: 'calm', talk: talkAt(t) }); gapAt(STREET, .05, NZ, 1, t);
  camS([1.2, 1.6, HOME(36.5) + 2.8], [0, 1.58, HOME(36.5) - 1.8], [.9, 1.6, HOME(36.5) + 2.6], [0, 1.6, HOME(36.5) - 2.4], U(lt, 3.0), 42); });
// ---- "เสียงหนึ่งดังจากความมืด" : the dark end of the street, the rain-shaped figure and two cold glints
S('N16', 49.0, 'cut', STREET, (lt, t) => { p4reset(); streetLight(lt); MIND = 2.6; gapAt(STREET, .05, NZ, 1, t); lightAt(STREET.localToWorld(V(.05, 1.7, NZ + .6)), '#9fb0ff', .5, 2.2);
  camS([-.5, 1.45, NZ + 5.2], [.05, 1.6, NZ], [-.3, 1.5, NZ + 4.4], [.05, 1.62, NZ], U(lt, 2.9), 40); });
// ---- "ผมส่งความคิดเข้าไปหนึ่งประโยค" : the POWER: Aren's face, red rim, the world drains (mono), the whisper line + text go to the hunter's head
S('N17', 51.9, 'cut', STREET, (lt, t) => { p4reset(); streetLight(lt); MIND = 2.2; const k = U(lt - .1, 1.0); mono(k); put(AR(), STREET, { p: [0, .18, HOME(36.5)], ry: 160, ex: 'focused', ...(lt > .8 ? { head: [-3, 0, 0] } : {}), still: true }); gapAt(STREET, .05, NZ, 1, t);
  scribbleAt(AR(), (lt - 1.0) / .5, .14); camS([.5, 1.6, HOME(36.5) + 2.0], [0, 1.62, HOME(36.5)], [.3, 1.62, HOME(36.5) + 1.7], [0, 1.64, HOME(36.5)], U(lt, 1.8), 34); });
S('N18', 54.12, 'cut', STREET, (lt, t) => { p4reset(); streetLight(lt); MIND = 2.4; mono(1); put(AR(), STREET, { p: [0, .18, HOME(36.5)], ry: 175, ex: 'focused', still: true }); gapAt(STREET, .05, NZ, 1, t);
  whisperAt(headW(AR(), .38), gapPoint(STREET, .05, NZ, 1.78), 'ลองเปิดดูสัญญาในกระเป๋า… อ่านให้จบทุกบรรทัด', clamp((lt - .05) / 3.2), t, { fs: 52, dy: 240 });
  camS([1.0, 1.55, HOME(36.5) + 1.8], [0, 1.6, HOME(36.5) - 2.2], [.8, 1.58, HOME(36.5) + 1.5], [0, 1.64, NZ + 3], U(lt, 3.7), 42); });
// ---- "โนอาห์ปรากฏตัวขึ้นช้า ๆ" : Noah fades in out of the rain (the gap fills with him)
S('N19', 57.82, 'cut', STREET, (lt, t) => { p4reset(); streetLight(lt); MIND = 2.4; const a = U(lt, 1.6, eIO); put(NO(), STREET, { p: [.05, .18, NZ], ry: 0, ex: 'stoic', ...perform(lt, [[0, 'handsBehind']], { seed: 9 }) }); setAlpha(NO(), a); gapAt(STREET, .05, NZ, 1 - a, t);
  camS([.9, 1.55, NZ + 3.4], [.05, 1.5, NZ], [.5, 1.52, NZ + 2.8], [.05, 1.5, NZ], U(lt, 2.2), 40); });
// ---- "เขาก้มลงเปิดกระเป๋าโดยไม่รู้ตัว" : Noah crouches over the bag and opens it (sprite stays 2D: lean + crouch)
S('N20', 59.98, 'cut', STREET, (lt, t) => { p4reset(); streetLight(lt); MIND = 2.0; const d = U(lt - .15, 1.2, eIO); put(NO(), STREET, { p: [.05, .18, NZ], ry: 0, ex: pf(lt, [[0, 'stoic'], [1.0, 'dazed']]).ex, lean: 18 * d, hipY: -.1 * d, head: [14 * d, 0, 0], hR: lp([.3, .26, .07], [.18, .12, .5], d), hL: lp([-.3, .26, .07], [-.16, .12, .5], d) });
  BAG.visible = true; BAG.position.copy(STREET.localToWorld(V(.05, .18, NZ + .55))); BAGLID.rotation.x = -1.7 * U(lt - 1.0, .7); camS([.5, 1.2, NZ + 2.4], [.05, 1.0, NZ + .3], [.3, 1.1, NZ + 2.0], [.05, .95, NZ + .3], U(lt, 2.3), 38); });
// ---- "ในสัญญาจ้างฆ่าผม" : the contract (insert)
S('N21', 62.62, 'cut', STREET, (lt, t) => { p4reset(); streetLight(lt); MIND = 0; CONTRACT.visible = true; CONTRACT.position.copy(STREET.localToWorld(V(0, 1.4, -6.6))); CONTRACT.quaternion.copy(camera.quaternion); lightAt(STREET.localToWorld(V(.3, 2.2, -5.6)), '#fff0d8', 2.4, 3);
  camS([0, 1.4, -5.9], [0, 1.4, -6.6], [.01, 1.42, -6.15], [0, 1.4, -6.6], U(lt, 1.5), 40); CONTRACT.quaternion.copy(camera.quaternion); });
// ---- "มีบรรทัดสุดท้ายที่ตัวเล็กมาก" : push down to the tiny last line (red ring = power)
S('N22', 64.22, 'cut', STREET, (lt, t) => { p4reset(); streetLight(lt); MIND = 0; CONTRACT.visible = true; CONTRACT.position.copy(STREET.localToWorld(V(0, 1.4, -6.6))); lightAt(STREET.localToWorld(V(.3, 2.2, -5.6)), '#fff0d8', 2.4, 3);
  const u = U(lt, 1.6, eIO); camS([0, 1.4, -6.1], [0, 1.4, -6.6], [0, 1.2, -6.37], [0, 1.148, -6.6], u, 34 - 8 * u); CONTRACT.quaternion.copy(camera.quaternion); });
// ---- "เมื่องานสำเร็จ ให้กำจัดมือสังหารทิ้ง" : the line, big, then Noah's reaction
S('N23', 66.5, 'cut', STREET, (lt, t) => { p4reset(); streetLight(lt); MIND = 0; const show = lt < 1.9; CONTRACT.visible = show; CONTRACT.position.copy(STREET.localToWorld(V(0, 1.4, -6.6))); lightAt(STREET.localToWorld(V(.3, 2.2, -5.6)), '#fff0d8', 2.4, 3);
  if (show) { camS([0, 1.17, -6.34], [0, 1.148, -6.6], [0, 1.16, -6.3], [0, 1.148, -6.6], U(lt, 1.9), 26); CONTRACT.quaternion.copy(camera.quaternion); }
  else { MIND = 2.0; put(NO(), STREET, { p: [.05, .18, NZ], ry: 0, ...perform(lt - 1.9, [[0, 'stoic'], [.35, 'gasp', { ex: 'terror' }]], { seed: 9 }) }); camS([.4, 1.55, NZ + 2.6], [.05, 1.62, NZ], [.2, 1.58, NZ + 2.2], [.05, 1.64, NZ], U(lt - 1.9, 1.0), 34); } });
// ---- "ผมไม่ได้เขียนมัน" / "ผมแค่ทำให้เขาอยากอ่านให้จบ" : Aren, deadpan then sly
S('N24', 69.76, 'cut', STREET, (lt, t) => { p4reset(); streetLight(lt); MIND = 2.2; mono(.6); put(AR(), STREET, { p: [0, .18, HOME(36.5)], ry: 10, ex: 'stoic', head: [0, 0, 0] }); camS([.5, 1.58, HOME(36.5) + 2.4], [0, 1.6, HOME(36.5)], [.3, 1.6, HOME(36.5) + 2.1], [0, 1.62, HOME(36.5)], U(lt, 1.4), 36); });
S('N25', 71.06, 'cut', STREET, (lt, t) => { p4reset(); streetLight(lt); MIND = 2.2; mono(.6); put(AR(), STREET, { p: [0, .18, HOME(36.5)], ry: -12, ...exShift(lt, .5, 'stoic', 'sly') }); camS([-.5, 1.58, HOME(36.5) + 2.4], [0, 1.6, HOME(36.5)], [-.3, 1.6, HOME(36.5) + 2.0], [0, 1.62, HOME(36.5)], U(lt, 1.7), 36); });
// ---- "ผมไม่ได้ต้องการลูกน้อง / ผมต้องการแค่คนที่ไม่คิดจะฆ่าผม" : both men in frame, then Aren close (talking)
S('N26', 73.02, 'cut', STREET, (lt, t) => { p4reset(); streetLight(lt); MIND = 2.6; setRig(RIGS.street); put(AR(), STREET, { p: [-.7, .18, -10.4], ry: 25, ex: 'calm', talk: talkAt(t) }); put(NO(), STREET, { p: [.9, .18, -11.2], ry: -30, ex: 'dazed' });
  camS([0, 1.6, -6.2], [.1, 1.58, -10.8], [.1, 1.6, -6.7], [.1, 1.6, -10.8], U(lt, 1.7), 46); });
S('N27', 74.62, 'cut', STREET, (lt, t) => { p4reset(); streetLight(lt); MIND = 2.2; put(AR(), STREET, { p: [-.7, .18, -10.4], ry: 20, ex: 'sly', talk: talkAt(t) }); put(NO(), STREET, { p: [.9, .18, -11.2], ry: -30, ex: 'dazed' });
  camS([-1.4, 1.55, -8.0], [-.7, 1.6, -10.4], [-1.2, 1.57, -8.3], [-.7, 1.62, -10.4], U(lt, 2.3), 38); });
// ---- "โนอาห์ไม่ตอบ แล้วหายไปในสายฝน" : he fades out, the rain closes over where he stood
S('N28', 77.34, 'blur', STREET, (lt, t) => { p4reset(); streetLight(lt); MIND = 2.4; const a = 1 - U(lt - .9, 1.5, eIO); put(NO(), STREET, { p: [.9, .18, -11.2], ry: -20, ex: 'stoic' }); setAlpha(NO(), a); gapAt(STREET, .9, -11.2, (1 - a) * .9, t);
  camS([.2, 1.6, -7.6], [.9, 1.6, -11.2], [.4, 1.6, -7.9], [.9, 1.6, -11.2], U(lt, 3.0), 42); });
// ---- "แต่ก่อนหายไป เขาทำกระดาษหล่นไว้หนึ่งแผ่น" : the paper falls (flyPath-like drift) into the puddle
S('N29', 80.24, 'cut', STREET, (lt, t) => { p4reset(); streetLight(lt); MIND = 0; SEALP.visible = true; const u = clamp(lt / 1.7), y = 2.2 - 2.0 * eIn(u) + .02 * Math.sin(lt * 6) * (1 - u), x = .9 + .45 * Math.sin(u * 3.2) * (1 - u * .4);
  SEALP.position.copy(STREET.localToWorld(V(x, Math.max(.22, y), -11.0))); SEALP.rotation.set(-1.1 * u - .2, .5 * Math.sin(u * 4), .5 * Math.sin(u * 5) * (1 - u)); gapAt(STREET, .9, -11.2, Math.max(0, .35 - lt * .12), t);
  camS([.2, 1.4, -8.0], [.9, 1.2, -11.0], [.5, .9, -8.3], [.9, .45, -11.0], U(lt, 2.6), 38); });
// ---- "ตราประทับบนนั้นไม่ใช่ของวิกเตอร์" : the seal close-up (red eye over a tower)
S('N30', 83.48, 'cut', STREET, (lt, t) => { p4reset(); streetLight(lt); MIND = 0; SEALP.visible = true; SEALP.position.copy(STREET.localToWorld(V(.9, 1.2, -9.4))); lightAt(STREET.localToWorld(V(1.1, 2.0, -8.4)), '#fff0d8', 2.2, 3);
  camS([.9, 1.2, -8.6], [.9, 1.2, -9.4], [.9, 1.2, -8.85], [.9, 1.2, -9.4], U(lt, 2.6), 36); SEALP.quaternion.copy(camera.quaternion); });
// ---- "มันคือรูปดวงตา บนยอดหอคอย" : tilt up from the paper to the real tower
S('N31', 86.1, 'cut', STREET, (lt, t) => { p4reset(); streetLight(lt); MIND = 0; TOWER.visible = true; EYEG.visible = true; EYEM.quaternion.identity(); const u = U(lt, 2.4, eIO); put(AR(), STREET, { p: [-.7, .18, -9.4], ry: 200, ex: 'realize' });
  camS([-.7, 1.4, -6.4], [lp([-.7, 1.4, -9.4], [14, 56, -68], u)[0], lp([-.7, 1.4, -9.4], [14, 56, -68], u)[1], lp([-.7, 1.4, -9.4], [14, 56, -68], u)[2]], [-.7, 1.5, -6.2], [14, 56, -68], u, 52); });
// ---- "แปลว่าโนอาห์มีนายจ้างอีกคน" : Aren looks up, the eye glows behind him
S('N32', 88.88, 'cut', STREET, (lt, t) => { p4reset(); streetLight(lt); MIND = 2.4; TOWER.visible = true; EYEG.visible = true; put(AR(), STREET, { p: [-.4, .18, -9.4], ry: 160, ...exShift(lt, .8, 'realize', 'focused'), head: [-12, 0, 0] });
  camS([.4, 1.2, -6.6], [-.4, 2.2, -10.2], [.2, 1.3, -6.4], [-.1, 2.6, -11], U(lt, 2.9), 48); });
// ---- "และคนคนนั้น กำลังเฝ้าดูผมอยู่" : the eye, close; the end card dims the frame
S('N33', 91.68, 'cut', STREET, (lt, t) => { p4reset(); streetLight(lt); MIND = 0; TOWER.visible = true; EYEG.visible = true; EYEG.material.opacity = .5 + .1 * Math.sin(t * 3); EYEM.scale.setScalar(1 + .015 * Math.sin(t * 2.4));
  camS([13, 40, -50], [14, 55, -68], [13.5, 46, -58], [14, 58, -66], U(lt, 4.8, eIO), 34); });
