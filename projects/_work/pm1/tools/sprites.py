# python3 tools/sprites.py <flow_dir> : key green, 2x upscale, split head/body at the gap -> src/sprites/*.png + sprites.json
import sys, os, glob, json, numpy as np
from PIL import Image, ImageFilter
src = sys.argv[1]; out = os.path.join(os.path.dirname(__file__), '..', 'src', 'sprites'); os.makedirs(out, exist_ok=True)
meta = {}
for f in sorted(glob.glob(os.path.join(src, 'C[0-9][0-9]-[FQSB]*.jpg')) + glob.glob(os.path.join(src, 'C[0-9][0-9]-[FQSB]*.png'))):
    key = os.path.basename(f).split('_')[0].split('.')[0]  # C01-F
    im = Image.open(f).convert('RGB'); W0, H0 = im.size
    im = im.resize((W0 * 2, H0 * 2), Image.LANCZOS).filter(ImageFilter.UnsharpMask(2, 60, 2))
    a = np.asarray(im).astype(np.float32); H, W, _ = a.shape
    cs = np.concatenate([a[8:60, 8:60].reshape(-1, 3), a[8:60, -60:-8].reshape(-1, 3), a[-60:-8, 8:60].reshape(-1, 3), a[-60:-8, -60:-8].reshape(-1, 3)]); bg = np.median(cs, 0)
    d = np.sqrt(((a - bg) ** 2).sum(2))
    # green dominance helps on dark outline edges
    gd = a[:, :, 1] - np.maximum(a[:, :, 0], a[:, :, 2])
    al = np.clip((d - 45) / 50, 0, 1) * np.clip((140 - gd) / 60, 0, 1) ** 0  # distance key
    al = np.clip((d - 45) / 50, 0, 1)
    # despill on soft edges: clamp green to max(r,b) where it dominates
    sp = (gd > 0) & (al < .999)
    a[:, :, 1] = np.where(sp, np.maximum(a[:, :, 0], a[:, :, 2]) + gd * .15, a[:, :, 1])
    m = al > .5; rows = m.sum(1)
    ys = np.where(rows > 0)[0]; top, bot = ys.min(), ys.max()
    # gap: longest run of empty rows between 30% and 65% height
    empt = [y for y in range(int(H * .3), int(H * .65)) if rows[y] == 0]
    runs = []; s0 = None
    for y in empt:
        if s0 is None or y != p + 1:
            if s0 is not None: runs.append((s0, p))
            s0 = y
        p = y
    if s0 is not None: runs.append((s0, p))
    g0, g1 = max(runs, key=lambda r: r[1] - r[0]); gm = (g0 + g1) // 2
    rgba = np.dstack([a, al * 255]).clip(0, 255).astype(np.uint8)
    parts = {}
    for name, (y0, y1) in (('head', (top, gm)), ('body', (gm, bot + 1))):
        mm = m[y0:y1]; xs = np.where(mm.any(0))[0]; yy = np.where(mm.any(1))[0]
        x0, x1 = xs.min() - 6, xs.max() + 7; ya, yb = y0 + yy.min() - 6, y0 + yy.max() + 7
        x0, ya = max(0, x0), max(0, ya); x1, yb = min(W, x1), min(H, yb)
        Image.fromarray(rgba[ya:yb, x0:x1]).save(os.path.join(out, f'{key}-{name}.png'), optimize=True)
        parts[name] = [int(x0), int(ya), int(x1), int(yb)]
    # head ball: rows below the hat where the ivory ball is: estimate ball as the widest light run in lower 60% of head part
    hx0, hy0, hx1, hy1 = parts['head']; hb = a[hy0:hy1, hx0:hx1]; hm = m[hy0:hy1, hx0:hx1]
    ivory = (hb.min(2) > 175) & (np.abs(hb[:, :, 0] - hb[:, :, 2]) < 60) & hm
    wid = ivory.sum(1); yb_ = int(np.argmax(wid)); cols = np.where(ivory[yb_])[0]
    if wid.max() > 20:
        ball_cx = hx0 + (cols.min() + cols.max()) / 2; ball_r = (cols.max() - cols.min()) / 2
        ball_bot = hy0 + np.where(ivory.any(1))[0].max(); ball_cy = ball_bot - ball_r
    else:  # back view fully covered by hair: take the ball from the matching front view of the same character
        F = meta.get(key[:-1] + 'F'); ball_cx, ball_cy, ball_r = F['ball'] if F else ((hx0 + hx1) / 2, hy1 - (hx1 - hx0) * .45, (hx1 - hx0) * .45)
    meta[key] = dict(W=W, H=H, gap=[int(g0), int(g1)], top=int(top), bot=int(bot), head=parts['head'], body=parts['body'], ball=[round(float(ball_cx), 1), round(float(ball_cy), 1), round(float(ball_r), 1)])
    print(key, meta[key])
json.dump(meta, open(os.path.join(out, 'sprites.json'), 'w'), indent=0)
