# ===== EPISODE 1/2: ambience (classroom hum, night wind, red alarm) =====
t = np.arange(N) / SR
room = lp(rs.randn(N), 400) * 1.5 + np.sin(2 * np.pi * 100 * t) * .05
wind = lp(rs.randn(N), 500) * 2.2 * (.6 + .4 * np.sin(2 * np.pi * t / 5.3))
crick = bp(rs.randn(N), 4000, 6000) * (np.sin(2 * np.pi * 14 * t) > .6) * (np.sin(2 * np.pi * .5 * t) > 0)
alarm = np.sin(2 * np.pi * 880 * t) * (np.sin(2 * np.pi * 1.6 * t) > 0) * .4
gR, gW, gN, gA = [np.zeros(N) for _ in range(4)]
def seg(a, b, v, arr):
    i, j = int(a * SR), int(b * SR); arr[i:j] = v
seg(0, 8.2, .04, gR); seg(13.7, 22.85, .04, gR); seg(32.1, END, .035, gR); seg(8.2, 13.7, .05, gW); seg(22.85, 32.1, .05, gW); seg(22.85, 52.5, .02, gN); seg(62.6, END, .03, gA)
gR, gW, gN, gA = [lp(g, 3) for g in (gR, gW, gN, gA)]
L += room * gR + wind * gW + crick * gN + alarm * gA; R += room[::-1] * gR + wind[::-1] * gW + crick[::-1] * gN + alarm * gA
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
BELLS = []
SFX = np.zeros((2, N)); L0, R0 = L.copy(), R.copy(); L[:] = 0; R[:] = 0
for i, tt in enumerate((43.95, 69.9)):
    w_ = swoosh(i); add(w_, max(0, tt - min(.18, len(w_) / SR * .4)), .5)
add(steps(5, 2.6, 180), 8.3, .12)
add(beep(1320), 18.2, .2); add(beep(1760), 18.35, .2)                                               # the plan window
add(steps(4, 2.4, 180), 23.0, .12); add(reverb(pluck(220), 1.0, .4, 1), 24.4, .4)                   # ambush
add(thump(1500, .05, 1.0), 33.6, .2); add(beep(2093, .05), 34.3, .15)                              # the detector, armed
for k in range(10): add(beep(2637, .1), 37.4 + k * .25, .3)                                          # alarm
add(beep(1320), 40.3, .2); add(static(.8), 40.5, .2)
add(steps(5, 5, 210), 44.0, .25); add(thump(120, .3, .5), 46.1, .4)                                 # Bruno lunges, Krai blocks
add(reverb(fwip(1.2, 3000, 300), 1.6, .5, 2), 52.6, .3)                                             # memory
add(reverb(boom(1.6), 1.8, .5, 3), 62.6, .4); add(static(1.0), 62.4, .25)                           # red
add(reverb(thump(80, .6, .9), 1.0, .4, 4), 70.2, .7); add(thump(2200, .05, 1.0), 70.6, .4); add(thump(2200, .05, 1.0), 70.8, .35)   # doors slam + lock
add(static(.8), 71.9, .25); add(reverb(boom(2.2), 2.4, .5, 5), 76.9, .5)
BELLS.append((reverb(chime([1568, 1976, 2349], .1, 2.0), 2.0, .45, 1), 40.4, .24, 0))
BELLS.append((reverb(chime([1047, 988, 784, 740, 523], .12, 2.4), 2.4, .5, 2), 77.0, .3, 0))
