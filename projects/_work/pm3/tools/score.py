# score.py (v6.9): music scoring kit for the story clips. Pure numpy/scipy synthesis (no samples), deterministic.
#   from score import *            (put tools/ on sys.path)
#   S = Score(dur)                 # stereo timeline at 48 kHz
#   bpm, off = beatfit([3.2, 7.9, 12.6], 80, 140)    # tempo so the story's hit points land ON beats
#   S.cue('tension_pulse', t0=0, dur=12, bpm=bpm, key='D', k=.8)   # mood cue, cut to length with a proper ending
#   S.sting('hit_boom', 12.6)      # stinger exactly on the hit point
#   S.duck(voice_env)              # dip under the voice; S.write('aud/music_bed.wav')
#   snap(t, bpm, off)              # move a MUSICAL sfx (whoosh into a hit, riser end) onto the beat grid (<= 60 ms)
# Scoring rules (film/TV practice: spotting, hit points, Knudson tempo maths, ducking) are in SKILL.md 'Music scoring'.
import numpy as np, wave
from scipy.signal import butter, sosfilt, fftconvolve
SR = 48000
NOTE = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11}
nf = lambda m: 440 * 2 ** ((m - 69) / 12)
tt = lambda d: np.arange(max(1, int(d * SR))) / SR
def lpf(x, f, o=2): return sosfilt(butter(o, min(f, SR / 2 - 100), 'low', fs=SR, output='sos'), x)
def hpf(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def bpf(x, lo, hi): return sosfilt(butter(2, [lo, hi], 'band', fs=SR, output='sos'), x)
def env(d, a=.01, r=.1, s=1.0):
    t = tt(d); return np.minimum(1, t / max(a, 1e-4)) * np.clip((d - t) / max(r, 1e-4), 0, 1) * s
def adsr(d, a, dc, s, r):
    t = tt(d); e = np.where(t < a, t / max(a, 1e-4), s + (1 - s) * np.exp(-(t - a) / max(dc, 1e-4))); return e * np.clip((d - t) / max(r, 1e-4), 0, 1)
def saw(f, t, ph=0): return 2 * ((f * t + ph) % 1) - 1
def sqr(f, t, w=.5): return np.where((f * t) % 1 < w, 1.0, -1.0)
RS = np.random.RandomState(7)
def noise(d): return RS.randn(len(tt(d)))

# ---------------- instruments (mono arrays) ----------------
def pad(ms, d, cut=1200, a=1.0, r=1.2):
    t = tt(d); s = sum(sum(saw(nf(m) * (1 + dt), t, RS.rand()) for dt in (-.006, 0, .007)) for m in ms) / (3 * len(ms))
    return lpf(s, cut) * env(d, a, r)
def strings(ms, d, a=.6, r=.8, bright=2200, vib=.004):
    t = tt(d); v = 1 + vib * np.sin(2 * np.pi * 5.2 * t) * np.minimum(1, t / .8)
    s = sum(sum(saw(nf(m) * (1 + dt) * v, t, RS.rand()) for dt in (-.009, -.003, .004, .01)) for m in ms) / (4 * len(ms))
    return lpf(hpf(s, 120), bright) * env(d, a, r)
def stacc(m, d=.18, bright=2600):  # staccato strings / spiccato
    t = tt(d); s = sum(saw(nf(m) * (1 + dt), t) for dt in (-.006, 0, .007)) / 3; return lpf(s, bright) * adsr(d, .008, .05, .3, .06)
def choir(ms, d, a=1.2, r=1.2, vowel='ah'):
    F = {'ah': [(700, 1.0), (1220, .5), (2600, .25)], 'oo': [(300, 1.0), (870, .4), (2240, .15)]}[vowel]
    t = tt(d); v = 1 + .005 * np.sin(2 * np.pi * 4.6 * t); src = sum(sum(saw(nf(m) * (1 + dt) * v, t, RS.rand()) for dt in (-.008, 0, .009)) for m in ms) / (3 * len(ms))
    return sum(bpf(src, f * .85, f * 1.15) * g for f, g in F) * 2.2 * env(d, a, r)
def piano(m, d=2.4, vel=1.0):
    t = tt(d); f = nf(m); s = sum(np.sin(2 * np.pi * f * k * (1 + .0004 * k * k) * t) * np.exp(-t * (1.1 + k * .8)) / k ** 1.2 for k in range(1, 7))
    return s * np.minimum(1, t / .003) * vel * env(d, .003, .08)
def keys(m, d=1.0):  # electric piano (rhodes-like FM)
    t = tt(d); f = nf(m); return np.sin(2 * np.pi * f * t + 1.6 * np.exp(-t / .25) * np.sin(2 * np.pi * f * t)) * adsr(d, .004, .5, .35, .2)
def bell(m, d=2.5):
    t = tt(d); f = nf(m); return np.sin(2 * np.pi * f * t + 3 * np.exp(-t / .6) * np.sin(2 * np.pi * f * 3.5 * t)) * np.exp(-t / .9) * np.minimum(1, t / .002)
def musicbox(m, d=1.6): t = tt(d); f = nf(m); return (np.sin(2 * np.pi * f * t) + .3 * np.sin(2 * np.pi * f * 4.02 * t) * np.exp(-t / .1)) * np.exp(-t / .5) * np.minimum(1, t / .002)
def pluck(m, d=1.2, damp=.996, bright=.5):  # Karplus-Strong
    f = nf(m); P = max(2, int(SR / f)); n = len(tt(d)); buf = lpf(RS.randn(P), 2000 + 8000 * bright); out = np.zeros(n)
    for i in range(0, n, P):
        seg = buf[:min(P, n - i)]; out[i:i + len(seg)] = seg; buf = damp * .5 * (buf + np.roll(buf, 1))
    return out * env(d, .001, .05)
def pizz(m, d=.5): return lpf(pluck(m, d, .985, .2), 1800) * 1.4
def bass(m, d=.45, cut=600): t = tt(d); f = nf(m); s = np.sin(2 * np.pi * f * t) + .4 * saw(f, t); return lpf(s, cut) * adsr(d, .005, .2, .6, .05)
def sub808(m, d=.8, glide=0):
    t = tt(d); f = nf(m) * (1 + glide * np.exp(-t / .05)); ph = 2 * np.pi * np.cumsum(f) / SR; return np.tanh(1.6 * np.sin(ph)) * np.exp(-t / (d * .6)) * env(d, .002, .05)
def brass(ms, d, a=.08, bright=1600):
    t = tt(d); s = sum(sum(saw(nf(m) * (1 + dt), t) for dt in (-.005, .005)) for m in ms) / (2 * len(ms))
    w = np.minimum(1, t / .15); y = lpf(s, bright) * (1 - w) + lpf(s, bright * 2.5) * w
    return y * env(d, a, .25)
def braam(m, d=3.0):  # the trailer 'BWAAM': low brass cluster + growl, slow filter open
    t = tt(d); s = sum(saw(nf(mm) * (1 + .003 * np.sin(2 * np.pi * 30 * t)), t) for mm in (m, m + 7, m + 12, m - 12)) / 4
    w = np.exp(-t / .8); return np.tanh(2 * (lpf(s, 1800) * w + lpf(s, 300) * (1 - w))) * env(d, .03, 1.2)
def drone(m, d, grit=.3): t = tt(d); s = np.sin(2 * np.pi * nf(m) * t) + .5 * np.sin(2 * np.pi * nf(m + 7) * t + 1) + grit * lpf(noise(d), 150) * 4; return s * env(d, 1.5, 1.5)
def kick(d=.45): t = tt(d); return np.sin(2 * np.pi * (45 * t + 110 * .04 * (1 - np.exp(-t / .04)))) * np.exp(-t / .16) + .3 * hpf(noise(d), 3000) * np.exp(-t / .004)
def snare(d=.3): t = tt(d); return .5 * np.sin(2 * np.pi * 190 * t) * np.exp(-t / .05) + bpf(noise(d), 1500, 8000) * np.exp(-t / .09)
def clap(d=.3): t = tt(d); e = sum(np.exp(-np.maximum(0, t - k * .011) / .01) * (t >= k * .011) for k in range(3)) + .5 * np.exp(-t / .12); return bpf(noise(d), 900, 4000) * e
def hat(open_=False, d=None): d = d or (.35 if open_ else .06); t = tt(d); return hpf(noise(d), 7000) * np.exp(-t / (.12 if open_ else .015))
def shaker(d=.09): t = tt(d); return hpf(noise(d), 5000) * np.sin(np.pi * np.minimum(1, t / d)) * .6
def taiko(d=1.4): t = tt(d); return np.sin(2 * np.pi * (60 * t + 80 * .06 * (1 - np.exp(-t / .06)))) * np.exp(-t / .45) + .5 * lpf(noise(d), 400) * np.exp(-t / .08)
def tom(m=45, d=.6): t = tt(d); f = nf(m); return np.sin(2 * np.pi * (f * t + f * .5 * .05 * (1 - np.exp(-t / .05)))) * np.exp(-t / .25)
def wood(d=.12): t = tt(d); return np.sin(2 * np.pi * 900 * t) * np.exp(-t / .02) + .3 * bpf(noise(d), 1500, 3000) * np.exp(-t / .01)
def tick(d=.06): t = tt(d); return hpf(noise(d), 6000) * np.exp(-t / .012)
def heartbeat(d=.7): t = tt(d); b = lambda o: np.sin(2 * np.pi * 50 * (t - o)) * np.exp(-np.maximum(0, t - o) / .07) * (t >= o); return lpf(b(0) + .7 * b(.22), 200) * 3
def riser(d=4.0):  # noise + pitch sweep that ENDS at t = d (place its end on the hit point)
    t = tt(d); u = t / d; ph = 2 * np.pi * np.cumsum(200 + 1800 * u ** 2) / SR
    return (bpf(noise(d), 800, 9000) * .5 + .4 * np.sin(ph)) * u ** 2.2 * np.minimum(1, (d - t) / .01 + 0)
def reverse_cym(d=2.0): t = tt(d); return hpf(noise(d), 4000) * (t / d) ** 3
def subdrop(d=2.0): t = tt(d); return np.sin(2 * np.pi * np.cumsum(30 + 60 * np.exp(-t / .35)) / SR) * np.exp(-t / .9)
def boom(d=3.0): t = tt(d); return np.tanh(3 * (np.sin(2 * np.pi * (35 * t + 90 * .08 * (1 - np.exp(-t / .08)))) * np.exp(-t / .9))) + .4 * lpf(noise(d), 500) * np.exp(-t / .25)
def shimmer(m, d=2.5): return sum(bell(m + k, d) * .3 for k in (0, 7, 12, 19, 24))

# ---------------- keys / chords ----------------
def scale(key='D', minor=True): r = 48 + NOTE[key]; return r, ([0, 2, 3, 5, 7, 8, 10] if minor else [0, 2, 4, 5, 7, 9, 11])
def chord(key, deg, minor=True, oct=0, n=3):  # diatonic triad/7th on scale degree (0-based)
    r, sc = scale(key, minor); return [r + 12 * oct + sc[(deg + 2 * i) % 7] + 12 * ((deg + 2 * i) // 7) for i in range(n)]

# ---------------- timeline ----------------
class Score:
    def __init__(self, dur): self.N = int(dur * SR) + SR; self.L = np.zeros(self.N); self.R = np.zeros(self.N); self.dur = dur
    def put(self, t, x, g=1.0, pan=0.0):
        i = int(round(t * SR)); x = np.asarray(x)
        if i < 0: x = x[-i:]; i = 0
        n = min(len(x), self.N - i)
        if n <= 0: return
        self.L[i:i + n] += x[:n] * g * np.sqrt((1 - pan) / 2) * 1.414; self.R[i:i + n] += x[:n] * g * np.sqrt((1 + pan) / 2) * 1.414
    def cue(self, name, t0, dur, bpm=None, key='D', k=1.0, **o):
        c = CUES[name]; bpm = bpm or c['bpm']; sub = Score(dur + 3); c['fn'](sub, dur, bpm, key, k, o)
        e = np.ones(sub.N); fo = int(o.get('fade', c.get('fade', .6)) * SR); a = int(o.get('fadein', c.get('fadein', .05)) * SR); end = int(dur * SR)
        if a > 0: e[:a] = np.linspace(0, 1, a)
        if not o.get('ring'): e[max(0, end - fo):end] *= np.linspace(1, 0, min(fo, end)); e[end:] = 0   # ring=True lets the last hit ring out
        self.put(t0, sub.L * e * c.get('g', 1) * k, 1, -1); self.put(t0, sub.R * e * c.get('g', 1) * k, 1, 1)
    def sting(self, name, t, g=1.0, key='D'): STINGS[name](self, t, g, key)
    def duck(self, venv, fps=30, depth=.45, att=.06, rel=.35):
        """venv: voice envelope per frame (timing.json env, 0..1). Dips music by `depth` while the voice speaks."""
        v = np.repeat(np.asarray(venv, float), SR // fps)[:self.N]; v = np.pad(v, (0, self.N - len(v))); tgt = 1 - depth * np.clip(v * 2.5, 0, 1)
        g = np.empty_like(tgt); cur = 1.0; a = 1 - np.exp(-1 / (att * SR)); r = 1 - np.exp(-1 / (rel * SR))
        for i in range(0, len(tgt), 64): x = tgt[i]; cur += (x - cur) * (a if x < cur else r) * 64; cur = min(1, max(0, cur)); g[i:i + 64] = cur
        self.L *= g; self.R *= g
    def voice_eq(self):  # carve 1-4 kHz a little so the narration stays clear
        for ch in ('L', 'R'): x = getattr(self, ch); setattr(self, ch, x - .35 * bpf(x, 1000, 4000))
    def mix(self, rev=.22, end=None):
        n = int((end or self.dur) * SR); ir = np.exp(-tt(2.2) / .5) * RS.randn(len(tt(2.2))); ir /= np.sqrt((ir ** 2).sum())
        L = self.L + fftconvolve(self.L, ir)[:self.N] * rev; R = self.R + fftconvolve(self.R, ir[::-1].copy())[:self.N] * rev
        m = np.stack([L, R])[:, :n]; pk = np.abs(m).max(); return m / pk * .8 if pk > 0 else m
    def write(self, path, rev=.22, end=None):
        m = self.mix(rev, end)
        with wave.open(path, 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((m.T * 32767).astype(np.int16).tobytes())

# ---------------- sync maths ----------------
def beatfit(hits, lo=70, hi=150, sub=2, tol=.034):
    """Tempo + offset so every hit point lands on a beat (or 1/sub of a beat). Returns (bpm, offset). Knudson-style search."""
    best = (1e9, lo, 0)
    for bpm in np.arange(lo, hi + .01, .25):
        b = 60 / bpm / sub
        for off in np.linspace(0, b, 24, endpoint=False):
            err = [abs(((h - off) / b) - round((h - off) / b)) * b for h in hits]; e = max(err) + .2 * np.mean(err)
            if e < best[0]: best = (e, bpm, off)
    e, bpm, off = best; return round(float(bpm), 2), round(float(off), 4)
def grid(bpm, off, t0, t1, sub=1): b = 60 / bpm / sub; n0 = int(np.ceil((t0 - off) / b)); return [off + i * b for i in range(n0, int((t1 - off) / b) + 1)]
def snap(t, bpm, off, sub=2, tol=.06):
    """Move a musical SFX onto the beat grid if it is within tol (s); never move dialogue-synced or physical sounds."""
    b = 60 / bpm / sub; g = off + round((t - off) / b) * b; return g if abs(g - t) <= tol else t
def bars(n, bpm, beats=4): return n * beats * 60 / bpm

# ---------------- cues (fn(S, dur, bpm, key, k, o)) ----------------
def _loop(dur, step):
    t = 0.0; i = 0
    while t < dur - 1e-6: yield i, t; i += 1; t += step
def c_tension_pulse(S, d, bpm, key, k, o):
    b = 60 / bpm; r = 36 + NOTE[key]; S.put(0, drone(r, d + .5), .45)
    for i, t in _loop(d, b / 2): S.put(t, tick(), .35 + .25 * (i % 2 == 0), .4 if i % 2 else -.4)
    for i, t in _loop(d, b): S.put(t, sub808(r + 12, b * .9), .5 * min(1, .4 + t / max(d, 1)))
    S.put(d * .45, strings([r + 24, r + 25], d * .55 + .5, a=d * .4, bright=1600), .3)
def c_dark_ambient(S, d, bpm, key, k, o):
    r = 36 + NOTE[key]; S.put(0, drone(r, d + 1), .5); S.put(0, pad([r + 12, r + 15, r + 22], d + 1, 700, 3, 3), .4)
    for t in np.arange(2, d, 5.5): S.put(t, bell(r + 39 + RS.choice([0, 3, 7]), 4), .08, RS.uniform(-.6, .6))
    S.put(d * .5, strings([r + 25, r + 26], d * .5 + 1, a=3, bright=900), .18)
def c_mystery_pizz(S, d, bpm, key, k, o):
    b = 60 / bpm / 2; r = 48 + NOTE[key]; pat = [0, 3, 7, 3, 8, 7, 3, 2]
    for i, t in _loop(d, b): S.put(t, pizz(r + pat[i % 8]), .55, -.3 if i % 2 else .3)
    for i, t in _loop(d, b * 8): S.put(t, pizz(r - 12 + [0, 0, -4, -2][(i) % 4], .9), .7)
    for t in np.arange(b * 16, d, b * 16): S.put(t, musicbox(r + 24 + RS.choice([0, 3, 7, 10])), .25)
    S.put(0, pad([r, r + 3, r + 7], d + .5, 600, 2, 1), .18)
def c_sneaky(S, d, bpm, key, k, o):
    b = 60 / bpm; r = 40 + NOTE[key]; walk = [0, 0, 3, 0, 5, 4, 3, 2]
    for i, t in _loop(d, b / 2):
        if i % 2 == 0 or i % 8 == 7: S.put(t, pizz(r + walk[i % 8], .3), .8)
        if i % 4 == 2: S.put(t, wood(), .25, .5)
    for i, t in _loop(d, b * 4): S.put(t + b * 1.5, stacc(r + 24 + RS.choice([0, 3, 6])), .2, -.4)
def c_action_drums(S, d, bpm, key, k, o):
    b = 60 / bpm; r = 38 + NOTE[key]; ost = [0, 0, 3, 0, 5, 0, 3, 7]
    for i, t in _loop(d, b / 2):
        S.put(t, stacc(r + 12 + ost[i % 8], b * .45), .35, -.2)
        if i % 4 == 0: S.put(t, taiko(), .8)
        if i % 4 == 2: S.put(t, tom(43), .45, .3)
        if i % 8 == 7: S.put(t, tom(48), .35, -.3)
        S.put(t, hat(), .12, .5)
    for i, t in _loop(d, b * 8): S.put(t, brass([r + 12, r + 19], b * 3), .25)
def c_chase(S, d, bpm, key, k, o):
    b = 60 / bpm / 4; r = 38 + NOTE[key]
    for i, t in _loop(d, b):
        S.put(t, bass(r + [0, 0, 12, 0][i % 4], b * .9, 900), .45)
        if i % 4 == 0: S.put(t, kick(), .7)
        if i % 8 == 4: S.put(t, snare(), .5)
        S.put(t, hat(), .1 + .08 * (i % 2 == 0), .4)
        if i % 16 == 0: S.put(t, stacc(r + 24 + [0, 3, 5, 7][(i // 16) % 4], b * 3), .3)
def c_epic_rise(S, d, bpm, key, k, o):
    b = 60 / bpm; r = 38 + NOTE[key]; prog = [0, 5, 2, 6]
    for i, t in _loop(d, b * 4): S.put(t, strings(chord(key, prog[i % 4], oct=1), b * 4.2, a=.3), .3 + .35 * t / d)
    S.put(d * .4, choir(chord(key, 0, oct=1), d * .6 + .5, a=2), .3)
    for i, t in _loop(d, b): S.put(t, taiko(), .2 + .6 * (t / d) ** 2)
    S.put(max(0, d - 3), riser(3), .35); S.put(d - .02, boom(), .7)
def c_villain(S, d, bpm, key, k, o):
    b = 60 / bpm; r = 36 + NOTE[key]
    for i, t in _loop(d, b * 4): S.put(t, braam(r + [0, 1, 0, -1][i % 4], b * 4), .5)
    S.put(0, choir([r + 24, r + 27, r + 30], d + .5, a=2, vowel='oo'), .3)
    for i, t in _loop(d, b): S.put(t, heartbeat(), .25 if i % 2 == 0 else 0)
def c_sad_piano(S, d, bpm, key, k, o):
    b = 60 / bpm; prog = [0, 5, 3, 4]; r = 60 + NOTE[key]
    for i, t in _loop(d, b * 4):
        ch = chord(key, prog[i % 4], oct=1); S.put(t, piano(ch[0] - 24, b * 4), .4)
        for j, m in enumerate([ch[0], ch[1], ch[2], ch[1]]): S.put(t + j * b, piano(m, b * 2, .6), .3, .2)
    S.put(b * 4, strings(chord(key, 0, oct=1), d, a=3, bright=1400), .16)
def c_hope(S, d, bpm, key, k, o):
    b = 60 / bpm; prog = [0, 4, 5, 3]
    for i, t in _loop(d, b * 4):
        ch = chord(key, prog[i % 4], minor=False, oct=1)
        for j in range(8): S.put(t + j * b / 2, piano(ch[j % 3] + 12 * (j // 3 % 2), b * 1.5, .5), .25, -.3 + .1 * j)
        S.put(t, strings(ch, b * 4.1, a=.8), .12 + .25 * t / d)
def c_victory(S, d, bpm, key, k, o):
    b = 60 / bpm; prog = [0, 3, 4, 0]
    for i, t in _loop(d, b * 2): S.put(t, brass(chord(key, prog[(i // 2) % 4], minor=False, oct=1), b * 1.8), .4)
    for i, t in _loop(d, b): S.put(t, kick() if i % 2 == 0 else snare(), .5); S.put(t + b / 2, hat(), .15)
    S.put(0, strings(chord(key, 0, minor=False, oct=2), d, a=.4), .18)
def c_heartbreak(S, d, bpm, key, k, o):
    b = 60 / bpm; r = 60 + NOTE[key]; mel = [7, 5, 3, 2, 3, 0, -2, 0]
    for i, t in _loop(d, b * 2): S.put(t, piano(r + mel[i % 8], b * 3, .7), .35)
    S.put(0, pad(chord(key, 0), d + 1, 700, 3, 2), .2)
def c_horror(S, d, bpm, key, k, o):
    r = 36 + NOTE[key]; S.put(0, drone(r, d + 1, .6), .45); S.put(0, strings([r + 36, r + 37, r + 38], d + 1, a=4, bright=3000, vib=.012), .12)
    for t in np.arange(1.5, d, 60 / bpm * 2): S.put(t, heartbeat(), .3)
    for t in np.arange(3, d, 6.3): S.put(t, hpf(lpf(noise(1.2), 4000), 1500) * env(1.2, .6, .5), .08, RS.uniform(-.8, .8))   # scrape
def c_lofi(S, d, bpm, key, k, o):
    b = 60 / bpm; prog = [0, 5, 2, 6]
    for i, t in _loop(d, b): S.put(t, kick() if i % 4 in (0, 2) else snare() * .7, .45 if i % 4 in (0, 2) else .3); S.put(t + b / 2, hat(), .1)
    for i, t in _loop(d, b * 4): S.put(t, sum(keys(m, b * 3.8) for m in chord(key, prog[i % 4], oct=1, n=4)) / 3, .35); S.put(t, bass(chord(key, prog[i % 4])[0] - 12, b * 2), .4)
def c_power(S, d, bpm, key, k, o):
    b = 60 / bpm / 4; r = 50 + NOTE[key]; ch = [0, 3, 7, 10, 12, 10, 7, 3]
    for i, t in _loop(d, b): S.put(t, lpf(saw(nf(r + ch[i % 8] + 12 * (t > d / 2)), tt(b)) * adsr(b, .002, .08, .3, .02), 1200 + 3000 * t / d), .22, -.5 + (i % 2))
    S.put(0, sub808(r - 24, d + .5), .4); S.put(d * .5, choir(chord(key, 0, oct=1), d * .5 + .5, a=1.5), .3); S.put(max(0, d - 2), riser(2), .3)
def c_city_night(S, d, bpm, key, k, o):
    b = 60 / bpm; prog = [0, 5, 3, 6]
    for i, t in _loop(d, b / 2):
        ch = chord(key, prog[int(t / (b * 4)) % 4]); S.put(t, bass(ch[0] - 12, b * .45, 700), .4)
        if i % 2 == 0: S.put(t, kick() if i % 4 == 0 else clap(), .35)
        S.put(t, hat(), .08, .4)
    for i, t in _loop(d, b * 4): S.put(t, pad(chord(key, prog[i % 4], oct=1, n=4), b * 4.1, 1800, .3, .3), .25)
def c_flashback(S, d, bpm, key, k, o):
    b = 60 / bpm; r = 72 + NOTE[key]; mel = [0, 3, 7, 12, 10, 7, 3, 5, 3, 0, -2, 0]
    for i, t in _loop(d, b): S.put(t, musicbox(r + mel[i % 12]), .35, .2 * np.sin(i))
    S.put(0, pad([r - 24, r - 21, r - 17], d + 1, 900, 2, 2), .2)
def c_confront(S, d, bpm, key, k, o):
    b = 60 / bpm; r = 38 + NOTE[key]
    for i, t in _loop(d, b / 2):
        S.put(t, stacc(r + 12 + [0, 0, 1, 0][i % 4]), .4)
        if i % 4 == 0: S.put(t, boom(1.0) * .6, .5)
    S.put(0, drone(r - 12, d + .5), .3)
def c_calm(S, d, bpm, key, k, o):
    b = 60 / bpm; prog = [0, 3, 4, 3]
    for i, t in _loop(d, b / 2): S.put(t, pluck(chord(key, prog[int(t / (b * 4)) % 4], minor=False, oct=1)[i % 3] + 12 * (i % 4 == 3), 1.2), .3, -.4 + .8 * (i % 2))
    for i, t in _loop(d, b * 4): S.put(t, pad(chord(key, prog[i % 4], minor=False, oct=1), b * 4.1, 1400, 1, 1), .2)
def c_comedy(S, d, bpm, key, k, o):
    b = 60 / bpm; r = 43 + NOTE[key]
    for i, t in _loop(d, b): S.put(t, pizz(r + [0, 7][i % 2] - 12, .35), .8); S.put(t + b / 2, stacc(r + 16 + [0, 3][i % 2], .12), .3); S.put(t + b / 2, wood(), .2, .5)
    for i, t in _loop(d, b * 4): S.put(t + b * 3.5, bell(r + 31, .8), .15)
def c_suspense_reveal(S, d, bpm, key, k, o):  # riser that ends at d - .6, a beat of SILENCE, then the hit (place d so the hit = reveal)
    r = 36 + NOTE[key]; S.put(0, drone(r, d), .3); S.put(0, strings([r + 24, r + 25, r + 26], max(.5, d - .6), a=d * .6, bright=2600), .25)
    S.put(max(0, d - 3.6), riser(3), .45); S.put(d - .02, boom(), .8); S.put(d - .02, braam(r, 2.5), .45)
CUES = {
    'tension_pulse': dict(fn=c_tension_pulse, bpm=92, mood='suspense build, someone is coming, a timer', g=1),
    'dark_ambient': dict(fn=c_dark_ambient, bpm=60, mood='mystery, dread, night, an empty place', fadein=1.5),
    'mystery_pizz': dict(fn=c_mystery_pizz, bpm=104, mood='investigation, clues, curious'),
    'sneaky': dict(fn=c_sneaky, bpm=112, mood='sneaking, mischief, a plan in motion'),
    'action_drums': dict(fn=c_action_drums, bpm=140, mood='fight, power clash, battle'),
    'chase': dict(fn=c_chase, bpm=165, mood='chase, escape, running'),
    'epic_rise': dict(fn=c_epic_rise, bpm=90, mood='build to a big moment, transformation; ends on a hit', ring=True),
    'villain': dict(fn=c_villain, bpm=70, mood='villain entrance, menace, power'),
    'sad_piano': dict(fn=c_sad_piano, bpm=66, mood='loss, regret, memory', fadein=.8),
    'hope': dict(fn=c_hope, bpm=84, mood='hope, determination, new start'),
    'victory': dict(fn=c_victory, bpm=120, mood='win, triumph, reward'),
    'heartbreak': dict(fn=c_heartbreak, bpm=58, mood='betrayal, heartbreak, alone', fadein=1),
    'horror': dict(fn=c_horror, bpm=70, mood='horror, monster, danger close', fadein=1.5),
    'lofi_investigation': dict(fn=c_lofi, bpm=86, mood='thinking, planning, calm detective'),
    'power_awakening': dict(fn=c_power, bpm=100, mood='power awakens, hacking, focus'),
    'city_night': dict(fn=c_city_night, bpm=100, mood='neon city, travel, montage'),
    'flashback': dict(fn=c_flashback, bpm=72, mood='flashback, childhood, innocence', fadein=1),
    'confrontation': dict(fn=c_confront, bpm=108, mood='standoff, accusation, interrogation'),
    'calm': dict(fn=c_calm, bpm=88, mood='peaceful, morning, safe'),
    'comedy': dict(fn=c_comedy, bpm=128, mood='funny, clumsy, light'),
    'suspense_reveal': dict(fn=c_suspense_reveal, bpm=90, mood='riser -> silence -> hit on the reveal', ring=True),
}
# ---------------- stingers (place exactly on the hit point) ----------------
def _st(fn): return fn
STINGS = {
    'hit_boom': lambda S, t, g, key: (S.put(t, boom(), .9 * g), S.put(t, subdrop(), .5 * g)),
    'braam': lambda S, t, g, key: S.put(t, braam(36 + NOTE[key], 3), .8 * g),
    'riser_hit': lambda S, t, g, key: (S.put(t - 3, riser(3), .5 * g), S.put(t, boom(), .9 * g)),          # riser ENDS on t
    'reverse_hit': lambda S, t, g, key: (S.put(t - 2, reverse_cym(2), .5 * g), S.put(t, taiko(), .9 * g)),
    'shimmer_up': lambda S, t, g, key: S.put(t, shimmer(72 + NOTE[key]), .5 * g),                          # magic, realisation
    'dread': lambda S, t, g, key: (S.put(t, strings([60 + NOTE[key], 61 + NOTE[key], 62 + NOTE[key]], 2.5, a=.05, bright=4000), .35 * g), S.put(t, subdrop(), .5 * g)),
    'piano_low': lambda S, t, g, key: S.put(t, piano(24 + NOTE[key], 4) + piano(31 + NOTE[key], 4), .6 * g),  # a dark realisation
    'comedy_bonk': lambda S, t, g, key: (S.put(t, wood(), .8 * g), S.put(t + .12, pizz(55, .4), .6 * g)),
    'heartbeat2': lambda S, t, g, key: (S.put(t, heartbeat(), .8 * g), S.put(t + .8, heartbeat(), .8 * g)),
    'victory_hit': lambda S, t, g, key: (S.put(t, brass(chord(key, 0, minor=False, oct=1), 1.8), .6 * g), S.put(t, kick(), .6 * g)),
}

# ---------------- v7.0 STYLE-ALIKE cues: same GENRE / mood / tempo / instruments as tracks the user likes, but ORIGINAL
# melodies (seeded random walks on the scale) - never the source tune, hook or riff, so they are ours to use anywhere.
def flute(m, d, vib=.012, breath=.08):
    t = tt(d); f = nf(m) * (1 + vib * np.sin(2 * np.pi * 5.5 * t) * np.minimum(1, t / .25))
    ph = 2 * np.pi * np.cumsum(f) / SR; s = np.sin(ph) + .18 * np.sin(2 * ph) + .06 * np.sin(3 * ph)
    return (s + breath * bpf(noise(d), 1500, 6000)) * adsr(d, .05, .2, .8, .08)
def nylon(m, d=1.2): return lpf(pluck(m, d, .997, .3), 3500) * 1.2
def brush(d=.25): t = tt(d); return bpf(noise(d), 2000, 9000) * np.minimum(1, t / .03) * np.exp(-t / .1) * .7
def rim(d=.08): t = tt(d); return np.sin(2 * np.pi * 1700 * t) * np.exp(-t / .012) + .4 * bpf(noise(d), 2500, 6000) * np.exp(-t / .006)
def vibes(m, d=1.5): t = tt(d); f = nf(m); return (np.sin(2 * np.pi * f * t) + .25 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t / .15)) * np.exp(-t / .8) * (1 + .25 * np.sin(2 * np.pi * 5 * t)) * np.minimum(1, t / .003)
def organ(ms, d): t = tt(d); return sum(sum(np.sin(2 * np.pi * nf(m) * h * t) / h for h in (1, 2, 3)) for m in ms) / len(ms) * .5 * env(d, .01, .05)
def crackle(d): n = noise(d); return hpf((np.abs(n) > 3.6) * n, 1000) * .25 + lpf(noise(d), 4000) * .015
def melody(rs, scale_notes, n, start=4, jump=2):
    i = start; out = []
    for _ in range(n): i = int(np.clip(i + rs.randint(-jump, jump + 1), 0, len(scale_notes) - 1)); out.append(scale_notes[i])
    return out
def notes_of(key, minor, lo, hi, pent=False):
    r, sc = scale(key, minor); sc = [sc[j] for j in ((0, 2, 3, 4, 6) if minor else (0, 1, 2, 4, 5))] if pent else sc
    return [r + o * 12 + s for o in range(-2, 4) for s in sc if lo <= r + o * 12 + s <= hi]
def c_bossa(S, d, bpm, key, k, o):
    b = 60 / bpm; rs = np.random.RandomState(o.get('seed', 3)); prog = [(1, 7), (4, 7), (0, 7), (5, 7)]  # ii7 V7 I7 vi7
    for bar, t in _loop(d, b * 4):
        deg = prog[bar % 4][0]; ch = chord(key, deg, minor=False, oct=0, n=4); root = ch[0] - 12
        for off in (0, 1.5, 2.5, 3.5 if bar % 2 else 3.0): S.put(t + off * b, sum(nylon(m, b * 1.2) for m in ch[1:]) / 2, .3, -.3)   # syncopated comping
        S.put(t, pizz(root, b * 1.4), .7); S.put(t + 2 * b, pizz(root + 7, b * 1.4), .6)                                       # bass 1 & 5
        for j in range(8): S.put(t + j * b / 2, shaker(), .18, .4)
        for j in (0, 1.5, 3, 4.5, 6): S.put(t + j * b / 2, rim(), .2, .2)
    mel = notes_of(key, False, 72, 88); rs2 = np.random.RandomState(o.get('seed', 3) + 1); seq = melody(rs2, mel, 64, len(mel) // 2)
    tm = b * 8; j = 0
    while tm < d - b * 2: L = [b, b / 2, b * 1.5, b / 2, b * 2][j % 5]; S.put(tm, flute(seq[j], L * .95), .16, .25); tm += L; j += 1
def c_flute_waltz(S, d, bpm, key, k, o):
    b = 60 / bpm; prog = [0, 3, 4, 0, 5, 1, 4, 4]; mel = notes_of(key, False, 74, 91); rs = np.random.RandomState(o.get('seed', 5))
    for bar, t in _loop(d, b * 3):
        ch = chord(key, prog[bar % 8], minor=False); S.put(t, pizz(ch[0] - 12, b * 1.2), .7)
        for q in (1, 2): S.put(t + q * b, sum(stacc(m + 12, .14) for m in ch) / 2, .22, .3)
        if bar >= 2:
            for q, L in ((0, 2), (2, 1)) if bar % 2 else ((0, 1), (1, 1), (2, 1)):
                S.put(t + q * b, flute(mel[int(np.clip(rs.randint(0, len(mel)), 0, len(mel) - 1))] if False else melody(rs, mel, 1, len(mel) // 2, 3)[0], L * b * .92), .2, -.2)
        if bar % 4 == 3: S.put(t + 2 * b, bell(mel[-1] + 12, 1.2), .07)
def c_retro_jingle(S, d, bpm, key, k, o):
    b = 60 / bpm; prog = [0, 5, 1, 4]; mel = notes_of(key, False, 67, 84, pent=True); rs = np.random.RandomState(o.get('seed', 9))
    for bar, t in _loop(d, b * 4):
        ch = chord(key, prog[bar % 4], minor=False, oct=1, n=4)
        for q in range(4):
            S.put(t + q * b, pizz(ch[0] - 24 + [0, 4, 7, 9][q], b * .9), .6)          # walking bass
            S.put(t + q * b + b / 2, organ(ch[:3], b * .35), .2, .3)                   # off-beat organ stabs
            S.put(t + q * b, brush(), .25 if q % 2 else .12, -.2)
        seq = melody(rs, mel, 6, len(mel) // 2)
        for q, (m, L) in enumerate(zip(seq, (1, .5, .5, 1, .5, .5))): S.put(t + sum((1, .5, .5, 1, .5, .5)[:q]) * b, vibes(m, L * b * 1.6), .25, .15)
def c_dark_musicbox(S, d, bpm, key, k, o):
    b = 60 / bpm; mel = notes_of(key, True, 74, 91); rs = np.random.RandomState(o.get('seed', 13)); r = 36 + NOTE[key]
    S.put(0, lpf(drone(r, d + 1, .2), 300), .12); seq = melody(rs, mel, 200, len(mel) // 2, 2)
    for i, t in _loop(d, b / 2):
        drift = 1 - .012 * (t / max(d, 1))                                       # the box slowly runs down, slightly flat
        if i % 8 != 7: S.put(t * (1 + .01 * (i % 3)), lpf(musicbox(seq[i] + 12 * (i % 16 == 0), 1.4) * drift, 6000), .5, .3 * np.sin(i * .7))
    for t in np.arange(b * 8, d - 1, b * 8): S.put(t - 1.5, reverse_cym(1.5), .08)
def c_chill_jazz(S, d, bpm, key, k, o):
    b = 60 / bpm; prog = [1, 4, 0, 0]; rs = np.random.RandomState(o.get('seed', 21)); sw = b * 2 / 3
    for bar, t in _loop(d, b * 4):
        ch = chord(key, prog[bar % 4], minor=False, oct=0, n=4); S.put(t, sum(keys(m + 12, b * 3.6) for m in ch) / 3, .3, -.2)
        if bar % 2: S.put(t + 2.5 * b, sum(keys(m + 12, b * 1.2) for m in ch) / 3, .18, -.2)
        walk = [ch[0] - 24, ch[1] - 24, ch[2] - 24, ch[0] - 23 + rs.choice([0, 2])]
        for q in range(4):
            S.put(t + q * b, pizz(walk[q], b), .65)                                    # upright walking bass
            S.put(t + q * b, brush(.3), .14, .3); S.put(t + q * b + sw, brush(.15), .08, .3)   # swung ride/brushes
            if q % 2: S.put(t + q * b, rim(), .1)
    mel = notes_of(key, False, 72, 86, pent=True); seq = melody(rs, mel, 80, len(mel) // 2)
    tm = b * 8; j = 0
    while tm < d - b * 2: L = [b, sw, b - sw, b * 2, b][j % 5]; S.put(tm, vibes(seq[j], L * 1.8), .17, .2); tm += L; j += 1
def c_sad_lofi(S, d, bpm, key, k, o):
    b = 60 / bpm; prog = [5, 3, 0, 4]; rs = np.random.RandomState(o.get('seed', 33)); sw = b * .56
    S.put(0, crackle(d + .5), .5)
    for bar, t in _loop(d, b * 4):
        ch = chord(key, prog[bar % 4], minor=True, oct=0, n=4); S.put(t, lpf(sum(keys(m + 12, b * 3.8) for m in ch) / 3, 1800), .4, -.15)
        S.put(t, bass(ch[0] - 12, b * 1.8, 400), .5); S.put(t + 2.5 * b, bass(ch[0] - 12, b * 1.2, 400), .4)
        for q in range(4):
            S.put(t + q * b, lpf(kick(), 900) if q in (0, 2) else lpf(snare(), 3000) * .8, .4 if q in (0, 2) else .3)
            if rs.rand() < .3 and q == 3: S.put(t + q * b + sw, lpf(kick(), 900), .25)
            S.put(t + q * b, lpf(hat(), 7000), .07, .3); S.put(t + q * b + sw, lpf(hat(), 7000), .05, .3)
    mel = notes_of(key, True, 67, 81, pent=True); seq = melody(rs, mel, 60, len(mel) // 2)
    for i, t in _loop(d - b * 4, b * 2):
        if i % 4 != 3: S.put(t + b * 4 + (b / 2 if i % 3 == 1 else 0), lpf(piano(seq[i], b * 2.5, .5), 2500), .22, .2)
CUES.update({
    'bossa_lounge': dict(fn=c_bossa, bpm=126, mood='bossa nova lounge, sneaky-cool, playful scheming (style of library bossa tracks)'),
    'flute_waltz': dict(fn=c_flute_waltz, bpm=150, mood='whimsical 3/4 flute waltz, innocent, nostalgic or comic chaos'),
    'retro_jingle': dict(fn=c_retro_jingle, bpm=120, mood='cheesy retro commercial, ironic calm, ad parody'),
    'dark_musicbox': dict(fn=c_dark_musicbox, bpm=84, mood='dark music box, ominous innocence, creepy calm', fadein=1),
    'chill_jazz': dict(fn=c_chill_jazz, bpm=92, mood='chill lounge jazz, cafe, late shift, everyday calm'),
    'sad_lofi': dict(fn=c_sad_lofi, bpm=78, mood='sad lofi, heartbreak, regret, rain at night', fadein=.8),
})
