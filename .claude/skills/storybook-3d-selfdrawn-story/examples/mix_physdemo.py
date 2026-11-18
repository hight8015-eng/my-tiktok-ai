# physics FX demo: sound placed with the v4.33+ hit() engine (onset sync, variation, spacing, tiers, pre-hit dip)
import sys, numpy as np, wave
D = sys.argv[1]; src = open(sys.argv[2]).read(); top = src[:src.index('# ===== EPISODE 1/2')]
sys.argv = ['audio.py', D]; G = {}; exec(top, G)
for k in ('L', 'R'): G[k][:] = 0
hit, add, SR, N, END = G['hit'], G['_addS'], G['SR'], G['N'], G['END']; rs = np.random.RandomState(2)
def thud(f=150, dur=.18, g=.4, t=0):   # small object landing: short low knock, randomised
    n = int(dur * SR); x = np.arange(n) / SR; s = np.sin(2 * np.pi * f * (1 + rs.uniform(-.1, .1)) * x) * np.exp(-x / .05) + rs.randn(n) * np.exp(-x / .01) * .3; add(s, t, g)
def water(a, b, g=.25):   # pouring water: band noise with bubbling flutter, soft ends
    n = int((b - a) * SR); x = np.arange(n) / SR; s = G['bp'](rs.randn(n), 600, 3200) * (.6 + .4 * np.abs(np.sin(2 * np.pi * 7.3 * x) * np.sin(2 * np.pi * 3.1 * x + 1)))
    s *= np.clip(x / .2, 0, 1) * np.clip((b - a - x) / .3, 0, 1); add(s, a, g)
L_ = 2.6
# D1 falling objects
for t, f in ((.59, 120), (.71, 95), (.83, 140)): thud(f, .25, .8, t)
for k in range(14): thud(380 + rs.rand() * 200, .12, .25, .97 + rs.rand() * .55)
# D2 snap + pot + ice
hit('click', 2.6 + .95, .6, tier='small'); hit('crash', 2.6 + 1.0, .7, -.2); hit('crash', 2.6 + 1.45, .55, .3); hit('shimmer', 2.6 + 1.47, .35, .3, tier='small')
# D3 chains snap one by one, links clatter
for k, tt in enumerate((5.2 + .9, 5.2 + 1.35, 5.2 + 1.75)): hit('metal_hit', tt, .6, (k - 1) * .4)
hit('rattle', 6.9, .35, tier='small')
# D4 water
water(7.8 + .25, 7.8 + 2.5, .55)
# D5 charge -> fire -> hit
hit('riser', 10.4 + .15, .45); hit('whoosh', 10.4 + 1.45, .55); hit('explosion', 10.4 + 1.95, .75, tier='mid')
# D6 stomp: the big hit of the scene, cracks crackle as they run
hit('mboom', 13.0 + .75, .9, tier='big'); add(G['scratch'](.6, 2600, 9), 13.0 + .78, .25)
# D7 two slashes, the log splits
hit('whoosh', 15.6 + .68, .55, .3); hit('whoosh', 15.6 + 1.33, .55, -.3); hit('bang', 15.6 + 1.38, .5)
# D8 ultimate: rising tension, a held breath (pre-hit dip), the cut, the stone gives way
hit('mrise', 18.2 + .1, .4); hit('kwing', 18.2 + 1.0, .9, tier='big', lead='whoosh'); hit('crash', 18.2 + 1.55, .7)
# D9 lightning + explosion + rubble
hit('noise', 20.8 + .55, .45); hit('explosion', 20.8 + .95, 1.0, tier='big'); hit('rattle', 20.8 + 1.4, .4, tier='small')
G['sfx_report']()
mix = np.stack([G['L'], G['R']])[:, :int(END * SR)]; mix /= max(1e-9, np.abs(mix).max()) / .9
with wave.open(D + '/aud/demo.wav', 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix.T * 32767).astype(np.int16).tobytes())
print('ok', mix.shape)
