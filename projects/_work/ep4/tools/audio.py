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
# ===== EPISODE 1/2: ambience (classroom hum, siren, city wind, basement) =====
t = np.arange(N) / SR
room = lp(rs.randn(N), 400) * 1.5 + np.sin(2 * np.pi * 100 * t) * .05
wind = lp(rs.randn(N), 500) * 2.2 * (.6 + .4 * np.sin(2 * np.pi * t / 5.3))
sir = np.sin(2 * np.pi * np.cumsum(650 + 250 * np.sin(2 * np.pi * .45 * t)) / SR) * .6
gR, gW, gS = [np.zeros(N) for _ in range(3)]
def seg(a, b, v, arr):
    i, j = int(a * SR), int(b * SR); arr[i:j] = v
seg(0, 16.95, .04, gR); seg(38.9, 41.0, .04, gR); seg(48.8, 55.8, .04, gR); seg(59.15, 64.85, .03, gR); seg(16.95, 38.9, .05, gW); seg(41.0, 48.8, .05, gW); seg(55.8, 59.15, .05, gW); seg(64.85, END, .05, gW)
seg(6.25, 59.15, .025, gS); seg(6.25, 15.0, .05, gS)
gR, gW, gS = [lp(g, 3) for g in (gR, gW, gS)]
L += room * gR + wind * gW + sir * gS; R += room[::-1] * gR + wind[::-1] * gW + sir * gS * .9
# ===== EPISODE 2/2: SFX events + the story MOTIF on its own bus =====
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
def roar(dur=2.0):
    t_ = np.arange(int(dur * SR)) / SR; f = 70 + 30 * np.sin(2 * np.pi * 3 * t_); s = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * .3 + lp(rs.randn(len(t_)), 600) * 1.5; return lp(s, 900) * np.minimum(1, t_ / .2) * np.minimum(1, (dur - t_) / .5)
BELLS = []
SFX = np.zeros((2, N)); L0, R0 = L.copy(), R.copy(); L[:] = 0; R[:] = 0
for i, tt in enumerate((28.45, 45.6, 55.8)):
    w_ = swoosh(i); add(w_, max(0, tt - min(.18, len(w_) / SR * .4)), .5)
add(reverb(rumble(3.0, 36), 2.0, .4, 1), 3.9, .5); add(crunch(1.0), 4.6, .2)                                     # the city shakes
add(static(.5), 6.3, .2); add(beep(660, .3), 6.9, .3); add(beep(660, .3), 7.5, .3); add(beep(660, .3), 9.7, .3)   # warning
for k in range(4): add(reverb(boom(1.5), 2.0, .5, 2 + k) * .6, 17.2 + k * 1.43, .3)                            # footsteps
add(reverb(roar(2.0), 2.0, .5, 7), 20.6, .35)
for k in range(4): add(reverb(boom(1.5), 2.0, .5, 8 + k) * .6, 22.4 + k * 1.2, .3)
add(reverb(boom(2.5), 2.5, .5, 13), 29.6, .55); add(rumble(4.0, 32), 29.5, .55); add(crunch(1.0), 30.0, .4); add(crunch(1.0), 31.0, .35)   # tower 15 falls
add(steps(12, 6, 210), 33.3, .18); add(reverb(roar(1.6), 2.0, .5, 14), 36.0, .3)
add(reverb(chime([2349, 3136], .1, 1.2), 1.4, .5, 15), 41.4, .2); add(reverb(fwip(.6, 400, 4000), 1.0, .4, 16), 44.0, .3); add(reverb(roar(1.2), 1.6, .5, 17), 45.8, .3)
add(thump(90, .5, .8), 54.1, .6); add(crunch(1.0), 54.15, .45); add(reverb(boom(1.0), 1.5, .4, 18), 54.2, .3)      # the desk crashes
add(reverb(roar(2.0), 2.0, .5, 19), 56.2, .4)
add(steps(14, 6, 200), 59.3, .2); add(thump(1500, .05, 1.0), 63.35, .4); add(reverb(fwip(.5, 2000, 200), .8, .3, 20), 63.4, .25)   # lights off
for k in range(3): add(reverb(boom(1.5), 2.0, .5, 21 + k) * .7, 64.9 + k * 1.43, .4)
add(steps(8, 2.2, 170), 66.4, .12)
add(beep(1046, .2), 78.7, .2); add(beep(1568, .25), 78.9, .2)
for k in range(3): add(reverb(boom(1.5), 2.0, .5, 30 + k) * .4, 84.0 + k * 1.6, .25)
BELLS.append((reverb(chime([1568, 1319, 1047, 784], .14, 2.2), 2.4, .5, 1), 70.8, .3, 0))   # the black stone
BELLS.append((reverb(chime([1047, 988, 784, 740], .1, 2.0), 2.2, .5, 2), 78.9, .26, 0))
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
