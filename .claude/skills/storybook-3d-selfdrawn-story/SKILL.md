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
   v4.29 SFX DISCIPLINE (user: repeated effects were annoying): ~1 effect per 3 s on average with quiet stretches; one
   sound per story beat (not whoosh+shimmer+chime stacks); never the same sound twice within ~8 s; at most ~3 uses of a
   category per episode; SFX bus sits 16 dB under the voice and ducks 60% while someone speaks; the add() guard softens a
   hit that lands within .35 s of another.
   v4.29 CAMERA (refs measured: 89-92% of frames move): camDrift now floats the camera (translate, scaled by focus);
   shot files stretch every planned move 1.4x (CAMX); location changes use tr 'blur' (motion-blur dissolve, .4 s) or
   'whip' for action and 'dis' for memories. NEVER put code after a // comment on the same line (it was swallowed 4
   times: endCard alignment, caption wobble, POST dof/mblur reset) - use /* */ for inline notes.
   v4.30 NO EXTRA ZOOM (user: face shots zoomed too much + felt like skipped frames): coverage() cut-ins are OFF;
   CAMX stretches only the FAR end of a move (the close end stays as planned); face shots keep the camera >= 2 m from
   the target (MIND; macro shots of objects set MIND = 0) = medium close-up with headroom, never a face filling the frame.
   v4.31 EMOTION: pose P.tears 0..1 (.3 glistening eyes, .6 streams, 1 streams + falling drops; drawn on the 2D overlay
   from headBall(C), so avoid it when another head blocks the face) and P.gloom for sorrow. Use them on every emotional
   beat: tears make sad/reunion scenes land.
   v4.32 PERFORM + AUDIT (user's reference slides):
   - Expression changes: ...pf(lt, [[0, 'calm'], [.6, 'happy']]) - the swap hides behind a ~4-frame blink with a small
     head dip; never `ex: lt > x ? a : b` (a hard cut on the face). Don't put a later blink:/head: in the same pose.
   - After building shots run `node tools/audit.js <project> <t...>` (3 samples per shot): per character in frame?
     blocked by a nearer character? head >= 5% of the screen? and compare consecutive shots: a 'cut' where the camera
     moved < 1.6 m and < 22 deg on the same characters is a JUMP CUT -> make it one continuous take (same camera, blink
     the expression change) or a different angle (~30 deg+), or 'dis' for time passing. Intentional off-frame heads
     (over-the-shoulder, macro of hands/props, pull-back to sky) are fine - check the rest with stills.
   - 4-step camera for reveal beats: wide hold (the setting) -> push in (the one who acts) -> FAST zoom out (everyone
     reacts, eOut over ~.7 s) -> group shot. Characters in a confrontation face each other (check ry with a still).
   v4.33 SFX ENGINE (researched; use hit() instead of add(sfx()) in the EPISODE block):
   hit(cat, t, g, pan, tier='small'|'mid'|'big', lead='whoosh') - trims leading silence so the transient lands ON the
   frame; small random pitch (+-1.5 st) and gain (+-2 dB) per play; round-robin variants; same file never within 8 s;
   <= 4 per category; < .12 s collisions dropped, < .35 s softened; <= 3 'big' hits that get a pre-hit dip of beds +
   music (~6 dB, .35 s) so the hit lands out of near-silence; lead='whoosh' puts the whoosh PEAK just before the hit.
   Plan the sound like the picture: 1 sound per story beat, ~2.5-3.5 per 10 s with real quiet gaps, the biggest
   hits only on the 2-3 story peaks, match weight to the visual (small move = small sound), let the music carry
   emotion and SFX carry action. sfx_report() prints density, gaps and per-category use - read it every time.
   LESSONS FROM VIEWER FEEDBACK (THE LAST VILLAIN ep2 crying scene, seen on the phone):
   - Do NOT use P.gloom on a face close-up: its vertical lines read as scratches / a broken picture. Sadness = tears +
     sad ex + head down + slower camera + music; gloom only on small/far characters, if at all.
   - Foreground props near the camera become huge blobs (pew flower balls, candles, rubble). In emotional close-ups keep
     the camera >= 1.2 m from every prop, or hide the prop for that shot. Check the bottom third of the frame.
   - Smoke/dust in a sad aftermath scene stays far behind the character, small (size <= .3) and low; never across the
     character or the lower frame.
   - v4.34 tears start exactly at the eyes: the overlay wraps drawFace's eye position (u = .5 +- .13 of the face strip)
     onto the head ball with the view angle (PHI) and mirroring, so it follows 3/4 and side views; any new face overlay
     (blush, sweat, sparkle in the eye) must use the same headBall(C) eye math, never a fixed offset.
   - Watch the frames at the size of a phone: anything that pulls the eye away from the face in an emotional beat goes.
   v4.35 SOUND PLAN FOR SHORT-FORM STORIES (research: creator/editing guides 2026, game + film audio practice):
   - Density: ~3-5 effects per 30 s (1.5-2.5 per 10 s) - the voice is the star; an effect on every cut wears viewers out.
   - Meme sounds (vine-boom style boom, ding, fail horn, bruh...): <= 3 per clip, only on a reveal / plot twist / comic
     reaction, never the same one twice, NEVER inside sad or tender beats (declare them: QUIET += [(a, b)]).
   - Silence is a tool: a beat of quiet before a twist or a big hit makes it land (pre-hit dip does this automatically).
   - Match mood + weight: action -> whoosh/impact; magic -> shimmer/rise; emotion -> music only, maybe one soft chime.
   - Keep a signature: 1-2 recurring motif sounds per series (same family, varied) so viewers recognise the channel.
   - Clean audio only (no distorted/clipped meme rips); mastering keeps the mix at -14 LUFS.
   - Captions stay burned in (many people watch muted). The (ไม่มีเพลง) file lets the user add a trending track inside
     the app at low volume. Copyright: meme sounds ripped from compilations / other channels can be claimed; prefer
     the platform's own sound library or royalty-free packs for anything the user posts commercially.
   v5.0 PHYSICS FX (src/fxphys.js, demo: examples/shots_physdemo.js + mix_physdemo.py). `import * as FX from './fxphys.js'`.
   Every effect is a pure function of time (fixed 1/240 s integration from its start, seeded) -> identical on every
   frame, segment and smoothing look-back = no jitter / no skipped frames. Build once at module load (parent = a group
   inside the set), call .at(t) with REAL seconds every frame; each returns .events (impacts) for sound + dust.
     FX.body / FX.rainOf  falling crates, barrels, apples, coins, books, rubble: gravity, bounce, rolling spin, friction,
                          sleep, dust on hard landings
     FX.shatter           pot / rock / glass / ice / wood: tremble, burst into shards (radial + directional impulse),
                          shards stretch along their speed, bounce and settle
     FX.chain             taut chain sways, shivers under strain, snaps; links fly and clatter (glow:'#..' = magic chain)
     FX.pour / FX.stream  water: stretched drops in a ballistic stream, splash droplets, ripples; flowing ribbon river
     FX.energy            charge (particles spiral in) -> ball with comet tail (accelerates) -> flash, ring, burst
     FX.cracks            branching cracks revealed outward from the impact (eOut), glowing edge that cools
     FX.slash             crescent that SWEEPS open over ~3 frames then thins + fades, faces the camera;
                          ultimate:true = bigger, after-images + the frame is CUT along a line and slides apart
     FX.lightning         branching bolt, re-strikes every 3 frames, flicker gap, white flash
     FX.explosion         white-hot -> yellow -> orange -> charcoal fireballs, flash, then soft smoke
     FX.pile              v5.1 many bodies colliding WITH EACH OTHER (sphere contacts, joint 1/240 s integration):
                          crate towers collapsing, rock slides, rubble heaps (example: examples/shots_physdemo2.js)
     FX.impactFrame       v5.1 anime impact frame: 2 inverted black & white frames + bold radial lines on THE big hit
                          of a scene (max 1-2 per clip; never longer than ~.07 s - flashing)
   Falling things must ENTER the frame: spawn them above the top edge (t0 earlier, small downward v0) - an object that
   appears mid-air on its release frame reads as a skipped frame (measured: periodic diff spikes every pop-in).
   Measured smoothness of the demo (median 2nd difference of per-frame change): shatter .07, cracks .05, energy .10,
   chain .10, slash .12, water .17, tower collapse .18 - lightning (.76) flickers on purpose.
   Not used: rapier3d-deterministic (would allow baked rigid-body piles with real box shapes) - running the downloaded
   package was blocked by this environment's safety check; ask the user before trying again.
   Rules: hide each demo/effect group outside its shot (sets are reused); reset Wd.rocksAt/raysAt/fogAt per shot; flat
   effects on the ground sit >= .035 above it (roads/carpets are thin boxes); anticipation (tremble, wind-up, held
   breath) before every release, follow-through after; fast pieces get velocity stretch instead of strobing.
   HELPER RENDER SESSIONS (user rule): before every full render, ASK the user whether to use helper sessions and how
   many (each is a separate cloud session on the user's usage quota). Default = render on this machine only. If they
   agree: push the project's src/ to render_jobs/<proj>/ on the work branch, create_session per helper with
   `bash render_jobs/render_segments.sh render_jobs/<proj> <seg...>` + push the s_*.mp4 to its own branch, touch the
   matching .ok files locally so rq.sh skips them, fetch + concat, then archive the helper sessions.
   POST-RENDER CHECK (found real bugs every episode): per-frame diff spikes outside cuts + runs of low-detail frames
   (std of the grey frame < 30 for 5+ frames) -> camera inside a pillar/wall, often the stretched FAR end of a move or
   the camera sway. Keep cameras >= .9 m from pillars/walls, view the flagged frames, re-render only that 100-frame
   segment and re-concat.
   NEXT STORY CHECKLIST (user asked to apply these from the start of the next story, refs = the user's slides):
   - HAIR LIBRARY: build reusable hair shapes in the mk script (target ~18: swoop, crop, slick, quiff, spiky, curly, afro,
     balding, combover, bob, long straight, ponytail, bun, braids, side part, buzz, wavy, hat-hair) with strand lines,
     a shade band and a matching BACK view. Rule: characters in the same scene differ by hair SILHOUETTE, not just colour.
   - POSE LIBRARY: ~38 named body poses (neutral, happy, laugh, cheer, proud, bawl, angry, furious, scared, panic,
     thinking, pointing, shrug, facepalm, hands on hips, arms crossed, wave, thumbs up, salute, sneaky, sleepy, ...) as
     presets of hL/hR/pL/pR/lean/head + ex, so a beat is written as perform(t, [[t, 'pose'], ...]); make a contact sheet.
   - COSTUMES: one clear outfit idea per character (suit + tie, apron, uniform with badge, robe...) with 2-3 bold
     details (lapels, buttons, belt, badge, stripes), distinct colour per character, cel shade + sheen strip.
   - BACK VIEW: when a character turns away, hands, held props and hair direction mirror; light stays from the same side.
   - Shading contrast: shadow side a little darker (refs .72 -> .53) so clothes read as volume.
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

## Motion principles (v5.2, from the user's animation-principle study clips; apply to every new clip)
- Timing: fewer frames = faster, more = slower. Hold key poses on twos (2 frames) for snappy hits; keep camera,
  FX and physics on ones so nothing strobes. More frames is not better: a punch is 2-4 frames, a head turn 6-10.
- Spacing: the biggest gap is the frame just before an impact (no ease-in into a hit). The thing being hit moves
  most on or right after the contact frame. Random or uneven spacing is a bug; check spacing in the frame diff.
- Easing: ease in/out on starts and stops of characters and camera; never slow down mid-air (gravity is constant);
  carry momentum through a pose instead of stopping dead. Punch/kick: no ease-out into the hit pose, overshoot the
  hit pose by 1 frame then settle; put the hips and whole body into it; even 1 frame of chamber (wind-up) matters.
- Anticipation before every action (crouch before a jump, wind-up before a swing, a breath before a line that
  matters). Bigger anticipation = more force.
- Squash and stretch keeps volume (stretch long = thinner). Ease toward the original shape. Hard objects stretch a
  little, soft ones a lot. A little still reads.
- Follow-through and overlap: hair, coat tails, capes, ribbons, threads lag behind the body as a travelling wave
  (x = sin(y - t)); different materials lag differently (hair > cloth > strap). Hair is furthest behind on the
  walk's contact pose. Keep inertia: the tip keeps moving after the root stops.
- Arcs: limbs, heads, swords and thrown things move on arcs; a jump is a parabola, not a semicircle. Horizontal
  speed in the air is constant.
- Walk cycle: body lowest at/after contact, highest after passing, small hip sway, minimal head drift.
- Secondary action supports the main action and never hides it (a hand adjusting a coat while talking).
- Exaggeration is for clarity (poses, expressions), not distortion of proportions.
- Weight: heavy things accelerate and stop slowly, bounce less, drag more, and show impact on the environment
  (dust, cracks, the floor shakes).
- Smears on fast moves: elongated in-between, multiples (2-3 ghosts), or motion lines. One kind per move. Don't
  overdo it.
- Fire and smoke rise, spread, slow and fade as they rise; hotter parts rise faster; parts don't move in sync; a
  looping fire must not visibly "pulse"; never redraw the shape at random between frames.
- Smoke (and hair/ribbons, minus the heat): a sine wave travelling up the column, x = sin(y - t); small and fast
  at the source, larger, slower and spreading as it rises; vary the shapes, add masses (blobs) along the curl,
  turbulence curls at the edges; fade by thinning into wisps or breaking into small rings, never a flat alpha fade.
- Bounces: each bounce lower and shorter than the last; the first frame leaving the ground moves the most; as
  little ground time as possible (except an intentionally squishy landing).

## Character lighting + glow (v5.6, user refs: Joker still, low-key portrait)
- setRig({...}) (chars.js) lights the 2D character sprites in screen space: base (overall level), key [col, amt] on
  keySide (-1 left / 1 right), fill [col, amt] on the other side, top [col, amt] (light from above), rim [col, amt]
  with rimDir [x, y] (+ rim2 on the opposite side), rimW (edge width), shadow (0..1 darkens the unlit side + the
  bottom). Call it in each set's light function; setRig() with no args = the old flat look.
- Rules: MOTIVATED light (every colour comes from a source you can see: sign, lamp, window, flame, fire barrel);
  warm vs cool split (warm practical on one side, cool city/moon light on the other); a rim separates the character
  from a dark background; light from the top for drama; low-key = one hard side light, the rest falls to black (use
  for villains / power moments: shadow .6). When a new light appears in the shot (a flame, a gun flash) it becomes the
  key: switch keySide + colour with it. Keep rims subtle (amt .3-.5, rimW ~.007): strong rims read as a neon sticker
  outline / RGB glitch. Glow sprites only halo the source; they must not wash over the character.
- PM presets in examples/shots_pm1.js (RIGS): street (magenta key / cyan fill + cyan rim), alley (warm lamp key /
  blue fill + red rim), truck (cold window top light), gate (red sign key + white searchlight rim), power (red rim,
  hard shadow).

## LESSONS LEARNED (mistakes made so far - check this list before writing the shots of every new episode)
- Camera inside a wall / prop: MIND (min distance) pushes the camera BACK from the target -> it can end inside a wall
  (alley walls x +-1.9). Check every camera against walls; lower MIND for tight places. (ep2 v1: black frames)
- Camera behind a head: over-the-shoulder from behind the listener lets his head fill the frame; offset sideways.
- A near prop (dumpster) or a head in the lower frame = blocked shot. Keep foregrounds small and at the edges.
- Characters walking THROUGH props (ep2: Aren through the dumpster). Plan walk paths around every prop.
- Fake walk: camera tracking at the walk speed = he slides on the spot; arms locked = stiff. Let him cross the frame, swing arms.
- Frozen poses: fixed hR/hL/head values for whole shots look like mannequins. Always add hold()/perform()/gaze().
- Squint faces (glare, rage, annoyedHard with lids) read as >< pain on the small dot eyes - use 'angry' for anger at
  a distance; keep >< for pain only.
- Narration describing an action that is not shown (ep2 v1 'they fight for power' with two men standing still).
- Unclear geography: cutting between two places that are near each other (alley / roof) - link with a camera move.
  Two people 10 m apart vertically never fit one readable frame: use a tilt/pan that follows the action (the bullet).
- Something narrated 'on the roof' must really be on the roof (rule 4), not on a fire escape.
- Gun held wrong: test prop rotation with a 6-rotation strip first (pistol in the hand = rot [90, 180, 0]).
- Tiny effects (thin tracer, 1 thin thread, faint spark) do not read on a phone: make them thick, bright, and lit.
- Faces of secondary characters too small/dark (ep2 friend): give every speaking/key character at least one clear
  medium close-up with a light on the face.
- Sentence islands from silencedetect can be badly wrong: use ASR word timestamps aligned to the script (project 'islands').
- Whisper/shout markers (~ ^) must wrap EACH caption chunk.
- Lip sync: initShots must pass timing.vis (TM.vis) or lipAt silently falls back to the old 3-level flap.
- Head-anchored overlays (scribbleAt) must resolve the head at DRAW time (pass the character), not in the shot fn.
- Music too loud: check the bed is 12-18 dB under the voice (LUFS) before mixing.
- (ep2 v2 review) Captions: keep the caption line CENTRED (x 540, not the safe-zone centre 480) and in sync - chunks of
  1-2 words lag behind fast speech: use ASR word times for the chunk boundaries (not syllable-ratio guesses).
- (ep2 v2) Dutch/tilted camera angles hid the gun barrel: keep the camera level on prop beats; frame the barrel side-on.
  FRAMING: the character AND the prop they hold stay fully inside the frame (no head/hand/gun cut by the edge);
  check stills of every shot for cut-offs before rendering.
- (ep2 v2) Hair, hats and hoods do NOT rotate with the head/body angle (sprite art stays front-facing) = unnatural.
  Study projects/refs/hair_hat_turn_ref.mp4 (user ref: hair/hat turning with the view angle) and build per-angle
  hair/hat views or a 3D cap that follows head yaw/pitch. TODO before the next episode.
- (ep2 v2, ref projects/refs/ep2_motion_issue.mp4) Turning around POPS: the back sprite snaps to the front sprite in one
  frame (hair/face jump). A turn must pass through the side (S) and 3/4 (Q) views, hold each >= 2-3 frames, crossfade
  between views, and the hair/hat must rotate with it; lead with the head, body follows (turn()).
- (ep3) Z-FIGHTING: a light/decal plane placed at the same depth as a wall/door flickers in blocks -> offset it >= 5 cm and
  use depthWrite false + renderOrder.
- (ep3) CAMERA THROUGH A CHARACTER: a dolly that passes a character's position goes inside the sprite (dark frames) -
  check every moving camera path against every character position, not only the end points.
- (ep3) Indoor sets: pass { rain: false } to every S() of an interior set (the rain overlay is on by default).
- Before claiming a fix works, verify it in the actual render path (the ep1 lip demo was not using visemes).

## Staging rules from the user's ep2 review (v7.3, apply to every shot)
1. GEOGRAPHY clear: an establishing wide/high shot shows where every party is; keep screen direction across cuts.
2. Nearby events are linked by a CAMERA MOVE (pan/tilt/crane/track from one subject to the next), not a cut
   (ref: courtroom clip - judge, pan across the room to the crowd, then over the shoulder to the accused).
3. Motion, emotion, gesture and face must agree and look natural: every acting shot uses perform()/hold()/gaze(); no frozen poses.
4. Narration that describes an ACTION is shown literally on screen (e.g. 'they fight for power' = a real fight).
4b. The camera does NOT follow all the time: mix camera moves with the studied transitions (cut, blur, dis, whip, sweep,
   push, fgwipe). A move links nearby beats; a transition marks a change of place, time or energy; never the same device
   twice in a row; the edit must feel natural and flowing.
5. Walk paths are checked against every prop (dumpster, crates, bags): nobody passes through objects; a walk must visibly
   travel through the frame (the camera never tracks at exactly the walk speed), arms swing.
6. Never let a near object (dumpster, a head) fill the lower frame; never place a camera inside a wall (MIND pushes the
   camera back from the target - check against walls).

## Camera + transitions, documentary edit (v7.2, user ref: AI-image documentary with titles; main.js)
- Never a dead frame: every shot keeps a slow push-in or drift (camDrift + camS/camA ease); 3-4 s per shot, cut on the
  voice's phrase boundary; keep the push/pan DIRECTION consistent through a sequence (a story moving forward = left).
- New transitions (S(id, t0, tr, SET, fn, { dir })): 'push' = the new shot shoves the old one out (dir L/R/U/D, .34 s,
  eased, motion blur along the move; captions stay still) - use for 'meanwhile / next place'; 'fgwipe' = a dark
  foreground shape crosses the lens and the cut hides behind it (.42 s) - use for moving through a space / following
  someone. Existing: cut (default), blur (motion-blur dissolve), dis (dissolve = time passes), whip, sweep.
  Vertical push (U/D) = going down into the past / up to the reveal.
- scribbleAt(C or worldPos, k, r): a red marker ring drawn on over ~.5 s around a KEY person/object (pass the character
  so it rings the head); pair with a title label ('A machinist,' small + the name bold) in the empty side of the frame.
- Check: output/ทดลองทรานซิชันแบบสารคดี.jpg.

## Text system (v7.1, main.js captions/labels + src/text3d.js; 5 user refs: safe zones, keyword pill, presets, documentary titles, text behind people)
- Captions are NEEDED (many watch muted) but calm: one 1-2 word chunk at a time, soft POP (86% -> 100% in 4 frames, rises
  16 px), no SFX per word. project.json captions: { style: 'story', anim: 'pop'|'slide'|'fade'|'none', hiStyle: 'color'|'pill', y }.
- SAFE ZONE for TikTok/Reels/Shorts UI: x 60..900, y 230..1440 (top bar, bottom description, right buttons). The caption
  line is chosen ONCE per shot from y, y-190, y+90, y-380: the first that clears every visible face (headBall projection);
  a shot can force globalThis.CAP_Y.
- Highlight only the KEY word inside the chunk (yellow): *word*, project.hiWords (names, powers, places), numbers.
  ~text~ = whisper (smaller, slanted, softer); ^text^ = shout (bigger + short shake).
- project.json labels: place (documentary location/time card top-left, bar wipes in: scene openings), name (character name
  + role, left, first appearance only), type (phone/system message typed at 18 cps with a cursor).
- bigWord(SET, 'WORD', [x,y,z], { h, k, col, op }) (text3d.js): a big glowing word standing IN the set behind the
  characters (depth-tested: people in front cover it). Hook (first 2 s) and cliffhanger ONLY. Keep it inside the frame.
- Check: output/ระบบตัวหนังสือใหม่.jpg. KEEP (user favourites): the place label (title + underline + sub) and the whisper-thought text (whisperAt). 'classic' style = the old plain centred captions.

## Lip sync (v6.9, tools/lipsync.py + chars.js visemes; user: 'mouth must match the speech rhythm, natural, never off-beat')
- Run `python3 tools/lipsync.py .` after tools/timing.py: it reads aud/vo.wav at 100 Hz (loudness, low/mid band ratio =
  vowel brightness, 4.5-11 kHz hiss) with PER-VOICE calibration (percentiles, so deep and high voices both work) and
  writes timing.json "vis" = one viseme per video frame: X rest, M lips pressed (ม บ ป = energy dips inside a word),
  a small open, A wide (อา), E wide/stretched (อี เอ แอ), O round (อู โอ ออ), S teeth (ส ช ซ ศ ฟ).
- Rules built in (Preston Blair / Richard Williams / Rhubarb practice): the mouth LEADS the sound by 1 frame; every shape
  holds >= 2 frames except a 1-frame M closure; lips close only in pauses > .12 s; no A-a-A flapping.
- In shots: talk: lipAt(TM, voiceTime) (PM shots: talkAt(t) = lipAt(TM, t / SP); 'X' -> 0). Only the SPEAKER gets it.
  Visemes follow the mood: smiling characters talk with corners up + teeth, sad/angry ones with an open frown.
  o.k < .5 = mumble (smaller shapes) for whispers/asides.
- Check: output/ทดลองขยับปากตามเสียง.mp4 (old 3-level flap vs visemes), output/รูปปากตามเสียง.jpg (7 shapes x 3 moods).

## Music scoring (v6.9, tools/score.py; library: projects/music_library/*.mp3 + music.json; user: 'music entrances, sound on the beat, lots of music')
Research basis: film spotting practice (hit points, sync points, 'Mickey-Mousing' only for comedy), Knudson tempo/click
maths (pick the tempo so hits land on beats), trailer structure (build -> silence -> hit), broadcast ducking.
- SPOTTING (do it from the script before writing a note): mark the emotional TURNS, the reveal, the cliffhanger. Music
  ENTERS on a turn, a cut or under a sound (sneak in under an SFX/ambience, fadein .5-1.5 s); never starts mid-word.
  It EXITS at a phrase end, on a hard 'button' hit, or is CUT DEAD for shock. One cue per story beat (~10-20 s); change
  cue when the emotion changes, not when the camera does.
- HIT POINTS: 3-5 per minute (the reveal, the power, the punch, the last line). beatfit(hits, lo, hi) finds bpm+offset
  so every hit lands on a beat (error < 1 frame); bars(n, bpm) for riser lengths; a riser ENDS on the hit
  ('riser_hit' / 'suspense_reveal'). Stingers go exactly on the hit frame.
- SILENCE is a tool: drop the music .5-1 s before the biggest reveal, then hit. Don't score every second.
- TEMPO/KEY by mood: sad/dread 58-72, investigation 86-104, tension 90-110, action 140-165; minor for threat, major for
  hope/victory; step the key up (+2) for the final escalation; stingers in the cue's key.
- SFX ON THE BEAT: snap(t, bpm, off) moves only MUSICAL sfx (whooshes into a hit, risers, impacts in a montage) onto the
  grid if within 60 ms; physical/dialogue-synced sounds stay where the picture is. Whoosh = ends on the cut.
- UNDER THE VOICE: S.duck(timing env, depth .45) + S.voice_eq() (carve 1-4 kHz); music sits ~12-18 dB under the voice.
- CUES (21): tension_pulse dark_ambient mystery_pizz sneaky action_drums chase epic_rise villain sad_piano hope victory
  heartbreak horror lofi_investigation power_awakening city_night flashback confrontation calm comedy suspense_reveal.
  STINGERS (10): hit_boom braam riser_hit reverse_hit shimmer_up dread piano_low comedy_bonk heartbeat2 victory_hit.
  S = Score(END); S.cue(name, t0, dur, bpm, key, k); S.sting(name, t); S.duck(env); S.write('aud/music_bed.wav').
  Preview medley: output/ตัวอย่างเพลงประกอบ 21 แบบ.mp3.
- STYLE-ALIKE CUES (v7.0, ours to use anywhere): bossa_lounge flute_waltz retro_jingle dark_musicbox chill_jazz sad_lofi =
  the genres of the user's favourite tracks with ORIGINAL seeded melodies (never the source tune, hook or riff).
  Preview: output/เพลงแนวเดียวกัน 6 แบบ (ไม่ติดลิขสิทธิ์).mp3.
- USER TRACKS (projects/music_library/user/*.mp3 + user_music.json: title, mood, licence, approx bpm, LUFS): 13 tracks the
  user found (Kevin MacLeod 'Darkest Child' = CC BY 4.0, credit in the post; the rest are production-library / OST /
  Spotify songs = copyrighted: on TikTok add them as the in-app sound, on YouTube/FB expect Content ID claims -> prefer
  score.py cues or the CC BY track there). Loudness-match them (they range -8.7 to -23 LUFS) before ducking under the voice.

## Acting: faces + body language (v6.8, src/acting.js + chars.js faces; user: 'faces and poses must fit the situation')
Research basis: Ekman FACS (action units), Ed Hooks 'Acting for Animators', Disney 12 principles, Preston Blair sheets.
- THOUGHT -> FEELING -> ACTION: eyes change first, then the face, head, torso, hands last (perform(..., {lead:'eyes'})).
  A deliberate action leads with the body instead ({lead:'body'}). One clear emotion per beat; asymmetry, no twins.
- FACE PARTS (EX fields, all optional): lid (upper lid drop), lidT (+ sad outer-down / - angry inner-down), low (lower lid
  up = real smile / squint / glare), pup (eye size), arch (brow bend), byL/byR (one brow), mx/mw/mr/mflip (mouth shift,
  width, tilt, mirror), sh (shadow over eyes = dread/menace), blush, vein, drop (sweat), spark (shiny eyes), wet (tears line).
  Real vs fake smile = lower lids (smileReal vs smilePolite). Surprise = brows up level; fear = brows up AND knit.
  Contempt = one lip corner (only asymmetric universal expression). Anger = lids pinch, mouth tight or bared.
- 41 new faces: smileReal smilePolite smileSad laugh relieved touched awe hopeful pleading surprised terror dread anxious
  hurt despair guilty ashamed embarrassed shy annoyed bored skeptical suspicious contempt disgust annoyedHard rage
  coldFury menace glare focused thinking realize confused exhausted pain mocking sinister stoic determinedHard
  (+ the older ones). X EYES (user: pain / death = X eyes): eyes 'x'; faces pain, hurtX, ko, dead (cartoon, no blood).
  New mouths: smileSoft smileBig laugh pout grimace sneer tight gasp cry bite.
- exShift(lt, at, a, b): numbers tween in 5 steps, the eye/mouth SHAPE swap hides under a 2-frame blink. Blends are names
  'a>b@0.4' (exOf resolves + caches). Never hard-cut a face.
- gaze(lt, mode, seed): saccades (fast jump + hold): idle, think (up-side), avoid (guilt/lying, glances back), shifty,
  down, stare (threat/shock), search, up. Eyes never drift slowly.
- POSES (47, torso space): neutral relaxed confident handsOnHips armsCrossed handsBehind proud thinking chinRub headScratch
  realize facepalm explain shrug point accuse stopHand offer beckon wave whisper leanIn leanBack laugh cheer fistPump
  thumbsUp relief recoil gasp defend cower frozen handsUp anxious selfHug slump heartbreak ashamed exhausted fists menace
  guard grabCollar coldStare sneak peek. perform(lt, [[t, 'pose', {ex, look, dur, lead, mirror}], ...]) blends them with
  anticipation, overlap (parts arrive in order), overshoot-settle and a moving hold; mirror() swaps sides.
- STATUS: high status = still, upright, chin level, few gestures (coldStare, handsBehind); low status = fidgets, head
  down, self-touch (anxious, selfHug, ashamed). Open body = confident/honest; closed (crossed arms, hands at the face) =
  defensive / scared / hiding something. Fear freezes first (frozen), then recoils.
- FRONT CAMERA: spread gestures sideways and up; an arm aimed at the lens loses its silhouette. The 2D body cannot bend,
  so lean/crouch read in 3/4 or side views; in front views sell the beat with arms, head tilt and face.
- SITUATIONS cheat sheet in acting.js (bad news: frozen -> realize -> slump; caught lying: gasp -> ashamed + gaze avoid;
  threat: leanIn -> menace; stays cool: handsBehind -> coldStare; figures it out: thinking -> realize -> point ...).
- Contact sheets: output/ใบหน้าตามสถานการณ์.jpg, output/ท่าทางตามสถานการณ์.jpg (bench {act:[...], faceOnly, who, beats, lt}).

## Body mechanics kit (v6.7, src/motion.js; research: 12 principles, follow-through/overlap, Eiserloh camera trauma)
- turn(lt, t0, dur, fromDeg, toDeg): successive breaking of joints - eyes dart first, head .06, chest .12, hips .2 of
  dur later, each overshoots and settles; a small head dip mid-turn. Use for every look-around / turn to camera.
- take(lt, t0, k): surprise: anticipation dip (squash, head down) -> stretch up past the pose -> damped settle.
- hitReact(lt, t0, dir, k): head snaps first, chest 2 frames later, hips last + a stagger step (p_off), wobble out.
- standUp(lt, t0, LEG): lean the weight over the feet first, push, rise with a small overshoot (no pop at the switch).
- hold(lt, seed, k): moving hold - slow weight shift side to side, head settles a beat later. Nobody freezes.
- beat(env, envPrev): small head nods ON stressed syllables; gestures land a hair BEFORE the word.
- trauma(t, [[hitTime, amount]]): camera shake = trauma^2 x smooth noise, trauma decays linearly (small hits
  almost invisible, big hits dramatic); replaces hand-tuned SH.a ramps.
- fxphys.sparks({ at: WORLD pos (set.localToWorld!), normal, t0, n, speed, cone, life, floor, seed }).at(t): ballistic
  sparks (gravity, drag, bounce losing energy), drawn as velocity streaks with a glow, cooling white -> yellow ->
  orange -> red, own lifetimes/sizes, burst in a cone around the surface normal. Bullet on brick, sword clash, metal.
- Rules: the root (hips/torso) starts every move; lighter parts drag and settle later; heavier = slower start,
  smaller overshoot, longer settle; anticipation the opposite way first; nothing stops all at once.

## Characters must always read at night (v6.6, user: 'characters are hard to see')
- 'Black' clothes at night are painted charcoal blue-grey (#45425a-ish) with darker lapels and a bright trim, never
  near-black: the eye reads them as black against the darker set. Hair/hood art no darker than ~#3a3448.
- globalThis.SPRITE_EMISSIVE (default .32) = the sprites' self-light; night stories ~.6. Rig base >= .95, shadow
  <= .2, cel ~.55, rims .5-.6 (rimW .007) so the silhouette separates from the background.
- Value rule: the character must be lighter (or rim-lit) against a darker background in EVERY shot; check a
  grey-scale thumbnail of each shot before rendering. Silhouette shots keep a visible rim and some interior detail.

## SFX library v3 + rooftop/gun kit (v6.5)
- Library now ~300 sounds (projects/sfx_library, sfx.json): + 64 CC0 sounds from the SFXMint sample set on Hugging Face
  (AI-generated, CC0: rain, fire crackle, neon hum, heartbeat, wind whisper, drones, sirens, CCTV motor, glitch,
  scan, radio, typewriter-like UI, steps, body fall, bone crack, knife, glass crack, door/gate/lock, crowd, tinnitus,
  tape hiss...) + synthesized gun set: gunshot (alley echo / open), bullet_whiz, ricochet, casing (bouncing brass),
  gun_cock. Full SFXMint downloads need credits (free key = 3 a day): huggingface.co samples are free.
- Gun beat recipe: gun_cock (anticipation) -> silence .3 s -> gunshot + flash 2 frames + lightAt pulse -> whiz past
  the ear (pan) -> ricochet/spark on the wall -> casing bounces 3-5x -> tinnitus under the next line (everything else
  ducked -12 dB for ~1 s).
- zc.js ROOF set (ep 2 rooftop): parapet, water tank, stair hut + caged lamp, AC units, steaming vents, dish, antenna
  with a slow red beacon, back of a neon sign (pink spill), clothesline, crates, puddles, cables, lit skyline (window
  faces turned to the roof: rotation.y = -angle). makeGun(par) + gunFlashAt(gun, age, cam) (star flash 2 frames).

## SFX library v2 + pairing (v6.4, 8 user SFX compilation clips -> 81 clean sounds, catalogue sfx.json)
- Cutting: use the on-screen label timings (a label crop + frame-difference finds every change), or for narrated
  packs the word timestamps (cut BETWEEN the narrator's words). tools/sfx_clean.py: 35 Hz high-pass + spectral noise
  gate + trim + fades. Then run speech recognition on every cut: any words = voice bleed -> drop it (dropped:
  'Alien'). A source SNR < ~25 dB means music/voice/other hits underneath: keep only as a quiet layer.
- Pairings that work (projects/sfx_library/ตัวอย่างการจับคู่เสียง.mp3):
  whip_pan -> boom (scene change into a reveal) | riser -> heavy_hit (build then land) | reverse_whoosh -> bass_drop
  (suck in, drop on the cut) | cloth -> whoosh -> hit (punch with anticipation: cloth .25 s, whoosh peak just before
  the hit) | sword draw -> slash -> spark clash | fire_burst -> fire_ignite (layered .25 s) | riser_tension ->
  SILENCE (.3-.5 s) -> violin_screech (horror sting) | typewriter -> suspense_hit (text/file reveal) | timer -> boom
  | shutter + camera_flash (photo / CCTV still).
- Never pair: two booms within 1 s; a meme sound (fah, core, thug, imposter, vine) under a serious beat; a riser
  that does not resolve into a hit or a cut; whoosh AFTER the hit.
- Story use: suspense_hit / bell_doom / bass_drop = reveals; typewriter / message / click = screens & files (PM ep
  7-8); film_roll / shutter / camera_flash = CCTV & flashbacks; cloth / clash / slash / fire_* = fights; cash /
  counting = money & deals.

## Flicker + shake rules (v6.3, found in the PM ep1 frame check)
- Never flicker a light on/off at a fast regular rate when it drives big lit areas (bulb + glow + beam + pool +
  lightAt): the whole frame pulses every few frames and reads as stutter. Use a rare, soft dip from noise
  (1 - .35 * sstep(.55, .85, noise1(t * .9))). Small signs may blink; big light may not.
- Camera shake noise ~8 Hz (a rumble), never ~22 Hz, and none at all on macro / insert close-ups (a 2 mm jitter
  becomes a big jump when the camera is 40 cm away). Props in a close-up sway slowly (< 1.6 rad/s).
- The frame check must print ALL spikes, grouped by time, not the first 30 (periodic spikes hide past the cut-off).

## Rain + steam (v6.2)
- rainAt overlay is now 3 depth layers (far: many fine slow faint; near: few long thick fast), each drop on its own
  speed, slight wind slant, + splash crowns and widening rings on the ground part of the frame.
- glow.js steam(par, p, {n, size, rise, op, life, col}) + steamAt(t, cam) after the camera: soft puffs, small and
  quick at the source, bigger/slower/fainter as they rise, own clocks, sine sway. Use for pots, vents, AC units,
  breath in the cold, dark smoke above fire barrels (col dark).

## Fire + no faceted shapes (v6.1, user: 'fire still looks blocky; make it realistic; fix anything else angular')
- src/fire.js makeFire(parent, { w, h, seed, pal: fire|blue|green|purple|red, embers, ember }) -> .at(t, k, cam, lean);
  faceFires(camera) once per frame AFTER the camera is placed. A shader flame on an upright camera-facing quad:
  domain-warped fbm scrolling up, distortion growing with height, travelling sine sway, teardrop mask carved into
  tongues, soft-edged colour bands, two noise speeds (hotter = faster), continuous noise (never a looping pulse),
  lean = hand velocity (the flame trails a moving hand), embers rising on their own clocks, hot -> cool -> gone.
  Never build fire from cones or spheres again. Coloured palettes double as magic flames.
- Round things need segments: cylinders >= 14-18, spheres 16x12, tori 10x24 for anything bigger than a few pixels;
  4-6 sided posts read as square sticks. Glow sprites / light pools use the soft falloff textures, never discs.

## Glow edit (v6.0, user refs: 'Tutorial glow' before/after, lantern light-painting tutorial, runway over-exposure)
- GLOW.diffuse (main.js bloom): a soft blurred copy of the whole frame screened + soft-light on top = the 'glow edit'
  look: highlights bleed, a light haze, darks stay dark. .1-.18 for night stories; 0 for bright daytime fables.
- lightAt(worldPos, '#rrggbb', radius, k) (chars.js): a PAINTED LIGHT LAYER like the lantern tutorial: a soft radial
  light around a source, laid over everything near it (characters too): soft-light lifts what it touches + a little
  screen glow, inverse-square falloff. Put one on every important source: flame in a hand, lamp over a character,
  big sign, red eyes (lights the face red), laser dot. Animate k for flicker.
- Order of light layers (tutorial): dark base -> key light area -> painted light from the source -> rim -> glow/bloom
  -> diffusion. Each layer alone is subtle; together they read as real light.

## Soft light, no blobs (v5.9, user: 'light should not be lumps; bright naturally, fading soft at the ends')
- setSmoothLight(true) (engine.js) interpolates the toon ramp: lamp/neon point-light pools fade out instead of making
  hard rings. Point lights: decay ~1.6 and a long distance so they reach zero softly.
- Every glow texture uses an inverse-square-like falloff (1 -> .62 at 12% -> .26 at 30% -> .08 -> .02 -> 0); never a
  linear gradient (it reads as a disc). Puddles = a dark soft wet patch + the reflected colour, both feathered
  (RAD texture), never a solid ellipse. Reflection streaks: low opacity (~.3), feathered sides and ends.
- A light source next to a character must not wash the body: keep its rig key small (~.15-.3) and base < 1.

## Light direction on faces (v5.8, user refs: 9 light directions on a head, anime hair shadows)
- setRig({ dir: [x, y, z], cel: 0..1, term, shadeCol }): dir is the light direction in SCREEN space (x right, y up,
  z toward the camera). The head ball is shaded as a sphere with a hard anime terminator, and the hair/hat casts its
  shape onto the face (marches toward the light through the ivory mask, sprites/*-mask.png ALPHA channel). The body
  is shaded as a cylinder. Mirroring and every view work (screen space).
- Read the refs: top-front light = bangs throw a jagged shadow across the brow (most anime); side light = half the
  face in shadow (split, tension); under-light = shadow up over the eyes (villain / horror / power: PM 'power' rig,
  and the fire man's flame); back light = whole face in shadow + rim (silhouette). Keep the shadow mid-tone
  (shadeCol ~#7a7090) so faces still read; match dir to the visible source (sign, lamp, window, flame).
- GLSL: never name a variable `cast` (reserved word -> the shader fails and every sprite disappears). render.js
  now prints WebGL errors to the log.

## Glow + visible light (v5.7, user refs: Blade Runner haze, stage beams, window god rays, a match in a blue room, glowing doorway)
- src/glow.js: beam(par, from, to, r, col, op) = volumetric cone (soft edges, brightest at the source, falls off with
  distance; beamMat() to retexture an existing cone); spill(par, p, r, col, op, rot) = the source's colour pooling on
  the ground / a wall; streak(par, p, w, len, col, op) = wet-road reflection running toward the viewer (shimmers);
  glowAt(t) each frame. globalThis.GLOW = { a, wide } = two-scale bloom (tight core + wide soft halo).
- Rules from the refs: light shows in the air only where there is haze/rain/dust -> beams for lamps, searchlights,
  windows, open doors; every glowing thing spills its colour onto what is near it (wall, floor, the character via
  setRig) and fades with distance; on wet ground each sign makes a long streak; one dominant hue per scene + one
  accent; a figure in front of a bright source is a silhouette with a rim (RIGS.silhouette: base .28, strong rims);
  a small source (match, phone, flame, red eyes) lights only the face/hands near it = the strongest mood shot.

## FX study 3 (v5.5, 6 user clips: live-action power edit, green-screen meteors + explosion, flame tornado, power-% montage, stick fight)
- Power-up chain (one beat each, ~0.5-1 s): hands glow -> aura bursts around the body -> top-down shot -> an object flies
  AT the lens -> eye glow close-up -> wide -> the hit. Escalate scale shot by shot, never show the biggest first.
- Ground cut / trench: the cut line glows white-hot, then cools along its length (white -> orange -> dull red -> dark)
  over 2-4 s; chunks are thrown UP and fall back for a long time; heavy smoke rolls out LOW along the ground from both
  edges and keeps billowing after everything else stops; camera eases back slowly while it settles.
- Meteor / missile: a small bright head with sparks, the smoke trail starts thin and dark right behind it and widens,
  lightens and drifts the further back it is; several at different speeds and sizes, parallel, never in sync.
- Explosion: the fireball grows fast, then dark smoke wraps it from the edges inward; fire stays visible only through
  gaps; the column rises, slows and thins. Fire inside smoke, not smoke beside fire.
- Magic vortex: ground ring decal first, then the column grows; layers = bright core + spiral streaks + flame skirt at
  the base + sparkle particles; streaks twist upward faster than the column turns.
- Format idea: 'X% of power' escalation montage (1% -> 100%), one caption per level, each level a bigger effect.
- Stick fight (closest to our style): grey world + ONE accent colour for the power (red) - same as PM; hits take 2-3
  frames, then the victim hangs in the air; white flash circle + spark lines on contact; grey ghost trails behind fast
  limbs; dust ring on a ground slam; long red slash streaks; ~14% of frames are holds (key poses held on twos), the
  camera keeps moving on ones so it never reads as stutter.

## Motion helpers (v5.4, applying the study clips; see examples/shots_pm1.js)
- backOut(u, s): ease that overshoots the target a little and settles (s .7 heavy / 1.7 normal / 2.4 snappy).
- antic(lt, at, dur, pre, amt, s): anticipation: a small move the other way for `pre` s, then backOut to the pose.
  Use it for every hand raise, point, reach, gun draw. settle(x, f, d): damped wobble after an impact/stop
  (truck nose dip, body after a lift, head jolt when the eyes snap open, a startle).
- Overlap: when a group turns, each person starts ~.1 s apart; the head leads the body (head yaw = difference of
  two backOut clocks). Held/lifted objects lag the hand by ~.1 s. A heavy lift: dip (squash) before, small
  overshoot, then a slow settle. Strain = a fast 1-2 deg tremble.

## Smoothness + particles (v5.3, research + the study clips)
- Real shutter motion blur: `shutter: 3` on a shot (or `SHUTTER=3 node render.js video ...` for a whole range)
  averages 3 sub-frames over half a frame (180 deg, `SHUTTER_ANGLE`), like a film camera. Use it on fast action
  (punch, slash, explosion, falling debris, fast pans); it costs n x render time, so not on talking shots. Keep the
  per-object velocity stretch too: blur shows the path, stretch keeps fast pieces readable.
- Camera: judder comes from pans that are too fast for 30 fps. Slow, eased pans; if a pan must be fast, add shutter.
- Particles: less is more, never hide the main action; they react to the action and lead the eye to the hit.
  Mix 3 sizes (few big + slow, some medium, many small + fast) for depth and weight. Bursts come in clumps, not a
  perfect sphere (shatter: clump 0..1). Pieces thrown up fly higher and longer than ones thrown sideways. Spawn
  from an area, not one point. Vary life, size, speed and spin a little per particle so nothing moves in sync.
  Size over life: sparks start big and shrink; smoke and dust start small and grow while fading. Fade by
  shrinking/thinning, not a sudden pop. Fire/explosion colour ramps smoothly white -> yellow -> orange -> grey per
  piece on its own clock (no synchronized colour steps). Smoke sways on a travelling sine that grows with height
  (sway: amount) and slows as it rises.
- Particles stay on ones (every frame), never on twos: the user reads held particles as stutter.

## Script rules (v5.2, from the PUPPET MASTER rewrite; see output/THE PUPPET MASTER บทซีซัน 1.txt)
- 60-75 s per episode (finale up to 85 s) = about 34-45 lines at SP 1.12. The viewer average was 31 s, so:
  line 1 is the hook (the most shocking fact of the episode), a re-hook at about 30 s, the end is a cliffhanger.
- Don't narrate what the picture shows ("he laughed", "I nodded", "I answered:"). Animate it instead and cut the
  line. Speaker tags [name] carry who is talking.
- Dialogue: short (8-10 words max), with subtext. Each character keeps one pronoun pair for the whole series.
- Write the rules of the power once (episode 1) and never break them; plant every reveal earlier (a figure seen in
  ep 3 pays off in the finale).
- No blood or wounds in the script or on screen; no "kill" in covers or captions.

## THE PUPPET MASTER kit (v5.4, ep 1)
- examples/pm_sets.js: ZERO CITY sets (TRUCK interior, GATE wall + searchlights + neon sign, STREET neon night with
  signs/puddles/lamps/fire barrels/the liftable car, ALLEY brick + fire escape + flicker lamp + gun/laser). Import as
  src/zc.js. examples/shots_pm1.js: the episode (38 shots), examples/mk_pm.py: 8 hair silhouettes (swoop, peaked cap,
  flame spikes, buzz, mohawk, beanie, bandana, hood), examples/music_pm1.py + audio_pm1_episode.py: thriller bed + SFX.
- New overlays (chars.js / main.js): whisperAt(from, to, txt, k, t) = a planted thought (red wavy thread head to head +
  the line appearing letter by letter, Thai grapheme-safe); OVL {kind: 'redeyes', C, k, t} = glowing eyes on the real
  eye positions (headBall); OVL {kind: 'dot', p, k, r} = laser dot. Use POST.sat ~.12 while the power is used: the
  world drains to grey and only the red overlays keep colour. Silence the ambience + music in that beat.
- SITTING: put the character's root ON the seat top (p.y = seat top height, seat ~ that height) and inside/over
  the seat, never at floor height behind a bench box: the box then hides the body to the chest (user: 'ตัวละครจม').
  Check every seated shot from the camera side before rendering.
- Facing rule for 2D characters: ry = atan2(dx, dz) of (camera - character) in the set's space faces the camera; a
  character more than ~70 deg off shows the side/back sprite (hair covers the face).

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

### v7.5 Head view follows the HEAD, not the torso (hair/hat turn study)
- Ref study (projects/refs/hair_hat_turn_ref.mp4): hat brim + hair always match the head's yaw/pitch; the head turns first, the body follows 2-6 frames later; brim foreshortens at 3/4 and side.
- Before v7.5 the 2D head sprite (hair/hat drawn on it) used the BODY's view, so a gaze/head turn never changed the hair/hat.
- Now chars.js picks `viewH` from the head bone (C.hc) yaw, at most 1 view from the body (neck limit), stepped >= 2 frames like the body. It also has its own mirror and turn squash. C.viewH is exposed.
- So: to sell a turn, rotate the head first (gaze/turn on the head), then the body. Tested on pm3 W02 stills: no pop, head leads one view.
- Still open: per-view hat art for hats drawn as separate layers (current hats are painted on the head sprite, so they turn with it).

### v7.5 Walk: no more foot skating (walk study)
- BUG found: +z is the character's forward, but the walk foot path had the LIFTED foot moving back and the planted foot moving forward (a moonwalk). The walk phase also came from time (`walk(t, rate)`), not from distance. Simulated planted-foot slide in ep3 W06: 2.83 m/s at a body speed of 1.45 m/s.
- Fixes in chars.js:
  - Sign: the swing foot now goes forward.
  - The planted foot moves LINEARLY back (constant speed), and the swing keeps a smooth arc.
  - Arms counter the legs at heel strike (`-cos(ph-.35)`), not 90 degrees off.
  - Shoulders twist against the forward foot. The head counters the twist.
  - The torso rocks over the PLANTED foot.
  - Run was already correct and is unchanged.
- NEW `walkAlong(t, path, { stride, LK, s })` in acting.js: the phase comes from the ground covered. path(t) -> [x, z], the same function used for p. The stride shrinks as the character slows, so stops have no skate. Simulated slide is 0.02 m/s.
  - Usage: `import { LK } from './chars.js'; ...walkAlong(t, (u) => [0, AW(u)], { stride: .21, LK, s: C.spec.s })`
- RULE: every walk in a new shot uses walkAlong with the SAME path as p. Use the old walk() only for walking in place (treadmill/camera-locked).

### v7.5 Footsteps land on the contact frame automatically
- walkAlong logs every heel strike (ph crossing k*PI) when `globalThis.STEPLOG` is on. Pass `id: 'aren'` to tag the character.
- `node src/render.js steps out/steps.json [t0 t1]` runs only the shots' pose code once per video frame (no rendering, a few seconds) and writes [{t, id, foot, x, z, k, shot}].
- `python3 tools/footsteps.py out/steps.json aud/steps.wav <end_s> [lib.wav] [gain_db]` builds a stereo footstep track:
  - Grains are cut from sfx_library/steps_m01.wav and played round-robin.
  - Each hit varies by +-1.5 dB and +-3% pitch. Left and right feet pan slightly apart.
  - Hits are softer while the stride shrinks (stopping).
  - The attack lands 0-9 ms after the contact frame (tested on 19 hits in ep3 W05-W07).
- Mix aud/steps.wav into the SFX bus in audio.py about -4 dB under the VO. Do not hand-place footsteps any more.

### v7.5 Weight: sit / stand / stop
- Continuous sit: `P.sitK` 0..1 in chars.js. Put p ON THE FLOOR in front of the seat. The feet stay planted, and the hips go back .47*s and down to `seat` (world height). The old binary `sit: true` still works for static sitting.
- `sitMove(lt, at, dur, 'down'|'up', { seat, hands })` (acting.js) follows real sit mechanics:
  - Down:
    1. Anticipation: a small rise.
    2. The hips go back and down while the torso leans forward up to 28 deg as a counterweight.
    3. The last 20% drops faster.
    4. Contact squash.
    5. The torso settles back 5 deg past upright.
    6. Hands reach toward the thighs.
  - Up:
    1. Lean forward to 32 deg ("nose over toes").
    2. Hands push on the thighs.
    3. The hips rise with an ease-out. The torso straightens LAST.
    4. A 0.02 hip overshoot on top.
  - Tested with 9 stills.
- Walk inertia (walkAlong now also returns `lean`): the upper body follows the speed through an under-damped spring. It leans about 4 deg into a walk. On a stop it pitches forward to about 8 deg, rocks back to -2, then settles in about 0.8 s. The stride follows a smoothed speed, and the feet close over 0.3 s after he stops. Pass extra lean as `o.lean`, not as a separate `lean:`.
- RULE: walk paths should ease in and out, not stop dead. A dead stop is caught by the spring, but it reads as a bump.

### v7.5 Small life rules (automatic)
- Turn blink: a head or body yaw faster than 3 rad/s starts a 0.1 s blink, at most once per 0.45 s. This animation rule also hides the head-view swap. It is automatic in chars.js pose(); `P.blink` still overrides it.
- `breathAt(TM, t)` (chars.js) is for ON-SCREEN speakers only, not the narrator.
  - Before a line that follows a pause of 0.4 s or more, the speaker inhales: the chest swells and the chin lifts a little. Peak 0.74, about 0.1 s before the first sound.
  - The held breath eases out over 0.3 s once he speaks.
  - After a long line (more than 2 s), a small exhale settles the body.
  - Use: `live(lt, A, { ..., talk: lipAt(TM, t), inhale: breathAt(TM, t) })`. It needs `live` (the idle layer).

### v7.5 Props + background study (Blender prep)
Full study and set rules: projects/refs/BLENDER_SET_STUDY.md. Apply section 5 (set rules) from ep4 even without Blender.

### v7.5 prelint (run before EVERY render)
`python3 tools/prelint.py <root>` takes seconds and needs no browser. Exit 1 means fix first. It checks:
- module syntax (node --check)
- indoor shots without rain:false
- time-based walk()
- shot order and the first shot at 0
- 4 same transitions in a row
- shots over 6 s or under 0.5 s
- missing place/name labels
- a thought beat without whisperAt
- captions not word-aligned
- missing visemes
- sitting without a seat height

### v7.5 Screen safe zones (1080x1920; union of the TikTok, Reels and Shorts UI). Checked on ep3 at 4.6 s: OK.
- Keep clear: the top 220 px (status bar, tabs); the bottom 480 px (caption, music, comment bar); the right 160 px between y 700 and 1440 (like/comment/share buttons). Keep text at least 60 px from the left edge.
- Ours: captions centre at about y 1230 and the name label sits at x 70, y 1020-1100. Both are inside the safe area. Keep a 2-line caption above y 1440.
- Key action (a face, a held prop, a hit) must not sit in the bottom 25% or behind the right-hand buttons. Proof image: projects/refs/study/safe_zones_ep3.jpg.

### v7.5 Cover rules (study of our ep1-3 covers vs the reference grids)
- GRID CROP: the TikTok and IG profile grids show only the centre 3:4 (IG 4:5) of the 9:16 cover, so about 240-285 px is cut top and bottom. Our series line "THE PUPPET MASTER" at y about 210 is CUT in the grid. Keep ALL cover text and the face within y 300-1620.
- Problems in ep1-3: dark images (ep2/ep3); faces small, half-shadowed or cut by the title (Victor ep3); a calm expression (closed-eye smile) that sells no conflict.
- Rules:
  - The face is at least 35% of the width, with a strong emotion that matches the hook (fear, rage, smirk, shock).
  - Rim light plus a bright subject on a darker background.
  - One story object that raises a question: the gun, the 047 paper, the red thread.
  - The episode title is 2-4 words. "ตอน N" stays in the same yellow at the same place.
  - One accent colour per episode.
  - The title never covers the face.
- Optional: two faces in conflict (hero vs villain), split left/right.

### v7.5 Camera moves from the Higgsfield preset study (acting.js, pure math -> camX(pos, look, pos, look, 0, fov))
- The higgsfield.ai pages are blocked by this environment's network. The names come from search results and general knowledge of their preset library: Dolly In/Out, Crash Zoom, Dolly Zoom, Bullet Time, FPV Drone, 360 Orbit / Lazy Susan, Arc, Crane Up/Down, Snorricam, Robo Arm, Through Object, Whip Pan, Handheld, Rack Focus, Overhead, Hyperlapse.
- They also have effect presets: disintegration, explosion, set on fire, levitation, melting, thunder.
- ADDED, all tested numerically:
  - `dollyZoom(lt, at, dur, subj, from, fov0, fov1)`: vertigo; the subject size stays constant. Use it for shock/realisation.
  - `arcCam(lt, at, dur, subj, r, h, a0, a1, ease)`: orbit / 180 reveal. Use ease = false for bullet time on a frozen hit.
  - `snorriCam(p, ry, dist, h, ph)`: chest-rig camera for panic or running.
  - `throughCam(lt, at, dur, A, gap, B, lookB)`: fly through a window, bars or a door into the next space. This links places without a cut (rule 2).
- We ALREADY had dolly/push, whip, handheld drift (camDrift), DOF and crane-like Bezier moves.
- Crash zoom: NOT added. The user banned "zoom cut-ins". Ask before using one.
- The effect presets map to the Blender VFX library (BLENDER_SET_STUDY.md section 4.5).

### v7.5 Drama-short study (storiesbyloe / Higgsfield + Dreamina AI dramas, 4 clips 11-23; study/drama_ref_a.jpg, study/drama_ref_b.jpg)
Film grammar that makes these hold 100K+ likes, mapped to our 2D engine:
1. **Shot / reverse shot over the shoulder.** The near speaker's dark, blurred shoulder or head fills one edge, and the far face is sharp. Both cameras stay on one side of the line (180-degree rule), so the eyelines match.
   - NEW `otsPair(A, B, side)` in acting.js gives both cameras (checked: same side of the line).
   - Focus the DOF on the far face. The near character's head stays in frame as the dark foreground.
2. **Cut on every speaker change, about 1-2 s per shot.** The listener's reaction shot is as important as the speaker's.
3. **Escalate the shot size with the emotion:** wide two-shot (setup) → OTS → close-up → extreme close-up (the face fills about 80%: tears, trembling mouth, clenched jaw). Go back to the wide shot for a physical action (pleading hands, pointing, grabbing).
4. **Faces carry it:** wet eyes and tears (our P.tears), a quivering open mouth, a jaw clench, brows knitting while listening. Keep the micro-motion on the close-ups: a breath, small head shakes, blinks.
5. **Light:**
   - a warm practical inside (pendant lamp, bedside lamp) against a blue night-city window with bokeh
   - golden-hour backlight with a rim on the hair outdoors
   - shallow DOF everywhere
6. **Show the prop to the lens:** the phone screen turned to the camera, the ring, the car keys. Use an insert or a hold.
7. **Caption: one KEY phrase highlighted in yellow per line** ("SIX YEARS", "THIRD MAJOR THING", "JAMES"). We have `*word*` highlight markers. Use one per line, on the hook phrase.
8. **The hook line comes first, as a question or accusation** ("six years together, are you ever gonna marry me?"). The conflict is clear in 3 s.
- Our characters stay 2D. Use OTS plus close-up escalation in every dialogue scene from ep4.
- NEW close-up acting beats (acting.js), tested with 5 close-up stills (study/sob_listen_test.jpg):
  - `sob(lt, k, { seed, ex, talk, head, lean })`: a crying face that moves.
    - The lip quivers at about 14 shape flicks per second.
    - Irregular sob hitches every 0.7-1.3 s: the chest jerks up, the head tips back, then a shaky release.
    - A small head tremor, and tears scaled by k.
  - `listen(lt, 'hurt'|'angry'|'doubt'|'shock', { seed, turnAt })`: the reaction shot of the listener.
    - The expression shifts under a blink.
    - Slow involuntary motion: a nod, eyes dropping, a small head shake, a shock inhale.
    - A 1-2 s close-up is never a still frame.
  - Use: `put(C, SET, live(lt, 1, { p, ry, ...sob(lt, .8) }))`
