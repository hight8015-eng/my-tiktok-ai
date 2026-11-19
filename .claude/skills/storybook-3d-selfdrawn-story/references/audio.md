# Music scoring, SFX library, pairing

(Split out of SKILL.md word for word. Read before the step that needs it.)

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
