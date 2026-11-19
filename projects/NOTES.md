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
  and the skill mirror; then commits and pushes to claude/skill-installation-kkpo2q. Log: `.autosave.log`.
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
- New session start: `bash autosave.sh --restore` copies projects/_work back into the scratchpad.
