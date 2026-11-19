# Lip sync visemes, faces, poses, acting

(Split out of SKILL.md word for word. Read before the step that needs it.)

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
