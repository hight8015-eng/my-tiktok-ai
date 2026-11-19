#!/bin/bash
# bash tools/tighten.sh <in_audio> <out.wav> [speed=1.0] [max_gap=0.35] [keep=0.22]
# cuts dead air: every silence longer than max_gap s is shortened to `keep` s (start/end silence trimmed too),
# then optionally speeds speech up without changing pitch (speed 1.05-1.15 still sounds natural). Run BEFORE timing.py.
IN=$1; OUT=$2; SP=${3:-1.0}; GAP=${4:-0.35}; KEEP=${5:-0.22}
ffmpeg -v error -y -i "$IN" -af "silenceremove=start_periods=1:start_silence=0.05:start_threshold=-42dB:stop_periods=-1:stop_duration=$GAP:stop_silence=$KEEP:stop_threshold=-42dB,areverse,silenceremove=start_periods=1:start_silence=0.15:start_threshold=-42dB,areverse,atempo=$SP" -ar 48000 -ac 1 "$OUT"
a=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$IN"); b=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT")
python3 -c "print(f'{float(\"$a\"):.1f}s -> {float(\"$b\"):.1f}s  ({100*(1-float(\"$b\")/float(\"$a\")):.0f}% shorter)')"
