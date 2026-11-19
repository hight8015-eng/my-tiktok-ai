# ===== EPISODE 1/2: ambience (classroom hum, rooftop wind, low drone) =====
t = np.arange(N) / SR
room = lp(rs.randn(N), 400) * 1.5 + np.sin(2 * np.pi * 100 * t) * .05
wind = lp(rs.randn(N), 500) * 2.2 * (.6 + .4 * np.sin(2 * np.pi * t / 5.3))
drone = (np.sin(2 * np.pi * 52 * t) + .6 * np.sin(2 * np.pi * 78.3 * t) + .3 * np.sin(2 * np.pi * 104.6 * t)) * (.7 + .3 * np.sin(2 * np.pi * 3 * t)) * .5
gR, gW, gD = [np.zeros(N) for _ in range(3)]
def seg(a, b, v, arr):
    i, j = int(a * SR), int(b * SR); arr[i:j] = v
seg(0, 98.9, .06, gW); seg(98.9, END, .05, gW); seg(0, 70.1, .1, gD); seg(98.9, END, .08, gD)
gR, gW, gD = [lp(g, 3) for g in (gR, gW, gD)]
L += room * gR + wind * gW + drone * gD; R += room[::-1] * gR + wind[::-1] * gW + drone * gD
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
def warble(dur, f=1800):
    t_ = np.arange(int(dur * SR)) / SR; return np.sin(2 * np.pi * np.cumsum(f + 900 * np.sign(np.sin(2 * np.pi * 9 * t_))) / SR) * .35 * np.minimum(1, t_ / .05)
def siren(dur, f=600):
    t_ = np.arange(int(dur * SR)) / SR; return np.sin(2 * np.pi * np.cumsum(f + 250 * np.sin(2 * np.pi * .9 * t_)) / SR) * .3 * np.minimum(1, t_ / .2) * np.minimum(1, (dur - t_) / .3)
def clink(f=2400):
    t_ = np.arange(int(.25 * SR)) / SR; return (np.sin(2 * np.pi * f * t_) + .6 * np.sin(2 * np.pi * f * 1.71 * t_)) * np.exp(-t_ / .05) * .4
BELLS = []
SFX = np.zeros((2, N)); L0, R0 = L.copy(), R.copy(); L[:] = 0; R[:] = 0
for i, tt in enumerate((9.0, 57.1, 60.1)):
    w_ = swoosh(i); add(w_, max(0, tt - min(.18, len(w_) / SR * .4)), .5)
add(reverb(rumble(3.5, 30), 2.5, .5, 1), 0.0, .5); add(reverb(boom(2.0), 1.5, .45, 2), .4, .4)       # the origin
add(reverb(chime([1568, 1976, 2349, 3136], .1, 2.0), 2.0, .45, 3), 2.2, .2)
for k in range(3): add(reverb(thump(45, .7, .3), 1.5, .45, 4), 4.4 + k * 1.5, .45)
add(reverb(rumble(4.3, 36), 2, .45, 5), 9.0, .55); add(crunch(1.0), 9.6, .25); add(crunch(1.0), 11.2, .25)   # the city shakes
add(static(.5), 13.4, .2); add(beep(523, .3), 17.2, .2); add(beep(784, .3), 19.6, .2)
add(reverb(chime([2637, 3136, 3951], .07, 1.6), 1.6, .5, 6), 23.9, .18)
for k in range(6): add(beep(1760, .05), 26.5 + k * .45, .14)
add(beep(330, .4), 28.6, .25)                                                                     # no weak point
add(reverb(chime([1568, 2093, 2637, 3136, 2637, 2093], .08, 2.0), 2.0, .5, 7), 32.4, .2)            # every stone glows
add(reverb(rumble(5.5, 44), 2, .4, 8), 36.0, .4); add(warble(5.0, 300) * .5, 36.2, .14)           # draining
for k in range(8): add(clink(1500 + 250 * (k % 3)), 42.4 + k * .3, .14)
add(reverb(boom(1.0), 1.0, .35, 9), 45.4, .35)                                                     # Bruno roars
add(reverb(fwip(.5, 600, 5000), 1.0, .4, 10), 47.9, .3)
for k in range(3): add(reverb(fwip(.4, 2000, 600), .8, .3, 11 + k), 53.4 + k * .5, .28)             # the link
add(reverb(boom(1.6), 1.2, .45, 14), 57.9, .55); add(crunch(1.0), 58.0, .4); add(crunch(1.0), 58.9, .3)   # pillar 1
add(reverb(fwip(.4, 600, 5000), 1.0, .4, 15), 60.15, .3); add(reverb(boom(1.4), 1.2, .45, 16), 60.75, .5); add(crunch(1.0), 61.3, .3)   # pillar 2
add(warble(1.4, 2400) * .6, 62.3, .2); add(reverb(fwip(1.0, 2000, 120), 1.4, .45, 17), 63.4, .35)   # pillar 3 off
add(reverb(rumble(5.0, 28), 3, .5, 18), 65.2, .55)                                                 # the origin falls apart
add(reverb(fwip(2.4, 1200, 80), 2.0, .45, 19), 70.8, .4)                                            # the wall fades
add(reverb(rumble(1.8, 60), 1.5, .35, 20), 73.6, .35)                                               # the gate
add(steps(18, 5, 190), 75.4, .14)
add(static(.4), 78.3, .15); add(static(.3), 79.5, .12)
for k in range(8): add(reverb(thump(700 + 60 * (k % 3), .06, .3), .6, .3, 21), 85.0 + k * .32, .12)   # the laugh (low ticks)
add(static(.9), 90.7, .2); add(beep(1046, .25), 93.5, .25); add(beep(1568, .3), 96.5, .25)
add(reverb(rumble(7.0, 32), 3, .5, 22), 101.6, .45); add(warble(6.0, 140) * .5, 102.0, .18)       # the ship
BELLS.append((reverb(chime([2093, 2637, 3136, 4186, 5274], .08, 2.4), 2.4, .5, 1), 70.5, .26, 0))   # freedom
BELLS.append((reverb(chime([3136, 2349, 1976, 1568, 1175], .1, 2.2), 2.2, .5, 2), 104.6, .26, 0))  # the ship
