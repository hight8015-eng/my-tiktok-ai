# BLENDER TODO: do all of this as soon as Blender is reachable

Reach Blender either from the cloud session (Remote Control folder `E:\Claude Animate` on DESKTOP-2H0OUSI, once the Windows app serves it) or from a local Claude Code session on that PC.
Characters STAY 2D. Blender is for sets, props, light and VFX only.

Study: projects/refs/BLENDER_SET_STUDY.md (references, set recipes, rules). Tools:
- .claude/skills/storybook-3d-selfdrawn-story/blender/build_set.py (recipe → bake → .glb)
- src/blendset.js (loadSet, blocked)

## 0. Bring-up (first run)
Local session progress (commits d78c61c, 46a0644): the script runs on Blender 5.3. It saves .blend and a cam_door preview PNG. cam_* orientation is fixed. Draco is dropped (our GLTFLoader has no Draco decoder). out/ is gitignored, so the preview and .glb are NOT in git yet: push them to projects/refs/blender/ (small files) so the cloud session can check them.
- [x] (local PC session, Blender 5.3) Find blender.exe. Run build_set.py on blender/warehouse_test.json (--samples 64 --res 512). Fix the script until it runs clean. It is untested.
- [ ] Load the .glb in a pm3 test shot with loadSet(). Check:
  - scale against the characters
  - baked light (no double lighting)
  - `light_*` lights hitting the 2D characters
  - `cam_*` marks
  - `col_*` colliders
- [ ] Make a before/after stills comparison against the hand-built warehouse. Show it to the user.
- [ ] Enable the GPU in Cycles if the PC has one (--gpu). Note the bake times.

## 1. Asset library (CC0 only; record each licence in projects/refs/licenses)
- [ ] Download the packs: Kenney (city, furniture, survival), Quaternius (buildings, nature, vehicles), Poly Haven (HDRIs, textures, models), ambientCG (textures).
- [ ] Scale-normalise them to our character height.
- [ ] Catalogue them in blender/assets/INDEX.md.

## 2. ZERO CITY sets (recipes in BLENDER_SET_STUDY.md section 3), each with props that fit the story
- [ ] Street, night: wet asphalt and puddles, neon signs (Thai/English), AC units, wires, steam vents, trash bags, scooters, food carts. Light: cool moon, magenta/cyan neon, warm sodium lamps.
- [ ] Alley: solid dumpsters (with colliders), fire escape, pipes, graffiti, crates. One practical lamp, plus haze.
- [ ] Rooftop: water tanks, antennas, billboard back, vents, parapet, city bokeh below. Moon rim light, red aircraft lights.
- [ ] Warehouse (ep3 upgrade): crates, pallets, forklift, chains, fire drums, catwalk, broken skylight god rays, Victor's throne stage.
- [ ] Police station / office: desks, files, a pinboard with red string, window blinds. Blind-stripe light.
- [ ] Bar / den: counter, glowing bottles, booths, smoke. Warm low key plus a neon edge.
- [ ] Each set gets:
  - `cam_*` marks for wide, OTS and CU angles
  - `col_*` around every solid prop
  - at least 2 practical lights at night
  - a foreground framing element
  - story signs
  - no empty wall

## 3. Sign kit
- [ ] Thai/English text → sign texture generator. Every set gets readable story signs.

## 4. VFX library (RGBA PNG sequences, 1-2 s, 30 fps), layered as cards or overlays
- [ ] Explosion, smoke column, dust burst, debris (rigid body), sparks, fire, lightning, energy aura, meteor trail, glass shatter, wall breach (for Victor's punch).

## 5. Optional
- [ ] Cloth sim (cloaks, flags, curtains).
- [ ] City skyline parallax layers.
- [ ] Background plates for static shots.

## Rules to keep
- Props must fit the story (no random flags).
- Nobody walks through props (use colliders and `blocked()`).
- Characters stay visible at night (rim light).
- Labels every episode.
- Ask about helpers before full renders.
