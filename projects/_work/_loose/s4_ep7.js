// ===================== EP 7 (90.58 s): the Director's truth, the countdown, the escape, the energy wall, the origin wakes =====================
const FAC = Wd.FAC, camF = camO(FAC), DI = () => CHARS.dir;
function ctrl(o = {}, lit = 1, red = 0) { Wd.setScene('none'); Wd.applyLight('roomN2', o); Wd.setNight(1); FAC.visible = true; Wd.setShadowFocus(30, 1, 300, 9); const p = Wd.pts[0]; p.position.set(30, 3.6, 301); p.color.set('#c8e0ff'); p.intensity = 1.0 * lit; p.distance = 22; night();
  if (red) { const q = Wd.pts[1]; q.position.set(30, 2.5, 298); q.color.set('#ff3a4a'); q.intensity = 4 * red; q.distance = 16; Wd.redTint(red * .12); } }
const WF = (x, y, z) => [x, y, z + 300];
const linkFrom = (C) => { scene.updateMatrixWorld(); const v = new THREE.Vector3(); C.torso.getWorldPosition(v); return [v.x, v.y + .5, v.z]; };
// control room layout: Krai held by two guards, the Director by the big screen
const KP = [29.0, 1.2], DP = [31.2, -1.2];
function held(t, o = {}) { put(K(), FAC, { p: [KP[0], 0, KP[1]], ry: 140, ex: 'frown', blink: blinkAt(t, 1), ...hug, ...(o.k || {}) }); put(TR(0), FAC, { p: [28.3, 0, 1.9], ry: 140, ex: 'frown', blink: blinkAt(t, 7), ...fold }); put(TR(1), FAC, { p: [29.8, 0, 2.0], ry: 150, ex: 'frown', blink: blinkAt(t, 8), ...fold }); }
const dir = (t, o = {}) => put(DI(), FAC, { p: [DP[0], 0, DP[1]], ry: -20, ex: 'sly', talk: talkAt(t), blink: blinkAt(t, 6), ...hip, ...o });
const outside = (t, o = {}) => { put(N(), FAC, { p: [40.4, 0, -2.5], ry: 90, ex: 'determined', sweat: true, blink: blinkAt(t, 3), hL: [-.12 + .03 * Math.sin(t * 20), .62, .45], hR: [.12, .62 + .03 * Math.sin(t * 17), .45], pL: [-1, -.4, 0], pR: [1, -.4, 0], ...(o.n || {}) });
  put(B(), FAC, { p: [38.9, 0, .2], ry: -90, ex: 'frown', blink: blinkAt(t, 2), ...fist, ...(o.b || {}) }); put(A(), FAC, { p: [39.6, 0, 1.8], ry: -110, ex: 'worried', blink: blinkAt(t, 4), ...hip, ...(o.a || {}) }); };
const OP = [15, -115];   // the origin, city coords (ground y -40)

S('G01', 0, 'cut', (lt, t) => { // "ชายชุดดำเปิดเผยชื่อของเขาว่า ไดเรกเตอร์"
  ctrl(); Wd.screen('dir', 0, 0, .45); dir(t, { ry: -20 }); held(t); const u = U(lt, 3.55, eSine); camF([33.8, 1.5, 2.8], [31.0, 1.3, -1.0], [33.4, 1.5, 2.5], [31.0, 1.3, -1.0], u, 50); dof(.15);
});
S('G02', 3.55, 'cut', (lt, t) => { // "และอธิบายว่า เกมทั้งหมดนี้เป็นการทดลอง"
  ctrl(); Wd.screen('dir', 0, 0, .45); dir(t, { ...(lt % 2.4 < 1.2 ? offerR : hip) }); held(t, { k: { ex: 'shocked' } }); const u = U(lt, 3.65, eSine); camF([32.6, 1.45, 1.6], [31.2, 1.35, -1.2], [32.4, 1.45, 1.3], [31.2, 1.35, -1.2], u, 42); dof(.35);
});
S('G03', 7.2, 'cut', (lt, t) => { // "เพื่อค้นหามนุษย์ที่สามารถใช้หินพลังต้นกำเนิดได้"
  ctrl(); Wd.screen('origin', 0, 0, .5); held(t, { k: { ex: 'frown' } }); dir(t, { ry: 160, ...pointR }); const u = U(lt, 3.85, eSine); camF([28.6, 1.8, .2], [30, 1.6, -5.8], [28.8, 1.8, -.4], [30, 1.6, -5.8], u, 52);
});
S('G04', 11.05, 'cut', (lt, t) => { // "เขาเผยว่า"
  ctrl(); dir(t, { ry: -30, ex: 'sly' }); const u = U(lt, 1.35, eOut); camF([30.5, 1.35, .4], [31.2, 1.35, -1.2], [30.6, 1.35, .2], [31.2, 1.37, -1.2], u, 40); dof(.45);
});
S('G05', 12.4, 'cut', (lt, t) => { // the origin, asleep ("หินพลังทั้งหมดถูกสร้างขึ้นจากพลังของสิ่งมีชีวิตประหลาดที่เรียกว่า ออริจิน")
  city(); Wd.originAt([OP[0], -40, OP[1]], 180, 0, t, { drain: .5 }); const R = Wd.pts[1]; R.position.set(OP[0] - 300, 10, OP[1] + 40); R.color.set('#b06aff'); R.intensity = 50; R.distance = 120; const u = U(lt, 5.9, eSine); camC([20, -30, -40], [OP[0], -10, OP[1]], [22, -32, -50], [OP[0], 10, OP[1]], u, 48);
});
S('G06', 18.3, 'cut', (lt, t) => { // "ส่วนปีศาจยักษ์ที่เดินอยู่ในเมือง ก็คืออาวุธที่ใช้ควบคุมผู้เล่น"
  city(); const z = -100 + lt * 4.0; Wd.monAt([15 - 300, -40, z], 180, lt * 2.2, .9, { s: 1.08, hy: Math.sin(lt * .8) * 25 }); SH.a = Math.abs(Math.sin(lt * 2.2)) > .97 ? .35 : 0;
  const u = U(lt, 6.5, eSine); camC([13, 3, -24], [15, -14, -85], [13.5, 2.5, -26], [15, -12, -80], u, 50);
});
S('G07', 24.8, 'cut', (lt, t) => { // "ไครถามว่า แล้วทำไมต้องจับนักเรียนมาทดลอง"
  ctrl(); held(t, { k: { ex: 'frown', talk: talkAt(t), ...(lt > 1.4 ? fist : hug) } }); dir(t, { talk: 0 }); const u = U(lt, 3.7, eIn); camF([30.6, 1.4, -.2], [29.0, 1.3, 1.2], [30.4, 1.38, .1], [29.0, 1.3, 1.2], u, 42); dof(.45);
});
S('G08', 28.5, 'cut', (lt, t) => { // "ไดเรกเตอร์ตอบว่า เพราะเด็กที่มีความสามารถพิเศษ"
  ctrl(); dir(t, { ...offerR }); held(t); const u = U(lt, 3.7, eSine); camF([29.4, 1.45, 1.2], [31.2, 1.35, -1.2], [29.6, 1.45, 1.0], [31.2, 1.35, -1.2], u, 42); dof(.35);
});
S('G09', 32.2, 'cut', (lt, t) => { // "สามารถปรับตัวเข้ากับพลังเหล่านี้ได้ดีกว่าผู้ใหญ่": he walks along the monitors
  ctrl(); Wd.screen('stone', 1, 0, .4); const k = clamp(lt / 3.4); put(DI(), FAC, { p: [lerp(26.5, 33.5, k), 0, -4.2], ry: 90, walk: { ph: lt * 5, stride: .1 }, ex: 'sly', talk: talkAt(t), blink: blinkAt(t, 6), ...hip }); held(t);
  const u = U(lt, 3.7, eSine); camF([lerp(26, 32, k), 1.6, 1.4], [lerp(27, 33, k), 1.5, -4.6], [lerp(26.4, 32.4, k), 1.6, 1.2], [lerp(27.4, 33.4, k), 1.5, -4.6], u, 52); dof(.15);
});
S('G10', 35.9, 'cut', (lt, t) => { // "แต่สิ่งที่น่าตกใจที่สุดคือ"
  ctrl({}, .8); held(t, { k: { ex: 'shocked', blink: false } }); const u = U(lt, 2.5, eIn); camF([28.2, 1.35, .1], [29.0, 1.3, 1.2], [28.35, 1.35, .3], [29.0, 1.32, 1.2], u, 40); dof(.5);
});
S('G11', 38.4, 'cut', (lt, t) => { // "เกมนี้ไม่ได้มีผู้ชนะเพียงห้องเดียวอย่างที่ประกาศ"
  ctrl({}, .8); Wd.screen('goal', 0, 0, .45); if (lt > 1.6) Wd.screen('glitch', Math.floor(lt * 14), 0, .45); dir(t, { ry: -40, ex: lt > 1.6 ? 'happy' : 'sly' }); held(t, { k: { ex: 'shocked' } });
  const u = U(lt, 3.7, eSine); camF([33.4, 1.5, 2.2], [30.4, 1.5, -3.5], [33.1, 1.5, 1.9], [30.4, 1.5, -3.5], u, 52); dof(.15);
});
S('G12', 42.1, 'cut', (lt, t) => { // "ผู้เล่นที่เหลือทั้งหมดจะถูกนำไปทดลองต่อ": students led away on the monitors' side
  ctrl({}, .8, .3); [0, 1, 2, 3].forEach(i => { const k = clamp((lt - i * .3) / 3.2); put(STU(i), FAC, { p: [lerp(24, 36, k) - i * 1.2, 0, -4.3], ry: 90, walk: { ph: lt * 6 + i, stride: .12 }, ex: 'scared', sweat: true, blink: blinkAt(t, i), ...hug }); });
  put(TR(2), FAC, { p: [lerp(24, 36, clamp((lt + .6) / 3.2)) - 4.8, 0, -4.0], ry: 90, walk: { ph: lt * 6 + 5, stride: .12 }, ex: 'frown', ...fold }); const u = U(lt, 3.2, eSine); camF([29.0, 1.3, -.4], [29.0, 1.0, -4.3], [30.0, 1.3, -.4], [30.0, 1.0, -4.3], u, 54); dof(.2);
});
S('G13', 45.3, 'cut', (lt, t) => { // "ส่วนผู้ที่ไม่ผ่านการคัดเลือกจะถูกกำจัดออกจากระบบ"
  ctrl({}, .6, .6); dir(t, { ry: -30, ex: 'sly', ...chin }); const u = U(lt, 4.0, eIn); camF([30.7, 1.5, .6], [31.2, 1.35, -1.2], [30.85, 1.45, .2], [31.2, 1.36, -1.2], u, 40); dof(.45);
});
S('G14', 49.3, 'cut', (lt, t) => { // "ไครแอบส่งสัญญาณให้นีโอ"
  ctrl({}, .8); const k = K(); held(t, { k: { ex: 'sneaky', hL: [-.15, .3, -.25], hR: [.15, .3, -.25], pL: [-1, 0, .5], pR: [1, 0, .5] } }); propAt(XA.comm, k, [.12, .3, -.3], [0, k.g.rotation.y, 0]); TR(0).g.visible = false; TR(1).g.visible = false; XA.commGlow.material.opacity = (t * 3) % 1 < .5 ? .9 : .2;
  const u = U(lt, 2.3, eSine); camF([28.2, .8, 2.9], [29.0, .75, 1.2], [28.3, .8, 2.7], [29.0, .75, 1.2], u, 40); dof(.45);
});
S('G15', 51.6, 'cut', (lt, t) => { // "ซึ่งกำลังพยายามเจาะระบบอยู่ด้านนอก"
  ctrl({}, .7); outside(t); const n = N(); propAt(XA.gadget, n, [0, .62, .5], [-.4, n.g.rotation.y, 0]); XA.led.material.opacity = (t * 6) % 1 < .5 ? .9 : .1; XA.cpanelGl.material.opacity = .4 + .3 * Math.sin(t * 9);
  const u = U(lt, 2.6, eSine); camF([38.0, 1.6, -1.2], [40.6, 1.1, -2.4], [38.2, 1.6, -.9], [40.6, 1.1, -2.4], u, 50); dof(.2);
});
S('G16', 54.2, 'whip', (lt, t) => { // "ทันใดนั้น หน้าจอทุกจอก็เปลี่ยนเป็นสีแดง"
  ctrl({}, .6, sstep(.2, .6, lt)); Wd.screen(lt < .3 ? 'dir' : 'destroy', 600, 0, .6); dir(t, { ry: 160, ex: 'shocked', talk: 0, ...up2 }); held(t, { k: { ex: 'shocked' } });
  const u = U(lt, 2.7, eSine); camF([33.6, 1.6, 2.9], [30, 1.6, -5.0], [33.2, 1.6, 2.5], [30, 1.6, -5.0], u, 54);
});
S('G17', 56.9, 'cut', (lt, t) => { // "ระบบเริ่มนับถอยหลัง": every billboard in the city
  city(); XA.bills.visible = true; Wd.screen('destroy', 600 - Math.floor(lt), 0, 0); const R = Wd.pts[1]; R.position.set(-300, 6, -20); R.color.set('#ff3a4a'); R.intensity = 40; R.distance = 60;
  const T = BILLT(); const u = U(lt, 2.6, eSine); camC([2, 3, 6], [T.x * .97, T.by - 1, T.z], [1.6, 3.4, 5.4], [T.x * .97, T.by, T.z], u, 34);
});
S('G18', 59.5, 'cut', (lt, t) => { // "เริ่มกระบวนการทำลายพื้นที่ทดลองในอีก 10 นาที"
  ctrl({}, .5, 1); Wd.screen('destroy', 599 - Math.floor(lt), 0, .7); const u = U(lt, 3.7, eIn); camF([30, 1.6, -1.6], [30, 1.6, -5.8], [30, 1.6, -2.6], [30, 1.6, -5.8], u, 50);
});
S('G19', 63.2, 'whip', (lt, t) => { // "ไดเรกเตอร์รีบวิ่งไปยังห้องควบคุม": he runs out, the door slams on Krai
  ctrl({}, .5, 1); Wd.screen('destroy', 595, 0, .6); const k = clamp(lt / 1.6); put(DI(), FAC, { p: [lerp(31.2, 38.5, eIn(k)), 0, lerp(-1.2, 0, k)], ry: 90, walk: { ph: lt * 12, stride: .2 }, ex: 'frown', ...runA(lt * 12) }); DI().g.visible = k < .98;
  [0, 1].forEach(i => { const q = clamp((lt - .3) / 1.6); put(TR(i), FAC, { p: [lerp(28.3 + i * 1.5, 38.5, eIn(q)), 0, lerp(1.9, 0, q)], ry: 90, walk: { ph: lt * 12 + i, stride: .2 }, ex: 'frown', ...runA(lt * 12 + i) }); TR(i).g.visible = q < .98; });
  put(K(), FAC, { p: [KP[0], 0, KP[1]], ry: 90, ex: 'determined', blink: blinkAt(t, 1), ...hip }); const u = U(lt, 2.6, eSine); camF([26.4, 1.5, 3.4], [34.0, 1.2, .2], [26.8, 1.5, 3.2], [35.0, 1.2, .2], u, 50); dof(.15);
});
S('G20', 65.8, 'cut', (lt, t) => { // "แต่ไครใช้พลังใหม่เชื่อมโยงความสามารถกับบรูโน่และเอซ": beams through the door
  ctrl({}, .5, .8); Wd.screen('destroy', 593, 0, .5); put(K(), FAC, { p: [33.6, 0, .4], ry: 90, ex: 'determined', blink: false, ...offerR }); eyeGlow(sstep(.1, .6, lt), t); outside(t, { b: { ex: 'shocked' }, a: { ex: 'shocked' } }); muscle(sstep(1.2, 2.4, lt));
  const s = linkFrom(K()); Wd.linkAt(0, s, linkFrom(B()), sstep(.6, 1.2, lt), '#ff4a3a'); Wd.linkAt(1, s, linkFrom(A()), sstep(1.0, 1.6, lt), '#3af08a');
  const u = U(lt, 3.2, eSine); camF([31.4, 2.0, 4.2], [35.2, 1.1, .2], [31.6, 1.9, 3.9], [35.2, 1.1, .2], u, 58);
});
S('G21', 69.0, 'whip', (lt, t) => { // "บรูโน่ทำลายประตู"
  ctrl({}, .5, .8); const k = eOut(clamp((lt - .5) / .5)); Wd.doorBreak(k); if (lt > .5 && lt < 1.1) { SH.a = .9; Wd.flash(.1); }
  put(B(), FAC, { p: [lerp(39.0, 37.8, sstep(.2, .5, lt)), 0, .1], ry: -90, lean: 18, ex: 'frown', blink: false, ...(lt > .4 ? { hR: [.15, .95, .9], pR: [1, -.4, 0], hL: [-.3, .5, .2], pL: [-1, 0, -.5] } : fist) }); muscle(1); Wd.auraCol(1, '#ff4a3a'); Wd.auraAt(1, WF(38.2, 1.1, .1), 2.4, .3);
  put(K(), FAC, { p: [33.6, 0, .4], ry: 90, ex: lt > 1 ? 'happy' : 'determined', ...hip }); eyeGlow(.5, t); const u = U(lt, 2.3, eSine); camF([34.4, 1.3, 3.6], [37.2, 1.2, .1], [34.6, 1.3, 3.3], [37.2, 1.2, .1], u, 52); dof(.15);
});
S('G22', 71.3, 'cut', (lt, t) => { // "ส่วนเอซพุ่งเข้าไปช่วยนีโอ"
  ctrl({}, .5, .8); Wd.doorBreak(1); const d = clamp(lt / .6), hit = lt > .6, fly = clamp((lt - .6) / .7);
  put(TR(2), FAC, { p: [40.0, 0, lerp(-1.2, -4.8, eOut(fly))], ry: hit ? 0 : 180, rx: hit ? -25 * Math.min(1, fly * 2) : 0, ex: hit ? 'shocked' : 'frown', blink: false, ...(hit ? up2 : pointR) });
  put(A(), FAC, { p: [lerp(39.8, 40.1, d), 0, lerp(2.4, -.6, eIn(d))], ry: 180, lean: 22, ex: 'determined', blink: false, walk: d < 1 ? { ph: lt * 24, stride: .3 } : null, ...(hit ? { hR: [.15, .95, .9], pR: [1, -.4, 0], hL: [-.3, .5, .2], pL: [-1, 0, -.5] } : runA(lt * 24)) });
  [0, 1, 2].forEach(i => Wd.streakAt(i, WF(40.0, .6 + i * .3, lerp(2.4, -.6, d) + 1 + i * .2), 90, 1.4, d < 1 ? .5 - i * .1 : 0)); if (lt > .6 && lt < .9) SH.a = .5;
  put(N(), FAC, { p: [40.4, 0, -2.5], ry: lt > 1 ? 0 : 90, ex: lt > 1 ? 'happy' : 'scared', sweat: lt < 1, ...hug }); const u = U(lt, 3.2, eSine); camF([37.6, 1.4, -2.6], [40.2, 1.0, -.8], [37.7, 1.4, -2.3], [40.2, 1.0, -.8], u, 56); dof(.15);
});
S('G23', 74.5, 'cut', (lt, t) => { // "ทั้งสี่คนสามารถหนีออกมาได้สำเร็จ"
  ctrl({}, .5, .9); Wd.doorBreak(1); [K, B, A, N].forEach((C, i) => put(C(), FAC, { p: [39.3 + (i % 2) * .8, 0, lerp(-1.5, 5.4, clamp((lt - i * .15) / 2.4)) - i * .5], ry: 0, walk: { ph: lt * 13 + i, stride: .22 }, ex: 'determined', blink: blinkAt(t, i + 1), ...runA(lt * 13 + i) })); muscle(1);
  const u = U(lt, 2.6, eSine); camF([39.7, 1.3, 5.6], [39.7, 1.1, 0], [39.7, 1.35, 5.8], [39.7, 1.1, 1.0], u, 54); dof(.15);
});
// --- out on the street: the wall, the origin ---
const STR = (x, z) => [x, -40, z];
S('G24', 77.1, 'cut', (lt, t) => { // "แต่เมื่อมาถึงทางออก"
  city(); Wd.ewallAt(sstep(1.6, 2.8, lt) * .6, t); const k = clamp(lt / 2.0); [K, B, A, N].forEach((C, i) => put(C(), CT, { p: STR(13.6 + (i % 2) * 1.2, lerp(-48, -54, k) - i * .7), ry: 180, walk: k < 1 ? { ph: lt * 12 + i, stride: .2 } : null, ex: k < 1 ? 'determined' : 'shocked', blink: blinkAt(t, i + 1), ...(k < 1 ? runA(lt * 12 + i) : hug) })); muscle(1);
  const u = U(lt, 2.9, eSine); camC([15.6, -38.6, -60.5], [14.2, -39, -50], [15.2, -38.8, -59.5], [14.2, -39, -50], u, 50); dof(.15);
});
S('G25', 80.0, 'cut', (lt, t) => { // "พวกเขากลับพบว่า เมืองทั้งเมืองกำลังถูกปิดล้อมด้วยกำแพงพลังงานขนาดยักษ์"
  city(); Wd.ewallAt(.6 + .4 * sstep(0, 1.5, lt), t); XA.gate.visible = true; Wd.originAt([OP[0], -40, OP[1]], 180, 0, t, { drain: .2 }); [K, B, A, N].forEach((C, i) => put(C(), CT, { p: STR(13.6 + (i % 2) * 1.2, -54 - i * .7), ry: 180, ex: 'shocked', head: [-20, 0, 0], ...hug }));
  const u = U(lt, 4.2, eIO); camC([16, -37.5, -46], [15, -20, -100], [40, 60, 140], [0, -20, -40], u, 50);
});
S('G26', 84.2, 'cut', (lt, t) => { // "และตรงหน้าพวกเขา"
  city(); Wd.ewallAt(.8, t); XA.gate.visible = true; Wd.originAt([OP[0], -40, OP[1]], 180, 0, t, { drain: .3 }); [K, B, A, N].forEach((C, i) => put(C(), CT, { p: STR(13.6 + (i % 2) * 1.2, -54 - i * .7), ry: 180, ex: 'scared', sweat: true, blink: false, head: [-26, 0, 0], ...hug })); SH.a = .1;
  const u = U(lt, 1.8, eSine); camC([14.4, -39.4, -57.8], [14.2, -38.4, -53], [14.4, -39.5, -57.6], [14.2, -38.3, -53], u, 50);
});
S('G27', 86.0, 'cut', (lt, t) => { // "ออริจินกำลังลืมตาขึ้นเป็นครั้งแรก"
  city(); Wd.ewallAt(.8, t); const e = sstep(1.0, 2.6, lt); Wd.originAt([OP[0], -40, OP[1]], 180, e, t, { drain: .3 + .5 * e }); if (e > .2 && e < 1) SH.a = .3; const R = Wd.pts[1]; R.position.set(OP[0] - 300, 25, OP[1] + 30); R.color.set('#9ad8ff'); R.intensity = 80 * e; R.distance = 120;
  const u = U(lt, 4.58, eIn); camC([OP[0] + 10, 18, OP[1] + 60], [OP[0], 22, OP[1]], [OP[0] + 4, 22, OP[1] + 40], [OP[0], 24, OP[1]], u, 40);
});
export const COVER = { id: 'COVER', t0: 0, fn: (lt, t, o = {}) => {
  city(); Wd.ewallAt(.8, 2); XA.gate.visible = true; Wd.originAt([OP[0], -40, OP[1]], 180, 1, 2, { drain: .8 }); const R = Wd.pts[1]; R.position.set(OP[0] - 300, 25, OP[1] + 30); R.color.set('#9ad8ff'); R.intensity = 80; R.distance = 120;
  [K, B, A, N].forEach((C, i) => put(C(), CT, { p: STR(13.0 + i * .7, -54 - (i % 2) * .5), ry: 180, ex: 'determined', ...(i === 1 ? fist : hip) })); muscle(1);
  const cm = o.cam || [14.4, -39.2, -49.5], g = o.tgt || [15, -2, -100]; camC(cm, g, cm, g, 0, o.fov || 54);
} };
