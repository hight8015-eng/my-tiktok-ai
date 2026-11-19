# Script rules, THE PUPPET MASTER kit

(Split out of SKILL.md word for word. Read before the step that needs it.)

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
