# Fire, rain, steam, power FX

(Split out of SKILL.md word for word. Read before the step that needs it.)

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
