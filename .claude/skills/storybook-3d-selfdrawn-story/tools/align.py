# python3 tools/align.py [root=.] [asr=asr_fast.json] [islands|caps]
# Aligns the script (project.json "lines", chunks split by '|') to ASR word timestamps (tools/asr_words.py on the SAME
# audio file timing.py uses) character by character (difflib). 'islands' -> writes project.json "islands" (run before
# timing.py); 'caps' -> rewrites timing.json caption chunk times so captions start ON the spoken word (run after timing.py).
import json, re, sys, difflib
W = sys.argv[1] if len(sys.argv) > 1 else '.'; A = json.load(open(f'{W}/' + (sys.argv[2] if len(sys.argv) > 2 else 'asr_fast.json'))); MODE = sys.argv[3] if len(sys.argv) > 3 else 'islands'
chars, times = [], []
for s in A:
    for w0, w1, w in s[3]:
        t = re.sub(r'\s', '', w); n = max(1, len(t))
        for i, c in enumerate(t): chars.append(c); times.append((w0 + (w1 - w0) * i / n, w0 + (w1 - w0) * (i + 1) / n))
clean = lambda l: re.sub(r'[|~^*!?\s"ๆ…\.,]', '', l)
P = json.load(open(f'{W}/src/project.json'))
units = [[clean(c) for c in l.split('|')] for l in P['lines']]; flat = [c for u in units for c in u]; S = ''.join(flat)
sm = difflib.SequenceMatcher(None, S, ''.join(chars), autojunk=False); mp = {}
for a, b, n in sm.get_matching_blocks():
    for k in range(n): mp[a + k] = b + k
spans = []; pos = 0
for c in flat:
    idx = [mp[i] for i in range(pos, pos + len(c)) if i in mp]; pos += len(c)
    spans.append([times[idx[0]][0], times[idx[-1]][1]] if idx else None)
for i, sp in enumerate(spans):   # fill gaps by interpolation
    if sp is None:
        a = next((spans[j] for j in range(i - 1, -1, -1) if spans[j]), [0, 0]); b = next((spans[j] for j in range(i + 1, len(spans)) if spans[j]), [a[1] + .3] * 2); spans[i] = [a[1], b[0]]
if MODE == 'islands':
    isl = []; k = 0
    for u in units: isl.append([round(spans[k][0], 3), round(spans[k + len(u) - 1][1], 3)]); k += len(u)
    P['islands'] = isl; json.dump(P, open(f'{W}/src/project.json', 'w'), ensure_ascii=False, indent=1); print('islands', len(isl))
else:
    T = json.load(open(f'{W}/src/timing.json')); caps = T['caps']; assert len(caps) == len(spans), (len(caps), len(spans))
    for i, c in enumerate(caps): c[0] = round(max(0, spans[i][0] - .04), 3); c[1] = round(spans[i][1], 3)   # appear 1 frame before the word
    for i in range(len(caps) - 1):
        if caps[i + 1][0] - caps[i][1] < .9: caps[i][1] = caps[i + 1][0]
        else: caps[i][1] = round(caps[i][1] + .25, 3)
    json.dump(T, open(f'{W}/src/timing.json', 'w'), ensure_ascii=False, indent=0); print('caps aligned', len(caps))
