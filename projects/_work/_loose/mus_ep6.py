# ===== EPISODE: "เกมเอาชีวิตรอด ตอน 6" =====
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
SIL = [(3.55, 5.0)]
put(0, pad([33, 45, 51, 57], 3.5, .3, .4, 700), .6, 0); pulse(0, 3.5, 28, .5, .6)
darkbar(5.0, 9.8); pulse(8.45, 14.7, 28, .5, .6)                                                     # countdown
prog(14.7, ['Am', 'Bb', 'Am', 'E', 'Am', 'Bb'], 2.05, .5, 1100); pulse(14.7, 27.1, 33, .25, .6); tick8(19.0, 27.1, 84, .2, .16)   # locked in
put(27.1, pad([57, 60, 64, 71], 6.6, .6, .5, 1500), .35, 0)
for k, m in enumerate([76, 81, 83, 81, 79]): put(27.4 + k * 1.2, mbox(m, 1.3), .22, -.1)              # the hatch
darkbar(33.75, 6.4)                                                                                     # the old lab
put(40.15, pad([33, 45, 52, 59], 6.0, 1.0, .8, 800), .55, 0)
prog(46.05, ['Am', 'F', 'C', 'E'], 2.1, .45, 1500); put(54.5, pad([57, 61, 64, 69], 7.0, .5, .6, 1700), .4, 0)   # the origin power
for k, m in enumerate([81, 85, 88, 93, 88]): put(57.8 + k * .7, mbox(m, 1.0), .22, .1)
put(61.4, pad([45, 57, 60, 64], 6.2, .3, .6, 900), .4, 0)
put(67.6, pad([33, 45, 51, 57], END - 67.6, .3, .3, 650), .6, 0); pulse(71.5, END - .3, 28, .6, .6)   # the man in black
for k, m in enumerate([76, 75, 72, 71]): put(74.9 + k * .9, mbox(m, 1.1), .22, 0)
prog(86.5, ['Dm', 'E'], 2.0, .5, 900)
put(0, pad([28, 40, 47], END, 2.0, 1.0, 300), .25, 0)
