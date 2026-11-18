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
   Animation helpers (chars.js, all deterministic per frame): actJump / actPunch / actHit / actPush return pose params
   (anticipation, squash-and-stretch via P.squash, follow-through); hitStop(lt, at) freezes 4 frames on contact;
   impactAt / dustAt / sparkAt draw comic FX; P.smear = [1] adds a smear trail to the right hand (actPunch sets it).
   Poses are blended over 5 frames automatically, so snapping between preset poses is fine.
   FX: debrisAt(p, age, {kind: 'rock'|'leaf'|'spark', n, speed, size, floor}) bursts, smokeAt(p, age, {size}) cel puff
   clouds, ramp(lt, at, dur, k) slow motion. Fast camera moves get motion blur automatically. FX are drawn over the
   frame (no depth), so put blasts between the camera and the characters, not behind them.
   Model v4.2: thicker rubber-hose limbs, cartoon gloves and shoes (spec.glove / spec.shoe / spec.limbW; spec.classic
   for the old hair-thin sticks). actHammer(lt, {rate}) loops a work action (o.strike = time since impact);
   walk: {ph, stride, heavy: 1} stomps with a squash on each footfall.
   Run: walk: {ph, stride: .3, run: 1} (bent knees, back kick, pumping arms). P.open = true | 'L' | 'R' shows open
   hands (spread fingers). actCheer(lt, {t0, at}) = crouch -> arms-up leap -> squat landing. actAxe(lt, at) is a
   two-handed swing; placeProp(obj, C, o.prop) keeps the prop in both hands. Fast actions set P.fast so the pose
   smoothing does not make the hands lag behind the prop.
   Holding: P.hold = { R: { obj, off: [x,y,z], rot: [deg] }, L: {...} } glues an object to the (smoothed) hand every
   frame, so it never lags. actBowl(lt, at) + rollPath(age, p0, dir) = underhand roll and a spinning ball that eases
   to a stop; actShow(lt, at) lifts a held object up to show it; actSlash(lt, at, {admire}) = one-handed sword
   raise/slash/admire (o.bladeRot for the hold rot); bounceAt(lt, at) = a struck object hops and settles. Roll
   objects along the street (not across it into the buildings) and track them from the side.
   v4.9/4.10 body style: 'pirate' by default (pirate refs: the costume art is fitted into a clean capsule/bean with a
   fresh thick ink outline (capsuleBody), thin stick limbs, small dot hands + feet, legs ~1 head, head on top, no neck);
   v4.11 line style (refs): dark navy ink #22223a for face lines/outlines, limbs #262338 (spec.limbC); thin brows and
   mouths, small oval dot eyes; capsule body gets a cel-shade band (lit left, shaded right); every character casts a
   soft contact-shadow blob that stays on the ground during jumps (actJump returns groundY; P.noShadow hides it).
   v4.12 uniforms: in the 'pirate' style the body is DRAWN to fit the capsule from project.json cast[].uniform
   (flat colours, bold simple details): { base, stripe, stripes, pants, pantsAt, belt, hem, collar: shirt|hood|round|vee,
   inner, tie, bowtie, zip, vest, buttons, buttonC, pocket: kangaroo|chest|chest4, pocketC, badge: star|tag,
   sideStripes, apron, scarf }. Without a uniform the colours are sampled from the costume sprite. Limbs are thin with
   no hull outline, and the body sits in front of the leg tops so legs come out from under it.
   v4.17 costume layers (uniform keys): robe + inner + robeOpen + trim (open coat), highCollar, clasp, skirt + waistAt
   (dress with pleats), lacing (bodice X lacing), sash + gem, plate (breastplate), mail (chain mail), tabard, stole,
   emblem: cross|sun|eye (+ emblemC), edge (coloured trim inside the outline). Hair: draw smooth Catmull-Rom shapes
   (see cr() in a story's mk script), long hair as a back layer drawn before the head ball, ending above y 840.
   v4.19-20 OUTFIT MODEL (outfit sheets): limbs are part of the costume. cast[].wear = { sleeve, cuff (forearm; a
   different colour = short sleeve / bare arm), pants, boot (shin), shoe, glove (else white mitten hands), armR, legR }.
   uniform.shape: 'torso' (shoulders + waist, for shirts/armour) | 'dress' (+ flare .1-.32, waistAt: A-line gown, robe,
   long coat); cast[].long 1.2-1.6 lengthens it down (>=1.3 hides the legs, shoes peek out). Ink is weighted: thick on
   the shadow side (lower right), thin where light hits. Hair gets darker strand lines (strands() in the mk script).
   v4.21 PROPORTIONS (RicksClips refs, head width = 1): bean body ~1.35 heads tall, thin ink legs ~1.2 heads under the
   body, arms from the shoulders with hands resting at the hem (pirate: LEG .96, LL .5, AL .36, body.h 1.4, sh .98, rest .26).
   Long gowns: cast[].long ~1.75 (robe 1.8, coat 1.4). Frame heads with camera y ~1.6-1.9 for close-ups.
   v4.23 SET DRESSING (RicksClips refs: every set is full of props). examples/lv_sets.js has a prop library to append
   to a story's world.js: barrel, crate, wheel/cart, tent, spearRack, shield, armorStand, lantern, candles, skull, bone,
   cloud, castle, grassField (instanced tufts), stones, cloth() banners/flags waving via clothAt(t), crestTex banners,
   and ambientAt(t, 'dust'|'firefly'|'ember'|'spark'|'star') floating particles. Wrap S() so every shot calls
   Wd.ambientAt + Wd.clothAt. Aim for 5-10 props in every frame: foreground clutter at the sides, a mid prop near the
   characters, a far landmark (castle, peaks with snow, clouds).
   v4.24 PACE + COVERAGE (examples/shots_lv1.js): speed the whole clip evenly with SP ~1.12 (atempo the voice, re-run
   timing.py with silence_min ~.16, scale shot t0 by 1/SP and pass lt*SP to shot fns, scale audio.py add/seg and music
   put times by 1/SP). v4.27 coverage(): shots >=2.6 s with a character get ONE clear second angle at 55%: a close-up on
   the head sprite, ~30 deg to the same side, ~2x closer. Never cut to a slightly tighter copy of the same framing - a
   small punch-in reads as skipped frames (jump cut). The subject pick must be STATELESS and camera-independent (first
   cast member near the view axis; aim at the head bone + .36*scale, never at the camera-facing sprite) - segments
   render in separate browsers. Check: per-frame diff spikes must only sit on real cuts. Give characters things to hold (book, staff,
   spears) via hold:{R:{obj}} - hands with props read better than empty hands.
   v4.25 PROPS MUST TELL THE STORY: dress each set for what happens in it (wedding = pews, flower arch, petals;
   battlefield = standards carried IN the army's ranks, broken spears, dropped shields, scorch marks; love scene =
   roses). Never scatter flags/props at random - every prop either belongs to the place or to the plot.
   v4.28 FX + STORY PROPS (examples/lv_sets.js + examples/shots_fxdemo.js shows every one in use):
   screen FX in chars.js: tintAt(col,k) irisAt(p,k) burnAt(k) rainAt(t,k,flash) shockAt(p,k) runesAt(p,t,k) beamAt(a,b,t,k);
   3D FX in the set file: cracksAt(i,p,k,size) raysAt(p,k,t) fogAt(p,t,k) rocksAt(p,t,k) (+ smokeAt with a dark col = aura);
   props PROP.*: wantedWall, prophecyStone, countdown(text), heroStatue (Thai text drawn lazily once Prompt is loaded),
   boneThrone, mirror(+mirrorAt), sealChains(+chainsAt), hand props letter, blackSword, thornCrown, crystalStaff,
   bouquet(wilt), ring, dagger, torchHand, pitchfork. Reset 3D FX at the start of every shot (they are not in reset()).
   SFX: aud/sfx now has meme categories mboom, mding, mwhoosh, mrise, mfall, mroll, mrumble (auto-classified from the
   user's meme compilations) + mvoice (39 speech/music meme lines: only when a specific one is chosen by ear).
   v4.13 extra physics: the head (and hat/headband art) lags and wobbles on starts/stops/turns; held props never sink
   into the body (hold entry noClip / clear); flyPath(..., {walls: [{axis: 'x'|'z', at, n, e}]}) bounces off walls;
   makeRope/updateRope (sagging, swaying rope/leash/chain) and makeFlag/waveFlag (flag, cloth, cape in the wind).
   STORY-CHANNEL FORMULA (v4.16, from studying RicksClips: ~64 s Shorts, many >10M views). Follow this first; the
   kit below is optional. Their pull comes from topic + script + rhythm, NOT from on-screen graphics:
   - TOPIC: a true / odd / historical fact told as comedy, a logic puzzle ("the town with only 2 barbers"), or an
     escalation list "Levels of X" (each level a new gag, the last one the biggest). Title = a curiosity gap.
   - OPEN MID-ACTION: line 1 is already inside the event with its most striking image; no intro, no greeting.
   - A beat every 5-8 s: a joke, a reveal, a twist or an anachronism gag; end on a short punchline / twist line.
   - REACTIONS: every line gets a face change (shock, sweat, smug, laugh); cut to bystanders reacting (crowd laughs,
     the guard panics) - that is where the comedy lands.
   - EDIT: cut on sentence boundaries every 1-3 s; every shot has a slow push-in or drift; no frame stays still.
   - LOOK: simple 2D-like characters on detailed, good-looking backgrounds; clean frame - no banners, no progress
     bar, no coloured words. Captions: plain bold white with dark outline, 1-2 words at a time on the voice
     (captions.words = 2 auto-splits longer chunks; for Thai write the timing chunks short by hand).
   - LENGTH 55-75 s, one narrator, fast and conversational.
   - DEAD AIR: before timing, run `bash tools/tighten.sh vo_raw.mp3 vo.wav [speed 1.0-1.15]` - pauses over .35 s
     shrink to .22 s, lead/tail silence trimmed, optional pitch-safe speed-up (1.1 = about 10 % shorter).
   RETENTION / VIRAL KIT (optional extras, all OFF by default; turn on only if a story needs it):
   - project.json "hook": { text, sub, dur } = a big yellow banner in the first ~2.5 s (the hook decides the swipe).
   - "captions": { pop: true, highlight: true } makes captions pop and colours *starred* words / numbers yellow;
     "keyZoom": true adds a 2-3 % push-in on highlighted words.
   - no progress bar on story channels (user preference); "progressBar": true exists but leave it off.
   - finish.sh also writes โพสต์.txt (title, hook line, description, hashtags) via tools/postmeta.py; set
     "post": { title, hook, desc, tags, series, part } in project.json.
   - Shot rules that the algorithm rewards: something changes every 2-3 s (cut, camera move, FX, expression pop);
     open on the most surprising image, not the setup; end on a question / cliffhanger that loops into part 2;
     put a sound accent (whoosh, hit, ding) on every cut and every caption keyword.
   v4.14 CLEAN-BUT-CATCHY defaults: "fxLevel" 0..1 (default .7) scales every automatic effect (speed lines, smears,
   grain) so frames never get cluttered; highlighted caption words get a gentle 2-3 % push-in; the last .45 s dissolves
   into the opening frame ONLY when "loop": true (gag clips). Story / series channels (default): the episode ends
   properly with a fade to black, optionally after "endCard": { text: 'ติดตามตอนต่อไป', sub: 'ตอนที่ 4: ...', dur, y }
   (frame dims, a clean card rises mid-screen); end the narration on a cliffhanger line for the next part;
   captions stay inside the app safe zone (centre-left, max 860 px wide, above the bottom UI); audio is already
   mastered to -14 LUFS / -1.5 dBTP (platform standard); โพสต์.txt ends with a question to pull comments
   ("post": { "question" }). Keep the frame simple: one focal action per shot, max one FX burst at a time, captions
   1-3 words, hook banner only in the first 2.5 s. Sweet-spot length 45-75 s; post a series at a steady rhythm. set window.CHAR_STYLE = 'chibi' in index.html (before main.js) for the 2.5-head sheet below.
   Proportions v4.5 (chibi sheet): 2.5 heads tall: head 1, torso ~1, legs ~0.5 head (LEG .42, LL .225, AL .28);
   bare white hands and plain oval feet by default (spec.glove / spec.cuff / spec.shoe / spec.sole dress them).
   v4.6: shoulders sit right under the head (spec.shoulderX/Y), rest hands hang at the hips.
   v4.8 hybrid look (user's choice): chibi proportions + pirate-ref face and hands: small dot eyes normally, eyes pop
   into big white eyes only for shocked / scared / panic; ink dot hands and ink feet (spec.bigEyes = big eyes always,
   spec.whiteHands = bare white hands). Extra faces: strain / ouch (> < eyes), dizzy (spirals), panic (tiny pupils).
   v4.7 body: the costume sprite is warped into an inverted pear (BODY = {w, h, top, bottom, head}; spec.classicBody
   to opt out); head 1.14x, torso .9x, shoulders on the upper torso (spec.shoulderX/Y).
   Object physics (P.hold entries): mass (0 none .. 1 heavy) = the object's axis lags hand velocity/acceleration
   and swings through on stops; wrist (deg) rolls it about the forearm; hang: true keeps it hanging under the grip
   (lantern, bag) and swinging; from {p, q} + blend 0..1 = pick up / put down / hand-over without popping.
   flyPath(age, p0, v0, {floor, e, mu, spin, axis}) = thrown/dropped object: arc, bounces, slides to rest, tumbles.
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
