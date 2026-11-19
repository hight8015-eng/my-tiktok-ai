// ===================== EP 5 (80.42 s): the traitor =====================
const r12 = (o = {}) => { room(o); Wd.setRoom('12', '#d9cfe6'); XA.pile.visible = true; XA.pile.position.set(-3.3 - 300, -4, -3.6); };
const W12 = (x, y, z) => [x - 300, y - 4, z];
const T20 = () => XA.towers[20];
const R20 = (x, z) => { const T = T20(); return [T.x + x, T.top, T.z + z]; };
const redRoom = (t, k = 1) => { const p = Wd.pts[1]; p.position.set(-300, -2.0, -3.4); p.color.set('#ff3a4a'); p.intensity = 3.5 * k * (.8 + .2 * Math.sin(t * 8)); Wd.redTint(k * (.12 + .08 * Math.sin(t * 7))); };
S('D01', 0, 'cut', (lt, t) => { // after the giants' secret ("หลังจากค้นพบความลับของปีศาจ")
  room(); Wd.screen('ctl', 0, 0, .4); const k = K(); put(k, CR, { p: [.5, 0, .6], ry: 180, ex: 'calm', blink: blinkAt(t, 1), ...hug }); Wd.stoneAt(4, [0, 0, 0], t, 1.2); propAt(XA.stones[4], k, [0, .33, .42]);
  const u = U(lt, 2.9, eSine); camR([0, 1.85, 3.4], [0, 1.9, -4.9], [0, 1.8, 2.6], [.3, 1.5, -2], u, 52);
});
S('D02', 2.9, 'cut', (lt, t) => { // Krai suspects someone is watching ("ไครเริ่มสงสัยว่ามีใครบางคนกำลังติดตามการเคลื่อนไหวของพวกเขา")
  room(); put(K(), CR, { p: [-3.9, 0, 2.2], ry: lerp(20, 70, eSine(clamp(lt / 4))), ex: 'calm', blink: blinkAt(t, 1), look: [Math.sin(lt * 1.5) * .7, 0], ...chin });
  const u = U(lt, 5.3, eSine); camR([-2.4, 1.4, 3.1], [-3.9, 1.3, 2.2], [-2.6, 1.4, 3.0], [-3.9, 1.3, 2.2], u, 40); dof(.5);
});
S('D03', 8.2, 'cut', (lt, t) => { // every time they go out... ("เพราะทุกครั้งที่ทีมออกไปสำรวจ")
  city(); const x = 3 - lt * 1.1; [K, N, B, A].forEach((C, i) => put(C(), CT, { p: [x - i * .75, 0, 4.0 - i * .15], ry: -95, lean: 10, walk: { ph: lt * 6 + i, stride: .1 }, ex: i === 0 ? 'sneaky' : 'worried', blink: blinkAt(t, i + 1), ...hip }));
  const u = U(lt, 2.2, eSine); camC([x - 1.2, 2.4, 7.4], [x - 1.2, .9, 4.0], [x - 1.6, 2.4, 7.2], [x - 1.6, .9, 4.0], u, 50); dof(.15);
});
S('D04', 10.4, 'cut', (lt, t) => { // ...the enemy already knows ("ศัตรูมักจะรู้ตำแหน่งของพวกเขาล่วงหน้า")
  city(); const T = tower(-30, 0); [0, 1, 2, 3].forEach(i => put(STU(i), CT, { p: [T.x + 2.5, T.top, (i - 1.5) * .9], ry: 90, ex: 'sly', blink: blinkAt(t, i + 2), ...(i % 2 ? fold : pointR) }));
  const u = U(lt, 3.3, eSine); camC([T.x + 9, T.top + 2.5, 5], [T.x + 2.5, T.top + 1, 0], [T.x + 8.5, T.top + 2.4, 4.6], [T.x + 2.5, T.top + 1, 0], u, 40);
});
S('D05', 13.7, 'cut', (lt, t) => { // a test: a fake plan ("ไครจึงตัดสินใจทดสอบทุกคนด้วยการบอกแผนการปลอม ๆ ว่า")
  room(); Wd.screen('goal', 0, 0, .3); put(K(), CR, { p: [1.2, 0, -.2], ry: -8, ex: lt > 2.5 ? 'sly' : 'determined', talk: talkAt(t), blink: blinkAt(t, 1), ...(lt > 2.5 ? fist : pointR) });
  put(B(), CR, { p: [-.3, 0, 2.5], ry: 160, ex: 'calm', blink: blinkAt(t, 2), ...fold }); put(N(), CR, { p: [1.7, 0, 2.3], ry: 210, ex: 'happy', blink: blinkAt(t, 3), ...hug }); put(A(), CR, { p: [2.4, 0, 2.0], ry: 220, ex: 'calm', blink: blinkAt(t, 4), ...hip });
  const u = U(lt, 4.4, eSine); camR([.4, 1.6, 4.0], [1.0, 1.2, .4], [.6, 1.6, 3.7], [1.0, 1.2, .4], u, 58); dof(.15);
});
S('D06', 18.1, 'cut', (lt, t) => { // "พวกเขาจะออกไปหาหินพลังที่ตึกหมายเลข 20 ในคืนถัดไป"
  room(); Wd.uiAt(eOut(clamp(lt / .35)), 'plan', 0, 0, -1.6, .3); put(K(), CR, { p: [1.2, 0, -.2], ry: -8, ex: 'sly', talk: talkAt(t), blink: blinkAt(t, 1), ...fist });
  const u = U(lt, 4.3, eSine); camR([1.0, 1.45, 2.4], [1.2, 1.3, -.2], [1.05, 1.45, 2.1], [1.2, 1.3, -.2], u, 42); dof(.4);
});
S('D07', 22.85, 'cut', (lt, t) => { // the next night, tower 20: an ambush ("แต่เมื่อถึงเวลา กลับมีกลุ่มนักเรียนจากห้องอื่นมาดักรออยู่จริง ๆ")
  city({}, true); const T = T20(); const ap = sstep(1.2, 2.0, lt);
  [0, 1, 2, 3].forEach(i => { put(STU(i), CT, { p: R20(-1.6 + i * 1.0, -2.6 + (i % 2) * .4), ry: 0, ex: 'sly', blink: blinkAt(t, i + 2), ...(i % 2 ? fold : pointR) }); STU(i).g.visible = ap > .1 * (i + 1); });
  [K, N, B, A].forEach((C, i) => put(C(), CT, { p: R20(-1.2 + i * .8, 2.4), ry: 180, ex: ap > .5 ? 'shocked' : 'sneaky', blink: false, ...(ap > .5 ? up2 : hip) }));
  const p = Wd.pts[1]; p.position.set(T.x - 300, T.top + 4, T.z); p.color.set('#ffd8a0'); p.intensity = 1.5; p.distance = 20;
  const u = U(lt, 4.3, eSine); camC([T.x + 4.5, T.top + 2.4, T.z + 6.5], [T.x - .2, T.top + 1, T.z - .5], [T.x + 4, T.top + 2.2, T.z + 5.8], [T.x - .2, T.top + 1, T.z - .5], u, 50);
});
S('D08', 27.65, 'cut', (lt, t) => { // Krai is sure: someone inside leaks ("ไครเริ่มมั่นใจว่ามีคนในทีมส่งข้อมูลออกไป")
  city({}, true); const T = T20(); put(K(), CT, { p: R20(-1.2, 2.4), ry: 200, ex: 'frown', blink: blinkAt(t, 1), look: [-.7, 0], ...hip }); const p = Wd.pts[1]; p.position.set(T.x - 300, T.top + 4, T.z); p.color.set('#ffd8a0'); p.intensity = 1.5; p.distance = 20;
  const u = U(lt, 3.7, eSine); camC([T.x - 1.4, T.top + 1.35, T.z + .9], [T.x - 1.2, T.top + 1.25, T.z + 2.4], [T.x - 1.35, T.top + 1.35, T.z + 1.2], [T.x - 1.2, T.top + 1.25, T.z + 2.4], u, 40); dof(.5);
});
S('D09', 32.1, 'sweep', (lt, t) => { // that night he hides Neo's detector ("คืนนั้น เขาแอบติดอุปกรณ์ตรวจจับสัญญาณที่นีโอสร้างไว้ในห้อง")
  room({}, true); Wd.pts[0].intensity = .3; const k = K(); put(k, CR, { p: [3.95, 0, 2.7], ry: -100, hipY: -.3, lean: 25, ex: 'sneaky', blink: blinkAt(t, 1), hR: [.2, .3, .6], pR: [1, -.4, 0], hL: [-.3, .36, .12], pL: [-1, 0, -.5] }); propAt(XA.gadget, k, [.2, .38, .66], [0, k.g.rotation.y, 0]); XA.led.material.opacity = (t * 1.5) % 1 < .2 ? .9 : .1;
  [B, N, A].forEach((C, i) => put(C(), CR, { p: [-2.2 + i * 1.6, 0, -2.8], ry: 0, sit: true, seat: .05, ex: 'sleepy', blink: true, head: [12, 0, i * 6 - 6], ...hug }));
  const u = U(lt, 4.6, eSine); camR([4.4, 1.5, 4.6], [3.6, .6, 2.5], [4.3, 1.4, 4.4], [3.6, .6, 2.5], u, 46); dof(.3);
});
S('D10', 37.3, 'cut', (lt, t) => { // the alarm goes off ("ไม่นาน อุปกรณ์ก็ส่งเสียงเตือน")
  room({}, true); Wd.pts[0].intensity = .3; XA.gadget.visible = true; XA.gadget.position.set(3.55 - 300, -4 + .06, 2.65); XA.gadget.rotation.set(0, -1.7, 0); XA.led.material.color.set('#ff3a3a'); XA.led.material.opacity = (t * 4) % 1 < .5 ? 1 : .1; XA.led.scale.setScalar(.12 + .1 * ((t * 4) % 1 < .5));
  const u = U(lt, 2.8, eOut); camR([4.15, .45, 3.3], [3.55, .08, 2.65], [4.0, .4, 3.1], [3.55, .08, 2.65], u, 40); dof(.55);
});
S('D11', 40.15, 'cut', (lt, t) => { // the signal comes from Ace's communicator ("สัญญาณกำลังถูกส่งออกมาจากอุปกรณ์สื่อสารของเอซ")
  room({}, true); Wd.pts[0].intensity = .3; const a = A(); put(a, CR, { p: [.4, 0, -2.6], ry: 20, sit: true, seat: .05, ex: lt > 1.5 ? 'shocked' : 'sleepy', blink: lt < 1.5, ...hug }); propAt(XA.comm, a, [.25, .35, .3], [0, a.g.rotation.y, 0]); XA.commGlow.material.opacity = .5 + .4 * Math.sin(t * 10);
  Wd.uiAt(eOut(clamp((lt - .2) / .35)), 'signal', Math.floor(t * 8), 0, -1.6, .3); const u = U(lt, 3.8, eSine); camR([1.0, 1.0, -.4], [.4, .7, -2.5], [.9, .95, -.7], [.4, .7, -2.5], u, 46); dof(.3);
});
S('D12', 43.95, 'whip', (lt, t) => { // Bruno lunges; Krai stops him ("บรูโน่โกรธมาก และพยายามเข้าไปจับตัวเอซ แต่ไครห้ามไว้")
  room({}, true); Wd.pts[0].intensity = .9; const k = eOut(clamp(lt / .6)), st = sstep(2.0, 2.6, lt); put(A(), CR, { p: [-.4, 0, -1.8], ry: 40, ex: 'scared', sweat: true, blink: false, ...up2 });
  put(B(), CR, { p: [lerp(2.4, 1.3, k) + st * .3, 0, lerp(.6, -.6, k) + st * .3], ry: -130, lean: 15 * (1 - st), ex: 'frown', talk: talkAt(t), blink: false, ...pointR }); put(K(), CR, { p: [.7, 0, -1.0], ry: lerp(-90, 50, st), ex: 'determined', blink: blinkAt(t, 1), hL: [-.42, .8, .4], pL: [-1, -.2, 0], hR: [.42, .8, .4], pR: [1, -.2, 0] });
  put(N(), CR, { p: [-1.6, 0, .4], ry: 80, ex: 'worried', sweat: true, ...hug }); const u = U(lt, 4.4, eSine); camR([-.2, 1.6, 3.4], [.6, 1.0, -1.0], [-.1, 1.55, 3.1], [.6, 1.0, -1.0], u, 56); dof(.15);
});
S('D13', 49.1, 'cut', (lt, t) => { // Ace admits it ("เอซยอมรับว่า เขาติดต่อกับห้องหมายเลข 12 จริง")
  room({}, true); Wd.pts[0].intensity = .9; put(A(), CR, { p: [-.4, 0, -1.8], ry: 40, ex: 'sad', talk: talkAt(t), sweat: true, blink: blinkAt(t, 4), head: [14, 0, 0], ...hug }); propAt(XA.comm, A(), [0, .45, .4], [0, A().g.rotation.y, 0]);
  const u = U(lt, 3.4, eSine); camR([.5, 1.35, -.5], [-.4, 1.15, -1.8], [.4, 1.35, -.7], [-.4, 1.15, -1.8], u, 40); dof(.45);
});
S('D14', 52.55, 'dis', (lt, t) => { // Victor's promise (memory) ("เพราะวิกเตอร์สัญญาว่าจะช่วยให้เขาออกจากเกมได้")
  r12(); POST.sat = .5; POST.lift = 1.12; put(VI(), CR, { p: [.25, 0, 0], ry: 90, ex: 'sly', talk: talkAt(t), blink: blinkAt(t, 6), ...offerR }); put(A(), CR, { p: [1.3, 0, .1], ry: -90, ex: 'worried', blink: blinkAt(t, 4), ...hug });
  Wd.auraAt(1, W12(0, .6, 0), 2.6, .2); const u = U(lt, 3.7, eSine); camR([.65, 1.45, 3.2], [.65, 1.2, 0], [.65, 1.45, 2.9], [.65, 1.2, 0], u, 50); dof(.2);
});
S('D15', 56.25, 'dis', (lt, t) => { // he never meant to hurt anyone ("แต่เอซยืนยันว่า เขาไม่เคยคิดจะทำร้ายเพื่อน")
  room({}, true); Wd.pts[0].intensity = .9; put(A(), CR, { p: [-.4, 0, -1.8], ry: 40, ex: 'sad', talk: talkAt(t), sweat: true, blink: blinkAt(t, 4), ...offerR });
  put(K(), CR, { p: [.7, 0, -1.0], ry: -110, ex: 'calm', blink: blinkAt(t, 1), ...hip }); put(B(), CR, { p: [1.6, 0, -.3], ry: -120, ex: 'frown', ...fold });
  const u = U(lt, 4.3, eSine); camR([.1, 1.4, .6], [-.4, 1.2, -1.8], [.05, 1.4, .3], [-.4, 1.2, -1.8], u, 42); dof(.4);
});
S('D16', 60.55, 'cut', (lt, t) => { // the screen turns red ("ก่อนที่ทุกคนจะได้พูดอะไร หน้าจอห้องก็เปลี่ยนเป็นสีแดง")
  room({}, true); const r = sstep(1.6, 2.2, lt); Wd.pts[0].intensity = .9 * (1 - r * .6); Wd.screen(r > .5 ? 'glitch' : 'off', Math.floor(lt * 14), 0, r * .5); redRoom(t, r);
  team(t, { b: { ry: 180, ex: r > .5 ? 'shocked' : 'frown' }, n: { ry: 170, ex: r > .5 ? 'scared' : 'worried' }, a: { ry: 190, ex: 'sad' } }); put(K(), CR, { p: [.4, 0, 1.4], ry: 180, ex: r > .5 ? 'shocked' : 'calm', ...hip });
  const u = U(lt, 4.4, eSine); camR([.6, 1.6, 5.0], [0, 1.8, -4.8], [.4, 1.6, 4.4], [0, 1.9, -4.8], u, 52);
});
S('D17', 64.95, 'cut', (lt, t) => { // "ตรวจพบการละเมิดกฎ ระบบกำลังลงโทษห้องหมายเลข 07"
  room({}, true); Wd.pts[0].intensity = .35; Wd.screen('red', 0, 0, .6); redRoom(t); team(t, { b: { ry: 180 }, n: { ry: 170 }, a: { ry: 190 } }); put(K(), CR, { p: [1.2, 0, 1.4], ry: 180, ...hip });
  const u = U(lt, 4.9, eSine); camR([0, 1.8, 2.3], [0, 1.9, -4.9], [0, 1.85, 1.8], [0, 1.9, -4.9], u, 56);
});
S('D18', 69.9, 'whip', (lt, t) => { // the doors slam and lock ("ประตูทั้งสองบานถูกล็อก")
  room({}, true); Wd.pts[0].intensity = .35; redRoom(t); const c = eIn(sstep(0, .35, lt)); XA.doorP.rotation.y = -1.3 * (1 - c); if (lt > .35 && lt < .7) SH.a = .5;
  const u = U(lt, 1.9, eOut); camR([.8, 1.5, 4.6], [5.0, 1.2, 3.6], [1.1, 1.5, 4.5], [5.0, 1.2, 3.6], u, 40); dof(.2);
});
S('D19', 71.8, 'cut', (lt, t) => { // the announcement again ("และเสียงประกาศก็ดังขึ้นอีกครั้ง")
  room({}, true); Wd.pts[0].intensity = .35; redRoom(t); Wd.screen('glitch', Math.floor(lt * 16), 0, .5); team(t, { b: { p: [-1.5, 0, .2], ry: 180, ex: 'scared', sweat: true }, n: { p: [1.5, 0, .1], ry: 170, ex: 'scared', sweat: true }, a: { p: [-.55, 0, .7], ry: 190, ex: 'sad', sweat: true } }); XA.roomDesks.visible = false; put(K(), CR, { p: [.5, 0, .6], ry: 180, ex: 'frown', ...hip });
  const u = U(lt, 2.5, eSine); camR([.2, 2.3, -4.4], [0, 1.0, .5], [.15, 2.2, -4.1], [0, 1.0, .5], u, 56); dof(.15);
});
S('D20', 74.3, 'cut', (lt, t) => { // "ผู้ทรยศถูกตรวจพบแล้ว เริ่มกระบวนการกำจัดทั้งห้อง"
  room({}, true); Wd.pts[0].intensity = .3; redRoom(t, 1.2); Wd.screen('traitor', t > 76.9 ? 1 : 0, 0, .7); team(t, { b: { ry: 180, ex: 'scared' }, n: { ry: 170, ex: 'scared', sweat: true }, a: { ry: 190, ex: 'sad', sweat: true } }); put(K(), CR, { p: [1.2, 0, 1.4], ry: 180, ex: 'shocked', ...hip });
  const u = U(lt, 6.1, eIn); camR([0, 1.85, 2.4], [0, 1.9, -4.9], [0, 1.9, 1.2], [0, 1.9, -4.9], u, 56);
});
export const COVER = { id: 'COVER', t0: 0, fn: (lt, t, o = {}) => {
  room({}, true); Wd.pts[0].intensity = .35; redRoom(2, 1.1); Wd.screen('traitor', 1, 0, .7); XA.roomDesks.visible = false;
  put(A(), CR, { p: [.0, 0, .4], ry: 180, ex: 'sad', sweat: true, ...hug }); propAt(XA.comm, A(), [0, .45, .4], [0, A().g.rotation.y, 0]); XA.commGlow.material.opacity = .8;
  put(K(), CR, { p: [-1.1, 0, .9], ry: 160, ex: 'frown', ...hip }); put(B(), CR, { p: [1.2, 0, 1.0], ry: 200, ex: 'frown', ...fold }); put(N(), CR, { p: [-.4, 0, 1.6], ry: 175, ex: 'scared', sweat: true, ...hug });
  const cm = o.cam || [.1, 1.5, -2.6], g = o.tgt || [0, 1.6, 1.4]; camR(cm, g, cm, g, 0, o.fov || 56);
} };
