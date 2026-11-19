import sys; K=sys.argv[1]; p=K+'/chars.js'; s=open(p).read()
# arms: shoulders at the top of the torso, rest hands hang close to the body
a="  for (const L of [C.aL, C.aR]) L.S.x = Math.sign(L.S.x) * .26;"
b="  for (const L of [C.aL, C.aR]) { L.S.x = Math.sign(L.S.x) * (spec.shoulderX ?? .23); L.S.y = spec.shoulderY ?? .84; } // v4.6 sheet: arms start right under the head"
assert s.count(a)==1; s=s.replace(a,b)
a="  const hL = P.hL ? (P.hL.isVector3 ? P.hL.clone() : new THREE.Vector3(...P.hL)) : new THREE.Vector3(-.36, .2 + Math.abs(sw) * .25, .06 - sw);\n  const hR = P.hR ? (P.hR.isVector3 ? P.hR.clone() : new THREE.Vector3(...P.hR)) : new THREE.Vector3(.36, .2 + Math.abs(sw) * .25, .06 + sw);"
b="  const hL = P.hL ? (P.hL.isVector3 ? P.hL.clone() : new THREE.Vector3(...P.hL)) : new THREE.Vector3(-.31, .32 + Math.abs(sw) * .25, .05 - sw); // v4.6: rest hands hang at the hips, close to the body\n  const hR = P.hR ? (P.hR.isVector3 ? P.hR.clone() : new THREE.Vector3(...P.hR)) : new THREE.Vector3(.31, .32 + Math.abs(sw) * .25, .05 + sw);"
assert s.count(a)==1; s=s.replace(a,b)
# face: big oval eyes (white + outline + pupil), wide smile
a="    if (kind === 'open' || kind === 'side') { const dx = kind === 'side' ? 11 * (spec.sideDir || 1) : lx; x.beginPath(); x.ellipse(cx + dx, cy + ly, 15, 21, 0, 0, 7); x.fill(); }"
b="""    if ((kind === 'open' || kind === 'side') && !spec.dotEyes) { const dx = kind === 'side' ? 13 * (spec.sideDir || 1) : lx * 1.4; // v4.6 sheet eyes: big white ovals, ink outline, pupil
      x.fillStyle = '#fbf8f2'; x.lineWidth = 10; x.beginPath(); x.ellipse(cx, cy - 4, 31, 42, 0, 0, 7); x.fill(); x.stroke();
      x.fillStyle = ink; x.beginPath(); x.ellipse(cx + 6 * s * 0 + dx + 3, cy + 6 + ly * 1.2, 13, 18, 0, 0, 7); x.fill(); x.fillStyle = '#ffffff'; x.beginPath(); x.arc(cx + dx - 1, cy - 2 + ly, 4.5, 0, 7); x.fill(); }
    else if (kind === 'open' || kind === 'side') { const dx = kind === 'side' ? 11 * (spec.sideDir || 1) : lx; x.beginPath(); x.ellipse(cx + dx, cy + ly, 15, 21, 0, 0, 7); x.fill(); }"""
assert s.count(a)==1; s=s.replace(a,b)
a="  if (m === 'smile') { x.beginPath(); x.moveTo(cx - 24, my - 2); x.quadraticCurveTo(cx, my + 16, cx + 24, my - 2); x.stroke(); }"
b="  if (m === 'smile') { const W = spec.dotEyes ? 24 : 58, D = spec.dotEyes ? 16 : 40; x.beginPath(); x.moveTo(cx - W, my - 10); x.quadraticCurveTo(cx, my + D, cx + W, my - 10); x.stroke(); } // v4.6 wide sheet smile"
assert s.count(a)==1; s=s.replace(a,b)
open(p,'w').write(s); print('ok')
