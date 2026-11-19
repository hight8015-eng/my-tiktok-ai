# Engine cheatsheet (src/)

Units: metres, y up. Times: seconds on the `src/timing.json` timeline, which includes the build-up pause.

## Files
| file | what it holds | edit for a new story? |
|---|---|---|
| engine.js | renderer, toon materials, mesh helpers, easing, post pass (ink lines, DOF, grade, leaks) | no (tune `POST` only) |
| world.js | sky, stars, moon, clouds, sea, lights + presets (lines 1-143 = generic) then the SETS (rowboat, gulls, river VALLEY `VL`/`VA` with two villages, growing bridge, signboard counter, toll gate, instanced crowd, desk set `DK`) | yes: keep the top, replace/add sets |
| chars.js | faces (`EX`, `drawFace`), stick limbs + IK (`pose`), 2D sprites (`makeChar2D`, `updateSprites`), rig lengths `LEG`/`LL`/`AL`, `makeCast` | rarely (new expression = add to `EX`) |
| shots.js | helpers + the shot list `S(...)`, `COVER`, `BENCH` | yes: the whole story lives here |
| main.js | frame(t): shot pick, transitions, bloom, one-word captions (y 1350), end fade | no (caption y/size only) |
| render.js | headless Chromium driver: stills / video / cover / bench / list | no |
| project.json | title, vo, pause, lines, cast, cover | yes |

## Materials and meshes (engine.js)
- `toon(color, {map, emissive, ei, ol, noInk, grad, unique})` cel material (3-step `GRAD`; `GRAD_FLAT`/`GRAD_2` softer). Ink lines come from the screen-space pass, so `ol` (hull outline) is only for characters.
- `basic(color, {transparent, opacity, map, side, depthWrite, fog, noInk})` unlit.
- `mesh(geo, mat, {p:[x,y,z], r:[deg,deg,deg], s, parent, cast, recv})`, `group({p, r, parent})`, `rbox(w,h,d)` (crisp box so the ink draws its edges), `cylBetween(a, b, r, mat, parent)`.
- `canvasTex(w, h, (ctx,w,h)=>{...}, {repeat})` for signs, maps, wood, labels. Redraw later via `tex.userData.ctx` + `tex.needsUpdate = true` (cache by a key so you redraw only when it changes, like `drawSign(title, num, col, flip)`).
- `obj.userData.noInk = true` keeps glass, water, spray and glows out of the ink pass.
- Tilted props on a table: set `g.rotation.order = 'YXZ'` (tilt then yaw), or an edge dips into the table. Give props a colour that differs from what they lie on.

## Light presets (world.js)
`Wd.applyLight('day' | 'gold' | 'dusk' | 'twilight' | 'night' | 'nightFog' | 'sunrise', {overrides})`: sky gradient, sun, hemi, fog, sea colours, stars, moon. Overrides take any preset key (`fogN`, `fogF`, `sunI`, `top`...). Bright is the rule: even 'night' is a readable blue, never black.
`Wd.setShadowFocus(x, y, z, size)` once per shot, centred on the action (smaller size = sharper shadows).
`Wd.pts[0..3]` = 4 point lights (lanterns, glows); `applyLight` turns them off, the shot turns them on.
`moonAt(dx, dy)` puts the moon relative to the camera view. `Wd.WAVE.amp` sea swell. No sea: `Wd.sea.visible = false` + build a ground.

## Characters (chars.js)
- Cast comes from `project.json` `cast`: `{id, sprite:'C01', s:.7-.82 (child small, adult big; the figures are about 3 heads tall), beard:'#hex', stache:true, stacheC, browC, browW, mouthY:.68-.74 (lower for a beard), eyeY, faceY, faceV, glasses2D:true, cheek, sink:105}`. Access as `CHARS.<id>`.
- `put(C, parent, P)` adds the char to a parent (scene, `VL`, `desk`, `boat`, a set group) and poses it. `pose(C, P)` fields:
  - `p:[x,y,z]` feet position in the parent, `ry` yaw deg (0 = facing +z), `rx`/`rz`
  - `lean` (fwd +), `twist`, `side` torso deg; `head:[pitch, yaw, roll]` deg (pitch + = look down)
  - `hL`, `hR` hand targets in TORSO space (`[x,y,z]` or Vector3; `toTorso(C, worldVec)` converts); `pL`, `pR` elbow poles
  - `sit:true` + `seat` (seat height), `hipY`, `fL`/`fR` feet in hips space, `walk:{ph, stride}` (ph = phase, e.g. `ph: lt * 10`, and move `p` forward with it)
  - `ex` expression, `blink` (`blinkAt(t, seed)`), `talk` (`talkAt(t)` from the VO envelope: lip-sync for whoever speaks), `look:[x,y]` pupils -1..1, `sweat:true`
- Expressions `EX`: neutral, calm, sleepy, yawn, sly, wink, shocked, scared, confident, worried, happy, sneaky, frown, sad, determined.
- Hand props: `propAt(obj, C, [x,y,z])` puts a prop at a TORSO-space point (use the same point as the hand target); `lampAt(C, k, hand)` does it for the lantern and its light.
- Sprite rules (already in code, do not undo): view F < 24° < Q < 60° < S < 128° < B from the camera angle, mirrored on the other side; head anchored to the costume collar in the billboard plane and sunk `sink` px (2x sprite px) into the collar, so the neck hole never shows when leaning or nodding.

## Shots (shots.js)
```js
S('B02', 1.86, 'whip', (lt, t) => {             // id, start time, transition IN, body (lt = time in shot, t = global)
  day(); Wd.bridgeAt(1, 1);                      // light first, then the set state
  faceOff(t, ['frown', 'determined']);           // a pose helper: put(CHARS.redc, VL, {p, ry, lean, ex, hR, pR, ...}) twice
  const u = U(lt, 1.7, eOut);                    // 0..1 over 1.7 s with an easing
  camW([1.4, DY + 1.5, 6.6], [0, DY + 1.1, 0], [0, DY + 1.25, 5.0], [0, DY + 1.1, 0], u, 40); dof(.3);
});
```
- Transitions: `'cut'`, `'dis'` (0.28 s dissolve), `'whip'` (motion-blur whip pan between shots, use on energy), `'sweep'` (warm light sweep, use for time skips).
- Cameras: `camW(p0, t0, p1, t1, u, fov, roll)` world space; `camD` desk-set space (`camO(group)` makes one for any set). `camW` lowers the look target by .16 on eye-level shots (`TY`) so the short figures sit above the caption band. `p` = camera pos, `t` = look-at, interpolated by `u`. Orbit points: `orb(center, r, angleDeg, h)`. Portrait frame: visible width is about 0.41 x distance at fov 40, so keep a pair within about +-1 m at 5.5 m. Never show characters from straight above (billboards).
- `U(lt, dur, ease)` with `eIO`, `eOut`, `eIn`, `eSine`; `sstep(a, b, x)`; `lerp`; `clamp`. Shake: `SH.a = 1.5 * Math.exp(-(t - hit) * 2.2)` on an impact.
- `dof(k)` 0..1 background blur (focus = camera-to-target distance).
- `reset(t)` runs before every shot: it hides all chars and optional sets and resets props. Every new set or prop must be reset there, then each shot shows only what it needs.
- `COVER` = the cover still (not on the timeline); `BENCH` = cast line-up for checking sprites (`node src/render.js bench out/bench.jpg`).

## Pacing the user liked (example)
28 shots in 58.7 s (about 2.1 s each), every shot moves (push-in, crane, whip), one setup per caption line. Mirrored pairs for the two sides (red left, blue right), symmetric one-point frames down the river, aerial shots with instanced crowds, one time-lapse shot (sky cycling while the bridge grows), a 0.9 s silent beat before the reveal, in-world text props (flip counter sign, toll sign, blueprints), and the ending returns to the opening prop. One 'sweep' per time jump.

## Self-drawn characters (tools/mkchars.py)
- Canvas 1080x1920 green, drawn at 3x and downsampled. Head blob centred (540, 600), R 205; costume from y 890 down (`BY0`), about 450 px tall after `YM` (the y squash, `YS = .6`); 4 views F/Q/S/B (`k` = width factor per view, `dx_view` = how far front details shift).
- Head = `ball()`: a hand-drawn blob, NOT a circle (wider than tall, flat top, narrower chin, seeded dents per character) with a thick ink edge that is heavier on the lower right. Never replace it with an ellipse.
- Ink line `LW = 15*K`. Details inside the costume use 8-9 px lines. Keep hats covering the top of the blob (brim near y 470).
- New character = one hat function + one costume function + a row in `CH`. Costume colours as hex, never green (the key colour).
- Rig (chars.js): `LEG .56, LL .31, AL .34`, limb tubes r .007-.008 (hair-thin), torso `drop .32` so the hem sits just below the hips. Do not thicken limbs or lengthen the costume: the user rejected tall figures, round heads and thick limbs.

## Commands
- `node src/render.js stills out/chk 1.0 5.5 9.8` → out/chk/t1.00.jpg ... (~5 s each). `bash tools/sheet.sh out/chk out/sheet_` → 8x2 contact sheets. `NOCAP=1` hides captions, `NOFACE=1` hides faces.
- `node src/render.js list` prints the shot ids and times.
- `node src/render.js video out/x.mp4 <startFrame> <endFrame>` renders a frame range (30 fps).
