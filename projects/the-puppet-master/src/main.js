// main.js: frame(t) -> JPEG data URL (1080x1920): shots + transitions + one-word captions
import * as E from './engine.js';
import * as Wd from './world.js';
import { makeCast, makeChar, pose, CHARS, loadSprites, updateSprites, SPRG, ANIM, OVL, applySmooth, attachHeld, headBall } from './chars.js';
import { SHOTS, initShots, runShot, COVER, BENCH } from './shots.js';
import { bigWordsReset } from './text3d.js';
const timing = await (await fetch('timing.json')).json(), project = await (await fetch('project.json')).json();
await E.fontsReady; await loadSprites(project.cast); E.scene.add(SPRG); makeCast(project.cast); initShots(timing); Wd.redrawSign();
const out = document.getElementById('out'), X = out.getContext('2d');
const BL = document.createElement('canvas'); BL.width = 270; BL.height = 480; const BX = BL.getContext('2d');
/* v5.7 two-scale glow (real lenses: a tight core glow + a wide soft halo whose light falls off with distance). Only the
   brightest parts feed it (threshold via brightness/contrast). globalThis.GLOW = { a, wide, warm } tunes it per project. */
const BW = document.createElement('canvas'); BW.width = 135; BW.height = 240; const BWX = BW.getContext('2d');
function bloom(a = .24) { const G = globalThis.GLOW || {}; a = G.a ?? a; BX.filter = 'brightness(.9) contrast(3.4) saturate(1.3) blur(7px)'; BX.drawImage(out, 0, 0, 270, 480); BX.filter = 'none';
  const wide = G.wide ?? 0; if (wide > 0) { BWX.filter = 'brightness(.8) contrast(4) saturate(1.5) blur(9px)'; BWX.drawImage(out, 0, 0, 135, 240); BWX.filter = 'none'; }
  X.save(); X.globalCompositeOperation = 'screen'; X.globalAlpha = a; X.drawImage(BL, 0, 0, 1080, 1920); if (wide > 0) { X.globalAlpha = wide; X.drawImage(BW, 0, 0, 1080, 1920); }
  const df = G.diffuse ?? 0; if (df > 0) { /* v6.0 diffusion ('tutorial glow' / Orton): a soft blurred copy of the WHOLE frame screened on top: highlights bleed, the image gets a dreamy haze, darks stay dark */
    BWX.filter = 'blur(6px) saturate(1.15)'; BWX.drawImage(out, 0, 0, 135, 240); BWX.filter = 'none'; X.globalAlpha = df; X.drawImage(BW, 0, 0, 1080, 1920);
    X.globalCompositeOperation = 'soft-light'; X.globalAlpha = df * .8; X.drawImage(BW, 0, 0, 1080, 1920); }
  X.restore(); }
// v4 auto-cinematics (no effect on story/staging): shallow focus on the nearest character, shock speed lines + zoom punch
const _hv = new E.THREE.Vector3(), _cv = new E.THREE.Vector3();
function nearestHead() { let best = null; E.camera.getWorldPosition(_cv); const fw = new E.THREE.Vector3(0, 0, -1).transformDirection(E.camera.matrixWorld);
  for (const C of Object.values(CHARS)) { let r = C.g, vis = true; while (r) { if (!r.visible) { vis = false; break; } r = r.parent; } if (!vis || !C.g.parent) continue;
    C.head.getWorldPosition(_hv); const d = _hv.clone().sub(_cv), z = d.dot(fw); if (z < .3) continue; const sp = _hv.clone().project(E.camera); if (Math.abs(sp.x) > .85 || sp.y > .95 || sp.y < -.9) continue;
    if (!best || z < best.z) best = { C, z, sx: (sp.x + 1) * 540, sy: (1 - sp.y) * 960 }; } return best; }
let FX = null;
let SPL = null;
function camDrift(t) { const f = Math.min(1.6, Math.max(.4, (E.POST.focus || 3) / 4)); E.camera.translateX(E.noise1(t * .45 + 3) * .13 * f); E.camera.translateY(E.noise1(t * .38 + 21) * .05 * f); // v4.29 the camera always floats a little (refs: 90% of frames move)
  E.camera.rotateX(E.noise1(t * .33 + 11) * .0045); E.camera.rotateY(E.noise1(t * .27 + 47) * .006); E.camera.updateMatrixWorld(); }
function draw(sh, t, alpha = 1, mb = 0, dir = 1) { OVL.length = 0; bigWordsReset(); E.POST.gseed = Math.floor(t * 30 + .5) % 97; /* v4.26 grain refreshes every frame (12 fps grain read as stutter) */ E.POST.dof = 0; E.POST.mblur = [mb * 90 * dir, mb * 14]; E.POST.leakPh = t * .6;
  // v4 motion smoothing: evaluate the shot 5..1 frames back (no render) and blend character poses -> no 1-frame snaps
  const SW = [.05, .08, .12, .17, .23], lt0 = t - sh.t0; Object.values(CHARS).forEach(C => { C._acc = null; C._trail = []; C._roots = []; });
  let prevCam = null;
  if (!window.NOSMOOTH) for (let k = 5; k >= 1; k--) { const tk = Math.max(sh.t0, t - k / 30); ANIM.rec = SW[5 - k]; ANIM.t = tk; runShot(sh, tk); if (k === 1) { if (!window.NOAUTO) camDrift(tk); E.camera.updateMatrixWorld(); prevCam = { m: E.camera.matrixWorldInverse.clone(), pm: E.camera.projectionMatrix.clone() }; } } // v4.26 look-backs before a cut hold the first pose (same smoothing weight every frame, no settle-jolt)
  ANIM.wFinal = .35; ANIM.rec = window.NOSMOOTH ? undefined : .35; ANIM.t = t; OVL.length = 0; runShot(sh, t); ANIM.rec = undefined;
  if (!window.NOSMOOTH) Object.values(CHARS).forEach(applySmooth); E.scene.updateMatrixWorld(); Object.values(CHARS).forEach(attachHeld);
  if (!window.NOAUTO) camDrift(t); // v4.1 living camera: slow handheld drift
  updateSprites(E.camera);
  if (prevCam && mb === 0 && !window.NOAUTO) { // v4 auto camera motion blur: how far the focus point slid on screen since the last frame
    E.camera.updateMatrixWorld(); const fw = new E.THREE.Vector3(0, 0, -1).transformDirection(E.camera.matrixWorld), P = E.camera.position.clone().addScaledVector(fw, Math.max(1, E.POST.focus || 4));
    const a = P.clone().project(E.camera), b = P.clone().applyMatrix4(prevCam.m).applyMatrix4(prevCam.pm), dx = (a.x - b.x) * 540, dy = -(a.y - b.y) * 960, L = Math.hypot(dx, dy);
    if (L > 6 && L < 400) { const k = Math.min(1, (L - 6) / 30) * .6, cap = Math.min(1, 40 / (L * k)); E.POST.mblur = [dx * k * cap, dy * k * cap]; } } // v4.19 capped: a camera jump (cut/teleport) must never smear the whole frame
  const nh = nearestHead(); if (E.POST.dof === 0 && nh && nh.z < 9 && !window.NOAUTO) { E.POST.focus = nh.z * .97; E.POST.dof = .7 * (1 - E.sstep(3.5, 9, nh.z)); }
  const lt = t - sh.t0, shock = nh && nh.C.f2 && /shocked|scared|scream/.test(nh.C.f2[0]) && nh.C.view !== 'B' && nh.z < 7 && lt < .75 && !window.NOAUTO; FX = shock ? { lt, x: nh.sx, y: nh.sy } : (alpha === 1 ? null : FX); if (window.NOFACE) Object.values(CHARS).forEach(C => { C.face.visible = false; C.sweat.visible = false; for (const L of [C.aL, C.aR, C.lL, C.lR]) { L.up.visible = false; L.fo.visible = false; } }); Wd.updateSky(t); E.render(); X.globalAlpha = alpha;
  X.save(); X.translate(OFF[0], OFF[1]);
  if (!(FX && FX.lt < .32) && ZP > 1.0005) { X.drawImage(E.glc, 540 * (1 - ZP), 860 * (1 - ZP), 1080 * ZP, 1920 * ZP); } else
  if (FX && FX.lt < .32) { const k = 1 + .07 * (1 - E.eOut(FX.lt / .32)); X.drawImage(E.glc, FX.x * (1 - k), FX.y * (1 - k), 1080 * k, 1920 * k); } else X.drawImage(E.glc, 0, 0);
  X.globalAlpha = 1; if (FX) speedLines(FX); overlays(t, alpha); X.restore(); }
const OFF = [0, 0]; // v7.2 screen offset for push transitions
function scr(v) { const p = v.clone().project(E.camera); return p.z > 1 ? null : [(p.x + 1) * 540, (1 - p.y) * 960]; }
function trails(alpha) { // v4 smear trails behind fast hands/feet (positions from the smoothing samples)
  for (const C of Object.values(CHARS)) { const T = C._trail; if (!C.g.visible || !T || T.length < 4) continue;
    for (const j of (C.smear || [])) { const pts = T.map(s => scr(s[j])).filter(Boolean); if (pts.length < 4) continue; // P.smear = [0 hand L, 1 hand R, 2 foot L, 3 foot R]
      let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); if (L < 70) continue;
      const a = Math.min(1, (L - 70) / 120) * alpha * Math.min(1, .4 + FXL); X.save(); X.lineCap = 'round'; X.lineJoin = 'round';
      for (let i = 1; i < pts.length; i++) { const u = i / (pts.length - 1); X.strokeStyle = `rgba(255,255,255,${(.12 + .5 * u) * a})`; X.lineWidth = 6 + 26 * u; X.beginPath(); X.moveTo(...pts[i - 1]); X.lineTo(...pts[i]); X.stroke(); }
      X.restore(); } } }
function overlays(t, alpha) { // gloom lines + sparkles requested by poses/shots this frame
  trails(alpha);
  for (const o of OVL) { X.save(); X.globalAlpha = alpha * Math.min(1, o.k);
    if (o.kind === 'redeyes') { const B = headBall(o.C); if (!B || B.view === 'B') { X.restore(); continue; } const q0 = scr(B.c), qr = scr(B.c.clone().addScaledVector(B.right, B.r)); if (!q0 || !qr) { X.restore(); continue; }
      const r = Math.hypot(qr[0] - q0[0], qr[1] - q0[1]); X.globalCompositeOperation = 'lighter';   /* PM: the eyes light up red exactly where drawFace puts them */
      for (const sd of [-1, 1]) { const a = sd * .247 + B.phi; if (Math.cos(a) < .25) continue; const q = scr(B.c.clone().addScaledVector(B.right, B.r * Math.sin(a) * B.sgn).addScaledVector(B.up, -B.faceY * B.r)); if (!q) continue;
        const rr = r * (.22 + .03 * Math.sin(o.t * 9 + sd)), g = X.createRadialGradient(q[0], q[1], 0, q[0], q[1], rr); g.addColorStop(0, 'rgba(255,235,235,1)'); g.addColorStop(.25, 'rgba(255,40,55,.95)'); g.addColorStop(1, 'rgba(255,0,30,0)');
        X.globalAlpha = alpha * o.k; X.fillStyle = g; X.beginPath(); X.arc(q[0], q[1], rr, 0, 7); X.fill(); } X.restore(); continue; }
    if (o.kind === 'tears') { const B = headBall(o.C); if (!B || B.view === 'B') { X.restore(); continue; } const q0 = scr(B.c), qr = scr(B.c.clone().addScaledVector(B.right, B.r)); if (!q0 || !qr) { X.restore(); continue; }
      const r = Math.hypot(qr[0] - q0[0], qr[1] - q0[1]), k = o.k; X.lineCap = 'round'; X.lineJoin = 'round';
      for (const sd of [-1, 1]) { const a = sd * .247 + B.phi; if (Math.cos(a) < .25) continue;   // v4.34 eyes exactly where drawFace puts them (u = .5 +- .13 of the face strip, wrapped on the ball)
        const ew = B.c.clone().addScaledVector(B.right, B.r * Math.sin(a) * B.sgn).addScaledVector(B.up, -B.faceY * B.r), q = scr(ew); if (!q) continue;
        const out = Math.sign(Math.sin(a) * B.sgn) || sd, x0 = q[0], y0 = q[1], fs = Math.cos(a);   // fs: narrower when the eye turns away
        X.globalAlpha = alpha * Math.min(1, k * 2.5) * .85; X.fillStyle = '#9fd8ff'; X.beginPath(); X.ellipse(x0, y0 + .055 * r, .085 * r * fs, .032 * r, 0, 0, 7); X.fill();   // glistening rim under the eye
        X.fillStyle = '#ffffff'; X.beginPath(); X.ellipse(x0 + .025 * r * out, y0 + .045 * r, .022 * r * fs, .011 * r, 0, 0, 7); X.fill();
        if (k > .35) { const L = r * (.25 + .7 * Math.min(1, (k - .35) / .45)), ph = o.t * 2.3 + sd * 7, xs = x0 + .02 * r * out, ys = y0 + .07 * r; X.globalAlpha = alpha * .9;
          for (const [w, c] of [[.07 * r, '#7cc4f4'], [.026 * r, '#e8f6ff']]) { X.strokeStyle = c; X.lineWidth = w; X.beginPath(); X.moveTo(xs, ys);
            for (let s_ = 1; s_ <= 8; s_++) { const u = s_ / 8; X.lineTo(xs + Math.sin(u * 5 + ph) * .018 * r + u * .035 * r * out, ys + u * L); } X.stroke(); }
          if (k > .7) for (let d = 0; d < 2; d++) { const u = (o.t * 1.1 + d * .5 + (sd < 0 ? 0 : .25)) % 1, y = ys + L + u * r * 1.2; X.globalAlpha = alpha * (1 - u) * .9; X.fillStyle = '#9fd8ff';
            X.beginPath(); X.ellipse(xs + .05 * r * out, y, .04 * r, .058 * r, 0, 0, 7); X.fill(); X.fillStyle = '#ffffff'; X.beginPath(); X.arc(xs + .04 * r * out, y - .018 * r, .011 * r, 0, 7); X.fill(); } } } }
    else if (o.kind === 'split') { // v5.0 ultimate slash: a bright cut line across the frame, the two halves slide apart along it and settle back
      const k = o.k, c = Math.cos(o.ang), s_ = Math.sin(o.ang), sh = o.gap * Math.sin(Math.PI * E.sstep(.12, 1, k)), cx = 540, cy = 900;
      if (!SPL) { SPL = document.createElement('canvas'); SPL.width = 1080; SPL.height = 1920; } const sx = SPL.getContext('2d'); sx.clearRect(0, 0, 1080, 1920); sx.drawImage(out, 0, 0);
      if (sh > .3) for (const side of [-1, 1]) { X.save(); X.beginPath(); const nx = -s_ * side, ny = c * side, L = 3000;
        X.moveTo(cx - c * L, cy - s_ * L); X.lineTo(cx + c * L, cy + s_ * L); X.lineTo(cx + c * L + nx * L, cy + s_ * L + ny * L); X.lineTo(cx - c * L + nx * L, cy - s_ * L + ny * L); X.closePath(); X.clip();
        X.globalAlpha = 1; X.drawImage(SPL, c * sh * side, s_ * sh * side); X.restore(); }
      const lw = 14 * (1 - E.sstep(.05, .6, k)) + 2; X.save(); X.globalCompositeOperation = 'lighter'; X.globalAlpha = alpha * (1 - E.sstep(.4, 1, k)); X.strokeStyle = '#ffffff'; X.shadowColor = '#bfe4ff'; X.shadowBlur = 40; X.lineWidth = lw;
      X.beginPath(); X.moveTo(cx - c * 1400, cy - s_ * 1400); X.lineTo(cx + c * 1400, cy + s_ * 1400); X.stroke(); X.restore(); }
    else if (o.kind === 'impactframe') { // v5.1 anime impact frame: inverted picture + bold black radial lines aimed at the hit (2 frames, never longer: flashing)
      const q = scr(o.p) || [540, 900]; X.globalCompositeOperation = 'difference'; X.fillStyle = '#ffffff'; X.fillRect(0, 0, 1080, 1920); X.globalCompositeOperation = 'saturation'; X.fillStyle = '#808080'; X.fillRect(0, 0, 1080, 1920); /* black & white */
      X.globalCompositeOperation = 'source-over';
      const r_ = E.rng(13); X.fillStyle = '#000000'; for (let i = 0; i < o.lines; i++) { const a = r_() * 6.283, w = .012 + r_() * .03, r0 = 140 + r_() * 260; X.beginPath(); X.moveTo(q[0] + Math.cos(a) * r0, q[1] + Math.sin(a) * r0);
        X.lineTo(q[0] + Math.cos(a - w) * 2400, q[1] + Math.sin(a - w) * 2400); X.lineTo(q[0] + Math.cos(a + w) * 2400, q[1] + Math.sin(a + w) * 2400); X.closePath(); X.fill(); } }
    else if (o.kind === 'scribble') { const B = o.C ? headBall(o.C) : null; const q = o.C ? (B ? scr(B.c) : null) : scr(o.p); if (!q) { X.restore(); continue; } const R = o.r * 1080, n = 46, m = Math.floor(n * Math.min(1, o.k)); // v7.2 red marker circling a key person/object (documentary ref)
      X.strokeStyle = o.col || 'rgba(235,30,40,.85)'; X.lineWidth = 11; X.lineCap = 'round'; X.globalCompositeOperation = 'source-over'; X.beginPath();
      for (let j = 0; j <= m; j++) { const u = j / n, a = -1.9 + u * Math.PI * 2.25, wob = 1 + .06 * Math.sin(u * 23 + o.seed) + .04 * Math.sin(u * 51); const x = q[0] + Math.cos(a) * R * wob * 1.08, y = q[1] + Math.sin(a) * R * wob * .9 - u * R * .12; j ? X.lineTo(x, y) : X.moveTo(x, y); } X.stroke(); }
    else if (o.kind === 'gloom') { const C = o.C; C.head.updateWorldMatrix(true, false); const hp = C.head.getWorldPosition(new E.THREE.Vector3()), q = scr(hp); if (!q) { X.restore(); continue; }
      const top = scr(hp.clone().add(new E.THREE.Vector3(0, .5 * C.spec.s, 0))), R = top ? Math.max(40, Math.abs(q[1] - top[1])) : 120; X.strokeStyle = 'rgba(40,30,70,.75)'; X.lineCap = 'round';
      for (let i = 0; i < 9; i++) { const xx = q[0] + (i - 4) * R * .2, ph = ((t * .9 + i * .37) % 1), y0 = q[1] - R * 1.5 + ph * R * .5, L = R * (.5 + .3 * ((i * 7) % 3) / 2);
        X.lineWidth = Math.max(2, R * .035); X.globalAlpha = alpha * Math.min(1, o.k) * (1 - ph) * .9; X.beginPath(); X.moveTo(xx, y0); X.lineTo(xx, y0 + L); X.stroke(); } }
    else if (o.kind === 'impact') { const q = scr(o.p); if (!q) { X.restore(); continue; } const k = o.k, r = 150 * o.size * (.55 + .7 * E.eOut(k / .5)), r_ = E.rng(7);
      X.translate(q[0], q[1]); X.globalAlpha = alpha * (1 - E.sstep(.35, 1, k));
      X.fillStyle = '#fff6c8'; X.strokeStyle = '#1c1420'; X.lineWidth = 7; X.beginPath(); for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2, d = (i % 2 ? .38 : 1) * r * (.8 + .4 * r_()); X.lineTo(Math.cos(a) * d, Math.sin(a) * d); } X.closePath(); X.fill(); X.stroke();
      X.fillStyle = '#ffd24a'; X.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2 + .2, d = (i % 2 ? .3 : .62) * r; X.lineTo(Math.cos(a) * d, Math.sin(a) * d); } X.closePath(); X.fill();
      X.strokeStyle = `rgba(255,255,255,${1 - k})`; X.lineWidth = 10 * (1 - k); X.beginPath(); X.arc(0, 0, r * (1 + 1.2 * k), 0, 7); X.stroke(); }
    else if (o.kind === 'dust') { const q = scr(o.p); if (!q) { X.restore(); continue; } const k = o.k, r_ = E.rng(3); X.translate(q[0], q[1]);
      for (let i = 0; i < 9; i++) { const sd = i < 5 ? -1 : 1, a = (r_() * .5 + .1) * Math.PI, dx = sd * Math.cos(a) * (60 + 200 * E.eOut(k)) * o.size, dy = -Math.sin(a) * 50 * E.eOut(k) * o.size, rr = (22 + 30 * r_()) * (0.6 + k) * o.size;
        X.globalAlpha = alpha * .8 * (1 - E.sstep(.3, 1, k)); X.fillStyle = '#d9d2e6'; X.strokeStyle = 'rgba(28,20,32,.6)'; X.lineWidth = 4; X.beginPath(); X.arc(dx, dy, rr, 0, 7); X.fill(); X.stroke(); } }
    else if (o.kind === 'debris') { const O = o.o, r_ = E.rng((O.seed || 1) * 977), n = O.n || 18, sp = O.speed || 6, g = O.grav ?? 9.8, kind = O.kind || 'rock', age = o.age, life = O.life ?? 2.2;
      for (let i = 0; i < n; i++) { const th = r_() * Math.PI * 2, up = (O.up ?? .55) + r_() * .5, v = sp * (.45 + .75 * r_()); const vx = Math.cos(th) * v * (1 - up * .5), vz = Math.sin(th) * v * (1 - up * .5), vy = v * up;
        const flut = kind === 'leaf' ? Math.sin(age * 9 + i) * .35 : 0, gg = kind === 'leaf' ? g * .18 : g, drag = kind === 'leaf' ? Math.exp(-age * 2.2) : 1;
        const w = new E.THREE.Vector3(o.p.x + vx * age * drag + flut, Math.max(O.floor ?? -1e9, o.p.y + vy * age * drag - .5 * gg * age * age), o.p.z + vz * age * drag); const q = scr(w); const r1 = r_(), r2 = r_(), r3 = r_(); if (!q) continue;
        const d = E.camera.position.distanceTo(w), sz = (O.size || .12) * (.5 + r1) * 1100 / Math.max(.5, d), rot = r2 * 7 + age * (kind === 'leaf' ? 3 : 9) * (r3 - .5) * 2;
        X.save(); X.translate(q[0], q[1]); X.rotate(rot); X.globalAlpha = alpha * (1 - E.sstep(life * .7, life, age));
        if (kind === 'spark') { X.globalCompositeOperation = 'lighter'; X.fillStyle = O.col || '#ffd27a'; X.beginPath(); X.ellipse(0, 0, sz * .9, sz * .25, 0, 0, 7); X.fill(); }
        else if (kind === 'leaf') { X.fillStyle = O.col || '#5fae4a'; X.strokeStyle = '#1c1420'; X.lineWidth = Math.max(2, sz * .08); X.beginPath(); X.moveTo(-sz * .6, 0); X.quadraticCurveTo(0, -sz * .45, sz * .6, 0); X.quadraticCurveTo(0, sz * .45, -sz * .6, 0); X.fill(); X.stroke(); }
        else { X.fillStyle = O.col || '#8f86a0'; X.strokeStyle = '#1c1420'; X.lineWidth = Math.max(2, sz * .1); X.beginPath(); const m = 5 + (i % 3), rj = E.rng(i * 31 + 5); for (let j = 0; j < m; j++) { const a = j / m * 6.283, rr = sz * (.55 + .45 * rj()); X.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } X.closePath(); X.fill(); X.stroke();
          X.fillStyle = 'rgba(255,255,255,.18)'; X.beginPath(); X.arc(-sz * .15, -sz * .15, sz * .3, 0, 7); X.fill(); }
        X.restore(); } }
    else if (o.kind === 'smoke') { // v4.1: each puff drifts outward + up on its own path, grows soft, then fades out (alpha), outline thins away
      const O = o.o, r_ = E.rng((O.seed || 1) * 131), n = O.n || 22, age = o.age, life = O.life ?? 3.2, spread = O.spread ?? 1.6;
      const d0 = E.camera.position.distanceTo(o.p), col = O.col || '#e9dcc0', sh = O.shade || 'rgba(70,50,90,.26)';
      const P = []; for (let i = 0; i < n; i++) { const th = r_() * Math.PI * 2, v = .35 + .65 * r_(), up = .25 + .6 * r_(), r0 = (.18 + .22 * r_()) * (O.size || 1), dl = r_() * .25, lf = life * (.6 + .4 * r_());
        const a = Math.max(0, age - dl), k = 1 - Math.exp(-a * 2.4); // eased outward travel
        const hgt = (up * spread * .55 * k + (O.rise ?? .35) * (1 - Math.exp(-a * .8)) / .8) * (O.size || 1), sway = (O.sway ?? .22) * (O.size || 1) * Math.min(1, hgt / ((O.size || 1) * .6)) * Math.sin(hgt * 3.2 - age * 1.6 + i * .7); /* v5.3 smoke rises on a travelling sine (x = sin(y - t)), sway grows with height, rise slows as heat dissipates */
        const w = new E.THREE.Vector3(o.p.x + Math.cos(th) * v * spread * k * (O.size || 1) + sway, o.p.y + hgt, o.p.z + Math.sin(th) * v * spread * .6 * k * (O.size || 1));
        const q = scr(w); if (!q || a <= 0) continue; const R = r0 * (.4 + 1.6 * (1 - Math.exp(-a * 1.8))) * 1100 / Math.max(.5, E.camera.position.distanceTo(w));
        const fade = 1 - E.sstep(lf * .35, lf, a); if (fade <= .01) continue; P.push([q[0], q[1], R, fade, w.y]); }
      P.sort((A, B) => A[4] - B[4]);
      for (const [x, y, R, f] of P) { X.globalAlpha = alpha * f * f * .9; X.fillStyle = '#1c1420'; X.beginPath(); X.arc(x, y, R + 5 * f, 0, 7); X.fill(); }
      for (const [x, y, R, f] of P) { X.globalAlpha = alpha * Math.min(1, f * 1.25); X.fillStyle = col; X.beginPath(); X.arc(x, y, R, 0, 7); X.fill();
        X.fillStyle = sh; X.beginPath(); X.arc(x + R * .2, y + R * .24, R * .8, 0, 7); X.fill(); X.fillStyle = col; X.beginPath(); X.arc(x - R * .12, y - R * .14, R * .68, 0, 7); X.fill(); }
      // soft haze that lingers after the puffs are gone
      const hz = E.sstep(.2, .9, age) * (1 - E.sstep(life * .5, life * 1.05, age)), b = scr(o.p);
      if (b && hz > 0) { const Rh = Math.min(520, (O.size || 1) * spread * 1300 / Math.max(.5, d0) * (.6 + .5 * E.sstep(0, life, age))); const g = X.createRadialGradient(b[0], b[1] - Rh * .3, 0, b[0], b[1] - Rh * .3, Rh);
        g.addColorStop(0, `rgba(233,220,192,${.22 * hz})`); g.addColorStop(.6, `rgba(233,220,192,${.1 * hz})`); g.addColorStop(1, 'rgba(233,220,192,0)'); X.globalAlpha = alpha; X.fillStyle = g; X.beginPath(); X.arc(b[0], b[1] - Rh * .3, Rh, 0, 7); X.fill(); } }
    else if (o.kind === 'spark') { const q = scr(o.p); if (!q) { X.restore(); continue; } const r = 46 * o.size * (.6 + .4 * o.k), ro = t * 1.5;
      X.translate(q[0], q[1]); X.rotate(ro * .2); X.globalCompositeOperation = 'lighter'; const g = X.createRadialGradient(0, 0, 0, 0, 0, r * 1.3); g.addColorStop(0, 'rgba(255,250,220,.9)'); g.addColorStop(1, 'rgba(255,220,140,0)'); X.fillStyle = g; X.beginPath(); X.arc(0, 0, r * 1.3, 0, 7); X.fill();
      X.fillStyle = '#fffbe8'; for (const [rr, rot] of [[r, 0], [r * .55, Math.PI / 4]]) { X.save(); X.rotate(rot); X.beginPath(); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, d = k % 2 ? rr * .16 : rr; X.lineTo(Math.cos(a) * d, Math.sin(a) * d); } X.closePath(); X.fill(); X.restore(); } }

    else if (o.kind === 'sparkline') { const a = scr(o.p), b = scr(o.p2); if (a && b) { X.globalCompositeOperation = 'lighter'; X.globalAlpha = alpha * o.k; X.lineCap = 'round';
      X.strokeStyle = o.col; X.lineWidth = o.w * 2.4; X.globalAlpha = alpha * o.k * .35; X.beginPath(); X.moveTo(b[0], b[1]); X.lineTo(a[0], a[1]); X.stroke();   /* soft glow */
      X.globalAlpha = alpha * o.k; X.lineWidth = o.w; X.beginPath(); X.moveTo(b[0], b[1]); X.lineTo(a[0], a[1]); X.stroke(); } }
    else if (o.kind === 'lightwrap') { /* v6.0 painted light layer (refs: lantern light-painting tutorial): a soft radial light from a source in the scene,
         laid OVER everything near it (characters included) - soft-light lifts what it touches, a little screen adds the glow */
      const q = scr(o.p); if (q) { const d = Math.max(.6, E.camera.position.distanceTo(o.p)), R = Math.min(1800, o.r * 1100 / d), g = X.createRadialGradient(q[0], q[1], 0, q[0], q[1], R);
        g.addColorStop(0, o.col); g.addColorStop(.18, o.col + 'b0'); g.addColorStop(.45, o.col + '40'); g.addColorStop(.75, o.col + '10'); g.addColorStop(1, o.col + '00');
        X.fillStyle = g; X.globalCompositeOperation = 'soft-light'; X.globalAlpha = alpha * o.k; X.beginPath(); X.arc(q[0], q[1], R, 0, 7); X.fill();
        X.globalCompositeOperation = 'screen'; X.globalAlpha = alpha * o.k * .3; X.beginPath(); X.arc(q[0], q[1], R, 0, 7); X.fill(); } }
    else if (o.kind === 'dot') { const q = scr(o.p); if (q) { X.globalCompositeOperation = 'lighter'; const r = o.r || 26, g = X.createRadialGradient(q[0], q[1], 0, q[0], q[1], r * 2.6); g.addColorStop(0, 'rgba(255,240,240,1)'); g.addColorStop(.18, 'rgba(255,40,60,.95)'); g.addColorStop(1, 'rgba(255,20,40,0)');
      X.globalAlpha = alpha * o.k; X.fillStyle = g; X.beginPath(); X.arc(q[0], q[1], r * 2.6, 0, 7); X.fill(); } }
    else if (o.kind === 'whisper') { /* PM: a planted thought. A thin red wavy thread from the speaker's head to the target's head, the line
         of text floats beside the target and appears letter by letter (Thai grapheme clusters), soft red glow, slight drift. */
      const a = o.p && scr(o.p), b = scr(o.p2) || [540, 700], k = o.k; X.globalAlpha = alpha * Math.min(1, k * 4) * (1 - E.sstep(.85, 1, k)); X.globalCompositeOperation = 'lighter';
      if (a && o.thread !== false) { const n = 40, u = E.eOut(Math.min(1, k * 2.2)); X.strokeStyle = '#ff2a3a'; X.shadowColor = '#ff2a3a'; X.shadowBlur = 18; X.lineWidth = 3.2; X.beginPath();
        for (let i = 0; i <= n * u; i++) { const s = i / n, x = a[0] + (b[0] - a[0]) * s, y = a[1] + (b[1] - a[1]) * s - Math.sin(Math.PI * s) * 60, w = Math.sin(s * 14 - o.t * 7) * 7 * Math.sin(Math.PI * s); i ? X.lineTo(x + w, y + w * .4) : X.moveTo(x, y); } X.stroke(); }
      X.globalCompositeOperation = 'source-over'; const G = [...new Intl.Segmenter('th', { granularity: 'grapheme' }).segment(o.txt)].map(s => s.segment), shown = Math.floor(G.length * E.clamp((k - .12) / .45));
      X.font = `600 ${o.fs || 56}px Prompt, sans-serif`; X.textBaseline = 'middle'; const full = G.join(''), W = X.measureText(full).width, x0 = Math.min(1040 - W, Math.max(40, b[0] - W / 2)), y0 = Math.max(170, b[1] - (o.dy ?? 210)) - k * 30;
      let x = x0; for (let i = 0; i < shown; i++) { const g = G[i], w = X.measureText(g).width, fa = E.clamp((shown - i) / 3), yy = y0 + Math.sin(o.t * 3 + i * .5) * 4;
        X.shadowColor = '#ff1a2a'; X.shadowBlur = 26; X.fillStyle = `rgba(255,70,80,${.85 * fa})`; X.fillText(g, x, yy); X.shadowBlur = 0; X.fillStyle = `rgba(255,236,238,${fa})`; X.fillText(g, x, yy); x += w; }
      X.shadowBlur = 0; }
    else if (o.kind === 'tint') { X.globalAlpha = alpha * o.k; X.fillStyle = o.col; X.fillRect(0, 0, 1080, 1920); }
    else if (o.kind === 'iris') { const q = (o.p && scr(o.p)) || [540, 860]; const r = 2300 * E.eIn(o.k) + 6; X.globalAlpha = alpha; const g = X.createRadialGradient(q[0], q[1], r * .82, q[0], q[1], r);
      g.addColorStop(0, o.col); g.addColorStop(1, 'rgba(0,0,0,0)'); X.fillStyle = g; X.beginPath(); X.arc(q[0], q[1], r, 0, 7); X.fill(); }
    else if (o.kind === 'burn') { const k = o.k, g = X.createRadialGradient(540, 900, 300 + 700 * (1 - k), 540, 900, 1250); g.addColorStop(0, 'rgba(60,30,10,0)'); g.addColorStop(.6, `rgba(90,45,15,${.55 * k})`); g.addColorStop(.85, `rgba(30,12,4,${.9 * k})`); g.addColorStop(1, `rgba(10,4,0,${k})`);
      X.globalAlpha = alpha; X.fillStyle = g; X.fillRect(0, 0, 1080, 1920); X.globalCompositeOperation = 'multiply'; X.fillStyle = `rgba(255,214,160,${.6 * k})`; X.fillRect(0, 0, 1080, 1920); }
    else if (o.kind === 'rain') { /* v6.2 layered rain (refs: real rain reads in DEPTH): far = many fine slow faint streaks, mid, near = few long
         thick soft streaks moving fast (closer = faster on screen); a slight wind slant; each drop on its own speed (never a moving
         wallpaper); splash ticks + tiny rings on the lower part of the frame (the ground); the streaks pick up the scene colour. */
      const k = o.k; X.lineCap = 'round';
      for (const [n, len, wd, sp, al, slant, seed] of [[150, 34, 1.2, 1300, .32, .1, 9], [70, 70, 2.2, 1900, .42, .12, 19], [14, 150, 4.5, 2900, .28, .15, 29]]) {
        const r_ = E.rng(seed); X.strokeStyle = '#d8e4ff'; X.lineWidth = wd; X.globalAlpha = alpha * al * k; X.beginPath();
        for (let i = 0; i < n; i++) { const x0 = r_() * 1300 - 110, s = sp * (.8 + .4 * r_()), y = ((r_() * 2200 + o.t * s) % 2200) - 140, x = x0 - (y + 140) * slant; X.moveTo(x, y); X.lineTo(x - len * slant, y + len); }
        X.stroke(); }
      const r2 = E.rng(41); X.strokeStyle = '#e8eeff'; X.lineWidth = 1.6;
      for (let i = 0; i < 26; i++) { const x = r2() * 1080, y = 1250 + r2() * 640, ph = r2(), per = .35 + .3 * r2(), u = ((o.t / per + ph) % 1);   // splashes: a short crown then a ring that widens and fades
        X.globalAlpha = alpha * k * .5 * (1 - u); X.beginPath(); X.ellipse(x, y, 6 + 22 * u, (6 + 22 * u) * .3, 0, 0, 7); X.stroke();
        if (u < .25) { X.globalAlpha = alpha * k * .6 * (1 - u * 4); X.beginPath(); for (const d of [-1, -.4, .4, 1]) { X.moveTo(x, y); X.lineTo(x + d * 9 * (u * 4 + .3), y - 12 * Math.sin(Math.PI * (u * 4 + .2))); } X.stroke(); } }
      if (o.flash > 0) { X.globalAlpha = alpha * o.flash; X.fillStyle = '#eef3ff'; X.fillRect(0, 0, 1080, 1920); } }
    else if (o.kind === 'shock') { const q = scr(o.p); if (!q) { X.restore(); continue; } const k = o.k, r = 60 + 900 * o.size * E.eOut(k); X.globalAlpha = alpha * (1 - k);
      X.globalCompositeOperation = 'lighter'; X.strokeStyle = o.col; X.lineWidth = 46 * (1 - k) + 4; X.beginPath(); X.ellipse(q[0], q[1], r, r * .42, 0, 0, 7); X.stroke(); X.lineWidth = 10 * (1 - k) + 2; X.beginPath(); X.ellipse(q[0], q[1], r * .7, r * .3, 0, 0, 7); X.stroke(); }
    else if (o.kind === 'runes') { const q = scr(o.p); if (!q) { X.restore(); continue; } const r_ = E.rng(o.o.seed || 5), G = o.o.glyphs || 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ', n = o.o.n || 16, W_ = o.o.w || 360;
      X.globalCompositeOperation = 'lighter'; X.textAlign = 'center'; X.textBaseline = 'middle'; X.shadowColor = o.o.col || '#ff3a5a'; X.shadowBlur = 24; X.fillStyle = o.o.col2 || '#ffd0e0';
      for (let i = 0; i < n; i++) { const ph = (o.t * (.25 + r_() * .2) + r_()) % 1, x = q[0] + (r_() - .5) * W_ * (1 + ph * .4), y = q[1] - ph * (o.o.h || 520), a = Math.sin(ph * Math.PI) * o.k;
        X.globalAlpha = alpha * a; X.font = `700 ${Math.round(46 + r_() * 30)}px serif`; X.fillText(G[Math.floor(r_() * G.length)], x, y); } X.shadowBlur = 0; }
    else if (o.kind === 'beam') { const a = scr(o.p), b = scr(o.p2); if (!a || !b) { X.restore(); continue; } const r_ = E.rng(Math.floor(o.t * 24)); X.globalCompositeOperation = 'lighter'; X.lineCap = 'round';
      for (const [w, c, al] of [[60, o.col, .25], [26, o.col, .6], [9, '#ffffff', .95]]) { X.globalAlpha = alpha * al * o.k; X.strokeStyle = c; X.lineWidth = w; X.beginPath(); X.moveTo(a[0], a[1]);
        for (let s = 1; s <= 8; s++) { const u = s / 8, j = s < 8 ? (r_() - .5) * 26 : 0; X.lineTo(a[0] + (b[0] - a[0]) * u + j, a[1] + (b[1] - a[1]) * u + j); } X.stroke(); }
      X.globalAlpha = alpha * o.k; const g = X.createRadialGradient(b[0], b[1], 0, b[0], b[1], 110); g.addColorStop(0, '#ffffff'); g.addColorStop(.3, o.col); g.addColorStop(1, 'rgba(0,0,0,0)'); X.fillStyle = g; X.beginPath(); X.arc(b[0], b[1], 110, 0, 7); X.fill(); }
    X.restore(); } }
function speedLines(f) { // manga focus lines toward the shocked face, fading out
  const a = (1 - E.sstep(.35, .75, f.lt)) * E.sstep(0, .06, f.lt) * Math.min(1, FXL * 1.3); if (a <= 0 || FXL < .25) return; const r = E.rng(Math.floor(f.lt * 12) + 7);
  X.save(); X.globalAlpha = a * .85; X.fillStyle = '#ffffff'; X.strokeStyle = 'rgba(20,16,24,.55)'; X.lineWidth = 2;
  for (let i = 0; i < 46; i++) { const an = (i / 46) * Math.PI * 2 + r() * .12, w = .006 + r() * .012, R0 = 330 + r() * 160, R1 = 1700;
    X.beginPath(); X.moveTo(f.x + Math.cos(an) * R0, f.y + Math.sin(an) * R0); X.lineTo(f.x + Math.cos(an - w) * R1, f.y + Math.sin(an - w) * R1); X.lineTo(f.x + Math.cos(an + w) * R1, f.y + Math.sin(an + w) * R1); X.closePath(); X.fill(); X.stroke(); }
  X.restore(); }
function sweep(k) { // soft warm light sweep across the frame (k 0..1)
  X.save(); X.globalCompositeOperation = 'screen'; const x = -700 + k * 2500; const g = X.createLinearGradient(x - 500, 0, x + 500, 400);
  g.addColorStop(0, 'rgba(255,240,215,0)'); g.addColorStop(.5, `rgba(255,240,215,${.75 * Math.sin(Math.PI * k)})`); g.addColorStop(1, 'rgba(255,240,215,0)'); X.fillStyle = g; X.fillRect(0, 0, 1080, 1920); X.restore(); }
// v4.13 viral captions: each word pops in (overshoot), *word* or numbers are highlighted yellow (project.json captions: { pop, hi, y, size })
const CAP = { style: 'story', pop: false, highlight: false, hi: '#ffd23f', hiStyle: 'color', y: 1250, size: 70, maxW: 860, words: 2, ...(project.captions || {}) }; // v4.16 RicksClips study: plain white 1-2 word captions, no pop/colour by default
// v4.14 one knob for all automatic effects (0 = clean .. 1 = loud); default .7 keeps it lively but uncluttered
const FXL = Math.max(0, Math.min(1, project.fxLevel ?? .7)); E.POST.grain = .025 * FXL;
// seamless loop: the last LOOP_D seconds dissolve into the opening frame so replays feel continuous (project.loop = false to end on black)
const LOOP = project.loop === true, LOOP_D = .45; let ZP = 1; // story channels: off by default (stories end); opt in for short gag clips
// a caption chunk with more than CAP.words space-separated words is split into 1-2 word pieces, timed by text length
function capSlice(c, t) { const w = c[2].split(/\s+/).filter(Boolean); if (w.length <= CAP.words) return c; const parts = []; for (let i = 0; i < w.length; i += CAP.words) parts.push(w.slice(i, i + CAP.words).join(' '));
  const L = parts.reduce((a, p) => a + p.length, 0); let t0 = c[0]; for (const p of parts) { const t1 = t0 + (c[1] - c[0]) * p.length / L; if (t < t1) return [t0, t1, p]; t0 = t1; } return [t0, c[1], parts[parts.length - 1]]; }
// v7.1 TEXT SYSTEM (user refs: safe zones, keyword highlight, subtle per-chunk animation, documentary labels, typewriter).
// project.json captions: { style: 'story' (default) | 'classic', y, size, hi, hiStyle: 'color' | 'pill', anim: 'pop' | 'slide' | 'fade' | 'none' }
// markers inside a caption: *word* = highlight, ~text~ = whisper (smaller, softer), ^text^ = shout (bigger, a short shake);
// project.hiWords = words always highlighted (names, powers, numbers are automatic).
// SAFE ZONE (TikTok / Reels / Shorts UI): keep text inside x 60..900, y 230..1440; captions never go below 1440.
const SAFE = { x0: 60, x1: 900, y0: 230, y1: 1440 }; const CAPX = (SAFE.x0 + SAFE.x1) / 2; const CAPPOS = new Map();
function capSegs(txt) { const hw = project.hiWords || []; const out = []; let rest = txt;
  rest.split(/(\*[^*]+\*)/).forEach(p => { if (!p) return; if (p[0] === '*') { out.push([p.slice(1, -1), 1]); return; }
    let parts = [[p, 0]]; for (const w of hw) parts = parts.flatMap(([q, h]) => h ? [[q, h]] : q.split(w).flatMap((x, i, A) => i < A.length - 1 ? [[x, 0], [w, 1]] : [[x, 0]]));
    parts.forEach(([q, h]) => { if (!q) return; if (!h) q.split(/([0-9๐-๙][0-9๐-๙,.%]*)/).forEach((x, i) => x && out.push([x, i % 2])); else out.push([q, 1]); }); });
  return out; }
function capY(sh, size) { // pick the caption line for this shot once: the first candidate whose box clears every visible face
  if (globalThis.CAP_Y) return globalThis.CAP_Y; const key = sh ? sh.id : '-'; if (CAPPOS.has(key)) return CAPPOS.get(key);
  const cands = [CAP.y, CAP.y - 190, CAP.y + 90, CAP.y - 380].filter(y => y > SAFE.y0 + 200 && y < SAFE.y1); let pick = cands[0];
  const heads = []; Object.values(CHARS).forEach(C => { if (!C.g.visible) return; const B = headBall(C); if (!B) return; const q = B.c.clone().project(E.camera), q2 = B.c.clone().addScaledVector(B.up, B.r * 1.15).project(E.camera);
    if (q.z > 1) return; const x = (q.x + 1) * 540, y = (1 - q.y) * 960, r = Math.abs((1 - q2.y) * 960 - y); if (r > 30) heads.push([x, y, r]); });
  for (const y of cands) { const hit = heads.some(([hx, hy, r]) => Math.abs(hx - CAPX) < 330 + r && hy + r * .9 > y - size * 1.1 && hy - r * .6 < y + size * .4); if (!hit) { pick = y; break; } }
  CAPPOS.set(key, pick); return pick; }
function caption(t, sh) {
  const c0 = timing.caps.find(c => t >= c[0] && t < c[1]); if (!c0) return; const c = capSlice(c0, t);
  if (CAP.style === 'classic') return captionClassic(t, c);
  let txt = c[2], mode = 0; if (/^~.*~$/.test(txt)) { mode = 1; txt = txt.slice(1, -1); } else if (/^\^.*\^$/.test(txt)) { mode = 2; txt = txt.slice(1, -1); }
  const segs = capSegs(txt.replace(/[~^]/g, '')), size = CAP.size * (mode === 1 ? .78 : mode === 2 ? 1.22 : 1), a = t - c[0], an = CAP.anim || 'pop';
  const k = an === 'pop' ? .86 + .14 * E.eOut(Math.min(1, a / .13)) + .025 * Math.sin(Math.PI * Math.min(1, a / .2)) : 1, al = an === 'none' ? 1 : Math.min(1, a / .1);
  const dy = an === 'pop' || an === 'slide' ? 16 * (1 - E.eOut(Math.min(1, a / .16))) : 0, dx = an === 'slide' ? -30 * (1 - E.eOut(Math.min(1, a / .18))) : 0;
  const y = capY(sh, size); X.save(); X.globalAlpha = al * (mode === 1 ? .82 : 1); X.translate(CAPX + dx + (mode === 2 ? 5 * Math.sin(a * 70) * Math.exp(-a * 9) : 0), y + dy); X.scale(k, k);
  if (mode === 1) X.transform(1, 0, -.12, 1, 0, 0);
  X.font = `700 ${size}px Prompt`; X.textBaseline = 'alphabetic'; X.lineJoin = 'round'; X.textAlign = 'left';
  const W = segs.reduce((s_, [q]) => s_ + X.measureText(q).width, 0), sc = Math.min(1, (SAFE.x1 - SAFE.x0 - 40) / Math.max(1, W)); X.scale(sc, sc); let x = -W / 2;
  for (const [q, h] of segs) { const w = X.measureText(q).width;
    if (h && CAP.hiStyle === 'pill') { X.fillStyle = CAP.hi; X.beginPath(); X.roundRect(x - 12, -size * .86, w + 24, size * 1.12, size * .3); X.fill(); }
    X.shadowColor = 'rgba(0,0,0,.45)'; X.shadowBlur = 10; X.shadowOffsetY = 5; X.lineWidth = size * .19; X.strokeStyle = '#141018';
    if (!(h && CAP.hiStyle === 'pill')) X.strokeText(q, x, 0); X.shadowColor = 'transparent';
    X.fillStyle = h ? (CAP.hiStyle === 'pill' ? '#141018' : CAP.hi) : '#ffffff'; X.fillText(q, x, 0); x += w; }
  X.restore(); globalThis.CAP_Y = null; }
// labels (project.json labels: [{ t, dur, text, sub, kind: 'place' | 'name' | 'type' }]):
//  place = documentary location/time card top-left (thin bar wipes in, text slides); name = a character's name + role,
//  left side mid-height (first appearance only); type = phone/system message typed out at ~18 chars/s with a cursor.
function labels(t) { for (const L of project.labels || []) { const a = t - L.t, d = L.dur ?? 2.4; if (a < 0 || a > d) continue;
  const inn = E.eOut(Math.min(1, a / .3)), out = 1 - E.sstep(d - .3, d, a); X.save(); X.globalAlpha = out; X.textBaseline = 'middle'; X.lineJoin = 'round';
  if (L.kind === 'type') { const n = Math.floor(Math.max(0, a - .15) * (L.cps ?? 18)), s_ = [...L.text].slice(0, n).join(''), cur = Math.floor(a * 3) % 2 ? '' : '▍';
    X.font = '600 52px Prompt'; const w = Math.min(820, Math.max(320, X.measureText(L.text).width + 70)), y = L.y ?? 520; X.fillStyle = 'rgba(16,14,30,.82)'; X.strokeStyle = '#7fd1ff'; X.lineWidth = 3;
    X.beginPath(); X.roundRect(CAPX - w / 2, y - 50, w, 100, 22); X.fill(); X.stroke(); X.fillStyle = '#eaf6ff'; X.textAlign = 'left'; X.fillText(s_ + cur, CAPX - w / 2 + 34, y + 2, w - 60); }
  else if (L.kind === 'name') { const y = L.y ?? 1060, x0 = SAFE.x0 + 10 - 60 * (1 - inn); X.globalAlpha = out * inn; X.fillStyle = L.col || '#ffd23f'; X.fillRect(x0, y - 44, 10, 88 * inn);
    X.textAlign = 'left'; X.font = '700 60px Prompt'; X.lineWidth = 10; X.strokeStyle = '#141018'; X.strokeText(L.text, x0 + 28, y - 12); X.fillStyle = '#ffffff'; X.fillText(L.text, x0 + 28, y - 12);
    if (L.sub) { X.font = '600 36px Prompt'; X.lineWidth = 7; X.strokeText(L.sub, x0 + 30, y + 34); X.fillStyle = L.col || '#ffd23f'; X.fillText(L.sub, x0 + 30, y + 34); } }
  else { const y = L.y ?? 300, x0 = SAFE.x0 + 10; X.fillStyle = 'rgba(255,255,255,.9)'; X.fillRect(x0, y + 38, 260 * inn, 4);
    X.globalAlpha = out * inn; X.textAlign = 'left'; X.font = '700 46px Prompt'; X.lineWidth = 8; X.strokeStyle = 'rgba(10,8,20,.9)'; X.strokeText(L.text, x0 + 30 * (1 - inn), y); X.fillStyle = '#ffffff'; X.fillText(L.text, x0 + 30 * (1 - inn), y);
    if (L.sub) { X.font = '500 34px Prompt'; X.lineWidth = 6; X.strokeText(L.sub, x0, y + 78); X.fillStyle = '#d8d0f0'; X.fillText(L.sub, x0, y + 78); } }
  X.restore(); } }
function captionClassic(t, c) {
  let txt = c[2]; const star = /\*(.+?)\*/.test(txt), hi = CAP.highlight && (star || /[0-9๐-๙]/.test(txt) || (project.hiWords || []).some(w => txt.includes(w))); txt = txt.replace(/\*/g, '');
  const a = t - c[0], k = CAP.pop ? (a < .16 ? .55 + .45 * E.eOut(a / .16) + .12 * Math.sin(Math.PI * Math.min(1, a / .16)) : 1) : 1;
  X.save(); X.translate(520, CAP.y); X.scale(k, k); /* safe zone: a touch left of the app's right-hand buttons */ X.rotate(hi && CAP.pop ? Math.sin(a * 18) * .025 * Math.exp(-a * 6) : 0);
  X.font = `700 ${CAP.size * (hi ? 1.12 : 1)}px Prompt`; X.textAlign = 'center'; X.textBaseline = 'alphabetic'; X.lineJoin = 'round';
  X.shadowColor = 'rgba(0,0,0,.45)'; X.shadowBlur = 10; X.shadowOffsetY = 5; X.lineWidth = 13; X.strokeStyle = '#141018'; X.strokeText(txt, 0, 0, CAP.maxW);
  X.shadowColor = 'transparent'; X.fillStyle = hi ? CAP.hi : '#ffffff'; X.fillText(txt, 0, 0, CAP.maxW); X.restore();
}
// v4.13 hook banner for the first seconds (project.json hook: { text, sub, dur }) and an optional progress bar (project.json progressBar: true)
function hook(t) { const H = project.hook; if (!H || !H.text) return; const d = H.dur ?? 2.6; if (t > d) return;
  const a = E.eOut(Math.min(1, t / .25)), out = 1 - E.sstep(d - .3, d, t), k = (.6 + .4 * a + .06 * Math.sin(Math.min(1, t / .25) * Math.PI)) * (1 - .15 * (1 - out));
  X.save(); X.globalAlpha = out; X.translate(540, 300); X.scale(k, k); X.rotate(-.03 + Math.sin(t * 3) * .01);
  X.font = '700 78px Prompt'; const w = Math.min(980, X.measureText(H.text).width + 80), h = H.sub ? 190 : 130;
  X.fillStyle = '#ffd23f'; X.strokeStyle = '#141018'; X.lineWidth = 10; X.beginPath(); X.roundRect(-w / 2, -h / 2, w, h, 28); X.fill(); X.stroke();
  X.fillStyle = '#141018'; X.textAlign = 'center'; X.textBaseline = 'middle'; X.fillText(H.text, 0, H.sub ? -28 : 4, 940);
  if (H.sub) { X.font = '600 46px Prompt'; X.fillText(H.sub, 0, 46, 920); } X.restore(); }
// v4.15 series end card for story channels (project.json endCard: { text: 'ติดตามตอนต่อไป', sub: 'ตอนที่ 4: ...', dur: 1.6 }):
// the last seconds dim a little and a clean title card slides up; then the usual fade to black
function endCard(t) { const E_ = project.endCard; if (!E_ || LOOP) return; const d = E_.dur ?? 1.6, t0 = timing.end - d - .25; if (t < t0) return;
  const a = E.eOut(Math.min(1, (t - t0) / .35)); X.save(); X.fillStyle = `rgba(10,8,20,${.42 * a})`; X.fillRect(0, 0, 1080, 1920);
  X.globalAlpha = a; X.translate(540, (E_.y ?? 900) + 40 * (1 - a)); X.textAlign = 'center'; X.textBaseline = 'middle'; X.lineJoin = 'round'; /* mid-screen: never collides with the caption line */
  X.font = '700 80px Prompt'; X.lineWidth = 14; X.strokeStyle = '#141018'; X.strokeText(E_.text || 'ติดตามตอนต่อไป', 0, 0, 900); X.fillStyle = '#ffffff'; X.fillText(E_.text || 'ติดตามตอนต่อไป', 0, 0, 900);
  if (E_.sub) { X.font = '600 50px Prompt'; X.lineWidth = 10; X.strokeText(E_.sub, 0, 90, 900); X.fillStyle = '#ffd23f'; X.fillText(E_.sub, 0, 90, 900); } X.restore(); }
function progress(t) { if (!project.progressBar) return; const u = Math.min(1, t / timing.end); X.save(); if (LOOP) X.globalAlpha = 1 - E.sstep(timing.end - LOOP_D, timing.end - .05, t); X.fillStyle = 'rgba(255,255,255,.18)'; X.fillRect(0, 1906, 1080, 14); X.fillStyle = '#ffd23f'; X.fillRect(0, 1906, 1080 * u, 14); X.restore(); }
const DIS = .28, WH = .22, BLR = .4;
function keyZoom(t) { if (!project.keyZoom) return 1; const c = timing.caps.find(c => t >= c[0] && t < c[1]); if (!c) return 1; const hi = /\*(.+?)\*/.test(c[2]) || /[0-9๐-๙]/.test(c[2]) || (project.hiWords || []).some(w => c[2].includes(w));
  const a = t - c[0]; return hi ? 1 + .028 * FXL * Math.sin(Math.PI * Math.min(1, a / .45)) : 1; } // gentle push-in on highlighted words

// v4.32 beat audit (tools/audit.js): per visible character -> in frame? blocked by someone nearer? head width as % of screen. + camera for jump-cut checks
window.audit = (t) => { window.frame(t, { nocap: true }); const cam = E.camera, out = { t, cam: cam.position.toArray(), dir: new E.THREE.Vector3(0, 0, -1).transformDirection(cam.matrixWorld).toArray(), chars: [] };
  const P = (v) => { const q = v.clone().project(cam); return [(q.x + 1) / 2, (1 - q.y) / 2, q.z]; }, boxes = [];
  for (const C of Object.values(CHARS)) { if (!C.sb || !C.sb.visible) continue; const B = headBall(C); if (!B) continue; const c = P(B.c), e = P(B.c.clone().addScaledVector(B.right, B.r));
    const r = Math.hypot(e[0] - c[0], (e[1] - c[1]) * 16 / 9), d = cam.position.distanceTo(B.c); const sb = C.sb, hw = sb.scale.x / 2, hh = sb.scale.y / 2;
    const R = new E.THREE.Vector3(1, 0, 0).applyQuaternion(sb.quaternion), U = new E.THREE.Vector3(0, 1, 0).applyQuaternion(sb.quaternion);
    const cs = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => P(sb.position.clone().addScaledVector(R, a * hw).addScaledVector(U, b * hh)));
    boxes.push({ id: C.spec.id, d, x0: Math.min(...cs.map(q => q[0])), x1: Math.max(...cs.map(q => q[0])), y0: Math.min(...cs.map(q => q[1]), c[1] - r), y1: Math.max(...cs.map(q => q[1])) });
    out.chars.push({ id: C.spec.id, x: c[0], y: c[1], r, d, view: C.view, inFrame: c[0] - r > -.02 && c[0] + r < 1.02 && c[1] - r * .5625 > -.02 && c[1] < 1 && c[2] < 1 }); }
  for (const h of out.chars) { h.headPct = +(h.r * 2 * 100).toFixed(1); h.blockedBy = boxes.filter(b => b.id !== h.id && b.d < h.d - .05 && h.x > b.x0 && h.x < b.x1 && h.y > b.y0 && h.y < b.y1).map(b => b.id); }
  return out; };
const frame1 = (t, opts = {}) => { ZP = keyZoom(t); globalThis.FRAME_T = t; // v4.24 shots can tell the frame being drawn from the smoothing look-backs
  let i = SHOTS.length - 1; for (let k = 0; k < SHOTS.length; k++) if (t < SHOTS[k].t1) { i = k; break; }
  const sh = SHOTS[i], lt = t - sh.t0;
  const nx0 = SHOTS[i + 1], dir = i % 2 ? 1 : -1;
  const bIn = sh.tr === 'whip' && lt < WH ? 1 - lt / WH : 0, bOut = nx0 && nx0.tr === 'whip' && nx0.t0 - t < .12 ? 1 - (nx0.t0 - t) / .12 : 0;
  const PUSHD = .34, FGW = .42; // v7.2 documentary-ref transitions: 'push' (new shot shoves the old one off: o.dir L/R/U/D) and 'fgwipe' (a dark foreground shape crosses the lens, the cut hides behind it)
  if (i > 0 && sh.tr === 'push' && lt < PUSHD) { const k = E.eIO(lt / PUSHD), d = sh.dir || 'L', v = { L: [1080, 0], R: [-1080, 0], U: [0, 1920], D: [0, -1920] }[d], m = Math.sin(Math.PI * k) * .9, hz = d === 'L' || d === 'R';
    OFF[0] = -k * v[0]; OFF[1] = -k * v[1]; draw(SHOTS[i - 1], t, 1, hz ? m : 0, -Math.sign(v[0] || 1)); OFF[0] = (1 - k) * v[0]; OFF[1] = (1 - k) * v[1]; draw(sh, t, 1, hz ? m : 0, -Math.sign(v[0] || 1)); OFF[0] = OFF[1] = 0; }
  else if (i > 0 && sh.tr === 'fgwipe' && lt < FGW) { const k = lt / FGW; draw(k < .5 ? SHOTS[i - 1] : sh, t);
    const x = 1500 - k * 3000; X.save(); const g = X.createLinearGradient(x - 900, 0, x + 900, 0); g.addColorStop(0, 'rgba(8,6,14,0)'); g.addColorStop(.3, 'rgba(8,6,14,.97)'); g.addColorStop(.7, 'rgba(8,6,14,.97)'); g.addColorStop(1, 'rgba(8,6,14,0)'); X.fillStyle = g; X.fillRect(x - 900, 0, 1800, 1920); X.restore(); }
  else if (i > 0 && sh.tr === 'blur' && lt < BLR) { const k = E.eSine(lt / BLR), m = Math.sin(Math.PI * k) * .9; draw(SHOTS[i - 1], t, 1, m, dir); draw(sh, t, k, m, dir); } // v4.29 motion-blur dissolve (refs): both shots smear along the move while they cross
  else if (i > 0 && (sh.tr === 'dis' || sh.tr === 'sweep') && lt < DIS) { draw(SHOTS[i - 1], t); draw(sh, t, E.eSine(lt / DIS)); }
  else if (i > 0 && sh.tr === 'whip' && lt < .1) { draw(SHOTS[i - 1], t, 1, 1, -dir); draw(sh, t, lt / .1, bIn, dir); }
  else draw(sh, t, 1, Math.max(bIn, bOut), bOut > bIn ? -dir : dir);
  bloom();
  if (sh.tr === 'sweep' && lt < .45) sweep(lt / .45); const nx = SHOTS[i + 1]; if (nx && nx.tr === 'sweep' && nx.t0 - t < .2) sweep((t - (nx.t0 - .2)) / .45);
  if (LOOP && t > timing.end - LOOP_D) { const k = E.eSine((t - (timing.end - LOOP_D)) / LOOP_D); ZP = 1; draw(SHOTS[0], 0, k); }
  if (!opts.nocap) { caption(t, sh); labels(t); hook(t); endCard(t); } progress(t);
  if (!LOOP && t > timing.end - .25) { X.fillStyle = `rgba(0,0,0,${E.clamp((t - (timing.end - .25)) / .25)})`; X.fillRect(0, 0, 1080, 1920); } /* fade to black last */
};
/* v5.3 real shutter motion blur: average n sub-frames spread over SHUTTER_ANGLE of the frame (180 deg = half a frame),
   like a film camera. Everything blurs by its own true motion (particles, limbs, camera). Per shot: shutter: 3, or
   window.SHUTTER = n for the whole clip. Sub-frame times stay monotonic, so look-back smoothing is unaffected. */
let ACC = null, ACX = null;
window.frame = (t, opts = {}) => {
  let i = SHOTS.length - 1; for (let k = 0; k < SHOTS.length; k++) if (t < SHOTS[k].t1) { i = k; break; }
  const n = opts.shutter ?? SHOTS[i].shutter ?? globalThis.SHUTTER ?? 1;
  if (!(n > 1)) { frame1(t, opts); return out.toDataURL('image/jpeg', .92); }
  if (!ACC) { ACC = document.createElement('canvas'); ACC.width = 1080; ACC.height = 1920; ACX = ACC.getContext('2d'); }
  const ang = (globalThis.SHUTTER_ANGLE ?? 180) / 360;
  for (let k = 0; k < n; k++) { frame1(t + (k / (n - 1) - .5) * ang / 30, opts); ACX.globalAlpha = 1 / (k + 1); ACX.drawImage(out, 0, 0); }
  ACX.globalAlpha = 1; X.drawImage(ACC, 0, 0); return out.toDataURL('image/jpeg', .92);
};
window.cover = (o = {}) => { reset0(); COVER.fn(0, 57.5, o); updateSprites(E.camera); Wd.updateSky(57.5); E.render(); X.drawImage(E.glc, 0, 0); bloom(); return out.toDataURL('image/jpeg', .95); };
window.bench = (o = {}) => { reset0(); BENCH.fn(0, 20, o); updateSprites(E.camera); Wd.updateSky(20); E.render(); X.drawImage(E.glc, 0, 0); bloom(); return out.toDataURL('image/jpeg', .95); };
const reset0 = () => runShot({ t0: 0, fn: () => { } }, 57.5);

// refsheet (2D asset style refs): faceless, limbless head + costume on flat chroma green, one char per call
const RSPEC = {
  C01: { id: 'r1', shirt: '#24418a', stripe: '#f6f2e8', hat: 'beanie', hatC: '#e0453a', hatC2: '#b8322c', pomC: '#f6f2e8', s: .6, belt: '#6a4226' },
  C02: { id: 'r2', shirt: '#a0522d', hat: 'knit', hatC: '#4a4a58', hatC2: '#33333f', s: .64, belly: 1.14 },
  C03: { id: 'r3', shirt: '#26346e', hat: 'bicorne', coat: true, s: .68, belly: 1.2 },
  C04: { id: 'r4', shirt: '#e8b040', hat: 'bandana', hatC: '#d8483e', s: .6, belly: 1.12 },
  C05: { id: 'r5', shirt: '#6fa6dc', hat: 'straw', hatC: '#8a3a2a', s: .61, belly: .94 },
  C06: { id: 'r6', shirt: '#9a62aa', stripe: '#f3eaf6', hat: 'beanie', hatC: '#e8b84a', hatC2: '#c9952e', pomC: '#f6f2e8', s: .55 },
};
const RC = {}; let rsHidden = null;
window.refsheet = (o = {}) => {
  reset0();
  if (!rsHidden) { rsHidden = []; E.scene.children.forEach(c => { if (!c.isLight && c !== Wd.sky && c.visible) { c.visible = false; rsHidden.push(c); } }); }
  E.scene.children.forEach(c => { if (!c.isLight && c !== Wd.sky && !c.userData.rs) c.visible = false; });
  const G = o.bg || '#2db84a';
  Wd.applyLight('dusk', { top: G, mid: G, hor: G, glowAmt: 0, sunDir: [-.6, .7, 1], sunC: '#fff3e2', sunI: 2.3, hemiS: '#ffffff', hemiG: '#d9cfc2', hemiI: 2.4, fog: G, fogN: 900, fogF: 2500, stars: 0, moon: 0 });
  Object.values(RC).forEach(c => { c.g.visible = false; });
  const id = o.id || 'C01'; if (!RC[id]) { const c = makeChar(RSPEC[id]); c.g.userData.rs = true; E.scene.add(c.g); RC[id] = c; }
  const C = RC[id]; pose(C, { p: [0, 0, 0], ry: o.ry || 0, ex: 'neutral', head: [0, 0, 0] });
  C.g.userData.rs = true; C.g.visible = true; C.face.visible = false; C.sweat.visible = false;
  for (const L of [C.aL, C.aR, C.lL, C.lR]) { L.up.visible = false; L.fo.visible = false; }
  C.head.position.y = .88 + (o.gap ?? .17);
  const s = C.spec.s, cy = 1.9 * s; E.scene.updateMatrixWorld();
  Wd.setShadowFocus(0, cy, 0, 3);
  E.camera.position.set(0, cy + .05, 9); E.camera.fov = o.fov || 12.5; E.camera.updateProjectionMatrix(); E.camera.up.set(0, 1, 0); E.camera.lookAt(0, cy, 0);
  Object.assign(E.POST, { dof: 0, mblur: [0, 0], vig: 0, leak: 0, sat: 1.12, lift: 1.03, con: 1.04, focus: 9 });
  Wd.updateSky(0); E.render(); X.drawImage(E.glc, 0, 0); return out.toDataURL('image/png');
};
const LEGY = .95;
window.SHOTLIST = SHOTS.map(s => [s.id, s.t0, s.t1]);
window.ready = true;
