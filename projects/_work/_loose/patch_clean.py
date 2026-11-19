import sys; K=sys.argv[1]; p=K+'/src/main.js'; s=open(p).read()
# FX level knob
a="const CAP = { pop: true, hi: '#ffd23f', y: 1350, size: 70, ...(project.captions || {}) };"
b="""const CAP = { pop: true, hi: '#ffd23f', y: 1350, size: 70, maxW: 860, ...(project.captions || {}) };
// v4.14 one knob for all automatic effects (0 = clean .. 1 = loud); default .7 keeps it lively but uncluttered
const FXL = Math.max(0, Math.min(1, project.fxLevel ?? .7)); E.POST.grain = .025 * FXL;
// seamless loop: the last LOOP_D seconds dissolve into the opening frame so replays feel continuous (project.loop = false to end on black)
const LOOP = project.loop !== false, LOOP_D = .45; let ZP = 1;"""
assert s.count(a)==1; s=s.replace(a,b)
s=s.replace("const a = (1 - E.sstep(.35, .75, f.lt)) * E.sstep(0, .06, f.lt); if (a <= 0) return;","const a = (1 - E.sstep(.35, .75, f.lt)) * E.sstep(0, .06, f.lt) * Math.min(1, FXL * 1.3); if (a <= 0 || FXL < .25) return;")
s=s.replace("const a = Math.min(1, (L - 70) / 120) * alpha; X.save(); X.lineCap = 'round';","const a = Math.min(1, (L - 70) / 120) * alpha * Math.min(1, .4 + FXL); X.save(); X.lineCap = 'round';")
# caption safe width + keyword zoom pulse value
s=s.replace("X.strokeText(txt, 0, 0);\n  X.shadowColor = 'transparent'; X.fillStyle = hi ? CAP.hi : '#ffffff'; X.fillText(txt, 0, 0); X.restore();",
            "X.strokeText(txt, 0, 0, CAP.maxW);\n  X.shadowColor = 'transparent'; X.fillStyle = hi ? CAP.hi : '#ffffff'; X.fillText(txt, 0, 0, CAP.maxW); X.restore();")
a="  X.save(); X.translate(540, CAP.y); X.scale(k, k);"
assert s.count(a)==1; s=s.replace(a,"  X.save(); X.translate(520, CAP.y); X.scale(k, k); // safe zone: a touch left of the app's right-hand buttons")
# zoom pulse applied when drawing the 3D frame
a="  if (FX && FX.lt < .32) {"
assert s.count(a)==1; s=s.replace(a,"  if (!(FX && FX.lt < .32) && ZP > 1.0005) { X.drawImage(E.glc, 540 * (1 - ZP), 860 * (1 - ZP), 1080 * ZP, 1920 * ZP); } else\n  if (FX && FX.lt < .32) {")
# compute ZP in frame(), loop dissolve, no black when looping
a="window.frame = (t, opts = {}) => {"
i=s.index(a); s=s[:i]+"""function keyZoom(t) { const c = timing.caps.find(c => t >= c[0] && t < c[1]); if (!c) return 1; const hi = /\\*(.+?)\\*/.test(c[2]) || /[0-9๐-๙]/.test(c[2]) || (project.hiWords || []).some(w => c[2].includes(w));
  const a = t - c[0]; return hi ? 1 + .028 * FXL * Math.sin(Math.PI * Math.min(1, a / .45)) : 1; } // gentle push-in on highlighted words
"""+s[i:]
s=s.replace("window.frame = (t, opts = {}) => { window.PROF={}; const _f0=performance.now();","window.frame = (t, opts = {}) => {") # (profiling leftovers, if any)
a="window.frame = (t, opts = {}) => {"; assert s.count(a)==1; s=s.replace(a,"window.frame = (t, opts = {}) => { ZP = keyZoom(t);")
a="  if (t > timing.end - .25) { X.fillStyle = `rgba(0,0,0,${E.clamp((t - (timing.end - .25)) / .25)})`; X.fillRect(0, 0, 1080, 1920); }"
b="""  if (LOOP && t > timing.end - LOOP_D) { const k = E.eSine((t - (timing.end - LOOP_D)) / LOOP_D); ZP = 1; draw(SHOTS[0], 0, k); }
  else if (!LOOP && t > timing.end - .25) { X.fillStyle = `rgba(0,0,0,${E.clamp((t - (timing.end - .25)) / .25)})`; X.fillRect(0, 0, 1080, 1920); }"""
assert s.count(a)==1; s=s.replace(a,b)
open(p,'w').write(s)
p=K+'/tools/postmeta.py'; s=open(p).read()
a="lines += ['ติดตามตอนต่อไป 👉 กดติดตามไว้เลย', '', ' '.join('#' + t for t in tags)]"
b="""q = P.get('question') or 'คิดว่าตอนต่อไปจะเป็นยังไง? คอมเมนต์บอกหน่อย 👇'   # a question in the caption drives comments
lines += [q, 'ติดตามตอนต่อไป 👉 กดติดตามไว้เลย', '', ' '.join('#' + t for t in tags)]"""
assert s.count(a)==1; s=s.replace(a,b); open(p,'w').write(s); print('ok')
