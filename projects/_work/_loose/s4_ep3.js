// ===================== EP 3 (96.42 s): room 12, Victor and gravity =====================
const r12 = (o = {}) => { room(o); Wd.setRoom('12', '#d9cfe6'); XA.pile.visible = true; XA.pile.position.set(-3.3 - 300, -4, -3.6); };
const scrShot = (mode, a, lt, d = 3) => { const u = U(lt, d, eSine); camR([0, 1.85, 2.4], [0, 2.0, -4.9], [0, 1.9, 2.0], [0, 2.0, -4.9], u, 56); };
const FIGHT = { vic: [-.6, -.2, 90], bruno: [1.8, 2.6, -110], ace: [2.6, -.3, -95], krai: [3.7, 2.9, -105], neo: [4.1, 1.8, -100] };
function fight(t, o = {}) {
  const f = (k) => FIGHT[k]; put(VI(), CR, { p: [f('vic')[0], o.vy || 0, f('vic')[1]], ry: f('vic')[2], ex: 'sly', blink: blinkAt(t, 6), ...hip, ...(o.v || {}) });
  put(B(), CR, { p: [f('bruno')[0], 0, f('bruno')[1]], ry: f('bruno')[2], ex: 'frown', blink: blinkAt(t, 2), ...fold, ...(o.b || {}) });
  put(A(), CR, { p: [f('ace')[0], 0, f('ace')[1]], ry: f('ace')[2], ex: 'determined', blink: blinkAt(t, 4), ...hip, ...(o.a || {}) });
  put(K(), CR, { p: [f('krai')[0], 0, f('krai')[1]], ry: f('krai')[2], ex: 'determined', blink: blinkAt(t, 1), ...hip, ...(o.k || {}) });
  put(N(), CR, { p: [f('neo')[0], 0, f('neo')[1]], ry: f('neo')[2], ex: 'worried', blink: blinkAt(t, 3), ...hug, ...(o.n || {}) }); }
const W12 = (x, y, z) => [x - 300, y - 4, z];
function levitate(t, k) { XA.roomDesks.children.forEach((d, i) => { d.position.y = k * (.35 + .25 * Math.sin(t * 1.3 + i)); d.rotation.set(k * .15 * Math.sin(t + i), k * .2 * Math.sin(t * .7 + i * 2), k * .12 * Math.cos(t + i)); }); }
function vicPower(t, k, hand = true) { scene.updateMatrixWorld(); const v = VI(); const h = v.torso.localToWorld(V(.3, .95, .35)); if (hand) Wd.auraAt(0, [h.x, h.y, h.z], 1.0 + .2 * Math.sin(t * 9), .8 * k);
  Wd.auraAt(1, W12(FIGHT.vic[0], .6, FIGHT.vic[1]), 3.2, .35 * k); const p = Wd.pts[1]; p.position.set(...W12(FIGHT.vic[0] + .5, 1.6, FIGHT.vic[1])); p.color.set('#b06aff'); p.intensity = 4 * k; p.distance = 9; }
const vicUp = { hR: [.3, .95, .35], pR: [1, -.4, 0], hL: [-.3, .36, .12], pL: [-1, 0, -.5] };
// --- pre-dawn, the announcement ---
const DAWN = { top: '#101a48', mid: '#3a3a7a', hor: '#e8845a', glow: '#ff9a5a', glowAmt: .9, sunDir: [.75, .08, -.6], sunC: '#ffb890', sunI: 1.7, hemiS: '#8a8ad0', hemiG: '#3a2a40', hemiI: 1.6, fog: '#4a3a6a', stars: .4, moon: .5 };

S('B01', 0, 'cut', (lt, t) => { // morning on the roof ("เช้าวันถัดมา")
  city(DAWN); const y = sstep(.2, 1.0, lt) * (1 - sstep(1.6, 2.2, lt)); put(K(), CT, { p: [.6, 0, 2.8], ry: 15, ex: y > .3 ? 'yawn' : 'calm', blink: y > .3, hL: [-.3 - y * .1, .36 + y * .7, .12 + y * .1], hR: [.3 + y * .1, .36 + y * .7, .12 + y * .1], pL: [-1, -.2, 0], pR: [1, -.2, 0] });
  const u = U(lt, 2.6, eSine); camC([1.2, 1.4, 5.8], [.6, 1.2, 2.8], [1.0, 1.4, 5.2], [.6, 1.2, 2.8], u, 42); dof(.25);
});
S('B02', 2.6, 'cut', (lt, t) => { // a message on every tower ("ไครพบว่ามีข้อความประกาศอยู่บนหน้าจอทุกตึก")
  city(DAWN); XA.bills.visible = true; Wd.screen('announce', 0, 0, 0); put(K(), CT, { p: [.4, 0, 2.6], ry: 180, ex: 'shocked', head: [-10, 0, 0], ...hip });
  const T = BILLT(); const u = U(lt, 2.9, eSine); camC([.8, 1.5, 5.6], [T.x * .97, T.by - 1, T.z], [.6, 1.7, 5.0], [T.x * .97, T.by, T.z], u, 30);
});
S('B03', 5.45, 'cut', (lt, t) => { // "ห้องที่สามารถยึดครองห้องอื่นได้ จะได้รับคะแนนพิเศษ และสิทธิ์เข้าถึงพื้นที่ทรัพยากร"
  room(); Wd.screen('announce', t > 8.2 ? 1 : 0, 0, .55); team(t, { b: { ry: 180 }, n: { ry: 170 }, a: { ry: 190 } }); put(K(), CR, { p: [.4, 0, 1.4], ry: 180, ex: 'calm', ...hip }); scrShot('announce', 0, lt, 7);
});
S('B04', 12.5, 'cut', (lt, t) => { // what it means ("นี่หมายความว่า ทุกห้องไม่ได้แค่ต้องเอาชีวิตรอดจากปีศาจ")
  room(); Wd.screen('announce', 1, 0, .6); XA.roomDesks.visible = false; team(t, { b: { p: [-1.5, 0, .2], ry: 180, ex: 'frown' }, n: { p: [1.5, 0, .1], ry: 170, ex: 'worried', sweat: true }, a: { p: [-.55, 0, .7], ry: 190, ex: 'worried' } }); put(K(), CR, { p: [.5, 0, .6], ry: 180, ex: 'calm', blink: blinkAt(t, 1), ...chin });
  const p = Wd.pts[1]; p.position.set(-300, -2.0, -3.6); p.color.set('#6ad0ff'); p.intensity = 3; const u = U(lt, 4.6, eSine); camR([.2, 2.3, -4.4], [0, 1.0, .5], [.15, 2.2, -4.1], [0, 1.0, .5], u, 56); dof(.15);
});
S('B05', 17.1, 'whip', (lt, t) => { // Bruno punches his palm ("แต่ยังต้องต่อสู้กับนักเรียนห้องอื่นด้วย")
  room(); Wd.screen('announce', 1, 0, .4); const pn = Math.max(0, Math.sin(lt * 7)) * (lt < 2 ? 1 : 0); put(B(), CR, { p: [-1.4, 0, -.7], ry: 25, ex: 'frown', blink: blinkAt(t, 2), hL: [-.05, .6, .42], pL: [-1, -.4, 0], hR: [.05 + pn * .1, .62, .42 + pn * .05], pR: [1, -.4, 0] }); if (pn > .95) SH.a = .2;
  const u = U(lt, 2.9, eOut); camR([-.8, 1.45, 1.3], [-1.4, 1.35, -.7], [-.85, 1.45, 1.0], [-1.4, 1.35, -.7], u, 40); dof(.45);
});
S('B06', 20.0, 'cut', (lt, t) => { // Krai makes a plan ("ไครวางแผนให้ทุกคนออกไปหาอุปกรณ์ และข้อมูลเกี่ยวกับห้องใกล้เคียง")
  room(); Wd.screen('goal', 0, 0, .3); put(K(), CR, { p: [1.2, 0, -.2], ry: -8, ex: 'determined', talk: talkAt(t), blink: blinkAt(t, 1), ...(lt % 2 < 1 ? pointR : fist) });
  put(B(), CR, { p: [-.3, 0, 2.5], ry: 160, ex: 'calm', blink: blinkAt(t, 2), ...fold }); put(N(), CR, { p: [1.7, 0, 2.3], ry: 210, ex: 'happy', blink: blinkAt(t, 3), ...hug }); put(A(), CR, { p: [2.4, 0, 2.0], ry: 220, ex: 'confident', blink: blinkAt(t, 4), ...hip });
  const u = U(lt, 5.2, eSine); camR([.4, 1.6, 4.0], [1.0, 1.2, .4], [.6, 1.6, 3.7], [1.0, 1.2, .4], u, 58); dof(.15);
});
S('B07', 25.2, 'cut', (lt, t) => { // sneaking out on the roof ("ระหว่างสำรวจ")
  city(); const x = 3 - lt * 1.2; [K, N, B, A].forEach((C, i) => put(C(), CT, { p: [x - i * .75, 0, 4.0 - i * .15], ry: -95, lean: 10, walk: { ph: lt * 6 + i, stride: .1 }, ex: i === 0 ? 'sneaky' : 'worried', blink: blinkAt(t, i + 1), ...hip }));
  const u = U(lt, 1.4, eSine); camC([x - 1.2, 2.4, 7.4], [x - 1.2, .9, 4.0], [x - 1.6, 2.4, 7.2], [x - 1.6, .9, 4.0], u, 50); dof(.15);
});
S('B08', 26.55, 'cut', (lt, t) => { // room number 12 ("พวกเขาพบห้องหมายเลข 12")
  r12(); const u = U(lt, 2.5, eIO); camR([0, 3.1, -3.2], [0, 3.35, -5], [1.2, 2.2, 1.6], [-.4, 1.4, -4], u, 46);
  STU(0) && [0, 1, 2, 3].forEach(i => put(STU(i), CR, { p: [-2.8 + i * .6, 0, -2.6 + (i % 2) * .5], ry: 200, ex: 'calm', blink: blinkAt(t, i), ...hug }));
});
const CARRY = [[-1.0, 3.6], [.6, 3.8], [-2.2, 4.0], [1.8, 4.1]];
function carriers(t, lt0) { CARRY.forEach(([x0, z0], i) => { const C = STU(i), k = ((lt0 * .22 + i * .27) % 1); const x = lerp(x0, -2.8 + i * .3, k), z = lerp(z0, -2.9, k); const ry = Math.atan2(-2.8 + i * .3 - x0, -2.9 - z0) / D2R;
  put(C, CR, { p: [x, 0, z], ry, walk: { ph: t * 7 + i, stride: .12 }, ex: 'calm', blink: blinkAt(t, i + 3), ...hug }); Wd.stoneAt(i, [0, 0, 0], t, 1); propAt(XA.stones[i], C, [0, .42, .42]); }); }
S('B09', 28.95, 'cut', (lt, t) => { // many students carrying power stones in ("ซึ่งมีนักเรียนจำนวนมาก กำลังขนหินพลังเข้าไป")
  r12(); XA.doorP.rotation.y = 1.4; carriers(t, t - 20); put(K(), CR, { p: [4.85, 0, 3.4], ry: -95, lean: 12, ex: 'sneaky', blink: blinkAt(t, 1), ...hip }); put(N(), CR, { p: [5.2, 0, 3.9], ry: -95, lean: 8, ex: 'shocked', ...hip });
  const u = U(lt, 3.9, eSine); camR([3.6, 1.7, 4.6], [-2.0, .8, -1.6], [3.2, 1.6, 4.4], [-2.2, .8, -2.0], u, 52); dof(.1);
});
S('B10', 32.75, 'cut', (lt, t) => { // they start to back off ("แต่ก่อนที่พวกเขาจะถอยกลับ")
  r12(); XA.doorP.rotation.y = 1.4; carriers(t, t - 20); const k = sstep(.3, 1.4, lt); put(K(), CR, { p: [4.85 + k * .3, 0, 3.4], ry: lerp(-95, 70, k), ex: 'worried', blink: blinkAt(t, 1), ...hip }); put(N(), CR, { p: [5.2 + k * .3, 0, 3.9], ry: lerp(-95, 80, k), ex: 'worried', ...hug });
  const u = U(lt, 2.1, eSine); camR([3.0, 1.35, 2.2], [4.9, 1.15, 3.6], [3.2, 1.35, 2.3], [4.9, 1.15, 3.6], u, 44); dof(.3);
});
S('B11', 34.85, 'cut', (lt, t) => { // the leader of room 12 appears ("หัวหน้าห้องหมายเลข 12 ก็ปรากฏตัวขึ้น")
  r12(); XA.doorP.rotation.y = 1.4; carriers(t, t - 20); const ap = sstep(.2, 1.0, lt); Wd.flash(Math.sin(clamp(lt / .6) * Math.PI) * .25);
  put(VI(), CR, { p: [3.6, 0, 3.6], ry: 125, ex: 'sly', blink: blinkAt(t, 6), ...hip }); VI().g.visible = ap > .3; Wd.auraAt(1, W12(3.6, .5, 3.6), 1 + 2.5 * ap, .6 * (1 - .5 * ap));
  put(K(), CR, { p: [5.2, 0, 3.2], ry: -100, ex: 'shocked', blink: false, ...hug }); put(N(), CR, { p: [5.5, 0, 4.0], ry: -100, ex: 'scared', blink: false, sweat: true, ...up2 });
  const u = U(lt, 2.9, eSine); camR([4.6, .9, 1.6], [3.6, 1.3, 3.6], [4.5, .85, 1.9], [3.6, 1.35, 3.6], u, 44); dof(.3);
});
S('B12', 37.95, 'cut', (lt, t) => { // "เขาชื่อวิกเตอร์"
  r12(); put(VI(), CR, { p: [3.6, 0, 3.6], ry: 90, ex: 'sly', talk: 0, blink: blinkAt(t, 6), head: [0, 0, 6], ...hip }); Wd.auraAt(1, W12(3.6, .5, 3.6), 2.6, .25);
  const u = U(lt, 1.6, eOut); camR([5.0, 1.45, 3.2], [3.6, 1.4, 3.6], [4.8, 1.45, 3.3], [3.6, 1.4, 3.6], u, 40); dof(.45);
});
S('B13', 39.5, 'cut', (lt, t) => { // gravity: desks float ("และมีพลังควบคุมแรงโน้มถ่วง")
  r12(); const k = sstep(.1, .9, lt); levitate(t, k); fight(t, { v: { ...vicUp, ex: 'confident' }, b: { ex: 'shocked' }, a: { ex: 'shocked' }, k: { ex: 'shocked' }, n: { ex: 'scared', sweat: true } }); vicPower(t, k); POST.sat = 1.0;
  const u = U(lt, 2.6, eSine); camR([-3.4, 2.3, -.6], [2.6, .9, 1.6], [-3.1, 2.2, -.5], [2.6, .9, 1.6], u, 56); dof(.1);
});
S('B14', 42.0, 'cut', (lt, t) => { // one raised hand ("วิกเตอร์ยกมือขึ้นเพียงครั้งเดียว")
  r12(); levitate(t, .6); const k = sstep(.3, .9, lt); fight(t, { v: { ex: 'confident', hR: [.3, lerp(.36, .95, k), lerp(.12, .35, k)], pR: [1, -.4, 0], hL: [-.3, .36, .12], pL: [-1, 0, -.5], head: [-6, 0, 0] } }); vicPower(t, .4 + .6 * k);
  const u = U(lt, 2.5, eOut); camR([.9, 1.0, .7], [-.6, 1.4, -.2], [.7, 1.0, .5], [-.6, 1.45, -.2], u, 42); dof(.4);
});
S('B15', 44.5, 'whip', (lt, t) => { // Bruno slammed down ("ร่างของบรูโน่ก็ถูกกดลงกับพื้นทันที")
  r12(); levitate(t, .6); const k = eOut(clamp(lt / .3)); fight(t, { v: vicUp, b: { hipY: -.38 * k, lean: 22 * k, ex: 'scared', sweat: true, hL: [-.4, .1, .4], hR: [.4, .1, .4], pL: [-1, 0, 0], pR: [1, 0, 0] } }); vicPower(t, 1);
  Wd.auraAt(2, W12(1.8, .4, 2.6), 2.4, .6); if (lt > .2 && lt < .7) SH.a = .6; const u = U(lt, 3.3, eSine); camR([-.4, 1.3, 3.3], [1.8, .8, 2.6], [-.2, 1.3, 3.2], [1.8, .8, 2.6], u, 44); dof(.3);
});
S('B16', 47.75, 'cut', (lt, t) => { // Ace dashes in ("เอซพยายามเข้าโจมตี")
  r12(); levitate(t, .6); const k = clamp(lt / 1.7); FIGHT.ace = [lerp(2.6, 1.0, k), -.3, -95]; fight(t, { v: vicUp, b: { hipY: -.38, lean: 22, ex: 'scared', sweat: true, hL: [-.4, .1, .4], hR: [.4, .1, .4], pL: [-1, 0, 0], pR: [1, 0, 0] }, a: { walk: { ph: lt * 14, stride: .24 }, lean: 15, ex: 'frown', ...runA(lt * 14) } }); FIGHT.ace = [2.6, -.3, -95]; vicPower(t, 1); const ax = lerp(2.6, 1.0, k); [0, 1, 2].forEach(i => Wd.streakAt(i, W12(ax + .8 + i * .2, .5 + i * .3, -.3), 0, 1.3 - i * .2, k < 1 ? .5 - i * .1 : 0)); Wd.auraCol(2, '#3af08a'); Wd.auraAt(2, W12(ax, .9, -.3), 1.4, .25);
  const u = U(lt, 2.1, eSine); camR([2.2, 1.2, -2.6], [1.6, 1.0, -.3], [.6, 1.2, -2.6], [.4, 1.0, -.3], u, 50); dof(.2);
});
const aceFloat = (t) => ({ a: { p: [1.0, .55 + .05 * Math.sin(t * 3), -.3], lean: 15, rx: 0, ex: 'shocked', sweat: true, blink: false, fL: [-.15, -.5, -.2], fR: [.15, -.45, .25], ...up2 } });
S('B17', 49.8, 'cut', (lt, t) => { // ...but he's caught mid-air ("แต่กลับถูกแรงโน้มถ่วงดึง จนเคลื่อนไหวไม่ได้")
  r12(); levitate(t, .6); fight(t, { v: { ...vicUp, ex: 'sly' }, b: { hipY: -.38, lean: 22, ex: 'scared', sweat: true, hL: [-.4, .1, .4], hR: [.4, .1, .4], pL: [-1, 0, 0], pR: [1, 0, 0] }, ...aceFloat(t) }); vicPower(t, 1); Wd.auraAt(3, W12(1.0, 1.4, -.3), 1.6, .3);
  if (lt < .3) SH.a = .4; const u = U(lt, 3.3, eSine); camR([2.0, 1.4, 2.6], [.3, 1.3, -.3], [1.8, 1.4, 2.3], [.3, 1.3, -.3], u, 50); dof(.2);
});
S('B18', 53.1, 'cut', (lt, t) => { // Krai analyses ("ไครเริ่มวิเคราะห์พลังของวิกเตอร์")
  r12(); levitate(t, .6); put(K(), CR, { p: [3.7, 0, 2.9], ry: -105, ex: 'calm', blink: blinkAt(t, 1), look: [-.5, 0], ...chin }); vicPower(t, 1, false); eyeGlow(sstep(.3, 1.2, lt), t);
  const u = U(lt, 2.5, eOut); camR([2.6, 1.4, 3.6], [3.7, 1.25, 2.9], [2.8, 1.4, 3.5], [3.7, 1.25, 2.9], u, 40); dof(.5);
});
S('B19', 55.6, 'cut', (lt, t) => { // he must concentrate: sweat on Victor's brow ("และพบว่าเขาต้องใช้สมาธิเพื่อควบคุมแรงโน้มถ่วง")
  r12(); levitate(t, .6 + .1 * Math.sin(t * 7)); fight(t, { v: { ...vicUp, ex: 'determined', sweat: true, head: [8, 0, 0], hR: [.3 + .02 * Math.sin(t * 30), .95, .35] }, b: { hipY: -.38, lean: 22, ex: 'scared', hL: [-.4, .1, .4], hR: [.4, .1, .4], pL: [-1, 0, 0], pR: [1, 0, 0] }, ...aceFloat(t) }); vicPower(t, .9 + .1 * Math.sin(t * 9));
  const u = U(lt, 4.0, eSine); camR([1.6, 1.5, .9], [-.6, 1.35, -.2], [1.45, 1.5, .8], [-.6, 1.35, -.2], u, 40); dof(.5);
});
S('B20', 59.6, 'cut', (lt, t) => { // Neo builds a noise maker ("ไครจึงสั่งให้นีโอสร้างอุปกรณ์ส่งเสียงรบกวน")
  r12(); levitate(t, .6); const n = N(); put(K(), CR, { p: [3.7, 0, 2.9], ry: -60, ex: 'determined', talk: talkAt(t), blink: blinkAt(t, 1), ...hip }); put(n, CR, { p: [4.1, 0, 1.9], ry: -150, ex: 'determined', sweat: true, blink: blinkAt(t, 3), head: [18, 0, 0], hL: [-.12 + .03 * Math.sin(t * 20), .55, .45], hR: [.12, .55 + .03 * Math.sin(t * 17), .45], pL: [-1, -.4, 0], pR: [1, -.4, 0] });
  propAt(XA.gadget, n, [0, .62, .5], [-.4, n.g.rotation.y, 0]); XA.led.material.opacity = (t * 4) % 1 < .5 ? .9 : .1; const gk = sstep(.2, 2.2, lt), gp = XA.gadget.position; if (gk < 1) Wd.scrapAt([gp.x, gp.y, gp.z], -150, gk, t, .28); XA.gadget.visible = gk > .95; Wd.auraCol(1, '#ffd23a'); Wd.auraAt(1, [gp.x, gp.y, gp.z], .9, .3 * (1 - .5 * gk)); const u = U(lt, 3.6, eSine); camR([3.2, 1.45, .2], [4.0, 1.0, 1.9], [3.3, 1.45, .4], [4.0, 1.0, 1.9], u, 46); dof(.3);
});
S('B21', 63.25, 'whip', (lt, t) => { // the noise, and Ace attacks from every side ("และให้เอซโจมตีจากหลายทิศทาง")
  r12(); levitate(t, .5); const n = N(); const ph = Math.floor(lt * 2.4) % 4, pos = [[1.0, -.3], [-.6, -1.4], [-1.9, -.1], [-.4, 1.1]][ph]; const dx = pos[0] - FIGHT.vic[0], dz = pos[1] - FIGHT.vic[1];
  fight(t, { v: { ex: 'worried', sweat: true, ry: 90 + Math.sin(lt * 6) * 40, ...vicUp }, b: { hipY: -.38, lean: 22, ex: 'frown', hL: [-.4, .1, .4], hR: [.4, .1, .4], pL: [-1, 0, 0], pR: [1, 0, 0] }, a: { p: [pos[0], 0, pos[1]], ry: Math.atan2(-dx, -dz) / D2R, lean: 20, ex: 'frown', ...pointR }, n: { ex: 'confident', ry: -120, hL: [-.12, .55, .45], hR: [.12, .55, .45], pL: [-1, -.4, 0], pR: [1, -.4, 0] } });
  propAt(XA.gadget, n, [0, .62, .5], [-.4, n.g.rotation.y, 0]); scene.updateMatrixWorld(); Wd.ringsAt([XA.gadget.position.x, XA.gadget.position.y, XA.gadget.position.z], t, 1, -60); vicPower(t, .8); const sk = 1 - ((lt * 2.4) % 1); Wd.streakAt(0, W12(pos[0], .7, pos[1]), Math.atan2(-dz, dx) / D2R, 1.2, .5 * sk); Wd.streakAt(1, W12(pos[0], 1.0, pos[1]), Math.atan2(-dz, dx) / D2R, .9, .35 * sk);
  if ((lt * 2.4) % 1 < .12) SH.a = .3; const u = U(lt, 2.1, eSine); camR([2.4, 2.4, 2.6], [-.4, .9, -.2], [2.2, 2.3, 2.4], [-.4, .9, -.2], u, 56);
});
S('B22', 65.35, 'cut', (lt, t) => { // Victor loses focus ("เมื่อวิกเตอร์เสียสมาธิ")
  r12(); const k = 1 - sstep(.2, 1.3, lt); levitate(t, .6 * k); put(VI(), CR, { p: [FIGHT.vic[0], 0, FIGHT.vic[1]], ry: 90, ex: 'scared', sweat: true, blink: false, head: [0, 0, Math.sin(lt * 10) * 8], hL: [-.32, 1.02, .02], hR: [.32, 1.02, .02], pL: [-1, -.2, 0], pR: [1, -.2, 0] }); vicPower(t, k, false);
  Wd.ringsAt(W12(FIGHT.vic[0] + .8, 1.3, FIGHT.vic[1]), t, .7, -90); const u = U(lt, 2.4, eOut); camR([.8, 1.35, .6], [-.6, 1.3, -.2], [.6, 1.35, .45], [-.6, 1.3, -.2], u, 40); dof(.45);
});
S('B23', 67.75, 'cut', (lt, t) => { // Bruno breaks free ("บรูโน่ก็สามารถหลุดออกมาได้")
  r12(); const k = eOut(sstep(.1, .9, lt)); put(B(), CR, { p: [1.8, 0, 2.6], ry: -110, hipY: -.38 * (1 - k), lean: 22 * (1 - k), ex: k > .7 ? 'confident' : 'frown', blink: blinkAt(t, 2), ...(k > .7 ? fist : { hL: [-.4, .1, .4], hR: [.4, .1, .4], pL: [-1, 0, 0], pR: [1, 0, 0] }) }); muscle(k); Wd.auraCol(1, '#ff4a3a'); Wd.auraAt(1, W12(1.8, 1.0, 2.6), 2.0 + .4 * k, .3 * sstep(0, .5, lt));
  if (lt > .1 && lt < .5) SH.a = .4; const u = U(lt, 2.2, eSine); camR([.4, 1.1, 3.6], [1.8, 1.0, 2.6], [.5, 1.2, 3.4], [1.8, 1.2, 2.6], u, 42); dof(.35);
});
S('B24', 70.0, 'cut', (lt, t) => { // everyone waits for the order to take the room ("แต่แทนที่ไครจะสั่งให้ทุกคนยึดห้อง")
  r12(); fight(t, { v: { p: [-1.4, 0, -.4], ex: 'worried', sweat: true, ...hug }, b: { ry: -140, ex: 'confident', ...fist }, a: { p: [1.6, 0, .6], ry: -150, ex: 'confident' }, n: { ry: -150, ex: 'happy' }, k: { ex: 'calm', blink: blinkAt(t, 1), ...chin } });
  const u = U(lt, 2.9, eSine); camR([2.2, 1.6, -1.4], [3.0, 1.1, 2.0], [2.4, 1.6, -1.2], [3.0, 1.1, 2.0], u, 52); dof(.15);
});
S('B25', 72.9, 'whip', (lt, t) => { // "เขากลับสั่งให้ถอยทันที"
  r12(); XA.doorP.rotation.y = 1.4; const k = clamp((lt - .6) / 1.4); fight(t, { v: { p: [-1.4, 0, -.4], ex: 'sly', ...hip }, b: { p: [lerp(1.8, 4.6, k), 0, lerp(2.6, 3.4, k)], ry: 80, walk: { ph: lt * 12, stride: .2 }, ex: 'shocked', ...runA(lt * 12) }, a: { p: [lerp(1.6, 4.4, k), 0, lerp(.6, 3.0, k)], ry: 60, walk: { ph: lt * 12 + 1, stride: .2 }, ex: 'worried', ...runA(lt * 12 + 1) }, n: { p: [lerp(4.1, 4.9, k), 0, lerp(1.8, 3.8, k)], ry: 30, walk: { ph: lt * 12 + 2, stride: .2 }, ex: 'worried', ...runA(lt * 12 + 2) }, k: { ry: -150, ex: 'frown', talk: talkAt(t), ...pointR } });
  const u = U(lt, 1.9, eSine); camR([1.4, 1.5, 4.8], [3.6, 1.1, 2.6], [1.6, 1.5, 4.7], [3.8, 1.1, 2.8], u, 50); dof(.15);
});
S('B26', 74.8, 'cut', (lt, t) => { // back on the roof: Bruno asks why ("บรูโน่ถามด้วยความสงสัยว่า เราชนะแล้ว ทำไมไม่ยึดห้องมัน")
  city(); const x = 3.0 - lt * .4; put(B(), CT, { p: [x - .9, 0, 3.6], ry: lt < 2 ? -80 : 60, walk: lt < 2 ? { ph: lt * 6, stride: .12 } : null, ex: 'frown', talk: talkAt(t), blink: blinkAt(t, 2), ...(lt > 2 ? { hL: [-.36, .6, .3], hR: [.36, .6, .3], pL: [-1, -.4, 0], pR: [1, -.4, 0] } : hip) });
  put(K(), CT, { p: [x - .1, 0, 3.4], ry: lt < 2 ? -80 : -100, walk: lt < 2 ? { ph: lt * 6 + 1, stride: .12 } : null, ex: 'calm', blink: blinkAt(t, 1), ...hip });
  const u = U(lt, 5.2, eSine); camC([x - 1.6, 1.4, 6.6], [x - .5, 1.15, 3.5], [x - 1.4, 1.4, 6.0], [x - .5, 1.15, 3.5], u, 44); dof(.2);
});
S('B27', 79.95, 'cut', (lt, t) => { // "เพราะฉันเห็นบางอย่างที่นายไม่เห็น"
  city(); put(K(), CT, { p: [1.4, 0, 3.4], ry: -60, ex: lt > 1.4 ? 'sly' : 'calm', talk: talkAt(t), blink: blinkAt(t, 1), head: [0, 0, lt > 1.4 ? -5 : 0], ...hip });
  const u = U(lt, 4.0, eIn); camC([.3, 1.4, 4.4], [1.4, 1.25, 3.4], [.55, 1.35, 4.15], [1.4, 1.25, 3.4], u, 40); dof(.5);
});
S('B28', 83.95, 'cut', (lt, t) => { // back in room 07 ("เมื่อพวกเขากลับถึงห้อง")
  room(); Wd.screen('glitch', Math.floor(lt * 12), 0, .3); const k = clamp(lt / 1.6); [K, B, N, A].forEach((C, i) => put(C(), CR, { p: [lerp(4.6, 3.0 - i * .7, k), 0, lerp(3.4, 2.4 - (i % 2) * .7, k)], ry: -120, walk: k < 1 ? { ph: lt * 7 + i, stride: .12 } : null, ex: 'calm', blink: blinkAt(t, i + 1), ...hip }));
  const u = U(lt, 1.9, eSine); camR([.2, 1.6, 4.6], [3.0, 1.1, 2.2], [.4, 1.6, 4.4], [2.6, 1.1, 2.0], u, 50); dof(.15);
});
S('B29', 85.85, 'cut', (lt, t) => { // Victor smiles on the screen ("หน้าจอแสดงภาพของวิกเตอร์ที่กำลังยิ้มอยู่")
  room(); Wd.screen('victor', 0, 0, .5); team(t, { b: { p: [-1.5, 0, .9], ry: 180, ex: 'shocked' }, n: { p: [1.5, 0, .8], ry: 170, ex: 'shocked' }, a: { p: [-.5, 0, 1.3], ry: 190, ex: 'frown' } }); put(K(), CR, { p: [.6, 0, 1.2], ry: 180, ex: 'frown', ...hip });
  const u = U(lt, 3.4, eSine); camR([0, 1.85, 3.0], [0, 2.0, -4.9], [0, 1.9, 2.3], [0, 2.0, -4.9], u, 56);
});
S('B30', 89.2, 'cut', (lt, t) => { // "การทดสอบพฤติกรรมของห้องหมายเลข 07 เสร็จสมบูรณ์"
  room(); Wd.screen('test07', t > 93.2 ? 1 : 0, 0, .55); team(t, { b: { p: [-1.5, 0, .9], ry: 180, ex: 'shocked' }, n: { p: [1.5, 0, .8], ry: 170, ex: 'scared', sweat: true }, a: { p: [-.5, 0, 1.3], ry: 190, ex: 'shocked' } }); put(K(), CR, { p: [.6, 0, 1.2], ry: 180, ex: 'frown', ...hip });
  const u = U(lt, 4.0, eSine); camR([0, 1.85, 2.4], [0, 2.0, -4.9], [0, 1.9, 1.9], [0, 2.0, -4.9], u, 56);
});
S('B31', 93.95, 'cut', (lt, t) => { // Krai's face in the green light
  room(); Wd.screen('test07', 1, 0, .6); XA.roomDesks.visible = false; put(K(), CR, { p: [.4, 0, .3], ry: 180, ex: 'determined', blink: blinkAt(t, 1), ...hip }); const p = Wd.pts[1]; p.position.set(-300, -2.0, -3.6); p.color.set('#6aff9a'); p.intensity = 2.5;
  const u = U(lt, 2.4, eIn); camR([.3, 1.4, -1.6], [.4, 1.25, .3], [.35, 1.35, -1.2], [.4, 1.25, .3], u, 40); dof(.5);
});
export const COVER = { id: 'COVER', t0: 0, fn: (lt, t, o = {}) => {
  r12(); levitate(2, .8); fight(2, { v: { ...vicUp, ex: 'sly' }, b: { hipY: -.38, lean: 22, ex: 'scared', sweat: true, hL: [-.4, .1, .4], hR: [.4, .1, .4], pL: [-1, 0, 0], pR: [1, 0, 0] }, ...aceFloat(2), k: { ex: 'determined', ry: -120 } }); vicPower(2, 1); Wd.auraAt(3, W12(1.0, 1.4, -.3), 2.2, .55);
  const cm = o.cam || [1.9, 1.35, .9], g = o.tgt || [-.6, 1.45, -.2]; camR(cm, g, cm, g, 0, o.fov || 50);
} };
