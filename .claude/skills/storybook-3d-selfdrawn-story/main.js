// main.js: frame(t) -> JPEG data URL (1080x1920): shots + transitions + one-word captions
import * as E from './engine.js';
import * as Wd from './world.js';
import { makeCast, makeChar, pose, CHARS, loadSprites, updateSprites, SPRG, ANIM, OVL, applySmooth, attachHeld } from './chars.js';
import { SHOTS, initShots, runShot, COVER, BENCH } from './shots.js';
const timing = await (await fetch('timing.json')).json(), project = await (await fetch('project.json')).json();
await E.fontsReady; await loadSprites(project.cast); E.scene.add(SPRG); makeCast(project.cast); initShots(timing); Wd.redrawSign();
const out = document.getElementById('out'), X = out.getContext('2d');
const BL = document.createElement('canvas'); BL.width = 270; BL.height = 480; const BX = BL.getContext('2d');
function bloom(a = .24) { BX.filter = 'brightness(.9) contrast(3.4) saturate(1.3) blur(7px)'; BX.drawImage(out, 0, 0, 270, 480); BX.filter = 'none'; X.save(); X.globalCompositeOperation = 'screen'; X.globalAlpha = a; X.drawImage(BL, 0, 0, 1080, 1920); X.restore(); }
// v4 auto-cinematics (no effect on story/staging): shallow focus on the nearest character, shock speed lines + zoom punch
const _hv = new E.THREE.Vector3(), _cv = new E.THREE.Vector3();
function nearestHead() { let best = null; E.camera.getWorldPosition(_cv); const fw = new E.THREE.Vector3(0, 0, -1).transformDirection(E.camera.matrixWorld);
  for (const C of Object.values(CHARS)) { let r = C.g, vis = true; while (r) { if (!r.visible) { vis = false; break; } r = r.parent; } if (!vis || !C.g.parent) continue;
    C.head.getWorldPosition(_hv); const d = _hv.clone().sub(_cv), z = d.dot(fw); if (z < .3) continue; const sp = _hv.clone().project(E.camera); if (Math.abs(sp.x) > .85 || sp.y > .95 || sp.y < -.9) continue;
    if (!best || z < best.z) best = { C, z, sx: (sp.x + 1) * 540, sy: (1 - sp.y) * 960 }; } return best; }
let FX = null;
function camDrift(t) { E.camera.rotateX(E.noise1(t * .33 + 11) * .0045); E.camera.rotateY(E.noise1(t * .27 + 47) * .006); E.camera.updateMatrixWorld(); }
function draw(sh, t, alpha = 1, mb = 0, dir = 1) { OVL.length = 0; E.POST.gseed = Math.floor(t * 12) % 97; E.POST.dof = 0; E.POST.mblur = [mb * 90 * dir, mb * 14]; E.POST.leakPh = t * .6;
  // v4 motion smoothing: evaluate the shot 5..1 frames back (no render) and blend character poses -> no 1-frame snaps
  const SW = [.05, .08, .12, .17, .23], lt0 = t - sh.t0; Object.values(CHARS).forEach(C => { C._acc = null; C._trail = []; C._roots = []; });
  let prevCam = null;
  if (!window.NOSMOOTH) for (let k = 5; k >= 1; k--) { const tk = t - k / 30; if (tk - sh.t0 < 0) continue; ANIM.rec = SW[5 - k]; ANIM.t = tk; runShot(sh, tk); if (k === 1) { if (!window.NOAUTO) camDrift(tk); E.camera.updateMatrixWorld(); prevCam = { m: E.camera.matrixWorldInverse.clone(), pm: E.camera.projectionMatrix.clone() }; } }
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
  if (!(FX && FX.lt < .32) && ZP > 1.0005) { X.drawImage(E.glc, 540 * (1 - ZP), 860 * (1 - ZP), 1080 * ZP, 1920 * ZP); } else
  if (FX && FX.lt < .32) { const k = 1 + .07 * (1 - E.eOut(FX.lt / .32)); X.drawImage(E.glc, FX.x * (1 - k), FX.y * (1 - k), 1080 * k, 1920 * k); } else X.drawImage(E.glc, 0, 0);
  X.globalAlpha = 1; if (FX) speedLines(FX); overlays(t, alpha); }
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
    if (o.kind === 'gloom') { const C = o.C; C.head.updateWorldMatrix(true, false); const hp = C.head.getWorldPosition(new E.THREE.Vector3()), q = scr(hp); if (!q) { X.restore(); continue; }
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
        const w = new E.THREE.Vector3(o.p.x + Math.cos(th) * v * spread * k * (O.size || 1), o.p.y + (up * spread * .55 * k + (O.rise ?? .35) * a) * (O.size || 1), o.p.z + Math.sin(th) * v * spread * .6 * k * (O.size || 1));
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
const CAP = { pop: false, highlight: false, hi: '#ffd23f', y: 1350, size: 70, maxW: 860, words: 2, ...(project.captions || {}) }; // v4.16 RicksClips study: plain white 1-2 word captions, no pop/colour by default
// v4.14 one knob for all automatic effects (0 = clean .. 1 = loud); default .7 keeps it lively but uncluttered
const FXL = Math.max(0, Math.min(1, project.fxLevel ?? .7)); E.POST.grain = .025 * FXL;
// seamless loop: the last LOOP_D seconds dissolve into the opening frame so replays feel continuous (project.loop = false to end on black)
const LOOP = project.loop === true, LOOP_D = .45; let ZP = 1; // story channels: off by default (stories end); opt in for short gag clips
// a caption chunk with more than CAP.words space-separated words is split into 1-2 word pieces, timed by text length
function capSlice(c, t) { const w = c[2].split(/\s+/).filter(Boolean); if (w.length <= CAP.words) return c; const parts = []; for (let i = 0; i < w.length; i += CAP.words) parts.push(w.slice(i, i + CAP.words).join(' '));
  const L = parts.reduce((a, p) => a + p.length, 0); let t0 = c[0]; for (const p of parts) { const t1 = t0 + (c[1] - c[0]) * p.length / L; if (t < t1) return [t0, t1, p]; t0 = t1; } return [t0, c[1], parts[parts.length - 1]]; }
function caption(t) {
  const c0 = timing.caps.find(c => t >= c[0] && t < c[1]); if (!c0) return; const c = capSlice(c0, t);
  let txt = c[2]; const star = /\*(.+?)\*/.test(txt), hi = CAP.highlight && (star || /[0-9๐-๙]/.test(txt) || (project.hiWords || []).some(w => txt.includes(w))); txt = txt.replace(/\*/g, '');
  const a = t - c[0], k = CAP.pop ? (a < .16 ? .55 + .45 * E.eOut(a / .16) + .12 * Math.sin(Math.PI * Math.min(1, a / .16)) : 1) : 1;
  X.save(); X.translate(520, CAP.y); X.scale(k, k); // safe zone: a touch left of the app's right-hand buttons X.rotate(hi && CAP.pop ? Math.sin(a * 18) * .025 * Math.exp(-a * 6) : 0);
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
  X.globalAlpha = a; X.translate(540, (E_.y ?? 900) + 40 * (1 - a)); // mid-screen: never collides with the caption line X.textAlign = 'center'; X.textBaseline = 'middle'; X.lineJoin = 'round';
  X.font = '700 80px Prompt'; X.lineWidth = 14; X.strokeStyle = '#141018'; X.strokeText(E_.text || 'ติดตามตอนต่อไป', 0, 0, 900); X.fillStyle = '#ffffff'; X.fillText(E_.text || 'ติดตามตอนต่อไป', 0, 0, 900);
  if (E_.sub) { X.font = '600 50px Prompt'; X.lineWidth = 10; X.strokeText(E_.sub, 0, 90, 900); X.fillStyle = '#ffd23f'; X.fillText(E_.sub, 0, 90, 900); } X.restore(); }
function progress(t) { if (!project.progressBar) return; const u = Math.min(1, t / timing.end); X.save(); if (LOOP) X.globalAlpha = 1 - E.sstep(timing.end - LOOP_D, timing.end - .05, t); X.fillStyle = 'rgba(255,255,255,.18)'; X.fillRect(0, 1906, 1080, 14); X.fillStyle = '#ffd23f'; X.fillRect(0, 1906, 1080 * u, 14); X.restore(); }
const DIS = .28, WH = .22;
function keyZoom(t) { if (!project.keyZoom) return 1; const c = timing.caps.find(c => t >= c[0] && t < c[1]); if (!c) return 1; const hi = /\*(.+?)\*/.test(c[2]) || /[0-9๐-๙]/.test(c[2]) || (project.hiWords || []).some(w => c[2].includes(w));
  const a = t - c[0]; return hi ? 1 + .028 * FXL * Math.sin(Math.PI * Math.min(1, a / .45)) : 1; } // gentle push-in on highlighted words
window.frame = (t, opts = {}) => { ZP = keyZoom(t); globalThis.FRAME_T = t; // v4.24 shots can tell the frame being drawn from the smoothing look-backs
  let i = SHOTS.length - 1; for (let k = 0; k < SHOTS.length; k++) if (t < SHOTS[k].t1) { i = k; break; }
  const sh = SHOTS[i], lt = t - sh.t0;
  const nx0 = SHOTS[i + 1], dir = i % 2 ? 1 : -1;
  const bIn = sh.tr === 'whip' && lt < WH ? 1 - lt / WH : 0, bOut = nx0 && nx0.tr === 'whip' && nx0.t0 - t < .12 ? 1 - (nx0.t0 - t) / .12 : 0;
  if (i > 0 && (sh.tr === 'dis' || sh.tr === 'sweep') && lt < DIS) { draw(SHOTS[i - 1], t); draw(sh, t, E.eSine(lt / DIS)); }
  else if (i > 0 && sh.tr === 'whip' && lt < .1) { draw(SHOTS[i - 1], t, 1, 1, -dir); draw(sh, t, lt / .1, bIn, dir); }
  else draw(sh, t, 1, Math.max(bIn, bOut), bOut > bIn ? -dir : dir);
  bloom();
  if (sh.tr === 'sweep' && lt < .45) sweep(lt / .45); const nx = SHOTS[i + 1]; if (nx && nx.tr === 'sweep' && nx.t0 - t < .2) sweep((t - (nx.t0 - .2)) / .45);
  if (LOOP && t > timing.end - LOOP_D) { const k = E.eSine((t - (timing.end - LOOP_D)) / LOOP_D); ZP = 1; draw(SHOTS[0], 0, k); }
  if (!opts.nocap) { caption(t); hook(t); endCard(t); } progress(t);
  if (!LOOP && t > timing.end - .25) { X.fillStyle = `rgba(0,0,0,${E.clamp((t - (timing.end - .25)) / .25)})`; X.fillRect(0, 0, 1080, 1920); } // fade to black last
  return out.toDataURL('image/jpeg', .92);
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
