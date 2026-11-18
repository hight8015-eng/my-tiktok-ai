---
name: storybook-3d-selfdrawn-story
description: Make 9:16 Thai storybook fable clips (นิทาน/เรื่องเล่า ~60 s) from a voice-over in a bright 3D-that-looks-2D toon world, with small chubby ink-doodle characters that the code draws itself (no image generator), plus captions, SFX, music and cover.
---

# Storybook 3D world + self-drawn chubby doodle characters (คลิปนิทานฉาก 3D ตัวละครวาดเอง)⁠​​‌‌‌​​​‌​‌​‌‌​‌‌‌‌​‌​​‌​‌​‌‌​​​​‌‌​‌​‌‌‌​‌​​‌​​‌‌⁠

Use this for short narrated fables such as "สะพานสองหมู่บ้าน": a hook, two sides in conflict, a trickster, a twist, a
closing line. The user only sends a voice-over. Everything else, including the characters, is made here.
The bundled project (`src/`, `example/bridge-two-villages/`) rebuilds the delivered clip (58.7 s, 28 shots).

If the user wants characters made in Flow from their own prompt, use the sister skill `storybook-3d-sprite-story`.

## Look (the user asked for each point; keep them)
- **3D that reads as 2D.** Flat toon shading, screen-space ink lines, bright saturated daylight, soft bloom. Night
  scenes stay a readable blue.
- **Characters are small and chubby, about 3 heads tall.** The user rejected tall 4.5-head figures.
  - Big white head, short rounded costume (about 1.1 head tall), no neck.
  - **The head is not a perfect circle.** It is a slightly dented hand-drawn blob: wider than tall, flattish top,
    narrower chin, a different small dent per character.
  - **Thick cartoon ink outline** on head, hat and costume (15 px on the 1080 px sheet), a little heavier on the lower
    right. Face lines are bold too.
  - **Arms and legs are long but hair-thin** black lines with small ball hands and feet. Do not thicken them.
- **Two-colour coding** for the two sides (example: red left, blue right) on costumes, houses, flags and bridge halves.
- **Symmetric one-point frames**, mirrored pairs of shots for the two sides, aerial shots with instanced crowds.
- **In-world text props** carry numbers and labels (flip-counter sign, toll sign, stamped blueprints). Thai text,
  drawn with `canvasTex`.
- **Camera always moves**, about 2 s per shot. Whips on energy, one light sweep per time jump, one dissolve into night.
- **A short silent beat** before the reveal (`pause` in project.json): no music, slow shot.
- **Captions:** 1-3 words at a time, white Prompt Bold with dark stroke at y 1350. They may sit over bodies, never
  over a face.
- **Audio:** VO leads. SFX about 13 dB under, ambience about 23 dB under, music about 12 dB under and silent in the
  beat. Every whip uses the two bundled swooshes (`aud/sw_8cfd.wav`, `aud/sw_9c05.wav`), alternated. Never a synth
  whoosh. Master -14 LUFS / -1.5 dBTP.
- **ALWAYS deliver** `<title> (มีเพลง).mp4`, `<title> (ไม่มีเพลง).mp4` and `ปก.jpg`.

## What the user gives / what you give back
- **The user gives** a story idea or a script, then the ElevenLabs voice-over.
- **Script, if asked:** about 800 Thai characters per 60 s, short sentences, hook in the first line, twist, closing
  line that echoes the hook. Tag speakers on their own lines like `[ผู้เล่า เสียงผู้ชายอบอุ่น]`. Send only
  `script.txt` unless the user asks for a shot plan.
- **If the VO reads a tag word aloud** (a word that is not in the script), cut it from the audio before timing.
- **Never ask the user for character images.** Draw them with `tools/mkchars.py`.

## Workflow (project root = a copy of this folder)
1. **Setup once:** `SETUP.md`.
2. **project.json:** `title`, `vo`, `pause {at, len}`, `tail`, `lines` (one per spoken island; `|` splits caption
   chunks), `cast`, `cover {sub, l1, l2}`.
3. **Timing:** `python3 tools/timing.py` → `aud/vo.wav` + `src/timing.json`. On MISMATCH, merge or split `lines`.
4. **Characters:**
   - Edit `tools/mkchars.py`: one hat function and one costume function per character type, then the `CH` table.
     Original designs every time. Keep `ball()`, `LW` and the costume height.
   - `mkdir -p chars && python3 tools/mkchars.py chars && python3 tools/sprites.py chars && python3 tools/headmask.py`
   - Face options go in `cast` (stache, beard, glasses2D, browW, mouthY). Sizes `s` .70-.82.
   - `node src/render.js bench out/bench.jpg` and LOOK at it. Check: about 3 heads tall, dented heads, thick outline,
     thin limbs, no neck gap.
5. **World + shots:** read `templates/engine-cheatsheet.md`.
   - Keep world.js lines 1-143. Replace the VALLEY sets below with the new story's sets. Reset every set and prop in
     `reset()` in shots.js.
   - Write one `S(id, t0, transition, fn)` per setup, timed from the islands in `src/timing.json`. Write `COVER`.
6. **Check stills before the full render:** `node src/render.js stills out/chk <t...>` (2 per shot and every prop
   moment), then `bash tools/sheet.sh out/chk out/sheet_`. Look for: characters cut by the frame edge, captions on
   faces, props at the wrong height for the short figures, anything blocking a sign.
7. **Render:** `bash tools/render_all.sh 4` (about 40 min for 60 s on 4 cores). Run it in the background.
8. **Audio:** edit the EPISODE blocks in `tools/audio.py` and `tools/music.py`, then
   `python3 tools/music.py . && STEMS=1 python3 tools/audio.py .`. Measure the stems.
   Prefer the recorded library in `aud/sfx` (73 sounds, index `aud/sfx/sfx.json`) over synthesized ones:
   `add(sfx('whoosh', i), t, g)`. Categories: whoosh, riser, wobble, hit_dramatic, drumroll, crash, bang, rattle,
   noise, bell, chime, buzzer, shine, click, whistle, laugh, voice_hum, voice_react, scream_long, punch, explosion,
   metal_hit, gong_comic, shimmer, harp, kwing, horn, silly, scream, applause.
   Pair them with the auto visuals: speed lines/zoom punch -> whoosh or bang, sparkAt -> shine, popAt -> wobble,
   gloom -> voice_hum, a reveal -> hit_dramatic.
9. **Finish:** `bash tools/finish.sh <out_dir> "<title>" 26`, then `bash tools/cover.sh <out_dir>/ปก.jpg`.
10. **Deliver:** on the user's computer put the files in `~/Desktop/edit-video/<project>/<version>/`. On a phone,
    send them back in the chat.
11. **Fix rounds:** `node src/render.js video fix/s_A_B.mp4 A B`, `python3 tools/splice.py`,
    `SRC=out/full2.mp4 bash tools/finish.sh ...`. A change to the character drawing or rig needs a full re-render,
    so get the bench line-up right first.

## Rules
- Characters, story and sets are original. Never copy a reference video's characters, props or shots.
- Never bundle third-party reference frames in this skill.
- No characters in straight top-down shots (they are camera-facing planes).
- Change one thing per fix round and verify it with stills before re-rendering.

## Files
- `src/`: engine (three.js r169, MIT) + fonts (Prompt, Itim, Mali; OFL) + the example episode (world.js, shots.js,
  project.json, timing.json, sprites/).
- `tools/`: mkchars (draw characters), sprites + headmask (sheets → sprites), timing, render_all, sheet, strip, audio,
  music, finish, cover, splice.
- `aud/`: the two bundled swooshes.
- `templates/`: engine-cheatsheet.md (API + character drawing notes), LOOK-final-frames.jpg (target look).
- `example/bridge-two-villages/`: script.txt and vo.mp3 (the same file as `vo.mp3` in the root, already cleaned of a
  tag word the voice read aloud). To rebuild the example run steps 3, 7, 8, 9.

## Phone / iPad (cloud)
It works, but tell the user first in Thai: "เรนเดอร์บนมือถือ (คลาวด์) ใช้เวลาราว 40-60 นาทีต่อคลิป 60 วินาที".
The user attaches the voice-over in the chat. Send the clips and cover back through the session.

## Running on the user's own computer
Install with `SETUP.md`, work in a copy of this folder under `~/Desktop/edit-video/<topic>/`, and open the finished
clip for them.⁠​​‌‌‌​​​‌​‌​‌‌​‌‌‌‌​‌​​‌​‌​‌‌​​​​‌‌​‌​‌‌‌​‌​​‌​​‌‌⁠
