# Local PC setup (Windows, DESKTOP-2H0OUSI, folder E:\Claude Animate)

The cloud session cannot use this PC yet: the Windows Claude app does not serve Remote Control folders to cloud sessions.
Until it does, a LOCAL Claude Code session on the PC does the Blender work and (optionally) GPU renders. Both sides share work through
the GitHub repo hight8015-eng/my-tiktok-ai, branch claude/skill-installation-kkpo2q.

## Paste this into Claude Code (Claude app → Code → Local → folder E:\Claude Animate)

```
Read projects/LOCAL_PC_SETUP.md and projects/BLENDER_TODO.md after cloning, then do this in order:
1. Clone https://github.com/hight8015-eng/my-tiktok-ai (branch claude/skill-installation-kkpo2q) into E:\Claude Animate\my-tiktok-ai.
2. Check/install (winget, ask me before each install): Git for Windows (Git Bash), Node.js LTS, Python 3.11+, ffmpeg, Blender (if missing).
   Then in the repo: npm i playwright@1.63.0 and npx playwright install chromium;
   pip install numpy scipy faster-whisper.
3. Blender bring-up: section 0 of projects/BLENDER_TODO.md (build_set.py on warehouse_test.json, fix until it runs, save .blend +
   preview PNG from cam_door, load the .glb in a pm test shot, before/after stills).
4. GPU render test: in a project folder run `GPU=1 node src/render.js stills out/gputest 1 5 10` from Git Bash and compare the time with
   the CPU run (no GPU env). Report both times.
5. Commit everything (no secrets, no big renders) and push to claude/skill-installation-kkpo2q. Write the results in projects/NOTES.md.
Then continue BLENDER_TODO.md sections 1-4 (assets, 6 ZERO CITY sets with story props, sign kit, VFX library), pushing after each set.
```

## What each side does
| Cloud session (this chat) | Local session on the PC |
|---|---|
| plans, storyboards, writes shots.js, system development, QA | Blender sets / props / VFX (BLENDER_TODO.md) |
| CPU renders (background, costs little session) | GPU renders when speed matters: `GPU=1 bash tools/make_ep.sh ...` in Git Bash |
| pulls the pushed .glb / VFX into the episode | pushes .glb (Draco, small) + previews; large files stay on E: |

## Notes
- render.js: `GPU=1` uses the graphics card (d3d11 on Windows). Without it, CPU SwiftShader (the cloud default).
- make_ep.sh / qa.py / storyboard.py are bash + python: run them in Git Bash on Windows.
- Keep files > 50 MB out of git. Big Blender caches stay in E:\Claude Animate\cache.
- Re-test the cloud link sometimes: after a Claude app update, tell the cloud chat "เช็ก Blender อีกครั้ง".
