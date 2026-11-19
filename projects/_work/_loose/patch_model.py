import sys; K=sys.argv[1]; p=K+'/chars.js'; s=open(p).read()
a="""  const arm = (s) => { const up = group({ parent: torso }), fo = group({ parent: torso }); tube(AL, .007, up); tube(AL, .007, fo);
    const hand = mesh(new THREE.SphereGeometry(.032, 12, 10), inkM, { p: [0, -AL, 0], parent: fo }); return { up, fo, hand, S: new THREE.Vector3(s * .22, .72, 0) }; };
  const leg = (s) => { const up = group({ parent: hips }), fo = group({ parent: hips }); tube(LL, .008, up); tube(LL, .008, fo);
    const shoe = mesh(new THREE.SphereGeometry(.045, 12, 8), inkM, { p: [0, -LL, .04], s: [.85, .55, 1.6], parent: fo }); return { up, fo, shoe, S: new THREE.Vector3(s * .11, 0, 0) }; };"""
b="""  // v4.2 model: thicker rubber-hose limbs with round joints, cartoon gloves (thumb + cuff) and rounded shoes. spec.classic = old hair-thin sticks
  const CL = !!spec.classic, rA = CL ? .007 : (spec.limbW || 1) * .015, rL = CL ? .008 : (spec.limbW || 1) * .018;
  const gloveM = toon(spec.glove || '#f7f2e8', { grad: GRAD_FLAT, ol: OL * .8 }), shoeM = toon(spec.shoe || '#2b2233', { grad: GRAD_2, ol: OL * .8 }), soleM = toon(spec.sole || '#e9e1d4', { grad: GRAD_FLAT, ol: OL * .6 });
  const arm = (s) => { const up = group({ parent: torso }), fo = group({ parent: torso }); tube(AL, rA, up); tube(AL, rA * .9, fo);
    let hand; if (CL) hand = mesh(new THREE.SphereGeometry(.032, 12, 10), inkM, { p: [0, -AL, 0], parent: fo });
    else { hand = group({ p: [0, -AL - .02, 0], parent: fo }); mesh(new THREE.SphereGeometry(.052, 16, 12), gloveM, { s: [1, 1.12, .78], parent: hand });
      mesh(new THREE.SphereGeometry(.022, 10, 8), gloveM, { p: [s * -.045, .018, .02], s: [1, 1.5, 1], r: [0, 0, s * 35], parent: hand });
      mesh(new THREE.CylinderGeometry(.04, .036, .03, 14), gloveM, { p: [0, .052, 0], parent: hand }); }
    return { up, fo, hand, S: new THREE.Vector3(s * .22, .72, 0) }; };
  const leg = (s) => { const up = group({ parent: hips }), fo = group({ parent: hips }); tube(LL, rL, up); tube(LL, rL * .92, fo);
    let shoe; if (CL) shoe = mesh(new THREE.SphereGeometry(.045, 12, 8), inkM, { p: [0, -LL, .04], s: [.85, .55, 1.6], parent: fo });
    else { shoe = group({ p: [0, -LL - .005, .045], parent: fo }); mesh(new THREE.SphereGeometry(.06, 16, 10), shoeM, { s: [.95, .62, 1.55], parent: shoe });
      mesh(new THREE.CylinderGeometry(.058, .058, .018, 16), soleM, { p: [0, -.03, 0], s: [.95, 1, 1.55], parent: shoe }); }
    return { up, fo, shoe, S: new THREE.Vector3(s * .11, 0, 0) }; };"""
assert s.count(a)==1; s=s.replace(a,b)
open(p,'w').write(s); print('ok')
