# pm4 helper-1 report
Segments requested: 0, 14 (run in parallel). Both OK, frame counts verified (100 each).

- s_00000_00100.mp4 OK
- s_01400_01500.mp4 OK

## Time
Wall clock for both (parallel): 7m15s total. ~6-7 min per segment when 2 run concurrently (CPU time ~1m8s).

## Setup that worked
- Node v22.23.5, ffmpeg 6.1.1, python 3.13 (all preinstalled).
- `npm i playwright` pulled 1.67-era version wanting chromium build 1255; `npx playwright install --with-deps chromium` FAILED (download blocked by network policy).
- Fix: `npm i playwright@1.63.0` to match the preinstalled browser in /opt/pw-browsers (chromium-1243). No src edits.
- package.json/node_modules not committed.

## FAIL logs
none
