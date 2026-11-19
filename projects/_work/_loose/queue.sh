#!/bin/bash
# render episodes in 100-frame segments (4 workers), then finish + cover; writes $S/done_epN when an episode is delivered-ready
S=/tmp/claude-0/-home-user-my-tiktok-ai/7ab5bec5-d0dd-574d-90b8-8dcb840304db/scratchpad
for e in "$@"; do
  cd $S/ep$e || continue; mkdir -p out/seg
  F=$(python3 -c "import json;print(int(round(json.load(open('src/timing.json'))['end']*30)))"); SEG=100; NS=$(( (F + SEG - 1) / SEG ))
  worker() { local w=$1; for ((k=w; k<NS; k+=4)); do a=$((k*SEG)); b=$(( (k+1)*SEG )); [ $b -gt $F ] && b=$F; f=$(printf "out/seg/s_%05d_%05d.mp4" $a $b)
      if [ -f "$f.ok" ]; then continue; fi
      node src/render.js video "$f.tmp.mp4" $a $b > out/seg/w$w.log 2>&1 && n=$(ffprobe -v error -count_frames -select_streams v -show_entries stream=nb_read_frames -of csv=p=0 "$f.tmp.mp4") && [ "$n" -eq $((b-a)) ] && mv "$f.tmp.mp4" "$f" && touch "$f.ok"
      echo "ep$e seg $k/$NS w$w $(date +%T)" >> $S/queue.log; done; }
  for w in 0 1 2 3; do worker $w & done; wait
  ok=$(ls out/seg/*.ok 2>/dev/null | wc -l); [ $ok -eq $NS ] || { echo "ep$e INCOMPLETE $ok/$NS" >> $S/queue.log; continue; }
  ls out/seg/s_*.mp4 | sort | sed "s|^|file '$PWD/|; s|$|'|" > out/seglist.txt && ffmpeg -v error -y -f concat -safe 0 -i out/seglist.txt -c copy out/full.mp4
  D="/home/user/my-tiktok-ai/output/เกมเอาชีวิตรอด ตอน $e"; mkdir -p "$D"
  SRC=out/full.mp4 bash tools/finish.sh "$D" "เกมเอาชีวิตรอด ตอน $e" 30 >> $S/queue.log 2>&1 && bash tools/cover.sh "$D/ปก.jpg" >> $S/queue.log 2>&1 && touch $S/done_ep$e && echo "ep$e DONE $(date +%T)" >> $S/queue.log
done
