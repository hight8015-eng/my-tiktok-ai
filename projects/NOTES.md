# Working notes: what the user wants (keep for every new session)

The engine and every technique live in `.claude/skills/storybook-3d-selfdrawn-story/` (SKILL.md = all rules, versions v4 to v6.3).
This folder keeps the stories: scripts, episode sources, the character drawings and the raw voice-overs.

## Standing rules from the user
- Ask before every full render how many helper sessions to use (default: one machine).
- "Don't render" means only adjust and remember. Render only when told.
- Story channel, 9:16 Thai, ~60-80 s; deliver (มีเพลง).mp4, (ไม่มีเพลง).mp4, ปก.jpg, โพสต์.txt.
- No stutter, no skipped frames, no progress bar, no loop ending. Smooth natural motion that follows physics.
- No zoom-in cut-ins; cameras keep >= 2 m from faces.
- Study every reference sent; never change things at random. Focus on detail and quality.
- Characters never sink into seats/props; props fit the story (no random flags).
- Light: motivated by visible sources, soft natural falloff (never blobs or hard discs), face shading follows the light
  direction, glow edit, fire made with the shader flame (never cones).
- SFX by the hit() rules: varied, not repetitive, not annoying; meme sounds rare.
- Scripts: hook in line 1, cliffhanger at the end, short dialogue with subtext, no blood/wounds.

## Series
- THE LAST VILLAIN: 3 episodes delivered (ep1 is not to be redone). Script: the-last-villain/.
- THE PUPPET MASTER: season 1 script (8 episodes) in the-puppet-master/; ep1 sources in the-puppet-master/src (shots.js,
  zc.js = ZERO CITY sets), tools (mk_pm.py characters, music_pm1.py, audio.py), chars/ (character drawings, rebuild
  sprites with tools/sprites.py + headmask.py), voice/ep1_raw.mp3 (cut the read-aloud speaker tags at 18.96-19.85 s
  and 46.96-48.0 s, then tools/tighten.sh ... 1.12).

## Autosave (keeps everything after the cloud container is gone)
- `autosave.sh` runs by itself after every Claude turn (Stop hook in `.claude/settings.json`) and saves:
  every scratchpad story project -> `projects/_work/<name>/` (src, tools, chars, voice, timing, sheets, sfx.json),
  loose scripts -> `projects/_work/_loose/`, finished episodes (ปก.jpg, โพสต์.txt) -> `projects/_delivered/`,
  and the skill mirror; then commits and pushes to this session's branch AND the default branch
  claude/skill-installation-kkpo2q (every new session starts from it). Log: `.autosave.log`.
- Not saved (rebuildable): renders, frames, wavs, generated sprites. `bash autosave.sh --video` also saves the mp4s.
- New session: `bash autosave.sh --restore` copies `projects/_work` back into the scratchpad.

## Handoff (latest session, 2026-11-19)
- Done this session: autosave (Stop hook), acting kit v6.8 (41 faces + X eyes pain/hurtX/ko/dead, 47 poses, perform/
  exShift/gaze), music scoring kit v6.9 (tools/score.py, 21 cues + 10 stingers in projects/music_library, beatfit/snap/
  duck), viseme lip sync v6.9 (tools/lipsync.py -> timing.json "vis", lipAt). All rules in SKILL.md.
- PM working project = projects/_work/pm1 (shots.js already uses talkAt = lipAt visemes; bench supports act/beats/lt).
- NEXT: THE PUPPET MASTER ep2. Wait for the user's voice-over, then: timing.py -> lipsync.py -> shots (ROOF set, gun kit,
  motion.js, acting.js perform + faces by situation, brighter rigs) -> stills check -> ASK how many helper sessions ->
  render -> frame check -> music with score.py (spot cues, beatfit hit points, stingers, duck) + SFX (hit rules, snap
  musical sfx) -> finish -> deliver 4 files. Do NOT re-render ep1.
- New session start: restore runs by itself (SessionStart hook -> `autosave.sh --restore`). No need to ask for it.
- Token saving: SKILL.md keeps the core workflow; detail rules v5.2-v6.9 are in the skill's `references/*.md`
  (index table in SKILL.md). Read only the files the current step needs.
- Text study (5 user refs, 2026-11-19): safe zone (avoid top ~12%, bottom ~25%, right ~15% UI), keyword highlight
  (colour/pill), subtle per-chunk pop/slide/fade (no heavy fx every word), documentary title/lower-third labels,
  big kinetic word BEHIND the character only for the hook/cliffhanger, typewriter for messages. Proposal sent; waiting
  for the user's go-ahead. Also offered: original 'style-alike' cues (bossa lounge, flute waltz, retro jingle, dark
  music-box, chill jazz, sad lofi) made with score.py - same mood/tempo/instruments, never the melody/hook.
- User APPROVED the red marker ring (scribbleAt): use 1-2 times per episode on key people (first appearance of a key
  character + name label, the reveal, a liar), never during heavy emotion beats.
- EP2 (in progress): scratch project pm2 (= projects/_work/pm2). Voice ep2_raw.mp3 -> tighten 1.12 -> vo_fast.wav (71.33 s).
  Islands came from ASR word timestamps (tools/asr_words.py + difflib alignment, project.json 'islands'), NOT silencedetect.
  timing.json + vis done. Next: shots for ep2 (real seconds, SP = 1), rooftop friend character, stills, ASK helpers.
- EP2 DELIVERED v2 (2026-11-19, full redo with the 5 user rules + friend face fix).
  (shots_ep2.js, audio_ep2.py, timing). Frame check: only intended speed-line/turn spikes. Next: ep3 when the user sends the voice.
- EP2 FIX LIST (user review 22:13): (1) walk-out 41-49 s: Aren slides (camera tracks at walk speed), stiff arms, E22 too
  close + dumpster in front, E23 Aren missing; HE WALKS THROUGH THE DUMPSTER (dumpster x -1.8..-0.7, z -5..-3 -> walk at
  x = -0.1, never x -0.9). (2) 58-62 s fight: no action, not facing, fire man cut, strong man >< face, winner shot static,
  fallen man cut off. Also: almost every shot static (use acting.js perform/hold/gaze everywhere), no shot showing alley +
  roof together, tracer too faint + small flinch, thread shot shows 1 thread and the follower off-frame, cover hides the gun.
  Re-render only the changed segments (rq.sh is resumable: delete those segments' .ok) then finish again.
  RULE: check every walk path against props (dumpster, crates, bags) - characters must never pass through objects.
- USER RULES (2026-11-19, after the ep2 review; apply to every episode):
  1. Scene GEOGRAPHY must be clear: establish where everyone is (a wide/high shot showing all parties), keep screen direction.
  2. Events in places CLOSE to each other = connect them with a CAMERA MOVE (pan / tilt / crane / tracking from one subject
     to the other), not a cut. Ref: courtroom clip (judge -> pan across the room -> the crowd -> over-shoulder to the
     defendant). Ep2 fix idea: put the 'roof' friend on the alley's own fire escape/roofline (x 1.55, y 5.8, z -6) so one
     tilt-up links them, plus one high shot with both guns.
  3. Motion, emotion, gestures and faces must match each other and look natural (acting.js perform/hold/gaze, no frozen poses).
  4. When the narration describes an ACTION, SHOW that action literally (e.g. 'they fight for power' = a real fight on screen).
- EP2 FULL REDO PLAN (user: 'fix only that?' -> fix everything with the 4 rules; = rebuild nearly all shots + full re-render):
  0-12 s: wide establishing (alley, both men, fire escape above); camera MOVES gun -> Aren -> gunman instead of 4 cuts;
  gunman alive (weight shift, real shaking hand, eyes flick up, confident -> worried); Aren breathing, stare, tiny smirk.
  12-18: friend on the alley FIRE ESCAPE (x 1.55, y 5.8, z -6); one tilt-up from the gunman to him; red ring; down to his gun.
  18-25: visible red spark Aren -> gunman's ear; gunman eyes widen, sweat, shaking grows.
  25-37: full-body whip turn, gun swings up; HIGH shot with both men + the shot fired down; clear tracer past the
  shoulder, big flinch/stagger, sparks on the wall by Aren, Aren does not blink; shouting with pointing guns + angry bodies.
  37-50: high shot: two aiming at each other, Aren walks out below (path clear of props, arms swing, really crosses frame);
  follow from behind with them small in the back; pan as he turns to the graffiti.
  50-62: slow move across the graffiti; follow him out to the street (no push - same place); REAL FIGHT for 'สู้เพื่ออำนาจ':
  fire man vs strong man guard, clash, punches, fire burst, one falls, winner stands over him, bystanders step back.
  62-71: threads to several passers-by who stop walking when touched; everyone breathes/blinks/gazes; cover = gun at head +
  red-eyed smile; redo music/SFX sync to the new picture.
  5. (user) The camera does NOT follow/move all the time: MIX camera moves with the studied transitions (cut, blur, dis,
     whip, sweep, push, fgwipe) so the edit feels natural and flowing - a move links nearby beats, a transition marks a
     change of place/time/energy; vary them, never the same device twice in a row.
- LESSONS LEARNED list now lives in SKILL.md ('LESSONS LEARNED'): read it before every new episode/story.
- User: the roof friend's face must be clearly visible (medium close-up + face light) - fixed in ep2 v2 F06/F11/F14.
- EP2 v2 user notes (fix from ep3 on, no re-render): captions centred + in sync; level camera so guns read; hair/hats/hoods must turn with the head (ref projects/refs/hair_hat_turn_ref.mp4, study before ep3).
- Motion still not smooth (user): turns pop back->front in 1 frame (ref projects/refs/ep2_motion_issue.mp4). Fix the sprite turn (S/Q in-betweens + crossfade + hair) before ep3.
- Framing rule (user): characters and held props must never be cut by the frame edge; level camera on prop beats.
- Captions: every chunk FADES OUT at its end (0.12 s) - user request, main.js v7.4. EP3: segments 0-3 started before this change -> re-render them (delete out/seg s_00000..s_00400 .ok) before finishing.
- User LIKES and wants to KEEP: (1) the documentary place label (title + white underline + sub line, top-left) and (2) the whisper-thought text floating from Aren to the target (whisperAt, pink-red glow). Use them every episode where they fit.
