# python tools/engine_check.py [render_root=.]   -> exit 1 if a staged src file was edited, added or removed after stage_root.py
# v8 (2026-11-23): code changes belong in the skill's src/ (git) or the episode folder, never in render/<ep>/src (ep4 lesson:
# chars.js / shots.js edited in render/pm4_work only, outside git). Fix the source, then re-stage with stage_root.py --force.
import hashlib, json, sys
from pathlib import Path
root = Path(sys.argv[1] if len(sys.argv) > 1 else '.'); m = root / 'STAGE.json'
if not m.exists(): sys.exit(f'no {m}: this root was not made by stage_root.py')
S = json.loads(m.read_text(encoding='utf-8')); want = S['files']
have = {p.relative_to(root).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest() for p in (root / 'src').rglob('*') if p.is_file()}
changed = sorted(k for k in want if k in have and have[k] != want[k]); gone = sorted(set(want) - set(have)); new = sorted(set(have) - set(want))
print(f"engine {S['engine']}, staged {S['staged']}: {len(want)} files")
for k in changed: print('EDITED ', k)
for k in gone: print('MISSING', k)
for k in new: print('ADDED  ', k)
if changed or gone or new: print('FAIL: render root differs from what was staged'); sys.exit(1)
print('PASS: render root matches the staged engine + episode')
