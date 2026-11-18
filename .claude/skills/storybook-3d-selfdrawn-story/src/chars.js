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
  // v4.8 from the pirate refs: squeezed >< eyes (pain / effort), spiral eyes (dizzy), white-eyed panic with tiny pupils
  strain: { eyes: 'chev', bl: 18, br: -18, by: -4, mouth: 'wavy' },
  ouch: { eyes: 'chev', bl: 24, br: -24, by: -6, mouth: 'clench' },
  dizzy: { eyes: 'spiral', bl: 10, br: -10, by: -6, mouth: 'wavy' },
  panic: { eyes: 'tiny', bl: 26, br: -26, by: -16, mouth: 'clench' },
};
function drawFace(x, spec, e, blink, talk, look) { // v2: flat ink faces on a white ball head (no nose)
  const S = 512; x.clearRect(0, 0, S, S);
  const BIG = !!spec.bigEyes, EK = BIG ? 2.45 : 1; // v4.8 hybrid: pirate-ref dot eyes by default (spec.bigEyes = sheet eyes everywhere) // v4.6 sheet face: eyes ~1/4 head wide, nearly touching; bigger mouth
  const ey = S * (spec.eyeY ?? .5), ex = S * (BIG ? .152 : .13), ink = '#1c1420';
  x.fillStyle = spec.cheek || 'rgba(255,128,140,.38)'; for (const s of [-1, 1]) { x.beginPath(); x.ellipse(S / 2 + s * S * (BIG ? .37 : .2), ey + (BIG ? 128 : 62), 30, 17, 0, 0, 7); x.fill(); }
  const eyes = blink ? 'closed' : e.eyes; const lx = (look?.[0] || 0) * 9, ly = (look?.[1] || 0) * 7;
  x.lineCap = 'round'; x.lineJoin = 'round';
  for (const s of [-1, 1]) {
    const cx = S / 2 + s * ex, cy = ey; let kind = eyes; if (kind === 'wink') kind = s < 0 ? 'open' : 'closedUp';
    x.save(); if (BIG) { x.translate(cx, cy); x.scale(EK, EK); x.translate(-cx, -cy); }
    x.fillStyle = ink; x.strokeStyle = ink; x.lineWidth = BIG ? 9 : 19;
    if (!BIG && (kind === 'wide' || kind === 'tiny')) { x.translate(cx, cy); x.scale(1.75, 1.75); x.translate(-cx, -cy); } // shock: dot eyes pop into big white eyes
    if ((kind === 'open' || kind === 'side') && BIG) { const dx = kind === 'side' ? 13 * (spec.sideDir || 1) : lx * 1.4; // v4.6 sheet eyes: big white ovals, ink outline, pupil
      x.fillStyle = '#fbf8f2'; x.lineWidth = 6; x.beginPath(); x.ellipse(cx, cy - 2, 30, 38, 0, 0, 7); x.fill(); x.stroke();
      x.fillStyle = ink; x.beginPath(); x.ellipse(cx + dx + 3, cy + 6 + ly * 1.2, 13, 18, 0, 0, 7); x.fill(); x.fillStyle = '#ffffff'; x.beginPath(); x.arc(cx + dx - 1, cy - 2 + ly, 4.5, 0, 7); x.fill(); }
    else if (kind === 'open' || kind === 'side') { const dx = kind === 'side' ? 11 * (spec.sideDir || 1) : lx; x.beginPath(); x.ellipse(cx + dx, cy + ly, 15, 21, 0, 0, 7); x.fill(); }
    else if (kind === 'chev') { x.lineWidth = BIG ? 10 : 16; x.beginPath(); x.moveTo(cx - 20 * s, cy - 16); x.lineTo(cx + 14 * s, cy); x.lineTo(cx - 20 * s, cy + 16); x.stroke(); } // > <
    else if (kind === 'spiral') { x.lineWidth = BIG ? 6 : 9; x.beginPath(); for (let i = 0; i <= 60; i++) { const a = i / 60 * Math.PI * 5 * s, r = 3 + i / 60 * 30; x.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 1.1); } x.stroke(); }
    else if (kind === 'tiny') { x.fillStyle = '#fbf8f2'; x.lineWidth = BIG ? 6 : 12; x.beginPath(); x.ellipse(cx, cy - 2, 30, 38, 0, 0, 7); x.fill(); x.stroke(); x.fillStyle = ink; x.beginPath(); x.arc(cx + lx * .5, cy + ly * .5, 6, 0, 7); x.fill(); }
    else if (kind === 'half') { x.save(); x.beginPath(); x.rect(cx - 40, cy - 2, 80, 60); x.clip(); x.beginPath(); x.ellipse(cx + lx, cy + 2, 16, 20, 0, 0, 7); x.fill(); x.restore(); x.beginPath(); x.moveTo(cx - 25, cy - 2); x.lineTo(cx + 25, cy - 2); x.stroke(); }
    else if (kind === 'closed') { x.beginPath(); x.moveTo(cx - 22, cy + 2); x.quadraticCurveTo(cx, cy + 14, cx + 22, cy + 2); x.stroke(); }
    else if (kind === 'closedUp' || kind === 'happy') { x.beginPath(); x.moveTo(cx - 22, cy + 8); x.quadraticCurveTo(cx, cy - 16, cx + 22, cy + 8); x.stroke(); }
    else if (kind === 'wide') { x.fillStyle = '#fbf8f2'; x.lineWidth = 13; x.beginPath(); x.ellipse(cx, cy, 30, 36, 0, 0, 7); x.fill(); x.stroke(); x.fillStyle = ink; x.beginPath(); x.arc(cx + lx * .6, cy + ly * .6, 9, 0, 7); x.fill(); }
    x.restore();
    const ang = (s < 0 ? e.bl : e.br) * D2R; const by = cy - (BIG ? 128 : /wide|tiny/.test(kind) ? 80 : 50) + (e.by || 0) * EK;
    x.strokeStyle = spec.browC || ink; x.lineWidth = spec.browW || (BIG ? 26 : 22); x.save(); x.translate(cx, by); x.rotate(s < 0 ? -ang : ang); x.beginPath(); x.moveTo(BIG ? -36 : -24, 0); x.lineTo(BIG ? 36 : 24, 0); x.stroke(); x.restore();
  }
  if (spec.fringe) { x.fillStyle = spec.fringe; x.strokeStyle = ink; x.lineWidth = 12; const top = ey - 190, L = S * .16, Rr = S * .84, n = 6; x.beginPath(); x.moveTo(L, top); x.lineTo(L, ey - 60);
    for (let i = 1; i <= n; i++) { const bx = L + (Rr - L) * i / n, yb = ey - 60 - Math.sin(Math.PI * i / n) * 34 - (i === n ? 0 : 0); x.quadraticCurveTo(bx - (Rr - L) / n / 2, yb + 44, bx, i === n ? ey - 60 : yb); }
    x.lineTo(Rr, top); x.closePath(); x.fill(); x.stroke(); }
  if (spec.glasses2D) { x.strokeStyle = ink; x.lineWidth = 13; for (const s of [-1, 1]) { x.beginPath(); x.arc(S / 2 + s * ex, ey, 36, 0, 7); x.stroke(); } x.beginPath(); x.moveTo(S / 2 - ex + 36, ey - 4); x.quadraticCurveTo(S / 2, ey - 14, S / 2 + ex - 36, ey - 4); x.stroke(); }
  const my = S * (spec.mouthY ?? .7) + (BIG ? 62 : 0);
  if (spec.beard) { x.fillStyle = spec.beard; x.strokeStyle = ink; x.lineWidth = 12; const top = ey + 34, L = S * .25, Rr = S * .75; x.beginPath(); x.moveTo(L, top);
    const n = 7; for (let i = 0; i <= n; i++) { const u = i / n, bx = L + (Rr - L) * u, by = top + Math.sin(Math.PI * u) * 120 + 18; if (i) x.quadraticCurveTo(bx - (Rr - L) / n / 2, by + 26, bx, by); else x.lineTo(bx, by); }
    x.lineTo(Rr, top); x.quadraticCurveTo(S / 2, top + 44, L, top); x.closePath(); x.fill(); x.stroke(); }
  let m = e.mouth; if (talk > 0) m = talk > .66 ? 'open' : talk > .33 ? 'talk' : (m === 'o' || m === 'yawn' ? m : 'flat');
  x.strokeStyle = ink; x.fillStyle = '#3a1a24'; x.lineWidth = 15; const cx = S / 2; x.save(); { x.translate(cx, my); x.scale(BIG ? 1.9 : 1.3, BIG ? 1.9 : 1.3); x.translate(-cx, -my); }
  if (m === 'smile') { const W = BIG ? 44 : 24, D = BIG ? 30 : 16; x.beginPath(); x.moveTo(cx - W, my - 10); x.quadraticCurveTo(cx, my + D, cx + W, my - 10); x.stroke(); } // v4.6 wide sheet smile
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
  x.restore();
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
  // v4.2 model: thicker rubber-hose limbs with round joints, cartoon gloves (thumb + cuff) and rounded shoes. spec.classic = old hair-thin sticks
  const CL = !!spec.classic, rA = CL ? .007 : (spec.limbW || 1) * .018, rL = CL ? .008 : (spec.limbW || 1) * .022;
  // v4.8 hybrid: ink dot hands + ink feet (pirate refs); spec.whiteHands = bare white hands, spec.glove / spec.shoe dress them
  const W_ = spec.whiteHands, skin = spec.glove || (W_ ? spec.skin || '#f7f2e8' : '#231a28'), gloveM = W_ || spec.glove ? toon(skin, { grad: GRAD_FLAT, ol: OL * .8, emissive: skin, ei: .42 }) : inkM, shoeM = spec.shoe ? toon(spec.shoe, { grad: GRAD_2, ol: OL * .8 }) : W_ ? toon(skin, { grad: GRAD_2, ol: OL * .8, emissive: skin, ei: .42 }) : inkM, soleM = toon(spec.sole || '#e9e1d4', { grad: GRAD_FLAT, ol: OL * .6 }); // v4.5 default: bare hands + plain oval feet (spec.glove / spec.shoe / spec.cuff / spec.sole to dress them)
  const arm = (s) => { const up = group({ parent: torso }), fo = group({ parent: torso }); tube(AL, rA, up); tube(AL, rA * .9, fo);
    let hand; if (CL) hand = mesh(new THREE.SphereGeometry(.032, 12, 10), inkM, { p: [0, -AL, 0], parent: fo });
    else { hand = group({ p: [0, -AL - .02, 0], parent: fo }); mesh(new THREE.SphereGeometry(W_ || spec.glove ? .058 : .042, 16, 12), gloveM, { s: W_ || spec.glove ? [1, 1.12, .78] : [1, 1, 1], parent: hand });
      if (W_ || spec.glove) mesh(new THREE.SphereGeometry(.022, 10, 8), gloveM, { p: [s * -.045, .018, .02], s: [1, 1.5, 1], r: [0, 0, s * 35], parent: hand });
      if (spec.cuff) mesh(new THREE.CylinderGeometry(.04, .036, .03, 14), gloveM, { p: [0, .052, 0], parent: hand }); }
    let open = null; if (!CL) { open = group({ p: [0, -AL - .02, 0], parent: fo }); open.visible = false; // v4.3 open hand: palm + 4 spread fingers + thumb
      mesh(new THREE.SphereGeometry(.05, 14, 10), gloveM, { s: [1.05, 1, .6], parent: open }); if (spec.cuff) mesh(new THREE.CylinderGeometry(.04, .036, .03, 14), gloveM, { p: [0, .05, 0], parent: open });
      for (let i = 0; i < 4; i++) { const a = (-.5 + i / 3) * 1.05; mesh(new THREE.CapsuleGeometry(.014, .05, 3, 8), gloveM, { p: [Math.sin(a) * .06, -.055 - Math.cos(a) * .02, 0], r: [0, 0, a * 57], parent: open }); }
      mesh(new THREE.CapsuleGeometry(.015, .04, 3, 8), gloveM, { p: [s * -.06, -.005, .01], r: [0, 0, s * 70], parent: open }); }
    return { up, fo, hand, open, S: new THREE.Vector3(s * .22, .72, 0) }; };
  const leg = (s) => { const up = group({ parent: hips }), fo = group({ parent: hips }); tube(LL, rL, up); tube(LL, rL * .92, fo);
    let shoe; if (CL) shoe = mesh(new THREE.SphereGeometry(.045, 12, 8), inkM, { p: [0, -LL, .04], s: [.85, .55, 1.6], parent: fo });
    else { shoe = group({ p: [0, -LL - .005, .045], parent: fo }); mesh(new THREE.SphereGeometry(.07, 16, 10), shoeM, { p: [0, 0, .025], s: [.95, .62, 1.85], parent: shoe });
      if (spec.sole || spec.shoe) mesh(new THREE.CylinderGeometry(.068, .068, .02, 16), soleM, { p: [0, -.036, .025], s: [.95, 1, 1.85], parent: shoe }); }
    return { up, fo, shoe, S: new THREE.Vector3(s * .11, 0, 0) }; };
  const sweat = group({ parent: hc }); sweat.visible = false; { const dm = toon('#bfe6ff', { grad: GRAD_FLAT, ol: .006 }); mesh(new THREE.SphereGeometry(.06, 12, 8), dm, { parent: sweat }); mesh(new THREE.ConeGeometry(.052, .1, 12), dm, { p: [0, .07, 0], parent: sweat }); sweat.position.set(HR * .8, HR * .45, HR * .4); }
  const C = { g, spec, hips, torso, head, hc, face, faceM, hat, sweat, aL: arm(-1), aR: arm(1), lL: leg(-1), lR: leg(1), HR, props: group({ parent: torso }) };
  CHARS[spec.id] = C; return C;
}
export const LEG = .42, AL = .28, LL = .225; // v4.5 chibi sheet: 2.5 heads tall -> legs ~half a head, arms end at the hips (was .56/.34/.31) // v3: longer but hair-thin limbs // v2: short chubby figures like the ref (about 3 heads tall)
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
// impactAt(worldPos, k, size): comic hit flash (jagged star + ring); dustAt(worldPos, k, size): ground puff. k = 0..1 progress
export const impactAt = (p, k, size = 1) => { if (k >= 0 && k <= 1) OVL.push({ kind: 'impact', p: p.clone ? p.clone() : new THREE.Vector3(...p), k, size }); };
export const dustAt = (p, k, size = 1) => { if (k >= 0 && k <= 1) OVL.push({ kind: 'dust', p: p.clone ? p.clone() : new THREE.Vector3(...p), k, size }); };
// debrisAt(origin, age, o): deterministic burst of chunks ('rock') / leaves ('leaf') / embers ('spark') thrown from origin.
//   o = { n, seed, speed, up, grav, size, col, kind, life }  (age in seconds since the burst)
export const debrisAt = (p, age, o = {}) => { if (age >= 0 && age <= (o.life ?? 2.2)) OVL.push({ kind: 'debris', p: p.clone ? p.clone() : new THREE.Vector3(...p), age, o }); };
// smokeAt(origin, age, o): cel-shaded puffs that drift outward + up, grow soft and fade, leaving a haze. o = { n, seed, size, spread, col, rise, life }
export const smokeAt = (p, age, o = {}) => { if (age >= 0 && age <= (o.life ?? 3.2) * 1.1) OVL.push({ kind: 'smoke', p: p.clone ? p.clone() : new THREE.Vector3(...p), age, o }); };
// ramp(lt, at, dur, k): slow-motion window: from `at` for `dur` seconds the clock runs at speed k (e.g. .25), then normal again
export function ramp(lt, at, dur, k = .25) { return lt < at ? lt : lt < at + dur ? at + (lt - at) * k : at + dur * k + (lt - at - dur); }
// popAt(lt, at): squash-and-stretch head pop when an expression changes at shot time `at` (pass as P.pop)
export const popAt = (lt, at, amp = .13) => { const u = (lt - at) / .32; return u < 0 || u > 1 ? 0 : amp * Math.sin(u * Math.PI) * (1 - u * .4); };
const seedOf = (C) => C._sd ?? (C._sd = [...(C.spec.id || 'x')].reduce((a, c) => a + c.charCodeAt(0) * 7.13, 0) % 97);
// pose: {p:[x,y,z], ry, lean, twist, side, head:[x,y,z], hL, hR (torso space arrays or Vector3), pL, pR (elbow poles), fL, fR (hips space), sit, hipY, walk:{ph, stride}, ex, blink, talk, look, sweat}
export function pose(C, P = {}) {
  const g = C.g, s = C.spec.s; if (P.p) g.position.set(...P.p); g.rotation.set(P.rx ? P.rx * D2R : 0, (P.ry || 0) * D2R, P.rz ? P.rz * D2R : 0);
  g.visible = P.visible ?? true;
  const w = P.walk; let hy = P.sit ? .04 + (P.hipY || 0) : LEG + (P.hipY || 0); if (w) hy += w.run ? (-.09 + (.5 - .5 * Math.cos(2 * w.ph + 1.2)) * .06) * w.run : (.5 - .5 * Math.cos(2 * w.ph)) * .035 - .02; // v4.1: two bobs per cycle, a touch of knee bend (run: deep crouch + flight bob)
  C.hips.position.set(0, hy, 0); C.hips.rotation.set(0, 0, 0);
  C.torso.rotation.set((P.lean || 0) * D2R, (P.twist || 0) * D2R, (P.side || 0) * D2R, 'YXZ');
  const hd = P.head || [0, 0, 0]; C.head.rotation.set(hd[0] * D2R, hd[1] * D2R, hd[2] * D2R, 'YXZ');
  if (w && !P.still) { const ph = w.ph, k = Math.min(1, (w.stride ?? .22) / .22); // hips twist with the stride, body rocks side to side, head stays steady and lags the bob
    C.torso.rotation.y += Math.sin(ph) * (w.run ? .2 : .14) * k; C.torso.rotation.z += Math.sin(ph) * .045 * k; C.torso.rotation.x += (w.run ? .24 * w.run : .06 * k);
    C.head.rotation.y -= Math.sin(ph) * .1 * k; C.head.rotation.x += Math.sin(2 * ph - .7) * .035 * k; }
  let fL = P.fL, fR = P.fR;
  if (!fL) { if (P.sit) { const sh = (P.seat ?? .45) / s; fL = [-.14, -sh + .03, .5]; fR = [.14, -sh + .03, .5]; }
    else if (w && w.run) { const st = (w.stride ?? .3) * w.run, ft = (a) => { const sw = Math.cos(a); // v4.3 run (model sheet 11-20): bent knees, back foot kicks high, front foot reaches
        return [-hy + .03 + Math.pow(Math.max(0, sw), 1.4) * .3 * w.run + Math.max(0, -sw) * Math.max(0, Math.sin(a)) * .04, Math.sin(a) * st - Math.max(0, sw) * .08 * w.run]; };
      const L_ = ft(w.ph), R_ = ft(w.ph + Math.PI); fL = [-.11, L_[0], L_[1]]; fR = [.11, R_[0], R_[1]]; }
    else if (w) { const st = w.stride ?? .22, lift = (x) => { const v = Math.max(0, x); return v * v * .13; }; // smooth foot arcs (no hard corners at plant/lift)
      fL = [-.12, -hy + .03 + lift(Math.sin(w.ph)), Math.sin(w.ph + Math.PI / 2) * st]; fR = [.12, -hy + .03 + lift(-Math.sin(w.ph)), -Math.sin(w.ph + Math.PI / 2) * st]; }
    else { fL = [-.13, -hy + .03, .03]; fR = [.13, -hy + .03, .03]; } }
  ik(C.lL, new THREE.Vector3(...fL), LL, LL, [0, 0, 1]); ik(C.lR, new THREE.Vector3(...fR), LL, LL, [0, 0, 1]);
  const sw = w ? Math.sin(w.ph - .35) * .16 * Math.min(1.4, (w.stride ?? .22) / .22) : 0; // arms trail the legs slightly
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
  const runA_ = w && w.run && !P.hL && !P.hR; if (runA_) { const a = Math.sin(w.ph) * w.run; P = { ...P, hL: [-.26, .42 + .14 * Math.max(0, -a), -.32 * a + .08], hR: [.26, .42 + .14 * Math.max(0, a), .32 * a + .08], pL: [-1, -.4, -.9], pR: [1, -.4, -.9] }; }
  const hL = P.hL ? (P.hL.isVector3 ? P.hL.clone() : new THREE.Vector3(...P.hL)) : new THREE.Vector3(-.31, .32 + Math.abs(sw) * .25, .05 - sw); // v4.6: rest hands hang at the hips, close to the body
  const hR = P.hR ? (P.hR.isVector3 ? P.hR.clone() : new THREE.Vector3(...P.hR)) : new THREE.Vector3(.31, .32 + Math.abs(sw) * .25, .05 + sw);
  if (live) { const k = (P.hR || P.hL) ? .45 : 1; hR.x += gR[0] * k; hR.y += gR[1] * k; hR.z += gR[2] * k; hL.x += gL[0] * k; hL.y += gL[1] * k; hL.z += gL[2] * k;
    const dr = .012 * A; hR.y += dr * Math.sin(t * 2.3 + sd + .6); hL.y += dr * Math.sin(t * 2.3 + sd + 1.1); }
  C.handL = ik(C.aL, hL, AL, AL, P.pL || [-.6, -.3, -.7]); C.handR = ik(C.aR, hR, AL, AL, P.pR || [.6, -.3, -.7]);
  if (C.is2D) C.f2 = [P.ex || 'neutral', !!P.blink, P.talk || 0, P.look];
  else { const tex = faceTexFor(C.spec, P.ex || 'neutral', !!P.blink, P.talk || 0, P.look); if (C.faceM.map !== tex) { C.faceM.map = tex; C.faceM.needsUpdate = true; } }
  for (const [L_, k] of [[C.aL, 'L'], [C.aR, 'R']]) if (L_.open) { const o = P.open === true || P.open === k; L_.open.visible = o; L_.hand.visible = !o; }
  C._hold = P.hold || null; // v4.4 { R: { obj, off: [x,y,z], rot: [deg x,y,z] }, L: {...} } -> attached to the (smoothed) hand after posing
  C.sweat.visible = !!P.sweat; C.pop = P.pop || 0; C.sq = (P.squash || 0) + (w && w.heavy ? -.09 * w.heavy * Math.pow(Math.max(0, Math.cos(2 * w.ph)), 6) : 0); C.smear = P.smear || null;
  if (ANIM.rec !== undefined) recPose(C, fL, fR, hL, hR, P);
  if (P.gloom > 0 && (P.visible ?? true)) OVL.push({ kind: 'gloom', C, k: P.gloom });
}
// v4 temporal smoothing (main.js runs the shot at t-3..t-1 frames with ANIM.rec = weight, then at t):
// limbs, head, torso and hip height are blended over those samples so pose changes ease in instead of snapping.
function recPose(C, fL, fR, hL, hR, P) {
  const w = ANIM.rec; if (!w) return; const g = C.g; g.updateMatrixWorld(true);
  const v = [...fL, ...fR, hL.x, hL.y, hL.z, hR.x, hR.y, hR.z, C.head.rotation.x, C.head.rotation.y, C.head.rotation.z, C.torso.rotation.x, C.torso.rotation.y, C.torso.rotation.z, C.hips.position.y];
  const root = g.getWorldPosition(new THREE.Vector3());
  (C._roots || (C._roots = [])).push(root.clone());
  (C._trail || (C._trail = [])).push([C.aL.fo.localToWorld(new THREE.Vector3(0, -AL, 0)), C.aR.fo.localToWorld(new THREE.Vector3(0, -AL, 0)), C.lL.fo.localToWorld(new THREE.Vector3(0, -LL, 0)), C.lR.fo.localToWorld(new THREE.Vector3(0, -LL, 0))]);
  if (!C._acc) C._acc = { v: v.map(x => x * w), w, root, P };
  else if (C._acc.root.distanceTo(root) < .35 * C.spec.s / .6 && C._acc.vis === (P.visible ?? true)) { C._acc.v.forEach((_, i) => { C._acc.v[i] += v[i] * w; }); C._acc.w += w; C._acc.root = root; C._acc.P = P; }
  else { C._acc = { v: v.map(x => x * w), w, root, P }; } // teleported / reappeared: restart (no smear across jumps)
  C._acc.vis = P.visible ?? true;
}
export function applySmooth(C) {
  const A = C._acc; C._acc = null; if (!A || A.w <= 1.01 * ANIM.wFinal || !C.g.visible || A.P.fast) { C._roots = []; return; } const v = A.v.map(x => x / A.w), P = A.P; // P.fast: snappy actions skip smoothing (hands stay on props)
  C.head.rotation.set(v[12], v[13], v[14], 'YXZ'); C.torso.rotation.set(v[15], v[16], v[17], 'YXZ'); C.hips.position.y = v[18];
  const R = C._roots || []; C._roots = [];
  if (R.length >= 4 && !P.still && ANIM.on) { // v4.1 momentum: lean into the travel direction, head + body lag on starts/stops (follow-through)
    const n = R.length, vel = R[n - 1].clone().sub(R[n - 2]).multiplyScalar(30), vel0 = R[n - 3].clone().sub(R[n - 4]).multiplyScalar(30), acc = vel.clone().sub(vel0).multiplyScalar(15);
    const sc = C.g.getWorldScale(new THREE.Vector3()).x || 1, inv = new THREE.Quaternion(); C.g.getWorldQuaternion(inv).invert();
    const lv = vel.applyQuaternion(inv).divideScalar(sc), la = acc.applyQuaternion(inv).divideScalar(sc);
    if (lv.length() < 40) { const fwd = clamp(lv.z, -6, 6), side = clamp(lv.x, -6, 6), af = clamp(la.z, -60, 60), as = clamp(la.x, -60, 60);
      C.torso.rotation.x += .035 * fwd - .0035 * af; C.torso.rotation.z -= .03 * side - .003 * as; C.head.rotation.x -= .005 * af; C.head.rotation.z += .004 * as; } }
  ik(C.lL, new THREE.Vector3(v[0], v[1], v[2]), LL, LL, [0, 0, 1]); ik(C.lR, new THREE.Vector3(v[3], v[4], v[5]), LL, LL, [0, 0, 1]);
  C.handL = ik(C.aL, new THREE.Vector3(v[6], v[7], v[8]), AL, AL, P.pL || [-.6, -.3, -.7]); C.handR = ik(C.aR, new THREE.Vector3(v[9], v[10], v[11]), AL, AL, P.pR || [.6, -.3, -.7]);
}
// ================= v4 ACTIONS: deterministic full-body moves with anticipation, follow-through, squash/stretch =================
// each returns pose params to spread into put()/pose(): put(C, parent, { ...base, ...actJump(lt, {...}) })
const sm = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const spring = (u) => u <= 0 ? 0 : 1 - Math.exp(-6 * u) * Math.cos(11 * u); // overshoot then settle
const mixA = (A, B, k) => A.map((v, i) => v + (B[i] - v) * k);
// jump from `from` to `to` (parent-space [x,y,z]); takeoff at t0, airborne `dur`, apex height h
export function actJump(lt, { t0 = .3, dur = .6, h = .6, from = [0, 0, 0], to = [0, 0, 1] } = {}) {
  const pre = sm(t0 - .28, t0 - .04, lt) * (1 - sm(t0 - .04, t0 + .02, lt)), u = clamp((lt - t0) / dur), air = lt > t0 && lt < t0 + dur, la = lt - t0 - dur;
  const p = mixA(from, to, u); p[1] += 4 * h * u * (1 - u);
  let squash = -.28 * pre, hipY = -.2 * pre, lean = 14 * pre, hL = mixA([-.36, .2, .06], [-.3, .05, -.3], pre), hR = mixA([.36, .2, .06], [.3, .05, -.3], pre), fL, fR;
  if (air) { const st = 1 - sm(0, .5, u); squash = .22 * st - .08 * sm(.6, 1, u); lean = -8 * st + 10 * sm(.5, 1, u); hL = [-.42, .95, .2]; hR = [.42, .95, .2]; fL = [-.13, -.5 + .16 * Math.sin(u * Math.PI), .12]; fR = [.13, -.42 + .1 * Math.sin(u * Math.PI), -.06]; }
  if (la >= 0) { const k = 1 - spring(la / .45); squash = -.32 * k; hipY = -.18 * Math.max(0, k); lean = 16 * Math.max(0, k); hL = mixA([-.36, .2, .06], [-.45, .45, .25], Math.max(0, k)); hR = mixA([.36, .2, .06], [.45, .45, .25], Math.max(0, k)); }
  return { p, squash, hipY, lean, hL, hR, ...(fL ? { fL, fR } : {}), pL: [-1, -.2, -.3], pR: [1, -.2, -.3], landed: la >= 0 ? la : -1 };
}
// right punch landing at `at`: wind-up, snap (stretch), hold, recover
export function actPunch(lt, at, { side = 1 } = {}) {
  const wind = sm(at - .26, at - .06, lt) * (1 - sm(at - .06, at, lt)), hit = sm(at - .06, at, lt) * (1 - sm(at + .16, at + .5, lt));
  const arm = mixA(mixA([.36, .2, .06], [.32, .62, -.32], wind), [.12, .74, .95], hit);
  const o = { twist: (-24 * wind + 30 * hit) * side, lean: -8 * wind + 14 * hit, squash: -.08 * wind + .1 * hit * (1 - sm(at, at + .1, lt)), hipY: -.08 * (wind + hit), pR: [1, -.4, -.2], pL: [-1, -.3, 0] };
  if (side > 0) { o.hR = arm; o.hL = [-.18, .62, .4]; } else { o.hL = [-arm[0], arm[1], arm[2]]; o.hR = [.18, .62, .4]; o.pL = [-1, -.4, -.2]; o.pR = [1, -.3, 0]; }
  o.smear = [side > 0 ? 1 : 0]; o.fast = true; return o;
}
// got hit at `at`: knocked back along local -z by `dist`, flails, recovers
export function actHit(lt, at, { dist = .6, side = 0 } = {}) {
  const u = lt - at; if (u < 0) return { kb: 0 };
  const k = Math.exp(-u * 3.2) * sm(0, .04, u), kb = dist * (1 - Math.exp(-u * 7));
  return { kb, lean: -32 * k, side: side * 18 * k, head: [-22 * k, 0, side * 10 * k], squash: -.25 * k * Math.exp(-u * 6) + .12 * k * Math.sin(u * 22) * Math.exp(-u * 5), hL: [-.5, .7 + .2 * k, -.1], hR: [.5, .75 + .2 * k, -.15], pL: [-1, 0, .5], pR: [1, 0, .5], ex: u < .9 ? 'scream' : 'shocked', pop: popAt(lt, at, .2) };
}
// shove something heavy: lean in, arms locked forward, slow trudging steps (ph advances with progress)
export function actPush(lt, { t0 = 0, rate = 1.6 } = {}) {
  const k = sm(t0, t0 + .35, lt), ph = Math.max(0, lt - t0) * rate * Math.PI * 2;
  return { lean: 30 * k, hipY: -.06 * k, hL: [-.2, .62, .62 * k + .06], hR: [.2, .62, .62 * k + .06], pL: [-1, -.3, -.3], pR: [1, -.3, -.3], walk: k > .5 ? { ph, stride: .13 } : undefined, squash: -.05 * k + .03 * Math.sin(ph * 2) * k, ex: 'angry', sweat: k > .9 };
}
// cheering leap (model sheet 41-44): crouch with arms back -> launch with open hands up -> tucked apex -> squat landing
export function actCheer(lt, { t0 = .35, dur = .55, h = .5, at = [0, 0, 0] } = {}) {
  const J = actJump(lt, { t0, dur, h, from: at, to: at }), u = clamp((lt - t0) / dur), air = lt > t0 && lt < t0 + dur;
  if (air) { J.hL = [-.48, 1.18, .12]; J.hR = [.48, 1.18, .12]; J.open = true; J.ex = 'happy'; J.fL = [-.16, -.35 + .12 * Math.sin(u * Math.PI), .1]; J.fR = [.16, -.42 + .1 * Math.sin(u * Math.PI), -.12]; }
  else if (lt < t0) { J.ex = 'confident'; } else J.ex = J.landed < .5 ? 'grinTeeth' : 'happy';
  return J;
}
// two-handed swing (model sheet 45-46): wind the prop up over the shoulder, chop down at `at`. Returns hands + o.prop {c, d} in torso space
export function actAxe(lt, at, { side = 1 } = {}) {
  const up = sm(at - .55, at - .12, lt) * (1 - sm(at - .06, at + .02, lt)), down = sm(at - .06, at + .02, lt) * (1 - sm(at + .35, at + .9, lt));
  const c = mixA(mixA([.04 * side, .5, .4], [.1 * side, .98, .1], up), [0, .44, .52], down), d = mixA(mixA([0, .55, .83], [.1 * side, .5, -.86], up), [0, -.45, .9], down); // stays within arm reach
  const n = Math.hypot(...d), D = d.map(v => v / n), hR = c.map((v, i) => v - D[i] * .02), hL = c.map((v, i) => v - D[i] * .14);
  return { hL, hR, pL: [-1, -.3, -.4], pR: [1, -.3, -.4], lean: -10 * up + 16 * down, twist: (14 * up - 8 * down) * side, hipY: -.05 - .06 * down, squash: .06 * up - .1 * down * (1 - sm(at, at + .15, lt)), prop: { c, d: D }, smear: down > .2 && down < .95 ? [1] : null, fast: true };
}
// put a prop in the hands: its local +y follows prop.d (handle direction), origin at prop.c (both torso space)
export function placeProp(obj, C, prop) { C.g.updateMatrixWorld(true); obj.visible = true; obj.position.copy(C.torso.localToWorld(new THREE.Vector3(...prop.c)));
  const q = new THREE.Quaternion(); C.torso.getWorldQuaternion(q); const dw = new THREE.Vector3(...prop.d).applyQuaternion(q).normalize(); obj.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dw); }
// v4.4 objects in hands ------------------------------------------------------------
// attachHeld(C): called by main.js after smoothing; puts every P.hold object on its hand (offset/rotation in hand space)
const _q1 = new THREE.Quaternion(), _e1 = new THREE.Euler();
export function attachHeld(C) { const H = C._hold; if (!H || !C.g.visible) return;
  const sc = C.g.getWorldScale(new THREE.Vector3()).x, T = C._trail || [];
  for (const [k, L_, ti] of [['R', C.aR, 1], ['L', C.aL, 0]]) { const h = H[k]; if (!h || !h.obj) continue; const hand = L_.hand; hand.updateWorldMatrix(true, false);
    const hp = new THREE.Vector3(), hq = new THREE.Quaternion(); hand.getWorldPosition(hp); hand.getWorldQuaternion(hq);
    if (h.wrist) hq.multiply(_q1.setFromAxisAngle(new THREE.Vector3(0, 1, 0), h.wrist * D2R)); // wrist roll about the forearm axis
    const off = new THREE.Vector3(...(h.off || [0, 0, 0])).multiplyScalar(sc).applyQuaternion(hq);
    let pos = hp.clone().add(off); _e1.set(...(h.rot || [0, 0, 0]).map(v => v * D2R)); let q = h.hang ? new THREE.Quaternion() : hq.clone().multiply(_q1.setFromEuler(_e1));
    if (h.hang) { q.setFromEuler(_e1); pos = hp.clone().add(new THREE.Vector3(...(h.off || [0, -.02, 0])).multiplyScalar(sc)); } // hanging item: gravity keeps it upright under the grip
    // inertia: the object's long axis lags behind hand velocity and acceleration (heavier = more lag), measured from this frame's motion samples
    const n = T.length, m = h.mass ?? .5;
    if (n >= 3 && m > 0) { const a0 = T[n - 3][ti], a1 = T[n - 2][ti], a2 = T[n - 1][ti]; if (a0 && a1 && a2) {
      const v = a2.clone().sub(a1).multiplyScalar(30), acc = a2.clone().sub(a1).sub(a1.clone().sub(a0)).multiplyScalar(900);
      const lag = v.multiplyScalar(-.05 * (h.hang ? 2.2 : 1)).add(acc.multiplyScalar(-.0016 * (h.hang ? 2.5 : 1))).multiplyScalar(m / Math.max(.2, sc)); if (lag.length() > .9) lag.setLength(.9);
      const up = new THREE.Vector3(0, h.hang ? -1 : 1, 0).applyQuaternion(q), tgt = up.clone().add(lag).normalize(); q.premultiply(new THREE.Quaternion().setFromUnitVectors(up, tgt)); } }
    // pick up / put down / hand-over: blend from a resting transform { p, q } into the hand (h.blend 0..1)
    if (h.from && (h.blend ?? 1) < 1) { const b = Math.max(0, h.blend ?? 1); pos.lerpVectors(h.from.p, pos, b); q = h.from.q.clone().slerp(q, b); }
    h.obj.visible = true; h.obj.position.copy(pos); h.obj.quaternion.copy(q); } }
// thrown / dropped object: ballistic arc from p0 with velocity v0, bounces on `floor` (restitution e), then slides and stops (friction mu).
//   returns { p:[x,y,z], q: Quaternion (tumble while flying, roll on the ground), rest: bool }
export function flyPath(age, p0, v0, { g = 9.8, floor = -1e9, e = .42, mu = 2.5, r = .08, spin = 8, axis = [1, 0, 0] } = {}) {
  let p = [...p0], v = [...v0], t = age, ang = 0, rest = false;
  for (let k = 0; k < 8 && t > 0; k++) { const a = .5 * g, b = v[1], c = p[1] - floor; const tHit = c <= 1e-4 && b <= 0 ? 0 : (b + Math.sqrt(Math.max(0, b * b + 2 * g * c))) / g;
    if (tHit > t || !isFinite(tHit)) { p = [p[0] + v[0] * t, p[1] + v[1] * t - a * t * t, p[2] + v[2] * t]; ang += spin * t; t = 0; break; }
    p = [p[0] + v[0] * tHit, floor, p[2] + v[2] * tHit]; ang += spin * tHit; t -= tHit; v = [v[0] * .8, -(v[1] - g * tHit) * e, v[2] * .8]; spin *= .6; if (v[1] < .6) { v[1] = 0; break; } }
  if (t > 0) { const sp = Math.hypot(v[0], v[2]), ts = Math.min(t, sp / mu), d = sp * ts - .5 * mu * ts * ts; if (sp > 1e-4) { p[0] += v[0] / sp * d; p[2] += v[2] / sp * d; ang += d / r; } rest = t >= sp / mu; p[1] = floor; }
  const ax = new THREE.Vector3(...axis).normalize(); return { p, q: new THREE.Quaternion().setFromAxisAngle(ax, ang), rest }; }
// bowling / underhand roll: carry at side -> pendulum back -> lunge + release at `at` -> follow-through. o.released = seconds since release
export function actBowl(lt, at, { side = 1 } = {}) {
  const back = sm(at - .7, at - .2, lt) * (1 - sm(at - .2, at, lt)), fwd = sm(at - .2, at, lt), rec = sm(at + .4, at + 1.1, lt);
  const arm = mixA(mixA(mixA([.34, .22, .1], [.3, .32, -.48], back), [.22, .12, .62], fwd), [.3, .55, .5], rec * .6);
  const o = { lean: 6 * back + 30 * fwd * (1 - rec * .6), hipY: -.04 - .14 * fwd * (1 - rec), twist: (-26 * back + 16 * fwd) * side, released: lt >= at ? lt - at : -1,
    fL: side > 0 ? [-.13, -.5, .06 + .3 * fwd * (1 - rec * .5)] : undefined, pR: [1, -.2, -.3], pL: [-1, -.3, 0], hL: [-.4, .45 + .2 * fwd, .2] };
  if (side > 0) o.hR = arm; else { o.hL = [-arm[0], arm[1], arm[2]]; o.hR = [.4, .45, .2]; }
  if (o.fL === undefined) delete o.fL; else o.fR = [.13, -.5 + .06 * fwd, -.18 * fwd];
  return o;
}
// a ball rolling from `p0` along unit `dir` (x,z): eases to a stop; returns { p, spin } (spin = rolled angle in radians about the travel axis)
export function rollPath(age, p0, dir, { v0 = 3, decel = 1.4, r = .1 } = {}) { const t = Math.min(age, v0 / decel), d = v0 * t - .5 * decel * t * t;
  return { p: [p0[0] + dir[0] * d, p0[1], p0[2] + dir[1] * d], spin: d / r, moving: age < v0 / decel }; }
// show-off: lift a held object to shoulder height at `at` (one hand), pop the head, small bounce while held up
export function actShow(lt, at, { side = 1 } = {}) { const k = sm(at - .35, at, lt), b = Math.sin(Math.max(0, lt - at) * 7) * Math.exp(-Math.max(0, lt - at) * 3) * .05;
  const arm = mixA([.32, .3, .3], [.42, 1.0 + b, .25], k), o = { lean: -6 * k, side: 6 * k * side, pR: [1, -.6, -.2], pL: [-1, -.3, 0], hL: [-.3, .36, .12], pop: popAt(lt, at, .14) };
  if (side > 0) o.hR = arm; else { o.hL = [-arm[0], arm[1], arm[2]]; o.hR = [.3, .36, .12]; } return o; }
// one-handed sword: raise overhead, diagonal slash down at `at`, follow-through low, then lift to admire (blade up in front) at `admire`
export function actSlash(lt, at, { admire = at + 1.2, side = 1 } = {}) {
  const up = sm(at - .55, at - .1, lt) * (1 - sm(at - .08, at, lt)), cut = sm(at - .08, at + .02, lt) * (1 - sm(admire - .5, admire, lt)), ad = sm(admire - .5, admire, lt);
  const arm = mixA(mixA(mixA([.3, .3, .2], [.25, 1.1, -.1], up), [-.12, .25, .6], cut), [.12, .78, .5], ad);
  const o = { hR: arm, pR: [1, -.3, -.5], hL: [-.32, .36, .14], pL: [-1, 0, -.5], lean: -8 * up + 18 * cut * (1 - ad), twist: (20 * up - 22 * cut * (1 - ad)) * side, hipY: -.08 * cut * (1 - ad),
    bladeRot: [lerp(lerp(lerp(30, -40, up), -120, cut), 0, ad), 0, 0], smear: cut > .15 && cut < .9 && !ad ? [1] : null, fast: true, admire: lt >= admire ? lt - admire : -1, ex: ad > .5 ? 'smug' : cut > .3 ? 'angry' : 'determined' };
  return o; }
// a struck / dropped object: hop + squash and settle (returns { y, sq, rz })
export function bounceAt(lt, at, { h = .12, n = 3 } = {}) { const u = lt - at; if (u < 0) return { y: 0, sq: 0, rz: 0 }; const T = .38; let y = 0, k = Math.floor(u / T), f = (u % T) / T;
  if (k < n) y = h * Math.pow(.45, k) * 4 * f * (1 - f); const sq = k < n && (f < .12 || f > .88) ? -.25 * Math.pow(.5, k) : 0; return { y, sq, rz: Math.exp(-u * 3) * Math.sin(u * 18) * .25 }; }
// fast repeated work (hammering, chopping, typing): `rate` strikes per second, returns pose params + strike phase info
//   o.strike = seconds since the last impact (use for sparks / sfx), o.k = 0..1 swing
export function actHammer(lt, { rate = 3, side = 1 } = {}) {
  const ph = lt * rate, f = ph % 1, up = f < .55 ? sm(0, .55, f) : 1 - sm(.55, .7, f), k = up; // slow raise, snap down
  const arm = mixA([.14, .42, .66], [.28, 1.05, .42], k), o = { lean: 10 - 8 * k, hipY: -.06, squash: -.06 * (1 - k) * (f > .7 && f < .8 ? 1 : 0), twist: -10 * k * side,
    head: [8 - 10 * k, 0, 0], ex: f > .68 && f < .9 ? 'angry' : 'nervous', strike: f >= .7 ? (f - .7) / rate : -1, fast: true };
  if (side > 0) { o.hR = arm; o.pR = [1, -.4, -.3]; o.hL = [-.12, .42, .6]; o.pL = [-1, -.3, 0]; } else { o.hL = [-arm[0], arm[1], arm[2]]; o.pL = [-1, -.4, -.3]; o.hR = [.12, .42, .6]; o.pR = [1, -.3, 0]; }
  return o;
}
// hit-stop: freeze the clock for `frames` right after `at` (use the returned lt for everything in the shot)
export function hitStop(lt, at, frames = 4) { const d = frames / 30; return lt < at ? lt : lt < at + d ? at : lt - d; }
// lip flap like anime: the mouth shape changes at most every 3 frames, from the envelope averaged over those frames
export function talkQ(env, t) { const f0 = Math.floor(t * 30 / 3) * 3; let e = 0; for (let k = -1; k < 3; k++) e += (env[f0 + k] || 0) * (k < 0 ? .5 : 1); e /= 3.5; return e > .5 ? 1 : e > .2 ? .5 : 0; }
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
// v4.7 chibi body: the costume sprite is warped into an inverted pear (narrow shoulders, full rounded bottom), keeping its art
export const BODY = { w: .86, h: .9, top: .7, bottom: 1.1, head: 1.14 };
function pearGeo() { const g = new THREE.PlaneGeometry(1, 1, 12, 16), P = g.attributes.position;
  for (let i = 0; i < P.count; i++) { const v = P.getY(i) + .5, sstep_ = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    const prof = BODY.bottom + (BODY.top - BODY.bottom) * sstep_(.22, 1, v), tuck = 1 - .14 * (1 - sstep_(0, .16, v)); P.setX(i, P.getX(i) * prof * tuck); }
  P.needsUpdate = true; return g; }
function sprMesh(pear = false) {
  const m = new THREE.MeshLambertMaterial({ alphaTest: .5, side: THREE.DoubleSide, emissive: 0xffffff, emissiveIntensity: .32 }); noOutline(m);
  const me = new THREE.Mesh(pear ? pearGeo() : new THREE.PlaneGeometry(1, 1), m); me.castShadow = false; me.receiveShadow = false;
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
  const inArm = (o) => { for (let q = o.parent; q && q !== C.torso; q = q.parent) if (q === C.aL.up || q === C.aL.fo || q === C.aR.up || q === C.aR.fo) return true; return false; };
  C.torso.traverse(o => { if (o.isMesh && !inArm(o) && o.parent !== C.sweat && o.parent !== C.props) {
    if (o === C.face) { o.visible = false; return; } o.material = SHADOWONLY; o.userData.noInk = true; o.castShadow = true; } });
  for (const L of [C.aL, C.aR]) { L.S.x = Math.sign(L.S.x) * (spec.shoulderX ?? .17); L.S.y = spec.shoulderY ?? .7; } // v4.6 sheet: arms start right under the head
  C.hc.children.forEach(o => { if (o.isMesh && o.material === SHADOWONLY) o.scale.setScalar(.68); });
  const F = SPR.meta[spec.sprite + '-F']; C.cx = F.ball[0];
  // v3.1: the Flow head floated above the collar so the neck hole showed -> sink the ball into the collar (ball bottom IN px below the body top)
  C.sink = spec.sink ?? 105; const IN = C.sink, drop = (F.body[1] - (F.ball[1] + F.ball[2])) + IN;
  C.head.position.y = .93; C.hc.position.y = .91 + (F.gap[1] - F.ball[1] - drop) * K2 - .93;
  C.torso.position.y = -(spec.drop ?? .32); // v2: short costume, hem just below the hips
  C.sb = sprMesh(!spec.classicBody); C.sh = sprMesh(); C.sh.renderOrder = 1; SPRG.add(C.sb, C.sh); C.bodyK = spec.classicBody ? { w: 1, h: 1, head: 1 } : BODY;
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
    const db = Math.min(Math.abs(a - 24), Math.abs(a - 60), Math.abs(a - 128)), turnW = db < 9 ? .82 + .18 * (db / 9) * (db / 9) : 1; // v4.1 turn squash
    const key = C.spr + '-' + view, M = SPR.meta[key]; const yaw = Math.atan2(s_v.x, s_v.z);
    s_r.set(Math.cos(yaw), 0, -Math.sin(yaw));
    // body
    const U = s_u.set(0, 1, 0).transformDirection(C.torso.matrixWorld); const rollB = Math.atan2(-U.dot(s_r), U.y);
    const [x0, y0, x1, y1] = M.body; const lx = ((x0 + x1) / 2 - C.cx) * K2 * (mir ? -1 : 1), ly = .91 - ((y0 + y1) / 2 - M.gap[1]) * K2;
    const cb = C.torso.localToWorld(new THREE.Vector3(0, ly, 0)).addScaledVector(s_r, lx * s * Math.cos(rollB)).addScaledVector(s_v, -.14 * s);
    const BK = C.bodyK || { w: 1, h: 1, head: 1 }, sq = clamp(C.sq || 0, -.45, .6), bh0 = (y1 - y0) * K2 * s, bh = bh0 * BK.h; cb.y += -(bh0 - bh) / 2 + bh / 2 * sq; // v4 squash/stretch, feet stay planted; v4.7 shorter torso keeps its hem
    place(C.sb, cb, yaw, rollB, (x1 - x0) * K2 * s * BK.w * (1 - (C.br || 0) * .5) * (1 - sq * .5) * turnW, bh * (1 + (C.br || 0)) * (1 + sq), mir);
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
    const neck = cb.clone().addScaledVector(upB, bh / 2 * (1 + sq)).addScaledVector(rtB, (M.ball[0] - (x0 + x1) / 2) * K2 * s * (mir ? -1 : 1) * .5);
    const hk = BK.head || 1, ballC = neck.addScaledVector(upH, (M.ball[2] * hk - (C.sink ?? 105) - 40 * Math.sin(nod)) * K2 * s).addScaledVector(rtH, (M.ball[0] - (x0 + x1) / 2) * K2 * s * (mir ? -1 : 1) * .5);
    const ch = ballC.addScaledVector(rtH, dx * s * hk).addScaledVector(upH, dy * s * hk).addScaledVector(s_v, .04 * s);
    const pp = C.pop || 0, hq = sq * .45; place(C.sh, ch, yaw, rollH, (hx1 - hx0) * K2 * s * hk * (1 + pp * .6) * (1 - hq * .5) * turnW, (hy1 - hy0) * K2 * s * hk * (1 + pp) * (1 + hq), mir);
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
