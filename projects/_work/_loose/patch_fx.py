import sys; K=sys.argv[1]; p=K+'/main.js'; s=open(p).read()
a="    else if (o.kind === 'spark') {"
b="""    else if (o.kind === 'debris') { const O = o.o, r_ = E.rng((O.seed || 1) * 977), n = O.n || 18, sp = O.speed || 6, g = O.grav ?? 9.8, kind = O.kind || 'rock', age = o.age, life = O.life ?? 2.2;
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
    else if (o.kind === 'smoke') { const O = o.o, r_ = E.rng((O.seed || 1) * 131), n = O.n || 9, age = o.age, life = O.life ?? 2.6, base = scr(o.p); if (!base) { X.restore(); continue; }
      const d = E.camera.position.distanceTo(o.p), S0 = (O.size || 1) * 900 / Math.max(.5, d), grow = E.eOut(Math.min(1, age / .55)), shrink = 1 - E.sstep(life * .45, life, age), col = O.col || '#e9dcc0';
      const puffs = []; for (let i = 0; i < n; i++) { const a = r_() * Math.PI * 2, rr = r_(); puffs.push([Math.cos(a) * rr * .9, -Math.abs(Math.sin(a)) * rr * .6 - (O.rise ?? .25) * age, .35 + .4 * r_()]); }
      puffs.sort((A, B) => A[1] - B[1]); X.globalAlpha = alpha;
      const at = ([px, py, pr]) => [base[0] + px * S0 * grow, base[1] + py * S0 * (.6 + .6 * grow), S0 * pr * (.35 + .85 * grow) * shrink];
      for (const pf of puffs) { const [cx, cy, R] = at(pf); if (R < 1) continue; X.fillStyle = '#1c1420'; X.beginPath(); X.arc(cx, cy, R + 6, 0, 7); X.fill(); }
      for (const pf of puffs) { const [cx, cy, R] = at(pf); if (R < 1) continue; X.fillStyle = col; X.beginPath(); X.arc(cx, cy, R, 0, 7); X.fill(); X.fillStyle = 'rgba(70,50,90,.28)'; X.beginPath(); X.arc(cx + R * .22, cy + R * .25, R * .78, 0, 7); X.fill(); X.fillStyle = col; X.beginPath(); X.arc(cx - R * .12, cy - R * .14, R * .7, 0, 7); X.fill(); } }
    else if (o.kind === 'spark') {"""
assert s.count(a)==1; s=s.replace(a,b)
a="  if (!window.NOSMOOTH) for (let k = 5; k >= 1; k--) { const tk = t - k / 30; if (tk - sh.t0 < 0) continue; ANIM.rec = SW[5 - k]; ANIM.t = tk; runShot(sh, tk); }"
b="""  let prevCam = null;
  if (!window.NOSMOOTH) for (let k = 5; k >= 1; k--) { const tk = t - k / 30; if (tk - sh.t0 < 0) continue; ANIM.rec = SW[5 - k]; ANIM.t = tk; runShot(sh, tk); if (k === 1) { E.camera.updateMatrixWorld(); prevCam = { m: E.camera.matrixWorldInverse.clone(), pm: E.camera.projectionMatrix.clone() }; } }"""
assert s.count(a)==1; s=s.replace(a,b)
a="  if (!window.NOSMOOTH) Object.values(CHARS).forEach(applySmooth); updateSprites(E.camera);"
b="""  if (!window.NOSMOOTH) Object.values(CHARS).forEach(applySmooth); updateSprites(E.camera);
  if (prevCam && mb === 0 && !window.NOAUTO) { // v4 auto camera motion blur: how far the focus point slid on screen since the last frame
    E.camera.updateMatrixWorld(); const fw = new E.THREE.Vector3(0, 0, -1).transformDirection(E.camera.matrixWorld), P = E.camera.position.clone().addScaledVector(fw, Math.max(1, E.POST.focus || 4));
    const a = P.clone().project(E.camera), b = P.clone().applyMatrix4(prevCam.m).applyMatrix4(prevCam.pm), dx = (a.x - b.x) * 540, dy = -(a.y - b.y) * 960, L = Math.hypot(dx, dy);
    if (L > 6) { const k = Math.min(1, (L - 6) / 30) * .6; E.POST.mblur = [dx * k, dy * k]; } }"""
assert s.count(a)==1; s=s.replace(a,b)
open(p,'w').write(s); print('ok')
