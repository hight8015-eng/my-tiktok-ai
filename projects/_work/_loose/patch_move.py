import sys; K=sys.argv[1]; p=K+'/chars.js'; s=open(p).read()
# 1) richer walk cycle
a="  const w = P.walk; let hy = P.sit ? .04 + (P.hipY || 0) : LEG + (P.hipY || 0); if (w) hy += Math.abs(Math.sin(w.ph)) * .03;"
b="  const w = P.walk; let hy = P.sit ? .04 + (P.hipY || 0) : LEG + (P.hipY || 0); if (w) hy += (.5 - .5 * Math.cos(2 * w.ph)) * .035 - .02; // v4.1: two bobs per cycle, a touch of knee bend"
assert s.count(a)==1; s=s.replace(a,b)
a="  const hd = P.head || [0, 0, 0]; C.head.rotation.set(hd[0] * D2R, hd[1] * D2R, hd[2] * D2R, 'YXZ');"
b="""  const hd = P.head || [0, 0, 0]; C.head.rotation.set(hd[0] * D2R, hd[1] * D2R, hd[2] * D2R, 'YXZ');
  if (w && !P.still) { const ph = w.ph, k = Math.min(1, (w.stride ?? .22) / .22); // hips twist with the stride, body rocks side to side, head stays steady and lags the bob
    C.torso.rotation.y += Math.sin(ph) * .14 * k; C.torso.rotation.z += Math.sin(ph) * .045 * k; C.torso.rotation.x += .06 * k;
    C.head.rotation.y -= Math.sin(ph) * .1 * k; C.head.rotation.x += Math.sin(2 * ph - .7) * .035 * k; }"""
assert s.count(a)==1; s=s.replace(a,b)
a="    else if (w) { const st = w.stride ?? .22; fL = [-.12, -hy + .03 + Math.max(0, Math.sin(w.ph)) * .1, Math.sin(w.ph + Math.PI / 2) * st]; fR = [.12, -hy + .03 + Math.max(0, -Math.sin(w.ph)) * .1, -Math.sin(w.ph + Math.PI / 2) * st]; }"
b="""    else if (w) { const st = w.stride ?? .22, lift = (x) => { const v = Math.max(0, x); return v * v * .13; }; // smooth foot arcs (no hard corners at plant/lift)
      fL = [-.12, -hy + .03 + lift(Math.sin(w.ph)), Math.sin(w.ph + Math.PI / 2) * st]; fR = [.12, -hy + .03 + lift(-Math.sin(w.ph)), -Math.sin(w.ph + Math.PI / 2) * st]; }"""
assert s.count(a)==1; s=s.replace(a,b)
a="  const sw = w ? Math.sin(w.ph) * .16 : 0;"
b="  const sw = w ? Math.sin(w.ph - .35) * .16 * Math.min(1.4, (w.stride ?? .22) / .22) : 0; // arms trail the legs slightly"
assert s.count(a)==1; s=s.replace(a,b)
a="  const hL = P.hL ? (P.hL.isVector3 ? P.hL.clone() : new THREE.Vector3(...P.hL)) : new THREE.Vector3(-.36, .2, .06 - sw);\n  const hR = P.hR ? (P.hR.isVector3 ? P.hR.clone() : new THREE.Vector3(...P.hR)) : new THREE.Vector3(.36, .2, .06 + sw);"
b="  const hL = P.hL ? (P.hL.isVector3 ? P.hL.clone() : new THREE.Vector3(...P.hL)) : new THREE.Vector3(-.36, .2 + Math.abs(sw) * .25, .06 - sw);\n  const hR = P.hR ? (P.hR.isVector3 ? P.hR.clone() : new THREE.Vector3(...P.hR)) : new THREE.Vector3(.36, .2 + Math.abs(sw) * .25, .06 + sw);"
assert s.count(a)==1; s=s.replace(a,b)
# 2) momentum: record root positions per sample, lean into velocity, head lags acceleration
a="  const root = g.getWorldPosition(new THREE.Vector3());\n  (C._trail"
b="  const root = g.getWorldPosition(new THREE.Vector3());\n  (C._roots || (C._roots = [])).push(root.clone());\n  (C._trail"
assert s.count(a)==1; s=s.replace(a,b)
a="export function applySmooth(C) {\n  const A = C._acc; C._acc = null; if (!A || A.w <= 1.01 * ANIM.wFinal || !C.g.visible) return; const v = A.v.map(x => x / A.w), P = A.P;\n  C.head.rotation.set(v[12], v[13], v[14], 'YXZ'); C.torso.rotation.set(v[15], v[16], v[17], 'YXZ'); C.hips.position.y = v[18];"
b="""export function applySmooth(C) {
  const A = C._acc; C._acc = null; if (!A || A.w <= 1.01 * ANIM.wFinal || !C.g.visible) { C._roots = []; return; } const v = A.v.map(x => x / A.w), P = A.P;
  C.head.rotation.set(v[12], v[13], v[14], 'YXZ'); C.torso.rotation.set(v[15], v[16], v[17], 'YXZ'); C.hips.position.y = v[18];
  const R = C._roots || []; C._roots = [];
  if (R.length >= 4 && !P.still && ANIM.on) { // v4.1 momentum: lean into the travel direction, head + body lag on starts/stops (follow-through)
    const n = R.length, vel = R[n - 1].clone().sub(R[n - 2]).multiplyScalar(30), vel0 = R[n - 3].clone().sub(R[n - 4]).multiplyScalar(30), acc = vel.clone().sub(vel0).multiplyScalar(15);
    const sc = C.g.getWorldScale(new THREE.Vector3()).x || 1, inv = new THREE.Quaternion(); C.g.getWorldQuaternion(inv).invert();
    const lv = vel.applyQuaternion(inv).divideScalar(sc), la = acc.applyQuaternion(inv).divideScalar(sc);
    if (lv.length() < 40) { const fwd = clamp(lv.z, -6, 6), side = clamp(lv.x, -6, 6), af = clamp(la.z, -60, 60), as = clamp(la.x, -60, 60);
      C.torso.rotation.x += .035 * fwd - .0035 * af; C.torso.rotation.z -= .03 * side - .003 * as; C.head.rotation.x -= .005 * af; C.head.rotation.z += .004 * as; } }"""
assert s.count(a)==1; s=s.replace(a,b)
# 3) squash-turn: narrow the sprite near a view switch so the pop reads as a turn
a="    const view = a < 24 ? 'F' : a < 60 ? 'Q' : a < 128 ? 'S' : 'B', mir = (view === 'Q' || view === 'S') && th < 0;"
b="""    const view = a < 24 ? 'F' : a < 60 ? 'Q' : a < 128 ? 'S' : 'B', mir = (view === 'Q' || view === 'S') && th < 0;
    const db = Math.min(Math.abs(a - 24), Math.abs(a - 60), Math.abs(a - 128)), turnW = db < 9 ? .82 + .18 * (db / 9) * (db / 9) : 1; // v4.1 turn squash"""
assert s.count(a)==1; s=s.replace(a,b)
a="    place(C.sb, cb, yaw, rollB, (x1 - x0) * K2 * s * (1 - (C.br || 0) * .5) * (1 - sq * .5), bh * (1 + (C.br || 0)) * (1 + sq), mir);"
b="    place(C.sb, cb, yaw, rollB, (x1 - x0) * K2 * s * (1 - (C.br || 0) * .5) * (1 - sq * .5) * turnW, bh * (1 + (C.br || 0)) * (1 + sq), mir);"
assert s.count(a)==1; s=s.replace(a,b)
a="place(C.sh, ch, yaw, rollH, (hx1 - hx0) * K2 * s * (1 + pp * .6) * (1 - hq * .5),"
b="place(C.sh, ch, yaw, rollH, (hx1 - hx0) * K2 * s * (1 + pp * .6) * (1 - hq * .5) * turnW,"
assert s.count(a)==1; s=s.replace(a,b)
open(p,'w').write(s)
# 4) living camera
p=K+'/main.js'; s=open(p).read()
a="  if (!window.NOSMOOTH) Object.values(CHARS).forEach(applySmooth); updateSprites(E.camera);"
b="""  if (!window.NOSMOOTH) Object.values(CHARS).forEach(applySmooth);
  if (!window.NOAUTO) { E.camera.rotateX(E.noise1(t * .33 + 11) * .0045); E.camera.rotateY(E.noise1(t * .27 + 47) * .006); E.camera.updateMatrixWorld(); } // v4.1 living camera: slow handheld drift
  updateSprites(E.camera);"""
assert s.count(a)==1; s=s.replace(a,b)
a="Object.values(CHARS).forEach(C => { C._acc = null; C._trail = []; });"
b="Object.values(CHARS).forEach(C => { C._acc = null; C._trail = []; C._roots = []; });"
assert s.count(a)==1; s=s.replace(a,b)
open(p,'w').write(s); print('ok')
