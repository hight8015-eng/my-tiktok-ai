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
_addS = add
SFXLIB = json.load(open(f'{W}/aud/sfx/sfx.json')) if os.path.exists(f'{W}/aud/sfx/sfx.json') else []
class Snd(np.ndarray):  # a library sound that remembers which file/category it came from (for the SFX rules below)
    pass
_last_cat = {}
def sfx(cat, i=None):
    """v4.33: i=None -> round robin (never the same variant twice in a row); a number picks a variant as before"""
    L_ = [e for e in SFXLIB if e['cat'] == cat]
    if not L_: raise KeyError(f'no sfx in category {cat!r}: ' + ' '.join(sorted({e["cat"] for e in SFXLIB})))
    if i is None: i = (_last_cat.get(cat, -1) + 1) % len(L_)
    _last_cat[cat] = i % len(L_); e = L_[i % len(L_)]
    a = rd_wav(f"{W}/aud/sfx/{e['file']}").view(Snd); a.meta = {'cat': cat, 'file': e['file']}; return a
# ---------- v4.33 SFX RULES (research: game-audio variation + film/animation sync practice) ----------
# 1 onset sync: leading silence is trimmed so the TRANSIENT lands on t (a few frames late/early breaks the illusion)
# 2 variation: every play gets a small random pitch (+-1.5 semitones) and gain (+-2 dB) -> no 'machine-gun' repeats
# 3 one thing at a time: a sound starting < .35 s after another is softened (-5 dB); < .12 s apart and quieter -> dropped
# 4 the same FILE never twice within 8 s (another variant of the category is used); a category is used <= 4x per episode
# 5 tiers: 'big' hits are rationed (<= 3 per episode) and get a pre-hit dip: beds + music drop ~6 dB for .35 s before
#   them (silence makes the hit land); 'mid'/'small' are scaled .75/.5
# 6 whoosh leads, hit lands: lead='whoosh' places a whoosh so its PEAK lands ~.04 s before t, then the hit on t
_rs_sfx = np.random.RandomState(11); SFXLOG = []; DIPS = []
def _onset(a):
    m = np.abs(a if a.ndim == 1 else a.max(0)); pk = m.max() + 1e-9; idx = np.argmax(m > pk * .1); return max(0, idx - int(.004 * SR))
def _peak(a):
    m = np.abs(a if a.ndim == 1 else a.max(0)); k = int(.02 * SR); e = np.convolve(m, np.ones(k) / k, 'same'); return int(np.argmax(e))
def _vary(a):
    r = 2 ** (_rs_sfx.uniform(-1.5, 1.5) / 12); n = int(a.shape[-1] / r); x = np.linspace(0, a.shape[-1] - 1, n)
    v = np.interp(x, np.arange(a.shape[-1]), a) if a.ndim == 1 else np.stack([np.interp(x, np.arange(a.shape[-1]), c) for c in a])
    return v * 10 ** (_rs_sfx.uniform(-2, 2) / 20)
MEME = {'mboom', 'mding', 'mwhoosh', 'mrise', 'mfall', 'mroll', 'mrumble', 'mvoice', 'voice_react', 'laugh', 'silly', 'horn', 'wobble', 'buzzer', 'gong_comic', 'kwing'}
QUIET = []   # v4.35 EPISODE block: QUIET += [(a, b)] for sad / tender beats -> meme sounds are refused there, other hits halved
def hit(cat, t, g=1.0, pan=0.0, tier='mid', lead=None, i=None):
    """the way to place a library sound: hit('mboom', 48.85, .8, tier='big', lead='whoosh')"""
    quiet = any(a_ <= t <= b_ for a_, b_ in QUIET)
    if cat in MEME and quiet: print(f'  [sfx] skip meme {cat} @ {t:.2f}: inside an emotional beat'); return
    if cat in MEME and sum(1 for x in SFXLOG if x[1] in MEME) >= 3: print(f'  [sfx] skip meme {cat} @ {t:.2f}: 3 meme sounds already (they wear out fast)'); return
    if quiet: g *= .5; tier = 'small'
    if tier == 'big' and sum(1 for x in SFXLOG if x[3] == 'big') >= 3: tier = 'mid'
    if sum(1 for x in SFXLOG if x[1] == cat) >= 4: print(f'  [sfx] skip {cat} @ {t:.2f}: category already used 4x'); return
    a = sfx(cat, i); tries = 0
    while any(x[2] == a.meta['file'] and abs(x[0] - t) < 8 for x in SFXLOG) and tries < 6: a = sfx(cat); tries += 1
    near = [x for x in SFXLOG if abs(x[0] - t) < .35]
    if any(abs(x[0] - t) < .12 and x[4] >= g for x in near): print(f'  [sfx] drop {cat} @ {t:.2f}: collides with {near[0][1]}'); return
    if near: g *= .56
    if lead == 'whoosh':
        w = sfx('whoosh'); w = _vary(np.asarray(w)[_onset(w):]); _addS(w, max(0, t - .04 - _peak(w) / SR), g * .45, -pan)
    if tier == 'big': DIPS.append(t)
    g *= {'big': 1.0, 'mid': .75, 'small': .5}[tier]
    x = _vary(np.asarray(a)[_onset(a):]); _addS(x, t, g, pan); SFXLOG.append((t, cat, a.meta['file'], tier, g))
def sfx_report():
    if not SFXLOG: return
    ts = sorted(x[0] for x in SFXLOG); from collections import Counter; c = Counter(x[1] for x in SFXLOG)
    gaps = np.diff(ts) if len(ts) > 1 else [0]
    m = sum(1 for x in SFXLOG if x[1] in MEME)
    print(f'  [sfx] meme sounds {m} (<= 3, only on comic / reveal beats)')
    print(f'  [sfx] {len(SFXLOG)} hits, {len(SFXLOG) / END * 10:.1f} per 10 s (aim 1.5-2.5; ~3-5 per 30 s), longest quiet gap {max(gaps):.1f} s, big {sum(1 for x in SFXLOG if x[3] == "big")}; per category {dict(c)}')
# ===== EPISODE 1/2: ambience: THE PUPPET MASTER ep1 (rainy neon city; truck engine; alley drips; silence when the power is used) =====
t = np.arange(N) / SR
rain = bp(rs.randn(N), 1500, 9000) * .9 + lp(rs.randn(N), 500) * 1.6; rainR = bp(rs.randn(N), 1500, 9000) * .9 + lp(rs.randn(N), 500) * 1.6
hum = np.sin(2 * np.pi * 55 * t) * .25 + np.sin(2 * np.pi * 110 * t) * .08 + lp(rs.randn(N), 180) * 2.2      # distant city hum
eng = (np.sin(2 * np.pi * 38 * t + 3 * np.sin(2 * np.pi * 2.1 * t)) * .7 + lp(rs.randn(N), 140) * 4) * (.8 + .2 * np.sin(2 * np.pi * 7 * t))   # truck engine
amb = np.ones(N) * .05; hum_g = np.ones(N) * .05; eng_g = np.zeros(N)
def seg(a, b, v, arr):
    i, j = int(a * SR), int(b * SR); arr[i:j] = v
seg(3.8, 11.47, .02, amb); seg(3.8, 11.0, .09, eng_g); seg(16.71, 17.55, .025, amb)      # inside the truck: rain muffled, engine
seg(38.06, 72.9, .035, amb); seg(38.06, 72.9, .02, hum_g)                                    # alley: lighter rain
seg(45.9, 53.9, .006, amb); seg(45.9, 53.9, .004, hum_g)                                     # the power: the world goes quiet
seg(67.0, 72.9, .02, amb)
amb = lp(amb, 3); hum_g = lp(hum_g, 3); eng_g = lp(eng_g, 2)
L += rain * amb + hum * hum_g + eng * eng_g; R += rainR * amb + hum * hum_g * .9 + eng * eng_g
# ===== EPISODE 2/2: SFX events + the series MOTIF (the planted thought: a glassy ting with a reversed tail) =====
def ting(f=1760, dur=1.4):
    t_ = np.arange(int(dur * SR)) / SR; return (np.sin(2 * np.pi * f * t_) * np.exp(-t_ / .5) + .4 * np.sin(2 * np.pi * f * 2.76 * t_) * np.exp(-t_ / .15)) * np.minimum(1, t_ / .002)
def heart(n=4, bpm=62):
    x = np.zeros(int((n * 60 / bpm + .6) * SR))
    for k in range(n):
        for d, g in ((0, 1), (.18, .6)): c = thump(52, .3, .15); i = int((k * 60 / bpm + d) * SR); x[i:i + len(c)] += c[:len(x) - i] * g
    return x
def swell(dur, f=73, g=.3):
    t_ = np.arange(int(dur * SR)) / SR; return (np.sin(2 * np.pi * f * t_) + .5 * np.sin(2 * np.pi * f * 1.5 * t_)) * np.sin(np.pi * t_ / dur) ** 2 * g
def crackle(dur, seed=0):
    r_ = np.random.RandomState(seed); x = bp(r_.randn(int(dur * SR)), 2000, 7000) * (r_.rand(int(dur * SR)) > .995) * 6 + bp(r_.randn(int(dur * SR)), 200, 900) * .4
    return x * np.minimum(1, np.arange(len(x)) / (.1 * SR)) * np.minimum(1, (len(x) - np.arange(len(x))) / (.3 * SR))
def thought(f=1320):  # the motif: reversed shimmer rising into a clean ting
    tg = ting(f, 1.6); rv = ting(f * 1.5, .9)[::-1] * .5; return np.concatenate([rv, tg])
BELLS = []
SFX = np.zeros((2, N)); L0, R0 = L.copy(), R.copy(); L[:] = 0; R[:] = 0
hit('hit_dramatic', 0.04, .7, tier='mid')                                                     # hook
add(fwip(.35, 300, 2600), .9, .3, -.3); add(crackle(1.6, 1), 1.0, .25, -.3)                    # the fire man's palm in the opening crane
add(thump(48, .6, .1), 2.62, .55)                                                            # "ยกเว้นผม"
add(reverb(ting(2600, .5), .8, .3, 2), 6.25, .12, .2)                                         # the metal tag
add(scrape(1.0), 12.3, .2); add(hiss(.7, .8), 12.75, .14); add(thump(90, .4, .3), 12.85, .5)  # air brakes, the truck stops
hit('riser', 14.0, .45, tier='small'); hit('hit_dramatic', 15.28, .9, tier='big'); add(hiss(.35, 1.4), 15.28, .1)   # ZERO CITY blazes on
hit('metal_hit', 16.75, .7); add(reverb(creak(.7, 260), 1.2, .3, 3), 16.8, .14)                # the rear doors
add(rumble(2.2, 40), 17.6, .4); add(scrape(1.6), 17.7, .16)                                     # the gate grinds open
add(steps(6, 2.0, 160), 17.9, .14)
for k in range(3): add(thump(900, .05, 1.0), 22.0 + k * .11, .16, .3)                          # knuckle cracks
hit('whoosh', 24.2, .6, -.2); add(crackle(1.9, 2), 24.35, .3, -.2)                              # the palm ignites
add(thump(70, .5, .4), 26.65, .6); add(creak(1.0, 180), 26.7, .18, .3); hit('rattle', 26.8, .35, tier='small')   # the car comes up
add(hiss(.4, .5), 29.75, .12)                                                                 # Aren's sad little puff
hit('laugh', 30.25, .35, -.4, tier='small')                                                   # a thug laughs behind him
hit('whoosh', 31.25, .45, tier='small')                                                       # time passes
add(steps(8, 2.6, 150), 32.7, .16); add(hiss(.8, .6), 35.0, .16); add(thump(60, .5, .2), 35.0, .4)   # the gang closes in; the flame dies
add(steps(6, 2.2, 170), 35.7, .12, -.3)
add(steps(6, 2.0, 170), 38.1, .14); add(steps(8, 2.4, 140), 39.0, .12, .4)                    # into the alley, followed
add(swell(2.6, 65, .3), 41.0, .4)                                                             # dread
add(thump(110, .3, .5), 44.95, .55); hit('punch', 44.97, .35, tier='small')                    # back hits the wall
BELLS.append((heart(3, 58), 45.9, .5, 0))                                                    # silence + heartbeat as he thinks
BELLS.append((thought(1320), 47.6 - .9, .55, 0)); hit('hit_dramatic', 47.62, .8, tier='big', lead='whoosh')   # the thought goes in (red eyes)
BELLS.append((reverb(ting(3300, 2.4), 2.4, .5, 9), 49.6, .12, 0))                             # the freeze: a thin ring in the air
add(steps(6, 2.3, 170), 53.0, .14, .2)                                                       # they walk away
BELLS.append((reverb(ting(990, 1.6), 1.6, .4, 4), 56.9, .2, 0))                               # the loose threads
BELLS.append((thought(1760), 60.25 - .9, .35, .2))                                            # the seed enters a head
add(swell(2.5, 82, .25), 64.2, .35)                                                          # the first smile
add(swell(3.4, 55, .4), 67.0, .5)                                                            # the dark end of the alley
add(thump(1400, .04, 1.0), 69.45, .4, .3); add(thump(900, .05, 1.0), 69.6, .3, .3)            # the hammer clicks back
add(hiss(1.2, 2.0) * np.linspace(1, .4, int(1.2 * SR)), 69.9, .05, .3)                        # laser hum
hit('hit_dramatic', 70.4, 1.0, tier='big')                                                    # the dot on his forehead
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
tt_ = np.arange(N) / SR; DIP = np.ones(N)   # v4.33 pre-hit dip: beds + music duck ~6 dB for .35 s before each 'big' hit
for d in DIPS: DIP *= 1 - .5 * np.clip((tt_ - (d - .45)) / .1, 0, 1) * np.clip((d + .08 - tt_) / .08, 0, 1)
BED *= DIP; sfx_report()
mix = SFX + BED + BELL; mix[0] += V; mix[1] += V
# v3: optional music bed (tools/music.py -> aud/music_bed.wav) for the (มีเพลง) version: ~12 dB under VO (rms), -6 dB more under speech, -4 dB under bells
MIXM = None
if os.path.exists(f'{W}/aud/music_bed.wav'):
    mb = rd_wav(f'{W}/aud/music_bed.wav').reshape(-1, 2).T; MUS = np.zeros((2, N)); k = min(mb.shape[1], N); MUS[:, :k] = mb[:, :k]
    be = lp(lp(np.abs(BELL).max(0), 4), 4); be = np.clip(be / (be.max() + 1e-9) * 3, 0, 1)
    MUS *= (vr * 10 ** (-12 / 20)) / max(rms(MUS[:, np.abs(MUS).max(0) > 1e-3]), 1e-9) * duck * (1 - .37 * be) * DIP
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
