#!/bin/bash
S=/tmp/claude-0/-home-user-my-tiktok-ai/7ab5bec5-d0dd-574d-90b8-8dcb840304db/scratchpad
cd $S/demo8; rm -f o/p*.mp4
for w in 0 1 2 3; do a=$((w*53)); b=$((a+53)); [ $w = 3 ] && b=210; node src/render.js video o/p$w.mp4 $a $b > o/w$w.log 2>&1 & done; wait
cd $S/demo10; rm -f o/q*.mp4; node src/render.js video o/q0.mp4 0 33 > o/w0.log 2>&1 & node src/render.js video o/q1.mp4 33 66 > o/w1.log 2>&1 & wait
printf "file '$S/demo10/o/q0.mp4'\nfile '$S/demo10/o/q1.mp4'\n" > o/l.txt; for w in 0 1 2 3; do echo "file '$S/demo8/o/p$w.mp4'" >> o/l.txt; done
ffmpeg -v error -y -f concat -safe 0 -i o/l.txt -c copy o/v.mp4
ffmpeg -v error -y -i $S/demo8/o/a.wav -af "adelay=2200|2200,apad=whole_dur=9.2" -t 9.2 o/a.wav
ffmpeg -v error -y -i o/v.mp4 -i o/a.wav -c:v copy -c:a aac -b:a 192k -shortest "/home/user/my-tiktok-ai/output/ตัวอย่าง สัดส่วนตัวละครใหม่.mp4"
ffmpeg -v error -y -i o/v.mp4 -vf "fps=3,scale=170:-1,tile=10x3" -frames:v 1 o/sheet.jpg
touch $S/done_r10
