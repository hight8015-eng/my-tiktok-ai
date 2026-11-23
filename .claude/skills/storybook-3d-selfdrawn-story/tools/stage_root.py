# python tools/stage_root.py <episode_dir> <render_root> [--engine v7.9|worktree] [--force]
# v8 (2026-11-23): builds a render folder from git so there is ONE engine source (this skill's src/) and nobody edits code in
# render/. Layers, later wins:  engine (git tag engine/<ver>, or the working tree)  ->  series (chars/, sets/)  ->  episode
# (project.json, shots.js, timing.json, any other *.js in the episode folder)  ->  "overlay" files named in <episode>/stage.json.
# Writes <render_root>/STAGE.json (engine version + sha256 of every staged src file) for tools/engine_check.py.
# <episode>/stage.json (optional): {"engine": "v7.9", "overlay": {"src/zc.js": "../ep3/zc.js"}}
# Node modules: Node looks for node_modules in every parent folder, so one shared render/node_modules (Playwright) serves all roots.
import argparse, hashlib, io, json, os, shutil, subprocess, sys, tarfile, time
from pathlib import Path

SKILL = Path(__file__).resolve().parents[1]; REPO = SKILL.parents[2]; REL = SKILL.relative_to(REPO).as_posix()
ap = argparse.ArgumentParser(); ap.add_argument('episode'); ap.add_argument('root')
ap.add_argument('--engine', help='engine tag (v7.9) or "worktree"; default: stage.json, else ENGINE_VERSION')
ap.add_argument('--force', action='store_true', help='replace an existing render root (its out/ and aud/ are kept)')
a = ap.parse_args()
ep, root = Path(a.episode).resolve(), Path(a.root).resolve(); series = ep.parent
cfg = json.loads((ep / 'stage.json').read_text(encoding='utf-8')) if (ep / 'stage.json').exists() else {}
ver = a.engine or cfg.get('engine') or (SKILL / 'ENGINE_VERSION').read_text().strip()
src = root / 'src'
if src.exists():
    if not a.force: sys.exit(f'{src} exists: use --force to rebuild it (out/ and aud/ are kept)')
    shutil.rmtree(src); shutil.rmtree(root / 'tools', ignore_errors=True)
src.mkdir(parents=True)

# 1. engine + tools
if ver == 'worktree':
    shutil.copytree(SKILL / 'src', src, dirs_exist_ok=True); shutil.copytree(SKILL / 'tools', root / 'tools', dirs_exist_ok=True, ignore=shutil.ignore_patterns('__pycache__'))
else:
    tar = subprocess.run(['git', '-C', str(REPO), 'archive', '--format=tar', f'engine/{ver}', f'{REL}/src', f'{REL}/tools'], capture_output=True)
    if tar.returncode: sys.exit(f'no git tag engine/{ver}: {tar.stderr.decode(errors="replace")[:300]}')
    with tarfile.open(fileobj=io.BytesIO(tar.stdout)) as t:
        for m in t.getmembers():
            if not m.isfile(): continue
            rel = m.name[len(REL) + 1:]; dst = root / rel; dst.parent.mkdir(parents=True, exist_ok=True); dst.write_bytes(t.extractfile(m).read())
for f in ('shots.js', 'project.json', 'timing.json', 'zc.js'):          # the skill's example episode never leaks into a real one
    (src / f).unlink(missing_ok=True)

# 2. series assets
if (series / 'sets').is_dir(): shutil.copytree(series / 'sets', src / 'sets', dirs_exist_ok=True)
if (series / 'chars').is_dir(): shutil.copytree(series / 'chars', root / 'chars', dirs_exist_ok=True)
if (series / 'src' / 'zc.js').exists(): shutil.copy2(series / 'src' / 'zc.js', src / 'zc.js')

# 3. episode files, then overlays
for f in ep.iterdir():
    if f.is_file() and (f.suffix == '.js' or f.name in ('project.json', 'timing.json')) and f.name != 'shots_body.js': shutil.copy2(f, src / f.name)
for dst, s in cfg.get('overlay', {}).items():
    p = (ep / s).resolve(); (root / dst).parent.mkdir(parents=True, exist_ok=True); shutil.copy2(p, root / dst)
for need in ('shots.js', 'project.json', 'zc.js'):
    if not (src / need).exists(): sys.exit(f'missing src/{need}: add it to the episode or an overlay in stage.json')

# 4. voice next to the root (project.json "vo" is relative to the root) + character sprites
P = json.loads((src / 'project.json').read_text(encoding='utf-8'))
for cand in (ep / P['vo'], ep / 'voice' / Path(P['vo']).name):
    if cand.exists(): shutil.copy2(cand, root / P['vo']); break
else: print(f'WARN: voice {P["vo"]} not found in {ep}')
env = dict(os.environ, PYTHONUTF8='1')
if (root / 'chars').is_dir():
    for cmd in (['tools/sprites.py', 'chars'], ['tools/headmask.py']):
        r = subprocess.run([sys.executable, *cmd], cwd=root, capture_output=True, text=True, env=env)
        if r.returncode: sys.exit(f'{cmd[0]} failed:\n{r.stderr[-800:]}')
if (root / P['vo']).exists():                                          # aud/vo.wav for the mix; the committed timing.json stays the truth
    keep = (src / 'timing.json').read_bytes() if (src / 'timing.json').exists() else None
    r = subprocess.run([sys.executable, 'tools/timing.py'], cwd=root, capture_output=True, text=True, env=env)
    if r.returncode: print('WARN: timing.py failed, no aud/vo.wav:', r.stdout[-300:], r.stderr[-300:])
    elif keep is not None:
        same = json.loads(keep) == json.loads((src / 'timing.json').read_text(encoding='utf-8'))
        (src / 'timing.json').write_bytes(keep)
        if not same: print('WARN: timing.py gives a different timing.json than the committed one: kept the committed one')

# 5. manifest for engine_check.py
man = {str(p.relative_to(root).as_posix()): hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(src.rglob('*')) if p.is_file()}
(root / 'STAGE.json').write_text(json.dumps({'engine': ver, 'episode': str(ep), 'staged': time.strftime('%Y-%m-%d %H:%M'), 'files': man}, indent=1, ensure_ascii=False), encoding='utf-8')
nm = next((p / 'node_modules' for p in [root, *root.parents] if (p / 'node_modules' / 'playwright').is_dir()), None)
print(f'staged {ep.name} with engine {ver} -> {root}  ({len(man)} files)' + ('' if nm else '\nWARN: no node_modules/playwright in this folder or a parent'))
