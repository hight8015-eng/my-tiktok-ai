#!/bin/bash
# bash tools/cover.sh [out=out/ปก.jpg] : renders the COVER shot (shots.js) with project.json cover.opts, then draws the title
set -e; cd "$(dirname "$0")/.."; O=${1:-out/ปก.jpg}; mkdir -p out "$(dirname "$O")"
OPTS=$(python3 -c "import json;print(json.dumps(json.load(open('src/project.json')).get('cover',{}).get('opts',{})))")
node src/render.js cover out/_cover_bg.jpg "$OPTS" && node tools/cover.js out/_cover_bg.jpg "$O"
