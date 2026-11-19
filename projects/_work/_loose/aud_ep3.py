# ===== EPISODE 1/2: ambience (rooftop wind, classroom hum, gravity drone) =====
t = np.arange(N) / SR
room = lp(rs.randn(N), 400) * 1.5 + np.sin(2 * np.pi * 100 * t) * .05
wind = lp(rs.randn(N), 500) * 2.2 * (.6 + .4 * np.sin(2 * np.pi * t / 5.3))
drone = (np.sin(2 * np.pi * 52 * t) + .6 * np.sin(2 * np.pi * 78.3 * t) + .3 * np.sin(2 * np.pi * 104.6 * t)) * (.7 + .3 * np.sin(2 * np.pi * 3 * t)) * .5
gR, gW, gD = [np.zeros(N) for _ in range(3)]
def seg(a, b, v, arr):
    i, j = int(a * SR), int(b * SR); arr[i:j] = v
seg(0, 5.45, .05, gW); seg(25.2, 26.55, .05, gW); seg(74.8, 83.95, .05, gW); seg(5.45, 25.2, .04, gR); seg(26.55, 74.8, .04, gR); seg(83.95, END, .04, gR); seg(39.5, 66.5, .06, gD)
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
BELLS = []
SFX = np.zeros((2, N)); L0, R0 = L.copy(), R.copy(); L[:] = 0; R[:] = 0
for i, tt in enumerate((17.1, 44.5, 63.25, 72.9)):
    w_ = swoosh(i); add(w_, max(0, tt - min(.18, len(w_) / SR * .4)), .5)
add(beep(880), 2.7, .2); add(beep(1320), 2.9, .2); add(beep(880), 5.5, .2); add(beep(1320), 8.25, .2)          # announcements
add(thump(220, .2, .6), 17.6, .3); add(thump(220, .2, .6), 18.05, .3)                                          # Bruno's punches
add(steps(4, 2.6, 180), 25.25, .14); add(steps(10, 2.2, 190), 29.0, .1)
add(reverb(fwip(.9, 3000, 300), 1.6, .5, 1), 34.9, .3)                                                           # Victor appears
add(reverb(rumble(2.0, 44), 1.5, .3, 2), 39.5, .35)                                                              # gravity
add(reverb(boom(1.6), 1.2, .4, 3), 44.75, .5); add(crunch(1.0), 44.8, .3)                                        # Bruno slammed
add(steps(8, 6, 200), 47.8, .25); add(reverb(fwip(.5, 2000, 400), 1.0, .4, 4), 49.9, .3)                        # Ace dashes, frozen
add(warble(.8), 60.6, .15); add(beep(1760, .08), 62.0, .2); add(beep(1760, .08), 62.2, .2)                       # the gadget
add(warble(4.0, 2400) * .8, 63.3, .3)
for k in range(5): add(fwip(.25, 800, 4000), 63.6 + k * .42, .25, (k % 2) * .6 - .3)
add(reverb(fwip(1.0, 300, 2500), 1.4, .4, 5), 65.6, .3); add(crunch(1.0), 66.3, .25)                             # desks drop
add(thump(120, .3, .5), 68.0, .3); add(steps(10, 6, 190), 73.6, .22)
add(steps(6, 2.2, 170), 74.9, .14); add(steps(5, 2.4, 170), 84.0, .16)
add(static(.6), 84.6, .2); add(beep(1046, .25), 85.95, .25); add(beep(1568, .25), 89.3, .2); add(beep(2093, .3), 93.25, .25)
BELLS.append((reverb(chime([1568, 1976, 2349, 3136], .1, 2.0), 2.0, .45, 1), 29.4, .22, -.1))   # the stone pile
BELLS.append((reverb(chime([3136, 2349, 1976, 1568, 1175], .08, 2.0), 2.0, .5, 2), 86.0, .26, 0)) # Victor smiles
