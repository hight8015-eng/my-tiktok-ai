// ===================== EP 4 (89.94 s): the giants change =====================
const T15 = () => XA.towers[15];
const rest = (t) => { put(B(), CR, { p: [-1.4, 0, -.2], ry: 30, sit: true, seat: .78, ex: 'sleepy', blink: blinkAt(t, 2), ...fold }); put(N(), CR, { p: [1.6, 0, -.3], ry: -20, ex: 'happy', blink: blinkAt(t, 3), head: [16, 0, 0], hL: [-.12, .55, .45], hR: [.12, .55, .45], pL: [-1, -.4, 0], pR: [1, -.4, 0] }); put(A(), CR, { p: [.2, 0, 2.6], ry: 160, ex: 'calm', blink: blinkAt(t, 4), ...up2 }); };
const siren = (t, k = 1) => Wd.redTint(k * (.10 + .08 * Math.sin(t * 7)));
S('C01', 0, 'cut', (lt, t) => { // a day after the fight ("หลังจากเหตุการณ์การต่อสู้กับวิกเตอร์ผ่านไปหนึ่งวัน")
  room(); rest(t); const n = N(); propAt(XA.gadget, n, [0, .62, .5], [-.4, n.g.rotation.y, 0]); put(K(), CR, { p: [-3.6, 0, 2.0], ry: -70, ex: 'calm', blink: blinkAt(t, 1), ...hip });
  const u = U(lt, 3.9, eSine); camR([3.4, 2.0, 4.6], [-.6, 1.0, .6], [2.9, 1.9, 4.6], [-.6, 1.0, .6], u, 52); dof(.1);
});
S('C02', 3.85, 'cut', (lt, t) => { // the whole city shakes ("เมืองทั้งเมืองก็เริ่มสั่นสะเทือน")
  room(); SH.a = .5 + .3 * Math.sin(lt * 5); put(B(), CR, { p: [-1.4, 0, -.2], ry: 30, ex: 'shocked', blink: false, ...up2 }); put(N(), CR, { p: [1.6, 0, -.3], ry: -20, ex: 'scared', sweat: true, blink: false, ...hug }); put(A(), CR, { p: [.2, 0, 2.6], ry: 170, ex: 'shocked', ...hip }); put(K(), CR, { p: [-1.6, 0, 2.6], ry: 150, ex: 'shocked', ...hip });
  XA.roomDesks.children.forEach((d, i) => { d.rotation.y = Math.sin(t * 20 + i) * .03; }); const u = U(lt, 2.4, eSine); camR([.2, 1.6, 4.8], [0, 1.1, .6], [.4, 1.6, 4.5], [0, 1.1, .6], u, 56);
});
S('C03', 6.25, 'cut', (lt, t) => { // a siren and a warning ("เสียงไซเรนดังขึ้นพร้อมข้อความเตือน")
  room(); siren(t); Wd.screen(lt < .5 ? 'glitch' : 'warn', lt < .5 ? Math.floor(lt * 20) : 0, 0, .55); team(t, { b: { ry: 180, ex: 'shocked' }, n: { ry: 170, ex: 'scared' }, a: { ry: 190, ex: 'worried' } }); put(K(), CR, { p: [.4, 0, 1.4], ry: 180, ex: 'worried', ...hip });
  const u = U(lt, 3.4, eSine); camR([.6, 1.6, 5.0], [0, 1.8, -4.8], [.4, 1.6, 4.4], [0, 1.9, -4.8], u, 52);
});
S('C04', 9.65, 'cut', (lt, t) => { // "คำเตือน ระดับภัยคุกคามเพิ่มขึ้น โปรดหลบอยู่ภายในอาคาร"
  room(); siren(t); Wd.screen('warn', t > 12.7 ? 1 : 0, 0, .6); team(t, { b: { ry: 180 }, n: { ry: 170 }, a: { ry: 190 } }); put(K(), CR, { p: [.4, 0, 1.4], ry: 180, ...hip });
  const u = U(lt, 5.3, eSine); camR([0, 1.8, 2.3], [0, 1.9, -4.9], [0, 1.85, 1.8], [0, 1.9, -4.9], u, 56);
});
S('C05', 14.95, 'cut', (lt, t) => { // Krai at the window ("ไครมองออกไปนอกหน้าต่าง")
  room(); siren(t, .5); put(K(), CR, { p: [-3.9, 0, 2.2], ry: -60 + lt * 10, ex: 'worried', blink: blinkAt(t, 1), ...hip });
  const u = U(lt, 2.0, eSine); camR([-1.6, 1.5, 3.4], [-4.4, 1.5, 1.8], [-1.9, 1.5, 3.2], [-4.4, 1.5, 1.8], u, 44); dof(.2);
});
const MP = [72, -75]; // where the giant stands at tower 15
const headCam = (mx, mz, ox, oy, oz) => [mx + ox, -2 + oy, mz + oz];
S('C06', 16.95, 'cut', (lt, t) => { // the giant between the towers ("และพบว่า ปีศาจยักษ์ที่เคยเดินอยู่ระหว่างตึก")
  city(); siren(t, .3); const z = -100 + lt * 3.6; Wd.monAt([15 - 300, -40, z], 180, lt * 2.2, .55, { s: 1.08, hy: Math.sin(lt * .8) * 15 });
  const u = U(lt, 3.3, eSine); camC([13, 3, -24], [15, -14, -85], [13.5, 2.5, -26], [15, -12, -85], u, 50);
});
S('C07', 20.25, 'cut', (lt, t) => { // it stops: its behaviour changes ("กำลังเปลี่ยนพฤติกรรม")
  city(); siren(t, .3); const k = sstep(.2, 1.0, lt); Wd.monAt([15 - 300, -40, -88], 180, 0, .55 + .45 * k, { s: 1.08, hy: 70 * k });
  if (k > .9 && lt < 1.2) SH.a = .3; const u = U(lt, 2.0, eOut); camC([13.5, 2.5, -26], [15, -6, -86], [13.8, 2.2, -28], [15, -4, -86], u, 40);
});
S('C08', 22.2, 'cut', (lt, t) => { // it no longer wanders ("มันไม่ได้เดินสุ่มอีกต่อไป")
  city(); const x = 15 + lt * 5; Wd.monAt([x - 300, -40, -76], -90, lt * 2.8, 1, { s: 1.08, lean: .1 });
  const u = U(lt, 2.3, eSine); camC([-8, 66, -24], [x + 6, -26, -76], [-4, 64, -26], [x + 8, -26, -76], u, 44);
});
S('C09', 24.5, 'cut', (lt, t) => { // heading for a tower where powers flash ("แต่มันกำลังมุ่งหน้าไปยังตึกที่มีการใช้พลังพิเศษ")
  city(); const T = T15(); XA.sparks.forEach((s, i) => { s.visible = true; s.position.set(T.x - 300 + (i - 1) * 3, T.top + 4, T.z + 3); s.material.opacity = Math.max(0, Math.sin(t * 5 + i * 2)) * .9; s.scale.setScalar(6 + 3 * Math.sin(t * 7 + i)); });
  const mx = 40 + lt * 5; Wd.monAt([mx - 300, -40, -76], -90, lt * 2.8, 1, { s: 1.08, lean: .1 });
  const u = U(lt, 4.0, eSine); camC([30, 70, -22], [76, -24, -70], [34, 68, -24], [78, -24, -70], u, 46);
});
S('C10', 28.45, 'whip', (lt, t) => { // tower 15 crumbles ("ทันใดนั้น ตึกหมายเลข 15 ก็ถูกมันพังลงอย่างง่ายดาย")
  city(); const T = T15(), r = sstep(.4, 1.2, lt), k = eIn(sstep(1.0, 4.2, lt)); Wd.monAt([MP[0] - 300, -40, MP[1]], -50, 0, 1, { s: 1.08, reach: r * (1 - .5 * k), lean: .25 * r });
  Wd.towerFall(15, k); Wd.boomAt([T.x - 300, -40 + 12, T.z - 6], k * 4); if (lt > 1.0 && lt < 4.5) SH.a = .5;
  const u = U(lt, 4.7, eSine); camC([42, 62, -16], [80, -24, -68], [45, 60, -18], [80, -26, -68], u, 46);
});
S('C11', 33.15, 'cut', (lt, t) => { // students run out ("นักเรียนจำนวนมากวิ่งหนีออกมา")
  city(); const T = T15(); Wd.towerFall(15, 1); Wd.boomAt([T.x - 300, -40 + 12, T.z - 6], 4 + lt * .4); Wd.monAt([MP[0] - 300, -40, MP[1]], -50, 0, 1, { s: 1.08, lean: .1 });
  [0, 1, 2, 3].forEach(i => { const C = STU(i); put(C, CT, { p: [80 - lt * .8 - i * 1.2, -40, -58 + lt * 2.4 + (i % 2) * 1.4], ry: -20, walk: { ph: lt * 13 + i, stride: .22 }, ex: 'scared', blink: false, ...up2 }); });
  const u = U(lt, 2.4, eSine); camC([74, -38.4, -44], [80, -34, -64], [73.6, -38.4, -43], [79, -33, -64], u, 60);
});
S('C12', 35.5, 'cut', (lt, t) => { // ...but the giant grabs them one by one ("แต่ปีศาจกลับคว้าพวกเขาไปทีละคน")
  city(); Wd.towerFall(15, 1); const r = Math.max(0, Math.sin(lt * 2.0)); Wd.monAt([MP[0] - 300, -40, MP[1]], 20, 0, 1, { s: 1.08, reach: r, lean: .3 * r });
  scene.updateMatrixWorld(); const h = new THREE.Vector3(); XA.mon.userData.aR.children[1].getWorldPosition(h);
  [0, 1].forEach(i => { const C = STU(i), caught = lt > .9 + i * 1.6; if (caught && i === 0 && lt < 2.6) { put(C, scene, { p: [h.x, h.y - 1.2, h.z], ry: 0, ex: 'scared', blink: false, ...up2 }); } else if (!caught) put(C, CT, { p: [75 - i * 1.5, -40, -60 + lt * 2.4], ry: -10, walk: { ph: lt * 13 + i, stride: .22 }, ex: 'scared', blink: false, ...up2 }); });
  const u = U(lt, 3.4, eSine); camC([75, -38.2, -42], [73, -22, -72], [75.4, -38.3, -41.5], [73, -20, -72], u, 62);
});
S('C13', 38.9, 'cut', (lt, t) => { // Krai notices something ("ไครสังเกตเห็นบางอย่าง")
  room(); siren(t, .3); put(K(), CR, { p: [-3.9, 0, 2.2], ry: -110, ex: 'calm', blink: blinkAt(t, 1), look: [.6, .2], ...chin }); const u = U(lt, 2.0, eOut); camR([-2.4, 1.4, 3.0], [-3.9, 1.3, 2.2], [-2.6, 1.4, 2.9], [-3.9, 1.3, 2.2], u, 40); dof(.5);
});
S('C14', 40.95, 'cut', (lt, t) => { // whenever someone uses a power... ("ทุกครั้งที่มีการใช้พลังพิเศษ")
  city(); Wd.towerFall(15, 1); const T = tower(30, -30); const f = sstep(.4, .9, lt); XA.sparks.forEach((s, i) => { s.visible = true; s.position.set(T.x - 300 + (i - 1) * 2.5, T.top + 3.5, T.z + 2); s.material.opacity = f * (.6 + .4 * Math.sin(t * 9 + i)); s.scale.setScalar(5 + 4 * f); });
  const u = U(lt, 2.5, eSine); camC([6, 5, -4], [T.x, T.top + 2, T.z], [6.5, 5.5, -5], [T.x, T.top + 2, T.z], u, 34);
});
S('C15', 43.45, 'cut', (lt, t) => { // ...the giant's eyes light up ("ดวงตาของปีศาจจะสว่างขึ้น")
  city(); Wd.towerFall(15, 1); const e = sstep(.4, 1.0, lt); Wd.monAt([MP[0] - 300, -40, MP[1]], 120, 0, .4 + .7 * e, { s: 1.08 }); if (e > .5 && lt < 1.3) SH.a = .2;
  const u = U(lt, 2.1, eOut); camC(headCam(...MP, -24, 8, 14), [MP[0], -3, MP[1]], headCam(...MP, -21, 7, 12), [MP[0], -3, MP[1]], u, 34);
});
S('C16', 45.6, 'whip', (lt, t) => { // and it snaps toward it ("และมันจะหันไปยังทิศทางนั้นทันที")
  city(); Wd.towerFall(15, 1); const k = eOut(sstep(.1, .5, lt)); Wd.monAt([MP[0] - 300, -40, MP[1]], 120 + 60 * k, 0, 1, { s: 1.08, hy: 30 * k }); if (lt > .2 && lt < .7) SH.a = .4;
  const u = U(lt, 3.2, eSine); camC(headCam(...MP, -26, 12, 30), [MP[0], -6, MP[1]], headCam(...MP, -24, 11, 28), [MP[0], -6, MP[1]], u, 40);
});
S('C17', 48.8, 'cut', (lt, t) => { // "หยุดใช้พลัง!": Krai stops them
  room(); siren(t, .3); const n = N(); put(K(), CR, { p: [1.2, 0, -.2], ry: -8, ex: 'frown', talk: talkAt(t), blink: blinkAt(t, 1), hR: [.25, .7, .55], pR: [1, -.4, 0], hL: [-.25, .7, .55], pL: [-1, -.4, 0] });
  put(B(), CR, { p: [-.3, 0, 2.5], ry: 160, ex: 'worried', ...fold }); muscle(1 - sstep(.5, 1.6, lt)); put(n, CR, { p: [1.7, 0, 2.3], ry: 210, ex: 'scared', ...hug }); Wd.stoneAt(7, [0, 0, 0], t, 1 - sstep(.5, 1.6, lt)); propAt(XA.stones[7], n, [0, .4, .42]); put(A(), CR, { p: [2.4, 0, 2.0], ry: 220, ex: 'worried', ...hip });
  const u = U(lt, 2.3, eSine); camR([0, 1.8, 4.9], [1.0, 1.2, -.2], [.2, 1.75, 4.7], [1.0, 1.2, -.2], u, 58); dof(.15);
});
S('C18', 51.1, 'cut', (lt, t) => { // "แต่ในจังหวะนั้นเอง": Bruno steps back toward a desk
  room(); siren(t, .3); put(B(), CR, { p: [-.4 - lt * .25, 0, 1.6 - lt * .1], ry: 120, walk: { ph: lt * 4, stride: .08 }, ex: 'worried', blink: blinkAt(t, 2), ...hip });
  const u = U(lt, 1.5, eSine); camR([1.4, .9, 3.4], [-.6, .7, 1.2], [1.2, .9, 3.2], [-.7, .7, 1.2], u, 46); dof(.3);
});
S('C19', 52.6, 'cut', (lt, t) => { // CRASH: the desk goes over ("บรูโน่กลับพลาดทำโต๊ะล้มจนเกิดเสียงดัง")
  room(); siren(t, .3); const f = eIn(sstep(.8, 1.4, lt)); const d = XA.roomDesks.children[1]; d.rotation.z = f * 1.45; d.position.y = f * .3; d.position.x += f * .35;
  put(B(), CR, { p: [-.8, 0, 1.5], ry: 120, ex: lt > 1.4 ? 'scared' : 'worried', sweat: lt > 1.4, blink: false, ...(lt > 1.4 ? up2 : hip) }); if (lt > 1.4 && lt < 2.0) SH.a = .5;
  const u = U(lt, 3.2, eSine); camR([1.4, 1.3, 3.8], [-1.6, .7, .6], [1.2, 1.3, 3.6], [-1.6, .7, .6], u, 50); dof(.15);
});
S('C20', 55.8, 'whip', (lt, t) => { // the giant turns toward their tower ("ปีศาจหันมาทางตึกของพวกเขาทันที")
  city(); Wd.towerFall(15, 1); const k = eOut(sstep(.1, .6, lt)); Wd.monAt([MP[0] - 300, -40, MP[1]], lerp(60, 136, k), 0, 1, { s: 1.08, hy: lerp(-30, 0, k) }); if (lt > .2 && lt < .9) SH.a = .4; Wd.redTint(.08);
  const u = U(lt, 3.4, eIn); camC([3, 8, -4], [MP[0], -3, MP[1]], [3.5, 8, -4.5], [MP[0], -3, MP[1]], u, 20);
});
// --- the basement ---
const base = (o = {}) => { room(o, true); Wd.setRoom('B1', '#9a9aa4'); XA.roomDesks.visible = false; XA.rubble.visible = true; Wd.pts[0].intensity = o.dark ? 0 : .6; };
S('C21', 59.15, 'cut', (lt, t) => { // into the basement ("ไครรีบสั่งให้ทุกคนหลบเข้าไปในห้องใต้ดิน")
  base(); const k = clamp(lt / 2.6); [K, B, N, A].forEach((C, i) => put(C(), CR, { p: [lerp(4.4, 1.6 - i * .9, k), 0, lerp(3.4, -.2 - (i % 2) * .8, k)], ry: -110, walk: k < 1 ? { ph: lt * 12 + i, stride: .2 } : null, ex: i === 0 ? 'determined' : 'scared', blink: blinkAt(t, i + 1), ...(k < 1 ? runA(lt * 12 + i) : hug) }));
  const u = U(lt, 2.9, eSine); camR([-2.2, 2.4, 3.8], [1.6, .9, .8], [-1.8, 2.3, 3.6], [1.0, .9, .4], u, 54);
});
S('C22', 62.05, 'cut', (lt, t) => { // Neo kills the power ("และให้นีโอปิดระบบไฟทั้งหมด")
  const off = lt > 1.3; base({ dark: off }); POST.lift = off ? .9 : 1.0; Wd.black(off ? .45 : 0); const n = N(); put(n, CR, { p: [3.9, 0, -3.6], ry: 150, ex: 'determined', sweat: true, blink: blinkAt(t, 3), hR: [.2, .7, .6], pR: [1, -.4, 0], hL: [-.3, .36, .12], pL: [-1, 0, -.5] });
  propAt(XA.gadget, n, [.2, .72, .62], [0, n.g.rotation.y, 0]); XA.led.material.opacity = off ? 0 : .9;
  const u = U(lt, 2.8, eSine); camR([2.6, 1.4, -1.8], [3.9, 1.1, -3.6], [2.8, 1.4, -2.0], [3.9, 1.1, -3.6], u, 42); dof(.4);
});
S('C23', 64.85, 'cut', (lt, t) => { // it passes by ("เมื่อปีศาจเดินผ่านไป")
  city(); const z = 26 - lt * 5; Wd.monAt([15 - 300, -40, z], 180, lt * 2.2, .8, { s: 1.08, hy: -20 * Math.sin(lt) }); if (Math.abs(Math.sin(lt * 2.2)) > .96) SH.a = .35;
  const u = U(lt, 1.5, eSine); camC([7, -38.6, -4], [15, -20, 14], [7.4, -38.6, -4.4], [15, -18, 12], u, 58);
});
S('C24', 66.35, 'cut', (lt, t) => { // fragments where it stood ("พวกเขาก็พบเศษวัตถุบางอย่างตกอยู่บริเวณที่มันเคยยืน")
  city(); XA.prints.visible = true; Wd.stoneAt(4, [12.6 - 300, -40, 2.6], t, 1); const k = clamp(lt / 2.6);
  [K, B, N, A].forEach((C, i) => put(C(), CT, { p: [lerp(7.5, 10.4 + (i % 2) * .9, k), -40, lerp(5.6 + i * .5, 3.2 + i * .45, k)], ry: 120 - i * 10, walk: k < 1 ? { ph: lt * 7 + i, stride: .12 } : null, ex: i === 0 ? 'determined' : 'worried', blink: blinkAt(t, i + 1), ...hip }));
  const u = U(lt, 4.3, eSine); camC([16, -36.2, 9], [11, -39.2, 2.8], [15.4, -36.6, 8.0], [11.5, -39.3, 2.8], u, 52); dof(.15);
});
S('C25', 70.65, 'cut', (lt, t) => { // a black power stone with a skull ("มันคือหินพลังสีดำที่มีสัญลักษณ์รูปกะโหลก")
  city(); XA.prints.visible = true; Wd.stoneAt(4, [12.6 - 300, -40, 2.6], t, 1.4); const u = U(lt, 4.0, eSine); camC([13.4, -39.0, 3.8], [12.6, -39.75, 2.6], [13.1, -39.15, 3.4], [12.6, -39.75, 2.6], u, 40); dof(.55);
});
S('C26', 74.65, 'cut', (lt, t) => { // Krai picks it up ("ไครหยิบมันขึ้นมา")
  city(); XA.prints.visible = true; const k = sstep(.2, 1.2, lt), up = sstep(1.0, 1.9, lt); const C = K(); put(C, CT, { p: [11.8, -40, 3.2], ry: 140, hipY: -.3 * k * (1 - up), lean: 20 * k * (1 - up), ex: 'determined', blink: blinkAt(t, 1), hR: [.25, lerp(.36, .0, k * (1 - up)) + up * .5, lerp(.12, .55, k)], pR: [1, -.4, 0], hL: [-.3, .36, .12], pL: [-1, 0, -.5] });
  if (lt < 1.2) Wd.stoneAt(4, [12.6 - 300, -40, 2.6], t, 1.4); else { Wd.stoneAt(4, [0, 0, 0], t, 1.6); propAt(XA.stones[4], C, [.25, .3 + up * .25, .58]); }
  const u = U(lt, 3.4, eSine); camC([13.6, -38.5, 5.6], [11.9, -39.0, 3.0], [13.2, -38.5, 5.1], [11.9, -38.9, 3.0], u, 46); dof(.3);
});
S('C27', 78.05, 'cut', (lt, t) => { // "หินควบคุมสัตว์ทดลอง"
  city(); const C = K(); put(C, CT, { p: [11.8, -40, 3.2], ry: 140, ex: 'shocked', blink: false, ...hug }); Wd.stoneAt(4, [0, 0, 0], t, 1.8); propAt(XA.stones[4], C, [0, .33, .42]);
  Wd.uiAt(eOut(clamp((lt - .6) / .35)), 'ctl', 0, 0, -1.6, .3); const u = U(lt, 3.0, eSine); camC([13.9, -38.4, 6.0], [11.8, -38.8, 3.2], [13.6, -38.45, 5.6], [11.8, -38.8, 3.2], u, 42); dof(.25);
});
S('C28', 81.1, 'cut', (lt, t) => { // the four look at each other ("ทั้งสี่คนมองหน้ากัน")
  city(); XA.prints.visible = true; const P = [[11.8, 3.2], [10.6, 2.6], [10.9, 4.1], [12.4, 4.4]]; [K, B, N, A].forEach((C, i) => { const [x, z] = P[i]; const ry = Math.atan2(11.4 - x, 3.6 - z) / D2R; put(C(), CT, { p: [x, -40, z], ry: ry + Math.sin(lt * 2 + i) * 15, ex: ['frown', 'worried', 'scared', 'shocked'][i], blink: blinkAt(t, i + 1), ...(i === 0 ? hug : hip) }); });
  Wd.stoneAt(4, [0, 0, 0], t, 1.2); propAt(XA.stones[4], K(), [0, .33, .42]); const u = U(lt, 2.2, eSine); camC([11.4, -35.4, 7.6], [11.4, -39.0, 3.5], [11.6, -35.6, 7.2], [11.4, -39.0, 3.5], u, 48);
});
S('C29', 83.25, 'cut', (lt, t) => { // something that someone made ("ปีศาจเหล่านี้อาจไม่ใช่สัตว์ประหลาดธรรมดา แต่เป็นสิ่งที่มีคนสร้างขึ้น")
  city(); const C = K(); put(C, CT, { p: [11.8, -40, 3.2], ry: 160, ex: 'determined', blink: blinkAt(t, 1), head: [-10, 0, 0], ...hug }); Wd.stoneAt(4, [0, 0, 0], t, 1.2); propAt(XA.stones[4], C, [0, .33, .42]); Wd.monAt([15 - 300, -40, -40 - lt * 3], 0, lt * 2.2, .7, { s: 1.08 });
  const u = U(lt, 6.6, eIn); camC([11.0, -39.0, 6.0], [12.6, -32.0, -10], [11.3, -39.1, 5.0], [12.2, -33.0, -10], u, 50); dof(.15);
});
export const COVER = { id: 'COVER', t0: 0, fn: (lt, t, o = {}) => {
  city(); Wd.monAt([10 - 300, -40, -48], 200, .6, 1.1, { s: 1.5, hy: 25 }); const k = K(); put(k, CT, { p: [.4, 0, 2.6], ry: 10, ex: 'determined', ...hug }); Wd.stoneAt(4, [0, 0, 0], 3, 2.0); propAt(XA.stones[4], k, [0, .38, .42]);
  put(B(), CT, { p: [-.9, 0, 1.6], ry: 20, ex: 'scared', sweat: true, ...fold }); put(N(), CT, { p: [1.6, 0, 1.7], ry: -15, ex: 'worried', sweat: true, ...hip }); put(A(), CT, { p: [.5, 0, .9], ry: 0, ex: 'shocked', ...hip });
  const cm = o.cam || [.4, 1.7, 8.2], g = o.tgt || [.8, 3.4, -10]; camC(cm, g, cm, g, 0, o.fov || 52); dof(.1);
} };
