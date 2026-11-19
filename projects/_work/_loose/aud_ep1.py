# ===== EPISODE 1/2: ambience (school yard, helicopter chop, classroom hum, rooftop wind) =====
t = np.arange(N) / SR
crowd = bp(rs.randn(N), 300, 2500) * (.6 + .4 * np.abs(np.sin(2 * np.pi * t / 2.3) * np.sin(2 * np.pi * t / 3.1)))
chop = lp(rs.randn(N), 180) * 3 * (.35 + .65 * (np.sin(2 * np.pi * 11.5 * t) > .55)) + bp(rs.randn(N), 900, 2500) * .2
room = lp(rs.randn(N), 400) * 1.5 + np.sin(2 * np.pi * 100 * t) * .05
wind = lp(rs.randn(N), 500) * 2.2 * (.6 + .4 * np.sin(2 * np.pi * t / 5.3))
gA, gH, gR, gW = [np.zeros(N) for _ in range(4)]
def seg(a, b, v, arr):
    i, j = int(a * SR), int(b * SR); arr[i:j] = v
seg(0, 4.2, .05, gA); seg(3.75, 37.95, .07, gH); seg(27.25, 37.95, .03, gH); seg(40.65, 67.15, .04, gR); seg(99.15, END, .04, gR); seg(67.15, 99.15, .05, gW)
gA, gH, gR, gW = [lp(g, 3) for g in (gA, gH, gR, gW)]
L += crowd * gA + chop * gH + room * gR + wind * gW; R += crowd[::-1] * gA + chop[::-1] * gH + room[::-1] * gR + wind[::-1] * gW
# ===== EPISODE 2/2: SFX events + the story MOTIF (the power-stone chime) on its own bus =====
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
def heartbeat(n, rate=1.3):
    x = np.zeros(int((n / rate + .5) * SR))
    for k in range(n):
        for dt, g in ((0, 1), (.22, .7)): s = thump(55, .25, .05) * g; i = int((k / rate + dt) * SR); x[i:i + len(s)] += s
    return x
BELLS = []
SFX = np.zeros((2, N)); L0, R0 = L.copy(), R.copy(); L[:] = 0; R[:] = 0
for i, tt in enumerate((8.55, 21.1, 72.15, 92.4)):
    w_ = swoosh(i); add(w_, max(0, tt - min(.18, len(w_) / SR * .4)), .5)
add(steps(7, 2.2, 180), .1, .15)
add(reverb(fwip(1.6, 300, 2000), 1.5, .3, 1), 9.2, .3)                                                          # the desk falls
for k, tt in enumerate((10.95, 12.3, 12.55, 12.85, 13.1, 13.4, 13.65, 13.95, 14.2, 14.45)): add(crunch(1.0) * .8, tt, .35 - .015 * k, (k % 3 - 1) * .4); add(thump(90, .3, .6), tt, .35 - .015 * k, (k % 3 - 1) * .4)
add(fwip(.7, 300, 1500), 17.1, .25); add(fwip(.7, 300, 1500), 17.6, .22); add(fwip(.7, 300, 1500), 18.1, .22)    # rappelling
add(steps(14, 6, 200), 21.2, .22); add(steps(9, 6, 170), 24.4, .22); add(thump(100, .3, .5), 25.9, .3)      # running, ducks under
add(heartbeat(6, 1.4), 27.3, .4)
add(steps(6, 2.2, 150), 30.3, .35)                                                                           # footsteps stop
add(hiss(.35, 1.2) * 3, 38.6, .3); add(reverb(fwip(1.2, 2500, 200), 1.6, .4, 2), 39.0, .25)                # the needle, fading out
add(beep(660, .1), 55.4, .2); add(static(.5), 55.35, .25); add(beep(880), 56.0, .2); add(beep(1320, .2), 57.6, .25)   # the screen boots
add(reverb(beep(1046, .25), 1.0, .3, 3), 58.4, .25); add(reverb(beep(1568, .25), 1.0, .3, 4), 58.6, .25)
add(thump(160, .3, .5), 65.4, .2)                                                                            # the door
for k in range(5): add(reverb(boom(1.5), 2.0, .5, 5 + k) * .7, 74.6 + k * 1.43, .35)                       # the giant's footsteps
add(rumble(2.0, 40), 77.0, .3)
add(reverb(boom(2.5), 2.5, .5, 9), 92.65, .6); add(crunch(1.0), 92.7, .4); add(rumble(2.5, 36), 92.7, .4)  # explosion
add(steps(12, 5.5, 200), 95.7, .2); add(thump(160, .3, .5), 99.2, .25)
for k in range(3): add(reverb(boom(1.5), 2.0, .5, 20 + k) * .6, 102.4 + k * 1.43, .3)
BELLS.append((reverb(chime([1568, 1976, 2349, 3136], .1, 2.0), 2.0, .45, 1), 80.4, .28, -.1))   # the stones
BELLS.append((reverb(chime([2349, 3136, 3951, 4699], .05, 2.0), 2.0, .5, 2), 83.75, .3, 0))     # he touches one
BELLS.append((reverb(chime([1568, 2349, 3136], .12, 2.0), 2.0, .45, 3), 85.0, .26, 0))          # the window
