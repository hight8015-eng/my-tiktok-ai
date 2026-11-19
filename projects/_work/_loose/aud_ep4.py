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
