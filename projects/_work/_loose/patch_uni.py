import sys; K=sys.argv[1]; p=K+'/chars.js'; s=open(p).read()
i=s.index("function capsuleBody(im, o) {"); j=s.index("export async function loadSprites() {")
new=r"""function capsuleBody(im, o, U, view = 'F') { const W = im.width, H = im.height, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  const cw = W * (o.w ?? .64), ch = H * .985, cx = (W - cw) / 2, cy = (H - ch) / 2, r = cw / 2, lw = Math.max(8, W * .03), bk = o.bottom ?? .8, INK = '#22223a';
  const path = () => { x.beginPath(); x.moveTo(cx, cy + r); x.arc(cx + r, cy + r, r, Math.PI, 0); x.lineTo(cx + cw, cy + ch - r * bk); x.ellipse(cx + r, cy + ch - r * bk, r, r * bk, 0, 0, Math.PI); x.closePath(); };
  x.save(); path(); x.clip();
  if (!U) U = autoUniform(im);
  drawUniform(x, { cx, cy, cw, ch, W, H, lw, INK }, U, view);
  const g = x.createLinearGradient(cx, 0, cx + cw, 0); g.addColorStop(0, 'rgba(255,255,255,.10)'); g.addColorStop(.35, 'rgba(255,255,255,0)'); g.addColorStop(.7, 'rgba(20,16,40,0)'); g.addColorStop(.72, 'rgba(20,16,40,.15)'); g.addColorStop(1, 'rgba(20,16,40,.2)');
  x.fillStyle = g; x.fillRect(cx, cy, cw, ch); x.restore(); // cel shade: lit left, shaded right band
  x.lineWidth = lw; x.strokeStyle = INK; path(); x.stroke(); return c; }
// v4.12 uniforms drawn to fit the capsule (refs): flat colours, bold simple details, thin navy lines.
//   U = { base, stripe, stripes: n, pants, belt, hem, collar: 'shirt'|'hood'|'round'|'vee'|null, inner, tie, bowtie, zip, vest, buttons: n,
//         pocket: 'kangaroo'|'chest'|'chest4'|null, badge: 'star'|'tag'|null, sideStripes, apron, scarf }
function autoUniform(im) { const c = document.createElement('canvas'), w = 48, h = 48; c.width = w; c.height = h; const x = c.getContext('2d'); x.drawImage(im, 0, 0, w, h); const d = x.getImageData(0, 0, w, h).data;
  const avg = (y0, y1) => { let r = 0, g = 0, b = 0, n = 0; for (let y = y0; y < y1; y++) for (let X = 12; X < 36; X++) { const k = (y * w + X) * 4; if (d[k + 3] < 200) continue; r += d[k]; g += d[k + 1]; b += d[k + 2]; n++; } return n ? [r / n, g / n, b / n] : [200, 200, 200]; };
  const hex = (a) => '#' + a.map(v => Math.round(v).toString(16).padStart(2, '0')).join(''), top = avg(10, 28), bot = avg(38, 46), diff = Math.abs(top[0] - bot[0]) + Math.abs(top[1] - bot[1]) + Math.abs(top[2] - bot[2]);
  return { base: hex(top), pants: diff > 90 ? hex(bot) : null, collar: 'round', buttons: 3 }; }
function drawUniform(x, G, U, view) { const { cx, cy, cw, ch, lw, INK } = G, mid = cx + cw / 2, front = view === 'F' || view === 'Q', dx = view === 'Q' ? cw * .17 : 0, X0 = mid + dx, thin = lw * .55;
  const line = (pts, w = thin, col = INK) => { x.lineWidth = w; x.strokeStyle = col; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(...p) : x.moveTo(...p)); x.stroke(); };
  const poly = (pts, fill, stroke = true) => { x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(...p) : x.moveTo(...p)); x.closePath(); x.fillStyle = fill; x.fill(); if (stroke) { x.lineWidth = thin; x.strokeStyle = INK; x.stroke(); } };
  x.fillStyle = U.base; x.fillRect(cx - 5, cy - 5, cw + 10, ch + 10);
  if (U.stripe) { const n = U.stripes || 9, bh = ch / n; x.fillStyle = U.stripe; for (let k = 1; k < n; k += 2) x.fillRect(cx - 5, cy + k * bh, cw + 10, bh); }
  const pantsTop = cy + ch * (U.pantsAt ?? .72);
  if (U.vest && front) { const half = cw * .13; x.fillStyle = U.inner || '#d9d6cc'; x.fillRect(X0 - half, cy - 5, half * 2, pantsTop - cy + 5); line([[X0 - half, cy], [X0 - half, pantsTop]]); line([[X0 + half, cy], [X0 + half, pantsTop]]); }
  if (U.apron && front) { x.fillStyle = U.apron; x.fillRect(X0 - cw * .3, cy + ch * .3, cw * .6, ch * .7); line([[X0 - cw * .3, cy + ch * .3], [X0 + cw * .3, cy + ch * .3]]); line([[X0 - cw * .2, cy], [X0 - cw * .24, cy + ch * .3]], thin * 1.6, U.apron); line([[X0 + cw * .2, cy], [X0 + cw * .24, cy + ch * .3]], thin * 1.6, U.apron); }
  if (U.sideStripes) { const ofs = front ? [X0 - cw * .34, X0 + cw * .34] : view === 'S' ? [mid] : [cx + cw * .2, cx + cw * .8]; for (const sx of ofs) line([[sx, cy], [sx, pantsTop]], cw * .05, U.sideStripes); }
  if (U.pants) { x.fillStyle = U.pants; x.fillRect(cx - 5, pantsTop, cw + 10, ch); line([[cx - 5, pantsTop], [cx + cw + 5, pantsTop]]); if (front) line([[X0, pantsTop + ch * .1], [X0, cy + ch]]); }
  if (U.belt) { x.fillStyle = U.belt; x.fillRect(cx - 5, pantsTop - ch * .05, cw + 10, ch * .05); line([[cx - 5, pantsTop - ch * .05], [cx + cw + 5, pantsTop - ch * .05]]); }
  if (U.hem) { x.fillStyle = U.hem; x.fillRect(cx - 5, cy + ch * .9, cw + 10, ch * .2); line([[cx - 5, cy + ch * .9], [cx + cw + 5, cy + ch * .9]]); }
  if (U.collar === 'hood' && !front) { line([[cx + cw * .12, cy + ch * .06], [mid, cy + ch * .2], [cx + cw * .88, cy + ch * .06]]); }
  if (!front) return;
  const ny = cy + ch * .02;
  if (U.collar === 'shirt') { poly([[X0 - cw * .2, ny], [X0, ny + ch * .1], [X0 - cw * .08, ny + ch * .16]], '#ffffff'); poly([[X0 + cw * .2, ny], [X0, ny + ch * .1], [X0 + cw * .08, ny + ch * .16]], '#ffffff'); }
  if (U.collar === 'vee') poly([[X0 - cw * .15, ny], [X0, ny + ch * .18], [X0 + cw * .15, ny]], U.inner || '#ffffff');
  if (U.collar === 'round') { x.beginPath(); x.ellipse(X0, ny, cw * .17, ch * .06, 0, 0, Math.PI); x.fillStyle = U.inner || 'rgba(0,0,0,.08)'; x.fill(); x.lineWidth = thin; x.strokeStyle = INK; x.stroke(); }
  if (U.collar === 'hood') { x.beginPath(); x.ellipse(X0, ny + ch * .02, cw * .24, ch * .09, 0, 0, Math.PI); x.lineWidth = thin; x.strokeStyle = INK; x.stroke(); for (const sx of [-1, 1]) { line([[X0 + sx * cw * .09, ny + ch * .08], [X0 + sx * cw * .1, ny + ch * .24]]); x.fillStyle = '#ffffff'; x.beginPath(); x.arc(X0 + sx * cw * .1, ny + ch * .25, cw * .025, 0, 7); x.fill(); x.stroke(); } }
  if (U.scarf) { x.fillStyle = U.scarf; x.beginPath(); x.ellipse(X0, ny + ch * .02, cw * .3, ch * .07, 0, 0, Math.PI); x.fill(); x.stroke(); poly([[X0 - cw * .06, ny + ch * .06], [X0 + cw * .02, ny + ch * .06], [X0 + cw * .04, ny + ch * .26], [X0 - cw * .07, ny + ch * .24]], U.scarf); }
  if (U.tie) poly([[X0 - cw * .05, ny + ch * .1], [X0 + cw * .05, ny + ch * .1], [X0 + cw * .07, ny + ch * .44], [X0, ny + ch * .52], [X0 - cw * .07, ny + ch * .44]], U.tie);
  if (U.bowtie) { poly([[X0, ny + ch * .08], [X0 - cw * .13, ny + ch * .03], [X0 - cw * .13, ny + ch * .14]], U.bowtie); poly([[X0, ny + ch * .08], [X0 + cw * .13, ny + ch * .03], [X0 + cw * .13, ny + ch * .14]], U.bowtie); }
  if (U.zip) line([[X0, ny + ch * .06], [X0, pantsTop]], thin * .9);
  if (U.buttons) for (let k = 0; k < U.buttons; k++) { const by = ny + ch * (.2 + k * .15); if (by > pantsTop - ch * .04) break; x.fillStyle = U.buttonC || '#e7c45a'; x.beginPath(); x.arc(X0 + (U.vest ? cw * .17 : 0), by, cw * .028, 0, 7); x.fill(); x.lineWidth = thin * .7; x.strokeStyle = INK; x.stroke(); }
  if (U.pocket === 'kangaroo') poly([[X0 - cw * .26, cy + ch * .66], [X0 + cw * .26, cy + ch * .66], [X0 + cw * .32, cy + ch * .82], [X0 - cw * .32, cy + ch * .82]], 'rgba(0,0,0,.06)');
  if (U.pocket === 'chest') { x.lineWidth = thin; x.strokeStyle = INK; x.strokeRect(X0 + cw * .1, ny + ch * .26, cw * .17, ch * .1); }
  if (U.pocket === 'chest4') for (const sx of [-1, 1]) for (const k of [0, 1]) { x.fillStyle = U.pocketC || 'rgba(0,0,0,.12)'; const px = X0 + sx * cw * .3 - cw * .09, py = ny + ch * (.26 + k * .2); x.fillRect(px, py, cw * .18, ch * .11); x.lineWidth = thin; x.strokeStyle = INK; x.strokeRect(px, py, cw * .18, ch * .11); }
  if (U.badge === 'star') { const bx = X0 + cw * .22, by = ny + ch * .2, R = cw * .07; x.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? R * .45 : R; x.lineTo(bx + Math.cos(a) * rr, by + Math.sin(a) * rr); } x.closePath(); x.fillStyle = '#f2c94c'; x.fill(); x.lineWidth = thin * .7; x.strokeStyle = INK; x.stroke(); }
  if (U.badge === 'tag') { x.fillStyle = '#ffffff'; const bx = X0 + cw * .12, by = ny + ch * .22; x.fillRect(bx, by, cw * .2, ch * .08); x.lineWidth = thin * .8; x.strokeStyle = INK; x.strokeRect(bx, by, cw * .2, ch * .08); x.fillStyle = '#2f5fb8'; x.beginPath(); x.arc(bx + cw * .1, by + ch * .04, cw * .03, 0, 7); x.fill(); }
}
"""
s=s[:i]+new+s[j:]
a="export async function loadSprites() {"
b="export async function loadSprites(cast = []) { const UNI = {}; for (const c of cast) if (c.uniform && c.sprite) UNI[c.sprite] = c.uniform;"
assert s.count(a)==1; s=s.replace(a,b)
a="    let t; if (ST_.capsule) { const im = await img(`sprites/${k}-body.png`); t = new THREE.CanvasTexture(capsuleBody(im, ST_.capsule)); }"
b="    let t; if (ST_.capsule) { const im = await img(`sprites/${k}-body.png`), [sp, view] = k.split('-'); t = new THREE.CanvasTexture(capsuleBody(im, ST_.capsule, UNI[sp], view)); }"
assert s.count(a)==1; s=s.replace(a,b)
# thinner limbs without hull outline
a="capsule: { w: .64, bottom: .8 }, sh: [.2, .74], rest: .18, limbW: .66, handR: .03, footK: .72 },"
assert s.count(a)==1; s=s.replace(a,"capsule: { w: .64, bottom: .8 }, sh: [.2, .74], rest: .18, limbW: .5, handR: .026, footK: .66, limbNoOutline: true },")
a="  const tube = (len, r, parent) => { const m = mesh(new THREE.CapsuleGeometry(r, len, 3, 8), inkM, { p: [0, -len / 2, 0], parent }); return m; };"
b="  const limbM = ST_.limbNoOutline ? toon(spec.limbC || '#262338', { grad: GRAD_FLAT }) : inkM; // v4.12 refs: thin limbs, no extra hull outline\n  const tube = (len, r, parent) => { const m = mesh(new THREE.CapsuleGeometry(r, len, 3, 8), limbM, { p: [0, -len / 2, 0], parent }); return m; };"
assert s.count(a)==1; s=s.replace(a,b)
# body sprite in front of the leg tops so legs come out from under the body
a=".addScaledVector(s_r, lx * s * Math.cos(rollB)).addScaledVector(s_v, -.14 * s);"
assert s.count(a)==1; s=s.replace(a,".addScaledVector(s_r, lx * s * Math.cos(rollB)).addScaledVector(s_v, (ST_.capsule ? .08 : -.14) * s); // v4.12: capsule body sits in front of the leg tops")
open(p,'w').write(s)
p=K+'/main.js'; s=open(p).read()
a="await E.fontsReady; await loadSprites();"; assert s.count(a)==1; s=s.replace(a,"await E.fontsReady; await loadSprites(project.cast);"); open(p,'w').write(s); print('ok')
