import sys; K=sys.argv[1]; p=K+'/chars.js'; s=open(p).read()
a="""function sprMesh() {
  const m = new THREE.MeshLambertMaterial({ alphaTest: .5, side: THREE.DoubleSide, emissive: 0xffffff, emissiveIntensity: .32 }); noOutline(m);
  const me = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m); me.castShadow = false; me.receiveShadow = false;"""
b="""// v4.7 chibi body: the costume sprite is warped into an inverted pear (narrow shoulders, full rounded bottom), keeping its art
export const BODY = { w: .86, h: .9, top: .7, bottom: 1.1, head: 1.14 };
function pearGeo() { const g = new THREE.PlaneGeometry(1, 1, 12, 16), P = g.attributes.position;
  for (let i = 0; i < P.count; i++) { const v = P.getY(i) + .5, sstep_ = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    const prof = BODY.bottom + (BODY.top - BODY.bottom) * sstep_(.22, 1, v), tuck = 1 - .14 * (1 - sstep_(0, .16, v)); P.setX(i, P.getX(i) * prof * tuck); }
  P.needsUpdate = true; return g; }
function sprMesh(pear = false) {
  const m = new THREE.MeshLambertMaterial({ alphaTest: .5, side: THREE.DoubleSide, emissive: 0xffffff, emissiveIntensity: .32 }); noOutline(m);
  const me = new THREE.Mesh(pear ? pearGeo() : new THREE.PlaneGeometry(1, 1), m); me.castShadow = false; me.receiveShadow = false;"""
assert s.count(a)==1; s=s.replace(a,b)
a="  C.sb = sprMesh(); C.sh = sprMesh(); C.sh.renderOrder = 1; SPRG.add(C.sb, C.sh);"
b="  C.sb = sprMesh(!spec.classicBody); C.sh = sprMesh(); C.sh.renderOrder = 1; SPRG.add(C.sb, C.sh); C.bodyK = spec.classicBody ? { w: 1, h: 1, head: 1 } : BODY;"
assert s.count(a)==1; s=s.replace(a,b)
a="    const sq = clamp(C.sq || 0, -.45, .6), bh = (y1 - y0) * K2 * s; cb.y += bh / 2 * sq; // v4 squash/stretch, feet "
i=s.index(a); j=s.index("\n",i)
s=s[:i]+"    const BK = C.bodyK || { w: 1, h: 1, head: 1 }, sq = clamp(C.sq || 0, -.45, .6), bh0 = (y1 - y0) * K2 * s, bh = bh0 * BK.h; cb.y += -(bh0 - bh) / 2 + bh / 2 * sq; // v4 squash/stretch, feet stay planted; v4.7 shorter torso keeps its hem"+s[j:]
a="    place(C.sb, cb, yaw, rollB, (x1 - x0) * K2 * s * (1 - (C.br || 0) * .5) * (1 - sq * .5) * turnW,"
b="    place(C.sb, cb, yaw, rollB, (x1 - x0) * K2 * s * BK.w * (1 - (C.br || 0) * .5) * (1 - sq * .5) * turnW,"
assert s.count(a)==1; s=s.replace(a,b)
a="    const neck = cb.clone().addScaledVector(upB, (y1 - y0) / 2 * K2 * s * (1 + sq))"
b="    const neck = cb.clone().addScaledVector(upB, bh / 2 * (1 + sq))"
assert s.count(a)==1; s=s.replace(a,b)
open(p,'w').write(s); print('ok')
