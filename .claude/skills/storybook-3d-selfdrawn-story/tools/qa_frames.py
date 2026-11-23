# python tools/qa_frames.py <video.mp4> [--shots src/shots.js] [--sheet out/qa_sheet.jpg]
# v8 (2026-11-23): checks EVERY frame of a finished clip (idea from mromidev/claude-animated-shorts short_qa.py, MIT; code is ours).
#  FAIL: black frame run (mean < 8) or white run (mean > 247) inside the clip, a pop (one-frame spike in change that is not a shot cut),
#        wrong size / fps, loudness off -14 LUFS by > 1.2, true peak > -1.0 dBTP.
#  WARN: a freeze (change < .25 grey levels for >= 12 frames: needs a creeping push-in), a low-detail run (frame detail < 35 % of its
#        shot's median for >= 5 frames: camera inside a wall/pillar or a prop in front of the lens).
# Shot cuts come from S('id', t0, ...) in shots.js (+ camera jumps inside a shot from --camdump), so changes at cuts are not counted as pops.
import argparse, json, re, subprocess, sys, numpy as np

ap = argparse.ArgumentParser(); ap.add_argument('video'); ap.add_argument('--shots', default='src/shots.js'); ap.add_argument('--sheet')
ap.add_argument('--camdump', help='out/camdump.json: also treat camera jumps inside a shot (> 200 px/f) as cuts (v8 M2)')
a = ap.parse_args(); W, H, FPS = 90, 160, 30
info = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-show_streams', '-of', 'json', a.video], capture_output=True, text=True).stdout)
v = next(s for s in info['streams'] if s['codec_type'] == 'video'); rows = []
def gate(st, what, detail=''): rows.append((st, what, detail))
num, den = map(int, v['r_frame_rate'].split('/'))
gate('PASS' if (v['width'], v['height']) == (1080, 1920) else 'FAIL', 'size 1080x1920', f"{v['width']}x{v['height']}")
gate('PASS' if abs(num / den - FPS) < .01 else 'FAIL', 'fps 30', f'{num / den:.2f}')

raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', a.video, '-vf', f'scale={W}:{H}:flags=area,format=gray', '-f', 'rawvideo', '-'], capture_output=True).stdout
F = np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.float32); n = len(F)
mean, sd = F.mean((1, 2)), F.std((1, 2)); d = np.r_[0, np.abs(np.diff(F, axis=0)).mean((1, 2))]
cuts = set()
try:
    for t in re.findall(r"^S\('[^']+',\s*([\d.]+)", open(a.shots, encoding='utf-8').read(), re.M):
        f = int(round(float(t) * FPS)); cuts.update(range(f - 2, f + 3))
except OSError: pass
if a.camdump:
    for cd in json.load(open(a.camdump, encoding='utf-8')):
        if (cd.get('speed') or 0) > 200: cuts.update(range(cd['f'] - 2, cd['f'] + 3))
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
t = lambda f: f'{f / FPS:.2f}s'
inner = np.zeros(n, bool); inner[3:n - 3] = True                                  # fades at the very start/end are allowed
for nm, m in (('black', (mean < 8) & inner), ('white', (mean > 247) & inner)):
    r = runs(m, 2); gate('FAIL' if r else 'PASS', f'no {nm} frames inside', ', '.join(f'{t(k)} x{L}' for k, L in r[:5]))
med = np.median(d[d > 0]) + 1e-6; pops = [i for i in range(2, n - 1) if i not in cuts and d[i] > max(25, 8 * med) and d[i] > 4 * max(d[i - 1], d[i + 1])]
gate('FAIL' if pops else 'PASS', 'no pop frames (spike outside a cut)', ', '.join(t(i) for i in pops[:8]))
fr = runs((d < .25) & inner, 12); gate('WARN' if fr else 'PASS', 'no freeze >= 12 f', ', '.join(f'{t(k)} {L}f' for k, L in fr[:8]))
edges = sorted({0, n} | {c for c in cuts if 0 < c < n}); low = np.zeros(n, bool)
for s0, s1 in zip(edges, edges[1:]):
    if s1 - s0 > 4: low[s0:s1] = sd[s0:s1] < .35 * np.median(sd[s0:s1])
lr = runs(low, 5); gate('WARN' if lr else 'PASS', 'no low-detail run (camera in a wall?)', ', '.join(f'{t(k)} {L}f' for k, L in lr[:8]))

if any(s['codec_type'] == 'audio' for s in info['streams']):
    st = subprocess.run(['ffmpeg', '-hide_banner', '-i', a.video, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True, encoding='utf-8', errors='replace').stderr
    I = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', st)[-1]); P = float(re.findall(r'Peak:\s+(-?[\d.]+) dBFS', st)[-1])
    gate('PASS' if abs(I + 14) <= 1.2 else 'FAIL', 'loudness -14 LUFS +-1.2', f'{I}')
    gate('PASS' if P <= -1.0 else 'FAIL', 'true peak <= -1.0 dBTP', f'{P}')
else: gate('WARN', 'audio track', 'none')

if a.sheet:                                                                       # 4x4 sheet, one frame per 1/16 of the clip
    ts = [n * (i + .5) / 16 / FPS for i in range(16)]
    sel = '+'.join(f'eq(n\\,{int(x * FPS)})' for x in ts)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', a.video, '-vf', f"select='{sel}',scale=240:-2,tile=4x4", '-frames:v', '1', '-fps_mode', 'vfr', a.sheet])
print(f'{a.video}: {n} frames, {n / FPS:.1f} s, {len([c for c in edges if 0 < c < n])} cuts from shots.js')
for st, w, det in rows: print(f'{st:4}  {w:42}  {det}')
c = {k: sum(r[0] == k for r in rows) for k in ('PASS', 'WARN', 'FAIL')}; print('PASS %(PASS)d  WARN %(WARN)d  FAIL %(FAIL)d' % c)
sys.exit(1 if c['FAIL'] else 0)
