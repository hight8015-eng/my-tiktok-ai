// fxphys.js - v5.0 physics effects. Every effect is a PURE FUNCTION OF TIME: state is integrated from its start time with a
// fixed 1/240 s step (seeded randomness), so any frame can be drawn on its own (segment renders, smoothing look-backs) and the
// motion is identical everywhere -> no jitter, no frame skips. Fast pieces are stretched along their velocity (cheap motion
// blur) so they never strobe. Each effect returns `events` (impact times + positions) to sync sound and dust.
//
//   const crate = FX.body(scene, { kind: 'crate', size: .5, p0: [x,y,z], v0: [vx,vy,vz], t0: 2.0 });   crate.at(t)
//   const pot   = FX.shatter(scene, { kind: 'pot' | 'rock' | 'glass' | 'ice' | 'wood', at: [x,y,z], size: .5, tBreak: 3, dir: [1,0,0] });  pot.at(t)
//   const ch    = FX.chain(scene, { a: [x,y,z], b: [x,y,z], links: 14, tBreak: 4 });  ch.at(t)
//   const w     = FX.pour(scene, { from: [x,y,z], v0: [vx,vy,vz], t0: 1, t1: 4, ground: 0 });  w.at(t)
//   const r     = FX.stream(scene, { path: [[x,z],...], width: 1.2, y: .02 });  r.at(t)          (flowing river / spill ribbon)
//   const e     = FX.energy(scene, { from: [x,y,z], to: [x,y,z], tCharge: 1, tFire: 2, tHit: 2.5, col: '#b070ff' });  e.at(t)
//   const c     = FX.cracks(scene, { at: [x,y,z], normal: 'y' | 'z', size: 3, t0: 1, dur: .6, col: '#2a1820', glow: '#ff3050' });  c.at(t)
//   const s     = FX.slash(scene, { at: [x,y,z], dir: 30 (deg), size: 1.6, t0: 2, col: '#ffffff', ultimate: false });  s.at(t)
//   const l     = FX.lightning(scene, { from: [x,y,z], to: [x,y,z], t0: 1, dur: .5 });  l.at(t)
//   const x     = FX.explosion(scene, { at: [x,y,z], t0: 2, size: 2 });  x.at(t)
// Screen-space helpers (2D overlay, from chars.js OVL): splitAt(k, angle, gap) for the ultimate slash 'cut the frame' beat.
import { THREE, scene as SCENE, camera, toon, basic, rng, noOutline, clamp, sstep, eOut } from './engine.js';
import { OVL, dustAt, sparkAt, smokeAt } from './chars.js';

const G = 9.8, DT = 1 / 240;
const V = (a) => (a && a.isVector3 ? a.clone() : new THREE.Vector3(...(a || [0, 0, 0])));
const noInk = (m) => { m.userData.noInk = true; m.traverse && m.traverse(o => { o.userData.noInk = true; }); return m; };
const _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _v = new THREE.Vector3(), _m = new THREE.Matrix4(), _s = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
const MAT = {
  crate: () => toon('#9a6a40'), rock: () => toon('#7a7484'), pot: () => toon('#c0643a'), glass: () => basic('#cfeeff', { transparent: true, opacity: .7 }),
  ice: () => basic('#bfe8ff', { transparent: true, opacity: .85 }), wood: () => toon('#8a5a36'), gold: () => toon('#e2b23c'), iron: () => toon('#8a8494'), stone: () => toon('#8a86a0') };

// ---------------- rigid body integrator (sphere-ish collider on a ground plane, spin + friction + sleep) ----------------
// returns a sampled track: positions/quaternions every step from t0, plus impact events. Cached per body.
function simBody(o) {
  const R = rng(o.seed || 1), p = V(o.p0), v = V(o.v0), w = V(o.w0 || [(R() - .5) * 8, (R() - .5) * 8, (R() - .5) * 8]), q = new THREE.Quaternion();
  const r = o.r ?? .2, rest = o.rest ?? .38, fr = o.friction ?? .72, ground = o.ground ?? 0, dur = o.dur ?? 4, n = Math.ceil(dur / DT);
  const P = new Float32Array(n * 3), Q = new Float32Array(n * 4), ev = []; let asleep = false;
  for (let i = 0; i < n; i++) {
    if (!asleep) {
      v.y -= G * (o.gScale ?? 1) * DT; v.multiplyScalar(1 - (o.drag ?? .15) * DT);   // light air drag
      p.addScaledVector(v, DT);
      if (p.y - r < ground) { p.y = ground + r; if (v.y < -.6) ev.push({ t: o.t0 + i * DT, p: p.clone(), speed: -v.y });
        v.y = -v.y * rest; v.x *= fr; v.z *= fr; w.multiplyScalar(.7);
        // rolling: spin follows ground velocity so pieces don't skate
        w.x = w.x * .5 + (v.z / r) * .5; w.z = w.z * .5 + (-v.x / r) * .5;
        if (Math.abs(v.y) < .35 && v.x * v.x + v.z * v.z < .01) { v.set(0, 0, 0); w.multiplyScalar(0); asleep = true; } }
      const a = w.length(); if (a > 1e-5) { _q2.setFromAxisAngle(_v.copy(w).divideScalar(a), a * DT); q.premultiply(_q2); }
    }
    P[i * 3] = p.x; P[i * 3 + 1] = p.y; P[i * 3 + 2] = p.z; Q[i * 4] = q.x; Q[i * 4 + 1] = q.y; Q[i * 4 + 2] = q.z; Q[i * 4 + 3] = q.w;
  }
  return { P, Q, ev, n, t0: o.t0 };
}
function sample(tr, t, outP, outQ, outV) { // linear interp between fixed steps -> perfectly smooth for any frame time
  const f = clamp((t - tr.t0) / DT, 0, tr.n - 1.001), i = Math.floor(f), u = f - i, a = i * 3, b = (i + 1) * 3;
  outP.set(tr.P[a] + (tr.P[b] - tr.P[a]) * u, tr.P[a + 1] + (tr.P[b + 1] - tr.P[a + 1]) * u, tr.P[a + 2] + (tr.P[b + 2] - tr.P[a + 2]) * u);
  if (outQ) { _q.set(tr.Q[i * 4], tr.Q[i * 4 + 1], tr.Q[i * 4 + 2], tr.Q[i * 4 + 3]); _q2.set(tr.Q[i * 4 + 4], tr.Q[i * 4 + 5], tr.Q[i * 4 + 6], tr.Q[i * 4 + 7]); outQ.slerpQuaternions(_q, _q2, u); }
  if (outV) outV.set((tr.P[b] - tr.P[a]) / DT, (tr.P[b + 1] - tr.P[a + 1]) / DT, (tr.P[b + 2] - tr.P[a + 2]) / DT);
}

// ---------------- 1. falling / thrown object ----------------
function propMesh(kind, size) { const g = new THREE.Group(), m = (MAT[kind] || MAT.rock)();
  if (kind === 'crate') { const b = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), m); g.add(b); const d = toon('#6e4426'); for (const s of [-1, 1]) { const x = new THREE.Mesh(new THREE.BoxGeometry(size * 1.02, size * .12, size * .12), d); x.position.y = s * size * .44; g.add(x); } }
  else if (kind === 'barrel') { g.add(new THREE.Mesh(new THREE.CylinderGeometry(size * .42, size * .42, size, 14), MAT.wood())); }
  else if (kind === 'apple') { g.add(new THREE.Mesh(new THREE.SphereGeometry(size * .5, 14, 10), toon('#d8402a'))); const s = new THREE.Mesh(new THREE.CylinderGeometry(size * .03, size * .03, size * .25, 5), toon('#5a3a20')); s.position.y = size * .55; g.add(s); }
  else if (kind === 'coin') { g.add(new THREE.Mesh(new THREE.CylinderGeometry(size * .5, size * .5, size * .12, 16), MAT.gold())); }
  else if (kind === 'book') { g.add(new THREE.Mesh(new THREE.BoxGeometry(size * .8, size * .25, size), toon('#8a1f2e'))); }
  else g.add(new THREE.Mesh(new THREE.DodecahedronGeometry(size * .5, 0), m));
  g.traverse(o => { if (o.isMesh) o.castShadow = true; }); return g; }
export function body(par, o) { const m = propMesh(o.kind || 'rock', o.size || .4); (par || SCENE).add(m); m.visible = false;
  const tr = simBody({ ...o, r: o.r ?? (o.size || .4) * .5 }); const P = new THREE.Vector3();
  return { mesh: m, events: tr.ev, at(t) { m.visible = t >= o.t0 && (o.t1 == null || t < o.t1); if (!m.visible) return; sample(tr, t, m.position, m.quaternion);
    for (const e of tr.ev) { const a = t - e.t; if (a >= 0 && a < .5 && e.speed > 1.5) dustAt(par ? par.localToWorld(e.p.clone()) : e.p, a / .5, Math.min(1.2, e.speed * .18)); } } }; }
// a rain of objects (coins, apples, books off a shelf, rubble from a ceiling)
export function rainOf(par, o) { const R = rng(o.seed || 9), list = [];
  for (let i = 0; i < (o.n || 12); i++) { const a = R() * 6.283, r = Math.sqrt(R()) * (o.spread || 1); list.push(body(par, { kind: o.kind, size: (o.size || .25) * (.7 + R() * .6), seed: i + 1,
    p0: [o.at[0] + Math.cos(a) * r, o.at[1] + R() * (o.height || .5), o.at[2] + Math.sin(a) * r], v0: [(R() - .5) * (o.scatter ?? 1.5), (o.up ?? 0) + R() * .5, (R() - .5) * (o.scatter ?? 1.5)],
    t0: o.t0 + R() * (o.stagger ?? .4), dur: o.dur || 4, rest: o.rest, ground: o.ground })); }
  return { list, events: list.flatMap(b => b.events), at(t) { list.forEach(b => b.at(t)); } }; }

// ---------------- 2. shatter (pots, rocks, glass, ice, statues, wooden boards) ----------------
export function shatter(par, o) { const R = rng(o.seed || 3), at = V(o.at), size = o.size || .5, kind = o.kind || 'pot', n = o.n || (kind === 'glass' || kind === 'ice' ? 26 : 18);
  const whole = o.whole || propMesh(kind === 'pot' ? 'pot' : kind, size); if (!o.whole) { if (kind === 'pot') { whole.clear(); whole.add(new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [size * .35, 0], [size * .5, size * .35], [size * .4, size * .75], [size * .25, size * .9], [size * .28, size]].map(([x, y]) => new THREE.Vector2(x, y)), 16), MAT.pot())); whole.position.copy(at).add(new THREE.Vector3(0, -size * .5, 0)); }
    else whole.position.copy(at); (par || SCENE).add(whole); }
  const mat = (MAT[kind] || MAT.rock)(), shards = [], dir = V(o.dir || [0, 0, 0]);
  const lobes = [0, 1, 2].map(() => new THREE.Vector3(R() - .5, R() * .6 + .1, R() - .5).normalize()); /* v5.3 shards burst in 3 clumps, not a perfect sphere */
  for (let i = 0; i < n; i++) { const tier = R(), s = size * (tier < .15 ? .3 + R() * .12 : tier < .5 ? .17 + R() * .09 : .07 + R() * .07), spk = tier < .15 ? .62 : tier < .5 ? 1 : 1.35, geo = kind === 'glass' || kind === 'ice' ? new THREE.TetrahedronGeometry(s, 0) : kind === 'wood' ? new THREE.BoxGeometry(s * .4, s * 2.2, s * .4) : new THREE.DodecahedronGeometry(s * .8, 0);
    geo.scale(1, .55 + R() * .9, .7 + R() * .6); const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.visible = false; (par || SCENE).add(m);
    const off = new THREE.Vector3(R() - .5, R() - .5, R() - .5).multiplyScalar(size * .8), out = off.clone().normalize().lerp(lobes[i % 3], o.clump ?? .45).normalize();
    const sp = (o.power ?? 3.2) * (.5 + R() * .8) * spk,   /* big pieces fly slower, small ones faster (weight) */ v0 = out.multiplyScalar(sp).addScaledVector(dir, o.power ?? 3.2).add(new THREE.Vector3(0, (o.lift ?? 1.6) * R(), 0));
    shards.push({ m, s, tr: simBody({ p0: at.clone().add(off), v0, t0: o.tBreak, r: s * .45, rest: kind === 'glass' ? .25 : .35, friction: .6, dur: o.dur || 3.5, seed: i + 11, ground: o.ground ?? 0 }) }); }
  const events = [{ t: o.tBreak, p: at.clone(), speed: 9, kind: 'break' }, ...shards.flatMap(s => s.tr.ev.slice(0, 1))];
  const P = new THREE.Vector3(), Vv = new THREE.Vector3();
  return { whole, shards, events, at(t) { const broke = t >= o.tBreak; whole.visible = !broke && (o.t0 == null || t >= o.t0);
      if (!broke && t > o.tBreak - .18 && o.preShake !== false) { const k = (t - (o.tBreak - .18)) / .18; whole.rotation.z = Math.sin(t * 90) * .04 * k; } // tremble right before it gives way
      const fade = o.fadeAfter != null ? 1 - sstep(o.tBreak + o.fadeAfter, o.tBreak + o.fadeAfter + .6, t) : 1;
      for (const s of shards) { s.m.visible = broke && fade > .02; if (!s.m.visible) continue; sample(s.tr, t, s.m.position, s.m.quaternion, Vv);
        const sp = Vv.length(); const st = 1 + Math.min(1.4, sp * DT * 30 * .8); s.m.scale.set(fade, fade * st, fade); } // stretch fast shards along their path
      const a = t - o.tBreak; if (a >= 0 && a < .35) { const w = par ? par.localToWorld(at.clone()) : at; sparkAt(w, 1 - a / .35, size * 1.6); if (kind !== 'glass') dustAt(w, a / .7, size * 2.2); } } }; }

// ---------------- 3. chain (sways, then snaps; links fly with physics) ----------------
export function chain(par, o) { const A = V(o.a), B = V(o.b), n = o.links || 14, mat = (o.glow ? basic(o.glow) : MAT.iron()), links = [], R = rng(o.seed || 5), mid = o.breakAt ?? .5;
  for (let k = 0; k < n; k++) { const m = new THREE.Mesh(new THREE.TorusGeometry(o.r || .09, (o.r || .09) * .3, 6, 12), mat); m.castShadow = true; (par || SCENE).add(m);
    const u = (k + .5) / n, p0 = A.clone().lerp(B, u); p0.y -= Math.sin(u * Math.PI) * (o.sag ?? .35); const side = u < mid ? -1 : 1;
    const away = (u < mid ? A : B).clone().sub(p0).normalize();
    const v0 = new THREE.Vector3((R() - .5) * 1.5, 1 + R() * 1.5, (R() - .5) * 1.5).addScaledVector(away, -(1 - Math.abs(u - mid) * 2) * (o.power ?? 4) * .6);
    links.push({ m, u, p0, k, tr: simBody({ p0, v0, t0: o.tBreak, r: .08, rest: .3, friction: .5, dur: 3, seed: k + 31, ground: o.ground ?? 0 }) }); }
  const dirAB = B.clone().sub(A).normalize(), P = new THREE.Vector3();
  return { links, events: [{ t: o.tBreak, p: A.clone().lerp(B, mid), kind: 'snap' }, ...links.flatMap(l => l.tr.ev.slice(0, 1))], at(t) {
    const tension = o.tBreak - t; for (const l of links) { if (t < o.tBreak) { // taut chain: gentle sway, then a strain shiver before it snaps
        const sw = Math.sin(t * 2.2 + l.u * 3) * .04 * Math.sin(l.u * Math.PI), sh = tension < .4 ? Math.sin(t * 70 + l.k) * .015 * (1 - tension / .4) : 0;
        l.m.position.copy(l.p0).add(new THREE.Vector3(sw + sh, 0, sw * .5)); l.m.quaternion.setFromUnitVectors(_up, dirAB); l.m.rotateY(l.k % 2 ? Math.PI / 2 : 0); }
      else { sample(l.tr, t, l.m.position, l.m.quaternion); if (l.k % 2) l.m.rotateY(Math.PI / 2); } }
    const a = t - o.tBreak; if (a >= 0 && a < .3) { const w = A.clone().lerp(B, mid); sparkAt(par ? par.localToWorld(w) : w, 1 - a / .3, 1.4); } } }; }

// ---------------- 4. water: pour (ballistic stream + splash droplets + ripples) and stream ribbon ----------------
const waterMat = () => noInk(basic('#7cc8f4', { transparent: true, opacity: .9 }));
export function pour(par, o) { const rate = o.rate || 70, n = Math.ceil((o.t1 - o.t0) * rate), from = V(o.from), v0 = V(o.v0 || [0, 0, 0]), gnd = o.ground ?? 0, R = rng(o.seed || 7);
  const drops = new THREE.InstancedMesh(new THREE.SphereGeometry(o.size || .045, 8, 6), waterMat(), n), spl = new THREE.InstancedMesh(new THREE.SphereGeometry((o.size || .045) * .6, 6, 4), waterMat(), n * 3);
  drops.frustumCulled = spl.frustumCulled = false; (par || SCENE).add(drops, spl); noInk(drops); noInk(spl);
  const P = [], ringMat = noInk(basic('#e8f6ff', { transparent: true, opacity: .6, depthWrite: false })), rings = [];
  for (let i = 0; i < n; i++) { const jit = new THREE.Vector3((R() - .5) * .25, (R() - .5) * .15, (R() - .5) * .25), vv = v0.clone().add(jit);
    const a = -.5 * G, b = vv.y, c = from.y - gnd, tHit = (-b - Math.sqrt(b * b - 4 * a * c)) / (2 * a); P.push({ b: o.t0 + i / rate, v: vv, tHit, s: [R(), R(), R(), R(), R(), R()] }); }
  for (let k = 0; k < 4; k++) { const r = new THREE.Mesh(new THREE.RingGeometry(.9, 1, 32), ringMat.clone()); r.rotation.x = -Math.PI / 2; noInk(r); (par || SCENE).add(r); rings.push(r); }
  const hitPt = (d) => new THREE.Vector3(from.x + d.v.x * d.tHit, gnd + .005, from.z + d.v.z * d.tHit);
  const p = new THREE.Vector3(), vel = new THREE.Vector3(), sc = new THREE.Vector3();
  return { events: P.filter((d, i) => i % 20 === 0).map(d => ({ t: d.b + d.tHit, p: hitPt(d), kind: 'splash' })), at(t) {
    let ni = 0, si = 0;
    for (const d of P) { const a = t - d.b;
      if (a >= 0 && a < d.tHit) { p.set(from.x + d.v.x * a, from.y + d.v.y * a - .5 * G * a * a, from.z + d.v.z * a); vel.set(d.v.x, d.v.y - G * a, d.v.z); const sp = vel.length();
        _q.setFromUnitVectors(_up, vel.normalize()); sc.set(1, 1 + Math.min(4, sp * .35), 1); _m.compose(p, _q, sc); drops.setMatrixAt(ni++, _m); }   // drops stretch along their fall = continuous stream look
      else if (a >= d.tHit && a < d.tHit + .45) { const b2 = a - d.tHit, h = hitPt(d); for (let k = 0; k < 3; k++) { const ang = d.s[k] * 6.283, up = 1.2 + d.s[k + 3] * 1.4, out = .6 + d.s[(k + 1) % 6];
          p.set(h.x + Math.cos(ang) * out * b2, h.y + up * b2 - .5 * G * b2 * b2, h.z + Math.sin(ang) * out * b2); if (p.y < gnd) continue; const k2 = 1 - b2 / .45; sc.setScalar(k2); _q.identity(); _m.compose(p, _q, sc); spl.setMatrixAt(si++, _m); } } }
    drops.count = ni; spl.count = si; drops.instanceMatrix.needsUpdate = spl.instanceMatrix.needsUpdate = true; drops.visible = ni > 0; spl.visible = si > 0;
    const c = hitPt(P[Math.floor(P.length / 2)] || P[0]); rings.forEach((r, k) => { const ph = ((t - o.t0) * .9 + k / 4) % 1, on = t > o.t0 + .3 && t < o.t1 + .8; r.visible = on; if (!on) return;
      r.position.copy(c); r.scale.setScalar(.15 + ph * (o.ripple || 1.1)); r.material.opacity = .55 * (1 - ph) * (t > o.t1 ? 1 - sstep(o.t1, o.t1 + .8, t) : 1); }); } }; }
const flowTex = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 256; const x = c.getContext('2d'); x.fillStyle = '#5fb0e8'; x.fillRect(0, 0, 64, 256); const r = rng(4);
  for (let i = 0; i < 40; i++) { x.strokeStyle = `rgba(255,255,255,${.25 + r() * .45})`; x.lineWidth = 2 + r() * 3; x.beginPath(); const X0 = r() * 64, Y0 = r() * 256; x.moveTo(X0, Y0); x.quadraticCurveTo(X0 + (r() - .5) * 20, Y0 + 12, X0 + (r() - .5) * 10, Y0 + 24 + r() * 20); x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t; })();
export function stream(par, o) { const pts = o.path.map(([x, z]) => new THREE.Vector3(x, o.y ?? .02, z)), curve = new THREE.CatmullRomCurve3(pts), segs = 60, w = o.width || 1, pos = [], uv = [], idx = [];
  let len = 0; const L = curve.getLength();
  for (let i = 0; i <= segs; i++) { const u = i / segs, p = curve.getPointAt(u), tg = curve.getTangentAt(u), n = new THREE.Vector3(-tg.z, 0, tg.x).normalize(), ww = w * (o.taper ? .4 + .6 * Math.sin(u * Math.PI) : 1);
    pos.push(p.x + n.x * ww / 2, p.y, p.z + n.z * ww / 2, p.x - n.x * ww / 2, p.y, p.z - n.z * ww / 2); uv.push(0, u * L / w, 1, u * L / w); if (i < segs) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  const tex = flowTex.clone(); tex.needsUpdate = true; const m = noInk(new THREE.Mesh(g, basic('#ffffff', { map: tex, transparent: true, opacity: .92, side: THREE.DoubleSide }))); (par || SCENE).add(m);
  return { mesh: m, at(t) { tex.offset.y = -t * (o.speed ?? .9); } }; }   // texture flows along the ribbon: continuous, no frame steps

// ---------------- 5. energy: charge (particles spiral in) -> fire (ball + trail) -> hit (flash, ring, shockwave) ----------------
export function energy(par, o) { const A = V(o.from), B = V(o.to), col = new THREE.Color(o.col || '#b070ff'), R = rng(o.seed || 13), N = 70;
  const core = noInk(new THREE.Mesh(new THREE.SphereGeometry(o.size || .22, 18, 12), basic('#ffffff'))), halo = noInk(new THREE.Mesh(new THREE.SphereGeometry((o.size || .22) * 1.9, 18, 12), basic(o.col || '#b070ff', { transparent: true, opacity: .45, add: true, depthWrite: false })));
  const parts = new THREE.InstancedMesh(new THREE.SphereGeometry(.035, 6, 4), noInk(basic(o.col || '#b070ff', { add: true, transparent: true, depthWrite: false })), N); parts.frustumCulled = false; noInk(parts);
  const ring = noInk(new THREE.Mesh(new THREE.TorusGeometry(1, .05, 8, 48), basic(o.col || '#b070ff', { transparent: true, add: true, depthWrite: false })));
  const g = new THREE.Group(); g.add(core, halo, parts, ring); (par || SCENE).add(g); const S = Array.from({ length: N }, () => [R(), R(), R(), R()]);
  const path = (u) => { const p = A.clone().lerp(B, u); p.y += Math.sin(u * Math.PI) * (o.arc ?? .3); return p; }, ease = (u) => u * u * (1.6 - .6 * u); // accelerates into the target
  const p = new THREE.Vector3(), sc = new THREE.Vector3();
  return { events: [{ t: o.tCharge, p: A, kind: 'charge' }, { t: o.tFire, p: A, kind: 'fire' }, { t: o.tHit, p: B, kind: 'hit' }], at(t) {
    const charging = t >= o.tCharge && t < o.tFire, flying = t >= o.tFire && t < o.tHit, after = t >= o.tHit; g.visible = t >= o.tCharge && t < o.tHit + .8;
    if (!g.visible) return; const kc = clamp((t - o.tCharge) / (o.tFire - o.tCharge)), pulse = 1 + .08 * Math.sin(t * 40);
    let C = A.clone(); if (flying) C = path(ease((t - o.tFire) / (o.tHit - o.tFire))); if (after) C = B.clone();
    const sz = charging ? .25 + .75 * eOut(kc) : after ? Math.max(0, 1 - (t - o.tHit) * 6) : 1; core.position.copy(C); halo.position.copy(C); core.scale.setScalar(sz * pulse); halo.scale.setScalar(sz * pulse * (after ? 1 + (t - o.tHit) * 8 : 1));
    halo.material.opacity = after ? .45 * (1 - (t - o.tHit) / .8) : .45;
    let k = 0; for (const s of S) { if (charging) { const life = (s[0] + (t - o.tCharge) * 1.6) % 1, r = (1 - life) * 1.1 + .1, a = s[1] * 6.283 + life * 5;   // particles spiral IN to the hand
        p.set(C.x + Math.cos(a) * r, C.y + (s[2] - .5) * r * 1.2, C.z + Math.sin(a) * r); sc.setScalar(.6 + life); }
      else if (flying) { const back = s[0] * .35, u = clamp(ease((t - o.tFire) / (o.tHit - o.tFire)) - back * .3); const q = path(u); p.set(q.x + (s[1] - .5) * .25 * back * 3, q.y + (s[2] - .5) * .25 * back * 3, q.z + (s[3] - .5) * .25 * back * 3); sc.setScalar(1.3 - back * 2.5); } // comet tail
      else { const a = t - o.tHit, dir = new THREE.Vector3(s[1] - .5, s[2] - .2, s[3] - .5).normalize(), d = (2 + s[0] * 3) * a - .5 * G * .3 * a * a; p.copy(B).addScaledVector(dir, d); sc.setScalar(Math.max(0, 1 - a / .8)); } // burst
      _q.identity(); _m.compose(p, _q, sc); parts.setMatrixAt(k++, _m); } parts.instanceMatrix.needsUpdate = true;
    ring.visible = after; if (after) { const a = t - o.tHit; ring.position.copy(B); ring.rotation.x = Math.PI / 2; ring.scale.setScalar(.2 + eOut(Math.min(1, a / .6)) * (o.ringSize || 3)); ring.material.opacity = 1 - a / .8; }
    if (after && t - o.tHit < .25) sparkAt(par ? par.localToWorld(B.clone()) : B, 1 - (t - o.tHit) / .25, 2.2); } }; }

// ---------------- 6. progressive cracks (ribbons revealed in order of distance from the impact point) ----------------
export function cracks(par, o) { const R = rng(o.seed || 21), size = o.size || 3, segs = [];
  const grow = (x, y, a, len, w, d) => { if (d > 5 || len < size * .03) return; let X = x, Y = y; for (let i = 0; i < 4; i++) { a += (R() - .5) * .8; const nx = X + Math.cos(a) * len / 4, ny = Y + Math.sin(a) * len / 4; segs.push([X, Y, nx, ny, w, Math.hypot(nx, ny)]); X = nx; Y = ny; }
    if (R() < .75) grow(X, Y, a + (R() - .5) * 1.3, len * .62, w * .7, d + 1); if (R() < .55) grow(X, Y, a + (R() < .5 ? -1 : 1) * (.5 + R() * .6), len * .5, w * .6, d + 1); };
  for (let k = 0; k < (o.arms || 7); k++) grow(0, 0, k / (o.arms || 7) * 6.283 + R() * .5, size * (.35 + R() * .2), size * .022, 0);
  segs.sort((a, b) => a[5] - b[5]); const maxD = segs[segs.length - 1][5];
  const pos = [], idx = []; segs.forEach(([x0, y0, x1, y1, w], i) => { const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1, nx = -dy / l * w / 2, ny = dx / l * w / 2, b = i * 4;
    pos.push(x0 + nx, y0 + ny, 0, x0 - nx, y0 - ny, 0, x1 + nx * .7, y1 + ny * .7, 0, x1 - nx * .7, y1 - ny * .7, 0); idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); });
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx);
  const dark = noInk(new THREE.Mesh(geo, basic(o.col || '#2a1820', { side: THREE.DoubleSide }))), glowG = geo.clone(), glow = noInk(new THREE.Mesh(glowG, basic(o.glow || '#ff3050', { side: THREE.DoubleSide, transparent: true, add: true, depthWrite: false })));
  glow.scale.set(1.9, 1.9, 1); const g = new THREE.Group(); g.add(glow, dark); dark.position.z = .002; if ((o.normal || 'y') === 'y') g.rotation.x = -Math.PI / 2; g.position.copy(V(o.at)); if ((o.normal || 'y') === 'y') g.position.y += (o.lift ?? .035);   /* sit above roads / carpets (thin boxes on the ground) */ (par || SCENE).add(g);
  const cum = segs.map(s => s[5] / maxD);
  return { events: [{ t: o.t0, p: V(o.at), kind: 'crack' }], at(t) { const k = clamp((t - o.t0) / (o.dur || .6)); g.visible = k > 0; if (!k) return;
    const e = eOut(k); let n = 0; while (n < cum.length && cum[n] <= e) n++; dark.geometry.setDrawRange(0, n * 6); glow.geometry.setDrawRange(0, n * 6);
    glow.material.opacity = o.glow === null ? 0 : (.9 - .6 * sstep(o.t0 + (o.dur || .6), o.t0 + (o.dur || .6) + 1.2, t)) * (o.fade != null ? 1 - sstep(o.fade, o.fade + .6, t) : 1);
    dark.material.opacity = 1; } }; }

// ---------------- 7. slash (sword arc) and ULTIMATE slash ----------------
function arcGeo(r, w, th) { const seg = 40, pos = [], col = [], idx = [];
  for (let i = 0; i <= seg; i++) { const u = i / seg, a = -th / 2 + th * u, thick = w * Math.sin(u * Math.PI) ** .7, c = Math.cos(a), s = Math.sin(a);   // crescent: thick middle, sharp tips
    pos.push(c * r, s * r, 0, c * (r - thick), s * (r - thick), 0); const al = Math.sin(u * Math.PI); col.push(1, 1, 1, al, 1, 1, 1, 0); if (i < seg) { const b = i * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 4)); g.setIndex(idx); return g; }
export function slash(par, o) { const size = o.size || 1.6, ult = !!o.ultimate, g = new THREE.Group(); g.position.copy(V(o.at)); g.rotation.set(o.tilt ?? .2, o.yaw ?? 0, (o.dir ?? 30) * Math.PI / 180); (par || SCENE).add(g);
  const mk = (col, op, r, w) => { const m = noInk(new THREE.Mesh(arcGeo(r, w, ult ? 2.6 : 2.2), new THREE.MeshBasicMaterial({ color: col, vertexColors: true, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }))); noOutline(m.material); g.add(m); return m; };
  const layers = [mk(o.col || '#bfe4ff', .55, size * 1.04, size * (ult ? .34 : .22)), mk('#ffffff', 1, size, size * (ult ? .16 : .1))], ghosts = ult ? [mk(o.col || '#bfe4ff', .35, size * 1.12, size * .2), mk(o.col || '#bfe4ff', .25, size * 1.2, size * .16)] : [];
  const sweep = ult ? .11 : .08, life = ult ? .6 : .32;
  return { events: [{ t: o.t0, p: V(o.at), kind: ult ? 'ultimate' : 'slash' }], at(t) { const a = t - o.t0; g.visible = a >= -.02 && a < life + sweep; if (!g.visible) return;
    if (o.billboard !== false) { g.parent.updateMatrixWorld(); camera.updateMatrixWorld(); const pq = new THREE.Quaternion(); g.parent.getWorldQuaternion(pq); g.quaternion.copy(pq.invert().multiply(camera.quaternion)); g.rotateZ((o.dir ?? 30) * Math.PI / 180); } // anime slashes face the viewer
    const k = clamp(a / sweep), fade = 1 - sstep(sweep, sweep + life, a);  // the arc SWEEPS open over ~3 frames, then thins and fades: reads as one smooth swing, not a pop
    layers.forEach((m, i) => { m.geometry.setDrawRange(0, Math.max(0, Math.floor(eOut(k) * 40)) * 6); m.material.opacity = (i ? 1 : .55) * fade; m.scale.set(1 + (1 - fade) * .15, 1 + (1 - fade) * .15, 1); });
    ghosts.forEach((m, i) => { const d = a - .05 * (i + 1); m.visible = d > 0; m.geometry.setDrawRange(0, 40 * 6); m.material.opacity = .3 * (1 - sstep(0, life, d)); m.rotation.z = -.12 * (i + 1); });
    if (ult && a > sweep * .6 && a < sweep * .6 + .5) OVL.push({ kind: 'split', k: (a - sweep * .6) / .5, ang: (o.screenAngle ?? -18) * Math.PI / 180, gap: o.gap ?? 26 }); } }; }

// ---------------- 8. lightning (branching bolt, re-strikes every few frames, glow) ----------------
export function lightning(par, o) { const A = V(o.from), B = V(o.to), g = new THREE.Group(); (par || SCENE).add(g); const mats = [noInk(basic(o.col || '#bfe0ff', { transparent: true, add: true, depthWrite: false })), noInk(basic('#ffffff'))];
  let built = -1; const build = (seed) => { g.clear(); const R = rng(seed), pts = [A.clone()], n = 14; for (let i = 1; i < n; i++) { const p = A.clone().lerp(B, i / n); p.x += (R() - .5) * .5; p.z += (R() - .5) * .5; p.y += (R() - .5) * .2; pts.push(p); } pts.push(B.clone());
    const tube = (P, r) => [new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(P, false, 'catmullrom', 0), P.length * 3, r * 3, 6), mats[0]), new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(P, false, 'catmullrom', 0), P.length * 3, r, 6), mats[1])].forEach(m => { noInk(m); g.add(m); });
    tube(pts, o.width || .03); for (let b = 0; b < 3; b++) { const i = 3 + Math.floor(R() * 8), br = [pts[i].clone()]; let q = pts[i].clone(); for (let j = 0; j < 4; j++) { q = q.clone().add(new THREE.Vector3((R() - .5) * .6, -.25 - R() * .3, (R() - .5) * .6)); br.push(q); } tube(br, (o.width || .03) * .5); } };
  return { events: [{ t: o.t0, p: B, kind: 'thunder' }], at(t) { const a = t - o.t0, on = a >= 0 && a < (o.dur || .5) && (Math.floor(a * 30) % 5 !== 3); g.visible = on; if (!on) return; const s = Math.floor(a * 30 / 3) + (o.seed || 1) * 97; if (s !== built) { build(s); built = s; }
    mats[0].opacity = .8 * (1 - a / (o.dur || .5)); if (a < .1) OVL.push({ kind: 'tint', col: '#eef4ff', k: .4 * (1 - a / .1) }); } }; }

// ---------------- 9. explosion (fireball that rolls up into smoke, flash, debris via shatter/rainOf) ----------------
export function explosion(par, o) { const at = V(o.at), size = o.size || 2, R = rng(o.seed || 17), balls = [], g = new THREE.Group(); (par || SCENE).add(g);
  for (let i = 0; i < 14; i++) { const m = noInk(new THREE.Mesh(new THREE.IcosahedronGeometry(1, 2), basic('#ffffff', { transparent: true }))); g.add(m); balls.push({ m, d: new THREE.Vector3(R() - .5, R() * .8 + .2, R() - .5).normalize(), sp: .6 + R() * .8, s: .5 + R() * .6, ph: R() * .25 }); }
  const flash = noInk(new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), basic('#fff2c0', { transparent: true, add: true, depthWrite: false }))); g.add(flash);
  return { events: [{ t: o.t0, p: at, kind: 'boom' }], at(t) { const a = t - o.t0; g.visible = a >= 0 && a < 2.2; if (!g.visible) return;
    flash.position.copy(at); flash.scale.setScalar(size * (.3 + a * 4)); flash.material.opacity = Math.max(0, .9 - a * 5);
    for (const b of balls) { const e = eOut(Math.min(1, a / .5)), rise = a * a * (.4 + .5 * (1.1 - b.s));   /* v5.3 small hot cores rise faster */ b.m.position.copy(at).addScaledVector(b.d, size * .55 * b.sp * e).add(new THREE.Vector3(0, rise * size * .4, 0));
      b.m.scale.setScalar(size * .26 * b.s * (.3 + e) * (1 + a * .5)); const h = 1 - sstep(.0, .9, a - b.ph + (b.s - .8) * .15);   // white-hot -> yellow -> orange -> charcoal smoke, each ball on its own clock
      const RAMP = [[.3, .27, .3], [.95, .45, .15], [1, .82, .3], [1, 1, .85]], x = Math.max(0, Math.min(2.999, h * 3)), j = Math.floor(x), f = x - j, c = [0, 1, 2].map(q => RAMP[j][q] + (RAMP[j + 1][q] - RAMP[j][q]) * f);   /* smooth ramp: no colour pops */ b.m.material.color.setRGB(...c); b.m.material.opacity = Math.max(0, Math.min(1, (1.3 - b.s * .3 - a) * 2.5)); b.m.visible = b.m.material.opacity > .02; }   // fireballs fade out; the soft smoke puffs take over
    if (a > .35) for (let i = 0; i < 5; i++) { const off = new THREE.Vector3([-.5, .35, 0, -.25, .55][i] * size, [.3, .45, .7, .9, .2][i] * size, [.1, -.2, 0, .2, -.1][i] * size);   /* v5.3 puffs at different heights + own seeds: no identical sausage row */
      smokeAt(par ? par.localToWorld(at.clone().add(off)) : at.clone().add(off), a - .35 - [0, .12, .05, .2, .09][i], { col: ['#4a4450', '#57505c', '#3f3a46', '#504856', '#46404c'][i], size: size * [.5, .42, .6, .38, .45][i], life: 2 + i * .15, seed: 3 + i * 7, rise: .5 + i * .06 }); }
    if (a < .5) OVL.push({ kind: 'tint', col: '#ffe0a0', k: .35 * (1 - a / .5) }); } }; }

// ---------------- 10. pile: many bodies that collide WITH EACH OTHER (spheres, positional correction), e.g. a collapsing
// stack of crates, a rock slide, a heap of coins. Integrated jointly from t0 at 1/240 s, sampled like body(). ----------------
export function pile(par, o) { const R = rng(o.seed || 41), n = o.list.length, r = o.list.map(b => (b.size || .4) * (b.kind === 'crate' ? .58 : .5)), dur = o.dur || 4, steps = Math.ceil(dur / DT), gnd = o.ground ?? 0;
  const p = o.list.map(b => V(b.p0)), v = o.list.map(b => V(b.v0 || [0, 0, 0])), w = o.list.map(() => new THREE.Vector3((R() - .5) * 2, (R() - .5) * 2, (R() - .5) * 2)), q = o.list.map(() => new THREE.Quaternion()), sleep = new Array(n).fill(0);
  const tracks = o.list.map(() => ({ P: new Float32Array(steps * 3), Q: new Float32Array(steps * 4), ev: [], n: steps, t0: o.t0 })), d = new THREE.Vector3();
  for (let i = 0; i < steps; i++) { const t = o.t0 + i * DT;
    for (let a = 0; a < n; a++) { if (t < (o.list[a].t0 ?? o.t0)) continue; v[a].y -= G * DT; p[a].addScaledVector(v[a], DT);
      if (p[a].y - r[a] < gnd) { if (v[a].y < -1.2) tracks[a].ev.push({ t, p: p[a].clone(), speed: -v[a].y }); p[a].y = gnd + r[a]; v[a].y = -v[a].y * (o.rest ?? .25); v[a].x *= .8; v[a].z *= .8; w[a].set(v[a].z / r[a], w[a].y * .6, -v[a].x / r[a]); } }
    for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) { d.subVectors(p[b], p[a]); const L = d.length(), m = r[a] + r[b]; if (L >= m || L < 1e-6) continue;   // overlap -> push apart, exchange momentum along the normal
      d.divideScalar(L); const pen = m - L; p[a].addScaledVector(d, -pen / 2); p[b].addScaledVector(d, pen / 2);
      const rel = v[b].clone().sub(v[a]).dot(d); if (rel < 0) { const j = -(1 + (o.rest ?? .25)) * rel / 2; v[a].addScaledVector(d, -j); v[b].addScaledVector(d, j); v[a].multiplyScalar(.985); v[b].multiplyScalar(.985);
        if (-rel > 2.5) tracks[a].ev.push({ t, p: p[a].clone().addScaledVector(d, r[a]), speed: -rel }); } }
    for (let a = 0; a < n; a++) { const s = v[a].lengthSq(); sleep[a] = s < .02 && p[a].y - r[a] < gnd + .02 ? sleep[a] + 1 : 0; if (sleep[a] > 30) { v[a].multiplyScalar(.6); w[a].multiplyScalar(.6); }
      const ang = w[a].length(); if (ang > 1e-5) { _q2.setFromAxisAngle(_v.copy(w[a]).divideScalar(ang), ang * DT); q[a].premultiply(_q2); }
      const T = tracks[a]; T.P.set([p[a].x, p[a].y, p[a].z], i * 3); T.Q.set([q[a].x, q[a].y, q[a].z, q[a].w], i * 4); } }
  const meshes = o.list.map(b => { const m = propMesh(b.kind || 'rock', b.size || .4); (par || SCENE).add(m); return m; }), Vv = new THREE.Vector3();
  return { meshes, events: tracks.flatMap(T => T.ev).sort((a, b) => a.t - b.t), at(t) { meshes.forEach((m, a) => { m.visible = t >= (o.showFrom ?? -1e9); if (!m.visible) return;
      if (t < o.t0) { m.position.copy(V(o.list[a].p0)); m.quaternion.identity(); return; } sample(tracks[a], t, m.position, m.quaternion); }); } }; }
// ---------------- 11. anime IMPACT FRAME: 1-2 inverted high-contrast frames + radial action lines on the biggest hit ----------------
export function impactFrame(o) { return { at(t) { const a = t - o.t0; if (a >= 0 && a < (o.dur ?? .07)) OVL.push({ kind: 'impactframe', p: V(o.at), k: 1, u: a / (o.dur ?? .07), lines: o.lines ?? 46 });   /* k = 1: the overlay loop uses k as opacity */ } }; }


// ---------------- v6.7 sparks: metal on metal / bullet on brick. Each spark is a tiny ballistic body (gravity, air
// drag, bounces off the floor losing most energy), drawn as a streak along its velocity (motion blur), cooling
// white -> yellow -> orange -> red as it ages; sizes and lifetimes vary; bursts come in a cone around the normal. ----------------
export function sparks(o) { const R = rng(o.seed || 61), n = o.n || 22, at = V(o.at), nrm = V(o.normal || [0, 1, 0]).normalize(), g = 9.8, list = [];
  const tA = new THREE.Vector3(), tB = new THREE.Vector3(); const up = Math.abs(nrm.y) < .9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
  const u1 = new THREE.Vector3().crossVectors(nrm, up).normalize(), u2 = new THREE.Vector3().crossVectors(nrm, u1);
  for (let i = 0; i < n; i++) { const a = R() * 6.283, c = (o.cone ?? .7) * Math.sqrt(R()), sp = (o.speed || 6) * (.35 + R() * .9);
    const d = nrm.clone().multiplyScalar(Math.cos(c)).addScaledVector(u1, Math.sin(c) * Math.cos(a)).addScaledVector(u2, Math.sin(c) * Math.sin(a));
    list.push({ v0: d.multiplyScalar(sp), life: (o.life || .6) * (.4 + R() * .9), w: 2 + R() * 3, delay: R() * .04 }); }
  const floor = o.floor ?? 0, P = new THREE.Vector3(), Vv = new THREE.Vector3();
  const pos = (s, t) => { let p = at.clone(), v = s.v0.clone(), tt = 0; const dt = 1 / 240; while (tt < t) { v.y -= g * dt; v.multiplyScalar(1 - 1.2 * dt); p.addScaledVector(v, dt); if (p.y < floor && v.y < 0) { p.y = floor; v.y *= -.3; v.x *= .6; v.z *= .6; } tt += dt; } Vv.copy(v); return p; };
  return { at(t) { const a = t - o.t0; if (a < 0 || a > (o.life || .6) * 1.4) return;
    for (const s of list) { const u = (a - s.delay) / s.life; if (u < 0 || u > 1) continue; const p = pos(s, a - s.delay), q = p.clone().addScaledVector(Vv, -1 / 45);   // tail = where it was 2/3 of a frame ago
      const col = u < .15 ? '#fffbe8' : u < .4 ? '#ffd84a' : u < .7 ? '#ff8a1c' : '#d8301a'; OVL.push({ kind: 'sparkline', p, p2: q, k: 1 - u * u, w: s.w * (1 - .5 * u), col }); } } }; }
