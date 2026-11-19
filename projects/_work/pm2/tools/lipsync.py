# python3 tools/lipsync.py [project_root=.]   (run after tools/timing.py; reads aud/vo.wav, adds "vis" to src/timing.json)
# Viseme lip sync from the voice audio (no phoneme model needed; works for Thai):
#   X rest/closed (silence)    M lips pressed (ม บ ป, short energy dips inside a word)    a small open    A wide open (อา)
#   E wide/stretched (อี เอ แอ, bright spectrum)    O round (อู โอ ออ, dark spectrum)    S teeth (ส ช ฉ ซ ศ ฟ, hiss)
# Animation rules applied (Preston Blair / Richard Williams / Rhubarb practice):
#   - the mouth LEADS the sound by 1 frame (we see the shape a hair before we hear it); 2 frames when LEAD=2
#   - hold every shape >= 2 frames (except a 1-frame M closure, which sells b/p/m); no A-a-A flapping
#   - lips close in pauses > .12 s; the jaw opens with loudness; stressed syllables open widest
import json, sys, wave, numpy as np
W = sys.argv[1] if len(sys.argv) > 1 else '.'
LEAD = int(sys.argv[2]) if len(sys.argv) > 2 else 1
with wave.open(f'{W}/aud/vo.wav') as w: sr = w.getframerate(); a = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
if a.ndim > 1: a = a.mean(1)
hop = sr // 100; win = 1024; n = (len(a) - win) // hop
fr = np.lib.stride_tricks.sliding_window_view(a, win)[::hop][:n] * np.hanning(win)
S = np.abs(np.fft.rfft(fr, axis=1)) ** 2; f = np.fft.rfftfreq(win, 1 / sr)
band = lambda lo, hi: S[:, (f >= lo) & (f < hi)].sum(1) + 1e-12
low, mid, high, fric = band(80, 900), band(900, 2600), band(2600, 4500), band(4500, 11000)
rms = np.sqrt((fr ** 2).mean(1)); sp = rms > np.percentile(rms, 30) * .5
rn = rms / (np.percentile(rms[rms > np.percentile(rms, 60)], 90) + 1e-9)
rn = np.convolve(rn, np.ones(2) / 2, 'same')
tot = low + mid + high + fric; fr_r = fric / tot; f2 = mid / low
vo = rn > .2; lf2 = np.log(f2 + 1e-9); qO, qE = np.percentile(lf2[vo], 20), np.percentile(lf2[vo], 80)   # per-voice calibration
qA = np.percentile(rn[vo], 70)
cls = np.full(n, 'X')
for i in range(n):
    if rn[i] < .07: continue
    loc = rn[max(0, i - 6):i + 7].max()
    if fr_r[i] > .4 and rn[i] < .7: cls[i] = 'S'
    elif rn[i] < .3 * loc and loc > .3: cls[i] = 'M'
    elif lf2[i] < qO and rn[i] > .25: cls[i] = 'O'
    elif lf2[i] > qE and rn[i] > .2: cls[i] = 'E'
    elif rn[i] > qA: cls[i] = 'A'
    else: cls[i] = 'a'
# close the lips in short pauses inside speech only if > .12 s (else keep the previous shape relaxed to 'a')
i = 0
while i < n:
    if cls[i] == 'X':
        j = i
        while j < n and cls[j] == 'X': j += 1
        if j - i < 12 and i > 0 and j < n: cls[i:j] = 'a' if j - i > 3 else cls[i - 1]
        i = j
    else: i += 1
# 100 Hz -> 30 fps: vote per video frame (M wins if it holds >= 30 ms: closures must show)
nF = int(len(a) / sr * 30) + 1; vis = []
for k in range(nF):
    s0, s1 = int(k * 100 / 30), int((k + 1) * 100 / 30) + 1; seg = list(cls[s0:s1]) or ['X']
    if seg.count('M') >= 3: vis.append('M'); continue
    vals, cnt = np.unique(seg, return_counts=True); vis.append(vals[np.argmax(cnt)])
vis = vis[LEAD:] + ['X'] * LEAD                            # the mouth leads the sound
# holds: runs of 1 frame (not M) merge into the louder neighbour; A/a alternation is smoothed
def runs(v):
    out = []; i = 0
    while i < len(v):
        j = i
        while j < len(v) and v[j] == v[i]: j += 1
        out.append([v[i], j - i]); i = j
    return out
for _ in range(3):
    R = runs(vis)
    for i, (c, L) in enumerate(R):
        if L == 1 and c != 'M' and 0 < i < len(R) - 1: R[i][0] = R[i - 1][0] if R[i - 1][0] != 'M' else R[i + 1][0]
    vis = [c for c, L in R for _ in range(L)]
T = json.load(open(f'{W}/src/timing.json', encoding='utf-8')); T['vis'] = ''.join(vis[:len(T.get('env', vis))]); T['vis_lead'] = LEAD
json.dump(T, open(f'{W}/src/timing.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
u, c = np.unique(list(T['vis']), return_counts=True); print('visemes', dict(zip(u, c)), 'frames', len(T['vis']))
R = runs(list(T['vis'])); sp_ = [L for ch, L in R if ch != 'X']; print('mean hold', round(np.mean(sp_), 2), 'frames; 1-frame shapes', sum(1 for ch, L in R if L == 1))
