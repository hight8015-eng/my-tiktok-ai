#!/usr/bin/env bash
# autosave.sh: keep all work safe in git (the cloud container is temporary).
#   bash autosave.sh            save now (verbose)
#   bash autosave.sh --hook     same, quiet; run by the Stop hook after every Claude turn
#   bash autosave.sh --video    also save the finished episode videos (big; run by hand)
#   bash autosave.sh --restore  copy the saved work back into a fresh session's scratchpad
# What is saved:
#   - every scratchpad story project (folders with src/): src, tools, chars, sheets, audio catalogs, timing,
#     voice-overs, scripts -> projects/_work/<name>/ (renders, frames, wavs, generated sprites, the vendored three.js
#     and the skill's example copy are skipped: they can be rebuilt; the SFX wavs live in projects/sfx_library)
#   - loose scratchpad scripts (*.py *.js *.sh *.mjs *.json *.txt) -> projects/_work/_loose/
#   - finished episode folders in output/: cover + post text (and videos with --video) -> projects/_delivered/
#   - the skill mirror in ~/.claude/skills is copied back into the repo if it is newer
# Then: git add, commit if anything changed, push to the working branch (retries).
set -u
REPO="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")" && pwd)}"
BRANCH="claude/skill-installation-kkpo2q"
MAXKB=5120                       # skip single files over 5 MB (except --video)
MODE="${1:-}"
LOG="$REPO/.autosave.log"
say() { [ "$MODE" = "--hook" ] || echo "$@"; echo "$(date '+%F %T') $*" >> "$LOG"; }

# scratchpad: the session's, or every one we can find under /tmp/claude-*/
SCRATCHES=()
for d in /tmp/claude-*/*/*/scratchpad; do [ -d "$d" ] && SCRATCHES+=("$d"); done

exec 9>"$REPO/.autosave.lock"
flock -n 9 || { say "another autosave is running; skip"; exit 0; }

cd "$REPO" || exit 0

if [ "$MODE" = "--restore" ]; then
  T="${SCRATCHES[0]:-}"; [ -n "$T" ] || { echo "no scratchpad found"; exit 1; }
  for p in projects/_work/*/; do n=$(basename "$p"); [ "$n" = "_loose" ] && continue
    mkdir -p "$T/$n"; cp -rn "$p". "$T/$n/"; done
  [ -d projects/_work/_loose ] && cp -n projects/_work/_loose/* "$T/" 2>/dev/null
  echo "restored to $T (existing files kept)"; exit 0
fi

# copy one tree, small files only, skipping rebuildable folders
copy_tree() { # src dst
  local src="$1" dst="$2"
  ( cd "$src" && find . \
      \( -path './out' -o -path './out/*' -o -name 'st[0-9]*' -o -name 'lt' -o -name 'lt_clip' -o -name 'mt' \
         -o -name 'vis*' -o -name 'node_modules' -o -name 'frames' -o -name '*.ok' -o -name 'npmtmp' \
         -o -name 'sprites*' -o -path './src/lib' -o -path './example' -o -path './templates' \) -prune -o \
      -type f -size -"${MAXKB}"k \
      \( -name '*.js' -o -name '*.mjs' -o -name '*.json' -o -name '*.py' -o -name '*.sh' -o -name '*.md' \
         -o -name '*.txt' -o -name '*.html' -o -name '*.png' -o -name '*.jpg' -o -name '*.mp3' -o -name '*.glsl' \
         \) -print0 ) |
  while IFS= read -r -d '' f; do
    f="${f#./}"; mkdir -p "$dst/$(dirname "$f")"
    cmp -s "$src/$f" "$dst/$f" || cp -p "$src/$f" "$dst/$f"
  done
}

SKIP='^(demo[0-9]*|bench[0-9]*|test|ptest|mbtest|sfxtest|physdemo[0-9]*|fxdemo|npmtmp|skillzip|ref[0-9]*|study[0-9]*)$'
for S in "${SCRATCHES[@]}"; do
  for p in "$S"/*/; do n=$(basename "$p")
    [ -d "$p/src" ] || [ -d "$p/tools" ] || continue
    [[ "$n" =~ $SKIP ]] && continue
    copy_tree "$p" "projects/_work/$n"
  done
  mkdir -p projects/_work/_loose
  find "$S" -maxdepth 1 -type f -size -"${MAXKB}"k \( -name '*.py' -o -name '*.js' -o -name '*.sh' -o -name '*.mjs' \
       -o -name '*.json' -o -name '*.txt' -o -name '*.md' \) -print0 |
    while IFS= read -r -d '' f; do cmp -s "$f" "projects/_work/_loose/$(basename "$f")" || cp -p "$f" projects/_work/_loose/; done
done

# skill mirror -> repo (only files that are newer in the mirror)
SK=".claude/skills/storybook-3d-selfdrawn-story"
if [ -d "/root/$SK" ]; then
  ( cd "/root/$SK" && find . -type f -size -"${MAXKB}"k -print0 ) | while IFS= read -r -d '' f; do f="${f#./}"
    if [ ! -e "$SK/$f" ] || [ "/root/$SK/$f" -nt "$SK/$f" ]; then mkdir -p "$SK/$(dirname "$f")"; cp -p "/root/$SK/$f" "$SK/$f"; fi
  done
fi

# finished episodes: folders in output/ that hold a ปก.jpg
for ep in output/*/; do [ -f "$ep/ปก.jpg" ] || continue
  n=$(basename "$ep"); d="projects/_delivered/$n"; mkdir -p "$d"
  for f in "$ep"*; do b=$(basename "$f")
    case "$b" in *.mp4) [ "$MODE" = "--video" ] || continue ;; esac
    cmp -s "$f" "$d/$b" || cp -p "$f" "$d/$b"
  done
done

git add -A projects .claude autosave.sh 2>/dev/null
git add -A . 2>/dev/null   # anything else tracked/untracked outside .gitignore
if git diff --cached --quiet; then say "nothing new to save"; exit 0; fi
N=$(git diff --cached --name-only | wc -l)
git commit -q -m "autosave: $N files ($(date '+%F %H:%M'))

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01GMCyhhBf96PfZGofzkVNHY" || { say "commit failed"; exit 0; }

ok=0
for w in 2 4 8 16; do
  if git push -q -u origin "$BRANCH" 2>>"$LOG"; then ok=1; break; fi
  # remote has commits we lack: merge, never force
  git fetch -q origin "$BRANCH" 2>>"$LOG" && { git merge -q --no-edit -X ours FETCH_HEAD 2>>"$LOG" || git merge --abort 2>/dev/null; }
  sleep "$w"
done
[ $ok = 1 ] && say "saved $N files and pushed" || say "saved $N files locally; push failed (will retry next time)"
exit 0
