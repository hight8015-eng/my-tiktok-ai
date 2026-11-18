// chars.js: original chibi sailors (big round head, bean eyes, nose, ears, capsule body, IK limbs, canvas faces)
import { THREE, toon, basic, noOutline, canvasTex, mesh, group, clamp, lerp, D2R, GRAD_FLAT, GRAD_2, noise1 } from './engine.js';

const FACE = new Map();
const EX = {
  neutral: { eyes: 'open', bl: 0, br: 0, by: 0, mouth: 'smile' },
  calm: { eyes: 'open', bl: -4, br: 4, by: 2, mouth: 'flat' },
  sleepy: { eyes: 'half', bl: -8, br: 8, by: 8, mouth: 'flat' },
  yawn: { eyes: 'closed', bl: -10, br: 10, by: 6, mouth: 'yawn' },
  sly: { eyes: 'half', bl: 16, br: -10, by: -2, mouth: 'smirk' },
  wink: { eyes: 'wink', bl: 14, br: -8, by: -2, mouth: 'grin' },
  shocked: { eyes: 'wide', bl: 18, br: -18, by: -14, mouth: 'o' },
  scared: { eyes: 'wide', bl: 22, br: -22, by: -12, mouth: 'open' },
  confident: { eyes: 'happy', bl: -6, br: 6, by: -6, mouth: 'grin' },
  worried: { eyes: 'open', bl: 22, br: -22, by: -6, mouth: 'wavy' },
  happy: { eyes: 'happy', bl: 0, br: 0, by: -4, mouth: 'open' },
  sneaky: { eyes: 'side', bl: 10, br: -4, by: 0, mouth: 'smirk' },
  frown: { eyes: 'open', bl: -18, br: 18, by: 4, mouth: 'frown' },
  sad: { eyes: 'half', bl: 20, br: -20, by: 0, mouth: 'frown' },
  determined: { eyes: 'open', bl: -14, br: 14, by: 2, mouth: 'flat' },
  // v4 extra faces
  grinTeeth: { eyes: 'happy', bl: -4, br: 4, by: -8, mouth: 'teeth' },
  evil: { eyes: 'half', bl: -20, br: 20, by: 4, mouth: 'teeth' },
  nervous: { eyes: 'wide', bl: 22, br: -22, by: -10, mouth: 'clench' },
  scream: { eyes: 'wide', bl: 26, br: -26, by: -16, mouth: 'bigO' },
  smug: { eyes: 'closed', bl: 10, br: -10, by: -4, mouth: 'smirk' },
  angry: { eyes: 'open', bl: -26, br: 26, by: 8, mouth: 'clench' },
};
function drawFace(x, spec, e, blink, talk, look) { // v2: flat ink faces on a white ball head (no nose)
  const S = 512; x.clearRect(0, 0, S, S);
  const ey = S * (spec.eyeY ?? .5), ex = S * .125, ink = '#1c1420';
  x.fillStyle = spec.cheek || 'rgba(255,128,140,.38)'; for (const s of [-1, 1]) { x.beginPath(); x.ellipse(S / 2 + s * S * .2, ey + 62, 26, 15, 0, 0, 7); x.fill(); }
  const eyes = blink ? 'closed' : e.eyes; const lx = (look?.[0] || 0) * 9, ly = (look?.[1] || 0) * 7;
  x.lineCap = 'round'; x.lineJoin = 'round';
  for (const s of [-1, 1]) {
    const cx = S / 2 + s * ex, cy = ey; let kind = eyes; if (kind === 'wink') kind = s < 0 ? 'open' : 'closedUp';
    x.fillStyle = ink; x.strokeStyle = ink; x.lineWidth = 19;
    if (kind === 'open' || kind === 'side') { const dx = kind === 'side' ? 11 * (spec.sideDir || 1) : lx; x.beginPath(); x.ellipse(cx + dx, cy + ly, 15, 21, 0, 0, 7); x.fill(); }
    else if (kind === 'half') { x.save(); x.beginPath(); x.rect(cx - 40, cy - 2, 80, 60); x.clip(); x.beginPath(); x.ellipse(cx + lx, cy + 2, 16, 20, 0, 0, 7); x.fill(); x.restore(); x.beginPath(); x.moveTo(cx - 25, cy - 2); x.lineTo(cx + 25, cy - 2); x.stroke(); }
    else if (kind === 'closed') { x.beginPath(); x.moveTo(cx - 22, cy + 2); x.quadraticCurveTo(cx, cy + 14, cx + 22, cy + 2); x.stroke(); }
    else if (kind === 'closedUp' || kind === 'happy') { x.beginPath(); x.moveTo(cx - 22, cy + 8); x.quadraticCurveTo(cx, cy - 16, cx + 22, cy + 8); x.stroke(); }
    else if (kind === 'wide') { x.fillStyle = '#fbf8f2'; x.lineWidth = 13; x.beginPath(); x.ellipse(cx, cy, 30, 36, 0, 0, 7); x.fill(); x.stroke(); x.fillStyle = ink; x.beginPath(); x.arc(cx + lx * .6, cy + ly * .6, 9, 0, 7); x.fill(); }
    const ang = (s < 0 ? e.bl : e.br) * D2R; const by = cy - 48 + (e.by || 0);
    x.strokeStyle = spec.browC || ink; x.lineWidth = spec.browW || 22; x.save(); x.translate(cx, by); x.rotate(s < 0 ? -ang : ang); x.beginPath(); x.moveTo(-24, 0); x.lineTo(24, 0); x.stroke(); x.restore();
  }
  if (spec.fringe) { x.fillStyle = spec.fringe; x.strokeStyle = ink; x.lineWidth = 12; const top = ey - 190, L = S * .16, Rr = S * .84, n = 6; x.beginPath(); x.moveTo(L, top); x.lineTo(L, ey - 60);
    for (let i = 1; i <= n; i++) { const bx = L + (Rr - L) * i / n, yb = ey - 60 - Math.sin(Math.PI * i / n) * 34 - (i === n ? 0 : 0); x.quadraticCurveTo(bx - (Rr - L) / n / 2, yb + 44, bx, i === n ? ey - 60 : yb); }
    x.lineTo(Rr, top); x.closePath(); x.fill(); x.stroke(); }
  if (spec.glasses2D) { x.strokeStyle = ink; x.lineWidth = 13; for (const s of [-1, 1]) { x.beginPath(); x.arc(S / 2 + s * ex, ey, 36, 0, 7); x.stroke(); } x.beginPath(); x.moveTo(S / 2 - ex + 36, ey - 4); x.quadraticCurveTo(S / 2, ey - 14, S / 2 + ex - 36, ey - 4); x.stroke(); }
  const my = S * (spec.mouthY ?? .7);
  if (spec.beard) { x.fillStyle = spec.beard; x.strokeStyle = ink; x.lineWidth = 12; const top = ey + 34, L = S * .25, Rr = S * .75; x.beginPath(); x.moveTo(L, top);
    const n = 7; for (let i = 0; i <= n; i++) { const u = i / n, bx = L + (Rr - L) * u, by = top + Math.sin(Math.PI * u) * 120 + 18; if (i) x.quadraticCurveTo(bx - (Rr - L) / n / 2, by + 26, bx, by); else x.lineTo(bx, by); }
    x.lineTo(Rr, top); x.quadraticCurveTo(S / 2, top + 44, L, top); x.closePath(); x.fill(); x.stroke(); }
  let m = e.mouth; if (talk > 0) m = talk > .66 ? 'open' : talk > .33 ? 'talk' : (m === 'o' || m === 'yawn' ? m : 'flat');
  x.strokeStyle = ink; x.fillStyle = '#3a1a24'; x.lineWidth = 15; const cx = S / 2;
  if (m === 'smile') { x.beginPath(); x.moveTo(cx - 24, my - 2); x.quadraticCurveTo(cx, my + 16, cx + 24, my - 2); x.stroke(); }
  else if (m === 'flat') { x.beginPath(); x.moveTo(cx - 18, my + 4); x.lineTo(cx + 18, my + 4); x.stroke(); }
  else if (m === 'smirk') { x.beginPath(); x.moveTo(cx - 22, my + 6); x.quadraticCurveTo(cx + 6, my + 12, cx + 28, my - 6); x.stroke(); }
  else if (m === 'grin') { x.beginPath(); x.moveTo(cx - 32, my - 4); x.quadraticCurveTo(cx, my + 40, cx + 32, my - 4); x.closePath(); x.fill(); x.stroke(); x.fillStyle = '#fbf8f2'; x.fillRect(cx - 22, my - 1, 44, 8); }
  else if (m === 'o') { x.beginPath(); x.ellipse(cx, my + 6, 11, 15, 0, 0, 7); x.fill(); x.stroke(); }
  else if (m === 'open' || m === 'talk') { const h = m === 'open' ? 22 : 12; x.beginPath(); x.moveTo(cx - 22, my - 2); x.quadraticCurveTo(cx, my + h * 2, cx + 22, my - 2); x.closePath(); x.fill(); x.stroke(); }
  else if (m === 'yawn') { x.beginPath(); x.ellipse(cx, my + 10, 24, 32, 0, 0, 7); x.fill(); x.stroke(); }
  else if (m === 'frown') { x.beginPath(); x.moveTo(cx - 22, my + 12); x.quadraticCurveTo(cx, my - 6, cx + 22, my + 12); x.stroke(); }
  else if (m === 'teeth' || m === 'clench') { const w = m === 'teeth' ? 60 : 46, h = m === 'teeth' ? 50 : 30, y0 = my - (m === 'teeth' ? 10 : 4);
    x.fillStyle = '#fbf8f2'; x.beginPath(); if (m === 'teeth') { x.moveTo(cx - w, y0); x.lineTo(cx + w, y0); x.quadraticCurveTo(cx + w, y0 + h, cx, y0 + h); x.quadraticCurveTo(cx - w, y0 + h, cx - w, y0); } else x.roundRect(cx - w, y0, w * 2, h, 8);
    x.closePath(); x.fill(); x.stroke(); x.lineWidth = 9; x.beginPath(); x.moveTo(cx - w + 4, y0 + h * .45); x.lineTo(cx + w - 4, y0 + h * .45); for (let i = -2; i <= 2; i++) { x.moveTo(cx + i * w / 3, y0 + 2); x.lineTo(cx + i * w / 3, y0 + h - 4); } x.stroke(); x.lineWidth = 15; }
  else if (m === 'bigO') { x.beginPath(); x.ellipse(cx, my + 22, 40, 58, 0, 0, 7); x.fill(); x.stroke(); }
  else if (m === 'wavy') { x.beginPath(); x.moveTo(cx - 26, my + 6); for (let i = 1; i <= 6; i++) x.lineTo(cx - 26 + i * 8.7, my + 6 + (i % 2 ? -6 : 6)); x.stroke(); }
  if (spec.stache) { x.fillStyle = spec.stacheC || '#f2f0ea'; x.strokeStyle = ink; x.lineWidth = 12; for (const s of [-1, 1]) { x.beginPath(); x.moveTo(cx, my - 24); x.bezierCurveTo(cx + s * 26, my - 46, cx + s * 62, my - 28, cx + s * 78, my - 44); x.bezierCurveTo(cx + s * 72, my - 4, cx + s * 26, my - 6, cx, my - 12); x.closePath(); x.fill(); x.stroke(); } }
}
function faceTexFor(spec, exName, blink, talk, look) {
  const e = EX[exName] || EX.neutral; const tq = talk > .66 ? 2 : talk > .33 ? 1 : 0;
  const key = spec.id + '|' + exName + '|' + (blink ? 1 : 0) + '|' + tq + '|' + (look ? look.join(',') : '');
  if (FACE.has(key)) return FACE.get(key);
  const t = canvasTex(512, 512, (x) => drawFace(x, spec, e, blink, tq ? (tq === 2 ? 1 : .5) : 0, look)); FACE.set(key, t); return t;
}
const stripeTex = (a, b) => canvasTex(128, 1024, (x, w, h) => { for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? b : a; x.fillRect(0, i * h / 8, w, h / 8); } });

export const CHARS = {};
const stripeTexH = (a, b, n = 8) => canvasTex(128, 1024, (x, w, h) => { for (let i = 0; i < n; i++) { x.fillStyle = i % 2 ? b : a; x.fillRect(0, i * h / n, w, h / n); } });
const OL = .0095; // hull outline thickness for characters
export function makeChar(spec) { // v2: stick figure: white ball head, bean torso, black stick limbs
  spec = { shirt: '#2f5597', hatC: '#2b3a6b', s: .56, belly: 1, ...spec };
  const g = group(); g.userData.spec = spec; g.scale.setScalar(spec.s);
  const F = { grad: GRAD_2, ol: OL };
  const shirtM = spec.stripe ? toon('#ffffff', { map: stripeTex(spec.shirt, spec.stripe), ...F }) : toon(spec.shirt, F);
  const inkM = toon('#231a28', { grad: GRAD_FLAT, ol: OL });
  const hips = group({ p: [0, LEG, 0], parent: g });
  const torso = group({ parent: hips });
  const R = .27 * spec.belly;
  mesh(new THREE.CapsuleGeometry(R, .42, 8, 20), shirtM, { p: [0, .43, 0], s: [1, 1, .82], parent: torso });
  if (spec.coat) { for (let k = 0; k < 3; k++) mesh(new THREE.SphereGeometry(.032, 8, 6), toon('#f0c24a', { grad: GRAD_FLAT, ol: .004 }), { p: [0, .62 - k * .15, R * .82 + .01], s: [1, 1, .6], parent: torso });
    for (const s of [-1, 1]) mesh(new THREE.SphereGeometry(.1, 12, 8), toon('#f0c24a', { grad: GRAD_FLAT, ol: OL }), { p: [s * .2, .8, 0], s: [1, .32, .9], parent: torso }); }
  if (spec.belt) mesh(new THREE.CylinderGeometry(R * 1.01, R * 1.01, .06, 20, 1, true), toon(spec.belt, { grad: GRAD_FLAT, side: THREE.DoubleSide }), { p: [0, .16, 0], s: [1, 1, .82], parent: torso });
  if (spec.scarf) mesh(new THREE.TorusGeometry(.17, .05, 8, 16), toon(spec.scarf, F), { p: [0, .86, .0], r: [90, 0, 0], parent: torso });
  // head: flat white ball
  const HR = .42 * (spec.headS || 1);
  const head = group({ p: [0, .88, 0], parent: torso });
  const hc = group({ p: [0, HR * .8, 0], parent: head });
  mesh(new THREE.SphereGeometry(HR, 40, 28), toon(spec.skin || '#f7f2e8', { grad: GRAD_FLAT, ol: OL }), { parent: hc, cast: true, recv: false });
  const L = 1.9, T = 1.75; const fg = new THREE.SphereGeometry(HR * 1.004, 28, 24, Math.PI / 2 - L / 2, L, Math.PI / 2 - T / 2, T);
  const faceM = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }); noOutline(faceM); faceM.userData.noInk = true;
  const face = mesh(fg, faceM, { parent: hc, cast: false, recv: false }); face.renderOrder = 3;
  if (spec.hair) mesh(new THREE.SphereGeometry(HR * 1.02, 28, 12, 0, Math.PI * 2, 0, Math.PI * .34), toon(spec.hair, F), { r: [-24, 0, 0], parent: hc });
  if (spec.glasses && !globalThis.NOFACE) for (const s of [-1, 1]) mesh(new THREE.TorusGeometry(.07, .012, 6, 18), toon('#231a28', { grad: GRAD_FLAT }), { p: [s * .105, .0, HR * 1.0], parent: hc });
  const hat = group({ parent: hc });
  if (spec.hat === 'beanie' || spec.hat === 'knit') { const hm = toon('#ffffff', { map: stripeTexH(spec.hatC, spec.hatC2 || spec.hatC, 6), ...F }); mesh(new THREE.SphereGeometry(HR * 1.04, 32, 14, 0, Math.PI * 2, 0, Math.PI * .43), hm, { parent: hat }); mesh(new THREE.TorusGeometry(HR * 1.0, .06, 8, 32), toon(spec.hatC2 || spec.hatC, F), { p: [0, HR * .22, 0], r: [90, 0, 0], parent: hat }); if (spec.hat === 'beanie') mesh(new THREE.SphereGeometry(.09, 12, 8), toon(spec.pomC || '#ffffff', F), { p: [0, HR * 1.06, 0], parent: hat }); hat.rotation.x = -.16; }
  if (spec.hat === 'bandana') { const hm = toon(spec.hatC, F); mesh(new THREE.SphereGeometry(HR * 1.03, 32, 14, 0, Math.PI * 2, 0, Math.PI * .4), hm, { parent: hat }); mesh(new THREE.ConeGeometry(.06, .2, 4), hm, { p: [.08, HR * .1, -HR * 1.0], r: [20, 0, 25], parent: hat }); hat.rotation.x = -.2; }
  if (spec.hat === 'straw') { const hm = toon('#ecc964', F); mesh(new THREE.CylinderGeometry(HR * 1.5, HR * 1.5, .03, 32), hm, { p: [0, HR * .5, 0], parent: hat }); mesh(new THREE.CylinderGeometry(HR * .76, HR * .88, .24, 24), hm, { p: [0, HR * .64, 0], parent: hat }); mesh(new THREE.CylinderGeometry(HR * .89, HR * .89, .06, 24), toon(spec.hatC, F), { p: [0, HR * .55, 0], parent: hat }); hat.rotation.x = -.1; }
  if (spec.hat === 'bicorne') { const hm = toon('#1d1d2c', F); mesh(new THREE.CylinderGeometry(.6, .6, .13, 32, 1, false, 0, Math.PI), hm, { p: [0, HR * .66, 0], r: [90, 90, 0], parent: hat }); mesh(new THREE.CircleGeometry(.08, 14), toon('#d8483e', { grad: GRAD_FLAT }), { p: [0, HR * .98, .075], parent: hat }); }
  // stick limbs
  const tube = (len, r, parent) => { const m = mesh(new THREE.CapsuleGeometry(r, len, 3, 8), inkM, { p: [0, -len / 2, 0], parent }); return m; };
  const arm = (s) => { const up = group({ parent: torso }), fo = group({ parent: torso }); tube(AL, .007, up); tube(AL, .007, fo);
    const hand = mesh(new THREE.SphereGeometry(.032, 12, 10), inkM, { p: [0, -AL, 0], parent: fo }); return { up, fo, hand, S: new THREE.Vector3(s * .22, .72, 0) }; };
  const leg = (s) => { const up = group({ parent: hips }), fo = group({ parent: hips }); tube(LL, .008, up); tube(LL, .008, fo);
    const shoe = mesh(new THREE.SphereGeometry(.045, 12, 8), inkM, { p: [0, -LL, .04], s: [.85, .55, 1.6], parent: fo }); return { up, fo, shoe, S: new THREE.Vector3(s * .11, 0, 0) }; };
  const sweat = group({ parent: hc }); sweat.visible = false; { const dm = toon('#bfe6ff', { grad: GRAD_FLAT, ol: .006 }); mesh(new THREE.SphereGeometry(.06, 12, 8), dm, { parent: sweat }); mesh(new THREE.ConeGeometry(.052, .1, 12), dm, { p: [0, .07, 0], parent: sweat }); sweat.position.set(HR * .8, HR * .45, HR * .4); }
  const C = { g, spec, hips, torso, head, hc, face, faceM, hat, sweat, aL: arm(-1), aR: arm(1), lL: leg(-1), lR: leg(1), HR, props: group({ parent: torso }) };
  CHARS[spec.id] = C; return C;
}
export const LEG = .56, AL = .34, LL = .31; // v3: longer but hair-thin limbs // v2: short chubby figures like the ref (about 3 heads tall)
// ---- IK ----
const _v = new THREE.Vector3(), _q = new THREE.Quaternion(), DOWN = new THREE.Vector3(0, -1, 0);
function ik(limb, T, L1, L2, pole) {
  const S = limb.S; const d = _v.copy(T).sub(S); let len = d.length(); const dir = d.clone().normalize(); len = clamp(len, .02, L1 + L2 - .002);
  const a = (L1 * L1 - L2 * L2 + len * len) / (2 * len), h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
  const p = new THREE.Vector3(...pole); p.sub(dir.clone().multiplyScalar(p.dot(dir))).normalize();
  const E = S.clone().addScaledVector(dir, a).addScaledVector(p, h); const Tc = S.clone().addScaledVector(dir, len);
  limb.up.position.copy(S); limb.up.quaternion.setFromUnitVectors(DOWN, E.clone().sub(S).normalize());
  limb.fo.position.copy(E); limb.fo.quaternion.setFromUnitVectors(DOWN, Tc.clone().sub(E).normalize());
  return Tc;
}
export function toTorso(C, wv) { let r = C.g; while (r.parent) r = r.parent; r.updateMatrixWorld(); return C.torso.worldToLocal(wv.clone()); }
export function toHips(C, wv) { C.g.updateMatrixWorld(true); return C.hips.worldToLocal(wv.clone()); }
// v4 secondary motion: every posed character breathes, sways, tilts its head, nods + gestures while talking.
// ANIM.t is set by main.js each frame (deterministic per frame). P.still = true turns it off for one pose.
export const ANIM = { t: 0, on: true, k: 1 };
// v4 2D overlay requests drawn by main.js after the 3D frame: P.gloom (0..1) = falling gloom lines over the head; sparkAt(worldPos, k) = 4-point glint
export const OVL = [];
export const sparkAt = (p, k = 1, size = 1) => { if (k > 0) OVL.push({ kind: 'spark', p: p.clone ? p.clone() : new THREE.Vector3(...p), k, size }); };
// popAt(lt, at): squash-and-stretch head pop when an expression changes at shot time `at` (pass as P.pop)
export const popAt = (lt, at, amp = .13) => { const u = (lt - at) / .32; return u < 0 || u > 1 ? 0 : amp * Math.sin(u * Math.PI) * (1 - u * .4); };
const seedOf = (C) => C._sd ?? (C._sd = [...(C.spec.id || 'x')].reduce((a, c) => a + c.charCodeAt(0) * 7.13, 0) % 97);
// pose: {p:[x,y,z], ry, lean, twist, side, head:[x,y,z], hL, hR (torso space arrays or Vector3), pL, pR (elbow poles), fL, fR (hips space), sit, hipY, walk:{ph, stride}, ex, blink, talk, look, sweat}
export function pose(C, P = {}) {
  const g = C.g, s = C.spec.s; if (P.p) g.position.set(...P.p); g.rotation.set(P.rx ? P.rx * D2R : 0, (P.ry || 0) * D2R, P.rz ? P.rz * D2R : 0);
  g.visible = P.visible ?? true;
  const w = P.walk; let hy = P.sit ? .04 + (P.hipY || 0) : LEG + (P.hipY || 0); if (w) hy += Math.abs(Math.sin(w.ph)) * .03;
  C.hips.position.set(0, hy, 0); C.hips.rotation.set(0, 0, 0);
  C.torso.rotation.set((P.lean || 0) * D2R, (P.twist || 0) * D2R, (P.side || 0) * D2R, 'YXZ');
  const hd = P.head || [0, 0, 0]; C.head.rotation.set(hd[0] * D2R, hd[1] * D2R, hd[2] * D2R, 'YXZ');
  let fL = P.fL, fR = P.fR;
  if (!fL) { if (P.sit) { const sh = (P.seat ?? .45) / s; fL = [-.14, -sh + .03, .5]; fR = [.14, -sh + .03, .5]; }
    else if (w) { const st = w.stride ?? .22; fL = [-.12, -hy + .03 + Math.max(0, Math.sin(w.ph)) * .1, Math.sin(w.ph + Math.PI / 2) * st]; fR = [.12, -hy + .03 + Math.max(0, -Math.sin(w.ph)) * .1, -Math.sin(w.ph + Math.PI / 2) * st]; }
    else { fL = [-.13, -hy + .03, .03]; fR = [.13, -hy + .03, .03]; } }
  ik(C.lL, new THREE.Vector3(...fL), LL, LL, [0, 0, 1]); ik(C.lR, new THREE.Vector3(...fR), LL, LL, [0, 0, 1]);
  const sw = w ? Math.sin(w.ph) * .16 : 0;
  const live = ANIM.on && !P.still && (P.visible ?? true), t = ANIM.t, sd = seedOf(C), tk = P.talk || 0, A = ANIM.k;
  let gR = [0, 0, 0], gL = [0, 0, 0], hd2 = [0, 0, 0];
  if (live) { // idle: breathing bob, slow weight shift, head drift; talking: nods + small hand gestures
    const br = Math.sin(t * 2.3 + sd), ta = tk > 0 ? 1 : 0;
    C.hips.position.y += .009 * br * A; C.br = .016 * br * A;
    C.torso.rotation.z += (.045 * noise1(t * .45 + sd) + .02 * ta * noise1(t * 3.1 + sd)) * A; C.torso.rotation.x += (.015 * br + .03 * ta * noise1(t * 2.7 + sd * 2)) * A;
    hd2 = [(.04 * noise1(t * .6 + sd * 3) + .12 * ta * Math.max(-.3, noise1(t * 5.2 + sd))) * A, .09 * noise1(t * .35 + sd * 5) * A, (.08 * noise1(t * .5 + sd * 7) + .05 * ta * noise1(t * 2.2 + sd)) * A];
    C.head.rotation.x += hd2[0]; C.head.rotation.y += hd2[1]; C.head.rotation.z += hd2[2];
    if (ta && !w) { const gx = noise1(t * 2.4 + sd * 11), gy = Math.max(0, noise1(t * 1.9 + sd * 13)); gR = [.03 * gx, .16 * gy, .12 * gy]; gL = [-.02 * gx, .05 * Math.max(0, noise1(t * 1.6 + sd * 17)), .04]; }
  } else C.br = 0;
  const hL = P.hL ? (P.hL.isVector3 ? P.hL.clone() : new THREE.Vector3(...P.hL)) : new THREE.Vector3(-.36, .2, .06 - sw);
  const hR = P.hR ? (P.hR.isVector3 ? P.hR.clone() : new THREE.Vector3(...P.hR)) : new THREE.Vector3(.36, .2, .06 + sw);
  if (live) { const k = (P.hR || P.hL) ? .45 : 1; hR.x += gR[0] * k; hR.y += gR[1] * k; hR.z += gR[2] * k; hL.x += gL[0] * k; hL.y += gL[1] * k; hL.z += gL[2] * k;
    const dr = .012 * A; hR.y += dr * Math.sin(t * 2.3 + sd + .6); hL.y += dr * Math.sin(t * 2.3 + sd + 1.1); }
  C.handL = ik(C.aL, hL, AL, AL, P.pL || [-.6, -.3, -.7]); C.handR = ik(C.aR, hR, AL, AL, P.pR || [.6, -.3, -.7]);
  if (C.is2D) C.f2 = [P.ex || 'neutral', !!P.blink, P.talk || 0, P.look];
  else { const tex = faceTexFor(C.spec, P.ex || 'neutral', !!P.blink, P.talk || 0, P.look); if (C.faceM.map !== tex) { C.faceM.map = tex; C.faceM.needsUpdate = true; } }
  C.sweat.visible = !!P.sweat; C.pop = P.pop || 0;
  if (P.gloom > 0 && (P.visible ?? true)) OVL.push({ kind: 'gloom', C, k: P.gloom });
}
// auto blink helper: returns true during a 0.12 s blink every ~3.3 s (seeded)
export function blinkAt(t, seed = 0) { const p = 3.1 + (seed % 3) * .4; const u = ((t + seed * 1.37) % p); return u < .12; }


// ================= v3: 2D sprite characters (Flow art: head + costume, faceless, limbless) =================
// body/head are camera-facing planes; the view (F, Q, S, B; Q/S mirrored for the other side) is picked from the camera angle
// around the character; faces are drawn per view (projected onto the ball), limbs stay 3D ink sticks.
const SPR = { meta: null, body: {}, headImg: {}, mask: {} };
const K2 = .96 / 1274;            // torso-local units per sprite pixel (2x sprites)
export async function loadSprites() {
  SPR.meta = await (await fetch('sprites/sprites.json')).json();
  const L = new THREE.TextureLoader(); const img = (u) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = u; });
  await Promise.all(Object.keys(SPR.meta).map(async k => {
    const t = await L.loadAsync(`sprites/${k}-body.png`); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; SPR.body[k] = t;
    SPR.headImg[k] = await img(`sprites/${k}-head.png`); SPR.mask[k] = await img(`sprites/${k}-mask.png`);
  }));
}
const sprNVS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
const sprNFS = `uniform sampler2D map; varying vec2 vUv; void main(){ if (texture2D(map, vUv).a < .5) discard; gl_FragColor = vec4(.5, .5, 1., .4); }`;
function sprMesh() {
  const m = new THREE.MeshLambertMaterial({ alphaTest: .5, side: THREE.DoubleSide, emissive: 0xffffff, emissiveIntensity: .32 }); noOutline(m);
  const me = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m); me.castShadow = false; me.receiveShadow = false;
  me.userData.sprN = new THREE.ShaderMaterial({ uniforms: { map: { value: null } }, vertexShader: sprNVS, fragmentShader: sprNFS, side: THREE.DoubleSide });
  return me;
}
const HEADC = new Map(), HS = .72, FC = document.createElement('canvas'); FC.width = FC.height = 512; const FX = FC.getContext('2d');
const TMP = document.createElement('canvas'), TX = TMP.getContext('2d');
const PHI = { F: 0, Q: -.42, S: -1.42 };
function headTex(C, key, view) {
  const [exName, blink, talk, look] = C.f2 || ['neutral', false, 0, null]; const tq = talk > .66 ? 2 : talk > .33 ? 1 : 0;
  const ck = key + '|' + exName + '|' + (blink ? 1 : 0) + '|' + tq + '|' + (look ? look.join(',') : '') + '|' + C.spec.id;
  if (HEADC.has(ck)) { const t = HEADC.get(ck); HEADC.delete(ck); HEADC.set(ck, t); return t; }
  const im = SPR.headImg[key], w = Math.round(im.width * HS), h = Math.round(im.height * HS);
  const t = canvasTex(w, h, (x) => {
    x.drawImage(im, 0, 0, w, h); if (view === 'B') return;
    const [bx, by, br] = SPR.meta[key].ballH; const cx = bx * HS, cy = by * HS, r = br * HS;
    drawFace(FX, C.spec, EX[exName] || EX.neutral, blink, tq ? (tq === 2 ? 1 : .5) : 0, look);
    TMP.width = w; TMP.height = h; TX.clearRect(0, 0, w, h); const phi = PHI[view], FH = 1.53 * r * (C.spec.faceV || 1), fy = cy + r * (C.spec.faceY || 0);
    for (let i = 0; i < 64; i++) { const al = ((i + .5) / 64 - .5) * 1.9, c = Math.cos(al + phi); if (c < .07) continue;
      const X = cx + r * Math.sin(al + phi), ww = r * c * 1.9 / 64 + 1.2; TX.drawImage(FC, i * 8, 0, 8, 512, X - ww / 2, fy - FH / 2, ww, FH); }
    TX.globalCompositeOperation = 'destination-in'; TX.drawImage(SPR.mask[key], 0, 0, w, h); TX.globalCompositeOperation = 'source-over';
    x.drawImage(TMP, 0, 0);
  });
  t.anisotropy = 8; HEADC.set(ck, t);
  if (HEADC.size > 110) { const k0 = HEADC.keys().next().value; HEADC.get(k0).dispose(); HEADC.delete(k0); }
  return t;
}
export const SPRG = new THREE.Group(); // sprite planes live at scene root (added by main)
export function makeChar2D(spec) {
  const C = makeChar({ ...spec, hat: 'none' }); C.is2D = true; C.spr = spec.sprite;
  // the 3D bean/ball become invisible shadow casters; face patch off
  C.torso.traverse(o => { if (o.isMesh && !C.aL.up.children.includes(o) && !C.aL.fo.children.includes(o) && !C.aR.up.children.includes(o) && !C.aR.fo.children.includes(o) && o.parent !== C.sweat && o.parent !== C.props) {
    if (o === C.face) { o.visible = false; return; } o.material = SHADOWONLY; o.userData.noInk = true; o.castShadow = true; } });
  for (const L of [C.aL, C.aR]) L.S.x = Math.sign(L.S.x) * .26;
  C.hc.children.forEach(o => { if (o.isMesh && o.material === SHADOWONLY) o.scale.setScalar(.68); });
  const F = SPR.meta[spec.sprite + '-F']; C.cx = F.ball[0];
  // v3.1: the Flow head floated above the collar so the neck hole showed -> sink the ball into the collar (ball bottom IN px below the body top)
  C.sink = spec.sink ?? 105; const IN = C.sink, drop = (F.body[1] - (F.ball[1] + F.ball[2])) + IN;
  C.head.position.y = .93; C.hc.position.y = .91 + (F.gap[1] - F.ball[1] - drop) * K2 - .93;
  C.torso.position.y = -(spec.drop ?? .32); // v2: short costume, hem just below the hips
  C.sb = sprMesh(); C.sh = sprMesh(); C.sh.renderOrder = 1; SPRG.add(C.sb, C.sh);
  return C;
}
const SHADOWONLY = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }); noOutline(SHADOWONLY);
const s_a = new THREE.Vector3(), s_v = new THREE.Vector3(), s_f = new THREE.Vector3(), s_u = new THREE.Vector3(), s_r = new THREE.Vector3(), s_cp = new THREE.Vector3(), s_q = new THREE.Quaternion(), s_e = new THREE.Euler();
function visUp(o) { while (o) { if (!o.visible) return false; o = o.parent; } return true; }
function place(me, center, yaw, roll, w, h, mir) {
  me.position.copy(center); s_e.set(0, yaw, roll, 'YXZ'); me.quaternion.setFromEuler(s_e); me.scale.set(mir ? -w : w, h, 1);
}
export function updateSprites(cam) {
  cam.updateMatrixWorld(); cam.getWorldPosition(s_cp);
  for (const C of Object.values(CHARS)) { if (!C.is2D) continue;
    let rt = C.g; while (rt.parent) rt = rt.parent; const on = visUp(C.g) && rt.isScene; C.sb.visible = C.sh.visible = on; if (!on) continue;
    let root = C.g; while (root.parent) root = root.parent; root.updateMatrixWorld(true);
    const s = C.g.getWorldScale(s_u).x;
    // view from the camera angle around the torso
    const anc = C.torso.localToWorld(s_a.set(0, .43, 0));
    s_f.set(0, 0, 1).transformDirection(C.torso.matrixWorld); s_f.y = 0; s_f.normalize();
    s_v.copy(s_cp).sub(anc); s_v.y = 0; s_v.normalize();
    const th = Math.atan2(s_f.z * s_v.x - s_f.x * s_v.z, s_f.dot(s_v)) * 180 / Math.PI, a = Math.abs(th);
    const view = a < 24 ? 'F' : a < 60 ? 'Q' : a < 128 ? 'S' : 'B', mir = (view === 'Q' || view === 'S') && th < 0;
    const key = C.spr + '-' + view, M = SPR.meta[key]; const yaw = Math.atan2(s_v.x, s_v.z);
    s_r.set(Math.cos(yaw), 0, -Math.sin(yaw));
    // body
    const U = s_u.set(0, 1, 0).transformDirection(C.torso.matrixWorld); const rollB = Math.atan2(-U.dot(s_r), U.y);
    const [x0, y0, x1, y1] = M.body; const lx = ((x0 + x1) / 2 - C.cx) * K2 * (mir ? -1 : 1), ly = .91 - ((y0 + y1) / 2 - M.gap[1]) * K2;
    const cb = C.torso.localToWorld(new THREE.Vector3(0, ly, 0)).addScaledVector(s_r, lx * s * Math.cos(rollB)).addScaledVector(s_v, -.14 * s);
    place(C.sb, cb, yaw, rollB, (x1 - x0) * K2 * s * (1 - (C.br || 0) * .5), (y1 - y0) * K2 * s * (1 + (C.br || 0)), mir);
    C.sb.material.map !== SPR.body[key] && (C.sb.material.map = SPR.body[key], C.sb.material.emissiveMap = SPR.body[key], C.sb.material.needsUpdate = true);
    C.sb.userData.sprN.uniforms.map.value = SPR.body[key];
    // head
    const UH = new THREE.Vector3(0, 1, 0).transformDirection(C.hc.matrixWorld); const rollH = Math.atan2(-UH.dot(s_r), UH.y);
    // v3.1: the head is anchored like a 2D puppet to the costume's collar in the billboard plane (not to the 3D head bone),
    // so leaning/pitching never lifts it off the costume (neck hole showed when Tim yawned/leaned back)
    const [hx0, hy0, hx1, hy1] = M.head, [bx, by] = M.ballH; const dx = ((hx1 - hx0) / 2 - bx) * K2 * (mir ? -1 : 1), dy = (by - (hy1 - hy0) / 2) * K2;
    const upB = new THREE.Vector3(0, Math.cos(rollB), 0).addScaledVector(s_r, -Math.sin(rollB)), rtB = s_r.clone().multiplyScalar(Math.cos(rollB)).add(new THREE.Vector3(0, Math.sin(rollB), 0));
    const upH = new THREE.Vector3(0, Math.cos(rollH), 0).addScaledVector(s_r, -Math.sin(rollH)), rtH = s_r.clone().multiplyScalar(Math.cos(rollH)).add(new THREE.Vector3(0, Math.sin(rollH), 0));
    const nod = (C.head.rotation.x || 0); // looking down sinks the head a touch, looking up lifts it a touch
    const neck = cb.clone().addScaledVector(upB, (y1 - y0) / 2 * K2 * s).addScaledVector(rtB, (M.ball[0] - (x0 + x1) / 2) * K2 * s * (mir ? -1 : 1) * .5);
    const ballC = neck.addScaledVector(upH, (M.ball[2] - (C.sink ?? 105) - 40 * Math.sin(nod)) * K2 * s).addScaledVector(rtH, (M.ball[0] - (x0 + x1) / 2) * K2 * s * (mir ? -1 : 1) * .5);
    const ch = ballC.addScaledVector(rtH, dx * s).addScaledVector(upH, dy * s).addScaledVector(s_v, .04 * s);
    const pp = C.pop || 0; place(C.sh, ch, yaw, rollH, (hx1 - hx0) * K2 * s * (1 + pp * .6), (hy1 - hy0) * K2 * s * (1 + pp), mir);
    const ht = headTex(C, key, view); if (C.sh.material.map !== ht) { C.sh.material.map = ht; C.sh.material.emissiveMap = ht; C.sh.material.needsUpdate = true; }
    C.sh.userData.sprN.uniforms.map.value = ht;
    C.view = view; C.mir = mir;
  }
}

// ---- cast (original designs) ----
// cast = project.json "cast": [{ id, sprite: 'C01', s: scale (~.55-.7), face options: beard, stache, browC, mouthY, faceY, faceV, glasses2D, sink }]
export function makeCast(cast) {
  if (SPR.meta && cast && cast.length) { cast.forEach(c => makeChar2D(c)); return CHARS; } // 2D Flow sprites (the skill's normal path)
  if (SPR.meta) { // fallback: the ship-bell example cast
    makeChar2D({ id: 'tim', sprite: 'C01', s: .6 });
    makeChar2D({ id: 'boon', sprite: 'C02', s: .64, beard: '#c4bfb6', browC: '#5e5852', mouthY: .68 });
    makeChar2D({ id: 'cap', sprite: 'C03', s: .68, stache: true, browC: '#4a4440', mouthY: .74 });
    makeChar2D({ id: 'kai', sprite: 'C04', s: .6 });
    makeChar2D({ id: 'noi', sprite: 'C05', s: .61 });
    makeChar2D({ id: 'pom', sprite: 'C06', s: .55, glasses2D: true });
    return CHARS;
  }
  // no sprites at all: plain 3D stick-figure cast (v2 look), only for blockouts
  makeChar({ id: 'tim', shirt: '#24418a', stripe: '#f6f2e8', hat: 'beanie', hatC: '#e0453a', hatC2: '#b8322c', pomC: '#f6f2e8', s: .6, belt: '#6a4226' });
  makeChar({ id: 'boon', shirt: '#a0522d', hat: 'knit', hatC: '#4a4a58', hatC2: '#33333f', beard: '#c4bfb6', browC: '#5e5852', s: .64, belly: 1.14, mouthY: .68 });
  makeChar({ id: 'cap', shirt: '#26346e', hat: 'bicorne', coat: true, stache: true, browC: '#4a4440', s: .68, belly: 1.2, mouthY: .74 });
  makeChar({ id: 'kai', shirt: '#e8b040', hat: 'bandana', hatC: '#d8483e', s: .6, belly: 1.12 });
  makeChar({ id: 'noi', shirt: '#6fa6dc', hat: 'straw', hatC: '#8a3a2a', s: .61, belly: .94 });
  makeChar({ id: 'pom', shirt: '#9a62aa', stripe: '#f3eaf6', hat: 'beanie', hatC: '#e8b84a', hatC2: '#c9952e', pomC: '#f6f2e8', glasses: true, s: .55 });
  return CHARS;
}
