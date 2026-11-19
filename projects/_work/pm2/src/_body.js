// ===================== EP3 (finale) set pieces =====================
const K2_ = () => CHARS.kael2;   // Kael (the reborn body that vanished in ZERO)
const PR = Wd.PROP;
// the old cathedral door (shut for 100 years)
const DOOR = group({ p: [0, 0, 8.6], parent: HALL }); { mesh(rbox(4.6, 5.6, .5), toon('#5a5470'), { p: [0, 2.8, -.2], parent: DOOR });
  DOOR.userData.leaves = [-1, 1].map(s => { const g = group({ p: [s * 1.6, 0, .1], parent: DOOR }); mesh(rbox(1.6, 4.2, .18), toon('#6a3e26'), { p: [-s * .8, 2.1, 0], parent: g });
    for (const y of [1.0, 3.2]) mesh(rbox(1.5, .12, .22), toon('#3a3040'), { p: [-s * .8, y, 0], parent: g }); return g; });
  const web = new THREE.Mesh(new THREE.CircleGeometry(.9, 8), basic('#e8e8f0', { transparent: true, opacity: .35, side: THREE.DoubleSide })); web.position.set(1.4, 3.9, .25); web.userData.noInk = true; DOOR.add(web); DOOR.userData.web = web; }
function doorAt(k) { DOOR.userData.leaves.forEach((g, i) => { const s = i ? 1 : -1; g.rotation.y = -s * k * 1.9; }); DOOR.userData.web.visible = k < .05; }
// the wedding corner in front of the altar: a table with two rings + candles, two chairs, the dress on a stand
const NOOK = group({ p: [0, .9, -11.0], parent: HALL }); {
  mesh(new THREE.CylinderGeometry(.55, .5, .06, 20), toon('#f4ecd8'), { p: [0, .72, 0], parent: NOOK }); cylBetween([0, 0, 0], [0, .72, 0], .06, toon('#c9a24a'), NOOK, 8);
  mesh(new THREE.CylinderGeometry(.16, .16, .05, 16), toon('#8a1f2e'), { p: [.18, .77, .05], parent: NOOK });
  NOOK.userData.rings = [-1, 1].map(s => { const r = mesh(new THREE.TorusGeometry(.045, .012, 8, 20), toon('#e2b23c', { emissive: '#e2b23c', ei: .3 }), { p: [.18 + s * .06, .815, .05], r: [70, 0, 0], parent: NOOK }); return r; });
  NOOK.userData.candles = []; for (let k = 0; k < 7; k++) { const a = k / 7 * 6.283; const c = group({ p: [Math.cos(a) * .4, .75, Math.sin(a) * .4 - .05], parent: NOOK }); mesh(new THREE.CylinderGeometry(.025, .028, .16 + (k % 3) * .05, 8), toon('#efe6d2'), { p: [0, .09, 0], parent: c });
    const f = mesh(new THREE.SphereGeometry(.025, 8, 6), basic('#ffd27a'), { p: [0, .2 + (k % 3) * .05, 0], s: [1, 1.7, 1], parent: c, cast: false }); f.userData.noInk = true; c.userData.f = f; NOOK.userData.candles.push(c); }
  NOOK.userData.glow = Wd.glowSprite('#ffb84a', 3, { opacity: .55 }); NOOK.userData.glow.position.set(0, 1.0, 0); NOOK.add(NOOK.userData.glow);
  NOOK.userData.chairs = [-1, 1].map(s => { const g = group({ p: [s * 1.1, 0, .1], r: [0, s * -25, 0], parent: NOOK }); mesh(rbox(.6, .08, .55), toon('#e8e0cc'), { p: [0, .48, 0], parent: g }); mesh(rbox(.6, .8, .08), toon('#e8e0cc'), { p: [0, .92, -.26], parent: g });
    for (const [x, z] of [[-.26, -.24], [.26, -.24], [-.26, .24], [.26, .24]]) cylBetween([x, 0, z], [x, .46, z], .025, toon('#c9a24a'), g, 5); mesh(new THREE.TorusGeometry(.16, .03, 6, 14), toon('#e8708a'), { p: [0, 1.2, -.26], parent: g }); return g; });
  // the dress on a stand
  const D = group({ p: [-2.4, 0, -.6], r: [0, 25, 0], parent: NOOK }); cylBetween([0, 0, 0], [0, 1.6, 0], .03, toon('#c9a24a'), D, 6); mesh(new THREE.CapsuleGeometry(.2, .28, 6, 12), toon('#f8f4ec'), { p: [0, 1.32, 0], s: [1, 1, .7], parent: D });
  const sk = new THREE.LatheGeometry([[0, 0], [.62, 0], [.55, .3], [.38, .7], [.22, 1.08], [.18, 1.12]].map(([x, y]) => new THREE.Vector2(x, y)), 24); mesh(sk, toon('#f8f4ec', { side: THREE.DoubleSide }), { p: [0, .05, 0], parent: D });
  mesh(new THREE.TorusGeometry(.6, .03, 6, 24), toon('#e2b23c'), { p: [0, .08, 0], r: [90, 0, 0], parent: D }); mesh(new THREE.ConeGeometry(.32, .9, 16, 1, true), basic('#ffffff', { transparent: true, opacity: .35, side: THREE.DoubleSide }), { p: [0, 1.25, -.05], parent: D, cast: false }); NOOK.userData.dress = D;
  // cobwebs that grow with the years
  NOOK.userData.webs = [[-1.1, 1.3, -.2], [1.1, 1.3, -.2], [0, 1.0, -.35]].map(p => { const w = new THREE.Mesh(new THREE.CircleGeometry(.35, 8), basic('#e8e8f0', { transparent: true, opacity: .4, side: THREE.DoubleSide })); w.position.set(...p); w.userData.noInk = true; NOOK.add(w); return w; }); }
function nookAt(o = {}) { const lit = o.lit ?? 7; NOOK.userData.candles.forEach((c, i) => { c.userData.f.visible = i < lit; }); NOOK.userData.glow.material.opacity = .08 * lit;
  NOOK.userData.rings[0].visible = o.ring0 ?? true; NOOK.userData.rings[1].visible = o.ring1 ?? true; NOOK.userData.webs.forEach((w, i) => { w.visible = (o.webs || 0) > i; }); }
// year boards
const YEAR = [10, 50, 100].map(y => { const b = PR.countdown(HALL, [2.3, 0, -10.2], `ปีที่ ${y}`, -30); b.visible = false; return b; });
// limbo (between life and death): floating rocks + mist in the crypt with the demon gone
const RINGH = group({ parent: scene }); mesh(new THREE.TorusGeometry(.05, .014, 8, 20), toon('#e2b23c', { emissive: '#e2b23c', ei: .3 }), { parent: RINGH }); RINGH.visible = false;   // ring in Kael's hand
const BQ = PR.bouquet(scene, 0); BQ.visible = false;
const wedNight = () => hallLight({ hemiI: 1.25, sunI: .5, hemiS: '#9a90d0', fog: '#1e1832' });
function ep3Reset() { doorAt(0); nookAt(); YEAR.forEach(b => { b.visible = false; }); RINGH.visible = false; BQ.visible = false; CR.demon.visible = true;
  Wd.cracksAt(0, [0, 0, 0], 0); Wd.cracksAt(1, [0, 0, 0], 0); Wd.raysAt([0, 0, 0], 0); Wd.fogAt([0, 0, 0], 0, 0); Wd.rocksAt([0, 0, 0], 0, 0); }
const E3 = (id, t0, tr, fn, o) => S(id, t0, tr, (lt, t) => { ep3Reset(); fn(lt, t); }, o);
const EL = (o) => put(E_(), HALL, o);
const bq = (wilt) => { BQ.visible = true; BQ.children.forEach((m, i) => { if (i) m.position.y = .1 - wilt * .07 * (i % 3); }); return BQ; };

// ===================== EP3 SHOTS (real seconds) =====================
E3('S01', 0, 'cut', (lt, t) => { // "ทุกปี" - candlelit arch at night
  wedNight(); Wd.hallAt(t); Wd.raysAt(HALL.localToWorld(V(0, 0, -11)), .4, t, '#ffe0a0');
  camH([0, 3.4, -4.0], [0, 2.4, -12], [0, 2.9, -5.2], [0, 2.3, -12], U(lt, 1.0, eOut), 46); });
E3('S02', .99, 'cut', (lt, t) => { // "เจ้าหญิงคนนี้จะจัดงานแต่งงาน" - she walks down the aisle alone
  wedNight(); Wd.hallAt(t); const z = -3.5 - lt * 1.4;
  EL({ p: [0, 0, z], ry: 180, ex: 'calm', walk: { ph: lt * 6, stride: .16 }, hL: [-.12, .45, .35], hR: [.12, .45, .35], pL: [-1, -.3, 0], pR: [1, -.3, 0], hold: { R: { obj: bq(0), off: [-.06, .05, .05], rot: [0, 0, 0] } } });
  camH([.5, 1.75, z - 2.6], [0, 1.55, z], [.3, 1.7, z - 2.2], [0, 1.55, z], U(lt, 2.4, eIO), 46); });
E3('S03', 3.37, 'cut', (lt, t) => { // "ที่ไม่มีเจ้าบ่าว" - from behind: no one waiting at the altar
  wedNight(); Wd.hallAt(t); EL({ p: [-.5, .9, -10.7], ry: 0, ex: 'sad' });
  camH([-.2, 2.2, -6.2], [0, 1.8, -12], [-.4, 2.6, -4.8], [0, 1.9, -12], U(lt, 1.4, eOut), 44); tintAt('#101830', .15); });
E3('S04', 4.78, 'cut', (lt, t) => { // "ชุดเจ้าสาวหนึ่งชุด" - slide past the dress
  wedNight(); Wd.hallAt(t); const P = NOOK.localToWorld(V(-2.4, 1.1, -.6));
  camH([-3.5, 2.0, -9.2], [-2.3, 1.75, -11.6], [-1.8, 1.9, -9.0], [-2.4, 1.75, -11.6], U(lt, 1.6, eIO), 42); });
E3('S05', 6.36, 'cut', (lt, t) => { // "แหวนสองวง" - macro orbit around the rings
  wedNight(); Wd.hallAt(t); const a = lerp(-.5, .4, eIO(lt / 1.3)); const c = V(.18, 1.72, -10.95);
  camH([c.x + Math.sin(a) * .7, 1.95, c.z + Math.cos(a) * .7], c.toArray(), [c.x + Math.sin(a) * .7, 1.95, c.z + Math.cos(a) * .7], c.toArray(), 0, 38); dof(.8); }, { noCut: true });
E3('S06', 7.62, 'cut', (lt, t) => { // "และเก้าอี้ว่างอีกหนึ่งตัว" - truck from Elena to the empty chair
  wedNight(); Wd.hallAt(t); EL({ p: [-1.1, 1.35, -10.85], ry: 25, ex: 'sad', sit: true, seat: .5, hL: [-.15, .35, .3], hR: [.15, .35, .3], pL: [-1, -.3, 0], pR: [1, -.3, 0] });
  camH([-1.2, 1.7, -8.0], [-1.0, 1.6, -11], [1.4, 1.6, -8.2], [1.1, 1.4, -11], U(lt, 2.0, eIO), 44); }, { noCut: true });
E3('S07', 9.58, 'cut', (lt, t) => { // "เพราะวันนี้ คือวันที่เธอกับเคลเคยสัญญาว่าจะแต่งงานกัน" - the promise, 100+ years ago
  moonLight(); BALC.visible = true; past(); POST.sat = .55; burnAt(.5 + .1 * Math.sin(t * 2));
  put(K(), BALC, { p: [.25, 0, -1.6], ry: -70, ex: 'happy', blink: blinkAt(t, 1), hL: [-.32, .45, .35], pL: [-1, -.3, 0] }); put(E_(), BALC, { p: [-.55, 0, -1.55], ry: 70, ex: 'happy', blink: blinkAt(t, 2), hR: [.32, .45, .35], pR: [1, -.3, 0] });
  camB([-.2, 1.5, 2.6], [-.15, 1.5, -1.6], [-.15, 1.6, 1.0], [-.15, 1.55, -1.6], U(lt, 4.4, eIO), 44); });
E3('S08', 14.12, 'cut', (lt, t) => { // "ทั้งเมืองบอกว่าเขาตายไปแล้ว" - the town square, villagers gossip
  villNight({ hemiI: 1.4 }); VILL.visible = true;
  put(KN(1), VILL, { p: [3.6, 0, 5.4], ry: 60, ex: 'frown', talk: talkAt(t) }); put(KN(2), VILL, { p: [4.6, 0, 6.1], ry: -110, ex: 'sly' }); put(K2_(), VILL, { p: [99, 0, 99], visible: false });
  camV([1.0, 1.6, 9.6], [4.6, 2.0, 4.4], [2.0, 2.4, 10.4], [5.4, 2.6, 3.8], U(lt, 2.1, eIO), 48); });
E3('S09', 16.25, 'cut', (lt, t) => { // "แต่เอเลน่าไม่เคยเชื่อ" - she clutches her ring, determined
  wedNight(); Wd.hallAt(t); EL({ p: [-1.1, 1.35, -10.85], ry: 25, ex: 'determined', sit: true, seat: .5, hL: [-.1, .55, .35], hR: [.1, .55, .35], pL: [-1, -.3, 0], pR: [1, -.3, 0] });
  camH([-.4, 2.1, -9.0], [-1.1, 2.0, -10.85], [-.6, 2.08, -9.5], [-1.1, 2.0, -10.85], U(lt, 1.8, eOut), 40); });
const yearShot = (i, webs, wilt, lit) => (lt, t) => { wedNight(); Wd.hallAt(t); YEAR[i].visible = true; nookAt({ webs, lit }); tintAt(['#0a1020', '#20140a', '#0a0a10'][i], .12 + .06 * Math.sin(t * 9));
  EL({ p: [-1.1, 1.35, -10.85], ry: 25, ex: i === 2 ? 'sad' : 'calm', sit: true, seat: .5, hL: [-.12, .45, .35], hR: [.12, .45, .35], pL: [-1, -.3, 0], pR: [1, -.3, 0], hold: { R: { obj: bq(wilt), off: [-.06, .05, .05], rot: [0, 0, 0] } } });
  const k = eIO(lt / 1.8); camH([1.8 + k * .3, 1.9, -7.6 + k * .5], [.4, 1.6, -10.6], [1.8 + k * .3, 1.9, -7.6 + k * .5], [.4, 1.6, -10.6], 0, 46); };
E3('S10', 18.06, 'cut', yearShot(0, 0, 0, 7), { noCut: true });       // "10 ปีผ่านไป"
E3('S11', 19.84, 'cut', yearShot(1, 2, .5, 5), { noCut: true });      // "50 ปีผ่านไป"
E3('S12', 21.60, 'cut', yearShot(2, 3, 1, 3), { noCut: true });       // "จนครบ 100 ปี"
E3('S13', 23.68, 'cut', (lt, t) => { // "คืนนั้นเธอถอดแหวน วางลงบนโต๊ะ" - close on the hand and the table
  wedNight(); Wd.hallAt(t); nookAt({ webs: 3, lit: 3, ring1: lt > 2.2 }); const k = sstep(.6, 2.2, lt);
  EL({ p: [-.55, .9, -10.6], ry: 40, ex: 'sad', hR: lp([.1, .55, .35], [.32, .48, .5], k), pR: [1, -.3, -.3], hL: [-.25, .35, .2], pL: [-1, 0, -.5] });
  if (lt < 2.2) { RINGH.visible = true; RINGH.position.copy(W(E_(), lp([.1, .58, .38], [.32, .5, .52], k))); RINGH.rotation.x = 1.2; }
  camH([.9, 1.95, -9.6], [.1, 1.65, -10.9], [.7, 1.85, -9.9], [.15, 1.68, -10.9], U(lt, 3.0, eOut), 40); }, { noCut: true });
E3('S14', 26.76, 'cut', (lt, t) => { // "พอแล้ว! ฉันรอมามากพอแล้ว!" - she breaks
  wedNight(); Wd.hallAt(t); nookAt({ webs: 3, lit: 3 }); SH.a = .25; SH.t = t;
  EL({ p: [-.55, .9, -10.6], ry: 20, ex: lt < 1.0 ? 'angry' : 'sad', sweat: true, talk: talkAt(t), pop: popAt(lt, .05, .12), hL: [-.32, .6, .4], hR: [.32, .6, .4], pL: [-1, -.3, -.3], pR: [1, -.3, -.3] });
  camH([.2, 2.05, -8.9], [-.55, 2.0, -10.6], [-.1, 2.0, -9.4], [-.55, 2.0, -10.6], U(lt, 2.7, eOut), 40, -6); });
E3('S15', 29.54, 'cut', (lt, t) => { // "เธอเป่าเทียนเล่มสุดท้าย" - the last flame goes out
  hallLight({ hemiI: lerp(1.25, .7, sstep(.6, 1.2, lt)), sunI: .3, hemiS: '#7a70b0', fog: '#141022' }); Wd.hallAt(t); nookAt({ webs: 3, lit: lt < .8 ? 1 : 0 });
  if (lt > .8) smokeAt(NOOK.localToWorld(V(Math.cos(0) * .4, 1.0, -.05)), lt - .8, { col: '#c8c0d8', size: .25, life: 1.4 });
  camH([.9, 1.85, -10.5], [.4, 1.65, -11.05], [.75, 1.8, -10.7], [.4, 1.65, -11.05], U(lt, 1.7, eOut), 36); }, { noCut: true });
E3('S16', 31.26, 'cut', (lt, t) => { // "แล้วเดินไปที่ประตู" - into the dark, towards the door
  hallLight({ hemiI: .7, sunI: .3, hemiS: '#7a70b0', fog: '#141022' }); Wd.hallAt(t); nookAt({ webs: 3, lit: 0 }); const z = -9.4 + lt * 1.3;
  EL({ p: [0, 0, z], ry: 0, ex: 'sad', walk: { ph: lt * 6, stride: .16 } }); camH([.6, 1.9, z - 3.2], [0, 1.4, z + 4], [.4, 1.8, z - 2.6], [0, 1.4, z + 4], U(lt, 1.5, eIO), 50); });
E3('S17', 32.78, 'cut', (lt, t) => { // "แต่แล้ว" - she stops
  hallLight({ hemiI: .7, sunI: .3, hemiS: '#7a70b0', fog: '#141022' }); Wd.hallAt(t); EL({ p: [0, 0, -7.3], ry: 0, ex: 'shocked', pop: popAt(lt, .1, .1) });
  camH([.3, 1.75, -4.8], [0, 1.75, -7.3], [.25, 1.75, -5.2], [0, 1.75, -7.3], U(lt, .7, eOut), 40); });
E3('S18', 33.46, 'cut', (lt, t) => { // "ประตูที่ไม่เคยเปิดมา 100 ปี" - the dusty door, light leaks through
  hallLight({ hemiI: .7, sunI: .3, hemiS: '#7a70b0', fog: '#141022' }); Wd.hallAt(t); Wd.raysAt(HALL.localToWorld(V(0, 0, 8.2)), .25 + .2 * sstep(1.2, 2.1, lt), t, '#fff2c0');
  camH([.5, 2.2, 4.2], [0, 2.4, 8.6], [.2, 2.3, 5.8], [0, 2.4, 8.6], U(lt, 2.1, eIO), 44); });
E3('S19', 35.60, 'cut', (lt, t) => { // "ก็ถูกผลักออก" - the doors swing, light and dust pour in
  hallLight({ hemiI: .9 }); Wd.hallAt(t); doorAt(sstep(0, .7, lt)); Wd.raysAt(HALL.localToWorld(V(0, 0, 8.2)), 1, t, '#fff2c0'); tintAt('#fff4d8', .35 * Math.max(0, 1 - Math.abs(lt - .4) * 3));
  dustAt(HALL.localToWorld(V(0, .2, 8)), lt / 1.1, 2.4); SH.a = lt < .5 ? .3 : 0; SH.t = t;
  camH([0, 1.6, 3.2], [0, 2.4, 8.6], [0, 1.5, 4.0], [0, 2.4, 8.6], U(lt, 1.15, eOut), 50); });
E3('S20', 36.75, 'cut', (lt, t) => { // "ชายคนหนึ่งยืนอยู่ตรงนั้น" - a silhouette in the light
  hallLight({ hemiI: .9 }); Wd.hallAt(t); doorAt(1); Wd.raysAt(HALL.localToWorld(V(0, 0, 8.2)), 1, t, '#fff2c0'); Wd.fogAt(HALL.localToWorld(V(0, 0, 7.6)), t, .8, '#fff0d0', 3);
  put(K2_(), HALL, { p: [0, 0, 8.0], ry: 180, ex: 'calm', blink: blinkAt(t, 1) }); EL({ p: [-.4, 0, 3.9], ry: 175, ex: 'shocked' });
  camH([-1.2, 1.6, 1.4], [0, 1.8, 8.0], [-.9, 1.5, 2.2], [0, 1.8, 8.0], U(lt, 1.9, eIO), 44); });
E3('S21', 38.63, 'cut', (lt, t) => { // "เสื้อขาด ตัวเปื้อนฝุ่น" - tilt down the dusty traveller
  hallLight({ hemiI: 1.0 }); Wd.hallAt(t); doorAt(1); Wd.raysAt(HALL.localToWorld(V(0, 0, 8.2)), .8, t, '#fff2c0'); POST.sat = .8;
  put(K2_(), HALL, { p: [0, 0, 7.4], ry: 180, ex: 'calm', blink: blinkAt(t, 1) }); for (let i = 0; i < 4; i++) smokeAt(HALL.localToWorld(V((i - 1.5) * .25, .9 + (i % 2) * .4, 7.2)), (lt * .8 + i * .3) % 1.6, { col: '#b8a888', size: .35, life: 1.6 });
  camH([.3, 2.0, 5.6], [0, 1.9, 7.4], [.3, 1.2, 5.4], [0, .9, 7.4], U(lt, 2.3, eIO), 42); }, { noCut: true });
E3('S22', 40.93, 'cut', (lt, t) => { // "แต่รอยยิ้มนั้น ยังเหมือนเดิม" - the smile
  hallLight({ hemiI: 1.1 }); Wd.hallAt(t); doorAt(1); Wd.raysAt(HALL.localToWorld(V(0, 0, 8.2)), .7, t, '#fff2c0');
  put(K2_(), HALL, { p: [0, 0, 7.0], ry: 180, ex: lt > .5 ? 'happy' : 'calm', pop: popAt(lt, .5, .06), blink: false });
  camH([-.35, 1.5, 5.3], [0, 1.45, 7.0], [-.2, 1.47, 5.8], [0, 1.45, 7.0], U(lt, 2.3, eOut), 40); }, { noCut: true });
E3('S23', 43.26, 'cut', (lt, t) => { // "ขอโทษที่มาสาย... เจ้าสาวของฉัน" - over Elena's shoulder
  hallLight({ hemiI: 1.1 }); Wd.hallAt(t); doorAt(1); Wd.raysAt(HALL.localToWorld(V(0, 0, 8.2)), .6, t, '#fff2c0');
  put(K2_(), HALL, { p: [0, 0, 6.2], ry: 180, ex: 'happy', talk: talkAt(t), hR: [.25, .55, .35], pR: [1, -.3, -.3] }); EL({ p: [-.5, 0, 4.4], ry: 10, ex: 'shocked' });
  camH([-1.4, 1.75, 2.6], [0, 1.5, 6.2], [-1.2, 1.72, 3.0], [0, 1.5, 6.2], U(lt, 2.5, eIO), 42); });
E3('S24', 45.79, 'cut', (lt, t) => { // "น้ำตาของเอเลน่าไหลไม่หยุด"
  hallLight({ hemiI: 1.1 }); Wd.hallAt(t); EL({ p: [-.5, 0, 4.4], ry: 175, ex: 'sad', sweat: true, blink: blinkAt(t, 3) });
  debrisAt(W(E_(), [.12, 1.05, .45]), (lt * .9) % 1, { n: 3, seed: Math.floor(lt * .9) + 1, speed: .3, kind: 'spark', col: '#bfe6ff', grav: 2.2, life: 1 });
  camH([-.6, 1.5, 6.6], [-.5, 1.48, 4.4], [-.55, 1.48, 6.0], [-.5, 1.48, 4.4], U(lt, 2.0, eOut), 40); }, { noCut: true });
E3('S25', 47.81, 'cut', (lt, t) => { // "เคล... นายกลับมาจริงๆ เหรอ?"
  hallLight({ hemiI: 1.1 }); Wd.hallAt(t); EL({ p: [-.5, 0, 4.4 + sstep(.4, 1.6, lt) * .5], ry: 175, ex: 'sad', sweat: true, talk: talkAt(t), walk: lt < 1.6 ? { ph: lt * 5, stride: .1 } : undefined });
  put(K2_(), HALL, { p: [0, 0, 6.2], ry: 185, ex: 'happy' });
  camH([1.3, 1.7, 7.8], [-.4, 1.45, 4.6], [1.0, 1.68, 7.2], [-.4, 1.45, 4.8], U(lt, 2.4, eIO), 42); });
E3('S26', 50.27, 'cut', (lt, t) => { // "ฉันบอกแล้วไง ว่าฉันจะกลับมา"
  hallLight({ hemiI: 1.1 }); Wd.hallAt(t); put(K2_(), HALL, { p: [0, 0, 6.2], ry: 185, ex: 'happy', talk: talkAt(t), blink: blinkAt(t, 1) });
  camH([-.3, 1.5, 4.4], [0, 1.45, 6.2], [-.2, 1.47, 4.9], [0, 1.45, 6.2], U(lt, 2.4, eOut), 40); }, { noCut: true });
E3('S27', 52.73, 'cut', (lt, t) => { // "เวท ZERO ไม่ได้ทำลายวิญญาณของเขา" - inside the white light
  cryptLight(); CRYPT.visible = true; CR.demon.visible = false; tintAt('#ffffff', .55 - .2 * sstep(1.5, 2.7, lt)); Wd.rocksAt(CRYPT.localToWorld(V(0, 0, -6)), t, 1);
  put(K2_(), CRYPT, { p: [0, 1.0 + Math.sin(t * 1.2) * .1, -6], ry: 0, ex: 'sleepy', blink: true, hL: [-.4, .5, .1], hR: [.4, .5, .1], pL: [-1, 0, -.5], pR: [1, 0, -.5] });
  runesAt(CRYPT.localToWorld(V(0, 1, -6)), t, .9, { col: '#ffffff', col2: '#ffffff', n: 16, w: 420, h: 600 });
  camC([1.5, 2.0, -1.2], [0, 2.2, -6], [.6, 2.4, -2.6], [0, 2.3, -6], U(lt, 2.8, eIO), 46); });
E3('S28', 55.50, 'cut', (lt, t) => { // "มันส่งเขาไปติดอยู่ระหว่างความเป็นกับความตาย" - limbo
  cryptLight(); CRYPT.visible = true; CR.demon.visible = false; POST.sat = .45; Wd.fogAt(CRYPT.localToWorld(V(0, 0, -6)), t, 1, '#6a5a8a', 9); Wd.rocksAt(CRYPT.localToWorld(V(0, 0, -7)), t, 1); tintAt('#1a1030', .25);
  put(K2_(), CRYPT, { p: [0, .2, -6], ry: 20, ex: 'worried', blink: blinkAt(t, 2) });
  camC([4.0, 3.2, 0.5], [0, 1.4, -6], [2.6, 2.4, -1.8], [0, 1.5, -6], U(lt, 3.4, eIO), 50); });
E3('S29', 58.88, 'cut', (lt, t) => { // "และเขาใช้เวลา 100 ปี เดินหาทางกลับมาหาเธอ" - the long walk towards a far light
  cryptLight(); CRYPT.visible = true; CR.demon.visible = false; POST.sat = .55; const x = -3 + lt * .9; Wd.fogAt(CRYPT.localToWorld(V(0, 0, -6)), t, 1, '#6a5a8a', 9);
  Wd.raysAt(CRYPT.localToWorld(V(5.5, 0, -8)), .8, t, '#fff2c0'); put(K2_(), CRYPT, { p: [x, 0, -6.5], ry: 70, ex: 'determined', walk: { ph: lt * 6, stride: .2 } });
  camC([x - .6, 1.4, -2.4], [x + .4, 1.4, -6.5], [x - .2, 1.5, -2.6], [x + .6, 1.4, -6.5], U(lt, 4.0, eIO), 48); }, { noCut: true });
E3('S30', 62.85, 'cut', (lt, t) => { // "เขาหยิบแหวนบนโต๊ะ แล้วสวมให้เธออีกครั้ง"
  wedNight(); Wd.hallAt(t); nookAt({ webs: 3, lit: 0, ring1: false }); const k = sstep(1.2, 2.4, lt);
  put(K2_(), HALL, { p: [.45, .9, -10.4], ry: -80, ex: 'happy', hR: lp([.3, .45, .3], [.25, .55, .5], k), pR: [1, -.3, -.3] });
  EL({ p: [-.45, .9, -10.4], ry: 80, ex: k > .7 ? 'happy' : 'sad', sweat: k < .7, hL: [-.2, .5, .45], pL: [-1, -.3, -.3] });
  RINGH.visible = true; RINGH.position.copy(W(K2_(), lp([.3, .48, .33], [.25, .58, .53], k))); if (k > .9) sparkAt(RINGH.position.clone(), .8, .6);
  camH([0, 1.75, -8.6], [0, 1.55, -10.4], [0, 1.65, -9.3], [0, 1.6, -10.4], U(lt, 2.9, eOut), 40); }, { noCut: true });
E3('S31', 65.75, 'cut', (lt, t) => { // "คืนนั้น งานแต่งงานที่ไม่เคยมีเจ้าบ่าว" - every candle burns again
  wedNight(); Wd.hallAt(t); nookAt({ webs: 0, lit: 7 }); Wd.raysAt(HALL.localToWorld(V(0, 0, -11)), .5, t, '#ffe0a0');
  put(K2_(), HALL, { p: [.4, .9, -11.4], ry: -20, ex: 'happy', hL: [-.3, .45, .3], pL: [-1, -.3, 0] }); EL({ p: [-.4, .9, -11.4], ry: 20, ex: 'happy', hR: [.3, .45, .3], pR: [1, -.3, 0] });
  debrisAt(HALL.localToWorld(V(0, 5, -10)), (lt * .5) % 1, { n: 22, seed: 4, speed: .6, kind: 'leaf', col: '#f2a0b8', grav: 1.2, life: 3 });
  camH([0, 1.6, -5.0], [0, 1.8, -11.4], [0, 1.9, -7.4], [0, 1.9, -11.4], U(lt, 3.1, eIO), 46); });
E3('S32', 68.90, 'cut', (lt, t) => { // "ได้มีเจ้าบ่าวเป็นครั้งแรก" - crane up over the couple
  wedNight(); Wd.hallAt(t); nookAt({ webs: 0, lit: 7 }); Wd.raysAt(HALL.localToWorld(V(0, 0, -11)), .8, t, '#ffe0a0');
  put(K2_(), HALL, { p: [.4, .9, -11.4], ry: -20, ex: 'happy' }); EL({ p: [-.4, .9, -11.4], ry: 20, ex: 'happy', blink: true });
  debrisAt(HALL.localToWorld(V(0, 5, -10)), (lt * .5 + .4) % 1, { n: 22, seed: 6, speed: .6, kind: 'leaf', col: '#f2a0b8', grav: 1.2, life: 3 });
  camH([0, 2.2, -8.0], [0, 1.6, -11.4], [0, 6.5, -6.0], [0, 1.2, -11.4], U(lt, 1.95, eIO), 48); }, { noCut: true });
E3('S33', 70.84, 'cut', (lt, t) => { // "และครั้งนี้ ไม่มีใครพรากพวกเขาจากกันได้อีก" - the balcony under the moon, pull back to the sky
  moonLight(); BALC.visible = true; put(K2_(), BALC, { p: [.15, 0, -1.9], ry: 160, ex: 'happy', hL: [-.32, .4, .2], pL: [-1, -.3, 0] }); put(E_(), BALC, { p: [-.55, 0, -1.9], ry: 200, ex: 'happy', hR: [.32, .4, .2], pR: [1, -.3, 0] });
  camB([-.2, 1.6, 1.6], [-.2, 1.6, -1.9], [-.2, 3.6, 3.8], [3, 14, -40], U(lt, 4.4, eIO), 46); }, { noCut: true });
