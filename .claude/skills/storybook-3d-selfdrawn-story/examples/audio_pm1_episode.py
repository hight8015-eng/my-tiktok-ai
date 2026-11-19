# ===== EPISODE 1/2: ambience: THE PUPPET MASTER ep1 (rainy neon city; truck engine; alley drips; silence when the power is used) =====
t = np.arange(N) / SR
rain = bp(rs.randn(N), 1500, 9000) * .9 + lp(rs.randn(N), 500) * 1.6; rainR = bp(rs.randn(N), 1500, 9000) * .9 + lp(rs.randn(N), 500) * 1.6
hum = np.sin(2 * np.pi * 55 * t) * .25 + np.sin(2 * np.pi * 110 * t) * .08 + lp(rs.randn(N), 180) * 2.2      # distant city hum
eng = (np.sin(2 * np.pi * 38 * t + 3 * np.sin(2 * np.pi * 2.1 * t)) * .7 + lp(rs.randn(N), 140) * 4) * (.8 + .2 * np.sin(2 * np.pi * 7 * t))   # truck engine
amb = np.ones(N) * .05; hum_g = np.ones(N) * .05; eng_g = np.zeros(N)
def seg(a, b, v, arr):
    i, j = int(a * SR), int(b * SR); arr[i:j] = v
seg(3.8, 11.47, .02, amb); seg(3.8, 11.0, .09, eng_g); seg(16.71, 17.55, .025, amb)      # inside the truck: rain muffled, engine
seg(38.06, 72.9, .035, amb); seg(38.06, 72.9, .02, hum_g)                                    # alley: lighter rain
seg(45.9, 53.9, .006, amb); seg(45.9, 53.9, .004, hum_g)                                     # the power: the world goes quiet
seg(67.0, 72.9, .02, amb)
amb = lp(amb, 3); hum_g = lp(hum_g, 3); eng_g = lp(eng_g, 2)
L += rain * amb + hum * hum_g + eng * eng_g; R += rainR * amb + hum * hum_g * .9 + eng * eng_g
# ===== EPISODE 2/2: SFX events + the series MOTIF (the planted thought: a glassy ting with a reversed tail) =====
def ting(f=1760, dur=1.4):
    t_ = np.arange(int(dur * SR)) / SR; return (np.sin(2 * np.pi * f * t_) * np.exp(-t_ / .5) + .4 * np.sin(2 * np.pi * f * 2.76 * t_) * np.exp(-t_ / .15)) * np.minimum(1, t_ / .002)
def heart(n=4, bpm=62):
    x = np.zeros(int((n * 60 / bpm + .6) * SR))
    for k in range(n):
        for d, g in ((0, 1), (.18, .6)): c = thump(52, .3, .15); i = int((k * 60 / bpm + d) * SR); x[i:i + len(c)] += c[:len(x) - i] * g
    return x
def swell(dur, f=73, g=.3):
    t_ = np.arange(int(dur * SR)) / SR; return (np.sin(2 * np.pi * f * t_) + .5 * np.sin(2 * np.pi * f * 1.5 * t_)) * np.sin(np.pi * t_ / dur) ** 2 * g
def crackle(dur, seed=0):
    r_ = np.random.RandomState(seed); x = bp(r_.randn(int(dur * SR)), 2000, 7000) * (r_.rand(int(dur * SR)) > .995) * 6 + bp(r_.randn(int(dur * SR)), 200, 900) * .4
    return x * np.minimum(1, np.arange(len(x)) / (.1 * SR)) * np.minimum(1, (len(x) - np.arange(len(x))) / (.3 * SR))
def thought(f=1320):  # the motif: reversed shimmer rising into a clean ting
    tg = ting(f, 1.6); rv = ting(f * 1.5, .9)[::-1] * .5; return np.concatenate([rv, tg])
BELLS = []
SFX = np.zeros((2, N)); L0, R0 = L.copy(), R.copy(); L[:] = 0; R[:] = 0
hit('hit_dramatic', 0.04, .7, tier='mid')                                                     # hook
add(fwip(.35, 300, 2600), .9, .3, -.3); add(crackle(1.6, 1), 1.0, .25, -.3)                    # the fire man's palm in the opening crane
add(thump(48, .6, .1), 2.62, .55)                                                            # "ยกเว้นผม"
add(reverb(ting(2600, .5), .8, .3, 2), 6.25, .12, .2)                                         # the metal tag
add(scrape(1.0), 12.3, .2); add(hiss(.7, .8), 12.75, .14); add(thump(90, .4, .3), 12.85, .5)  # air brakes, the truck stops
hit('riser', 14.0, .45, tier='small'); hit('hit_dramatic', 15.28, .9, tier='big'); add(hiss(.35, 1.4), 15.28, .1)   # ZERO CITY blazes on
hit('metal_hit', 16.75, .7); add(reverb(creak(.7, 260), 1.2, .3, 3), 16.8, .14)                # the rear doors
add(rumble(2.2, 40), 17.6, .4); add(scrape(1.6), 17.7, .16)                                     # the gate grinds open
add(steps(6, 2.0, 160), 17.9, .14)
for k in range(3): add(thump(900, .05, 1.0), 22.0 + k * .11, .16, .3)                          # knuckle cracks
hit('whoosh', 24.2, .6, -.2); add(crackle(1.9, 2), 24.35, .3, -.2)                              # the palm ignites
add(thump(70, .5, .4), 26.65, .6); add(creak(1.0, 180), 26.7, .18, .3); hit('rattle', 26.8, .35, tier='small')   # the car comes up
add(hiss(.4, .5), 29.75, .12)                                                                 # Aren's sad little puff
hit('laugh', 30.25, .35, -.4, tier='small')                                                   # a thug laughs behind him
hit('whoosh', 31.25, .45, tier='small')                                                       # time passes
add(steps(8, 2.6, 150), 32.7, .16); add(hiss(.8, .6), 35.0, .16); add(thump(60, .5, .2), 35.0, .4)   # the gang closes in; the flame dies
add(steps(6, 2.2, 170), 35.7, .12, -.3)
add(steps(6, 2.0, 170), 38.1, .14); add(steps(8, 2.4, 140), 39.0, .12, .4)                    # into the alley, followed
add(swell(2.6, 65, .3), 41.0, .4)                                                             # dread
add(thump(110, .3, .5), 44.95, .55); hit('punch', 44.97, .35, tier='small')                    # back hits the wall
BELLS.append((heart(3, 58), 45.9, .5, 0))                                                    # silence + heartbeat as he thinks
BELLS.append((thought(1320), 47.6 - .9, .55, 0)); hit('hit_dramatic', 47.62, .8, tier='big', lead='whoosh')   # the thought goes in (red eyes)
BELLS.append((reverb(ting(3300, 2.4), 2.4, .5, 9), 49.6, .12, 0))                             # the freeze: a thin ring in the air
add(steps(6, 2.3, 170), 53.0, .14, .2)                                                       # they walk away
BELLS.append((reverb(ting(990, 1.6), 1.6, .4, 4), 56.9, .2, 0))                               # the loose threads
BELLS.append((thought(1760), 60.25 - .9, .35, .2))                                            # the seed enters a head
add(swell(2.5, 82, .25), 64.2, .35)                                                          # the first smile
add(swell(3.4, 55, .4), 67.0, .5)                                                            # the dark end of the alley
add(thump(1400, .04, 1.0), 69.45, .4, .3); add(thump(900, .05, 1.0), 69.6, .3, .3)            # the hammer clicks back
add(hiss(1.2, 2.0) * np.linspace(1, .4, int(1.2 * SR)), 69.9, .05, .3)                        # laser hum
hit('hit_dramatic', 70.4, 1.0, tier='big')                                                    # the dot on his forehead
SFX = np.stack([L.copy(), R.copy()]); BED = np.stack([L0, R0])
BELL = np.zeros((2, N)); L[:] = 0; R[:] = 0
for sig, tt, g, pn in BELLS: add(sig, tt, g, pn)
BELL = np.stack([L.copy(), R.copy()])
# ---------- VO + mix (speech first; generic, no need to edit) ----------
