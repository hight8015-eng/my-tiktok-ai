import sys; K=sys.argv[1]; p=K+'/chars.js'; s=open(p).read()
i=s.index("export function attachHeld(C) {"); j=s.index("// bowling / underhand roll")
new="""export function attachHeld(C) { const H = C._hold; if (!H || !C.g.visible) return;
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
"""
s=s[:i]+new+s[j:]; open(p,'w').write(s); print('ok')
