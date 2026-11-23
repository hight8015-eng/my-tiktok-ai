# styles3d.py (v8 M3, 2026-11-24): the ORIGINAL approved hairstyles as 3D hair models. User rule: the FRONT view stays the original
# drawing, pixel for pixel; the 3/4, side and back views are projections of a 3D model built from that same front outline
# (hair3d.from_outline), so all views are one hairstyle.
from hair3d import Hair, from_outline
from pm_draw import hexc, CX
import hair_library as HL

def aren(): return [from_outline(Hair(hexc('#16131d'), t=26, hl=(470, 640, 700)), HL.AREN, fringe_from=478, lock_r=34)]
def noah(): return [from_outline(Hair(hexc('#cdd0da'), t=22, hl=(470, 620, 700)), HL.NOAH, fringe_from=470, lock_r=32)]
def curly():                                        # curls all over the cap (balls of hair), the face kept free; front view = the original drawing
    h = Hair(hexc('#6b4630'), t=30, hl=(470, 640, 705))
    for el, step, r in [(82, 120, 44), (64, 40, 42), (46, 34, 40), (28, 30, 38), (12, 30, 36)]:
        az = -180
        while az < 180:
            if not (el < 40 and abs(az) < 60): h.puff(az, el, r)
            az += step
    return [h]
def buzz(): return [Hair(hexc('#3a3236'), t=6, hl=(470, 560, 640))]
def mohawk():
    g = Hair(hexc('#4a3a40'), t=5, hl=(476, 560, 640)); fin = Hair(hexc('#c2348a'), t=5, hl=(-9999, -9999, -9999))   # fin: no scalp layer
    # a broad crest (the original front fin is ~150 wide): three rows of spikes along the middle of the head, front to back
    for az, el, L, w in [(0, 38, 90, 30), (0, 54, 120, 34), (0, 70, 140, 36), (0, 86, 150, 36), (180, 72, 140, 34), (180, 56, 120, 32), (180, 40, 95, 28), (180, 24, 70, 24)]:
        for side, k in ((0, 1.0), (14, .8), (-14, .8)):
            fin.spike(az, el, L * k, w * 1.7, 0, side * (1 if az == 0 else -1)) if side == 0 else fin.spike(az + (side if az == 0 else -side), el, L * k, w * 1.5, 0, 0)
    return [g, fin]
STYLES = {'C01': aren, 'C04': buzz, 'C05': mohawk, 'C09': noah, 'C10': curly}
