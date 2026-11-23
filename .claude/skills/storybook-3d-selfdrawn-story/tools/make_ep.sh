#!/bin/bash
# v7.6 make_ep.sh: one command for a whole episode. Resumable: each finished stage leaves out/.stage/<name>.ok and is skipped next time.
#   bash tools/make_ep.sh <project_dir> "<episode name>" [vo_file] [--from STAGE] [--only STAGE] [--until STAGE]
# Stages (in order):
#   voice    vo_file -> tighten (1.12x, gaps .35) -> aud/vo.wav            (skipped if aud/vo.wav exists and no vo_file)
#   asr      faster-whisper word timestamps -> asr_fast.json
#   timing   align islands -> timing.py -> align caps -> lipsync (visemes)
#   --- STOP POINT: the shots are written by hand/AI between timing and lint (make_ep stops here if src/shots.js is missing) ---
#   lint     tools/prelint.py (errors stop the run)
#   render   resumable segmented render, 4 workers, 100-frame segments -> out/full.mp4 (delete out/seg/*.ok to redo segments)
#   steps    walkAlong heel strikes -> out/steps.json -> aud/steps.wav (footstep track)
#   audio    tools/audio_ep.py (the episode's SFX/music script; must write aud/nomusic.wav [+ aud/music.wav])
#   finish   tools/finish.sh: loudnorm -14 LUFS, < 30 MB, both versions + โพสต์.txt
#   cover    tools/cover.sh -> ปก.jpg in the output folder
#   qa       tools/qa.py: checks the delivered files + contact sheet (errors make the run fail)
# Env: WORKERS=4  SPEED=1.12  OUT=<repo>/output/<name>
set -u
P=$(cd "$1" && pwd) || exit 1; NAME=$2; shift 2
VO=""; FROM=""; ONLY=""; UNTIL=""
while [ $# -gt 0 ]; do case "$1" in --from) FROM=$2; shift 2;; --only) ONLY=$2; shift 2;; --until) UNTIL=$2; shift 2;; *) VO=$1; shift;; esac; done
REPO=${CLAUDE_PROJECT_DIR:-/home/user/my-tiktok-ai}; OUT=${OUT:-$REPO/output/$NAME}; W=${WORKERS:-4}; SPEED=${SPEED:-1.12}
ST="$P/out/.stage"; mkdir -p "$ST" "$P/aud"; cd "$P"
STAGES="voice asr timing lint render steps audio finish cover qa"
log() { echo "[make_ep $(date +%T)] $*" | tee -a out/make_ep.log; }
# --from X: forget X and everything after it
if [ -n "$FROM" ]; then on=0; for s in $STAGES; do [ "$s" = "$FROM" ] && on=1; [ $on = 1 ] && rm -f "$ST/$s.ok"; done; fi
[ -n "$ONLY" ] && rm -f "$ST/$ONLY.ok"
run() { # name, command...
  local s=$1; shift
  [ -n "$ONLY" ] && [ "$ONLY" != "$s" ] && return 0
  [ -f "$ST/$s.ok" ] && { log "skip $s (done)"; return 0; }
  log "== $s"; local t0=$SECONDS
  if "$@"; then touch "$ST/$s.ok"; log "ok $s ($((SECONDS - t0)) s)"; else log "FAILED $s"; exit 1; fi
  [ -n "$UNTIL" ] && [ "$UNTIL" = "$s" ] && { log "stopped after $s (--until)"; exit 0; }
}
st_voice() { if [ -n "$VO" ]; then bash tools/tighten.sh "$VO" aud/vo.wav "$SPEED"; else [ -f aud/vo.wav ]; fi; }
st_asr() { python3 tools/asr_words.py aud/vo.wav asr_fast.json > asr.txt && cat asr.txt; }
st_timing() { python3 tools/align.py . asr_fast.json islands && python3 tools/timing.py . && python3 tools/align.py . asr_fast.json caps && python3 tools/lipsync.py . && python3 tools/storyboard.py .; }
st_lint() { [ -f src/shots.js ] || { log "src/shots.js missing: write the shots (storyboard) now, then rerun"; return 1; }; python3 tools/prelint.py .; }
st_render() {
  F=$(python3 -c "import json;print(int(round(json.load(open('src/timing.json'))['end']*30)))"); SEG=100; NS=$(( (F + SEG - 1) / SEG )); mkdir -p out/seg
  worker() { for ((k=$1; k<NS; k+=W)); do a=$((k*SEG)); b=$((a+SEG)); [ $b -gt $F ] && b=$F; f=$(printf "out/seg/s_%05d_%05d.mp4" $a $b); [ -f "$f.ok" ] && continue
    node src/render.js video "$f.tmp.mp4" $a $b > out/seg/w$1.log 2>&1 && n=$(ffprobe -v error -count_frames -select_streams v -show_entries stream=nb_read_frames -of csv=p=0 "$f.tmp.mp4") && [ "$n" = "$((b-a))" ] && mv "$f.tmp.mp4" "$f" && touch "$f.ok"
    echo "seg $k/$NS w$1 $(date +%T)" >> out/progress.log; done; }
  for ((w=0; w<W; w++)); do worker $w & done; wait
  ok=$(ls out/seg/*.ok 2>/dev/null | wc -l); [ "$ok" = "$NS" ] || { log "render incomplete $ok/$NS (rerun to resume)"; return 1; }
  ls out/seg/s_*.mp4 | sort | sed "s#^#file '$(pwd)/#; s#\$#'#" > out/seg/list.txt; ffmpeg -v error -y -f concat -safe 0 -i out/seg/list.txt -c copy out/full.mp4; }
st_steps() { node src/render.js steps out/steps.json && python3 tools/footsteps.py out/steps.json aud/steps.wav "$(python3 -c "import json;print(json.load(open('src/timing.json'))['end'])")"; }
st_audio() { [ -f tools/audio_ep.py ] || { log "tools/audio_ep.py missing (copy the last episode's audio script and edit the cues)"; return 1; }; python3 tools/audio_ep.py && [ -f aud/nomusic.wav ]; }
st_finish() { SRC=out/full.mp4 bash tools/finish.sh "$OUT" "$NAME"; }
st_cover() { bash tools/cover.sh out/ปก.jpg && cp out/ปก.jpg "$OUT/ปก.jpg"; }
st_qa() { python3 tools/qa.py "$OUT" "$NAME" .; }
run voice st_voice; run asr st_asr; run timing st_timing; run lint st_lint; run render st_render
run steps st_steps; run audio st_audio; run finish st_finish; run cover st_cover; run qa st_qa
log "ALL DONE -> $OUT"
