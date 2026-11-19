import sys; K=sys.argv[1]; p=K+'/main.js'; s=open(p).read()
i=s.index("    else if (o.kind === 'smoke') {"); j=s.index("    else if (o.kind === 'spark') {")
new="""    else if (o.kind === 'smoke') { // v4.1: each puff drifts outward + up on its own path, grows soft, then fades out (alpha), outline thins away
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
      if (b && hz > 0) { const Rh = (O.size || 1) * spread * 1300 / Math.max(.5, d0) * (.6 + .5 * E.sstep(0, life, age)); const g = X.createRadialGradient(b[0], b[1] - Rh * .3, 0, b[0], b[1] - Rh * .3, Rh);
        g.addColorStop(0, `rgba(233,220,192,${.35 * hz})`); g.addColorStop(1, 'rgba(233,220,192,0)'); X.globalAlpha = alpha; X.fillStyle = g; X.beginPath(); X.arc(b[0], b[1] - Rh * .3, Rh, 0, 7); X.fill(); } }
"""
s=s[:i]+new+s[j:]; open(p,'w').write(s); print('ok')
