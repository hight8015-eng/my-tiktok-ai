# python3 tools/prelint.py [project_root=.] : static checks BEFORE any render (seconds, no browser). Catches the mistakes
# that cost re-renders in ep2/ep3. Exit code 1 if an ERROR is found. Run it every time before render / rq.sh.
import json, os, re, subprocess, sys, shutil, tempfile
W = sys.argv[1] if len(sys.argv) > 1 else '.'; S = f'{W}/src'; E = []; Wn = []
def err(m): E.append(m)
def warn(m): Wn.append(m)
# 1 syntax of every module (a stray // once swallowed "}, { rain: false });" -> render timeout)
td = tempfile.mkdtemp()
for f in ('shots.js', 'zc.js', 'world.js', 'main.js', 'acting.js', 'chars.js'):
    p = f'{S}/{f}'
    if not os.path.exists(p): continue
    q = f'{td}/{f[:-3]}.mjs'; shutil.copy(p, q); r = subprocess.run(['node', '--check', q], capture_output=True, text=True)
    if r.returncode: err(f'{f}: syntax: ' + (r.stderr.strip().splitlines() or ['?'])[-1][:160])
shutil.rmtree(td, True)
src = open(f'{S}/shots.js', encoding='utf-8').read() if os.path.exists(f'{S}/shots.js') else ''
T = json.load(open(f'{S}/timing.json', encoding='utf-8')) if os.path.exists(f'{S}/timing.json') else {}
PJ = next((p for p in (f'{S}/project.json', f'{W}/project.json') if os.path.exists(p)), None); P = json.load(open(PJ, encoding='utf-8')) if PJ else {}
# 2 shots: order, coverage, rain indoors, transition variety
shots = [(m.start(), m.group(1), float(m.group(2)), m.group(3), m.group(4)) for m in re.finditer(r"\bS\('([^']+)',\s*([\d.]+),\s*'(\w+)',\s*(\w+)", src)]
INDOOR = set(P.get('interiors', [])) | {'WAREHOUSE', 'ROOM', 'BAR', 'OFFICE', 'CELL', 'HALL', 'INSIDE', 'STATION'}
for i, (pos, sid, t0, tr, SET) in enumerate(shots):
    nxt = shots[i + 1][0] if i + 1 < len(shots) else len(src); body = src[pos:nxt]
    if SET in INDOOR and not re.search(r'rain:\s*false', body): err(f'{sid}: indoor set {SET} without {{ rain: false }} (rain fell inside the warehouse in ep3)')
    if re.search(r'\.\.\.walk\(', body) and 'walkAlong' not in body: warn(f'{sid}: walk() is time-based (feet skate); use walkAlong(t, path) with the same path as p')
    if i and t0 < shots[i - 1][2]: err(f'{sid}: t0 {t0} is before the previous shot')
    if re.search(r'sitK|sit:\s*true', body) and 'seat' not in body: warn(f'{sid}: sitting without an explicit seat height (check nobody sinks into the seat)')
if shots and T.get('end') and shots[0][2] > 0: err('first shot does not start at 0')
run = 1
for i in range(1, len(shots)):
    run = run + 1 if shots[i][3] == shots[i - 1][3] else 1
    if run == 4 and shots[i][3] != 'cut': warn(f'{shots[i][1]}: 4 "{shots[i][3]}" transitions in a row (rule 5: vary transitions)')
lens = [shots[i + 1][2] - shots[i][2] for i in range(len(shots) - 1)] + ([T['end'] - shots[-1][2]] if shots and T.get('end') else [])
for (pos, sid, t0, tr, SET), L in zip(shots, lens):
    if L > 6: warn(f'{sid}: {L:.1f} s long, consider a cut or a camera move (pacing)')
    if L < .5: warn(f'{sid}: only {L:.2f} s (stutter risk)')
h = [x for x in shots if x[2] < 10]
if shots and len(h) < 4: warn(f'hook: only {len(h)} shots start in the first 10 s (refs change framing every ~1.5 s; aim >= 5 framings, camera size changes count)')
# 3 labels (every episode: place + name labels), whisper thoughts, hook
labs = P.get('labels', []) or T.get('labels', [])
kinds = {l.get('type', l.get('kind', '')) for l in labs if isinstance(l, dict)}
if not labs: err('no labels in project.json (every episode needs place + name labels)')
elif not ({'place'} <= kinds and ({'name'} & kinds)): warn(f'labels present but types are {sorted(kinds)}; need place AND name')
text = ' '.join(x[2] for x in T.get('islands', []) if len(x) > 2)
if re.search(r'คิด(ใน|ว่า)|ในใจ|กระซิบ|ส่งความคิด', text) and 'whisperAt' not in src: warn('the script has a thought / whisper beat but shots.js never calls whisperAt')
if 'labels' in P and T.get('end') and not any(isinstance(l, dict) and float(l.get('t', l.get('at', 99))) < 6 for l in labs): warn('no label in the first 6 s')
# 4 captions synced (caps from align.py, not even-split)
if T.get('islands') and not T.get('caps'): err('timing.json has no "caps": run tools/align.py <root> asr_fast.json caps (captions must follow the words)')
if T.get('env') and not T.get('vis'): warn('no visemes: run tools/lipsync.py (mouths will flap from loudness only)')
for m in E: print('ERROR', m)
for m in Wn: print('warn ', m)
print(f'prelint: {len(shots)} shots, {len(E)} errors, {len(Wn)} warnings'); sys.exit(1 if E else 0)
