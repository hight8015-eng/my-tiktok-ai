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
# E1 energy hits the crate tower, crates crash into each other and the ground
hit('riser', .1, .4); hit('whoosh', 1.0, .55); hit('explosion', 1.35, .8, tier='big')
for k in range(12): thud(110 + rs.rand() * 80, .25, .55, 1.5 + rs.rand() * 1.1)
# E2 ultimate: held breath, the cut + impact frame, the boulder bursts, rubble rains down
hit('mrise', 3.3, .4); hit('kwing', 4.3, .95, tier='big', lead='whoosh'); hit('crash', 4.75, .7); hit('explosion', 4.78, .6, tier='big')
for k in range(10): thud(140 + rs.rand() * 120, .2, .45, 5.0 + rs.rand() * 1.0)
G['sfx_report']()
mix = np.stack([G['L'], G['R']])[:, :int(END * SR)]; mix /= max(1e-9, np.abs(mix).max()) / .9
with wave.open(D + '/aud/demo.wav', 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix.T * 32767).astype(np.int16).tobytes())
print('ok', mix.shape)
