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
# ===== EPISODE: "เกมเอาชีวิตรอด ตอน 8" =====
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
SIL = [(70.0, 70.6)]
put(0, pad([33, 45, 51, 58], 9.0, .2, .4, 600), .65, 0); pulse(0, 9.0, 28, .3, .7)                     # the origin
prog(9.0, ['Dm', 'Bb', 'E', 'E'], 2.15, .5, 900); pulse(9.0, 17.6, 28, .5, .6)
put(17.1, pad([45, 57, 60, 64], 6.7, .3, .6, 1000), .45, 0)                                             # the final test
put(23.8, pad([57, 60, 64, 71], 8.4, .6, .5, 1500), .35, 0)
for k, m in enumerate([76, 81, 83, 84, 83, 81]): put(24.1 + k * 1.3, mbox(m, 1.3), .22, -.1)          # Krai reads it
put(32.2, pad([33, 45, 52, 59], 9.4, 1.0, .8, 800), .55, 0); pulse(35.9, 41.6, 28, .5, .55)             # draining
prog(41.6, ['Am', 'C', 'G', 'E', 'Am', 'F'], 1.65, .45, 1300); tick8(41.6, 51.5, 84, .25, .14); pulse(45.2, 51.5, 33, .25, .55)   # the plan
put(51.5, pad([45, 57, 60, 64], 1.5, .1, .5, 1200), .4, 0)
prog(53.0, ['Am', 'F', 'C', 'G', 'Am', 'F', 'E', 'E'], 2.1, .55, 1600); pulse(53.0, 69.8, 33, .2, .7); tick8(57.1, 69.8, 88, .2, .18)   # the pillars fall
prog(70.6, ['A', 'D', 'A', 'E', 'A'], 1.6, .5, 1700); pulse(70.6, 78.2, 45, .4, .45)                    # freedom
for k, m in enumerate([81, 85, 88, 93, 88, 85]): put(70.8 + k * 1.2, mbox(m, 1.3), .22, .1)
put(78.2, pad([45, 57, 60, 64], 6.6, .3, .6, 900), .4, 0)
put(84.8, pad([33, 45, 51, 57], 14.1, .3, .3, 650), .6, 0); pulse(84.8, 98.9, 28, .6, .6)              # the Director laughs
for k, m in enumerate([76, 75, 72, 71]): put(91.0 + k * 1.6, mbox(m, 1.6), .22, 0)
put(98.9, pad([45, 57, 64, 69], 5.6, 1.0, .6, 1400), .4, 0)                                              # dawn
put(104.5, pad([33, 45, 52, 59], END - 104.5, .6, .4, 700), .65, 0); pulse(104.5, END - 1.0, 28, .45, .7)   # the ship
prog(108.8, ['Dm', 'E', 'Am'], 2.4, .5, 1100)
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
