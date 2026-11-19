# music_pm1.py: THE PUPPET MASTER ep1 bed (D minor, dark psychological thriller) -> aud/music_bed.wav
# ticking pulse + low drone (hook) -> muffled pad (truck) -> wide low swell + drum on ZERO CITY -> bass ostinato + ticks (the city)
# -> rising cluster (alley) -> SILENCE while he uses the power -> sparse low piano motif (realisation) -> drone, cut dead on the dot
import numpy as np, wave, json, sys
from scipy.signal import butter, sosfilt, fftconvolve
W = sys.argv[1] if len(sys.argv) > 1 else '.'
SR = 48000; END = json.load(open(f'{W}/src/timing.json'))['end']; N = int((END + 2) * SR)
L = np.zeros(N); R = np.zeros(N); rs = np.random.RandomState(11)
nf = lambda m: 440 * 2 ** ((m - 69) / 12); tt = lambda d: np.arange(int(d * SR)) / SR
lpf = lambda x, f: sosfilt(butter(2, f, 'low', fs=SR, output='sos'), x); hpf = lambda x, f: sosfilt(butter(2, f, 'high', fs=SR, output='sos'), x)
def put(t, x, g=1.0, pan=0.0):
    i = int(t * SR); n = min(len(x), N - i)
    if n <= 0 or i < 0: return
    L[i:i + n] += x[:n] * g * np.sqrt((1 - pan) / 2) * 1.414; R[i:i + n] += x[:n] * g * np.sqrt((1 + pan) / 2) * 1.414
def env(d, a, r): t = tt(d); return np.minimum(1, t / a) * np.minimum(1, (d - t) / r)
def pad(ms, d, cut=900, a=1.2, r=1.5):
    t = tt(d); s = sum(sum(np.sin(2 * np.pi * nf(m) * (1 + dt) * t + rs.rand() * 6) for dt in (-.004, 0, .005)) for m in ms) / (3 * len(ms))
    s += sum(((nf(m) * t) % 1 * 2 - 1) for m in ms) * .15 / len(ms); return lpf(s, cut) * env(d, a, r)
def bass(m, d=.42): t = tt(d); f = nf(m); s = np.sin(2 * np.pi * f * t) + .35 * np.sin(2 * np.pi * 2 * f * t) + .25 * ((f * t) % 1 * 2 - 1); return lpf(s, 500) * np.exp(-t / .35) * env(d, .005, .05)
def tick(hi=1.0): t = tt(.06); return hpf(rs.randn(len(t)), 6000) * np.exp(-t / .012) * hi
def drum(d=1.6): t = tt(d); return (np.sin(2 * np.pi * (48 + 60 * np.exp(-t / .05)) * t) * np.exp(-t / .5) + lpf(rs.randn(len(t)), 300) * np.exp(-t / .12) * .6)
def piano(m, d=2.2): t = tt(d); f = nf(m); s = sum(np.sin(2 * np.pi * f * k * t) * np.exp(-t * (1.3 + k * .9)) / k ** 1.3 for k in range(1, 6)); return s * np.minimum(1, t / .004)
def drone(d, m=38): t = tt(d); s = np.sin(2 * np.pi * nf(m) * t) + .5 * np.sin(2 * np.pi * nf(m + 7) * t + 1) + .3 * lpf(rs.randn(len(t)), 120) * 4; return s * env(d, 1.0, 1.0)
# ===== EPISODE block (real seconds) =====
put(0, drone(3.9, 38), .5); [put(.0 + k * .5, tick(.6), .5, .4 if k % 2 else -.4) for k in range(8)]
put(3.7, lpf(pad([50, 53, 57], 7.9, 600), 700), .45)                                   # truck: muffled Dm
put(11.3, pad([38, 45, 50, 53], 10.2, 1200, 2.0, 2.0), .65); put(15.28, drum(2.0), .9); put(16.0, drone(5.4, 38), .35)
pat = [50, 50, 53, 52, 50, 50, 57, 55]                                                 # the city: bass ostinato at 92 bpm (8ths)
b = 60 / 92 / 2; k = 0; tb = 21.37
while tb < 45.7:
    m = pat[k % 8] - (0 if tb < 38 else -1 if k % 4 == 3 else 0); put(tb, bass(m - 12, b * 1.6), .55 if tb < 38 else .7, -.1); put(tb, tick(.5 if k % 2 else .9), .35, .4 if k % 2 else -.3)
    if k % 16 == 0: put(tb, pad([50, 53, 57] if (k // 16) % 2 == 0 else [48, 52, 55], b * 16, 1000), .35)
    k += 1; tb += b * (1 if tb < 38 else .85)
put(38.0, pad([62, 63, 65, 66], 7.7, 1800, 4.0, .4), .22)                               # alley: rising cluster under the ostinato
# 45.8 - 53.9 : silence (the power)
for i, (tm, m) in enumerate([(54.0, 62), (54.9, 65), (55.8, 69), (57.4, 62), (58.3, 65), (59.2, 70), (60.8, 69), (62.6, 65), (63.5, 62)]): put(tm, piano(m, 2.4), .4, -.2 if i % 2 else .2)
put(54.0, pad([38, 50], 10.0, 500, 2.0, 1.0), .3)
put(64.1, pad([50, 53, 57, 60], 3.4, 1500, .8, 1.2), .4)                               # the first smile (Dm7)
put(66.9, drone(3.6, 37), .55); put(67.0, pad([49, 50, 56], 3.5, 800, 2.0, .2), .3)     # dread: clash, cut dead at 70.4
s = int(70.4 * SR); L[s:] = 0; R[s:] = 0
rv = np.exp(-tt(1.8) / .4) * rs.randn(int(1.8 * SR)); rv /= np.sqrt((rv ** 2).sum())
L2 = L + fftconvolve(L, rv)[:N] * .25; R2 = R + fftconvolve(R, rv[::-1].copy())[:N] * .25
m = np.stack([L2, R2])[:, :int(END * SR)]; m /= np.abs(m).max() / .9
with wave.open(f'{W}/aud/music_bed.wav', 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((m.T * 32767).astype(np.int16).tobytes())
print('music ok', m.shape)
