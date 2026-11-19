// ===================== EP 6 (92.5 s): punishment, the hatch, the old lab, the origin power, the Director =====================
const FAC = Wd.FAC, camF = camO(FAC), DI = () => CHARS.dir;
const redRoom = (t, k = 1) => { const p = Wd.pts[1]; p.position.set(-300, -2.0, -3.4); p.color.set('#ff3a4a'); p.intensity = 3.5 * k * (.8 + .2 * Math.sin(t * 8)); Wd.redTint(k * (.12 + .08 * Math.sin(t * 7))); };
const dark = (t, k = 1) => { room({}, true); Wd.pts[0].intensity = 0; redRoom(t, k); };
function fac(o = {}, lit = 1) { Wd.setScene('none'); Wd.applyLight('roomN2', o); Wd.setNight(1); FAC.visible = true; Wd.setShadowFocus(0, 1, 300, 9); const p = Wd.pts[0]; p.position.set(0, 3.6, 300); p.color.set('#b0ffe0'); p.intensity = 1.1 * lit; p.distance = 22; night(); }
const WF = (x, y, z) => [x, y, z + 300];
const coreGlow = (t, k) => { const p = Wd.pts[2]; p.position.set(0, 2.2, 300); p.color.set('#9a5aff'); p.intensity = 3 * k; p.distance = 9; };
// lab layout
const LAB = { krai: [.0, 1.6, 180], bruno: [-1.4, 2.6, 160], neo: [1.3, 2.7, 200], ace: [-.3, 3.3, 175] };
function labTeam(t, o = {}) { const P = (k, C, ex, j, pz) => put(C, FAC, { p: [LAB[k][0], 0, LAB[k][1]], ry: LAB[k][2], ex, blink: blinkAt(t, j), ...pz, ...(o[k] || {}) });
  P('krai', K(), 'shocked', 1, hip); P('bruno', B(), 'frown', 2, fold); P('neo', N(), 'shocked', 3, hug); P('ace', A(), 'worried', 4, hip); }
const linkFrom = (C, off = [0, .9, 0]) => { scene.updateMatrixWorld(); const v = new THREE.Vector3(); C.torso.getWorldPosition(v); return [v.x + off[0], v.y + off[1] - .4, v.z + off[2]]; };

// --- punishment ---
S('F01', 0, 'cut', (lt, t) => { // "เมื่อระบบเริ่มลงโทษห้องหมายเลข 07"
  room({}, true); Wd.pts[0].intensity = .35; redRoom(t, 1.1); Wd.screen('punish', 600, 0, .7); team(t, { b: { ry: 180, ex: 'scared' }, n: { ry: 170, ex: 'scared', sweat: true }, a: { ry: 190, ex: 'sad', sweat: true } }); put(K(), CR, { p: [1.2, 0, 1.4], ry: 180, ex: 'frown', ...hip });
  const u = U(lt, 3.1, eSine); camR([0, 1.85, 2.4], [0, 1.9, -4.9], [0, 1.9, 1.9], [0, 1.9, -4.9], u, 56);
});
S('F02', 3.05, 'cut', (lt, t) => { // "ไฟทุกดวงก็ดับลง"
  const off = lt > .5 && !(lt > .7 && lt < .85); room({}, true); Wd.pts[0].intensity = off ? 0 : .5; redRoom(t, off ? .6 : 1); Wd.screen(off ? 'off' : 'punish', 600, 0, off ? 0 : .5); Wd.black(off ? .35 : 0);
  team(t, { b: { p: [-1.5, 0, .2], ry: 180, ex: 'scared' }, n: { p: [1.5, 0, .1], ry: 170, ex: 'scared', sweat: true }, a: { p: [-.55, 0, .7], ry: 190, ex: 'scared' } }); XA.roomDesks.visible = false; put(K(), CR, { p: [.5, 0, .6], ry: 180, ex: 'shocked', blink: false, ...hip });
  if (lt > .5 && lt < .6) SH.a = .2; const u = U(lt, 2.1, eSine); camR([.2, 2.3, -4.4], [0, 1.0, .5], [.15, 2.2, -4.1], [0, 1.0, .5], u, 56); dof(.15);
});
S('F03', 5.15, 'cut', (lt, t) => { // "และประตูเริ่มเปิดออกเองอย่างช้า ๆ"
  dark(t, .8); Wd.black(.25); XA.doorP.rotation.y = -1.1 * sstep(.3, 3.0, lt); put(K(), CR, { p: [2.2, 0, .2], ry: 50, ex: 'scared', sweat: true, blink: false, ...hug });
  const u = U(lt, 3.3, eIn); camR([.4, 1.4, .4], [4.9, 1.2, 3.4], [1.0, 1.35, .9], [4.9, 1.2, 3.5], u, 44); dof(.3);
});
S('F04', 8.45, 'cut', (lt, t) => { // "เสียงประกาศแจ้งว่ามีเวลาเพียง 10 นาที"
  dark(t, 1); Wd.screen('punish', 600 - Math.floor(Math.max(0, t - 8.45)), 0, .7); team(t, { b: { ry: 180, ex: 'shocked' }, n: { ry: 170, ex: 'scared', sweat: true }, a: { ry: 190, ex: 'shocked' } }); put(K(), CR, { p: [1.2, 0, 1.4], ry: 180, ex: 'frown', ...hip });
  const u = U(lt, 3.7, eSine); camR([.6, 1.6, 5.0], [0, 1.8, -4.8], [.4, 1.6, 4.4], [0, 1.9, -4.8], u, 52);
});
S('F05', 12.15, 'cut', (lt, t) => { // "ก่อนที่ปีศาจจะบุกเข้ามา": the giant's eyes turn to the tower
  city(); Wd.redTint(.08); const k = sstep(.3, 1.2, lt); Wd.monAt([15 - 300, -40, -30 + lt * 2], 180 - 40 * k, lt * 1.4, .4 + .6 * k, { s: 1.08, hy: -40 * k });
  const u = U(lt, 2.6, eSine); camC([4, 2, 26], [15, -8, -28], [4.5, 1.6, 24], [15, -6, -28], u, 44);
});
S('F06', 14.75, 'cut', (lt, t) => { // Krai runs for the door: locked ("ไครรีบหาทางออก... แต่ประตูทั้งสองถูกล็อก")
  dark(t, .9); const k = clamp(lt / 1.6), sl = sstep(1.6, 1.9, lt); XA.doorP.rotation.y = -1.1 * (1 - sl); if (lt > 1.9 && lt < 2.3) SH.a = .5;
  put(K(), CR, { p: [lerp(1.6, 4.2, eOut(k)), 0, lerp(1.0, 3.1, k)], ry: 60, walk: k < 1 ? { ph: lt * 14, stride: .22 } : null, ex: lt > 2 ? 'shocked' : 'determined', blink: false, ...(k < 1 ? runA(lt * 14) : pointR) });
  Wd.uiAt(lt > 2.4 ? eOut(clamp((lt - 2.4) / .3)) : 0, 'locked', 0, 0, -1.6, .35); const u = U(lt, 4.25, eSine); camR([1.4, 1.5, 4.6], [4.4, 1.1, 3.0], [2.0, 1.5, 4.6], [4.6, 1.1, 3.2], u, 46); dof(.2);
});
S('F07', 19.0, 'cut', (lt, t) => { // "นีโอจึงเริ่มแกะระบบควบคุม"
  dark(t, .8); const n = N(); put(n, CR, { p: [4.5, 0, 1.6], ry: 90, ex: 'determined', sweat: true, blink: blinkAt(t, 3), hipY: -.25, lean: 12, hL: [-.12 + .03 * Math.sin(t * 20), .6, .45], hR: [.12, .6 + .03 * Math.sin(t * 17), .45], pL: [-1, -.4, 0], pR: [1, -.4, 0] });
  propAt(XA.gadget, n, [0, .62, .5], [-.4, n.g.rotation.y, 0]); XA.led.material.opacity = (t * 6) % 1 < .5 ? .9 : .1; Wd.auraCol(1, '#ffd23a'); Wd.auraAt(1, WR(4.9, 1.0, 1.6), .8, .12 + .06 * Math.sin(t * 9));
  const u = U(lt, 4.0, eSine); camR([3.1, 1.3, 2.9], [4.7, .8, 1.6], [3.2, 1.3, 2.7], [4.7, .8, 1.6], u, 44); dof(.4);
});
S('F08', 23.0, 'cut', (lt, t) => { // "ขณะที่บรูโน่และเอซช่วยกันป้องกันประตู"
  dark(t, .9); const bang = (lt * 1.4) % 1 < .12; XA.doorP.rotation.y = bang ? -.05 : 0; if (bang) SH.a = .4;
  put(B(), CR, { p: [4.55, 0, 3.4], ry: 90, lean: 20, ex: 'frown', blink: false, hL: [-.25, .8, .6], hR: [.25, .85, .6], pL: [-1, -.4, 0], pR: [1, -.4, 0] }); muscle(1); Wd.auraCol(1, '#ff4a3a'); Wd.auraAt(1, WR(4.4, 1.0, 3.4), 2.0, .25);
  put(A(), CR, { p: [4.5, 0, 4.25], ry: 90, lean: 22, ex: 'determined', sweat: true, blink: false, hL: [-.25, .7, .6], hR: [.25, .75, .6], pL: [-1, -.4, 0], pR: [1, -.4, 0] });
  const u = U(lt, 4.1, eSine); camR([2.2, 1.4, 1.9], [4.6, 1.1, 3.8], [2.4, 1.4, 2.0], [4.6, 1.1, 3.8], u, 48); dof(.2);
});
S('F09', 27.1, 'cut', (lt, t) => { // "ระหว่างนั้น": Krai's eyes find something
  dark(t, .8); put(K(), CR, { p: [1.4, 0, -1.8], ry: 200, ex: 'determined', blink: false, head: [24, 0, 0], ...chin }); eyeGlow(sstep(.1, .6, lt), t);
  const u = U(lt, 1.3, eIn); camR([.9, 1.4, -3.4], [1.4, 1.25, -1.8], [1.0, 1.38, -3.15], [1.4, 1.25, -1.8], u, 40); dof(.4);
});
S('F10', 28.35, 'cut', (lt, t) => { // a secret hatch with the building map ("ไครสังเกตเห็นช่องลับใต้พื้น ซึ่งมีแผนที่ของอาคารทั้งหมดซ่อนอยู่")
  dark(t, .7); const o = sstep(.6, 1.8, lt), m = sstep(2.2, 3.2, lt); Wd.hatchAt(o, m, 0); put(K(), CR, { p: [1.0, 0, -3.0], ry: 90, ex: m > .5 ? 'shocked' : 'determined', blink: false, ...crouch, hR: [.25, lerp(.3, .1, o), .6], pR: [1, -.4, 0], hL: [-.3, .36, .12], pL: [-1, 0, -.5] });
  [B, N, A].forEach((C, i) => put(C(), CR, { p: [1.4 + i * .8, 0, -4.5 + (i % 2) * .2], ry: 0, ex: m > .5 ? 'shocked' : 'worried', blink: blinkAt(t, i + 2), head: [20, 0, 0], ...hug }));
  const u = U(lt, 5.4, eSine); camR([2.6, 2.3, -.3], [2.0, .5, -3.6], [2.6, 2.2, -.6], [2.0, .7, -3.6], u, 52); dof(.15);
});
// --- down to the old lab ---
S('F11', 33.75, 'cut', (lt, t) => { // "พวกเขาตัดสินใจลงไปตามทางลับ"
  fac({}, .6); [K, B, N, A].forEach((C, i) => { const k = clamp((lt - i * .55) / 1.6); put(C(), FAC, { p: [lerp(-6.8, -5.4 + i * .5, sstep(.8, 1, k)), lerp(4.0, 0, Math.min(1, k * 1.25)), lerp(-4.4, -3.2 + (i % 2) * .5, sstep(.8, 1, k))], ry: k < .8 ? 0 : 150, ex: 'worried', blink: blinkAt(t, i + 1), ...(k < .8 ? up2 : hip) }); C().g.visible = k > 0; });
  const u = U(lt, 3.1, eSine); camF([-2.8, 1.9, -4.1], [-6.6, 1.6, -4.5], [-3.0, 1.7, -4.0], [-6.4, 1.1, -4.2], u, 52); dof(.15);
});
S('F12', 36.85, 'cut', (lt, t) => { // "และพบห้องทดลองเก่าที่เต็มไปด้วยหินพลัง"
  fac(); Wd.coreAt(t, .6); coreGlow(t, .6); Wd.labScreen('off'); [K, B, N, A].forEach((C, i) => put(C(), FAC, { p: [-5.2 + i * .55, 0, -3.0 + (i % 2) * .5], ry: 130, ex: 'shocked', blink: blinkAt(t, i + 1), head: [-6, i * 8 - 12, 0], ...hug }));
  const u = U(lt, 3.3, eIO); camF([2.0, 3.8, 5.6], [-3.5, .6, -2.5], [1.6, 3.2, 5.2], [-3.5, .8, -2.5], u, 58);
});
S('F13', 40.15, 'cut', (lt, t) => { // "ตรงกลางห้องมีหินสีดำสนิทก้อนหนึ่งลอยอยู่"
  fac({}, .8); Wd.coreAt(t, 1); coreGlow(t, 1); const u = U(lt, 4.1, eIn); camF([.6, 1.5, 4.4], [0, 1.6, 0], [.3, 1.65, 2.6], [0, 1.7, 0], u, 40); dof(.3);
});
S('F14', 44.25, 'cut', (lt, t) => { // "เมื่อไครเข้าไปใกล้"
  fac({}, .8); Wd.coreAt(t, 1); coreGlow(t, 1); const k = clamp(lt / 1.6); put(K(), FAC, { p: [0, 0, lerp(3.6, 1.6, k)], ry: 180, walk: k < 1 ? { ph: lt * 6, stride: .1 } : null, ex: 'determined', blink: blinkAt(t, 1), ...hip });
  const u = U(lt, 1.8, eSine); camF([1.2, 1.5, 5.4], [0, 1.2, 2.0], [1.0, 1.5, 5.0], [0, 1.2, 1.8], u, 50); dof(.2);
});
S('F15', 46.05, 'whip', (lt, t) => { // "หินสีน้ำเงินที่เขาครอบครองกลับส่องแสงอย่างรุนแรง"
  fac({}, .6); Wd.coreAt(t, 1.4); coreGlow(t, 1.2); const k = K(), f = sstep(.2, 1.4, lt); put(k, FAC, { p: [0, 0, 1.6], ry: 15, ex: f > .5 ? 'shocked' : 'determined', blink: false, head: [-8 * f, 0, 0], ...offerR }); hold(k, ST.krai, t, .7 + f * .3, [.2, .62, .72]);
  const p = Wd.pts[1]; p.position.set(.3, 1.4, 302.4); p.color.set('#4ab8ff'); p.intensity = 2.5 * f; p.distance = 9; if (f > .3 && f < 1) SH.a = .25;
  const u = U(lt, 4.0, eSine); camF([.6, 1.25, 3.9], [0, 1.15, 1.4], [.5, 1.25, 3.6], [0, 1.15, 1.4], u, 44); dof(.3);
});
S('F16', 50.05, 'cut', (lt, t) => { // "หน้าจอแสดงข้อความว่า ตรวจพบพลังต้นกำเนิด"
  fac({}, .7); Wd.coreAt(t, 1.2); coreGlow(t, 1); const on = lt > .6; Wd.labScreen(on ? 'origin' : 'glitch', on ? 0 : Math.floor(lt * 14)); put(K(), FAC, { p: [.2, 0, 1.0], ry: 180, ex: 'shocked', blink: false, ...hug }); hold(K(), ST.krai, t, 1.2, [0, .45, .42]);
  const u = U(lt, 4.55, eSine); camF([.6, 1.6, 4.2], [0, 2.4, -5.8], [.4, 1.7, 3.4], [0, 2.5, -5.8], u, 46);
});
S('F17', 54.6, 'cut', (lt, t) => { // "ความสามารถที่แท้จริงของผู้ครอบครองคือ"
  fac({}, .7); Wd.coreAt(t, 1.2); coreGlow(t, 1); Wd.labScreen('origin', 1); const u = U(lt, 3.1, eSine); camF([0, 2.65, .4], [0, 2.6, -5.8], [0, 2.62, -.1], [0, 2.6, -5.8], u, 54);
});
S('F18', 57.7, 'cut', (lt, t) => { // "การคัดลอกและเชื่อมโยงความสามารถของผู้อื่น": beams to his friends
  fac({}, .7); Wd.coreAt(t, 1); coreGlow(t, .8); Wd.labScreen('origin', 1); labTeam(t, { krai: { ex: 'determined', ...offerR }, bruno: { ex: 'shocked' }, neo: { ex: 'shocked' }, ace: { ex: 'shocked' } }); hold(K(), ST.krai, t, 1.2, [.2, .62, .72]); muscle(sstep(1.2, 2, lt));
  const s = linkFrom(K()); [[B, '#ff4a3a', .4], [A, '#3af08a', .9], [N, '#ffd23a', 1.4]].forEach(([C, c, d], i) => Wd.linkAt(i, s, linkFrom(C()), sstep(d, d + .5, lt), c));
  const u = U(lt, 3.7, eSine); camF([1.4, 2.0, -1.4], [-.2, 1.0, 2.5], [1.2, 2.0, -1.2], [-.2, 1.0, 2.5], u, 54); dof(.15);
});
S('F19', 61.4, 'cut', (lt, t) => { // "ไครตกตะลึง"
  fac({}, .7); Wd.coreAt(t, 1); put(K(), FAC, { p: [0, 0, 1.6], ry: 180, ex: 'shocked', blink: false, ...up2 }); eyeGlow(.5, t); const u = U(lt, 1.85, eOut); camF([.1, 1.35, .3], [0, 1.3, 1.6], [.05, 1.35, .5], [0, 1.32, 1.6], u, 40); dof(.5);
});
S('F20', 63.25, 'cut', (lt, t) => { // "เพราะก่อนหน้านี้เขาคิดว่าตัวเองทำได้เพียงวิเคราะห์จุดอ่อนเท่านั้น"
  fac({}, .7); Wd.coreAt(t, .8); const k = K(); put(k, FAC, { p: [0, 0, 1.6], ry: 170, ex: 'worried', blink: blinkAt(t, 1), head: [22, 0, 0], ...offerR }); hold(k, ST.krai, t, 1, [.2, .62, .72]); Wd.retAt(WF(.25, 1.1, 1.0), .25, .6, t, false, '#4ab8ff');
  const u = U(lt, 4.35, eSine); camF([-.7, 1.6, -.2], [.1, 1.0, 1.4], [-.6, 1.55, 0], [.1, 1.0, 1.4], u, 42); dof(.4);
});
// --- the man in black ---
S('F21', 67.6, 'whip', (lt, t) => { // "แต่ทันใดนั้น"
  fac({}, .7); Wd.coreAt(t, .8); labTeam(t, { krai: { ry: lerp(180, 40, sstep(0, .5, lt)) }, bruno: { ry: lerp(160, 40, sstep(.1, .6, lt)) }, neo: { ry: lerp(200, 50, sstep(.1, .6, lt)) }, ace: { ry: lerp(175, 45, sstep(.05, .5, lt)) } });
  const u = U(lt, 1.2, eSine); camF([-1.2, 1.5, -.6], [.2, 1.1, 2.6], [-1.0, 1.5, -.4], [.2, 1.1, 2.6], u, 54); dof(.15);
});
S('F22', 68.8, 'cut', (lt, t) => { // "เสียงปรบมือก็ดังขึ้นจากด้านหลัง"
  fac({}, .5); const c = Math.abs(Math.sin(lt * 7)); put(DI(), FAC, { p: [6.4, 0, .25], ry: -90, ex: 'sly', blink: blinkAt(t, 6), hL: [-.06 - c * .12, .62, .45], hR: [.06 + c * .12, .62, .45], pL: [-1, -.4, 0], pR: [1, -.4, 0] });
  const u = U(lt, 2.7, eIn); camF([3.2, 1.2, 2.2], [6.4, 1.2, .25], [3.7, 1.2, 1.9], [6.4, 1.25, .25], u, 40); dof(.4);
});
S('F23', 71.5, 'cut', (lt, t) => { // "ชายในชุดดำคนหนึ่งเดินออกมาจากเงามืด"
  fac({}, .7); Wd.coreAt(t, .8); const k = clamp(lt / 2.6); put(DI(), FAC, { p: [lerp(6.4, 3.0, k), 0, lerp(.25, 1.4, k)], ry: -105, walk: k < 1 ? { ph: lt * 5, stride: .1 } : null, ex: 'sly', blink: blinkAt(t, 6), ...hip });
  labTeam(t, { krai: { ry: 60, ex: 'shocked' }, bruno: { ry: 70, ex: 'frown', ...fist }, neo: { ry: 70, ex: 'scared', sweat: true }, ace: { ry: 65, ex: 'shocked' } });
  const u = U(lt, 3.3, eSine); camF([-1.6, 1.2, .2], [3.6, 1.2, 1.2], [-1.4, 1.25, .4], [3.2, 1.2, 1.3], u, 46); dof(.15);
});
S('F24', 74.8, 'dis', (lt, t) => { // flashback: the man at the school ("เขาคือชายคนเดียวกับที่จับไครจากโรงเรียน")
  if (lt < 1.7) { school(); heroDesk(0, 0, 0); POST.sat = .3; POST.vig = .7; put(BO(), SC, { p: [.1, 0, 2.0], ry: 180, lean: 34, hipY: -.12, ex: 'sly', blink: blinkAt(t, 5), head: [10, 0, 12], hR: [.3, .36, .12], pR: [1, 0, -.5], hL: [-.25, .3, .3], pL: [-1, 0, 0] });
    camS([.05, .6, .55], [.1, 1.05, 1.9], [.05, .6, .55], [.1, 1.05, 1.9], 0, 46); dof(.3); return; }
  fac({}, .7); Wd.coreAt(t, .8); put(DI(), FAC, { p: [3.0, 0, 1.4], ry: -100, ex: 'sly', blink: blinkAt(t, 6), head: [-6, 0, 0], ...hip }); const u = U(lt - 1.7, 1.6, eOut); camF([1.9, .7, 2.0], [3.0, 1.4, 1.4], [2.0, .7, 2.0], [3.0, 1.45, 1.4], u, 44); dof(.4);
});
S('F25', 78.0, 'cut', (lt, t) => { // "ชายคนนั้นพูดว่า"
  fac({}, .7); Wd.coreAt(t, .8); put(DI(), FAC, { p: [3.0, 0, 1.4], ry: -95, ex: 'calm', blink: blinkAt(t, 6), ...hip }); labTeam(t, { krai: { ry: 60, ex: 'frown' }, bruno: { ry: 70, ex: 'frown', ...fist }, neo: { ry: 70, ex: 'scared' }, ace: { ry: 65, ex: 'worried' } });
  const u = U(lt, 2.1, eSine); camF([-1.4, 1.6, 4.6], [2.4, 1.1, 1.6], [-1.2, 1.6, 4.4], [2.4, 1.1, 1.6], u, 50); dof(.2);
});
S('F26', 80.1, 'cut', (lt, t) => { // "ในที่สุด เราก็พบคนที่เราตามหามาตลอด"
  fac({}, .7); Wd.coreAt(t, .8); put(DI(), FAC, { p: [3.0, 0, 1.4], ry: -100, ex: 'sly', talk: talkAt(t), blink: blinkAt(t, 6), ...(lt > 1.5 ? offerR : hip) }); put(K(), FAC, { p: [.6, 0, 2.6], ry: 110, ex: 'frown', blink: blinkAt(t, 1), ...hip });
  const u = U(lt, 3.75, eIn); camF([.6, 1.45, .2], [3.0, 1.35, 1.4], [.9, 1.42, .35], [3.0, 1.38, 1.4], u, 40); dof(.4);
});
S('F27', 83.85, 'cut', (lt, t) => { // "ก่อนที่เขาจะยิ้มและพูดต่อว่า": guards step out behind him
  fac({}, .7); Wd.coreAt(t, .8); put(DI(), FAC, { p: [3.0, 0, 1.4], ry: -100, ex: lt > .8 ? 'happy' : 'sly', blink: blinkAt(t, 6), ...hip });
  [0, 1, 2].forEach(i => { const k = clamp((lt - .5 - i * .3) / 1.0); put(TR(i), FAC, { p: [lerp(6.6, 4.0 + i * .4, k), 0, lerp(.25, 2.4 - i * 1.0, k)], ry: -110, walk: k < 1 ? { ph: lt * 8 + i, stride: .14 } : null, ex: 'frown', blink: blinkAt(t, i + 7), ...fold }); TR(i).g.visible = k > 0; });
  const u = U(lt, 2.65, eSine); camF([.4, 1.4, 3.4], [3.8, 1.1, 1.4], [.6, 1.4, 3.3], [3.8, 1.1, 1.4], u, 50); dof(.2);
});
S('F28', 86.5, 'cut', (lt, t) => { // "พาเขาไปที่ศูนย์ควบคุม"
  fac({}, .7); Wd.coreAt(t, .8); put(DI(), FAC, { p: [3.0, 0, 1.4], ry: -100, ex: 'sly', talk: talkAt(t), blink: blinkAt(t, 6), ...pointR }); [0, 1, 2].forEach(i => put(TR(i), FAC, { p: [4.0 + i * .4, 0, 2.4 - i * 1.0], ry: -110, ex: 'frown', ...fold }));
  put(K(), FAC, { p: [.6, 0, 2.6], ry: 110, ex: 'shocked', blink: false, ...hug }); const u = U(lt, 2.1, eSine); camF([-.6, 1.5, 4.0], [3.0, 1.2, 1.6], [-.4, 1.5, 3.9], [3.0, 1.2, 1.6], u, 52); dof(.2);
});
S('F29', 88.6, 'cut', (lt, t) => { // "ส่วนคนอื่น กำจัดทิ้ง"
  fac({}, .6); Wd.coreAt(t, .8); redRoom(t, 0); Wd.redTint(sstep(1.5, 1.8, lt) * .25); [0, 1, 2].forEach(i => { const k = clamp((lt - 1.5) / 1.6); put(TR(i), FAC, { p: [lerp(4.0 + i * .4, 2.6 + i * .3, k), 0, lerp(2.4 - i * 1.0, 2.6 - i * .9, k)], ry: -110, walk: k > 0 && k < 1 ? { ph: lt * 8 + i, stride: .14 } : null, ex: 'frown', ...pointR }); });
  labTeam(t, { krai: { ry: 60, ex: 'shocked' }, bruno: { ry: 70, ex: 'frown', ...fist }, neo: { ry: 70, ex: 'scared', sweat: true, ...up2 }, ace: { ry: 65, ex: 'scared', sweat: true } }); Wd.black(sstep(3.0, 3.85, lt));
  const u = U(lt, 3.9, eIn); camF([-1.6, 1.7, -.6], [2.0, 1.1, 2.0], [-1.2, 1.65, -.3], [2.0, 1.1, 2.0], u, 54); dof(.15);
});
export const COVER = { id: 'COVER', t0: 0, fn: (lt, t, o = {}) => {
  fac({}, .6); Wd.coreAt(2, 1.4); coreGlow(2, 1.2); const k = K(); put(k, FAC, { p: [0, 0, 1.5], ry: 10, ex: 'determined', blink: false, ...offerR }); hold(k, ST.krai, 2, 1.0, [.2, .62, .72]); eyeGlow(.6, 2);
  put(DI(), FAC, { p: [1.3, 0, -.5], ry: -20, ex: 'sly', ...hip }); const cm = o.cam || [.4, 1.25, 4.4], g = o.tgt || [.5, 1.45, .6]; camF(cm, g, cm, g, 0, o.fov || 48);
} };
