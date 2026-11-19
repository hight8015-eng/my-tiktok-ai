import sys; K=sys.argv[1]; p=K+'/chars.js'; s=open(p).read()
# open hand variant + longer shoes
a="""      mesh(new THREE.CylinderGeometry(.04, .036, .03, 14), gloveM, { p: [0, .052, 0], parent: hand }); }
    return { up, fo, hand, S: new THREE.Vector3(s * .22, .72, 0) }; };"""
b="""      mesh(new THREE.CylinderGeometry(.04, .036, .03, 14), gloveM, { p: [0, .052, 0], parent: hand }); }
    let open = null; if (!CL) { open = group({ p: [0, -AL - .02, 0], parent: fo }); open.visible = false; // v4.3 open hand: palm + 4 spread fingers + thumb
      mesh(new THREE.SphereGeometry(.05, 14, 10), gloveM, { s: [1.05, 1, .6], parent: open }); mesh(new THREE.CylinderGeometry(.04, .036, .03, 14), gloveM, { p: [0, .05, 0], parent: open });
      for (let i = 0; i < 4; i++) { const a = (-.5 + i / 3) * 1.05; mesh(new THREE.CapsuleGeometry(.014, .05, 3, 8), gloveM, { p: [Math.sin(a) * .06, -.055 - Math.cos(a) * .02, 0], r: [0, 0, a * 57], parent: open }); }
      mesh(new THREE.CapsuleGeometry(.015, .04, 3, 8), gloveM, { p: [s * -.06, -.005, .01], r: [0, 0, s * 70], parent: open }); }
    return { up, fo, hand, open, S: new THREE.Vector3(s * .22, .72, 0) }; };"""
assert s.count(a)==1; s=s.replace(a,b)
a="mesh(new THREE.SphereGeometry(.07, 16, 10), shoeM, { s: [.95, .62, 1.55], parent: shoe });"
b="mesh(new THREE.SphereGeometry(.07, 16, 10), shoeM, { p: [0, 0, .025], s: [.95, .62, 1.85], parent: shoe });"
assert s.count(a)==1; s=s.replace(a,b)
a="mesh(new THREE.CylinderGeometry(.068, .068, .02, 16), soleM, { p: [0, -.036, 0], s: [.95, 1, 1.55], parent: shoe }); }"
b="mesh(new THREE.CylinderGeometry(.068, .068, .02, 16), soleM, { p: [0, -.036, .025], s: [.95, 1, 1.85], parent: shoe }); }"
assert s.count(a)==1; s=s.replace(a,b)
# run cycle inside pose()
a="""    else if (w) { const st = w.stride ?? .22, lift = (x) => { const v = Math.max(0, x); return v * v * .13; }; // smooth foot arcs (no hard corners at plant/lift)
      fL = [-.12, -hy + .03 + lift(Math.sin(w.ph)), Math.sin(w.ph + Math.PI / 2) * st]; fR = [.12, -hy + .03 + lift(-Math.sin(w.ph)), -Math.sin(w.ph + Math.PI / 2) * st]; }"""
b="""    else if (w && w.run) { const st = (w.stride ?? .3) * w.run, ft = (a) => { const sw = Math.cos(a); // v4.3 run (model sheet 11-20): bent knees, back foot kicks high, front foot reaches
        return [-hy + .03 + Math.pow(Math.max(0, sw), 1.4) * .3 * w.run + Math.max(0, -sw) * Math.max(0, Math.sin(a)) * .04, Math.sin(a) * st - Math.max(0, sw) * .08 * w.run]; };
      const L_ = ft(w.ph), R_ = ft(w.ph + Math.PI); fL = [-.11, L_[0], L_[1]]; fR = [.11, R_[0], R_[1]]; }
    else if (w) { const st = w.stride ?? .22, lift = (x) => { const v = Math.max(0, x); return v * v * .13; }; // smooth foot arcs (no hard corners at plant/lift)
      fL = [-.12, -hy + .03 + lift(Math.sin(w.ph)), Math.sin(w.ph + Math.PI / 2) * st]; fR = [.12, -hy + .03 + lift(-Math.sin(w.ph)), -Math.sin(w.ph + Math.PI / 2) * st]; }"""
assert s.count(a)==1; s=s.replace(a,b)
a="  const w = P.walk; let hy = P.sit ? .04 + (P.hipY || 0) : LEG + (P.hipY || 0); if (w) hy += (.5 - .5 * Math.cos(2 * w.ph)) * .035 - .02; // v4.1: two bobs per cycle, a touch of knee bend"
b="  const w = P.walk; let hy = P.sit ? .04 + (P.hipY || 0) : LEG + (P.hipY || 0); if (w) hy += w.run ? (-.09 + (.5 - .5 * Math.cos(2 * w.ph + 1.2)) * .06) * w.run : (.5 - .5 * Math.cos(2 * w.ph)) * .035 - .02; // v4.1: two bobs per cycle, a touch of knee bend (run: deep crouch + flight bob)"
assert s.count(a)==1; s=s.replace(a,b)
a="    C.torso.rotation.y += Math.sin(ph) * .14 * k; C.torso.rotation.z += Math.sin(ph) * .045 * k; C.torso.rotation.x += .06 * k;"
b="    C.torso.rotation.y += Math.sin(ph) * (w.run ? .2 : .14) * k; C.torso.rotation.z += Math.sin(ph) * .045 * k; C.torso.rotation.x += (w.run ? .24 * w.run : .06 * k);"
assert s.count(a)==1; s=s.replace(a,b)
# run arms: pump with bent elbows when no hand targets given
a="  const hL = P.hL ? (P.hL.isVector3 ? P.hL.clone() : new THREE.Vector3(...P.hL)) : new THREE.Vector3(-.36, .2 + Math.abs(sw) * .25, .06 - sw);"
b="""  const runA_ = w && w.run && !P.hL && !P.hR; if (runA_) { const a = Math.sin(w.ph) * w.run; P = { ...P, hL: [-.26, .42 + .14 * Math.max(0, -a), -.32 * a + .08], hR: [.26, .42 + .14 * Math.max(0, a), .32 * a + .08], pL: [-1, -.4, -.9], pR: [1, -.4, -.9] }; }
  const hL = P.hL ? (P.hL.isVector3 ? P.hL.clone() : new THREE.Vector3(...P.hL)) : new THREE.Vector3(-.36, .2 + Math.abs(sw) * .25, .06 - sw);"""
assert s.count(a)==1; s=s.replace(a,b)
# open hands toggle
a="  C.sweat.visible = !!P.sweat; C.pop = P.pop || 0;"
b="""  for (const [L_, k] of [[C.aL, 'L'], [C.aR, 'R']]) if (L_.open) { const o = P.open === true || P.open === k; L_.open.visible = o; L_.hand.visible = !o; }
  C.sweat.visible = !!P.sweat; C.pop = P.pop || 0;"""
assert s.count(a)==1; s=s.replace(a,b)
# cheer jump + axe + prop placement
a="// fast repeated work"
b="""// cheering leap (model sheet 41-44): crouch with arms back -> launch with open hands up -> tucked apex -> squat landing
export function actCheer(lt, { t0 = .35, dur = .55, h = .5, at = [0, 0, 0] } = {}) {
  const J = actJump(lt, { t0, dur, h, from: at, to: at }), u = clamp((lt - t0) / dur), air = lt > t0 && lt < t0 + dur;
  if (air) { J.hL = [-.48, 1.18, .12]; J.hR = [.48, 1.18, .12]; J.open = true; J.ex = 'happy'; J.fL = [-.16, -.35 + .12 * Math.sin(u * Math.PI), .1]; J.fR = [.16, -.42 + .1 * Math.sin(u * Math.PI), -.12]; }
  else if (lt < t0) { J.ex = 'confident'; } else J.ex = J.landed < .5 ? 'grinTeeth' : 'happy';
  return J;
}
// two-handed swing (model sheet 45-46): wind the prop up over the shoulder, chop down at `at`. Returns hands + o.prop {c, d} in torso space
export function actAxe(lt, at, { side = 1 } = {}) {
  const up = sm(at - .55, at - .12, lt) * (1 - sm(at - .06, at + .02, lt)), down = sm(at - .06, at + .02, lt) * (1 - sm(at + .35, at + .9, lt));
  const c = mixA(mixA([.05 * side, .55, .42], [.12 * side, 1.08, -.05], up), [0, .6, .72], down), d = mixA(mixA([0, .5, .87], [.15 * side, .55, -.8], up), [0, -.25, .97], down);
  const n = Math.hypot(...d), D = d.map(v => v / n), hR = c.map((v, i) => v - D[i] * .02), hL = c.map((v, i) => v - D[i] * .14);
  return { hL, hR, pL: [-1, -.3, -.4], pR: [1, -.3, -.4], lean: -10 * up + 16 * down, twist: (14 * up - 8 * down) * side, hipY: -.05 - .06 * down, squash: .06 * up - .1 * down * (1 - sm(at, at + .15, lt)), prop: { c, d: D }, smear: down > .2 && down < .95 ? [1] : null };
}
// put a prop in the hands: its local +y follows prop.d (handle direction), origin at prop.c (both torso space)
export function placeProp(obj, C, prop) { C.g.updateMatrixWorld(true); obj.visible = true; obj.position.copy(C.torso.localToWorld(new THREE.Vector3(...prop.c)));
  const q = new THREE.Quaternion(); C.torso.getWorldQuaternion(q); const dw = new THREE.Vector3(...prop.d).applyQuaternion(q).normalize(); obj.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dw); }
// fast repeated work"""
assert s.count(a)==1; s=s.replace(a,b)
open(p,'w').write(s); print('ok')
