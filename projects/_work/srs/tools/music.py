# music.py: synthesized storybook music bed (EPISODE block = "สะพานสองหมู่บ้าน") -> aud/music_bed.wav (48 kHz stereo, raw level)
# celesta/music-box waltz in D major (dusk deck) -> pizzicato mischief in B minor (night cheating)
# -> low pad + pulse tension (cabin, fog) -> silence for the reef build-up + crash -> slow music-box reprise to the end
import numpy as np, wave, json, sys
from scipy.signal import butter, sosfilt, fftconvolve
W = sys.argv[1] if len(sys.argv) > 1 else '.'
SR = 48000
END = json.load(open(f'{W}/src/timing.json'))['end']
N = int((END + 2) * SR)
L = np.zeros(N); R = np.zeros(N); rs = np.random.RandomState(3)
def nf(m): return 440 * 2 ** ((m - 69) / 12)
def lpf(x, f): return sosfilt(butter(2, f, 'low', fs=SR, output='sos'), x)
def put(t, x, g=1.0, pan=0.0):
    i = int(t * SR); n = min(len(x), N - i)
    if n <= 0 or i < 0: return
    L[i:i + n] += x[:n] * g * np.sqrt((1 - pan) / 2) * 1.414; R[i:i + n] += x[:n] * g * np.sqrt((1 + pan) / 2) * 1.414
def tt(d): return np.arange(int(d * SR)) / SR
def celesta(m, d=1.6):
    t = tt(d); f = nf(m)
    s = (np.sin(2 * np.pi * f * t) * np.exp(-t / .9) + .45 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t / .35)
         + .18 * np.sin(2 * np.pi * 3.01 * f * t) * np.exp(-t / .15) + .1 * np.sin(2 * np.pi * 4.2 * f * t) * np.exp(-t / .06))
    return s * np.minimum(1, t / .003) * np.minimum(1, (d - t) / .05)
def mbox(m, d=1.4):  # music box: brighter, tine-like inharmonic partials
    t = tt(d); f = nf(m)
    s = np.sin(2 * np.pi * f * t) * np.exp(-t / .7) + .3 * np.sin(2 * np.pi * 2.76 * f * t) * np.exp(-t / .2) + .12 * np.sin(2 * np.pi * 5.4 * f * t) * np.exp(-t / .07)
    return s * np.minimum(1, t / .002) * np.minimum(1, (d - t) / .05)
def pizz(m, d=.5, dec=.16):  # plucked string (Karplus-Strong)
    f = nf(m); p = max(2, int(SR / f)); n = int(d * SR); buf = rs.uniform(-1, 1, p); out = np.zeros(n)
    for i in range(n): out[i] = buf[i % p]; buf[i % p] = .5 * (buf[i % p] + buf[(i + 1) % p]) * .996
    t = tt(d)[:n]; return lpf(out, 2500) * np.exp(-t / dec) * np.minimum(1, (d - t) / .03)
def bass(m, d=1.0): return pizz(m, d, .35) * 1.3
def pad(ms, d, att=.5, rel=.8, bright=1400):
    t = tt(d + rel); s = np.zeros(len(t))
    for m in ms:
        for det in (-.07, .07):
            f = nf(m) * 2 ** (det / 12); ph = rs.rand() * 6
            for h in range(1, 7): s += np.sin(2 * np.pi * f * h * t + ph * h) / h
    e = np.minimum(1, t / att) * np.clip((d + rel - t) / rel, 0, 1) * (1 + .06 * np.sin(2 * np.pi * 4.6 * t))
    return lpf(s * e, bright) / (len(ms) * 4)
# chord tones (MIDI) -------------------------------------------------------------------------------------------------
CH = {'D': [50, 62, 66, 69], 'A/C#': [49, 61, 64, 69], 'Bm': [47, 62, 66, 71], 'G': [43, 62, 67, 71], 'Em': [40, 64, 67, 71],
      'A': [45, 61, 64, 69], 'F#': [42, 61, 66, 70], 'C': [48, 60, 64, 67], 'Am': [45, 60, 64, 69], 'B': [47, 63, 66, 71], 'Bsus': [47, 64, 66, 71]}
THEME = [('D', [(0, 78, 2), (2, 81, 1)]), ('A/C#', [(0, 76, 2), (2, 73, 1)]), ('Bm', [(0, 74, 1), (1, 78, 1), (2, 83, 1)]), ('G', [(0, 81, 3)]),
         ('D', [(0, 78, 2), (2, 81, 1)]), ('Em', [(0, 79, 1), (1, 78, 1), (2, 76, 1)]), ('A', [(0, 73, 1), (1, 76, 1), (2, 79, 1)]), ('D', [(0, 78, 3)])]
SLY = [('Bm', [(0, 71, .5), (1, 74, .5), (2, 78, .5)]), ('F#', [(0, 73, .5), (1, 78, .5), (2, 82, .5)]), ('Bm', [(0, 83, .5), (1.5, 78, .5), (2, 74, .5)]), ('Em', [(0, 76, .5), (1, 79, .5), (2, 83, .5)]),
       ('Bm', [(0, 78, .5), (1, 74, .5), (2, 71, .5)]), ('G', [(0, 79, .5), (1, 83, .5), (2, 79, .5)]), ('F#', [(0, 78, .5), (1, 82, .5), (2, 85, .5)]), ('Bm', [(0, 83, .5), (1, 78, .5)])]
def waltz(t0, bars, beat, inst='cel', mel_g=.32, pad_g=.5, bass_g=.55, oom=True, pan=-.15):
    for k, (ch, mel) in enumerate(bars):
        tb = t0 + k * 3 * beat; c = CH[ch]
        put(tb, bass(c[0] - (12 if c[0] > 47 else 0) + 12, 3 * beat + .2), bass_g, -.1)
        if oom:  # "pah pah" on beats 2 and 3 (soft pizz chord)
            for b in (1, 2):
                for m in c[1:]: put(tb + b * beat, pizz(m, .35, .1), .16, .25)
        if pad_g: put(tb, pad(c[1:], 3 * beat, .25, .5), pad_g, 0)
        for (o, m, d) in mel:
            x = celesta(m, max(1.0, d * beat + .8)) if inst == 'cel' else mbox(m, max(1.0, d * beat + .8)) if inst == 'box' else pizz(m, .45, .14) * 1.6
            put(tb + o * beat, x, mel_g, pan)
    return t0 + len(bars) * 3 * beat
# ===== EPISODE: "นาฬิกาพกสีทอง" =====
def pulse(t0, t1, m, step=.5, g=.5):
    k = 0
    while t0 + k * step < t1: put(t0 + k * step, bass(m, step + .1), g * (1 if k % 2 == 0 else .7)); k += 1
put(.2, pad(CH['Em'][1:], 7.6, .8, .6, 900), .45, 0); pulse(.2, 7.9, 40, .55, .4)                  # walking home
t = waltz(7.95, SLY[:6], .55, inst='pizz', mel_g=.7, pad_g=.3, bass_g=.7, pan=.1)                   # the offer
t = waltz(18.15, THEME[:3], .6, mel_g=.3, pad_g=.38)                                                 # yes! the watch
t = waltz(26.6, THEME, .52, mel_g=.32, pad_g=.4, bass_g=.6)                                          # the medieval town
t = waltz(39.2, SLY, .55, inst='pizz', mel_g=.6, pad_g=.3, bass_g=.6, pan=.1)                        # day one: suspects
t = waltz(t, SLY, .55, inst='pizz', mel_g=.55, pad_g=.3, bass_g=.6, pan=.1)
for tt_, ch, d in ((66.15, 'Bm', 3.5), (69.7, 'G', 3.7), (73.45, 'Em', 2.3)): put(tt_, pad(CH[ch][1:], d, .5, .5, 800), .45, 0)   # night two
for k, m in enumerate([71, 74, 78, 74, 71, 66, 71]): put(66.3 + k * 1.2, pizz(m, .45, .14) * 1.6, .4, .1)
put(75.85, pad(CH['F#'][1:], 7.8, .2, .5, 1300), .5, 0); pulse(75.85, 83.6, 42, .25, .55)        # the guard confesses
t = waltz(83.75, THEME[:1], .55, mel_g=.3, pad_g=.35)
for tt_, ch, d in ((85.5, 'Bm', 4.0), (89.6, 'G', 3.5), (93.1, 'F#', 3.7)): put(tt_, pad(CH[ch][1:], d, .4, .3, 900), .5, 0)   # the duke
pulse(85.5, 96.8, 35, .5, .45)
# 96.9 - 98.6: silence (dead silence)
put(98.7, pad([47, 62, 65, 71], 13.2, .3, .5, 900), .55, 0); pulse(98.7, 111.9, 35, .25, .55)     # the sword, time runs out
put(112.1, pad([71, 74, 78, 83], 6.0, 1.5, 1.0, 2500), .3, 0)                                         # frozen time
t = waltz(118.4, THEME[:2], .5, inst='box', mel_g=.32, pad_g=.35)                                    # congratulations
put(121.45, pad([47, 62, 65, 71], 2.2, .3, .2, 700), .5, 0)
# 123.4 - 124.7: SILENCE (the beat)
put(124.8, pad([35 + 12, 59, 62, 65], END - 124.8, .3, .3, 800), .6, 0); pulse(124.8, END - .3, 35, .5, .6)
# master: light hall reverb, fade out
def rev(x, secs=2.2, wet=.28, seed=5):
    r = np.random.RandomState(seed); n = int(secs * SR); ti = np.arange(n) / SR; ir = r.randn(n) * np.exp(-ti / (secs / 5)); ir = lpf(ir, 5000); ir /= np.sqrt((ir ** 2).sum())
    return x * (1 - wet) + fftconvolve(x, ir)[:len(x)] * wet
M = np.stack([rev(L, seed=5), rev(R, seed=6)])[:, :int(END * SR)]
fo = np.clip((END - np.arange(M.shape[1]) / SR) / .6, 0, 1); M *= fo
tg = np.arange(M.shape[1]) / SR; M *= 1 - np.clip((tg - 123.4) / .3, 0, 1) * np.clip((124.75 - tg) / .08, 0, 1)
M /= np.abs(M).max() / .9
with wave.open(f'{W}/aud/music_bed.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((M.T * 32767).astype(np.int16).tobytes())
print('music_bed', M.shape[1] / SR, 's')
