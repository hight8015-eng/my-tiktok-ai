# ===== EPISODE: "เกมเอาชีวิตรอด ตอน 7" =====
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
SIL = [(63.0, 63.4)]
put(0, pad([33, 45, 51, 57], 12.4, .5, .4, 650), .55, 0); pulse(0, 12.4, 28, .7, .5)                   # the Director
for k, m in enumerate([76, 75, 72, 71, 72, 75]): put(.4 + k * 1.9, mbox(m, 1.6), .2, 0)
put(12.4, pad([33, 45, 52, 59], 12.4, 1.0, .8, 700), .55, 0); pulse(18.3, 24.8, 28, .5, .55)           # origin, the giants
darkbar(24.8, 11.1)
put(35.9, pad([33, 45, 51, 57], 13.4, .3, .3, 650), .6, 0); pulse(38.4, 49.3, 28, .5, .6)              # no single winner
put(49.3, pad([45, 57, 60, 64], 4.9, .3, .6, 900), .4, 0); tick8(49.3, 54.2, 84, .25, .14)            # the signal
prog(54.2, ['Am', 'Bb', 'Am', 'E', 'Dm'], 1.8, .5, 1100); pulse(54.2, 63.0, 33, .25, .6); tick8(56.9, 63.0, 88, .2, .16)   # countdown
prog(63.4, ['Am', 'F', 'C', 'G', 'Am', 'E', 'A'], 1.95, .5, 1500); pulse(63.4, 77.1, 33, .2, .65)      # the escape
put(77.1, pad([45, 57, 60, 64], 7.1, .4, .8, 1000), .45, 0); pulse(77.1, 84.2, 28, .45, .55)
put(84.2, pad([33, 45, 51, 58], END - 84.2, .2, .4, 600), .65, 0); pulse(84.2, END - .3, 28, .3, .7)   # the origin wakes
put(0, pad([28, 40, 47], END, 2.0, 1.0, 300), .25, 0)
