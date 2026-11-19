# ===== EPISODE 1/2: ambience (classroom hum, rooftop wind, low drone) =====
t = np.arange(N) / SR
room = lp(rs.randn(N), 400) * 1.5 + np.sin(2 * np.pi * 100 * t) * .05
wind = lp(rs.randn(N), 500) * 2.2 * (.6 + .4 * np.sin(2 * np.pi * t / 5.3))
drone = (np.sin(2 * np.pi * 52 * t) + .6 * np.sin(2 * np.pi * 78.3 * t) + .3 * np.sin(2 * np.pi * 104.6 * t)) * (.7 + .3 * np.sin(2 * np.pi * 3 * t)) * .5
gR, gW, gD = [np.zeros(N) for _ in range(3)]
def seg(a, b, v, arr):
    i, j = int(a * SR), int(b * SR); arr[i:j] = v
seg(0, 12.4, .04, gR); seg(12.4, 24.8, .05, gW); seg(24.8, 56.9, .04, gR); seg(56.9, 59.5, .05, gW); seg(59.5, 77.1, .04, gR); seg(77.1, END, .06, gW); seg(0, END, .05, gD); seg(77.1, END, .09, gD)
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
for i, tt in enumerate((54.2, 63.2, 69.0)):
    w_ = swoosh(i); add(w_, max(0, tt - min(.18, len(w_) / SR * .4)), .5)
add(static(.4), 0.1, .15); add(beep(660, .2), 7.4, .2)
add(reverb(rumble(5.0, 34), 2, .4, 1), 12.6, .35)                                                  # the sleeping origin
for k in range(4): add(reverb(thump(50, .6, .3), 1.5, .4, 2), 18.8 + k * 1.43, .45)              # giant footsteps
add(static(.9), 38.4 + 1.6, .2)
add(steps(10, 3, 170), 42.2, .14)
add(beep(1760, .05), 49.6, .15); add(beep(1760, .05), 49.95, .15); add(beep(2093, .05), 50.3, .15)  # Krai's signal
add(warble(2.5, 2200) * .6, 51.7, .15)
for k in range(5): add(clink(2600), 51.9 + k * .45, .12)
add(siren(5.0, 520), 54.3, .3); add(siren(3.6, 470), 59.6, .22)                                  # red alert
for k in range(4): add(beep(880, .08), 59.7 + k * 1.0, .18)
add(steps(10, 7, 190), 63.3, .2); add(reverb(thump(150, .2, 1.0), .8, .3, 3), 64.7, .45)
for k in range(2): add(reverb(fwip(.5, 2000, 600), .8, .3, 4 + k), 66.4 + k * .4, .3)            # link beams
add(reverb(boom(1.4), 1.2, .4, 6), 69.5, .55); add(crunch(1.0), 69.55, .4)                       # Bruno breaks the door
add(reverb(fwip(.4, 600, 5000), 1.0, .4, 7), 71.4, .35); add(thump(110, .3, .8), 71.9, .45)     # Ace
add(steps(20, 7, 190), 74.6, .22); add(steps(12, 6, 190), 77.2, .16)
add(reverb(rumble(4.0, 40), 2, .4, 8), 80.2, .35); add(warble(4.0, 300) * .5, 80.3, .15)        # the energy wall
add(reverb(rumble(4.5, 30), 2.5, .45, 9), 86.2, .5); add(reverb(boom(2.0), 1.5, .4, 10), 87.6, .4)  # the origin opens its eyes
BELLS.append((reverb(chime([1568, 1976, 2349], .12, 2.0), 2.0, .5, 1), 13.0, .2, 0))
BELLS.append((reverb(chime([2093, 2637, 3136, 4186], .1, 2.0), 2.0, .45, 2), 65.9, .24, 0))      # the new power
BELLS.append((reverb(chime([3136, 2349, 1976, 1568, 1175], .1, 2.2), 2.2, .5, 3), 86.6, .26, 0))
