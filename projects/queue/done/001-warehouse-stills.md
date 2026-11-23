# done: 001-warehouse-stills (type: stills) — cloud, 2026-11-23

## What I did
- Engine: a scratch copy of render_jobs/pm4/src (it has blendset.js + the wh_pm3.glb hook in zc.js). prelint: 0 errors, 1 warning (hook framings; not relevant here).
- Test harness (scratch only, diff in out/001-warehouse-stills/test_harness.diff):
  - zc.js: the glb url is chosen by `window.WHGLB` ('none' = the old procedural room); `WHRAW` skips the night grade.
  - main.js: `CAMOVR` = a fixed camera + a character placed at warehouse-local [1.2, 0, -0.6]. NOAUTO is on, so there is no drift or DOF.
  - render.js: `CAMS` env renders named camera marks.
- The test runs inside shot N04 (t = 16.5 s), so the lights are the real ep4 warehouse rig. The character is Victor (CHARS.strong).
- 3 variants x 3 camera marks:
  - before = the hand-built procedural warehouse
  - after = projects/refs/blender/warehouse.glb (raw bake, loadSet)
  - pm3glb = the current sets/wh_pm3.glb with the night grade
- Camera marks (warehouse-local coordinates):
  - cam_door = the glb's own mark, pos [0, 1.5, 6] → look [0, 1.2, 0]
  - cam_high = [5.6, 5.2, 5.4] → [-0.5, 0.8, -2.5], fov 46
  - cam_side = [-4.2, 1.7, 2.2] → [1.6, 1.1, -2.6]

## Result: projects/refs/blender/out/001-warehouse-stills/
- grid_before_after.jpg: rows are before / after / pm3glb, columns are door / high / side.
- 9 single stills: <variant>_<cam>.jpg.

## loadSet checks on warehouse.glb (from the page log)
- Loads with no errors. GLTFLoader without Draco is fine.
- cam_door: pos [0, 1.5, 6], look [0, 1.30, 2.0]. The recipe has look [0, 1.2, 0]; this is the same direction, because loadSet puts the look target 4 m out. OK.
- Colliders: 2, and they match the recipe.
  - col_crates x -3.8..-2.4, z -4.7..-3.3
  - col_pillar x -0.4..0.4, z -2.3..-1.5
- Lights: 2 PointLights.
  - light_fire #ff8a3a, power 1.2
  - light_lamp #ffd59a, power 1.6
  - The `sky` sun is not turned into an engine light. This is as designed: only point/spot are read.
- Scale: the 1 m crates and the 0.9 m drum read right next to the ~1.6 m character. OK.

## Findings (after vs before)
1. The raw bake is too bright and too flat for the series look.
   - The pillar and walls come out near-white beige, with no night mood and no colour contrast. The lamp panel is a hard white slab.
   - The night-grade multiply that zc.js uses for wh_pm3.glb (setRGB .52/.44/.6) is needed for test glbs too. Or bake darker: lower lamp power / exposure.
2. Double pillar: shots.js PILLAR [0, 4.5, -1.9] overlaps the glb pillar. Hide one when a glb provides it.
3. The test set is open on 2 sides (only the back and left walls). From cam_side the purple sky/void shows through. Expected for a test recipe.
4. The character gets warm light from light_lamp/fire, and its shadow sits on the baked floor with no double-lighting halo. OK.
5. The current wh_pm3.glb (row 3) is clearly the best of the three: dressed, graded, signs readable. Keep it as the ep4 warehouse.

## Timings
- 3 variants in parallel: 15-17 s each (load + 3 stills, swiftshader).
- Errors: none.
