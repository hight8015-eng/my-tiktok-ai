import os
# python3 tools/audio.py [root=.] : synthesized SFX + ambience + motif bus under the VO -> aud/nomusic.wav (+ aud/music.wav when aud/music_bed.wav exists)
# STEMS=1 also writes aud/stem_*.wav (check each in LUFS before finishing). Edit only the two EPISODE blocks for a new story.
import numpy as np, wave, json, sys
W = sys.argv[1] if len(sys.argv) > 1 else '.'
SR = 48000
tm = json.load(open(f'{W}/src/timing.json')); END = tm['end']
N = int(END * SR) + SR
rs = np.random.RandomState(7)
L = np.zeros(N); R = np.zeros(N)

def rd_wav(p):
    with wave.open(p) as w: a = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(float) / 32768
    return a
def lp(x, fc):  # one-pole low-pass (run twice for 12 dB/oct)
    a = np.exp(-2 * np.pi * fc / SR); y = np.zeros_like(x); s = 0.0
    from scipy.signal import lfilter
    return lfilter([1 - a], [1, -a], lfilter([1 - a], [1, -a], x))
def bp(x, lo, hi):
    from scipy.signal import butter, sosfilt
    return sosfilt(butter(2, [lo, hi], 'bandpass', fs=SR, output='sos'), x)
def hp(x, fc):
    from scipy.signal import butter, sosfilt
    return sosfilt(butter(2, fc, 'highpass', fs=SR, output='sos'), x)
def env_ad(n, a, d):
    t = np.arange(n) / SR; return np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / d)
def add(sig, t, g=1.0, pan=0.0):
    i = int(t * SR); n = min(sig.shape[-1], N - i)  # v3 fix: len() of a stereo (2, n) array was 2 -> reverb'd sounds were silent
    if n <= 0: return
    gl, gr = g * np.sqrt((1 - pan) / 2), g * np.sqrt((1 + pan) / 2)
    if sig.ndim == 2: L[i:i + n] += sig[0, :n] * g; R[i:i + n] += sig[1, :n] * g
    else: L[i:i + n] += sig[:n] * gl * 1.414; R[i:i + n] += sig[:n] * gr * 1.414
def reverb(sig, secs=1.6, wet=.35, seed=1):
    r = np.random.RandomState(seed); n = int(secs * SR); t = np.arange(n) / SR
    irL = r.randn(n) * np.exp(-t / (secs / 5)); irR = r.randn(n) * np.exp(-t / (secs / 5)); irL = lp(irL, 5000); irR = lp(irR, 5000)
    irL /= np.sqrt((irL ** 2).sum()); irR /= np.sqrt((irR ** 2).sum())
    from scipy.signal import fftconvolve
    m = len(sig) + n - 1; out = np.zeros((2, m)); out[0, :len(sig)] += sig * (1 - wet); out[1, :len(sig)] += sig * (1 - wet)
    out[0] += fftconvolve(sig, irL)[:m] * wet; out[1] += fftconvolve(sig, irR)[:m] * wet; return out
# ---------- sounds ----------
def bell(f0=760, dur=4.5, bright=1.0):
    t = np.arange(int(dur * SR)) / SR; s = np.zeros_like(t)
    for k, (m, a, d) in enumerate([(0.5, .35, 2.6), (1.0, 1.0, 2.0), (1.19, .45, 1.4), (1.5, .35, 1.1), (2.0, .5 * bright, .9), (2.51, .28 * bright, .6), (3.0, .2 * bright, .45), (4.07, .12 * bright, .3)]):
        s += a * np.sin(2 * np.pi * f0 * m * t * (1 + .0006 * k) + k) * np.exp(-t / d)
    s += .6 * np.sin(2 * np.pi * f0 * 1.003 * t) * np.exp(-t / 1.8)  # beat
    strike = hp(rs.randn(len(t)), 2000) * np.exp(-t / .006) * .4
    return (s / 2.4 + strike) * np.minimum(1, t / .002)
def thump(f=120, dur=.35, click=.4):
    t = np.arange(int(dur * SR)) / SR; s = np.sin(2 * np.pi * f * t * (1 - .3 * t)) * np.exp(-t / .06) + click * bp(rs.randn(len(t)), 900, 4000) * np.exp(-t / .01); return s
def creak(dur=.9, f=420, rate=11):
    n = int(dur * SR); t = np.arange(n) / SR; s = np.zeros(n); ph = 0
    while ph < dur:
        i = int(ph * SR); m = min(400, n - i); s[i:i + m] += np.exp(-np.arange(m) / 60) * (rs.rand() * .6 + .4)
        ph += 1 / (rate * (1 + .5 * np.sin(ph * 4)) + rs.rand() * 2)
    out = bp(s, f * .6, f * 1.7) * np.sin(np.pi * np.clip(t / dur, 0, 1)) ** .7
    return out / (np.abs(out).max() + 1e-9)
def hiss(dur, bright=1.0, grain=1.0):
    n = int(dur * SR); x = hp(rs.randn(n), 2500 + 1500 * bright); g = lp(np.abs(rs.randn(n)) ** 2, 40 * grain); x *= .4 + g / (g.max() + 1e-9); t = np.arange(n) / SR
    return x * np.minimum(1, t / .2) * np.minimum(1, (dur - t) / .25) / 4
def fwip(dur=.28, lo=500, hi=3500):
    n = int(dur * SR); t = np.arange(n) / SR; x = rs.randn(n); u = t / dur; out = np.zeros(n)
    for k in range(8): a, b = int(k * n / 8), int((k + 1) * n / 8); fc = lo + (hi - lo) * (k / 8); out[a:b] = bp(x, fc * .7, fc * 1.4)[a:b]
    return out * np.sin(np.pi * u) ** 2 * .5
def steps(n, rate=2.2, f=180):
    out = np.zeros(int((n / rate + .4) * SR))
    for k in range(n): i = int(k / rate * SR); s = thump(f * (1 + .1 * rs.rand()), .2, .25) * (.6 + .4 * rs.rand()); out[i:i + len(s)] += s
    return out
def scratch(dur, f=3000, rate=7):
    n = int(dur * SR); t = np.arange(n) / SR; x = bp(rs.randn(n), f * .6, f * 1.6); g = (np.sin(2 * np.pi * rate * t + 2 * np.sin(t * 3)) > -.2).astype(float); g = lp(g, 60)
    return x * g * .5
def gull(f0=1500):
    d = .55; t = np.arange(int(d * SR)) / SR; f = f0 * (1 + .35 * np.sin(np.pi * t / d)) * (1 - .25 * t / d); ph = 2 * np.pi * np.cumsum(f) / SR
    s = (np.sin(ph) + .4 * np.sin(2 * ph) + .2 * np.sin(3 * ph)) * np.sin(np.pi * t / d) ** .6; return bp(s + .05 * rs.randn(len(t)), 600, 5000) * .5
def boom(dur=2.2):
    t = np.arange(int(dur * SR)) / SR; s = np.sin(2 * np.pi * (55 * t - 8 * t * t)) * np.exp(-t / .5) + lp(rs.randn(len(t)), 300) * np.exp(-t / .3) * 2.5; return s / 2
def crunch(dur=1.0):
    n = int(dur * SR); out = np.zeros(n)
    for k in range(14): i = int(rs.rand() ** 1.6 * .7 * SR); m = int(.05 * SR); b = bp(rs.randn(m), 200 + rs.rand() * 700, 1500 + rs.rand() * 1500) * np.exp(-np.arange(m) / (SR * .012)); out[i:i + m] += b * (1 - i / n)
    return out
def scrape(dur=1.1):
    n = int(dur * SR); t = np.arange(n) / SR; x = rs.randn(n); out = np.zeros(n); seg = 12
    for k in range(seg): a, b = int(k * n / seg), int((k + 1) * n / seg); fc = 420 - 220 * k / seg + 60 * rs.randn(); out[a:b] = bp(x, max(80, fc * .6), fc * 1.8)[a:b]
    j = lp(np.abs(rs.randn(n)), 30); return out * (j / j.max()) * np.minimum(1, t / .03) * np.exp(-t / .7) * 2
def splash(dur=1.2):
    t = np.arange(int(dur * SR)) / SR; return hp(rs.randn(len(t)), 1200) * np.exp(-t / .25) * np.minimum(1, t / .02) * .8
def rumble(dur, f=48):
    t = np.arange(int(dur * SR)) / SR; return (np.sin(2 * np.pi * f * t) * .6 + lp(rs.randn(len(t)), 90) * 3) * (t / dur) ** 1.5
def pluck(f=330):
    t = np.arange(int(.5 * SR)) / SR; return (np.sin(2 * np.pi * f * t) + .5 * np.sin(4 * np.pi * f * t)) * np.exp(-t / .09) * .6
def plip():
    t = np.arange(int(.15 * SR)) / SR; f = 900 + 1800 * t / .15; return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / .04) * .5
# ===== EPISODE 1/2: ambience (school yard, helicopter chop, classroom hum, rooftop wind) =====
t = np.arange(N) / SR
crowd = bp(rs.randn(N), 300, 2500) * (.6 + .4 * np.abs(np.sin(2 * np.pi * t / 2.3) * np.sin(2 * np.pi * t / 3.1)))
chop = lp(rs.randn(N), 180) * 3 * (.35 + .65 * (np.sin(2 * np.pi * 11.5 * t) > .55)) + bp(rs.randn(N), 900, 2500) * .2
room = lp(rs.randn(N), 400) * 1.5 + np.sin(2 * np.pi * 100 * t) * .05
wind = lp(rs.randn(N), 500) * 2.2 * (.6 + .4 * np.sin(2 * np.pi * t / 5.3))
gA, gH, gR, gW = [np.zeros(N) for _ in range(4)]
def seg(a, b, v, arr):
    i, j = int(a * SR), int(b * SR); arr[i:j] = v
seg(0, 4.2, .05, gA); seg(3.75, 37.95, .07, gH); seg(27.25, 37.95, .03, gH); seg(40.65, 67.15, .04, gR); seg(99.15, END, .04, gR); seg(67.15, 99.15, .05, gW)
gA, gH, gR, gW = [lp(g, 3) for g in (gA, gH, gR, gW)]
L += crowd * gA + chop * gH + room * gR + wind * gW; R += crowd[::-1] * gA + chop[::-1] * gH + room[::-1] * gR + wind[::-1] * gW
# ===== EPISODE 2/2: SFX events + the story MOTIF (the power-stone chime) on its own bus =====
def swoosh(k):
    return rd_wav(f'{W}/aud/sw_{"8cfd" if k % 2 == 0 else "9c05"}.wav')
def ting(f=1760, dur=1.4):
    t_ = np.arange(int(dur * SR)) / SR; return (np.sin(2 * np.pi * f * t_) * np.exp(-t_ / .5) + .4 * np.sin(2 * np.pi * f * 2.76 * t_) * np.exp(-t_ / .15)) * np.minimum(1, t_ / .002)
def chime(notes, step=.09, dur=1.6):
    x = np.zeros(int((step * len(notes) + dur) * SR))
    for k, f in enumerate(notes): tn_ = ting(f, dur); i = int(k * step * SR); x[i:i + len(tn_)] += tn_ * .5
    return x
def static(dur):
    n = int(dur * SR); g = (np.random.RandomState(2).rand(n // 400 + 1) > .4).repeat(400)[:n]; return bp(rs.randn(n), 800, 7000) * g * .5
def beep(f=880, d=.12):
    t_ = np.arange(int(d * SR)) / SR; return np.sin(2 * np.pi * f * t_) * .4 * np.minimum(1, (d - t_) / .02) * np.minimum(1, t_ / .005)
def heartbeat(n, rate=1.3):
    x = np.zeros(int((n / rate + .5) * SR))
    for k in range(n):
        for dt, g in ((0, 1), (.22, .7)): s = thump(55, .25, .05) * g; i = int((k / rate + dt) * SR); x[i:i + len(s)] += s
    return x
BELLS = []
SFX = np.zeros((2, N)); L0, R0 = L.copy(), R.copy(); L[:] = 0; R[:] = 0
for i, tt in enumerate((8.55, 21.1, 72.15, 92.4)):
    w_ = swoosh(i); add(w_, max(0, tt - min(.18, len(w_) / SR * .4)), .5)
add(steps(7, 2.2, 180), .1, .15)
add(reverb(fwip(1.6, 300, 2000), 1.5, .3, 1), 9.2, .3)                                                          # the desk falls
for k, tt in enumerate((10.95, 12.3, 12.55, 12.85, 13.1, 13.4, 13.65, 13.95, 14.2, 14.45)): add(crunch(1.0) * .8, tt, .35 - .015 * k, (k % 3 - 1) * .4); add(thump(90, .3, .6), tt, .35 - .015 * k, (k % 3 - 1) * .4)
add(fwip(.7, 300, 1500), 17.1, .25); add(fwip(.7, 300, 1500), 17.6, .22); add(fwip(.7, 300, 1500), 18.1, .22)    # rappelling
add(steps(14, 6, 200), 21.2, .22); add(steps(9, 6, 170), 24.4, .22); add(thump(100, .3, .5), 25.9, .3)      # running, ducks under
add(heartbeat(6, 1.4), 27.3, .4)
add(steps(6, 2.2, 150), 30.3, .35)                                                                           # footsteps stop
add(hiss(.35, 1.2) * 3, 38.6, .3); add(reverb(fwip(1.2, 2500, 200), 1.6, .4, 2), 39.0, .25)                # the needle, fading out
add(beep(660, .1), 55.4, .2); add(static(.5), 55.35, .25); add(beep(880), 56.0, .2); add(beep(1320, .2), 57.6, .25)   # the screen boots
add(reverb(beep(1046, .25), 1.0, .3, 3), 58.4, .25); add(reverb(beep(1568, .25), 1.0, .3, 4), 58.6, .25)
add(thump(160, .3, .5), 65.4, .2)                                                                            # the door
for k in range(5): add(reverb(boom(1.5), 2.0, .5, 5 + k) * .7, 74.6 + k * 1.43, .35)                       # the giant's footsteps
add(rumble(2.0, 40), 77.0, .3)
add(reverb(boom(2.5), 2.5, .5, 9), 92.65, .6); add(crunch(1.0), 92.7, .4); add(rumble(2.5, 36), 92.7, .4)  # explosion
add(steps(12, 5.5, 200), 95.7, .2); add(thump(160, .3, .5), 99.2, .25)
for k in range(3): add(reverb(boom(1.5), 2.0, .5, 20 + k) * .6, 102.4 + k * 1.43, .3)
BELLS.append((reverb(chime([1568, 1976, 2349, 3136], .1, 2.0), 2.0, .45, 1), 80.4, .28, -.1))   # the stones
BELLS.append((reverb(chime([2349, 3136, 3951, 4699], .05, 2.0), 2.0, .5, 2), 83.75, .3, 0))     # he touches one
BELLS.append((reverb(chime([1568, 2349, 3136], .12, 2.0), 2.0, .45, 3), 85.0, .26, 0))          # the window
SFX = np.stack([L.copy(), R.copy()]); BED = np.stack([L0, R0])
BELL = np.zeros((2, N)); L[:] = 0; R[:] = 0
for sig, tt, g, pn in BELLS: add(sig, tt, g, pn)
BELL = np.stack([L.copy(), R.copy()])
# ---------- VO + mix (speech first; generic, no need to edit) ----------
# VO is the lead; SFX bus sits ~13 dB under it and ducks a further ~6 dB while someone speaks; beds ~22 dB under
vo = rd_wav(f'{W}/aud/vo.wav'); n = min(len(vo), N); V = np.zeros(N); V[:n] = vo[:n]
def rms(x): return np.sqrt(np.mean(x ** 2) + 1e-12)
act = np.abs(V) > 0.02; vr = rms(V[act])
env = lp(lp(np.abs(V), 6), 6); env = env / (env.max() + 1e-9); duck = 1 - .5 * np.clip(env * 4, 0, 1)
sfx_r = rms(SFX[:, np.abs(SFX).max(0) > 1e-3]); bed_r = rms(BED)
SFX *= (vr * 10 ** (-13 / 20)) / max(sfx_r, 1e-9) * duck; BED *= (vr * 10 ** (-24 / 20)) / max(bed_r, 1e-9) * (.6 + .4 * duck)
bell_r = rms(BELL[:, np.abs(BELL).max(0) > 1e-3]); BELL *= (vr * 10 ** (-7 / 20)) / max(bell_r, 1e-9) * (1 - .4 * (1 - duck))
mix = SFX + BED + BELL; mix[0] += V; mix[1] += V
# v3: optional music bed (tools/music.py -> aud/music_bed.wav) for the (มีเพลง) version: ~12 dB under VO (rms), -6 dB more under speech, -4 dB under bells
MIXM = None
if os.path.exists(f'{W}/aud/music_bed.wav'):
    mb = rd_wav(f'{W}/aud/music_bed.wav').reshape(-1, 2).T; MUS = np.zeros((2, N)); k = min(mb.shape[1], N); MUS[:, :k] = mb[:, :k]
    be = lp(lp(np.abs(BELL).max(0), 4), 4); be = np.clip(be / (be.max() + 1e-9) * 3, 0, 1)
    MUS *= (vr * 10 ** (-12 / 20)) / max(rms(MUS[:, np.abs(MUS).max(0) > 1e-3]), 1e-9) * duck * (1 - .37 * be)
    MIXM = mix + MUS
if os.environ.get('STEMS'):
    for nm, a in (('vo', np.stack([V, V])), ('sfx', SFX), ('bed', BED), ('bell', BELL)):
        with wave.open(f'{W}/aud/stem_{nm}.wav', 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(a[:, :int(END * SR)].T, -1, 1) * 32767).astype(np.int16).tobytes())
mix = mix[:, :int(END * SR)]
peak = np.abs(mix).max(); mix = mix / max(1.0, peak / .95)
with wave.open(f'{W}/aud/nomusic.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(mix.T, -1, 1) * 32767).astype(np.int16).tobytes())
print('ok', mix.shape, 'peak', peak)
if MIXM is not None:
    if os.environ.get('STEMS'):
        with wave.open(f'{W}/aud/stem_music.wav', 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(MUS[:, :int(END * SR)].T, -1, 1) * 32767).astype(np.int16).tobytes())
    MIXM = MIXM[:, :int(END * SR)]; pk = np.abs(MIXM).max(); MIXM = MIXM / max(1.0, pk / .95)
    with wave.open(f'{W}/aud/music.wav', 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(MIXM.T, -1, 1) * 32767).astype(np.int16).tobytes())
    print('music mix ok, peak', pk)
# build 72pyjp3bmk
