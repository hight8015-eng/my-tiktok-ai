# ===== EPISODE 1/2: ambience (classroom hum, rooftop wind, low drone) =====
t = np.arange(N) / SR
room = lp(rs.randn(N), 400) * 1.5 + np.sin(2 * np.pi * 100 * t) * .05
wind = lp(rs.randn(N), 500) * 2.2 * (.6 + .4 * np.sin(2 * np.pi * t / 5.3))
drone = (np.sin(2 * np.pi * 52 * t) + .6 * np.sin(2 * np.pi * 78.3 * t) + .3 * np.sin(2 * np.pi * 104.6 * t)) * (.7 + .3 * np.sin(2 * np.pi * 3 * t)) * .5
gR, gW, gD = [np.zeros(N) for _ in range(3)]
def seg(a, b, v, arr):
    i, j = int(a * SR), int(b * SR); arr[i:j] = v
seg(0, 12.15, .04, gR); seg(12.15, 14.75, .05, gW); seg(14.75, 33.75, .04, gR); seg(33.75, END, .03, gR); seg(0, END, .05, gD); seg(40.15, 67.6, .08, gD)
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
for i, tt in enumerate((46.05, 67.6)):
    w_ = swoosh(i); add(w_, max(0, tt - min(.18, len(w_) / SR * .4)), .5)
add(siren(2.8, 480), 0.2, .25); add(beep(523, .3), 1.0, .2)
add(reverb(thump(60, .5, .2), 1.2, .4, 1), 3.6, .5); add(static(.3), 3.55, .15)                 # lights die
add(reverb(fwip(2.8, 200, 120), 1.5, .4, 2), 5.5, .3)                                            # door creaks open
for k in range(4): add(beep(880, .08), 8.6 + k * 1.0, .18)                                       # countdown ticks
add(reverb(thump(50, .6, .3), 1.5, .4, 3), 12.4, .5); add(reverb(thump(50, .6, .3), 1.5, .4, 3), 13.5, .5)   # giant footsteps
add(steps(6, 6, 200), 14.8, .2); add(reverb(thump(150, .2, 1.0), .8, .3, 4), 16.65, .5); add(beep(330, .4), 17.3, .25); add(beep(262, .5), 17.75, .25)   # door slams, locked
add(warble(3.6, 2200) * .6, 19.3, .15)
for k in range(6): add(clink(2600), 19.6 + k * .55, .12)  # Neo hacks
for k in range(6): add(reverb(thump(80, .35, .9), .8, .3, 5), 23.2 + k * .714, .4)                 # bangs on the door
add(reverb(chime([2637, 3136, 3951], .07, 1.6), 1.6, .5, 6), 27.3, .18)
add(reverb(fwip(.5, 300, 900), .8, .3, 7), 29.1, .3); add(thump(200, .2, .6), 29.9, .2)          # hatch lid
add(steps(8, 3, 160), 34.2, .14)
for k in range(5): add(clink(900 + 150 * k), 34.0 + k * .5, .12)   # ladder
add(reverb(rumble(4.0, 38), 2, .4, 8), 40.2, .3)                                                  # the core hums
add(reverb(fwip(1.2, 400, 4000), 1.5, .4, 9), 46.3, .35); add(reverb(rumble(2.5, 60), 1.5, .3, 10), 46.5, .3)   # the blue stone flares
add(static(.6), 50.1, .2); add(beep(1046, .25), 50.7, .25); add(beep(1568, .25), 54.7, .2)
for k in range(3): add(reverb(fwip(.4, 2000, 600), .8, .3, 11 + k), 58.1 + k * .5, .25)        # link beams
for k in range(5): add(reverb(thump(900, .05, 1.0), .9, .4, 14), 69.1 + k * .42, .3)          # clapping
add(steps(6, 2.2, 150), 71.6, .16); add(steps(6, 4, 170), 84.3, .18)
add(reverb(boom(1.0), 1.0, .3, 15), 90.4, .3)
BELLS.append((reverb(chime([2093, 2637, 3136, 4186], .1, 2.0), 2.0, .45, 1), 52.6, .26, 0))      # origin power
BELLS.append((reverb(chime([1568, 1175, 1047, 784], .12, 2.0), 2.0, .5, 2), 74.9, .22, 0))       # the flashback
