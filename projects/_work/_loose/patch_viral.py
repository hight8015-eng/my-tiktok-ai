import sys; K=sys.argv[1]; p=K+'/main.js'; s=open(p).read()
i=s.index("function caption(t) {"); j=s.index("\n}\n", i)+3
new=r"""// v4.13 viral captions: each word pops in (overshoot), *word* or numbers are highlighted yellow (project.json captions: { pop, hi, y, size })
const CAP = { pop: true, hi: '#ffd23f', y: 1350, size: 70, ...(project.captions || {}) };
function caption(t) {
  const c = timing.caps.find(c => t >= c[0] && t < c[1]); if (!c) return;
  let txt = c[2]; const star = /\*(.+?)\*/.test(txt), hi = star || /[0-9๐-๙]/.test(txt) || (project.hiWords || []).some(w => txt.includes(w)); txt = txt.replace(/\*/g, '');
  const a = t - c[0], k = CAP.pop ? (a < .16 ? .55 + .45 * E.eOut(a / .16) + .12 * Math.sin(Math.PI * Math.min(1, a / .16)) : 1) : 1;
  X.save(); X.translate(540, CAP.y); X.scale(k, k); X.rotate(hi && CAP.pop ? Math.sin(a * 18) * .025 * Math.exp(-a * 6) : 0);
  X.font = `700 ${CAP.size * (hi ? 1.12 : 1)}px Prompt`; X.textAlign = 'center'; X.textBaseline = 'alphabetic'; X.lineJoin = 'round';
  X.shadowColor = 'rgba(0,0,0,.45)'; X.shadowBlur = 10; X.shadowOffsetY = 5; X.lineWidth = 13; X.strokeStyle = '#141018'; X.strokeText(txt, 0, 0);
  X.shadowColor = 'transparent'; X.fillStyle = hi ? CAP.hi : '#ffffff'; X.fillText(txt, 0, 0); X.restore();
}
// v4.13 hook banner for the first seconds (project.json hook: { text, sub, dur }) and an optional progress bar (project.json progressBar: true)
function hook(t) { const H = project.hook; if (!H || !H.text) return; const d = H.dur ?? 2.6; if (t > d) return;
  const a = E.eOut(Math.min(1, t / .25)), out = 1 - E.sstep(d - .3, d, t), k = (.6 + .4 * a + .06 * Math.sin(Math.min(1, t / .25) * Math.PI)) * (1 - .15 * (1 - out));
  X.save(); X.globalAlpha = out; X.translate(540, 300); X.scale(k, k); X.rotate(-.03 + Math.sin(t * 3) * .01);
  X.font = '700 78px Prompt'; const w = Math.min(980, X.measureText(H.text).width + 80), h = H.sub ? 190 : 130;
  X.fillStyle = '#ffd23f'; X.strokeStyle = '#141018'; X.lineWidth = 10; X.beginPath(); X.roundRect(-w / 2, -h / 2, w, h, 28); X.fill(); X.stroke();
  X.fillStyle = '#141018'; X.textAlign = 'center'; X.textBaseline = 'middle'; X.fillText(H.text, 0, H.sub ? -28 : 4, 940);
  if (H.sub) { X.font = '600 46px Prompt'; X.fillText(H.sub, 0, 46, 920); } X.restore(); }
function progress(t) { if (!project.progressBar) return; const u = Math.min(1, t / timing.end); X.save(); X.fillStyle = 'rgba(255,255,255,.18)'; X.fillRect(0, 1906, 1080, 14); X.fillStyle = '#ffd23f'; X.fillRect(0, 1906, 1080 * u, 14); X.restore(); }
"""
s=s[:i]+new+s[j:]
a="  if (!opts.nocap) caption(t);"; assert s.count(a)==1; s=s.replace(a,"  if (!opts.nocap) { caption(t); hook(t); } progress(t);")
open(p,'w').write(s)

p=K+'/chars.js'; s=open(p).read()
# head wobble from momentum (accessories on the head swing with it)
a="      C.torso.rotation.x += .035 * fwd - .0035 * af; C.torso.rotation.z -= .03 * side - .003 * as; C.head.rotation.x -= .005 * af; C.head.rotation.z += .004 * as; } }"
b="      C.torso.rotation.x += .035 * fwd - .0035 * af; C.torso.rotation.z -= .03 * side - .003 * as; C.head.rotation.x -= .005 * af; C.head.rotation.z += .004 * as;\n      C.hw = clamp(-.0045 * as - .02 * side, -.3, .3); C.hb = clamp(-.0012 * la.y, -.08, .08); } } // v4.13 head (+ hat/headband) lags and wobbles on starts/stops/turns"
assert s.count(a)==1; s=s.replace(a,b)
a="    const UH = new THREE.Vector3(0, 1, 0).transformDirection(C.hc.matrixWorld); const rollH = Math.atan2(-UH.dot(s_r), UH.y);"
b="    const UH = new THREE.Vector3(0, 1, 0).transformDirection(C.hc.matrixWorld); const rollH = Math.atan2(-UH.dot(s_r), UH.y) + (C.hw || 0) * (mir ? -1 : 1);"
assert s.count(a)==1; s=s.replace(a,b)
a="  const A = C._acc; C._acc = null; if (!A || A.w <= 1.01 * ANIM.wFinal || !C.g.visible || A.P.fast) { C._roots = []; return; }"
b="  C.hw = 0; C.hb = 0; const A = C._acc; C._acc = null; if (!A || A.w <= 1.01 * ANIM.wFinal || !C.g.visible || A.P.fast) { C._roots = []; return; }"
assert s.count(a)==1; s=s.replace(a,b)
# anti-clip for held objects
a="    h.obj.visible = true; h.obj.position.copy(pos); h.obj.quaternion.copy(q); } }"
b="""    if (h.noClip !== false) { const tp = C.torso.getWorldPosition(new THREE.Vector3()), d = pos.clone().sub(tp); d.y = 0; const R = (h.clear ?? .2) * sc; // v4.13 keep held props out of the body
      if (d.length() < R) { if (d.length() < 1e-4) d.set(0, 0, 1).applyQuaternion(C.g.getWorldQuaternion(new THREE.Quaternion())); d.y = 0; d.setLength(R); pos.x = tp.x + d.x; pos.z = tp.z + d.z; } }
    h.obj.visible = true; h.obj.position.copy(pos); h.obj.quaternion.copy(q); } }"""
assert s.count(a)==1; s=s.replace(a,b)
# walls in flyPath
a="  const ax = new THREE.Vector3(...axis).normalize(); return { p, q: new THREE.Quaternion().setFromAxisAngle(ax, ang), rest }; }"
b="""  for (const w of walls) { const k = w.axis === 'z' ? 2 : 0, n = w.n ?? 1; if ((p[k] - w.at) * n < 0) { p[k] = w.at + (w.at - p[k]) * (w.e ?? .5); ang *= -.6; } } // v4.13 bounce off walls (mirror with restitution)
  const ax = new THREE.Vector3(...axis).normalize(); return { p, q: new THREE.Quaternion().setFromAxisAngle(ax, ang), rest }; }"""
assert s.count(a)==1; s=s.replace(a,b)
s=s.replace("export function flyPath(age, p0, v0, { g = 9.8, floor = -1e9, e = .42, mu = 2.5, r = .08, spin = 8, axis = [1, 0, 0] } = {}) {","export function flyPath(age, p0, v0, { g = 9.8, floor = -1e9, e = .42, mu = 2.5, r = .08, spin = 8, axis = [1, 0, 0], walls = [] } = {}) {")
# ropes + flags
a="// fast repeated work"
b="""// v4.13 flexible things --------------------------------------------------------------
// rope / chain / leash between two world points: sags under gravity, sways, and lags when an end moves (pass vel of the moving end)
export function makeRope(color = '#8a6a44', r = .012, n = 16) { const m = new THREE.Mesh(new THREE.BufferGeometry(), toon(color, { grad: GRAD_FLAT })); m.castShadow = false; m.userData.n = n; m.userData.r = r; return m; }
export function updateRope(m, a, b, { sag = .25, t = 0, sway = .03, vel = null } = {}) { const n = m.userData.n, A = new THREE.Vector3(...(a.toArray ? a.toArray() : a)), B = new THREE.Vector3(...(b.toArray ? b.toArray() : b)), pts = [];
  const L = A.distanceTo(B), side = new THREE.Vector3().subVectors(B, A).cross(new THREE.Vector3(0, 1, 0)).normalize();
  for (let i = 0; i <= n; i++) { const u = i / n, p = A.clone().lerp(B, u), bell = 4 * u * (1 - u); p.y -= sag * L * bell; p.addScaledVector(side, Math.sin(t * 2.2 + u * 3) * sway * bell);
    if (vel) p.addScaledVector(new THREE.Vector3(...(vel.toArray ? vel.toArray() : vel)), -.06 * bell * u); pts.push(p); }
  m.geometry.dispose(); m.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n * 2, m.userData.r, 6, false); }
// flag / cloth / cape: a plane whose free edge ripples in the wind (attach edge = local x 0)
export function makeFlag(w = .5, h = .32, color = '#d8483e', map = null) { const g = new THREE.PlaneGeometry(w, h, 14, 6); g.translate(w / 2, 0, 0); const m = new THREE.Mesh(g, toon(color, { grad: GRAD_FLAT, side: THREE.DoubleSide, ...(map ? { map } : {}), unique: true }));
  m.userData.base = Float32Array.from(g.attributes.position.array); m.userData.w = w; m.castShadow = false; return m; }
export function waveFlag(m, t, { wind = 1, gust = .5 } = {}) { const P = m.geometry.attributes.position, B = m.userData.base, w = m.userData.w;
  for (let i = 0; i < P.count; i++) { const x0 = B[i * 3], y0 = B[i * 3 + 1], u = x0 / w, amp = u * u * .09 * wind * (1 + gust * Math.sin(t * .9));
    P.setXYZ(i, x0 * (1 - .06 * u * wind), y0 - u * u * .04 * (1.4 - wind), Math.sin(t * 6 * wind - x0 * 14) * amp + Math.sin(t * 3.1 + y0 * 9) * amp * .4); }
  P.needsUpdate = true; m.geometry.computeVertexNormals(); }
// fast repeated work"""
assert s.count(a)==1; s=s.replace(a,b)
open(p,'w').write(s); print('ok')
