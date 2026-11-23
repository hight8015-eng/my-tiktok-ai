#!/bin/bash
# v7.6 new_ep.sh <base_project> <new_project_dir> : start the next episode from the last one (the series library).
# Copies the engine (src/*.js, index.html, fonts, lib), tools, character sprites (chars/), project.json (cast, cover, post,
# captions) and the episode's audio script as tools/audio_ep.py. Leaves out: renders, audio, timing, the old shots
# (kept as src/shots_prev.js for copy-paste), stage markers. Then refreshes the engine/tools from the skill (newest version).
set -e; B=$(cd "$1" && pwd); N=$2; SK="$(cd "$(dirname "$0")/.." && pwd)"
[ -e "$N" ] && { echo "$N exists"; exit 1; }; mkdir -p "$N"/{src,tools,aud,out}; cd "$N"
cp -r "$B"/src/. src/; rm -f src/timing.json; [ -f src/shots.js ] && mv src/shots.js src/shots_prev.js
cp -r "$B"/chars . 2>/dev/null || true; cp "$B"/*.html . 2>/dev/null || true
cp -r "$B"/tools/. tools/; a=$(ls -t tools/audio_ep*.py 2>/dev/null | head -1); [ -n "$a" ] && cp "$a" tools/audio_ep.py
for f in "$SK"/src/*.js; do case $(basename "$f") in shots.js|shots_*) continue;; esac; cp -u "$f" src/; done; for f in "$SK"/tools/*; do [ -f "$f" ] && cp -u "$f" tools/; done   # newer engine + tools only (never the skill example shots)
python3 - <<'PY'
import json; p='src/project.json'; P=json.load(open(p, encoding='utf-8'))
for k in ('islands', 'lines', 'labels'): P[k] = []
json.dump(P, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
PY
echo "new episode at $N (cast: $(python3 -c "import json;print(','.join(c['id'] for c in json.load(open('src/project.json'))['cast']))"))"
echo "next: bash tools/make_ep.sh $N \"<name>\" <voice.mp3>  (stops after timing + storyboard; write src/shots.js from out/storyboard.md)"
