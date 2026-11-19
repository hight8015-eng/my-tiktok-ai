import sys; p=sys.argv[1]; s=open(p).read()
# body-level layers (all views), right after the base fill / stripes
a="  const pantsTop = cy + ch * (U.pantsAt ?? .72);"
b="""  const pantsTop = cy + ch * (U.pantsAt ?? .72), waist = cy + ch * (U.waistAt ?? .5);
  // v4.17 fantasy costume layers ---------------------------------------------------------------
  if (U.skirt) { x.fillStyle = U.skirt; x.beginPath(); x.moveTo(cx - 5, waist); x.lineTo(cx + cw + 5, waist); x.lineTo(cx + cw + 5, cy + ch + 5); x.lineTo(cx - 5, cy + ch + 5); x.fill();
    for (let k = 1; k < 6; k++) { const px = cx + cw * k / 6; line([[px + (px - mid) * .05, waist + ch * .06], [px + (px - mid) * .25, cy + ch]], thin * .7, 'rgba(34,34,58,.45)'); } line([[cx - 5, waist], [cx + cw + 5, waist]]); }
  if (U.tabard && front) { const w2 = cw * .2; poly([[X0 - w2, cy - 5], [X0 + w2, cy - 5], [X0 + w2 * 1.1, cy + ch + 5], [X0 - w2 * 1.1, cy + ch + 5]], U.tabard); }
  if (U.plate && front) { x.save(); x.beginPath(); x.ellipse(X0, cy + ch * .3, cw * .44, ch * .3, 0, 0, 7); x.fillStyle = U.plate; x.fill(); x.lineWidth = thin; x.strokeStyle = INK; x.stroke();
    x.beginPath(); x.ellipse(X0 - cw * .14, cy + ch * .22, cw * .12, ch * .08, -.5, 0, 7); x.fillStyle = 'rgba(255,255,255,.55)'; x.fill(); x.restore(); line([[X0, cy + ch * .06], [X0, cy + ch * .54]], thin * .6, 'rgba(34,34,58,.5)'); }
  if (U.robe && front) { const o = cw * (U.robeOpen ?? .1); x.fillStyle = U.inner || '#b0213a'; x.beginPath(); x.moveTo(X0 - o * .4, cy); x.quadraticCurveTo(X0 - o * 1.4, cy + ch * .5, X0 - o * 2.2, cy + ch + 5); x.lineTo(X0 + o * 2.2, cy + ch + 5); x.quadraticCurveTo(X0 + o * 1.4, cy + ch * .5, X0 + o * .4, cy); x.fill();
    for (const sg of [-1, 1]) { x.beginPath(); x.moveTo(X0 + sg * o * .4, cy); x.quadraticCurveTo(X0 + sg * o * 1.4, cy + ch * .5, X0 + sg * o * 2.2, cy + ch + 5); x.lineWidth = thin * 1.6; x.strokeStyle = U.trim || INK; x.stroke(); x.lineWidth = thin * .6; x.strokeStyle = INK; x.stroke(); } }
  if (U.stole && front) for (const sg of [-1, 1]) { const sx = X0 + sg * cw * .19; poly([[sx - cw * .06, cy - 5], [sx + cw * .06, cy - 5], [sx + cw * .07, cy + ch * .9], [sx - cw * .07, cy + ch * .9]], U.stole); line([[sx - cw * .07, cy + ch * .86], [sx + cw * .07, cy + ch * .86]], thin * 1.4, U.trim || '#e2b23c'); }
  if (U.mail) { x.strokeStyle = 'rgba(34,34,58,.25)'; x.lineWidth = 2; for (let yy = cy + 8; yy < cy + ch; yy += 14) for (let xx = cx + ((yy / 14) % 2) * 7; xx < cx + cw; xx += 14) { x.beginPath(); x.arc(xx, yy, 6, 0, Math.PI); x.stroke(); } }"""
assert s.count(a)==1; s=s.replace(a,b)
# front details: lacing, emblem, clasp, high collar, trim edge
a="  if (U.badge === 'tag') {"
b="""  if (U.lacing) { const y0 = ny + ch * .1, y1 = waist - ch * .03; for (let k = 0; k < 4; k++) { const ya = y0 + (y1 - y0) * k / 4, yb = y0 + (y1 - y0) * (k + 1) / 4; line([[X0 - cw * .06, ya], [X0 + cw * .06, yb]], thin * .7, U.lacing); line([[X0 + cw * .06, ya], [X0 - cw * .06, yb]], thin * .7, U.lacing); } }
  if (U.sash) { x.fillStyle = U.sash; x.fillRect(cx - 5, waist - ch * .045, cw + 10, ch * .07); line([[cx - 5, waist - ch * .045], [cx + cw + 5, waist - ch * .045]], thin * .7); line([[cx - 5, waist + ch * .025], [cx + cw + 5, waist + ch * .025]], thin * .7);
    x.fillStyle = U.gem || '#e2445a'; x.beginPath(); x.arc(X0, waist - ch * .01, cw * .045, 0, 7); x.fill(); x.lineWidth = thin * .7; x.strokeStyle = INK; x.stroke(); }
  if (U.emblem) { const ex_ = X0, ey_ = ny + ch * (U.plate ? .25 : .3), r = cw * .1, col = U.emblemC || '#e2b23c'; x.fillStyle = col; x.strokeStyle = INK; x.lineWidth = thin * .7;
    if (U.emblem === 'cross') { x.fillRect(ex_ - r * .25, ey_ - r, r * .5, r * 2); x.fillRect(ex_ - r * .8, ey_ - r * .45, r * 1.6, r * .5); x.strokeRect(ex_ - r * .25, ey_ - r, r * .5, r * 2); }
    else if (U.emblem === 'sun') { x.beginPath(); for (let k = 0; k < 16; k++) { const a = k / 16 * 6.283, rr = k % 2 ? r * .55 : r; x.lineTo(ex_ + Math.cos(a) * rr, ey_ + Math.sin(a) * rr); } x.closePath(); x.fill(); x.stroke(); }
    else if (U.emblem === 'eye') { x.beginPath(); x.ellipse(ex_, ey_, r, r * .55, 0, 0, 7); x.fill(); x.stroke(); x.fillStyle = INK; x.beginPath(); x.arc(ex_, ey_, r * .28, 0, 7); x.fill(); } }
  if (U.highCollar) for (const sg of [-1, 1]) poly([[X0 + sg * cw * .06, ny - 5], [X0 + sg * cw * .42, ny - 5], [X0 + sg * cw * .3, ny + ch * .13]], U.highCollar);
  if (U.clasp) { x.fillStyle = U.clasp; x.beginPath(); x.arc(X0, ny + ch * .07, cw * .05, 0, 7); x.fill(); x.lineWidth = thin * .7; x.strokeStyle = INK; x.stroke(); }
  if (U.badge === 'tag') {"""
assert s.count(a)==1; s=s.replace(a,b)
# edge trim, all views: after the uniform is drawn (in capsuleBody, before cel shade)
a="  drawUniform(x, { cx, cy, cw, ch, W, H, lw, INK }, U, view);"
b="  drawUniform(x, { cx, cy, cw, ch, W, H, lw, INK }, U, view);\n  if (U.edge) { x.lineWidth = lw * 2.2; x.strokeStyle = U.edge; path(); x.stroke(); } // coloured trim just inside the outline"
assert s.count(a)==1; s=s.replace(a,b)
open(p,'w').write(s); print('ok')
