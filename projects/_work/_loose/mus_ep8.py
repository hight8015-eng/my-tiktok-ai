# ===== EPISODE: "เกมเอาชีวิตรอด ตอน 8" =====
CH.update({'Dm': [50, 62, 65, 69], 'F': [41, 60, 65, 69], 'E': [40, 64, 68, 71], 'Gm': [43, 62, 67, 70], 'Bb': [46, 62, 65, 70]})
def pulse(t0, t1, m, step=.5, g=.5):
    k = 0
    while t0 + k * step < t1: put(t0 + k * step, bass(m, step + .1), g * (1 if k % 2 == 0 else .7)); k += 1
def tick8(t0, t1, m=81, step=.25, g=.18):
    k = 0
    while t0 + k * step < t1: put(t0 + k * step, pizz(m if k % 4 else m + 5, .2, .05), g, .3 * (1 if k % 2 else -1)); k += 1
def darkbar(t0, d):
    put(t0, pad([33, 45, 52, 57], d, .6, .6, 700), .5, 0); pulse(t0, t0 + d, 33, .6, .45)
    for k in range(int(d / 1.2)): put(t0 + .3 + k * 1.2, mbox([76, 75, 76, 72][k % 4], 1.3), .18, .1)
def prog(t0, chords, dur, g=.45, bright=1000):
    for k, ch in enumerate(chords): put(t0 + k * dur, pad(CH[ch][1:], dur, .3, .5, bright), g, 0)
SIL = [(70.0, 70.6)]
put(0, pad([33, 45, 51, 58], 9.0, .2, .4, 600), .65, 0); pulse(0, 9.0, 28, .3, .7)                     # the origin
prog(9.0, ['Dm', 'Bb', 'E', 'E'], 2.15, .5, 900); pulse(9.0, 17.6, 28, .5, .6)
put(17.1, pad([45, 57, 60, 64], 6.7, .3, .6, 1000), .45, 0)                                             # the final test
put(23.8, pad([57, 60, 64, 71], 8.4, .6, .5, 1500), .35, 0)
for k, m in enumerate([76, 81, 83, 84, 83, 81]): put(24.1 + k * 1.3, mbox(m, 1.3), .22, -.1)          # Krai reads it
put(32.2, pad([33, 45, 52, 59], 9.4, 1.0, .8, 800), .55, 0); pulse(35.9, 41.6, 28, .5, .55)             # draining
prog(41.6, ['Am', 'C', 'G', 'E', 'Am', 'F'], 1.65, .45, 1300); tick8(41.6, 51.5, 84, .25, .14); pulse(45.2, 51.5, 33, .25, .55)   # the plan
put(51.5, pad([45, 57, 60, 64], 1.5, .1, .5, 1200), .4, 0)
prog(53.0, ['Am', 'F', 'C', 'G', 'Am', 'F', 'E', 'E'], 2.1, .55, 1600); pulse(53.0, 69.8, 33, .2, .7); tick8(57.1, 69.8, 88, .2, .18)   # the pillars fall
prog(70.6, ['A', 'D', 'A', 'E', 'A'], 1.6, .5, 1700); pulse(70.6, 78.2, 45, .4, .45)                    # freedom
for k, m in enumerate([81, 85, 88, 93, 88, 85]): put(70.8 + k * 1.2, mbox(m, 1.3), .22, .1)
put(78.2, pad([45, 57, 60, 64], 6.6, .3, .6, 900), .4, 0)
put(84.8, pad([33, 45, 51, 57], 14.1, .3, .3, 650), .6, 0); pulse(84.8, 98.9, 28, .6, .6)              # the Director laughs
for k, m in enumerate([76, 75, 72, 71]): put(91.0 + k * 1.6, mbox(m, 1.6), .22, 0)
put(98.9, pad([45, 57, 64, 69], 5.6, 1.0, .6, 1400), .4, 0)                                              # dawn
put(104.5, pad([33, 45, 52, 59], END - 104.5, .6, .4, 700), .65, 0); pulse(104.5, END - 1.0, 28, .45, .7)   # the ship
prog(108.8, ['Dm', 'E', 'Am'], 2.4, .5, 1100)
put(0, pad([28, 40, 47], END, 2.0, 1.0, 300), .25, 0)
