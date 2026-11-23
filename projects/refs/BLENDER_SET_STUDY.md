# Props + background study (for Blender, while waiting for the computer)

Sources: every reference the user sent. Contact sheets are in projects/refs/study/:
- img_1118_07_0: RickClips and RodMaiClub frames
- img_1118_04_0: pirate ship
- img_1118_06_0: shops, cells, thrones
- vA: roller coaster, pink prison, roadside clips
- vB: green-screen VFX and energy/power clips
- img_1119_03_0: cinematic lighting and glow refs
- storiesbyloe and the ChatGPT pipeline advice (11-23)

Characters stay 2D. Blender is for sets, props, light and VFX only.

## 1. What the million-view references do (RickClips / RodMaiClub / roller coaster / prison)
They are 2D-looking stick characters inside fully modelled 3D sets. These look like Blender or a game engine: toy-like stylized PBR (physically based materials), soft global light, and bloom. This is the target.

1. **Dense, story-true set dressing.** Nothing is empty.
   - The grocery has shelves full of coloured packs.
   - The pirate ship has cannon, barrels, mugs, rope and sails.
   - The prison has bunks, a table, lockers, rails and signage ("POD C").
   - Every prop belongs to the place and the story.
2. **Signs tell the story or the joke.** For example: "OPENING TOMORROW", "DELI GROCERY", "TREE TOWING CASH ONLY", "DAYS SINCE LAST CRASH 7". The text is readable on a phone, so the sign is a prop and a caption at once.
3. **One dominant colour per scene, plus one accent.**
   - Pink cell, blue prison hall, green fields.
   - A blue rainy night street with warm shop windows.
   - The colour carries the mood. Neighbouring scenes contrast.
4. **Light is motivated and soft.**
   - Sun with sky fill by day.
   - Practical lights at night: shop windows, string bulbs, street lamps, neon.
   - God-ray shafts through windows and bars.
   - Wet, reflective ground in rain.
   - Bloom on every light source.
   - Rim light separates the character from a dark background (Joker-subway ref: warm key on one side, cool on the other).
5. **Depth in layers.**
   - Foreground framing: bars, a tree trunk, a car door, a cart edge, a dashboard.
   - The character in the midground.
   - A detailed background with atmospheric haze.
   - Low camera angles and wide-lens POV shots (driver's seat, inside the cart).
6. **Hero-prop inserts:** the golden dragon, the piggy bank, the big red button, the stopwatch, a fan of tickets. A close insert on the object the narration names.
7. **Life in the background:** leaves moving, cars passing, extras (army rows, crowd), weather (rain streaks, dust).
8. **Materials:** simple textures (planks, brick, tile, asphalt with road lines) and bevelled edges that catch the light. Saturated, not photoreal. Low-poly with smooth shading, like the Synty/Kenney look.

## 2. VFX refs (green-screen clips, energy-power clips, "my power type")
- Meteor/missile trails, fireball explosions, rolling smoke, dust, lightning arcs, an energy tornado, a ground crack with fire, and a body-impact gore burst on a grey stage.
- These are exactly Blender simulation renders: Mantaflow smoke/fire, particles, rigid-body debris.
- Plan: render them as RGBA PNG sequences (alpha, not green) and layer them in our engine as camera-facing cards or screen overlays.

## 3. Our ZERO CITY sets, rebuilt in Blender (recipes)
| Set | Dressing (story-true) | Light preset |
|---|---|---|
| Street, night | wet asphalt and puddles, neon signs (Thai and English), AC units, tangled wires, steam vents, trash bags, parked scooters, food-stall carts | cool moon key, magenta/cyan neon practicals, warm sodium lamps, rain |
| Alley | dumpsters (solid, collision-checked), fire escape, pipes, graffiti, crates, a cat | one practical lamp, deep shadows, haze |
| Rooftop | water tanks, antennas, a billboard back, vents, a ledge with a parapet, city-light bokeh below | moon rim, red aircraft lights, wind dust |
| Warehouse (ep3) | crates, pallets, a forklift, chains, fire drums, a catwalk, a broken skylight, Victor's throne on a pallet stage | skylight god rays, warm fire flicker, cold fill |
| Police station / office | desks, files, a pinboard with red string, blinds | blinds-shadow stripes, fluorescent green-white |
| Bar / den | counter, bottles with a glow, booths, smoke | warm low key, neon edge |

## 4. Pipeline plan (on the user's computer, headless `blender -b -P script.py`)
1. **Assets (CC0 only, licence recorded):** Kenney (city, furniture, survival kits), Quaternius (modular buildings, nature, vehicles), Poly Haven (HDRIs, textures, models), ambientCG (textures).
2. **Build each set by script.** Check every prop's scale against the character height. Leave walkable lanes and collision boxes so nobody walks through props (ep2/ep3 lesson).
3. **Bake light.** Cycles GI + AO into lightmaps, then export .glb (Draco compressed) and load it in our Three.js engine. Characters stay our 2D sprites. Result: the look of the references, at our current render speed.
4. **Background plates** (static or slow-move shots): render a full 1080x1920 frame per camera with the matched camera JSON. Characters composite on top.
5. **VFX library:** explosion, smoke column, dust burst, debris, sparks, fire, lightning, energy aura, meteor trail, glass shatter, wall breach. Each is an RGBA sequence, 1-2 s, 30 fps.
6. **Sign kit:** a Thai/English sign generator (text to texture) so every set gets story signs.

## 5. Set rules (apply from ep4, with or without Blender)
- No empty wall. Something every ~1 m: a sign, pipe, shelf, poster or lamp.
- Every prop belongs to the place and the story. No random flags (user note 11-18).
- One dominant colour per scene, with neighbouring scenes contrasting.
- Every night scene has at least two practical lights, plus a rim light on the character (characters must be visible at night).
- A foreground framing element in about half of the shots.
- An insert shot of every prop the narration names.
- Something moving in the background in wide shots (rain, leaves, cars, extras, steam).
- Signs are readable at phone size and in Thai where the story is local.
