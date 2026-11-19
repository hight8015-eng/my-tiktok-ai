import sys; K=sys.argv[1]; p=K+'/chars.js'; s=open(p).read()
a="  C.sweat.visible = !!P.sweat; C.pop = P.pop || 0;"
b="  C._hold = P.hold || null; // v4.4 { R: { obj, off: [x,y,z], rot: [deg x,y,z] }, L: {...} } -> attached to the (smoothed) hand after posing\n  C.sweat.visible = !!P.sweat; C.pop = P.pop || 0;"
assert s.count(a)==1; s=s.replace(a,b)
a="// fast repeated work"
b="""// v4.4 objects in hands ------------------------------------------------------------
// attachHeld(C): called by main.js after smoothing; puts every P.hold object on its hand (offset/rotation in hand space)
const _q1 = new THREE.Quaternion(), _e1 = new THREE.Euler();
export function attachHeld(C) { const H = C._hold; if (!H || !C.g.visible) return;
  for (const [k, L_] of [['R', C.aR], ['L', C.aL]]) { const h = H[k]; if (!h || !h.obj) continue; const hand = L_.hand; hand.updateWorldMatrix(true, false);
    const hp = new THREE.Vector3(), hq = new THREE.Quaternion(); hand.getWorldPosition(hp); hand.getWorldQuaternion(hq);
    const off = new THREE.Vector3(...(h.off || [0, 0, 0])).multiplyScalar(C.g.getWorldScale(new THREE.Vector3()).x).applyQuaternion(hq);
    h.obj.visible = true; h.obj.position.copy(hp).add(off); _e1.set(...(h.rot || [0, 0, 0]).map(v => v * D2R)); h.obj.quaternion.copy(hq).multiply(_q1.setFromEuler(_e1)); } }
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
// fast repeated work"""
assert s.count(a)==1; s=s.replace(a,b)
open(p,'w').write(s)
p=K+'/main.js'; s=open(p).read()
s=s.replace("SPRG, ANIM, OVL, applySmooth } from './chars.js';","SPRG, ANIM, OVL, applySmooth, attachHeld } from './chars.js';")
a="  if (!window.NOSMOOTH) Object.values(CHARS).forEach(applySmooth);"
b="  if (!window.NOSMOOTH) Object.values(CHARS).forEach(applySmooth); E.scene.updateMatrixWorld(); Object.values(CHARS).forEach(attachHeld);"
assert s.count(a)==1; s=s.replace(a,b)
open(p,'w').write(s); print('ok')
