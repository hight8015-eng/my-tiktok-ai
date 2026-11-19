// ===================== EP2 set pieces =====================
const K2_ = () => CHARS.kael2;   // Kael reborn: the village boy with the red eyes
const PR = Wd.PROP;
// cathedral door at the entrance (blows open)
const DOOR = group({ p: [0, 0, 8.6], parent: HALL }); { mesh(rbox(4.6, 5.6, .5), toon('#5a5470'), { p: [0, 2.8, -.2], parent: DOOR });
  DOOR.userData.leaves = [-1, 1].map(s => { const g = group({ p: [s * 1.6, 0, .1], parent: DOOR }); mesh(rbox(1.6, 4.2, .18), toon('#6a3e26'), { p: [-s * .8, 2.1, 0], parent: g });
    for (const y of [1.0, 3.2]) mesh(rbox(1.5, .12, .22), toon('#3a3040'), { p: [-s * .8, y, 0], parent: g }); return g; }); }
function doorAt(k) { DOOR.userData.leaves.forEach((g, i) => { const s = i ? 1 : -1; g.rotation.y = s * k * 2.2; g.position.z = .1 - k * 1.2; }); }
// magic chains from the pillars to Elena on the altar steps
const CHAINS = group({ parent: HALL }); { const E0 = V(0, 1.55, -11.6);
  for (const [x, y, z] of [[-3.4, 4.6, -9.6], [3.4, 4.6, -9.6], [-3.4, 3.2, -13], [3.4, 3.2, -13]]) { const g = group({ parent: CHAINS }), A = V(x, y, z), n = 16;
    for (let k = 0; k <= n; k++) { const p = A.clone().lerp(E0, k / n); p.y -= Math.sin(k / n * Math.PI) * .35; mesh(new THREE.TorusGeometry(.07, .022, 6, 10), basic('#c8a0ff'), { p: p.toArray(), r: [0, k % 2 ? 90 : 0, Math.atan2(E0.y - A.y, E0.x - A.x) * 57], parent: g, cast: false }); }
    g.children.forEach(m => { m.userData.noInk = true; }); } CHAINS.visible = false; }
function chainsOn(k) { CHAINS.visible = true; CHAINS.children.forEach((g, i) => { g.visible = k * 4 <= i + .5 ? true : false; }); }   // k 0..1: chains snap one by one
// ruins after ZERO: fallen pillars, rubble, sunlight
const RUIN = group({ parent: HALL }); { const R = rng(51);
  for (const [x, z, r] of [[-2.2, -4, 70], [2.6, -7.5, -60], [-1.4, 1.5, 100]]) mesh(new THREE.CylinderGeometry(.42, .5, 6, 14), toon('#8a86a0'), { p: [x, .45, z], r: [90, r, 0], parent: RUIN });
  for (let i = 0; i < 40; i++) mesh(new THREE.DodecahedronGeometry(.15 + R() * .35, 0), toon('#7a7690'), { p: [(R() - .5) * 9, .1, -12 + R() * 16], r: [R() * 90, R() * 90, 0], parent: RUIN });
  RUIN.visible = false; }
// the ring left on the floor
const RING = group({ p: [.4, .06, -9.4], parent: HALL }); { const r = mesh(new THREE.TorusGeometry(.12, .03, 10, 28), toon('#e2b23c', { emissive: '#e2b23c', ei: .35 }), { r: [80, 0, 0], parent: RING });
  const j = mesh(new THREE.OctahedronGeometry(.05, 0), basic('#ff2040'), { p: [0, .02, .12], parent: RING }); j.userData.noInk = true; RING.visible = false; }
// a white dome for ZERO over the capital
const DOME = mesh(new THREE.SphereGeometry(1, 40, 24), basic('#ffffff', { transparent: true, opacity: .0, add: true, depthWrite: false }), { parent: FIELD, cast: false }); DOME.userData.noInk = true;
const SPELL = ['#ff3a2a', '#7a2aff', '#3ab0ff', '#ffd23a', '#3aff8a', '#ff3ad8', '#ffffff'];
function ep2Reset() { DOOR.visible = true; doorAt(0); CHAINS.visible = false; RUIN.visible = false; RING.visible = false; DOME.material.opacity = 0; DOME.visible = false; HA.glass.visible = true;
  Wd.cracksAt(0, [0, 0, 0], 0); Wd.cracksAt(1, [0, 0, 0], 0); Wd.raysAt([0, 0, 0], 0); Wd.fogAt([0, 0, 0], 0, 0); Wd.rocksAt([0, 0, 0], 0, 0); }
const E2 = (id, t0, tr, fn, o) => S(id, t0, tr, (lt, t) => { ep2Reset(); fn(lt, t); }, o);
const ruinLight = () => hallLight({ hemiI: 2.2, sunI: 1.6, hemiS: '#e8e0ff', fog: '#8a84a8' });
const W2 = (C, v) => W(C, v);

// ===================== EP2 SHOTS (real seconds) =====================
E2('S01', 0, 'cut', (lt, t) => { // "กลางพิธีหมั้นของเจ้าหญิง" - push in on the ceremony
  hallLight(); Wd.hallAt(t, { circle: .3 }); CHAINS.visible = false;
  put(E_(), HALL, { p: [-.45, .9, -11.6], ry: 10, ex: 'sad', blink: blinkAt(t, 2) }); put(L(), HALL, { p: [.75, .9, -11.55], ry: -15, ex: 'calm', blink: blinkAt(t, 1) });
  put(A(), HALL, { p: [0, .9, -13.1], ry: 0, ex: 'sly', hL: [-.3, .7, .4], hR: [.3, .7, .4], pL: [-1, -.3, 0], pR: [1, -.3, 0] });
  camH([0, 2.6, -3.0], [0, 1.7, -12], [0, 2.0, -7.6], [0, 1.85, -12], U(lt, 2.2, eIO), 44); });
E2('S02', 2.02, 'whip', (lt, t) => { // "ประตูมหาวิหารก็ระเบิดออก"
  hallLight(); Wd.hallAt(t); const k = sstep(.15, .45, lt); doorAt(k); const P = HALL.localToWorld(V(0, 1.8, 8.4));
  impactAt(P, (lt - .15) / .5, 1.6); shockAt(HALL.localToWorld(V(0, .1, 8)), (lt - .15) / .7, 1.4, '#ffd0a0');
  for (let i = 0; i < 6; i++) smokeAt(P.clone().add(V((i - 2.5) * .6, -.8 + (i % 2) * .5, -.5)), lt - .2 - i * .04, { size: 1.6, life: 3 });
  debrisAt(P, lt - .15, { n: 24, seed: 3, speed: 9, kind: 'rock', size: .2 }); SH.a = lt > .15 && lt < .9 ? 1 : 0; SH.t = t; tintAt('#ffe0b0', .5 * Math.max(0, 1 - Math.abs(lt - .2) * 5));
  camH([1.2, 1.2, 1.5], [0, 2.2, 8.6], [.5, 1.0, 2.6], [0, 2.4, 8.6], U(lt, 2.4, eOut), 52); });
E2('S03', 4.41, 'cut', (lt, t) => { // "เอเลน่าถูกล่ามด้วยโซ่เวทมนตร์บนแท่นบูชา" - crane up from the chains to her face
  hallLight(); Wd.hallAt(t, { circle: .7 }); chainsOn(0);
  put(E_(), HALL, { p: [0, .9, -11.6], ry: 0, ex: 'scared', sweat: true, hL: [-.62, .78, .1], hR: [.62, .78, .1], pL: [-1, -.3, -.3], pR: [1, -.3, -.3] });
  put(A(), HALL, { p: [1.6, .6, -12.4], ry: -40, ex: 'evil', hR: [.32, .7, .3], pR: [1, -.3, -.3], hold: { R: { obj: (STAFF.visible = true, STAFF), off: [0, -.02, 0], rot: [0, 0, 0] } } });
  runesAt(HALL.localToWorld(V(0, .95, -11.6)), t, .9, { col: '#a050ff', col2: '#e8d0ff', n: 14, w: 300, h: 380 });
  camH([.6, 1.0, -8.6], [0, 1.2, -11.6], [.4, 2.2, -8.4], [0, 2.0, -11.6], U(lt, 3.3, eIO), 46); });
E2('S04', 7.76, 'cut', (lt, t) => { // "เหนือหัวเธอ เทพปีศาจกำลังลืมตา" - the eyes open in the dark
  cryptLight(); CRYPT.visible = true; Wd.cryptAt(t, sstep(.9, 2.4, lt)); tintAt('#300010', .25); Wd.fogAt(CRYPT.localToWorld(V(0, 0, -9)), t, .9, '#6a3a6a', 8);
  camC([0, 6.5, -1], [0, 10.2, -11], [0, 8.8, -4.5], [0, 10.4, -11], U(lt, 3.2, eOut), 46); });
E2('S05', 10.96, 'cut', (lt, t) => { // "แล้วชายคนหนึ่งก็เดินฝ่ากลุ่มควันเข้ามา" - tracking back as he walks out of the smoke
  hallLight(); Wd.hallAt(t); doorAt(1); const z = 7.6 - lt * 1.1;
  put(K2_(), HALL, { p: [0, 0, z], ry: 180, ex: 'sly', eyeC: '#ff2030', walk: { ph: lt * 7, stride: .2 }, blink: false });
  for (let i = 0; i < 7; i++) smokeAt(HALL.localToWorld(V((i - 3) * .55, .4 + (i % 3) * .5, 7.4 + (i % 2) * .6)), 1.2 + lt * .8 + i * .1, { size: 1.8, life: 4 });
  camH([.8, .7, z - 3.4], [0, 1.4, z], [-.4, .9, z - 2.4], [0, 1.5, z], U(lt, 2.7, eIO), 48); });
E2('S06', 14.16, 'cut', (lt, t) => { // "ขอโทษที่มาช้า... เจ้าหญิง" - slow push to the smirk
  hallLight(); Wd.hallAt(t); doorAt(1); put(K2_(), HALL, { p: [0, 0, 5.4], ry: 180, ex: 'smug', eyeC: '#ff2030', talk: talkAt(t), blink: false, ...hip });
  Wd.fogAt(HALL.localToWorld(V(0, 0, 6.5)), t, .7, '#b8b0d8', 4);
  camH([-.5, 1.75, 3.2], [0, 1.75, 5.4], [-.2, 1.72, 4.0], [0, 1.72, 5.4], U(lt, 2.3, eOut), 40); });
E2('S07', 16.46, 'cut', (lt, t) => { // "ลูเซียนหน้าซีด ดาบในมือสั่น"
  hallLight(); Wd.hallAt(t); SWORD.visible = true; const sh = Math.sin(t * 60) * 6;
  put(L(), HALL, { p: [.75, .6, -11.0], ry: 180, ex: 'scared', sweat: true, hR: [.3, .5, .3], pR: [1, -.3, -.3], hold: { R: { obj: SWORD, off: [0, -.01, .02], rot: [40 + sh, sh * .5, 0], mass: .4 } } });
  camH([1.3, 1.6, -13.4], [.75, 1.6, -11.0], [1.0, 1.55, -12.7], [.75, 1.55, -11.0], U(lt, 2.5, eOut), 42); });
E2('S08', 19.35, 'cut', (lt, t) => { // "เป็นไปไม่ได้... ข้าฆ่าเจ้าไปแล้ว" - over Kael's shoulder
  hallLight(); Wd.hallAt(t); SWORD.visible = true;
  put(L(), HALL, { p: [.75, .6, -11.0], ry: 180, ex: 'angry', talk: talkAt(t), sweat: true, hR: [.35, .62, .45], pR: [1, -.3, -.3], hold: { R: { obj: SWORD, off: [0, -.01, .02], rot: [85, 0, 0], mass: .4 } } });
  put(K2_(), HALL, { p: [-.2, 0, -7.6], ry: 170, ex: 'calm', eyeC: '#ff2030', ...hip });
  camH([-.9, 1.9, -5.4], [.6, 1.5, -11], [-.5, 1.8, -6.2], [.7, 1.5, -11], U(lt, 2.3, eIO), 42); });
E2('S09', 21.97, 'cut', (lt, t) => { // "เขาไม่แม้แต่จะหันไปมอง" - he walks straight past Lucien
  hallLight(); Wd.hallAt(t); SWORD.visible = true; const z = -8.2 - lt * .9;
  put(L(), HALL, { p: [1.4, .3, -10.4], ry: -110, ex: 'shocked', hR: [.35, .55, .4], pR: [1, -.3, -.3], hold: { R: { obj: SWORD, off: [0, -.01, .02], rot: [70, 0, 0] } } });
  put(K2_(), HALL, { p: [0, Math.max(0, (-z - 10.7) * .25), z], ry: 180, ex: 'calm', eyeC: '#ff2030', walk: { ph: lt * 7, stride: .2 } });
  camH([3.2, 1.5, -8.0], [0, 1.4, z], [2.6, 1.6, -9.6], [0, 1.4, z - .5], U(lt, 2.1, eIO), 46); });
E2('S10', 24.02, 'cut', (lt, t) => { // "แค่ดีดนิ้ว" - the snap
  hallLight(); Wd.hallAt(t); const k = sstep(.25, .45, lt);
  put(K2_(), HALL, { p: [0, .3, -10.2], ry: 180, ex: k > .5 ? 'evil' : 'sly', eyeC: '#ff2030', ...flick(k), fast: true }); const h = W2(K2_(), [.62, .8, .55]);
  if (lt > .4) { sparkAt(h, 1, 1.3); shockAt(h, (lt - .4) / .6, .5, '#ff5070'); }
  camH([-.9, 1.7, -11.8], [.3, 1.55, -10.2], [-.6, 1.65, -11.4], [.3, 1.55, -10.2], U(lt, 1.3, eOut), 40); });
E2('S11', 25.35, 'cut', (lt, t) => { // "โซ่ทุกเส้นก็ขาดสะบั้น" - chains burst, she drops free
  hallLight(); Wd.hallAt(t, { circle: .6 * (1 - lt) }); const k = sstep(0, .8, lt); chainsOn(k);
  put(E_(), HALL, { p: [0, .9 - sstep(.7, 1.1, lt) * .15, -11.6], ry: 0, ex: k > .9 ? 'surprised' : 'scared', hL: lp([-.62, .78, .1], [-.3, .35, .1], sstep(.7, 1.1, lt)), hR: lp([.62, .78, .1], [.3, .35, .1], sstep(.7, 1.1, lt)), pL: [-1, -.3, -.3], pR: [1, -.3, -.3] });
  for (let i = 0; i < 4; i++) if (lt > i * .2) sparkAt(HALL.localToWorld(V(i % 2 ? 1.2 : -1.2, i < 2 ? 2.8 : 2.2, -11.4)), Math.max(0, 1 - (lt - i * .2) * 3), 1.1);
  camH([0, 1.6, -7.6], [0, 1.7, -11.6], [0, 1.6, -8.6], [0, 1.7, -11.6], U(lt, 2.2, eIO), 48); });
E2('S12', 27.54, 'cut', (lt, t) => { // "แต่ทุกอย่างสายไปแล้ว" - red cracks race across the floor
  hallLight(); Wd.hallAt(t, { circle: 1 }); Wd.cracksAt(0, HALL.localToWorld(V(0, 0, -10.5)), lt / 1.4, 11); tintAt('#400010', .25 * sstep(.2, 1.4, lt)); SH.a = .25; SH.t = t;
  put(E_(), HALL, { p: [-.6, .6, -11.2], ry: 20, ex: 'scared' }); put(K2_(), HALL, { p: [.5, .6, -11.0], ry: -20, ex: 'shocked', eyeC: '#ff2030' });
  camH([0, 5.5, -5.6], [0, .4, -10.8], [0, 4.4, -6.6], [0, .6, -10.8], U(lt, 1.6, eOut), 50); });
E2('S13', 29.10, 'cut', (lt, t) => { // "เทพปีศาจตื่นขึ้นเต็มตัว" - crane up the waking giant
  cryptLight(); CRYPT.visible = true; Wd.cryptAt(t, 1); tintAt('#400010', .3); SH.a = .4 * (1 - sstep(1, 2, lt)); SH.t = t; Wd.cracksAt(1, CRYPT.localToWorld(V(0, 0, -9)), 1.2, 14);
  Wd.rocksAt(CRYPT.localToWorld(V(0, 0, -7)), t, sstep(0, 1, lt));
  camC([2.5, 1.2, 2.0], [0, 6, -12], [1.2, 4.5, -.5], [0, 9.5, -12], U(lt, 2.1, eIO), 52); });
E2('S14', 31.19, 'cut', (lt, t) => { // "เขาปล่อยเวทต้องห้ามทีละบท" - spells fly in different colours
  hallLight(); Wd.hallAt(t); const i = Math.min(6, Math.floor(lt * 2.6)), c = SPELL[i];
  put(K2_(), HALL, { p: [0, .6, -10.6], ry: 180, ex: 'angry', eyeC: '#ff2030', hR: [.4, .95, .55], pR: [1, -.3, -.3], hL: [-.4, .9, .5], pL: [-1, -.3, -.3] });
  const h = W2(K2_(), [.4, .95, .6]); beamAt(h, HALL.localToWorld(V(-.6, 9, -15)), t, 1, c); tintAt(c, .12); SH.a = .3; SH.t = t;
  camH([1.4, .8, -12.6], [0, 2.6, -10.6], [.9, .9, -12.9], [0, 3.0, -10.6], U(lt, 1.9, eIO), 54); });
E2('S15', 33.02, 'cut', (lt, t) => { // "จนครบทั้ง 7" - seven hits on the demon
  cryptLight(); CRYPT.visible = true; Wd.cryptAt(t, 1); const i = Math.min(6, Math.floor(lt * 6)), u = (lt * 6) % 1;
  impactAt(CRYPT.localToWorld(V((i - 3) * .9, 6 + (i % 3) * 1.5, -9.5)), u, 1.4); tintAt(SPELL[i], .25 * (1 - u)); SH.a = .5; SH.t = t;
  camC([0, 4, 2], [0, 8, -12], [0, 5, 0], [0, 8.5, -12], U(lt, 1.2, eIO), 54); });
E2('S16', 34.18, 'cut', (lt, t) => { // "มหาวิหารพังทลาย" - stones fall, glass shatters
  hallLight({ hemiI: 1.4 }); Wd.hallAt(t); SH.a = .9; SH.t = t; RUIN.visible = lt > 1.2;
  for (let k = 0; k < 3; k++) debrisAt(HALL.localToWorld(V((k - 1) * 3, 9, -8 - k * 2)), lt - k * .25, { n: 16, seed: 5 + k, speed: 2, kind: 'rock', size: .35, grav: 9.8 });
  debrisAt(HALL.localToWorld(V(0, 7.2, -16)), lt - .3, { n: 26, seed: 9, speed: 5, kind: 'spark', col: '#9ad0ff', grav: 6 }); dustAt(HALL.localToWorld(V(0, .2, -8)), (lt - .6) / 1.2, 2.6);
  camH([2.4, 1.2, -2.0], [0, 4.5, -12], [1.6, 1.5, -4.0], [0, 4.2, -12], U(lt, 2.1, eIO), 56); });
E2('S17', 36.23, 'cut', (lt, t) => { // "แต่เทพปีศาจไม่มีแม้แต่รอยขีดข่วน" - smoke clears, not a scratch
  cryptLight(); CRYPT.visible = true; Wd.cryptAt(t, 1); for (let i = 0; i < 6; i++) smokeAt(CRYPT.localToWorld(V((i - 2.5) * 1.6, 5 + (i % 2) * 2, -8)), 1.4 + lt * .9, { size: 3, life: 3.4 });
  camC([-1.5, 9.5, -3], [0, 10.2, -11], [-.6, 10, -5.5], [0, 10.3, -11], U(lt, 3.2, eOut), 42); });
E2('S18', 39.39, 'cut', (lt, t) => { // "เหลืออยู่ทางเดียว"
  hallLight(); Wd.hallAt(t); RUIN.visible = true; put(K2_(), HALL, { p: [0, .6, -10.6], ry: 180, ex: 'determined', eyeC: '#ff2030', blink: false, ...hip });
  camH([.3, 1.9, -12.6], [0, 1.85, -10.6], [.15, 1.85, -12.0], [0, 1.85, -10.6], U(lt, 1.4, eOut), 38); });
E2('S19', 40.79, 'cut', (lt, t) => { // "เขาหันมายิ้มให้เอเลน่า" - over Elena's shoulder
  hallLight(); Wd.hallAt(t); RUIN.visible = true; put(E_(), HALL, { p: [-.4, .6, -11.4], ry: 30, ex: 'sad', blink: blinkAt(t, 2) });
  put(K2_(), HALL, { p: [.6, .6, -10.4], ry: lerp(160, 230, sstep(0, .8, lt)), ex: lt > .6 ? 'happy' : 'determined', eyeC: '#ff2030', pop: popAt(lt, .7, .08) });
  camH([-1.4, 1.8, -12.8], [.6, 1.7, -10.4], [-1.1, 1.75, -12.4], [.6, 1.7, -10.4], U(lt, 1.9, eIO), 42); });
E2('S20', 42.68, 'cut', (lt, t) => { // "ยิ้มแบบที่เธอจำได้ดี" - a flash of the old smile, 100 years ago
  moonLight(); BALC.visible = true; past(); POST.sat = .5; burnAt(.55); put(K(), BALC, { p: [.3, 0, -1.6], ry: 160, ex: 'happy', blink: blinkAt(t, 1), ...hip });
  camB([-.6, 1.75, .9], [.3, 1.75, -1.6], [-.3, 1.75, .3], [.3, 1.75, -1.6], U(lt, 1.9, eOut), 40); });
E2('S21', 44.60, 'cut', (lt, t) => { // "ยิ้มก่อนเขาจะทำเรื่องบ้าๆ" - the same grin, now
  hallLight(); Wd.hallAt(t); RUIN.visible = true; put(K2_(), HALL, { p: [.6, .6, -10.4], ry: 230, ex: 'smug', eyeC: '#ff2030', blink: false, ...hip });
  camH([-.6, 1.8, -12.0], [.6, 1.75, -10.4], [-.3, 1.78, -11.5], [.6, 1.75, -10.4], U(lt, 2.0, eOut), 38); });
E2('S22', 46.66, 'cut', (lt, t) => { // "รอฉันนะ"
  hallLight(); Wd.hallAt(t); RUIN.visible = true; put(K2_(), HALL, { p: [.6, .6, -10.4], ry: 230, ex: 'calm', eyeC: '#ff2030', talk: talkAt(t), blink: false });
  camH([-.25, 1.85, -11.4], [.6, 1.8, -10.4], [-.15, 1.82, -11.2], [.6, 1.8, -10.4], U(lt, .9, eOut), 34); });
E2('S23', 47.54, 'cut', (lt, t) => { // "เวทบทสุดท้าย" - white runes ring him, low angle
  hallLight({ hemiI: 1.2 }); Wd.hallAt(t); RUIN.visible = true; put(K2_(), HALL, { p: [0, .6, -10.6], ry: 180, ex: 'determined', eyeC: '#ffffff', hR: [.3, 1.05, .2], pR: [1, -.3, -.3], hL: [-.3, .3, .1], pL: [-1, 0, -.5] });
  runesAt(HALL.localToWorld(V(0, .7, -10.6)), t, 1, { col: '#ffffff', col2: '#ffffff', n: 22, w: 520, h: 700 }); Wd.raysAt(HALL.localToWorld(V(0, 0, -10.6)), .8, t, '#ffffff');
  camH([0, .7, -13.4], [0, 2.6, -10.6], [0, .8, -12.9], [0, 2.8, -10.6], U(lt, 1.3, eOut), 52); });
E2('S24', 48.83, 'cut', (lt, t) => { // "ZERO"
  hallLight(); Wd.hallAt(t); RUIN.visible = true; put(K2_(), HALL, { p: [0, .6, -10.6], ry: 180, ex: 'angry', eyeC: '#ffffff', talk: talkAt(t), hR: [.4, 1.1, .5], pR: [1, -.3, -.3], hL: [-.4, 1.05, .45], pL: [-1, -.3, -.3] });
  tintAt('#ffffff', sstep(.1, .85, lt)); SH.a = .8; SH.t = t; shockAt(W2(K2_(), [0, 1, .5]), lt / .8, 1.8);
  camH([.2, 1.8, -13.0], [0, 1.9, -10.6], [.1, 1.85, -12.0], [0, 1.9, -10.6], U(lt, .9, eIn), 44); });
E2('S25', 49.70, 'cut', (lt, t) => { // "แสงสีขาวกลืนกินทั้งเมืองหลวง" - a white dome swallows the capital
  dawnLight(); FIELD.visible = true; FA.rock.visible = false; Wd.cityAt(false, t); DOME.visible = true; const k = sstep(0, 2.2, lt);
  DOME.position.set(-28, 4, -60); DOME.scale.setScalar(2 + k * 70); DOME.material.opacity = .85; tintAt('#ffffff', .55 * (1 - sstep(1.6, 2.4, lt)) + .25 * k);
  camF([10, 14, 30], [-28, 6, -60], [6, 18, 36], [-28, 12, -60], U(lt, 2.6, eOut), 46); });
E2('S26', 52.36, 'cut', (lt, t) => { // "เมื่อแสงจางลง เทพปีศาจหายไปแล้ว" - empty, broken, quiet
  ruinLight(); Wd.hallAt(t); RUIN.visible = true; HA.glass.visible = false; DOOR.visible = false; tintAt('#ffffff', .6 * (1 - sstep(0, 1.2, lt)));
  Wd.raysAt(HALL.localToWorld(V(0, 0, -11)), .9, t); Wd.fogAt(HALL.localToWorld(V(0, 0, -7)), t, .6, '#e0dcff', 6);
  camH([0, 7.5, -1.5], [0, 1.0, -11], [0, 5.5, -4.0], [0, 1.0, -11], U(lt, 3.0, eIO), 50); });
E2('S27', 55.41, 'cut', (lt, t) => { // "และเขาก็หายไปด้วย" - Elena alone in the ruins
  ruinLight(); Wd.hallAt(t); RUIN.visible = true; HA.glass.visible = false; DOOR.visible = false; Wd.raysAt(HALL.localToWorld(V(0, 0, -11)), .7, t);
  put(E_(), HALL, { p: [0, .3, -10.2], ry: lerp(-40, 40, sstep(0, 1.6, lt)), ex: 'sad', sweat: true, blink: blinkAt(t, 2) });
  camH([2.6, 1.2, -6.2], [0, 1.3, -10.2], [1.6, 1.4, -7.4], [0, 1.4, -10.2], U(lt, 2.0, eIO), 46); });
E2('S28', 57.44, 'cut', (lt, t) => { // "บนพื้น เหลือเพียงแหวนวงเดียว" - slow push to the ring
  ruinLight(); Wd.hallAt(t); RUIN.visible = true; HA.glass.visible = false; DOOR.visible = false; RING.visible = true; Wd.raysAt(HALL.localToWorld(V(.4, 0, -9.4)), .9, t);
  sparkAt(HALL.localToWorld(V(.45, .14, -9.35)), .5 + .5 * Math.sin(t * 4), .5);
  camH([1.3, .7, -7.4], [.4, .05, -9.4], [.7, .35, -8.6], [.4, .06, -9.4], U(lt, 3.6, eOut), 40); }, { noCut: true });
