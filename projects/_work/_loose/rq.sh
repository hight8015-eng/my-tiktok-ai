#!/bin/bash
# bash rq.sh <project_dir> : segmented detached render (resumable), 4 workers, 100-frame segments -> out/full.mp4
cd "$1" || exit 1; mkdir -p out/seg
F=$(python3 -c "import json;print(int(round(json.load(open('src/timing.json'))['end']*30)))"); SEG=100; NS=$(( (F + SEG - 1) / SEG ))
worker() { for ((k=$1; k<NS; k+=4)); do a=$((k*SEG)); b=$((a+SEG)); [ $b -gt $F ] && b=$F; f=$(printf "out/seg/s_%05d_%05d.mp4" $a $b); [ -f "$f.ok" ] && continue
  node src/render.js video "$f.tmp.mp4" $a $b > out/seg/w$1.log 2>&1 && n=$(ffprobe -v error -count_frames -select_streams v -show_entries stream=nb_read_frames -of csv=p=0 "$f.tmp.mp4") && [ "$n" = "$((b-a))" ] && mv "$f.tmp.mp4" "$f" && touch "$f.ok"
  echo "seg $k/$NS w$1 $(date +%T)" >> out/progress.log; done; }
for w in 0 1 2 3; do worker $w & done; wait
ok=$(ls out/seg/*.ok 2>/dev/null | wc -l); if [ "$ok" = "$NS" ]; then ls out/seg/s_*.mp4 | sort | sed "s#^#file '$(pwd)/#; s#\$#'#" > out/seg/list.txt; ffmpeg -v error -y -f concat -safe 0 -i out/seg/list.txt -c copy out/full.mp4 && touch out/RENDER_DONE; else echo "INCOMPLETE $ok/$NS" >> out/progress.log; fi
