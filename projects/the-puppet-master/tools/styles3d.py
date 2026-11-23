# styles3d.py (v8 M3, 2026-11-24): the PUPPET MASTER hairstyles as 3D hair models (hair3d.Hair). One model per hairstyle; every view
# of a character is a projection of it. Angles: az from the face (+ = screen right in the front view = the character's LEFT side),
# el up from the head's equator (eye level is about el 0, the crown el 90).
from hair3d import Hair, sph, R
from pm_draw import hexc

def aren():                                         # black messy hair: tall crown spikes all round, bangs over the right eye, nape points
    h = Hair(hexc('#16131d'), t=26, hl=(470, 640, 700))
    for az, el, L, w, up, side in [(0, 86, 120, 46, 0, 0), (0, 66, 105, 44, 8, 0), (38, 64, 100, 42, 6, 14), (-38, 64, 100, 42, 6, -14),
                                   (78, 48, 95, 40, 10, 16), (-78, 48, 95, 40, 10, -16), (120, 55, 100, 42, 14, 10), (-120, 55, 100, 42, 14, -10),
                                   (165, 62, 100, 42, 16, 6), (-165, 62, 100, 42, 16, -6), (100, 22, 80, 36, -18, 10), (-100, 22, 80, 36, -18, -10),
                                   (145, 18, 85, 38, -30, 8), (-145, 18, 85, 38, -30, -8), (180, 10, 80, 36, -40, 0), (60, 78, 90, 38, 10, 20), (-60, 78, 90, 38, 10, -20)]:
        h.spike(az, el, L * 1.2, w * 1.45, up, side)
    for az, tip_el, w in [(-48, 14, 30), (-28, -4, 32), (-8, 6, 30), (14, 12, 28), (34, 16, 28), (52, 20, 26)]:   # bangs; the char's right eye (az < 0) gets the longest lock
        h.strand([sph(az, 46, R + 26), sph(az + 3, 28, R + 16), sph(az + 6, tip_el, R + 9)], [w * 1.45, w * .85, 3])
    return [h]

def noah():                                         # ash-silver hair swept back: locks lie along the skull toward the crown/back, tips lifting; a fringe lock on the left
    h = Hair(hexc('#cdd0da'), t=22, hl=(470, 620, 700))
    for az, el, L, w, up, side in [(0, 55, 120, 44, 62, 0), (30, 52, 115, 42, 60, 10), (-30, 52, 115, 42, 60, -10), (60, 42, 110, 40, 58, 18),
                                   (-60, 42, 110, 40, 58, -18), (95, 32, 95, 36, 50, 22), (-95, 32, 95, 36, 50, -22), (0, 80, 110, 42, 60, 0),
                                   (150, 40, 90, 38, 20, 10), (-150, 40, 90, 38, 20, -10), (180, 30, 85, 36, 10, 0)]:
        h.spike(az, el, L * 1.1, w * 1.35, up, side, bend=18)
    h.strand([sph(-34, 40, R + 22), sph(-30, 22, R + 16), sph(-26, 2, R + 10)], [30, 20, 2])            # the long fringe lock (screen left)
    return [h]

def curly():                                        # brown curly mop: balls of curls over the whole cap, smaller ones along the hairline
    h = Hair(hexc('#6b4630'), t=30, hl=(470, 640, 705))
    for el, step, r in [(82, 120, 44), (64, 40, 42), (46, 34, 40), (28, 30, 38), (12, 30, 36)]:
        az = -180
        while az < 180:
            if not (el < 40 and abs(az) < 60):      # keep the face free
                h.puff(az, el, r)
            az += step
    for az in (-56, -40, -22, -4, 14, 32, 50): h.puff(az, 40, 30, lift=-6)   # curls along the front hairline
    return [h]

def buzz():                                         # very short dark buzz cut: a thin shell, no strands
    return [Hair(hexc('#3a3236'), t=6, hl=(470, 560, 640))]

def mohawk():                                       # shaved grey sides + a magenta fin along the middle of the head, front to back
    g = Hair(hexc('#4a3a40'), t=5, hl=(476, 560, 640)); fin = Hair(hexc('#c2348a'), t=5, hl=(-9999, -9999, -9999))   # no scalp layer: only the fin
    for az, el, L, w in [(0, 38, 90, 30), (0, 54, 120, 34), (0, 70, 140, 36), (0, 86, 150, 36), (180, 72, 140, 34), (180, 56, 120, 32), (180, 40, 95, 28), (180, 24, 70, 24)]:
        fin.spike(az, el, L, w * 1.7, 0, 0)            # wide overlapping bases: one continuous fin
    return [g, fin]

STYLES = {'C01': aren, 'C04': buzz, 'C05': mohawk, 'C09': noah, 'C10': curly}
