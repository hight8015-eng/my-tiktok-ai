# ===== EPISODE 1/2: ambience (classroom hum, rooftop wind, power drone) =====
t = np.arange(N) / SR
room = lp(rs.randn(N), 400) * 1.5 + np.sin(2 * np.pi * 100 * t) * .05
wind = lp(rs.randn(N), 500) * 2.2 * (.6 + .4 * np.sin(2 * np.pi * t / 5.3))
drone = (np.sin(2 * np.pi * 52 * t) + .6 * np.sin(2 * np.pi * 78.3 * t) + .3 * np.sin(2 * np.pi * 104.6 * t)) * (.7 + .3 * np.sin(2 * np.pi * 3 * t)) * .5
gR, gW, gD = [np.zeros(N) for _ in range(3)]
def seg(a, b, v, arr):
    i, j = int(a * SR), int(b * SR); arr[i:j] = v
seg(0, 5.8, .04, gR); seg(5.8, 58.65, .05, gW); seg(58.65, END, .04, gR); seg(48.7, 58.65, .06, gD); seg(76.3, 91.35, .06, gD); seg(97.2, END, .05, gD)
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
for i, tt in enumerate((25.45, 68.1, 78.8, 88.55)):
    w_ = swoosh(i); add(w_, max(0, tt - min(.18, len(w_) / SR * .4)), .5)
add(steps(4, 2.4, 190), 0.05, .14); add(thump(140, .25, .3), 1.65, .25)                                           # Krai comes in, door
add(steps(10, 2.8, 180), 5.85, .12)                                                                                # four on the roof
add(reverb(fwip(.6, 2500, 400), 1.2, .4, 1), 16.35, .3); add(reverb(rumble(4.5, 40), 1.5, .35, 2), 17.2, .35)   # Bruno touches, power surges
add(thump(90, .4, .2), 19.0, .3); add(thump(90, .4, .2), 20.2, .3); add(thump(80, .5, .2), 21.2, .35)           # muscles
add(reverb(fwip(.4, 600, 5000), 1.0, .4, 3), 25.95, .35); add(fwip(.3, 5000, 800), 28.05, .3)                     # Ace dashes
for k in range(9): add(clink(1800 + 300 * (k % 4)), 33.4 + k * .36, .22, (k % 2) * .6 - .3)                      # scrap assembles
add(ting(1320, 1.2), 36.6, .2)
add(reverb(chime([2637, 3136, 3951], .07, 1.6), 1.6, .5, 4), 42.8, .2)                                         # Krai's eye
for k in range(6): add(beep(1760 + 220 * (k % 3), .06), 45.6 + k * .45, .12)
add(siren(2.4, 520), 51.0, .3); add(beep(880, .2), 53.15, .25); add(beep(660, .25), 55.45, .25); add(siren(3.3, 480), 55.3, .22)   # exposed
for tt in (59.15, 59.85, 60.45, 61.15, 61.65): add(reverb(thump(80, .35, .9), .8, .3, 5), tt, .5)                # door bangs
add(reverb(boom(1.2), 1.0, .35, 6), 62.45, .45); add(crunch(1.0), 62.5, .3); add(steps(14, 6, 200), 62.75, .2)  # door bursts
add(thump(110, .3, .8), 68.8, .5); add(reverb(boom(.8), .8, .3, 7), 68.85, .3)                                   # Bruno's punch
for k in range(4): add(fwip(.2, 900, 4500), 71.05 + k * .625, .3, (k % 2) * .6 - .3)                             # Ace dodges
for k in range(8): add(clink(1500 + 250 * (k % 3)), 73.7 + k * .17, .2); add(ting(620, .8), 75.5, .3); add(thump(160, .2, .9), 75.45, .3)   # shield
add(reverb(rumble(1.8, 36), 1.4, .3, 8), 77.0, .4); add(reverb(rumble(1.0, 44), 1.2, .3, 9), 78.8, .45); add(crunch(1.0), 78.9, .3)        # rock wall
add(thump(120, .3, 1.0), 80.2, .45)
add(beep(1320, .1), 82.6, .2); add(beep(1760, .1), 82.85, .2)                                                    # weak point
add(reverb(boom(1.6), 1.2, .4, 10), 89.1, .55); add(crunch(1.0), 89.15, .35)                                     # floor smash
add(steps(16, 7, 190), 91.4, .2); add(thump(140, .25, .3), 97.0, .25)
add(static(.9), 97.2, .25); add(beep(523, .4), 98.15, .25); add(beep(392, .5), 101.0, .3)
BELLS.append((reverb(chime([1568, 1976, 2349], .1, 2.0), 2.0, .45, 1), 12.4, .2, -.1))       # red stone
BELLS.append((reverb(chime([1760, 2217, 2637], .1, 2.0), 2.0, .45, 2), 23.4, .2, .1))        # green
BELLS.append((reverb(chime([1976, 2489, 2960], .1, 2.0), 2.0, .45, 3), 30.6, .2, -.1))       # yellow
BELLS.append((reverb(chime([2093, 2637, 3136, 4186], .1, 2.0), 2.0, .45, 4), 38.4, .22, 0))  # blue
BELLS.append((reverb(chime([3136, 2349, 1976, 1568, 1175], .08, 2.0), 2.0, .5, 5), 104.0, .26, 0))  # the game has only begun
