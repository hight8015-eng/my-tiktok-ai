# python tools/export.py <out_dir> "<name>" [--src out/full.mp4] [--audio aud/music_final.wav] [--only youtube,tiktok,reels]
# v8 (2026-11-23): one upload file per platform from the full-quality picture (out/full.mp4) + a mastered mix (from finish.py).
# All three are 1080x1920, 30 fps, H.264 High + AAC 48 kHz, faststart; they differ in the video bitrate the platform re-encodes from.
# The values are conservative upload targets, not platform maximums. A clip longer than 180 s gets a warning (Shorts/Reels length).
import argparse, os, re, subprocess, sys

P = {  # name: (file tag, video maxrate kbps, audio kbps)
    'youtube': ('YouTube Shorts', 16000, 192),   # YouTube re-encodes everything: give it the most detail
    'tiktok':  ('TikTok', 10000, 160),
    'reels':   ('Reels IG-FB', 8000, 160),        # Instagram + Facebook Reels share one file
}
ap = argparse.ArgumentParser(); ap.add_argument('out_dir'); ap.add_argument('name')
ap.add_argument('--src', default='out/full.mp4'); ap.add_argument('--audio', default='aud/music_final.wav')
ap.add_argument('--only', default=','.join(P)); a = ap.parse_args()
for f in (a.src, a.audio):
    if not os.path.exists(f): sys.exit(f'missing {f} (run finish.py first)')
dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', a.src], capture_output=True, text=True).stdout.strip())
if dur > 180: print(f'WARN: {dur:.0f} s is longer than 180 s (Shorts / Reels)')
os.makedirs(a.out_dir, exist_ok=True)
for k in a.only.split(','):
    tag, vk, ak = P[k.strip()]; out = os.path.join(a.out_dir, f'{a.name} [{tag}].mp4')
    cmd = ['ffmpeg', '-v', 'error', '-y', '-i', a.src, '-i', a.audio, '-map', '0:v:0', '-map', '1:a:0',
           '-vf', 'scale=1080:1920:flags=lanczos,fps=30,format=yuv420p', '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'slow',
           '-crf', '17', '-maxrate', f'{vk}k', '-bufsize', f'{vk * 2}k', '-tune', 'animation', '-g', '60',
           '-c:a', 'aac', '-b:a', f'{ak}k', '-ar', '48000', '-shortest', '-movflags', '+faststart', out]
    r = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', errors='replace')
    if r.returncode: sys.exit(r.stderr[-1200:])
    print(f'{out}  {os.path.getsize(out) / 1e6:.1f} MB')
