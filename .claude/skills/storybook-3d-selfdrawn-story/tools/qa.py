# v7.6 python3 tools/qa.py <out_dir> "<name>" [project_root=.] : automatic checks of a delivered episode + one contact sheet.
#  ERROR (exit 1): a file is missing, size >= 30 MB, not 1080x1920 / 30 fps, duration off the timing by > .4 s,
#                  loudness off -14 LUFS by > 1.2, true peak > -1.0 dBTP, a black stretch > .5 s inside the clip.
#  warn: frozen picture > 2.5 s (a held shot without motion), long audio silence > 2 s, cover/post issues.
#  Sheet: <root>/out/qa_sheet.jpg = one frame every 2 s with the safe-zone lines drawn (top 220, bottom 480, right 160).
import json, os, re, subprocess, sys
O, NAME = sys.argv[1], sys.argv[2]; R = sys.argv[3] if len(sys.argv) > 3 else '.'
E, Wn = [], []
def sh(*a): return subprocess.run(a, capture_output=True, text=True)
def probe(f):
    j = json.loads(sh('ffprobe', '-v', 'error', '-show_entries', 'format=duration:stream=codec_type,width,height,r_frame_rate', '-of', 'json', f).stdout)
    v = next((s for s in j['streams'] if s['codec_type'] == 'video'), {}); return float(j['format']['duration']), v
end = None
try: end = json.load(open(f'{R}/src/timing.json'))['end']
except Exception: Wn.append('no src/timing.json: duration not checked')
vids = [f'{O}/{NAME} (ไม่มีเพลง).mp4', f'{O}/{NAME} (มีเพลง).mp4']
for f in vids:
    b = os.path.basename(f)
    if not os.path.exists(f): (E if 'ไม่มีเพลง' in b else Wn).append(f'missing {b}'); continue
    mb = os.path.getsize(f) / 1e6; d, v = probe(f)
    if mb >= 30: E.append(f'{b}: {mb:.1f} MB (>= 30)')
    if (v.get('width'), v.get('height')) != (1080, 1920): E.append(f'{b}: {v.get("width")}x{v.get("height")}, not 1080x1920')
    if v.get('r_frame_rate') not in ('30/1', '30000/1001'): E.append(f'{b}: fps {v.get("r_frame_rate")}')
    if end and abs(d - end) > .4: E.append(f'{b}: {d:.2f} s vs timing end {end:.2f} s')
    L = sh('ffmpeg', '-hide_banner', '-i', f, '-af', 'ebur128=peak=true', '-f', 'null', '-').stderr
    I = re.findall(r'I:\s+(-?[\d.]+) LUFS', L); P = re.findall(r'Peak:\s+(-?[\d.]+) dBFS', L)
    if I and abs(float(I[-1]) + 14) > 1.2: E.append(f'{b}: loudness {I[-1]} LUFS (target -14)')
    if P and float(P[-1]) > -1.0: E.append(f'{b}: true peak {P[-1]} dBTP (> -1.0)')
    bl = sh('ffmpeg', '-hide_banner', '-i', f, '-vf', 'blackdetect=d=0.5:pix_th=0.06', '-an', '-f', 'null', '-').stderr
    for s0, s1 in re.findall(r'black_start:([\d.]+) black_end:([\d.]+)', bl):
        if float(s0) > .2 and (not end or float(s1) < end - .5): E.append(f'{b}: black {float(s0):.2f}-{float(s1):.2f} s')
    if 'ไม่มีเพลง' in b:
        fr = sh('ffmpeg', '-hide_banner', '-i', f, '-vf', 'scale=270:-2,freezedetect=n=0.002:d=2.5', '-an', '-f', 'null', '-').stderr
        for s0 in re.findall(r'freeze_start: ([\d.]+)', fr): Wn.append(f'{b}: picture frozen >= 2.5 s from {float(s0):.1f} s (add motion: live(), camera drift)')
        si = sh('ffmpeg', '-hide_banner', '-i', f, '-af', 'silencedetect=n=-45dB:d=2', '-vn', '-f', 'null', '-').stderr
        for s0 in re.findall(r'silence_start: ([\d.]+)', si):
            if float(s0) > .5: Wn.append(f'{b}: audio silent >= 2 s from {float(s0):.1f} s')
c = f'{O}/ปก.jpg'
if not os.path.exists(c): E.append('missing ปก.jpg')
else:
    _, v = probe(c)
    if (v.get('width'), v.get('height')) != (1080, 1920): Wn.append(f'cover is {v.get("width")}x{v.get("height")}')
    Wn.append('cover: check by eye that all text + the face sit inside y 300-1620 (profile grid crops to 3:4)')
pt = f'{O}/โพสต์.txt'
if not os.path.exists(pt) or os.path.getsize(pt) < 40: E.append('missing/empty โพสต์.txt')
src = vids[0] if os.path.exists(vids[0]) else None
if src:
    d, _ = probe(src); n = max(1, int(d // 2)); cols = 8; rows = (n + cols - 1) // cols; os.makedirs(f'{R}/out', exist_ok=True)
    vf = (f"fps=1/2,scale=216:384,drawbox=y=44:w=iw:h=1:color=red,drawbox=y=288:w=iw:h=1:color=red,"
          f"drawbox=x=184:y=140:w=1:h=148:color=red,drawtext=text='%{{pts\\:hms}}':x=4:y=4:fontsize=14:fontcolor=yellow:box=1:boxcolor=black@0.5,tile={cols}x{rows}")
    r = sh('ffmpeg', '-v', 'error', '-y', '-i', src, '-vf', vf, '-frames:v', '1', f'{R}/out/qa_sheet.jpg')
    if r.returncode: Wn.append('contact sheet failed: ' + r.stderr[-120:])
for m in E: print('ERROR', m)
for m in Wn: print('warn ', m)
print(f'qa: {len(E)} errors, {len(Wn)} warnings; sheet {R}/out/qa_sheet.jpg'); sys.exit(1 if E else 0)
