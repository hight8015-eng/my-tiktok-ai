# python tools/film_from_shots.py [render_root=.] [--out film.json]
# v8 (M2, 2026-11-23): a film.json SKELETON for an episode that was made the old way (hand-written shots.js), read only.
# It needs src/shots.js, src/timing.json and out/camdump.json (node src/render.js camdump out/camdump.json). Per shot it records what the
# plan file of a new episode will hold: id, start/end, transition, set, the words spoken in it, who is on screen, and the measured camera
# (median / peak speed in px per frame, longest freeze). Camera keys, acts and sfx stay empty: in a new episode they are written by hand
# (or by the storyboard step) and camplan.js plays them. Used for the M2 check and as the starting point of the storyboard.
import argparse, json, re, statistics as st
from pathlib import Path
ap = argparse.ArgumentParser(); ap.add_argument('root', nargs='?', default='.'); ap.add_argument('--out', default='film.json'); a = ap.parse_args()
R = Path(a.root); src = (R / 'src/shots.js').read_text(encoding='utf-8'); T = json.loads((R / 'src/timing.json').read_text(encoding='utf-8'))
D = json.loads((R / 'out/camdump.json').read_text(encoding='utf-8'))
S = [(m[0], float(m[1]), m[2], m[3]) for m in re.findall(r"^S\('([^']+)',\s*([\d.]+),\s*'(\w+)',\s*([\w.]+)", src, re.M)]
eng = (R / 'STAGE.json'); engine = json.loads(eng.read_text(encoding='utf-8'))['engine'] if eng.exists() else None
shots = []
for i, (sid, t0, tr, setn) in enumerate(S):
    t1 = S[i + 1][1] if i + 1 < len(S) else T['end']
    fr = [d for d in D if d.get('shot') == sid]; sp = [d['speed'] for d in fr if d.get('speed') is not None]
    run = best = 0
    for v in sp: run = run + 1 if v < .3 else 0; best = max(best, run)
    words = [c[2].replace('*', '') for c in T['caps'] if t0 <= c[0] < t1]
    cast = sorted({c['id'] for d in fr for c in d.get('chars', [])})
    shots.append({'id': sid, 't0': round(t0, 3), 't1': round(t1, 3), 'tr': tr, 'set': setn.split('.')[-1].lower(), 'words': ' '.join(words), 'cast': cast,
                  'measured': {'speed_med': round(st.median(sp), 2) if sp else None, 'speed_max': round(max(sp), 1) if sp else None, 'freeze_f': best},
                  'cam': None, 'acts': [], 'sfx': []})
film = {'schema': 'film/1', 'engine': engine, 'fps': 30, 'end': T['end'], 'cutGate': [1.5, 4.1], 'source': 'converted from shots.js (read only)', 'shots': shots}
(R / a.out).write_text(json.dumps(film, ensure_ascii=False, indent=1), encoding='utf-8')
print(f'{len(shots)} shots -> {R / a.out}')
