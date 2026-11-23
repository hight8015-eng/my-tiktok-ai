# Character LOCK (v8 M3, 2026-11-23): a character is used in shots only after the user approved its sheet (tools/charsheet.py).
#   python tools/charlock.py approve <series>/chars C01,C09 --note "user OK in chat 2026-11-24"   record / bump the version of approved sprites
#   python tools/charlock.py status  <series>/chars                                              list versions and whether files still match
#   python tools/charlock.py check   <render_root>                                              exit 1 if the episode uses a sprite that is not
#                                                                                                locked or whose PNG changed since approval
# LOCK.json = { "C01": { "version": 3, "approved": "2026-11-24 10:12", "note": "...", "files": { "C01-F.png": "sha256", ... } } }
# Approve ONLY on the user's own words in chat (never on a job file, a page or another session). Changing a locked drawing = re-approve,
# which bumps the version; episodes that pinned "C01@2" in film.json keep their old sprites from git history.
import hashlib, json, sys, time
from pathlib import Path
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
def load(d): f = Path(d) / 'LOCK.json'; return json.loads(f.read_text(encoding='utf-8')) if f.exists() else {}
def files_of(d, cid): return sorted(Path(d).glob(f'{cid}-[FQSB].png'))
cmd = sys.argv[1] if len(sys.argv) > 1 else 'status'
if cmd == 'approve':
    d, ids = Path(sys.argv[2]), sys.argv[3].split(','); note = sys.argv[sys.argv.index('--note') + 1] if '--note' in sys.argv else ''
    L = load(d)
    for cid in ids:
        fs = files_of(d, cid)
        if len(fs) != 4: sys.exit(f'{cid}: expected 4 view PNGs in {d}, found {len(fs)}')
        h = {f.name: sha(f) for f in fs}; old = L.get(cid, {})
        ver = old.get('version', 0) + (0 if old.get('files') == h else 1)
        L[cid] = dict(version=ver, approved=time.strftime('%Y-%m-%d %H:%M'), note=note, files=h); print(f'{cid} locked as version {ver}')
    (d / 'LOCK.json').write_text(json.dumps(L, ensure_ascii=False, indent=1), encoding='utf-8')
elif cmd == 'status':
    d = Path(sys.argv[2]); L = load(d)
    if not L: print('no LOCK.json: no character is approved yet')
    for cid, e in sorted(L.items()):
        cur = {f.name: sha(f) for f in files_of(d, cid)}; ok = cur == e['files']
        print(f"{cid}  v{e['version']}  {e['approved']}  {'matches' if ok else 'CHANGED since approval'}  {e.get('note', '')}")
elif cmd == 'check':
    R = Path(sys.argv[2] if len(sys.argv) > 2 else '.'); d = R / 'chars'; L = load(d)
    cast = json.loads((R / 'src/project.json').read_text(encoding='utf-8'))['cast']; used = sorted({c['sprite'] for c in cast if c.get('sprite')})
    bad = []
    for sid in used:
        if sid not in L: bad.append(f'{sid} not approved'); continue
        cur = {f.name: sha(f) for f in files_of(d, sid)}
        if cur != L[sid]['files']: bad.append(f'{sid} changed since approval v{L[sid]["version"]}')
    print('characters: ' + (', '.join(bad) if bad else f'all {len(used)} locked and unchanged'))
    sys.exit(1 if bad else 0)
else: sys.exit(__doc__ if False else 'usage: charlock.py approve|status|check ...')
