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
# ===== EPISODE 1/2: ambience (the room hum, the maze: low wind + far drips, the finish: bright hum; silent beat) =====
t = np.arange(N) / SR
hum = (np.sin(2 * np.pi * 60 * t) * .5 + np.sin(2 * np.pi * 120 * t) * .25 + lp(rs.randn(N), 200) * 2) * .6
wind = bp(rs.randn(N), 150, 700) * (.5 + .5 * np.sin(2 * np.pi * t / 6.3)) * 1.4
humg = np.zeros(N); wg = np.zeros(N)
def seg(a, b, v, arr):
    i, j = int(a * SR), int(b * SR); arr[i:j] = v
seg(0, 21.15, .05, humg); seg(21.15, 66.3, .06, wg); seg(66.3, 85.7, .03, humg); seg(66.3, 85.7, .02, wg); seg(79.8, 80.7, .002, humg); seg(79.8, 80.7, .002, wg)
humg = lp(humg, 3); wg = lp(wg, 3)
L += hum * humg + wind * wg; R += hum * humg * .9 + wind[::-1] * wg
DR = np.zeros(N); r_d = np.random.RandomState(8)
for tt in np.arange(21.5, 66, 2.3):
    d = plip() * .6; i = int((tt + r_d.rand()) * SR); DR[i:i + len(d)] += d[:N - i]
L += DR * .02; R += np.roll(DR, 2000) * .02
# ===== EPISODE 2/2: SFX events + the story MOTIF (the announcement ding-dong) on its own bus =====
def swoosh(k):
    return rd_wav(f'{W}/aud/sw_{"8cfd" if k % 2 == 0 else "9c05"}.wav')
def ting(f=1760, dur=1.4):
    t_ = np.arange(int(dur * SR)) / SR; return (np.sin(2 * np.pi * f * t_) * np.exp(-t_ / .5) + .4 * np.sin(2 * np.pi * f * 2.76 * t_) * np.exp(-t_ / .15)) * np.minimum(1, t_ / .002)
def coins(n=4, seed=0, gap=.085):
    r_ = np.random.RandomState(seed); x = np.zeros(int((gap * n * 1.5 + .5) * SR))
    for k in range(n): tn_ = ting(2400 + r_.rand() * 1800, .35); i = int(k * gap * (.6 + r_.rand() * .8) * SR); x[i:i + len(tn_)] += tn_ * .6
    return x
def static(dur):
    n = int(dur * SR); g = (np.random.RandomState(2).rand(n // 400 + 1) > .4).repeat(400)[:n]; return bp(rs.randn(n), 800, 7000) * g * .5
def beep(f=880, d=.18):
    t_ = np.arange(int(d * SR)) / SR; return np.sign(np.sin(2 * np.pi * f * t_)) * .3 * np.minimum(1, (d - t_) / .02) * np.minimum(1, t_ / .005)
def growl(dur=1.2, f=55):
    t_ = np.arange(int(dur * SR)) / SR; am = .6 + .4 * np.sin(2 * np.pi * 23 * t_); return (lp(rs.randn(len(t_)), 400) * 3 * am + np.sin(2 * np.pi * f * t_) * .5) * np.sin(np.pi * t_ / dur) ** .5
def screech(dur=1.6):
    t_ = np.arange(int(dur * SR)) / SR; f = 900 + 500 * np.sin(2 * np.pi * 3 * t_) + 300 * t_; s_ = np.sin(2 * np.pi * np.cumsum(f) / SR) + .5 * bp(rs.randn(len(t_)), 1500, 4000)
    return s_ * np.sin(np.pi * t_ / dur) ** .4 * .4
def heart(n=6, rate=1.3):
    x = np.zeros(int((n / rate + .5) * SR))
    for k in range(n):
        for o, g in ((0, 1), (.18, .7)): s_ = thump(55, .25, .1) * g; i = int((k / rate + o) * SR); x[i:i + len(s_)] += s_[:len(x) - i]
    return x
def dingdong(f=880, minor=False):
    a_ = ting(f * (1.26 if not minor else 1.19), 1.2) * .6; b_ = ting(f, 1.6) * .6; x = np.zeros(len(a_) + int(.45 * SR)); x[:len(a_)] += a_; x[int(.45 * SR):int(.45 * SR) + len(b_)] += b_[:len(x) - int(.45 * SR)]; return x
BELLS = []
SFX = np.zeros((2, N)); L0, R0 = L.copy(), R.copy(); L[:] = 0; R[:] = 0
for i, tt in enumerate((5.6, 11.65, 42.85, 50.35, 57.85, 63.0, 76.45)):
    w_ = swoosh(i); add(w_, max(0, tt - min(.18, len(w_) / SR * .4)), .5)
add(reverb(creak(.8, 300), 1.0, .3, 1), .9, .12)                                                    # the cot
add(static(.9), 2.6, .25)                                                                           # screen static
add(reverb(coins(30, 1, .09), 1.2, .3, 2), 11.9, .3)                                                # money rain
add(ting(2637, .8), 14.7, .2)
add(scrape(1.1), 19.45, .5); add(thump(70, .4, .2), 20.5, .4)                                     # the door
add(heart(7, 1.25), 21.6, .3)
add(beep(660, .25), 27.3, .2); add(beep(660, .25), 27.8, .2)                                      # the warning
add(boom(2.0), 31.9, .35); add(reverb(growl(1.6, 50), 1.6, .4, 3), 32.4, .3)                      # "you'll be hunted"
add(steps(4, 1.6, 150), 33.7, .1)
add(ting(3136, .9), 37.48, .4); add(ting(2960, .5), 37.62, .25); add(ting(3000, .4), 37.72, .15)  # the coin hits the floor
add(reverb(steps(7, 2.4, 80), 2.0, .5, 4), 39.6, .35)                                               # strange steps far away
add(reverb(growl(1.4, 45), 1.6, .4, 5), 42.9, .35); add(steps(12, 7, 90), 43.0, .3); add(steps(10, 6, 190), 44.6, .25)   # the chase
add(steps(4, 4, 190), 46.8, .2); add(ting(2800, .6), 47.95, .15); add(ting(3300, .6), 48.4, .15)
for k in range(5): add(coins(6, 10 + k, .07), 50.4 + k * 1.0, .2, pan=(-.4 if k % 2 else .4))     # scooping
add(reverb(growl(1.5, 50), 1.6, .4, 6), 56.0, .25)
add(reverb(screech(1.8), 2.4, .5, 7), 57.9, .35); add(thump(80, .4, .2), 57.9, .4)                # the scream
add(coins(14, 20, .06), 61.4, .35)                                                                  # he drops them all
add(steps(16, 4.6, 200), 63.0, .25); add(reverb(growl(1.2, 50), 1.4, .4, 8), 63.6, .25)
for k, tt in enumerate((66.3, 66.9, 67.5)): add(beep(880, .2), tt, .25)
add(thump(120, .3, .5), 69.4, .5); add(reverb(coins(20, 30, .05), 1.2, .3, 9), 69.5, .3)        # the landing
add(reverb(coins(28, 31, .08), 1.2, .3, 10), 73.7, .3)
add(static(.6), 76.85, .3); add(boom(2.4), 78.0, .3)
add(beep(440, .5), 81.0, .2); add(beep(440, .35), 83.1, .3); add(beep(440, .35), 84.2, .3)        # the countdown
BELLS.append((reverb(dingdong(880), 1.4, .35, 1), 3.5, .3, 0))
BELLS.append((reverb(dingdong(880), 1.4, .35, 2), 27.15, .3, 0))
BELLS.append((reverb(dingdong(1046), 1.6, .4, 3), 70.45, .32, 0))
BELLS.append((reverb(dingdong(784, True), 1.8, .4, 4), 80.95, .32, 0))
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
