// ===================== EP 1 (105.86 s) =====================
const KIDS = [[-1.3, -.8], [1.4, -.5], [-2.4, -2.0], [2.5, -1.8]];
S('A01', 0, 'cut', (lt, t) => { // class is over: students walk out ("ในขณะที่นักเรียนกำลังเดินออกจากห้องเรียนหลังหมดคาบ")
  school(); const z = -7 + lt * 1.0; put(K(), SC, { p: [0, 0, z], ry: 0, walk: { ph: lt * 7, stride: .12 }, ex: 'calm', blink: blinkAt(t, 1), ...hip });
  KIDS.forEach(([x, dz], i) => put(STU(i), SC, { p: [x, 0, z + dz], ry: i % 2 ? -8 : 8, walk: { ph: lt * 7 + i, stride: .12 }, ex: ['happy', 'confident', 'neutral', 'happy'][i], talk: i < 2 ? (Math.sin(t * 9 + i) > .3 ? .5 : 0) : 0, blink: blinkAt(t, i + 2), ...hip }));
  const u = U(lt, 3.8, eSine); camS([1.4, 1.5, z + 5.6], [0, 1.2, z - 1], [.8, 1.4, z + 4.9], [0, 1.2, z - 1], u, 42); dof(.2);
});
S('A02', 3.75, 'cut', (lt, t) => { // a roar of helicopters: everybody looks up ("จู่ ๆ เสียงเฮลิคอปเตอร์จำนวนมาก ก็ดังขึ้นเหนือโรงเรียน")
  school(); const z = -3.3, up = sstep(.2, .8, lt); SH.a = .15 + up * .2;
  put(K(), SC, { p: [0, 0, z], ry: 0, ex: lt > .5 ? 'shocked' : 'calm', blink: false, head: [-28 * up, 0, 0], ...hip });
  KIDS.forEach(([x, dz], i) => put(STU(i), SC, { p: [x, 0, z + dz], ry: i % 2 ? -10 : 10, ex: lt > .6 ? ['scared', 'shocked', 'worried', 'shocked'][i] : 'neutral', blink: false, head: [-25 * sstep(.3 + i * .1, .9 + i * .1, lt), (i % 2 ? 10 : -10), 0], ...(i === 0 ? hug : hip) }));
  for (let i = 0; i < 3; i++) Wd.heliAt(i, [300 + (i - 1) * 9, 21 + i * 2, -24 + lt * 6 + i * 3], 180, t, .12);
  const u = U(lt, 2.2, eSine); camS([0, .55, 1.4], [0, 3.2, -5], [0, .6, 1.0], [0, 3.6, -5], u, 52); dof(.15);
});
S('A03', 5.95, 'cut', (lt, t) => { // the helicopters sweep over the school roof
  school(); SH.a = .25; for (let i = 0; i < 3; i++) Wd.heliAt(i, [300 + (i - 1) * 10, 15 + i * 1.5, -32 + lt * 6 + i * 3], 180 + (i - 1) * 6, t, .1);
  const u = U(lt, 2.6, eSine); camS([4, 1.2, 10], [0, 11, -16], [3, 1.2, 9], [0, 12, -14], u, 50);
});
S('A04', 8.55, 'whip', (lt, t) => { // not bombs: a school desk tumbles out ("แต่สิ่งที่พวกมันปล่อยลงมา ไม่ใช่ระเบิด")
  school(); SH.a = .2; Wd.heliAt(0, [300, 22, -4], 180, t, .05); Wd.heliAt(1, [312, 24, -10], 170, t, .05); deskFall(0, 0, -4, 8.55 + .7, t, { h0: 19.5, s: 1.3 });
  const u = U(lt, 2.9, eSine); camS([3, 1.6, 9], [0, 15, -4], [2.6, 1.6, 8.4], [0, 13, -4], u, 50);
});
const RAIN = [[-3, -2, 11.7], [4, -5, 11.9], [2.6, 4.2, 12.2], [-5, 3, 12.4], [6, 1, 12.6], [-1, -6, 12.8], [3, 5, 13.0], [-6, -4, 13.3], [2, -1, 13.5]];
const rain = (t) => RAIN.forEach(([x, z, t0], i) => deskFall(i, x, z, t0, t, { h0: 22 }));
S('A05', 11.75, 'cut', (lt, t) => { // desks rain down on the courtyard ("กลับเป็นโต๊ะเรียนจำนวนมหาศาล")
  school(); rain(t); SH.a = .25; for (let i = 0; i < 3; i++) Wd.heliAt(i, [300 + (i - 1) * 12, 20, -6 + i * 4], 180, t, .05);
  KIDS.forEach(([x, dz], i) => { const k = lt * 2.2; put(STU(i), SC, { p: [x * (1 + lt * .35), 0, -2 + dz + (i % 2 ? k : -k) * .3], ry: x < 0 ? -60 : 60, walk: { ph: lt * 13 + i, stride: .2 }, ex: 'scared', blink: false, ...runA(lt * 13 + i) }); });
  const u = U(lt, 2.9, eSine); camS([7, 5.5, 15], [0, 3.5, -2], [6, 5, 14], [0, 3.5, -2], u, 52);
});
S('A06', 14.65, 'cut', (lt, t) => { // Krai freezes ("ก่อนที่ทุกคนจะทันตั้งตัว")
  school(); rain(t); SH.a = .2; put(K(), SC, { p: [.4, 0, 1.6], ry: -10, ex: 'shocked', sweat: true, blink: false, head: [-10, 0, 0], ...hug });
  const u = U(lt, 2.1, eOut); camS([.2, 1.35, 4.3], [.4, 1.25, 1.6], [.25, 1.35, 3.8], [.4, 1.25, 1.6], u, 40); dof(.5);
});
S('A07', 16.75, 'cut', (lt, t) => { // dozens of strangers rappel down ("ชายแปลกหน้าหลายสิบคน ก็โรยตัวลงมาจากเฮลิคอปเตอร์")
  school(); rain(t); SH.a = .12; Wd.heliAt(0, [300, 14, -3], 180, t, 0); Wd.heliAt(1, [312, 16, -9], 170, t, 0);
  [[-1.2, -3.1, 0], [1.2, -3.1, .5], [-.4, -2.0, 1.0]].forEach(([x, z, d], i) => { const y = Math.max(0, 12.2 - Math.max(0, lt - d) * 4.2); Wd.ropeAt(i, [300 + x, 12.4, z], 12.4); put(TR(i), SC, { p: [x, y, z + .25], ry: 180 + (i - 1) * 20, ex: 'frown', blink: false, ...(y > 0 ? up2 : hip), fL: y > 0 ? [-.1, -.5, .1] : undefined, fR: y > 0 ? [.12, -.6, -.05] : undefined }); });
  const u = U(lt, 4.3, eSine); camS([5, 2.2, 9], [0, 6, -3], [4.4, 1.8, 8.2], [0, 4, -3], u, 48);
});
S('A08', 21.1, 'whip', (lt, t) => { // they chase students like madmen ("พวกมันเริ่มไล่จับนักเรียนอย่างบ้าคลั่ง")
  school(); rain(30); const x = -4 + lt * 3.2;
  put(STU(1), SC, { p: [x + 1.7, 0, 2.0], ry: 90, walk: { ph: lt * 14, stride: .22 }, ex: 'scared', blink: false, ...runA(lt * 14) }); put(STU(0), SC, { p: [x + 2.6, 0, 2.8], ry: 95, walk: { ph: lt * 14 + 1, stride: .22 }, ex: 'scared', sweat: true, blink: false, ...up2 });
  put(TR(0), SC, { p: [x, 0, 2.3], ry: 90, walk: { ph: lt * 14 + 2, stride: .24 }, ex: 'frown', blink: false, ...pointR }); put(TR(1), SC, { p: [x - 1.0, 0, 3.2], ry: 85, walk: { ph: lt * 14 + 3, stride: .24 }, ex: 'frown', blink: false, ...runA(lt * 14 + 3) });
  const u = U(lt, 3.3, eSine); camS([x + .9, 1.4, 10.5], [x + .9, 1.0, 2.5], [x + 1.3, 1.4, 10.0], [x + 1.3, 1.0, 2.5], u, 46); dof(.15);
});
S('A09', 24.35, 'cut', (lt, t) => { // Krai dashes and ducks under a fallen desk ("ไครรีบวิ่งไปหลบใต้โต๊ะที่ตกลงมา")
  school(); rain(30); heroDesk(0, 0, 0); const k = clamp(lt / 1.4), dn = sstep(1.2, 1.7, lt);
  put(K(), SC, { p: [lerp(3.2, .1, k), 0, lerp(2.6, .25, k)], ry: lerp(-60, 0, dn), walk: k < 1 ? { ph: lt * 14, stride: .22 } : null, ex: 'scared', sweat: true, blink: false, hipY: -.46 * dn, lean: 22 * dn, ...(k < 1 ? runA(lt * 14) : hug) });
  if (lt < 2) put(TR(2), SC, { p: [-3 + lt * 1.5, 0, -3], ry: 70, walk: { ph: lt * 12, stride: .22 }, ex: 'frown', ...runA(lt * 12) });
  const u = U(lt, 2.9, eSine); camS([3.6, 1.4, 5.4], [.8, .8, .5], [2.6, 1.1, 4.4], [.1, .7, .3], u, 44); dof(.2);
});
S('A10', 27.25, 'cut', (lt, t) => { // holding his breath ("พยายามกลั้นหายใจ และไม่ส่งเสียง")
  school(); rain(30); heroDesk(0, 0, 0); put(K(), SC, { p: [.1, 0, .25], ry: 0, ex: 'scared', sweat: true, blink: false, look: [Math.sin(lt * 2) * .6, 0], ...crouch, ...mouthH });
  const u = U(lt, 2.9, eSine); camS([.25, .7, 2.3], [.1, .72, .25], [.2, .7, 2.0], [.1, .72, .25], u, 40); dof(.5);
});
S('A11', 30.15, 'cut', (lt, t) => { // footsteps stop right in front of him ("แต่แล้ว เสียงฝีเท้าก็หยุดอยู่ตรงหน้าเขา")
  school(); rain(30); heroDesk(0, 0, 0); const k = clamp(lt / 2.2); put(BO(), SC, { p: [.1, 0, lerp(6, 2.0, k)], ry: 180, walk: k < 1 ? { ph: lt * 6, stride: .12 } : null, ex: 'calm', ...hip });
  SH.a = k < 1 && Math.sin(lt * 6) > .9 ? .15 : 0; const u = U(lt, 3.6, eSine); camS([.05, .38, .7], [.1, .45, 4], [.05, .36, .8], [.1, .42, 4], u, 46); dof(.2);
});
S('A12', 33.75, 'cut', (lt, t) => { // a man dressed unlike the others bends down to look ("ชายคนหนึ่งที่แต่งตัวแตกต่างจากคนอื่น ก้มลงมอง")
  school(); rain(30); heroDesk(0, 0, 0); const b = sstep(1.8, 3.2, lt); put(BO(), SC, { p: [.1, 0, 2.0], ry: 180, lean: 34 * b, hipY: -.12 * b, ex: b > .5 ? 'sly' : 'calm', blink: blinkAt(t, 5), head: [10 * b, 0, 12 * b], hR: [.3, .36, .12], pR: [1, 0, -.5], hL: [-.25, .3, .3], pL: [-1, 0, 0] });
  const u = U(lt, 4.2, eSine); camS([.05, .62, .5], [.1, 1.6, 2.0], [.05, .6, .55], [.1, 1.05, 1.9], u, 46); dof(.3);
});
S('A13', 37.95, 'cut', (lt, t) => { // the needle, then darkness ("ก่อนจะฉีดยาใส่เขาจนหมดสติ")
  school(); rain(30); heroDesk(0, 0, 0); const st = sstep(.4, .8, lt); const bo = BO();
  put(bo, SC, { p: [.7, 0, 1.6], ry: 205, lean: 30, hipY: -.12, ex: 'sly', blink: blinkAt(t, 5), hR: [.2, lerp(.6, .45, st), lerp(.5, .78, st)], pR: [1, -.4, 0], hL: [-.3, .36, .12], pL: [-1, 0, -.5] });
  XA.syr.visible = true; XA.syr.position.set(300 + lerp(.55, .4, st), lerp(1.15, .95, st), lerp(1.05, .62, st)); XA.syr.rotation.set(1.2, 0, -.3);
  put(K(), SC, { p: [.1, 0, .3], ry: 0, ex: lt > .8 ? (lt > 1.4 ? 'sleepy' : 'shocked') : 'scared', sweat: true, blink: lt > 1.7, ...crouch, ...hug });
  Wd.black(sstep(1.2, 2.3, lt)); const u = U(lt, 2.4, eSine); camS([-.7, .85, 3.1], [.15, .8, .4], [-.6, .85, 2.8], [.15, .8, .4], u, 44); dof(.3);
});
// --- THE STRANGE CLASSROOM ---
S('A14', 40.65, 'cut', (lt, t) => { // he opens his eyes ("เมื่อไครลืมตาขึ้นอีกครั้ง")
  room(); const op = sstep(.2, 1.4, lt); Wd.black(1 - op + (lt > .6 && lt < .8 ? .6 : 0)); put(K(), CR, { p: [.2, 0, 3.2], ry: 20, sit: true, seat: .05, ex: op < .8 ? 'sleepy' : 'shocked', blink: lt < .9, head: [8, 0, 10 * (1 - op)], ...hip });
  const u = U(lt, 2.3, eOut); camR([.6, 1.15, 5.0], [.2, .75, 3.2], [.5, 1.1, 4.6], [.2, .75, 3.2], u, 40); dof(.45);
});
S('A15', 42.95, 'cut', (lt, t) => { // a strange classroom ("เขากลับพบว่า ตัวเองอยู่ในห้องเรียนประหลาด")
  room(); put(K(), CR, { p: [.6, 0, 1.8], ry: lerp(30, -40, eSine(clamp(lt / 2.8))), ex: 'worried', blink: blinkAt(t, 1), head: [-8, 0, 0], ...hip });
  const u = U(lt, 3.2, eSine); camR([3.4, 2.0, 5.0], [-.2, 1.1, -.6], [3.0, 1.9, 4.8], [0, 1.1, -.8], u, 50); dof(.1);
});
S('A16', 46.05, 'cut', (lt, t) => { // three other students ("พร้อมนักเรียนอีก 3 คน")
  room(); team(t); put(K(), CR, { p: [.4, 0, 2.6], ry: 180, ex: 'worried', ...hip });
  const u = U(lt, 2.2, eSine); camR([.9, 1.6, 4.7], [0, 1.1, -1.0], [.8, 1.55, 4.4], [0, 1.1, -1.0], u, 56); dof(.15);
});
S('A17', 48.25, 'cut', (lt, t) => { // Bruno, the big guy
  room(); team(t, { b: { ex: lt > .6 ? 'confident' : 'frown', head: [-6, 0, 0] } }); const u = U(lt, 2.2, eOut); camR([-.8, 1.45, 1.3], [-1.4, 1.35, -.7], [-.85, 1.45, 1.0], [-1.4, 1.35, -.7], u, 40); dof(.45);
});
S('A18', 50.45, 'cut', (lt, t) => { // Neo, the inventor, with a blinking gadget
  room(); const n = N(); team(t, { n: { ex: 'happy', head: [16, 0, 0], hL: [-.12, .55, .45], hR: [.12, .55, .45], pL: [-1, -.4, 0], pR: [1, -.4, 0] } }); propAt(XA.gadget, n, [0, .62, .5], [-.4, n.g.rotation.y, 0]); XA.led.material.opacity = (t * 3) % 1 < .5 ? .9 : .1;
  const u = U(lt, 1.9, eOut); camR([.9, 1.35, .9], [1.4, 1.15, -.9], [.95, 1.35, .6], [1.4, 1.15, -.9], u, 40); dof(.45);
});
S('A19', 52.35, 'cut', (lt, t) => { // Ace, the athlete, bouncing a ball
  room(); const a = A(), bc = Math.abs(Math.sin(lt * 5)); team(t, { a: { ex: 'confident', hR: [.3, .2 + bc * .25, .35], pR: [1, -.3, 0] } }); scene.updateMatrixWorld(); const h = a.torso.localToWorld(V(.3, .2 + bc * .25, .35)); XA.ball.visible = true; XA.ball.position.set(h.x, lerp(-4 + .12, h.y - .14, bc), h.z);
  const u = U(lt, 2.5, eOut); camR([.3, 1.3, .3], [.1, 1.1, -2.0], [.25, 1.3, -.05], [.1, 1.1, -2.0], u, 40); dof(.45);
});
S('A20', 54.85, 'cut', (lt, t) => { // the giant screen flickers on ("ทันใดนั้น หน้าจอขนาดใหญ่ก็เปิดขึ้น")
  room(); const on = lt > .5; Wd.screen(!on ? 'off' : lt < .9 ? 'glitch' : 'boot', lt < .9 ? Math.floor(lt * 20) : Math.round(clamp((lt - .9) / 1.6) * 10) / 10, 0, on ? .5 : 0);
  team(t, { b: { ry: 180 }, n: { ry: 170, ex: 'shocked' }, a: { ry: 190, ex: 'shocked' } }); put(K(), CR, { p: [.4, 0, 1.4], ry: 180, ex: 'shocked', ...hip });
  if (lt > .5 && lt < .7) SH.a = .3; const u = U(lt, 3.5, eSine); camR([.6, 1.6, 5.0], [0, 1.8, -4.8], [.4, 1.6, 4.4], [0, 1.9, -4.8], u, 52);
});
S('A21', 58.35, 'cut', (lt, t) => { // "ยินดีต้อนรับสู่เกมเอาชีวิตรอด"
  room(); Wd.screen('welcome', 0, 0, .55); team(t, { b: { ry: 180 }, n: { ry: 170, ex: 'shocked' }, a: { ry: 190, ex: 'worried' } }); put(K(), CR, { p: [.4, 0, 1.4], ry: 180, ex: 'shocked', ...hip });
  const u = U(lt, 2.7, eSine); camR([0, 1.85, 2.4], [0, 2.0, -4.9], [0, 1.9, 2.0], [0, 2.0, -4.9], u, 56);
});
S('A22', 61.05, 'cut', (lt, t) => { // their faces in the blue light ("เป้าหมายของพวกคุณ คือเป็นห้องสุดท้ายที่ยังเหลืออยู่")
  room(); Wd.screen('goal', 0, 0, .6); team(t, { b: { p: [-1.5, 0, .2], ry: 180, ex: 'frown' }, n: { p: [1.5, 0, .1], ry: 170, ex: 'worried', sweat: true }, a: { p: [-.55, 0, .7], ry: 190, ex: 'determined' } }); put(K(), CR, { p: [.5, 0, .6], ry: 180, ex: 'determined', blink: blinkAt(t, 1), ...hip });
  const p = Wd.pts[1]; p.position.set(-300, -2.0, -3.6); p.color.set('#6ad0ff'); p.intensity = 3; XA.roomDesks.visible = false; const u = U(lt, 3.9, eSine); camR([.2, 2.3, -4.4], [0, 1.0, .5], [.15, 2.2, -4.1], [0, 1.0, .5], u, 56); dof(.15);
});
S('A23', 64.95, 'cut', (lt, t) => { // Krai walks out to look around ("ไครเดินไปสำรวจด้านนอก")
  room(); Wd.screen('goal', 0, 0, .4); const k = clamp(lt / 2.0); put(K(), CR, { p: [lerp(2.4, 4.6, k), 0, lerp(2.0, 3.6, k)], ry: 60, walk: { ph: lt * 7, stride: .12 }, ex: 'determined', ...hip }); XA.doorP.rotation.y = -1.4 * sstep(.3, 1.0, lt);
  const u = U(lt, 2.2, eSine); camR([.8, 1.4, .8], [3.8, 1.1, 3.0], [1.2, 1.4, .9], [4.4, 1.1, 3.4], u, 44); dof(.2);
});
// --- THE ROOFTOP & THE CITY ---
S('A24', 67.15, 'cut', (lt, t) => { // he steps onto the roof: crane up ("และพบว่าตัวเองอยู่ในตึกสูงใจกลางเมือง")
  city(); const k = clamp(lt / 2.6); put(K(), CT, { p: [lerp(2.9, 1.0, k), 0, lerp(-1.6, 3.6, k)], ry: -20, walk: k < 1 ? { ph: lt * 7, stride: .12 } : null, ex: 'shocked', blink: false, head: [-6, 0, 0], ...hip });
  const u = U(lt, 5.0, eIO); camC([1.0, 1.5, 7.5], [1.8, 1.0, 1.0], [6, 14, 26], [0, -4, -20], u, 46);
});
S('A25', 72.15, 'whip', (lt, t) => { // more frightening: Krai at the edge ("แต่สิ่งที่น่ากลัวกว่านั้นคือ")
  city(); put(K(), CT, { p: [1.0, 0, 4.4], ry: -30, ex: 'scared', sweat: true, blink: false, head: [12, 0, 0], ...hip }); SH.a = .1;
  const u = U(lt, 2.4, eSine); camC([-.6, 1.5, 6.8], [1.0, 1.2, 4.4], [-.4, 1.4, 6.4], [1.0, 1.2, 4.4], u, 42); dof(.3);
});
S('A26', 74.55, 'cut', (lt, t) => { // a black giant patrols between the towers
  city(); const z = -100 + lt * 4.0; Wd.monAt([15 - 300, -40, z], 180, lt * 2.2, .55, { s: 1.08, hy: Math.sin(lt * .8) * 15 }); SH.a = Math.abs(Math.sin(lt * 2.2)) > .97 ? .35 : 0;
  const u = U(lt, 4.3, eSine); camC([13, 3, -24], [15, -14, -85], [13.5, 2.5, -26], [15, -12, -85], u, 50);
});
S('A27', 78.85, 'cut', (lt, t) => { // Krai walks on, and finds strange stones ("ระหว่างทาง ไครพบหินประหลาดที่มีสัญลักษณ์แตกต่างกัน")
  city(); const k = clamp(lt / 2.2); put(K(), CT, { p: [lerp(1.0, -1.9, k), 0, lerp(3.0, 1.6, k)], ry: -100, walk: k < 1 ? { ph: lt * 7, stride: .12 } : null, ex: k < 1 ? 'worried' : 'shocked', head: [k * 20, 0, 0], blink: false, ...hip });
  [[-3.2, .9], [-2.9, 1.7], [-3.7, 1.5], [-3.4, 2.4]].forEach(([x, z], i) => Wd.stoneAt([5, 8, 6, 7][i], [x - 300, 0, z], t));
  const u = U(lt, 4.3, eSine); camC([-.4, 1.6, 6.6], [-2.2, .8, 1.6], [-1.0, 1.4, 5.8], [-2.5, .7, 1.6], u, 44); dof(.15);
});
const STONES = (t, k = 1) => [[-3.2, .9], [-2.9, 1.7], [-3.7, 1.5], [-3.4, 2.4]].forEach(([x, z], i) => Wd.stoneAt([5, 8, 6, 7][i], [x - 300, 0, z], t, i === 1 ? k : 1));
S('A28', 83.5, 'cut', (lt, t) => { // he touches one ("เมื่อสัมผัสมัน")
  city(); const r = sstep(0, .7, lt); STONES(t, 1 + r * .7); put(K(), CT, { p: [-2.1, 0, 1.75], ry: -95, ex: 'determined', blink: false, ...crouch, hR: [.25, lerp(.4, .05, r), lerp(.3, .55, r)], pR: [1, -.4, 0], hL: [-.3, .36, .12], pL: [-1, 0, -.5] });
  Wd.flash(sstep(.6, .9, lt) * .35 * (1 - sstep(.9, 1.3, lt))); const u = U(lt, 1.4, eOut); camC([-1.6, 1.3, 4.8], [-2.5, .55, 1.6], [-1.7, 1.25, 4.5], [-2.5, .55, 1.6], u, 40); dof(.4);
});
S('A29', 84.9, 'cut', (lt, t) => { // a window pops up ("หน้าจอก็ปรากฏข้อความว่า หินพลังพิเศษ ...")
  city(); STONES(t); const k = K(); put(k, CT, { p: [-2.0, 0, 2.2], ry: 20, ex: lt > 3.9 ? 'happy' : 'shocked', blink: blinkAt(t, 1), ...hug }); Wd.stoneAt(8, [0, 0, 0], t, 1.2); propAt(XA.stones[8], k, [0, .33, .42]);
  Wd.uiAt(eOut(clamp(lt / .35)), 'stone', t > 88.7 ? 1 : 0, 0, -1.6, .3); const u = U(lt, 7.5, eSine); camC([-1.4, 1.55, 6.0], [-2.0, 1.25, 2.2], [-1.6, 1.5, 5.2], [-2.0, 1.2, 2.2], u, 42); dof(.25);
});
S('A30', 92.4, 'whip', (lt, t) => { // an explosion on the tower across ("ทันใดนั้น เสียงระเบิดก็ดังขึ้นจากตึกฝั่งตรงข้าม")
  city(); const T = BOOMT(); Wd.boomAt([T.x - 300, T.top - 5, -30 + T.d / 2 + 1], Math.max(0, lt - .25) * 1.4); if (lt > .25 && lt < 1.3) SH.a = .7 * (1 - (lt - .25)); Wd.flash(lt > .25 && lt < .6 ? .35 : 0);
  put(K(), CT, { p: [.6, 0, 1.0], ry: lerp(0, 160, sstep(.4, .9, lt)), ex: 'shocked', blink: false, ...(lt > .5 ? up2 : hug) }); const p = Wd.pts[1]; p.position.set(T.x - 300, T.top - 4, -20); p.color.set('#ff9a4a'); p.intensity = lt > .25 ? 60 * Math.max(0, 1 - (lt - .25) / 2) : 0; p.distance = 80;
  const u = U(lt, 3.2, eSine); camC([1.6, 3.6, 5.4], [T.x * .8, T.top - 5, -28], [1.4, 3.6, 5.0], [T.x * .8, T.top - 5, -28], u, 46);
});
S('A31', 95.65, 'cut', (lt, t) => { // he runs back ("ไครรีบวิ่งกลับห้องพร้อมพูดว่า")
  city(); const T = BOOMT(); Wd.boomAt([T.x - 300, T.top - 5, -30 + T.d / 2 + 1], 3.2 * 1.4 + lt * .6); const k = clamp(lt / 2.6);
  put(K(), CT, { p: [lerp(.6, 2.9, k), 0, lerp(1.0, -1.8, k)], ry: 140, walk: { ph: lt * 14, stride: .22 }, ex: 'determined', blink: false, ...runA(lt * 14) });
  const u = U(lt, 3.5, eSine); camC([-1.5, 1.5, 4.6], [1.6, 1.0, -.6], [-1.0, 1.5, 3.8], [2.6, 1.0, -1.6], u, 46); dof(.15);
});
S('A32', 99.15, 'cut', (lt, t) => { // back in the room: "เราต้องเตรียมตัวให้พร้อม"
  room(); Wd.screen('goal', 0, 0, .35); const k = eOut(clamp(lt / .8)); put(K(), CR, { p: [lerp(2.2, 1.2, k), 0, lerp(-.6, -.2, k)], ry: -8, ex: 'determined', talk: talkAt(t), blink: blinkAt(t, 1), ...fist });
  put(B(), CR, { p: [-.3, 0, 2.5], ry: 160, ex: 'shocked', blink: blinkAt(t, 2), ...fold }); put(N(), CR, { p: [1.7, 0, 2.3], ry: 210, ex: 'worried', blink: blinkAt(t, 3), ...hug }); put(A(), CR, { p: [2.4, 0, 2.0], ry: 220, ex: 'calm', blink: blinkAt(t, 4), ...hip });
  const u = U(lt, 2.9, eSine); camR([0, 1.8, 4.9], [1.0, 1.2, -.2], [.2, 1.75, 4.7], [1.0, 1.2, -.2], u, 58); dof(.15);
});
S('A33', 102.05, 'cut', (lt, t) => { // "เพราะเกมนี้ไม่ได้มีแค่พวกนักเรียนที่เป็นศัตรูของเรา": the giant passes the window
  room(); put(K(), CR, { p: [-3.4, 0, 2.2], ry: 90, ex: 'determined', talk: talkAt(t), blink: blinkAt(t, 1), ...hip }); Wd.monAt([-17 - 300, -42.5, 12 - lt * 5], 180, lt * 2.2, .9, { s: 1.08, hy: -50 });
  const u = U(lt, 3.8, eIn); camR([-.8, 1.4, 2.6], [-3.6, 1.55, 2.2], [-1.6, 1.38, 2.4], [-3.6, 1.5, 2.2], u, 44); dof(.25);
});
export const COVER = { id: 'COVER', t0: 0, fn: (lt, t, o = {}) => {
  city(); Wd.monAt([10 - 300, -40, -48], 200, .6, 1, { s: 1.5, hy: 25 }); const k = K(); put(k, CT, { p: [.4, 0, 2.6], ry: 10, ex: 'determined', ...hug }); Wd.stoneAt(8, [0, 0, 0], 3, 1.3); propAt(XA.stones[8], k, [0, .45, .42]);
  put(B(), CT, { p: [-.9, 0, 1.6], ry: 20, ex: 'frown', ...fold }); put(N(), CT, { p: [1.6, 0, 1.7], ry: -15, ex: 'worried', ...hip }); put(A(), CT, { p: [.5, 0, .9], ry: 0, ex: 'confident', ...hip });
  const cm = o.cam || [.4, 1.7, 8.2], g = o.tgt || [.8, 3.4, -10]; camC(cm, g, cm, g, 0, o.fov || 52); dof(.1);
} };
