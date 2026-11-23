# python tools/cam_gates.py <video.mp4> [caption_band=0.58,0.76]   ->  prints the camera gates for a finished clip
# Measures the CAMERA from the picture itself (global translation per frame by phase correlation on a 180x320 grey copy, the caption
# band masked), then checks the same quantities the RicksClips pipeline gates on. Speeds are in px/frame at 720x1280.
# Targets are taken from RicksClips_Skill_V1.1/tools/film_plan.py (NurMohammadDuari/ricksclips-animation-skill, CC BY 4.0: credit the
# author when you share this). The code here is our own; only the numeric targets (measured by that author from 24 reference Shorts) are reused.
import sys, subprocess, numpy as np
vid = sys.argv[1]; band = [float(v) for v in (sys.argv[2] if len(sys.argv) > 2 else '0.58,0.76').split(',')]
W, H = 180, 320; SC = 720 / W                                          # scan scale -> px at 720 wide
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', vid, '-vf', f'scale={W}:{H}:flags=area,format=gray', '-f', 'rawvideo', '-'], capture_output=True).stdout
F = np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.float32); n = len(F); fps = 30.0
mask = np.ones((H, W), np.float32); mask[int(band[0] * H):int(band[1] * H), :] = 0
win = np.outer(np.hanning(H), np.hanning(W)).astype(np.float32) * mask
def shift(a, b):
    A = np.fft.rfft2((a - a.mean()) * win); B = np.fft.rfft2((b - b.mean()) * win); R = A * np.conj(B); R /= np.abs(R) + 1e-6
    r = np.fft.irfft2(R, s=(H, W)); iy, ix = np.unravel_index(np.argmax(r), r.shape); pk = r[iy, ix]
    def sub(m, i, k): a, b, c = m[(i - 1) % k], m[i], m[(i + 1) % k]; d = a - 2 * b + c; return i + (0.5 * (a - c) / d if abs(d) > 1e-9 else 0)
    y = sub(r[:, ix], iy, H); x = sub(r[iy, :], ix, W); y = y - H if y > H / 2 else y; x = x - W if x > W / 2 else x
    return x, y, pk
sp = np.zeros(n); cut = np.zeros(n, bool); dx = np.zeros(n); dy = np.zeros(n)
for i in range(1, n):
    x, y, pk = shift(F[i - 1], F[i]); dx[i], dy[i] = x * SC, y * SC; sp[i] = np.hypot(dx[i], dy[i])
    cut[i] = pk < 0.12 or np.mean(np.abs(F[i] - F[i - 1])) > 38                              # a hard cut / dissolve start: no usable correlation
use = ~cut; use[0] = False; s = sp[use]; dur = n / fps
rest = (sp < 2) & use; dead = (sp < 0.3) & use
# rests = runs of >= 6 frames under 2 px/f
runs = []; k = 0
while k < n:
    if rest[k]:
        j = k
        while j < n and rest[j]: j += 1
        if j - k >= 6: runs.append(j - k)
        k = j
    else: k += 1
ntrav = 0; k = 0
while k < n:                                                                                # travel = run of >= 6 frames at >= 2 px/f
    if use[k] and sp[k] >= 2:
        j = k
        while j < n and use[j] and sp[j] >= 2: j += 1
        if j - k >= 6: ntrav = max(ntrav, j - k)
        k = j
    else: k += 1
rows = []
def gate(name, val, ok, warn, target): rows.append(('PASS' if ok else ('WARN' if warn else 'FAIL'), name, val, target))
gate('at rest (<2 px/f), % of frames', round(100 * rest.sum() / use.sum(), 1), rest.sum() / use.sum() >= .30, rest.sum() / use.sum() >= .21, '>= 30 (Rick median 32, range 6-58)')
gate('rests per 10 s', round(len(runs) / dur * 10, 2), 2.2 <= len(runs) / dur * 10 <= 4.5, len(runs) / dur * 10 >= .9, '2.2-4.5, aim 3')
gate('rest length median, s', round(float(np.median(runs)) / fps, 2) if runs else 0, bool(runs) and np.median(runs) / fps >= .6, bool(runs) and np.median(runs) / fps >= .45, '>= 0.6')
gate('longest travel, s', round(ntrav / fps, 2), 3.0 <= ntrav / fps <= 7.0 or dur < 30, ntrav / fps <= 9.5, '3-7 s (one long flowing move)')
p50, p90, pk = np.percentile(s, 50), np.percentile(s, 90), s.max()
gate('speed median px/f', round(float(p50), 2), 2.0 <= p50 <= 6.1, 1.55 <= p50 <= 8.1, 'about 4 (middle half 2.5-6.1)')
gate('speed p90 px/f', round(float(p90), 1), 15 <= p90 <= 27.4, 9.8 <= p90 <= 33.8, 'about 23 (range 9.8-33.8)')
gate('dead still (<0.3 px/f), % of frames', round(100 * dead.sum() / use.sum(), 1), dead.sum() / use.sum() <= .21, dead.sum() / use.sum() <= .29, '<= 21, aim 9')
gate('speed peak px/f', round(float(pk), 1), pk <= 60, pk <= 90, '<= 60 outside planned whips')
# v8 (2026-11-23, user: "use RicksClips' numbers"): shot rate measured by rea-video on 7 RicksClips films
# (library/style/ricksclips-dna/rea-video/*/breakdown.json): median 3.05 shots / 10 s, range 1.5-4.1, median shot 2.8 s.
# The old 0.9 / 10 s target (film_plan.py) counted only hard cuts without a camera move and is replaced for this series.
nc = int(cut.sum()); cr = nc / dur * 10; gate('cuts per 10 s', round(cr, 2), 1.5 <= cr <= 4.1, cr <= 5.0, '1.5-4.1, aim 3 (RicksClips median 3.05)')
# dead-still stretches (read as a freeze)
longest = 0; k = 0; stretches = []
while k < n:
    if dead[k]:
        j = k
        while j < n and dead[j]: j += 1
        longest = max(longest, j - k); stretches.append((j - k, k)); k = j
    else: k += 1
gate('longest dead-still stretch, frames', longest, longest < 12, longest < 24, '< 12 (a hold >= 12 f reads as a freeze: needs a creeping push-in)')
w = max(len(r[1]) for r in rows)
print(f'{vid}: {n} frames, {dur:.1f} s, cuts/dissolves detected {nc}')
for st, nm, v, t in rows: print(f'{st}  {nm.ljust(w)}  {str(v).rjust(7)}   target {t}')
for L, k0 in sorted(stretches, reverse=True)[:6]:
    if L >= 12: print(f'  dead-still {L:3d} f ({L / fps:.1f} s) at t = {k0 / fps:5.1f} s')
print('PASS %d  WARN %d  FAIL %d' % tuple(sum(1 for r in rows if r[0] == k) for k in ('PASS', 'WARN', 'FAIL')))
