# python3 tools/timing.py [project_root=.]
# VO (project.json "vo") -> aud/vo.wav (optional silent build-up pause inserted) + src/timing.json (speech islands, 1-word caption chunks, mouth env)
# project.json "lines": one entry per speech island (sentence), caption chunks split with '|'. A line without '|' is auto-chunked (pythainlp).
# If the number of islands != number of lines the script prints the islands and stops: fix "lines" (merge/split sentences) or
# change "silence_db" / "silence_min" until they match.
import json, subprocess, re, numpy as np, sys, os, wave
from pythainlp.tokenize import word_tokenize, syllable_tokenize
W = sys.argv[1] if len(sys.argv) > 1 else '.'
P = json.load(open(f'{W}/src/project.json', encoding='utf-8'))
SR = 48000
PAUSE_AT, PAUSE_LEN = (P['pause']['at'], P['pause']['len']) if P.get('pause') else (1e9, 0.0)
TAIL = P.get('tail', 1.0)
VO = os.path.join(W, P['vo'])
os.makedirs(f'{W}/aud', exist_ok=True)

def syl(w): return max(1, len([s for s in syllable_tokenize(w, engine='dict') if s.strip() and re.search(r'[ก-ฮ]', s)]))
def autochunk(text, max_syl=4):  # greedy word groups of <= max_syl syllables
    out, cur, n = [], '', 0
    for w in word_tokenize(text, engine='newmm'):
        if not w.strip(): continue
        k = syl(w) if re.search(r'[ก-ฮ]', w) else 0  # quotes/punctuation stick to their word
        if cur and k and n + k > max_syl: out.append(cur); cur, n = '', 0
        cur += w; n += k
    if cur: out.append(cur)
    return '|'.join(out)
LINES = [l if '|' in l else autochunk(l) for l in P['lines']]

raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', VO, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout
a = np.frombuffer(raw, np.float32).copy()
cut = int(min(PAUSE_AT, len(a) / SR) * SR)
out = np.concatenate([a[:cut], np.zeros(int(PAUSE_LEN * SR), np.float32), a[cut:], np.zeros(int(TAIL * SR), np.float32)])
with wave.open(f'{W}/aud/vo.wav', 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(out, -1, 1) * 32767).astype(np.int16).tobytes())
# islands by silencedetect on the ORIGINAL file
sd = subprocess.run(['ffmpeg', '-hide_banner', '-i', VO, '-af', f"silencedetect=n={P.get('silence_db', -35)}dB:d={P.get('silence_min', 0.25)}", '-f', 'null', '-'], capture_output=True, text=True).stderr
st = [float(x) for x in re.findall(r'silence_start: ([0-9.]+)', sd)]; en = [float(x) for x in re.findall(r'silence_end: ([0-9.]+)', sd)]
dur = len(a) / SR
isl = []; t = 0.0
for s, e in zip(st, en):
    if s - t > 0.05: isl.append([t, s])
    t = e
if dur - t > 0.1: isl.append([t, dur])
if P.get('islands'): isl = [list(x) for x in P['islands']]  # v7.3: islands from ASR word timestamps (tools/align_islands.py) beat silencedetect
if len(isl) != len(LINES):
    print(f'MISMATCH: {len(isl)} speech islands but {len(LINES)} lines in project.json. Islands (s):')
    for i, (s, e) in enumerate(isl): print(f'  {i:2d}  {s:6.2f} - {e:6.2f}  ({e - s:4.2f} s)  line: {P["lines"][i] if i < len(P["lines"]) else "-"}')
    sys.exit(1)
sh = lambda x: x + (PAUSE_LEN if x > PAUSE_AT else 0)
hop = SR // 100
env = np.sqrt(np.convolve(a * a, np.ones(hop * 3) / (hop * 3), 'same')[::hop])
def snap(x, lo, hi):  # move a chunk boundary to the nearest energy dip
    i0, i1 = int(max(lo, x - .07) * 100), int(min(hi, x + .07) * 100)
    if i1 <= i0 + 1: return x
    return (i0 + int(np.argmin(env[i0:i1]))) / 100
caps = []; islands = []
for (t0, t1), text in zip(isl, LINES):
    m = [[c, syl(c)] for c in text.split('|')]
    text = text.replace('|', '')
    tot = sum(max(c[1], 1) for c in m); acc = 0; b = [t0]
    for c in m[:-1]:
        acc += max(c[1], 1); x = snap(t0 + (t1 - t0) * acc / tot, t0 + .1, t1 - .1); b.append(max(x, b[-1] + 0.18))
    b.append(t1)
    islands.append([round(sh(t0), 3), round(sh(t1), 3), text])
    for i, c in enumerate(m): caps.append([round(sh(b[i]), 3), round(sh(b[i + 1]), 3), c[0]])
for i in range(len(caps) - 1):  # hold each caption until the next one starts (unless the gap is long)
    if caps[i + 1][0] - caps[i][1] < 0.9: caps[i][1] = caps[i + 1][0]
    else: caps[i][1] = round(caps[i][1] + 0.25, 3)
caps[-1][1] = round(caps[-1][1] + 0.4, 3)
END = round(len(out) / SR, 2)
fr = SR // 30; nF = len(out) // fr; e30 = np.sqrt((out[:nF * fr].reshape(nF, fr) ** 2).mean(1)); e30 = e30 / (np.percentile(e30, 95) + 1e-9)
ENV = [round(float(min(1.2, v)), 2) for v in e30]
pause = None
if PAUSE_LEN > 0:
    k = max(i for i, (s, e) in enumerate(isl) if s < PAUSE_AT)
    pause = [round(sh(isl[k][1]), 4), round(sh(isl[k + 1][0]), 4)] if k + 1 < len(isl) else None
json.dump({'end': END, 'pause': pause, 'islands': islands, 'caps': caps, 'env': ENV}, open(f'{W}/src/timing.json', 'w'), ensure_ascii=False, indent=0)
print('END', END, 's | islands', len(islands), '| caps', len(caps), '| caps/s', round(len(caps) / END, 2), '| frames', int(round(END * 30)))
for i, (s, e, tx) in enumerate(islands): print(f'  {i:2d}  {s:6.2f} - {e:6.2f}  {tx}')
