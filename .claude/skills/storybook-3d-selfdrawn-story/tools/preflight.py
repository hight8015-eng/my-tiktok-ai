# python tools/preflight.py [render_root=.] [--min-free-gb 20] [--workers 8]   -> exit 1 if a render should not start
# v8 (2026-11-23): checks before every render (the C: drive ran full during the ep3 render and cut 5 parts short).
import argparse, json, os, shutil, subprocess, sys, tempfile
from pathlib import Path
ap = argparse.ArgumentParser(); ap.add_argument('root', nargs='?', default='.'); ap.add_argument('--min-free-gb', type=float, default=20)
ap.add_argument('--workers', type=int, default=8); a = ap.parse_args(); R = Path(a.root).resolve(); rows = []
def g(ok, what, det=''): rows.append(('PASS' if ok is True else ('WARN' if ok is None else 'FAIL'), what, det))
free = lambda p: shutil.disk_usage(p).free / 1e9
T = json.loads((R / 'src/timing.json').read_text(encoding='utf-8')) if (R / 'src/timing.json').exists() else None
g(T is not None, 'src/timing.json present')
frames = int(round(T['end'] * 30)) if T else 0; need = frames * .012 + 3          # parts ~10 MB / 100 f at 1080x1920 + full.mp4 + audio
fr = free(R); g(fr >= max(a.min_free_gb, need), f'free space on {R.drive or R.anchor}', f'{fr:.1f} GB free, need >= {max(a.min_free_gb, need):.1f} GB')
tmp = os.environ.get('TEMP') or tempfile.gettempdir(); td = Path(tmp).resolve()
g(td.drive.lower() != 'c:', 'TEMP is not on C:', str(td) + ('' if td.drive.lower() != 'c:' else '  -> set TEMP=TMP=E:/Claude Animate/render/tmp'))
if Path('C:/').exists(): cf = free('C:/'); g(True if cf >= 2 else (None if cf >= 1 else False), 'C: keeps >= 2 GB', f'{cf:.1f} GB free')
nm = next((p / 'node_modules' / 'playwright' for p in [R, *R.parents] if (p / 'node_modules' / 'playwright').is_dir()), None)
g(nm is not None, 'playwright reachable', str(nm or 'not found in this folder or a parent'))
ff = shutil.which('ffmpeg') and shutil.which('ffprobe'); g(bool(ff), 'ffmpeg + ffprobe on PATH')
if (R / 'STAGE.json').exists():
    r = subprocess.run([sys.executable, str(Path(__file__).with_name('engine_check.py')), str(R)], capture_output=True, text=True)
    g(r.returncode == 0, 'engine_check', r.stdout.strip().splitlines()[-1] if r.stdout.strip() else r.stderr[-200:])
else: g(None, 'engine_check', 'no STAGE.json (root not made by stage_root.py)')
sj = R / 'src/sprites/sprites.json'
if sj.exists():
    S = json.loads(sj.read_text(encoding='utf-8')); miss = [k for k, v in S.items() if 'ballH' not in v]
    g(not miss, 'sprites have head masks (headmask.py ran)', ', '.join(miss[:6]))
else: g(False, 'src/sprites/sprites.json present')
try:
    import psutil; ram = psutil.virtual_memory().available / 1e9; g(True if ram >= a.workers * 1.2 else None, f'RAM for {a.workers} workers', f'{ram:.1f} GB available, ~1.2 GB per worker')
except ImportError: pass
print(f'{R}: {frames} frames ({frames / 30:.1f} s)')
for st, w, d in rows: print(f'{st:4}  {w:42}  {d}')
fail = sum(r[0] == 'FAIL' for r in rows); print('READY' if not fail else f'NOT READY: {fail} FAIL'); sys.exit(1 if fail else 0)
