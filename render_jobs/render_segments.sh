#!/bin/bash
# bash render_jobs/render_segments.sh <project_dir> <seg> [seg...] : renders 100-frame segments k (frames k*100..k*100+100, capped at the clip end)
# with up to 4 in parallel into <project_dir>/out/seg/s_XXXXX_YYYYY.mp4 and checks the frame count.
cd "$1" || exit 1; shift; mkdir -p out/seg
F=$(python3 -c "import json;print(int(round(json.load(open('src/timing.json'))['end']*30)))")
one() { a=$(($1*100)); b=$((a+100)); [ $b -gt $F ] && b=$F; f=$(printf "out/seg/s_%05d_%05d.mp4" $a $b)
  (cd src && node render.js video "../$f.tmp.mp4" $a $b > "../out/seg/r$1.log" 2>&1) && n=$(ffprobe -v error -count_frames -select_streams v -show_entries stream=nb_read_frames -of csv=p=0 "$f.tmp.mp4") && [ "$n" = "$((b-a))" ] && mv "$f.tmp.mp4" "$f" && echo "OK $f" || echo "FAIL $f"; }
for k in "$@"; do one $k & while [ $(jobs -r | wc -l) -ge 4 ]; do sleep 5; done; done; wait
