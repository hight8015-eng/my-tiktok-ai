# python tools/film_check.py [render_root=.] [--dump out/camdump.json] [--json out/film_check.json]
# v8 (M2, 2026-11-23): checks the PLAN before any render, from `node src/render.js camdump out/camdump.json` (seconds, no pictures).
# Camera gates = the same quantities as tools/cam_gates.py (which measures a finished video), computed from the real camera of every
# frame: speed = how far the picture moves in px per frame at 720x1280. Cut rate = shot changes + in-shot camera jumps, target from
# RicksClips (7 films measured with rea-video: median 3.05 shots / 10 s, range 1.5-4.1).
# Composition: first face on screen, heads cut by the frame edge, faces under the caption band, faces too small to read.
import argparse, json, sys
from pathlib import Path
import numpy as np

ap = argparse.ArgumentParser(); ap.add_argument('root', nargs='?', default='.'); ap.add_argument('--dump', default='out/camdump.json')
ap.add_argument('--json'); ap.add_argument('--band', default='0.58,0.76', help='caption band (share of the height)'); a = ap.parse_args()
R = Path(a.root); D = json.loads((R / a.dump).read_text(encoding='utf-8')); n = len(D); fps = 30.0; dur = n / fps
band = [float(v) for v in a.band.split(',')]
shot = [d.get('shot') for d in D]; sp = np.array([d['speed'] if d.get('speed') is not None else np.nan for d in D], float)
jump = np.nan_to_num(sp) > 200                                                  # a camera jump inside one shot reads as a cut (fast follows like a thrown knife run 60-120 px/f)
cut = np.array([i > 0 and (shot[i] != shot[i - 1] or jump[i]) for i in range(n)])
use = ~cut & ~np.isnan(sp); s = sp[use]; rest = (np.nan_to_num(sp) < 2) & use; dead = (np.nan_to_num(sp) < .3) & use
def runs(mask, min_len):
    out, k = [], 0
    while k < n:
        if mask[k]:
            j = k
            while j < n and mask[j]: j += 1
            if j - k >= min_len: out.append((k, j - k))
            k = j
        else: k += 1
    return out
rows = []
def gate(group, name, val, ok, warn, target, where=''): rows.append(dict(group=group, status='PASS' if ok else ('WARN' if warn else 'FAIL'), name=name, value=val, target=target, where=where))
rr = runs(rest, 6); tr = runs(use & (np.nan_to_num(sp) >= 2), 6); dr = runs(dead, 1)
rp = rest.sum() / max(1, use.sum()); gate('camera', 'at rest (<2 px/f), %', round(100 * rp, 1), rp >= .30, rp >= .21, '>= 30')
rps = len(rr) / dur * 10; gate('camera', 'rests per 10 s', round(rps, 2), 2.2 <= rps <= 4.5, rps >= .9, '2.2-4.5')
rm = float(np.median([L for _, L in rr])) / fps if rr else 0; gate('camera', 'rest length median, s', round(rm, 2), rm >= .6, rm >= .45, '>= 0.6')
lt = max([L for _, L in tr], default=0) / fps; gate('camera', 'longest travel, s', round(lt, 2), 3 <= lt <= 7 or dur < 30, lt <= 9.5, '3-7')
p50, p90, pk = (float(np.percentile(s, 50)), float(np.percentile(s, 90)), float(s.max())) if len(s) else (0, 0, 0)
gate('camera', 'speed median px/f', round(p50, 2), 2.0 <= p50 <= 6.1, 1.55 <= p50 <= 8.1, '~4 (2.5-6.1)')
gate('camera', 'speed p90 px/f', round(p90, 1), 15 <= p90 <= 27.4, 9.8 <= p90 <= 33.8, '~23 (9.8-33.8)')
dp = dead.sum() / max(1, use.sum()); gate('camera', 'dead still (<0.3 px/f), %', round(100 * dp, 1), dp <= .21, dp <= .29, '<= 21')
gate('camera', 'speed peak px/f', round(pk, 1), pk <= 60, pk <= 90, '<= 60')
cr = cut.sum() / dur * 10; gate('camera', 'cuts per 10 s', round(cr, 2), 1.5 <= cr <= 4.1, cr <= 5.0, '1.5-4.1, aim 3 (RicksClips)')
lg = max([L for _, L in dr], default=0); k0 = next((k for k, L in dr if L == lg), 0)
gate('camera', 'longest dead-still stretch, f', lg, lg < 12, lg < 24, '< 12 (needs a creeping push-in)', f'{k0 / fps:.1f}s {shot[k0] if n else ""}')
# ---- composition (characters on screen)
first = next((i for i, d in enumerate(D) if d.get('chars')), None); ft = first / fps if first is not None else None
gate('framing', 'first face on screen, s', None if ft is None else round(ft, 2), ft is not None and ft <= 1.5, ft is not None and ft <= 3, '<= 1.5')
edge, capb, tiny = {}, {}, {}
for i, d in enumerate(D):
    for c in d.get('chars', []):
        x, y, r = c['x'], c['y'], c['r']; ry = r * 9 / 16                       # r is a share of the width; in height units * 9/16
        if r > .03 and (x - r < -.01 or x + r > 1.01 or y - ry < -.01): edge.setdefault(d['shot'], set()).add(c['id'])
        if band[0] < y < band[1] and r > .04: capb.setdefault(d['shot'], set()).add(c['id'])
        if r < .025: tiny.setdefault(d['shot'], set()).add(c['id'])
fmt = lambda m: ', '.join(f"{k}:{'/'.join(sorted(v))}" for k, v in list(m.items())[:8])
gate('framing', 'heads cut by the frame edge (shots)', len(edge), not edge, len(edge) <= 3, '0 (unless a planned extreme close-up)', fmt(edge))
gate('framing', 'faces under the caption band (shots)', len(capb), not capb, len(capb) <= 3, '0', fmt(capb))
gate('framing', 'faces too small to read (shots)', len(tiny), True if len(tiny) <= 3 else False, True, 'heads >= 2.5 % of width', fmt(tiny))
# ---- motion (v8.2 M4): from `node src/motion_audit.js out/motion_audit.json` samples, a character on screen whose root, head and both
#      hands all move less than 2 cm/s for more than 60 % of a shot reads as frozen (the user's ep3 note: stiff payment scene)
ma = R / 'out/motion_audit.json'
if ma.exists():
    S_ = json.loads(ma.read_text(encoding='utf-8')); byk = {}
    for smp in S_: byk.setdefault((smp['shot'], smp['id']), []).append(smp)
    frozen = {}
    for (shid, cid), L in byk.items():
        L.sort(key=lambda q: q['t']); still = 0
        for a_, b_ in zip(L, L[1:]):
            dt = max(1e-6, b_['t'] - a_['t']); v = max(np.linalg.norm(np.subtract(b_[k], a_[k])) / dt for k in ('root', 'head', 'hl', 'hr'))
            still += v < .02
        if len(L) > 3 and still / (len(L) - 1) > .6: frozen.setdefault(shid, []).append(cid)
    gate('motion', 'shots with a frozen character', len(frozen), not frozen, len(frozen) <= 2, '0 (> 60 % of the shot without any movement)', fmt({k: set(v) for k, v in frozen.items()}))
# ---- per-shot summary: longest dead stretch per shot (where a push-in is missing)
per = {}
for k, L in dr:
    if L >= 12: per[shot[k]] = max(per.get(shot[k], 0), L)
print(f'{R.resolve()}: {n} frames ({dur:.1f} s), {len(set(shot))} shots, {int(cut.sum())} cuts (incl. {int(jump.sum())} in-shot jumps)')
for r in rows: print(f"{r['status']:4}  {r['group']:7}  {r['name']:38} {str(r['value']):>7}   target {r['target']}" + (f"   [{r['where']}]" if r['where'] else ''))
if per: print('shots that freeze >= 12 f (add a push-in): ' + ', '.join(f'{k} {v}f' for k, v in sorted(per.items(), key=lambda x: -x[1])[:12]))
c = {k: sum(r['status'] == k for r in rows) for k in ('PASS', 'WARN', 'FAIL')}; print('PASS %(PASS)d  WARN %(WARN)d  FAIL %(FAIL)d' % c)
if a.json: Path(a.json).write_text(json.dumps({'rows': rows, 'freeze_shots': per, 'cuts': int(cut.sum())}, ensure_ascii=False, indent=1), encoding='utf-8')
sys.exit(1 if c['FAIL'] else 0)
