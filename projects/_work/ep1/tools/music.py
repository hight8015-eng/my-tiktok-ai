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
# ===== EPISODE: "เกมเอาชีวิตรอด ตอน 1" =====
CH.update({'Dm': [50, 62, 65, 69], 'F': [41, 60, 65, 69], 'E': [40, 64, 68, 71], 'Gm': [43, 62, 67, 70], 'Bb': [46, 62, 65, 70]})
def pulse(t0, t1, m, step=.5, g=.5):
    k = 0
    while t0 + k * step < t1: put(t0 + k * step, bass(m, step + .1), g * (1 if k % 2 == 0 else .7)); k += 1
def tick8(t0, t1, m=81, step=.25, g=.18):
    k = 0
    while t0 + k * step < t1: put(t0 + k * step, pizz(m if k % 4 else m + 5, .2, .05), g, .3 * (1 if k % 2 else -1)); k += 1
def darkbar(t0, d):
    put(t0, pad([33, 45, 52, 57], d, .6, .6, 700), .5, 0); pulse(t0, t0 + d, 33, .6, .45)
    for k in range(int(d / 1.2)): put(t0 + .3 + k * 1.2, mbox([76, 75, 76, 72][k % 4], 1.3), .18, .1)
def prog(t0, chords, dur, g=.45, bright=1000):
    for k, ch in enumerate(chords): put(t0 + k * dur, pad(CH[ch][1:], dur, .3, .5, bright), g, 0)
SIL = [(38.9, 40.7)]
darkbar(0, len(THEME[:2]) * 3 * .58)                                                     # end of class
prog(3.75, ['Am', 'F', 'Dm', 'E'], 2.7, .5, 1100); pulse(3.75, 14.6, 33, .25, .6); tick8(5.9, 14.6)   # helicopters, desks
prog(14.65, ['Am', 'F', 'E'], 3.2, .5, 1200); pulse(14.65, 24.3, 33, .2, .65); tick8(16.7, 24.3, 81, .2, .2)   # rappel, chase
put(24.4, pad([45, 60, 64], 14.0, .5, 1.0, 700), .5, 0); pulse(27.25, 37.9, 33, .7, .5)              # hiding
put(40.7, pad([57, 60, 64, 71], 14.0, 2.0, 1.0, 1500), .3, 0)                                         # the strange classroom
for k, m in enumerate([76, 79, 83, 81, 76, 72, 74, 71, 76, 79]): put(41.5 + k * 1.3, mbox(m, 1.4), .3, -.1)
prog(54.85, ['Am', 'Am', 'F', 'E'], 2.5, .5, 1300); pulse(54.85, 64.9, 33, .5, .5); tick8(58.35, 64.9, 88, .25, .14)   # the screen
prog(64.95, ['F', 'C', 'G', 'Am'], 1.8, .45, 1500)                                                     # the rooftop, the city
put(72.15, pad([33, 45, 52, 60], 6.8, .3, .6, 600), .6, 0); pulse(72.15, 78.8, 28, .7, .65)           # the giant
put(78.9, pad([69, 72, 76, 83], 13.4, 1.0, 1.0, 2400), .3, 0)                                          # the stones
for k, m in enumerate([83, 88, 84, 81, 83, 88, 91, 88]): put(79.2 + k * 1.6, mbox(m, 1.8), .26, .1)
prog(92.4, ['Am', 'F', 'Dm', 'E'], 1.7, .55, 1300); pulse(92.4, 99.1, 33, .2, .65); tick8(92.4, 99.1, 81, .2, .2)   # explosion, run
prog(99.15, ['Am', 'F', 'G', 'Am'], 1.7, .5, 1200); pulse(99.15, END - .3, 33, .5, .55)
put(0, pad([28, 40, 47], END, 2.0, 1.0, 300), .25, 0)
# master: light hall reverb, fade out
def rev(x, secs=2.2, wet=.28, seed=5):
    r = np.random.RandomState(seed); n = int(secs * SR); ti = np.arange(n) / SR; ir = r.randn(n) * np.exp(-ti / (secs / 5)); ir = lpf(ir, 5000); ir /= np.sqrt((ir ** 2).sum())
    return x * (1 - wet) + fftconvolve(x, ir)[:len(x)] * wet
M = np.stack([rev(L, seed=5), rev(R, seed=6)])[:, :int(END * SR)]
fo = np.clip((END - np.arange(M.shape[1]) / SR) / .6, 0, 1); M *= fo
tg = np.arange(M.shape[1]) / SR
for a_, b_ in SIL: M *= 1 - np.clip((tg - a_) / .3, 0, 1) * np.clip((b_ - tg) / .08, 0, 1)
M /= np.abs(M).max() / .9
with wave.open(f'{W}/aud/music_bed.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((M.T * 32767).astype(np.int16).tobytes())
print('music_bed', M.shape[1] / SR, 's')
