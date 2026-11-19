# python3 tools/splice.py (run from the project root): splice re-rendered fix/s_A_B.mp4 segments (frames A..B) into out/full.mp4 -> out/full2.mp4
# re-render a segment: node src/render.js video fix/s_A_B.mp4 A B ; then SRC=out/full2.mp4 bash tools/finish.sh <out> "<name>"
import os, re, subprocess, json
fx = sorted([(int(m.group(1)), int(m.group(2)), 'fix/' + f) for f in os.listdir('fix') if (m := re.match(r's_(\d+)_(\d+)\.mp4$', f))])
N = int(round(json.load(open('src/timing.json'))['end'] * 30)); segs = []; cur = 0
for a, b, f in fx:
    if a > cur: segs.append(('out/full.mp4', cur, a))
    segs.append((f, None, None)); cur = b
if cur < N: segs.append(('out/full.mp4', cur, N))
os.makedirs('fix/o', exist_ok=True); lst = []
for f, a, b in segs:
    if a is None: lst.append(f); continue
    o = f'fix/o/o_{a}_{b}.mp4'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', f, '-vf', f'trim=start_frame={a}:end_frame={b},setpts=PTS-STARTPTS', '-r', '30', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', o], check=True); lst.append(o)
open('fix/list.txt', 'w').write(''.join(f"file '{os.path.abspath(x)}'\n" for x in lst))
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', 'fix/list.txt', '-c', 'copy', 'out/full2.mp4'], check=True)
print(len(segs), 'segments')
