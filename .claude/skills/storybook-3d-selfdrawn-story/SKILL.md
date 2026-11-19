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
