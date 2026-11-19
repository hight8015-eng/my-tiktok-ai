#!/bin/bash
# sheet.sh <dir> <out_prefix> : time-sorted contact sheets 8x2 with labels
D=$1; O=$2; i=0; rm -rf /tmp/_sh; mkdir -p /tmp/_sh
for f in $(ls $D/t*.jpg | sed 's/.*\/t//; s/\.jpg//' | sort -g); do ffmpeg -v error -y -i $D/t$f.jpg -vf "scale=270:-1,drawtext=text='$f':x=6:y=6:fontsize=22:fontcolor=yellow:box=1:boxcolor=black@.6" /tmp/_sh/$(printf %03d $i).jpg; i=$((i+1)); done
ffmpeg -v error -y -i /tmp/_sh/%03d.jpg -vf "tile=8x2:padding=4" ${O}%d.jpg
ls ${O}*
