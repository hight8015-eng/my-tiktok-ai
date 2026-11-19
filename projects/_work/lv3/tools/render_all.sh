#!/bin/bash
# bash tools/render_all.sh [workers=4] : renders the whole timeline (src/timing.json end) into out/part*.mp4 in parallel and checks frame counts
# ~4.5 s per frame per worker on a 4-CPU box (SwiftShader): a 70 s clip takes ~45 min with 4 workers.
set -e; cd "$(dirname "$0")/.."; N=${1:-4}; mkdir -p out; rm -f out/part*.mp4
F=$(python3 -c "import json;print(int(round(json.load(open('src/timing.json'))['end']*30)))"); per=$(( (F + N - 1) / N ))
for i in $(seq 0 $((N-1))); do a=$((i*per)); z=$(( (i+1)*per )); [ $z -gt $F ] && z=$F; nohup node src/render.js video out/part$i.mp4 $a $z > out/r$i.log 2>&1 & done
wait
grep -l "PAGEERR" out/r*.log && { echo "page errors, see out/r*.log"; exit 1; } || true
tot=0; for i in $(seq 0 $((N-1))); do n=$(ffprobe -v error -count_frames -select_streams v -show_entries stream=nb_read_frames -of csv=p=0 out/part$i.mp4); tot=$((tot+n)); done
echo "frames $tot / $F"; [ $tot -eq $F ] || { echo "FRAME COUNT MISMATCH"; exit 1; }
