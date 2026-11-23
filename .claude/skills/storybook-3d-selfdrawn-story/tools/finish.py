# python tools/finish.py <out_dir> "<name>" [--max-mb 29] [--src video.mp4]   (run from the project root)
# v8 (2026-11-23): Windows-safe replacement for finish.sh (kept beside it). Same result: concat out/part*.mp4 -> master
# aud/nomusic.wav (+ aud/music.wav) to -14 LUFS / -1.5 dBTP -> x264 with the crf raised until the file fits --max-mb ->
# "<name> (ไม่มีเพลง).mp4" + "<name> (มีเพลง).mp4". Fixes from ep4: concat list uses plain file names (Windows ffmpeg cannot open
# /e/... paths), loudnorm JSON is found with a regex (ffmpeg prints other lines after it), no bash/python3 shim needed.
import argparse, glob, json, os, re, shutil, subprocess, sys

ap = argparse.ArgumentParser()
ap.add_argument('out_dir'); ap.add_argument('name')
ap.add_argument('--max-mb', type=float, default=29.0, help='largest file size in MB (SendUserFile limit is 30 MiB)')
ap.add_argument('--src', help='a finished picture instead of out/part*.mp4')
ap.add_argument('--crf', type=int, default=23, help='first crf to try')
a = ap.parse_args()

def run(cmd, **k):
    r = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', errors='replace', **k)
    if r.returncode: sys.exit(f'FAILED: {" ".join(cmd[:4])} ...\n{r.stderr[-1500:]}')
    return r

def frames(p):
    out = run(['ffprobe', '-v', 'error', '-count_frames', '-select_streams', 'v', '-show_entries', 'stream=nb_read_frames', '-of', 'csv=p=0', p]).stdout
    return int(re.sub(r'\D', '', out) or 0)

# --- safety: temp files on E:, enough free space
tmp = os.environ.get('TEMP', '')
if tmp[:2].lower() == 'c:' or not tmp:
    os.environ['TEMP'] = os.environ['TMP'] = 'E:/Claude Animate/render/tmp'; os.makedirs(os.environ['TEMP'], exist_ok=True)
free = shutil.disk_usage(os.path.abspath('.')).free / 1e9
if free < 5: sys.exit(f'only {free:.1f} GB free on this drive: stop (need >= 5 GB)')

# --- picture
T = json.load(open('src/timing.json', encoding='utf-8')); want = int(round(T['end'] * 30))
src = a.src
if not src:
    parts = sorted(glob.glob('out/part*.mp4'), key=lambda p: int(re.findall(r'\d+', os.path.basename(p))[0]))
    if not parts: sys.exit('no out/part*.mp4')
    have = sum(frames(p) for p in parts)
    if have != want: sys.exit(f'frame count {have} != {want} (timing end {T["end"]} s): re-render the short part first')
    with open('out/list.txt', 'w', encoding='utf-8') as f:
        for p in parts: f.write(f"file '{os.path.basename(p)}'\n")
    run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', 'out/list.txt', '-c', 'copy', 'out/full.mp4']); src = 'out/full.mp4'
print('picture', src, frames(src), 'frames')

# --- sound: compressor + limiter, then two-pass loudnorm to -14 LUFS / -1.5 dBTP
def master(n):
    lim, fin = f'aud/{n}_lim.wav', f'aud/{n}_final.wav'
    run(['ffmpeg', '-v', 'error', '-y', '-i', f'aud/{n}.wav', '-af', 'acompressor=threshold=0.25:ratio=3:attack=5:release=120:makeup=1,volume=8.2dB,alimiter=limit=0.74:attack=2:release=60:level=disabled', '-ar', '48000', lim])
    err = run(['ffmpeg', '-hide_banner', '-i', lim, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-']).stderr
    d = json.loads(re.search(r'\{[^{}]*"input_i"[^{}]*\}', err, re.S).group(0))
    f = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={d['input_i']}:measured_TP={d['input_tp']}:measured_LRA={d['input_lra']}"
         f":measured_thresh={d['input_thresh']}:offset={d['target_offset']}:linear=true")
    run(['ffmpeg', '-v', 'error', '-y', '-i', lim, '-af', f, '-ar', '48000', fin]); return fin
mixes = [('ไม่มีเพลง', master('nomusic'))] + ([('มีเพลง', master('music'))] if os.path.exists('aud/music.wav') else [])

# --- encode: raise crf until video + audio fits
crf = a.crf; dur = want / 30
while True:
    run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-c:v', 'libx264', '-preset', 'slow', '-crf', str(crf), '-tune', 'animation', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', 'out/.v.mp4'])
    mb = os.path.getsize('out/.v.mp4') / 1e6 + 160e3 * dur / 8 / 1e6
    if mb < a.max_mb or crf >= 35: break
    crf += 2; print(f'too big ({mb:.1f} MB) -> crf {crf}')
os.makedirs(a.out_dir, exist_ok=True)
for tag, wav in mixes:
    out = os.path.join(a.out_dir, f'{a.name} ({tag}).mp4')
    run(['ffmpeg', '-v', 'error', '-y', '-i', 'out/.v.mp4', '-i', wav, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', out])
    st = run(['ffmpeg', '-hide_banner', '-i', out, '-af', 'ebur128=peak=true', '-f', 'null', '-']).stderr
    I = re.findall(r'I:\s+(-?[\d.]+) LUFS', st); P = re.findall(r'Peak:\s+(-?[\d.]+) dBFS', st)
    print(f'{out}  {os.path.getsize(out) / 1e6:.1f} MB  {I[-1] if I else "?"} LUFS  peak {P[-1] if P else "?"} dBFS')
print('crf', crf)
