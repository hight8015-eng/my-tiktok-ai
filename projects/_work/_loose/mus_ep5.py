# ===== EPISODE: "เกมเอาชีวิตรอด ตอน 5" =====
CH.update({'Dm': [50, 62, 65, 69], 'F': [41, 60, 65, 69], 'E': [40, 64, 68, 71], 'Gm': [43, 62, 67, 70], 'Bb': [46, 62, 65, 70]})
def pulse(t0, t1, m, step=.5, g=.5):
    k = 0
    while t0 + k * step < t1: put(t0 + k * step, bass(m, step + .1), g * (1 if k % 2 == 0 else .7)); k += 1
def tick8(t0, t1, m=81, step=.25, g=.18):
    k = 0
    while t0 + k * step < t1: put(t0 + k * step, pizz(m if k % 4 else m + 5, .2, .05), g, .3 * (1 if k % 2 else -1)); k += 1
def prog(t0, chords, dur, g=.45, bright=1000):
    for k, ch in enumerate(chords): put(t0 + k * dur, pad(CH[ch][1:], dur, .3, .5, bright), g, 0)
SIL = [(62.3, 62.65)]
put(0, pad([57, 60, 64, 71], 8.2, .8, .6, 1400), .35, 0)
for k, m in enumerate([76, 81, 83, 84, 83, 81]): put(.4 + k * 1.3, mbox(m, 1.4), .25, -.1)
t = waltz(8.2, SLY[:4], .45, inst='pizz', mel_g=.5, pad_g=.25, bass_g=.5, pan=.1)
t = waltz(13.7, SLY[4:8], .55, inst='pizz', mel_g=.5, pad_g=.25, bass_g=.5, pan=.1)
put(22.85, pad([45, 57, 60, 63], 9.2, .3, .5, 900), .5, 0); pulse(22.85, 32.0, 33, .5, .5)
put(32.1, pad([57, 60, 64], 5.2, 1.0, .5, 1100), .3, 0); for_ = [put(32.4 + k * 1.2, mbox(m, 1.3), .22, .1) for k, m in enumerate([81, 76, 81, 83])]
prog(37.3, ['Am', 'F', 'E'], 2.2, .5, 1300); pulse(37.3, 43.9, 33, .25, .55); tick8(37.3, 43.9, 88, .25, .16)
prog(43.95, ['Dm', 'E', 'Am'], 1.7, .5, 1200); pulse(43.95, 49.0, 33, .2, .6)
put(49.1, pad([45, 57, 60, 64], 7.1, .6, .6, 900), .4, 0)
for k, m in enumerate([72, 71, 69, 68, 69]): put(49.4 + k * 1.4, celesta(m, 1.6), .25, -.1)
put(56.25, pad([53, 57, 60, 64], 6.0, .6, .6, 1000), .4, 0)
put(62.65, pad([33, 45, 51, 57], END - 62.65, .3, .3, 700), .6, 0); pulse(62.65, END - .3, 28, .5, .6); tick8(64.9, END - .3, 84, .25, .16)
