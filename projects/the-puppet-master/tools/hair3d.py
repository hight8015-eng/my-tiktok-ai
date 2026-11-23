# hair3d.py (v8 M3, 2026-11-24): every hairstyle is ONE 3D hair model on the head, and each view (F / Q / S / B, and the mirrored side)
# is an orthographic projection of that same model (user rules: silhouette consistency, strand continuity, depth preservation; no
# flattening, no spikes that vanish between views, no helmet hair).
#
# Model space (design units, same scale as mk_pm.py): head = sphere radius R at (0,0,0); +X = screen right in the front view,
# +Y = up, +Z = toward the camera in the front view (the face). Screen: x = CX + X, y = 600 - Y. A view turns the model about Y:
# Q = 38 deg, S = 78 deg (face to screen-left), B = 180 deg.
#   shell   : the hair volume hugging the skull, thickness t, above a hairline (design-y of the hair edge by angle from the face)
#   spike   : a cone growing out of the shell (base on the shell, a direction, a length, a base radius)
#   strand  : a tapered curved lock (bangs, side locks) given as model points + radii
#   puff    : a ball of hair (curls)
# Pieces are unioned into one shape with one ink outline; pieces behind the head are hidden by a depth test against the skull.
import math
import numpy as np
from scipy import ndimage
from PIL import Image, ImageDraw
from pm_draw import CX, K, W, H, INK, LW, shade

R = 218.0
YAWS = {'F': 0.0, 'Q': 38.0, 'S': 78.0, 'B': 180.0}

def rot(p, yaw):                                    # model -> view: turn about Y so the face direction (0,0,1) goes to (-sin, 0, cos)
    a = -math.radians(yaw); c, s = math.cos(a), math.sin(a); x, y, z = p
    return (x * c + z * s, y, -x * s + z * c)
def sph(az, el, r):                                 # point on a sphere: az from the face (+ = screen right in F), el up from the equator
    a, e = math.radians(az), math.radians(el)
    return (r * math.cos(e) * math.sin(a), r * math.sin(e), r * math.cos(e) * math.cos(a))
def norm(v): l = math.sqrt(sum(c * c for c in v)) or 1; return tuple(c / l for c in v)
def frame(az, el):                                  # outward normal, east (toward +az), north (toward +el) at a sphere point
    n = norm(sph(az, el, 1)); a, e = math.radians(az), math.radians(el)
    east = (math.cos(a), 0.0, -math.sin(a)); north = (-math.sin(e) * math.sin(a), math.cos(e), -math.sin(e) * math.cos(a))
    return n, east, north
def hairline(front=474, side=620, back=690):        # design-y of the hair edge vs. angle from the face (forehead, temple, sideburn, behind ear, nape)
    return [(0, front), (50, front + 12), (68, side - 50), (84, side), (100, side - 34), (118, back - 22), (150, back - 4), (180, back)]

class Hair:
    def __init__(self, col, t=22, hl=(474, 620, 690)):
        self.col, self.t, self.hl = col, t, hairline(*hl); self.parts = []
    def spike(self, az, el, length, width, up=0.0, side=0.0, out=1.0, bend=0.0):
        """cone from the shell at (az, el): direction = outward normal tilted `up` deg toward the crown/back (+north) and `side` deg
        sideways (+east); `bend` curls the tip further the same way (deg)"""
        n, e, no = frame(az, el); base = sph(az, el, R + self.t * .55)
        def dirv(extra):
            u, s_ = math.radians(up + extra), math.radians(side)
            return norm(tuple(n[i] * math.cos(u) * math.cos(s_) * out + no[i] * math.sin(u) + e[i] * math.sin(s_) for i in range(3)))
        mid = tuple(base[i] + dirv(0)[i] * length * .55 for i in range(3)); tip = tuple(mid[i] + dirv(bend)[i] * length * .45 for i in range(3))
        self.parts.append(('tube', [base, mid, tip], [width, width * .55, 1.5], True)); return self
    def strand(self, pts, radii, line=True):
        """a lock through model points (use sph() for points on the head) with a radius at each point"""
        self.parts.append(('tube', pts, radii, line)); return self
    def puff(self, az, el, r, lift=0.0):
        self.parts.append(('ball', sph(az, el, R + self.t * .4 + lift), r)); return self

def _circle(c, d, r, n=14):                          # points of a circle of radius r around c, perpendicular to direction d
    d = norm(d); a = (0, 1, 0) if abs(d[1]) < .9 else (1, 0, 0)
    u = norm((d[1] * a[2] - d[2] * a[1], d[2] * a[0] - d[0] * a[2], d[0] * a[1] - d[1] * a[0])); v = (d[1] * u[2] - d[2] * u[1], d[2] * u[0] - d[0] * u[2], d[0] * u[1] - d[1] * u[0])
    return [tuple(c[i] + r * (math.cos(2 * math.pi * k / n) * u[i] + math.sin(2 * math.pi * k / n) * v[i]) for i in range(3)) for k in range(n)]
def _hull(pts):
    pts = sorted(set(pts))
    if len(pts) < 3: return pts
    cross = lambda o, a, b: (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); lo, up = [], []
    for p in pts:
        while len(lo) >= 2 and cross(lo[-2], lo[-1], p) <= 0: lo.pop()
        lo.append(p)
    for p in reversed(pts):
        while len(up) >= 2 and cross(up[-2], up[-1], p) <= 0: up.pop()
        up.append(p)
    return lo[:-1] + up[:-1]

def render(d, hair, view, mirror=False):
    """draw `hair` for one view onto the mk_pm canvas `d` (mirror = the other side, for the right-side view)"""
    yaw = YAWS[view]; t = hair.t; sgn = -1 if mirror else 1
    pad = 260; x0, y0 = int((CX - R - pad) * K), int((600 - R - pad - 60) * K); x1, y1 = int((CX + R + pad) * K), int((600 + R + 120) * K)
    gx, gy = np.meshgrid((np.arange(x0, x1) / K - CX) * sgn, 600 - np.arange(y0, y1) / K)       # view-space X, Y of every pixel
    rr2 = gx * gx + gy * gy
    zhead = np.sqrt(np.clip(R * R - rr2, 0, None)); inhead = rr2 < R * R
    # ---- shell: front hit of the outer sphere, and (in the rim band) the back hit; hair where that point is above the hairline
    Ro = R + t; ins = rr2 <= Ro * Ro; zo = np.sqrt(np.clip(Ro * Ro - rr2, 0, None))
    angs = [a for a, _ in hair.hl]; ysl = [y for _, y in hair.hl]
    a_ = -math.radians(-yaw); c_, s_ = math.cos(a_), math.sin(a_)         # view -> model is the inverse turn
    def cap_at(z):
        mx = gx * c_ + z * s_; mz = -gx * s_ + z * c_
        az = np.degrees(np.abs(np.arctan2(mx, mz))); edge_y = 600 - np.interp(az, angs, ysl)   # model Y of the hairline at that azimuth
        return gy * (R / Ro) > edge_y                                       # the same direction on the skull is above the hairline
    cap = ins & (cap_at(zo) | (~inhead & cap_at(-zo)))
    mask = cap.copy(); lines = []
    # ---- pieces, depth-tested against the skull
    for p in hair.parts:
        m = Image.new('L', (x1 - x0, y1 - y0), 0); dr = ImageDraw.Draw(m); zs = []
        if p[0] == 'tube':
            pts = [rot(q, yaw) for q in p[1]]; radii = p[2]
            for i in range(len(pts) - 1):
                a, b = pts[i], pts[i + 1]; dvec = tuple(b[k] - a[k] for k in range(3))
                ring = _circle(a, dvec, radii[i]) + _circle(b, dvec, max(radii[i + 1], .8))
                poly = _hull([(round(q[0], 2), round(q[1], 2)) for q in ring])
                dr.polygon([((CX + sgn * x) * K - x0, (600 - y) * K - y0) for x, y in poly], fill=255); zs += [a[2], b[2]]
            if p[3]: lines.append(pts)
        else:
            c = rot(p[1], yaw); r = p[2]; zs = [c[2]]
            dr.ellipse(((CX + sgn * c[0] - r) * K - x0, (600 - c[1] - r) * K - y0, (CX + sgn * c[0] + r) * K - x0, (600 - c[1] + r) * K - y0), fill=255)
        pm = np.asarray(m) > 127
        hidden = inhead & (max(zs) < zhead - 6)                     # behind the skull where the skull covers it
        mask |= pm & ~hidden
    # ---- no pockets: background enclosed between the hair and the head (seen as holes in a turned view) becomes hair
    disk = rr2 <= (R - 4) ** 2
    both = mask | disk; mask |= ndimage.binary_fill_holes(both) & ~both
    # ---- one piece, one weighted ink outline (as pm_draw.poly)
    lw = LW; ox, oy = int(lw * .55), int(lw * .5)
    sh = np.zeros_like(mask); sh[oy:, ox:] = mask[:-oy, :-ox]
    half = lw * .6 / 2; din = ndimage.distance_transform_edt(mask); dout = ndimage.distance_transform_edt(~mask)
    ink = (sh & ~mask) | ((din > 0) & (din <= half)) | ((dout > 0) & (dout <= half)); fill = mask & ~ink
    im = d._image; box = im.crop((x0, y0, x1, y1))
    box.paste(Image.new('RGB', box.size, INK), (0, 0), Image.fromarray((ink * 255).astype('uint8')))
    box.paste(Image.new('RGB', box.size, hair.col), (0, 0), Image.fromarray((fill * 255).astype('uint8')))
    # background left enclosed between this hair and the drawn head ball (the ball is a hand-drawn blob, not the sphere) = hair
    from pm_draw import GREEN
    arr = np.asarray(box); bg = np.all(arr == np.array(GREEN, np.uint8), axis=2)
    pocket = ndimage.binary_fill_holes(~bg) & bg
    if pocket.any(): box.paste(Image.new('RGB', box.size, hair.col), (0, 0), Image.fromarray((pocket * 255).astype('uint8')))
    im.paste(box, (x0, y0))
    # ---- strand lines on locks that face the camera (clump separation: continuity of the flow around the head)
    dd = ImageDraw.Draw(im)
    for pts in lines:
        if pts[0][2] < 20: continue
        q = [((CX + sgn * x) * K, (600 - y) * K) for x, y, _ in pts[:-1]] + [((CX + sgn * pts[-1][0]) * K * .3 + (CX + sgn * pts[-2][0]) * K * .7, (600 - pts[-1][1]) * K * .3 + (600 - pts[-2][1]) * K * .7)]
        dd.line(q, fill=shade(hair.col, .55), width=int(4 * K), joint='curve')

def from_outline(hair, F, kind='spike', ring=(60, -60, 120, -120, 180), fringe_from=470, lock_r=30, fringe_max=585):
    """build the 3D pieces of an ORIGINAL front-view hair outline (its control points), so the turned views are the same hairstyle:
       - every spike TIP of the outline (a point further from the head centre than both neighbours, outside the skull) = a spike
         seen at the front view's silhouette (z = 0), as wide as the outline between its two valleys; tips on the upper part are
         repeated around the head at the `ring` angles, so the spikes and the volume exist all round the head
       - every bang TIP (lowest point between two higher ones, hanging over the forehead) = a lock lying on the forehead"""
    pts = list(F); n = len(pts); rad = [math.hypot(x - CX, 600 - y) for x, y in pts]
    for i, (x, y) in enumerate(pts):
        X, Y = x - CX, 600 - y; r = rad[i]
        if r > R + hair.t * .3 and r >= rad[i - 1] and r >= rad[(i + 1) % n]:
            # half-width = distance to the nearer neighbouring control point (the valley on each side)
            dn = min(math.hypot(x - pts[i - 1][0], y - pts[i - 1][1]), math.hypot(x - pts[(i + 1) % n][0], y - pts[(i + 1) % n][1]))
            w = max(30.0, min(90.0, .62 * dn)); ux, uy = X / r, Y / r
            base = (ux * (R * .82), uy * (R * .82), 0.0); tip = (X, Y, 0.0)
            for a in [0.0] + (list(ring) if Y > 40 else []):
                c, s_ = math.cos(math.radians(a)), math.sin(math.radians(a))
                rb = (base[0] * c, base[1], -base[0] * s_); rt = (tip[0] * c, tip[1], -tip[0] * s_)
                if kind == 'puff': hair.parts.append(('ball', tuple((rb[k] * .3 + rt[k] * .7) for k in range(3)), w * 1.05)); continue
                mid = tuple(rb[k] + (rt[k] - rb[k]) * .55 for k in range(3))
                hair.parts.append(('tube', [rb, mid, rt], [w * 1.15, w * .62, 2.0], abs(a) < 90))
        elif fringe_from < y <= fringe_max and abs(X) < R * .8 and y >= pts[i - 1][1] and y >= pts[(i + 1) % n][1]:
            zt = math.sqrt(max(R * R - X * X - Y * Y, 0)) + 10
            if kind == 'puff': hair.parts.append(('ball', (X, Y + lock_r * .5, zt - 6), lock_r)); continue
            top_y = 600 - fringe_from + 30; zb = math.sqrt(max(R * R - X * X - top_y * top_y, 0)) + hair.t * .6
            hair.parts.append(('tube', [(X, top_y, zb), (X, (top_y + Y) / 2, (zb + zt) / 2 + 6), (X, Y, zt)], [lock_r * 1.3, lock_r * .8, 3], True))
    return hair
