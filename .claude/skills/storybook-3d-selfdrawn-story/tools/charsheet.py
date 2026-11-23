# python tools/charsheet.py [render_root=.] [--cast aren,noah] [--out out/charsheet] [--mk <series>/tools/mk_pm.py]
# v8 (M3, 2026-11-23) Character Approval Studio: one sheet per cast member, rendered by the engine itself (window.charpose), so the
# approved picture is exactly what the shots show. Sheet = Front / Quarter / Side / Back (studio light) + Front at night, the faces the
# episode uses (+ a base set), hair + outfit names (from the hair library / mk script), proportions (sprites.json), colour palette
# (from the drawn PNGs) and automatic QA (holes inside a drawing, pieces that are not connected, head size). Plus one line-up of the cast
# at the same scale. Writes <out>/<id>.png, <out>/lineup.png and <out>/sheets.json (what LOCK.json records on approval).
import argparse, json, os, re, subprocess, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage

ap = argparse.ArgumentParser(); ap.add_argument('root', nargs='?', default='.'); ap.add_argument('--cast'); ap.add_argument('--out', default='out/charsheet')
ap.add_argument('--mk', help="the series' mk script (hair / outfit names)"); a = ap.parse_args()
R = Path(a.root).resolve(); OUT = R / a.out; RAW = OUT / 'raw'; RAW.mkdir(parents=True, exist_ok=True)
P = json.loads((R / 'src/project.json').read_text(encoding='utf-8')); cast = P['cast']
if a.cast: want = a.cast.split(','); cast = [c for c in cast if c['id'] in want]
SPR = json.loads((R / 'src/sprites/sprites.json').read_text(encoding='utf-8'))
EXALL = set(re.findall(r"^\s+(\w+):", re.search(r"const EX = \{(.*?)\n\};", (R / 'src/chars.js').read_text(encoding='utf-8'), re.S).group(1), re.M))
used = set(re.findall(r"ex:\s*'(\w+)'", (R / 'src/shots.js').read_text(encoding='utf-8'))) | set(re.findall(r"\[\s*[\d.]+\s*,\s*'(\w+)'", (R / 'src/shots.js').read_text(encoding='utf-8')))
BASE = ['neutral', 'calm', 'smug', 'suspicious', 'stoic', 'angry', 'scared', 'surprised']
faces = [e for e in BASE if e in EXALL] + sorted(e for e in used & EXALL if e not in BASE)
faces = faces[:16]
hair_of, outfit_of = {}, {}
if a.mk and Path(a.mk).exists():                                                 # CH={'C01':(hair_aren,villager,(hexc('#1b1820'),)), ...
    src = Path(a.mk).read_text(encoding='utf-8')
    for cid, h, o, col in re.findall(r"'(C\d+)':\((\w+),(\w+),\(hexc\('(#[0-9a-fA-F]+)'\)", src): hair_of[cid] = h; outfit_of[cid] = f'{o} {col}'
    lib = Path(a.mk).with_name('hair_library.py')
    if lib.exists():
        for key, fn, name in re.findall(r"'(\w+)':\s*dict\(fn=(\w+),\s*name='([^']+)'", lib.read_text(encoding='utf-8')):
            for cid, h in list(hair_of.items()):
                if h == fn: hair_of[cid] = f'{key} — {name}'
# ---- 1. engine renders
jobs = []
for c in cast:
    cid = c['id']
    for v, ry in (('F', 0), ('Q', -45), ('S', -90), ('B', 180)): jobs.append(dict(file=f'{cid}_{v}.png', id=cid, ry=ry))
    jobs.append(dict(file=f'{cid}_night.png', id=cid, ry=0, light='night', bg='#1a1424'))
    for e in faces: jobs.append(dict(file=f'{cid}_ex_{e}.png', id=cid, ex=e, frame='head'))
    jobs.append(dict(file=f'{cid}_line.png', id=cid, ry=0, span=3.3, cy=1.55))
jf = RAW / 'jobs.json'; jf.write_text(json.dumps(jobs), encoding='utf-8')
env = dict(os.environ); r = subprocess.run(['node', 'src/render.js', 'charpose', str(RAW), str(jf)], cwd=R, capture_output=True, text=True, env=env)
if r.returncode or 'PAGEERR' in r.stdout + r.stderr: sys.exit('render failed:\n' + (r.stdout + r.stderr)[-1500:])
# ---- 2. measurements
def qa_sprite(path):
    im = np.asarray(Image.open(path).convert('RGBA'))[..., 3] > 127
    if not im.any(): return dict(holes=0, pieces=0)
    lab, n = ndimage.label(~im); border = set(np.unique(np.r_[lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    holes = sum(1 for k in range(1, n + 1) if k not in border and (lab == k).sum() > 40)
    lab2, m = ndimage.label(im); sizes = ndimage.sum(im, lab2, range(1, m + 1)); pieces = int((np.array(sizes) > 200).sum())
    return dict(holes=int(holes), pieces=pieces)
def palette(sid, k=6):
    px = []
    for v in 'FQSB':
        f = R / 'src/sprites' / f'{sid}-{v}-head.png'
        for part in ('head', 'body'):
            f = R / 'src/sprites' / f'{sid}-{v}-{part}.png'
            if f.exists():
                a_ = np.asarray(Image.open(f).convert('RGBA').resize((120, 120))); a_ = a_[a_[..., 3] > 200][:, :3]; px.append(a_)
    if not px: return []
    q = (np.concatenate(px) // 24) * 24 + 12; cols, cnt = np.unique(q, axis=0, return_counts=True)
    order = np.argsort(-cnt); out = []
    for i in order:
        c = cols[i]
        if all(np.abs(c - np.array(o)).sum() > 60 for o in out): out.append(tuple(int(x) for x in c))
        if len(out) >= k: break
    return ['#%02x%02x%02x' % c for c in out]
font = lambda s: ImageFont.truetype(str(R / 'src/fonts/Prompt-SemiBold.ttf'), s)
BG, FG, MU, OK, BAD = (24, 21, 30), (236, 231, 241), (167, 159, 178), (95, 209, 154), (255, 122, 112)
meta = {}
for c in cast:
    cid, sid = c['id'], c.get('sprite')
    Fm = SPR.get(f'{sid}-F', {}); head = Fm.get('head'); body = Fm.get('body')
    hh = (head[3] - head[1]) if head else 0; tot = (Fm.get('bot', 0) - Fm.get('top', 0)) + 1
    hb = round(tot / hh, 2) if hh else None                                       # figure height in head-heights (sprite part; legs are rigged)
    qa = {v: {p: qa_sprite(R / 'src/sprites' / f'{sid}-{v}-{p}.png') for p in ('head', 'body') if (R / 'src/sprites' / f'{sid}-{v}-{p}.png').exists()} for v in 'FQSB'}
    issues = [f'{v} {p}: {d["holes"]} hole(s)' for v, ps in qa.items() for p, d in ps.items() if d['holes']] + \
             [f'{v} {p}: {d["pieces"]} separate pieces' for v, ps in qa.items() for p, d in ps.items() if d['pieces'] > 1]
    meta[cid] = dict(sprite=sid, scale=c.get('s'), hair=hair_of.get(sid, '?'), outfit=outfit_of.get(sid, '?'), head_heights=hb, palette=palette(sid), faces=faces, qa=qa, issues=issues)
    # ---- 3. the sheet
    W, H = 2400, 1720; S = Image.new('RGB', (W, H), BG); d = ImageDraw.Draw(S)
    d.text((40, 24), f'{cid}  ·  {sid}', font=font(56), fill=FG); d.text((40, 96), 'Character Approval Studio · THE PUPPET MASTER', font=font(26), fill=MU)
    x = 40
    for v, lab in (('F', 'Front'), ('Q', 'Quarter'), ('S', 'Side'), ('B', 'Back'), ('night', 'Front · night')):
        im = Image.open(RAW / f'{cid}_{v}.png').convert('RGB'); im = im.crop((im.width * .14, 0, im.width * .86, im.height)).resize((300, 690)); S.paste(im, (x, 150)); d.text((x, 846), lab, font=font(24), fill=MU); x += 316
    y0 = 900; d.text((40, y0), 'Expressions', font=font(30), fill=FG)
    for i, e in enumerate(faces):
        im = Image.open(RAW / f'{cid}_ex_{e}.png').convert('RGB'); im = im.crop((0, im.height * .22, im.width, im.height * .78)).resize((180, 150))
        xx, yy = 40 + (i % 8) * 196, y0 + 48 + (i // 8) * 196; S.paste(im, (xx, yy)); d.text((xx, yy + 152), e, font=font(20), fill=MU)
    px = 1640; d.text((px, 150), 'Spec', font=font(30), fill=FG); yy = 200
    for k, v in (('Hair', meta[cid]['hair']), ('Outfit', meta[cid]['outfit']), ('Scale (s)', c.get('s')), ('Sprite height', f'{hb} head-heights (head + body sprite)')):
        d.text((px, yy), k, font=font(22), fill=MU); d.text((px, yy + 28), str(v)[:46], font=font(24), fill=FG); yy += 76
    d.text((px, yy + 10), 'Palette', font=font(22), fill=MU); yy += 46
    for i, hx in enumerate(meta[cid]['palette']):
        d.rectangle((px + i * 110, yy, px + i * 110 + 96, yy + 60), fill=hx); d.text((px + i * 110, yy + 66), hx, font=font(18), fill=MU)
    yy += 120; d.text((px, yy), 'Automatic QA', font=font(22), fill=MU); yy += 36
    if not issues: d.text((px, yy), 'PASS: no holes, every drawing is one piece', font=font(22), fill=OK)
    for it in issues[:10]: d.text((px, yy), 'CHECK ' + it, font=font(22), fill=BAD); yy += 32
    S.save(OUT / f'{cid}.png')
# ---- 4. line-up at one scale
ims = [Image.open(RAW / f"{c['id']}_line.png").convert('RGB') for c in cast]
w = 300; L = Image.new('RGB', (w * len(ims) + 80, 760), BG); dL = ImageDraw.Draw(L)
for i, (c, im) in enumerate(zip(cast, ims)):
    im = im.crop((im.width * .2, 0, im.width * .8, im.height)).resize((w, 660)); L.paste(im, (40 + i * w, 30)); dL.text((40 + i * w + 10, 700), c['id'], font=font(26), fill=FG)
L.save(OUT / 'lineup.png')
(OUT / 'sheets.json').write_text(json.dumps(meta, ensure_ascii=False, indent=1), encoding='utf-8')
print(f'{len(cast)} sheets + lineup -> {OUT}')
for cid, m in meta.items(): print(f"  {cid:8} {m['sprite']}  {'PASS' if not m['issues'] else 'CHECK: ' + '; '.join(m['issues'][:4])}")
