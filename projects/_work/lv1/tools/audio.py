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
# v4 recorded SFX library (aud/sfx, index aud/sfx/sfx.json): sfx('whoosh'), sfx('shine'), sfx('hit_dramatic', 1) ...
# categories: whoosh riser wobble hit_dramatic drumroll crash bang rattle noise bell chime buzzer shine click whistle laugh voice_hum voice_react scream_long
#             punch explosion metal_hit gong_comic shimmer harp kwing horn silly scream applause
SFXLIB = json.load(open(f'{W}/aud/sfx/sfx.json')) if os.path.exists(f'{W}/aud/sfx/sfx.json') else []
def sfx(cat, i=0):
    L_ = [e for e in SFXLIB if e['cat'] == cat]
    if not L_: raise KeyError(f'no sfx in category {cat!r}: ' + ' '.join(sorted({e["cat"] for e in SFXLIB})))
    return rd_wav(f"{W}/aud/sfx/{L_[i % len(L_)]['file']}")
# ===== EPISODE 1/2: ambience: THE LAST VILLAIN ตอน 1 =====
t = np.arange(N) / SR
room = lp(rs.randn(N), 300) * 2.0                                      # cathedral room tone
wind = bp(rs.randn(N), 300, 1100) * (.5 + .5 * np.sin(2 * np.pi * t / 5.3)) * 1.2
fire = bp(rs.randn(N), 800, 4000) * (rs.rand(N) > .9985) * 8 + lp(rs.randn(N), 400) * 2.5   # crackle + roar
crick = np.zeros(N)
for k in range(int(N / SR * 3)):
    i0 = int((k / 3 + rs.rand() * .1) * SR); tt_ = np.arange(int(.06 * SR)) / SR; c = np.sin(2 * np.pi * 4300 * tt_) * np.sin(np.pi * tt_ / .06) * (.5 + .5 * np.sin(2 * np.pi * 30 * tt_))
    crick[i0:i0 + len(c)] += c[:max(0, N - i0)]
drone = np.sin(2 * np.pi * 37 * t) * .6 + lp(rs.randn(N), 90) * 3
A = {n: np.zeros(N) for n in ('room', 'wind', 'fire', 'crick', 'drone')}
SP = 1.12  # v4.24 the clip plays SP x faster: story times below are in the original (unsped) seconds
def seg(a, b, v, arr):
    i, j = int(a / SP * SR), int(b / SP * SR); arr[i:j] = v
for a, b in [(0, 5.25), (46.2, 58.5)]: seg(a, b, .05, A['room'])
for a, b in [(5.25, 16.95), (30.7, 46.2)]: seg(a, b, .03, A['wind'])
seg(16.95, 22.35, .06, A['fire'])
for a, b in [(22.35, 30.7), (63.0, 65.75)]: seg(a, b, .02, A['crick'])
seg(65.75, END, .006, A['crick']); seg(58.5, 63.0, .07, A['drone'])
for k in A: A[k] = lp(A[k], 3)
amb = room * A['room'] + wind * A['wind'] + fire * A['fire'] + crick * A['crick'] + drone * A['drone']
L += amb; R += amb * .95
# ===== EPISODE 2/2: SFX events =====
_add0 = add
def add(sig, t, g=1.0, pan=0.0): return _add0(sig, t / SP, g, pan)
BELLS = []
SFX = np.zeros((2, N)); L0, R0 = L.copy(), R.copy(); L[:] = 0; R[:] = 0
_addS = add; _ons = []
def add(sig, t, g=1.0, pan=0.0):   # v4.29 SFX guard: a hit landing within .35 s of another is softened, so effects never pile up
    if any(abs(t - u) < .35 for u in _ons): g *= .55
    _ons.append(t); return _addS(sig, t, g, pan)
add(sfx('bell'), .15, .3); add(sfx('riser'), 4.6, .35)                                   # engagement bell, into the past
add(sfx('hit_dramatic', 0), 11.2, .4)                                                        # the King of Sin, eyes ignite
add(sfx('whoosh', 3), 13.1, .55); add(sfx('explosion'), 13.3, .4)                             # the flick
add(sfx('noise', 0), 14.6, .25)                                                              # the army turns to dust
add(sfx('explosion'), 17.0, .28, -.4)                                                        # burning cities
add(sfx('click'), 19.0, .2)                                                                  # the wanted poster
add(sfx('chime', 0), 25.0, .25); add(sfx('harp', 0), 28.4, .3)                                # Elena, love
add(sfx('whoosh', 1), 30.6, .35); add(sfx('shine'), 31.9, .28)                                # the hero of light
add(steps(14, 7, 170), 34.1, .25)                                                            # the charge
add(sfx('whoosh', 4), 35.9, .5); add(sfx('metal_hit'), 36.05, .55)                            # the blow
add(sfx('shimmer', 1), 45.0, .28); add(sfx('bell'), 46.4, .3)                                 # white-out, 100 years later
add(sfx('hit_dramatic', 1), 54.85, .35); add(sfx('riser'), 55.9, .28)                         # the trap
add(rumble(4.0, 40), 58.5, .45); add(sfx('mboom', 1), 61.45, .5)                              # the demon god, the eye opens
add(sfx('whoosh', 2), 66.6, .4)                                                              # he wakes
add(sfx('kwing'), 69.9, .3); add(rumble(3.4, 38), 71.1, .35)                                  # red eyes, he remembers
SFX = np.stack([L.copy(), R.copy()]); BED = np.stack([L0, R0])
BELL = np.zeros((2, N)); L[:] = 0; R[:] = 0
for sig, tt, g, pn in BELLS: add(sig, tt, g, pn)
BELL = np.stack([L.copy(), R.copy()])
# ---------- VO + mix (speech first; generic, no need to edit) ----------
# VO is the lead; SFX bus sits ~13 dB under it and ducks a further ~6 dB while someone speaks; beds ~22 dB under
vo = rd_wav(f'{W}/aud/vo.wav'); n = min(len(vo), N); V = np.zeros(N); V[:n] = vo[:n]
def rms(x): return np.sqrt(np.mean(x ** 2) + 1e-12)
act = np.abs(V) > 0.02; vr = rms(V[act])
env = lp(lp(np.abs(V), 6), 6); env = env / (env.max() + 1e-9); duck = 1 - .6 * np.clip(env * 4, 0, 1)
sfx_r = rms(SFX[:, np.abs(SFX).max(0) > 1e-3]); bed_r = rms(BED)
SFX *= (vr * 10 ** (-16 / 20)) / max(sfx_r, 1e-9) * duck; BED *= (vr * 10 ** (-24 / 20)) / max(bed_r, 1e-9) * (.6 + .4 * duck)
bell_r = rms(BELL[:, np.abs(BELL).max(0) > 1e-3]) if (np.abs(BELL).max() > 1e-3) else 1.0; BELL *= (vr * 10 ** (-7 / 20)) / max(bell_r, 1e-9) * (1 - .4 * (1 - duck))
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
