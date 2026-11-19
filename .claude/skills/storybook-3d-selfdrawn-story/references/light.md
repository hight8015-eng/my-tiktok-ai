# Light, glow, faces lit at night

(Split out of SKILL.md word for word. Read before the step that needs it.)

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

## Characters must always read at night (v6.6, user: 'characters are hard to see')
- 'Black' clothes at night are painted charcoal blue-grey (#45425a-ish) with darker lapels and a bright trim, never
  near-black: the eye reads them as black against the darker set. Hair/hood art no darker than ~#3a3448.
- globalThis.SPRITE_EMISSIVE (default .32) = the sprites' self-light; night stories ~.6. Rig base >= .95, shadow
  <= .2, cel ~.55, rims .5-.6 (rimW .007) so the silhouette separates from the background.
- Value rule: the character must be lighter (or rim-lit) against a darker background in EVERY shot; check a
  grey-scale thumbnail of each shot before rendering. Silhouette shots keep a visible rim and some interior detail.

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
