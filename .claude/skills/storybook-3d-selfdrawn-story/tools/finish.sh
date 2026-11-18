#!/bin/bash
# bash tools/finish.sh <out_dir> "<name>" [max_MB=30]
# concat out/part*.mp4 -> x264 (crf raised until < max_MB) + aud/nomusic.wav (and aud/music.wav if present) compressed/limited + 2-pass loudnorm -14 LUFS / -1.5 dBTP
set -e; cd "$(dirname "$0")/.."; O=$1; NAME=$2; MAX=${3:-30}; mkdir -p "$O"
# SRC=<video> skips the concat (e.g. after splicing re-rendered segments into out/full2.mp4)
if [ -z "$SRC" ]; then ls out/part*.mp4 | sort -V | sed "s/^/file '$(pwd | sed 's/\//\\\//g')\//; s/$/'/" > out/list.txt
  ffmpeg -v error -y -f concat -safe 0 -i out/list.txt -c copy out/full.mp4; SRC=out/full.mp4; fi
master() {  # $1 = aud/<name>.wav -> aud/<name>_final.wav
  ffmpeg -v error -y -i "aud/$1.wav" -af "acompressor=threshold=0.25:ratio=3:attack=5:release=120:makeup=1,volume=8.2dB,alimiter=limit=0.74:attack=2:release=60:level=disabled" -ar 48000 "aud/$1_lim.wav"
  J=$(ffmpeg -hide_banner -i "aud/$1_lim.wav" -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | tail -12)
  read II TP LRA TH OFF <<< $(echo "$J" | python3 -c "import json,sys;d=json.loads(sys.stdin.read());print(d['input_i'],d['input_tp'],d['input_lra'],d['input_thresh'],d['target_offset'])")
  ffmpeg -v error -y -i "aud/$1_lim.wav" -af loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$II:measured_TP=$TP:measured_LRA=$LRA:measured_thresh=$TH:offset=$OFF:linear=true -ar 48000 "aud/$1_final.wav"
}
master nomusic; [ -f aud/music.wav ] && master music
crf=20
while :; do
  ffmpeg -v error -y -i "$SRC" -c:v libx264 -preset slow -crf $crf -tune animation -pix_fmt yuv420p -movflags +faststart -an out/.v.mp4
  sz=$(python3 -c "import os;print(os.path.getsize('out/.v.mp4')/1e6+1.8)")
  python3 -c "import sys;sys.exit(0 if $sz < $MAX else 1)" && break; crf=$((crf+2)); echo "too big ($sz MB) -> crf $crf"
done
ffmpeg -v error -y -i out/.v.mp4 -i aud/nomusic_final.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "$O/$NAME (ไม่มีเพลง).mp4"
[ -f aud/music_final.wav ] && ffmpeg -v error -y -i out/.v.mp4 -i aud/music_final.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "$O/$NAME (มีเพลง).mp4"
for f in "$O/$NAME"*.mp4; do echo "$f"; ffmpeg -hide_banner -i "$f" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+I:|Peak:" | tail -2; done; echo "crf $crf"; ls -la "$O"
[ -f tools/postmeta.py ] && python3 tools/postmeta.py . "$1" || true   # v4.13: ready-to-paste post text + hashtags (โพสต์.txt)
