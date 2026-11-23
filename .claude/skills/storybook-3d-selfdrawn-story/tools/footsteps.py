# python3 tools/footsteps.py <steps.json> <out.wav> [end_s] [lib_wav] [gain_db]
# v7.5 footstep track from walkAlong heel strikes (node src/render.js steps out/steps.json): one hit per strike, exactly on the frame.
#  - grains are cut from a multi-step recording (default sfx_library/steps_m01.wav) and played round-robin (no machine-gun repeats)
#  - each hit: +-1.5 dB, +-3% pitch, sound 1 frame EARLY at most (attack lands on the contact frame), L/R feet alternate slightly in pan
#  - softer when the stride shrinks (k < 1: slowing down / stopping); a character with id '' or any id gets the same treatment
# Output is stereo 48 kHz; mix it into the SFX bus in audio.py (e.g. add rd_wav of it to L/R at -4 dB under the VO).
import json, sys, wave, numpy as np, os
SR = 48000
st = json.load(open(sys.argv[1])); out = sys.argv[2]
end = float(sys.argv[3]) if len(sys.argv) > 3 and sys.argv[3] else (max([e['t'] for e in st], default=0) + 1)
lib = sys.argv[4] if len(sys.argv) > 4 and sys.argv[4] else os.path.join(os.path.dirname(__file__), '../../../../projects/sfx_library/steps_m01.wav')
if not os.path.exists(lib): lib = os.path.join(os.environ.get('CLAUDE_PROJECT_DIR', '/home/user/my-tiktok-ai'), 'projects/sfx_library/steps_m01.wav')
gdb = float(sys.argv[5]) if len(sys.argv) > 5 else 0.0
with wave.open(lib) as w: sr = w.getframerate(); ch = w.getnchannels(); a = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(float).reshape(-1, ch).mean(1) / 32768
if sr != SR: a = np.interp(np.arange(int(len(a) * SR / sr)) * sr / SR, np.arange(len(a)), a)
h = SR // 100; env = np.array([np.abs(a[i:i + h]).max() for i in range(0, len(a) - h, h)])
on = [i for i in range(1, len(env) - 1) if env[i] > env.max() * .35 and env[i] >= env[i - 1] and env[i] > env[i + 1] and env[i] > env[max(0, i - 15):i].max()]
grains = []
for i in on:                                               # 10 ms before the peak .. 260 ms, short fades
    s0 = max(0, i * h - SR // 100); g = a[s0:s0 + int(.26 * SR)].copy(); f = int(.004 * SR); g[:f] *= np.linspace(0, 1, f); g[-int(.06 * SR):] *= np.linspace(1, 0, int(.06 * SR))
    grains.append(g / (np.abs(g).max() + 1e-9))
N = int(end * SR) + SR; L = np.zeros(N); R = np.zeros(N); rs = np.random.RandomState(11); last = -1
for n, e in enumerate(sorted(st, key=lambda e: e['t'])):
    j = rs.randint(len(grains))
    if j == last: j = (j + 1) % len(grains)
    last = j; g = grains[j]; p = 1 + rs.uniform(-.03, .03); g = np.interp(np.arange(0, len(g) - 1, p), np.arange(len(g)), g)
    v = 10 ** ((gdb - 6 + rs.uniform(-1.5, 1.5) - 6 * (1 - e.get('k', 1))) / 20); pan = .1 if e.get('foot') == 'R' else -.1
    s0 = int(e['t'] * SR) - SR // 100; s0 = max(0, s0); s1 = min(N, s0 + len(g))
    L[s0:s1] += g[:s1 - s0] * v * (1 - pan); R[s0:s1] += g[:s1 - s0] * v * (1 + pan)
pk = max(np.abs(L).max(), np.abs(R).max(), 1e-9); k = min(1, .89 / pk)
with wave.open(out, 'w') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.stack([L, R], 1) * k * 32767).astype(np.int16).tobytes())
print('footsteps', len(st), 'hits,', len(grains), 'grains ->', out)
