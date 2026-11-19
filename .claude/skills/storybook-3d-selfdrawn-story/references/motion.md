# Motion, smoothness, flicker/shake, body mechanics

(Split out of SKILL.md word for word. Read before the step that needs it.)

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

## Flicker + shake rules (v6.3, found in the PM ep1 frame check)
- Never flicker a light on/off at a fast regular rate when it drives big lit areas (bulb + glow + beam + pool +
  lightAt): the whole frame pulses every few frames and reads as stutter. Use a rare, soft dip from noise
  (1 - .35 * sstep(.55, .85, noise1(t * .9))). Small signs may blink; big light may not.
- Camera shake noise ~8 Hz (a rumble), never ~22 Hz, and none at all on macro / insert close-ups (a 2 mm jitter
  becomes a big jump when the camera is 40 cm away). Props in a close-up sway slowly (< 1.6 rad/s).
- The frame check must print ALL spikes, grouped by time, not the first 30 (periodic spikes hide past the cut-off).
