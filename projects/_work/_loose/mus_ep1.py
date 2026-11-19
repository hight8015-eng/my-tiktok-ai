# ===== EPISODE: "เกมเอาชีวิตรอด ตอน 1" =====
CH.update({'Dm': [50, 62, 65, 69], 'F': [41, 60, 65, 69], 'E': [40, 64, 68, 71], 'Gm': [43, 62, 67, 70], 'Bb': [46, 62, 65, 70]})
def pulse(t0, t1, m, step=.5, g=.5):
    k = 0
    while t0 + k * step < t1: put(t0 + k * step, bass(m, step + .1), g * (1 if k % 2 == 0 else .7)); k += 1
def tick8(t0, t1, m=81, step=.25, g=.18):
    k = 0
    while t0 + k * step < t1: put(t0 + k * step, pizz(m if k % 4 else m + 5, .2, .05), g, .3 * (1 if k % 2 else -1)); k += 1
def prog(t0, chords, dur, g=.45, bright=1000):
    for k, ch in enumerate(chords): put(t0 + k * dur, pad(CH[ch][1:], dur, .3, .5, bright), g, 0)
SIL = [(38.9, 40.7)]
t = waltz(0, THEME[:2], .58, mel_g=.3, pad_g=.35)                                                     # end of class
prog(3.75, ['Am', 'F', 'Dm', 'E'], 2.7, .5, 1100); pulse(3.75, 14.6, 33, .25, .6); tick8(5.9, 14.6)   # helicopters, desks
prog(14.65, ['Am', 'F', 'E'], 3.2, .5, 1200); pulse(14.65, 24.3, 33, .2, .65); tick8(16.7, 24.3, 81, .2, .2)   # rappel, chase
put(24.4, pad([45, 60, 64], 14.0, .5, 1.0, 700), .5, 0); pulse(27.25, 37.9, 33, .7, .5)              # hiding
put(40.7, pad([57, 60, 64, 71], 14.0, 2.0, 1.0, 1500), .3, 0)                                         # the strange classroom
for k, m in enumerate([76, 79, 83, 81, 76, 72, 74, 71, 76, 79]): put(41.5 + k * 1.3, mbox(m, 1.4), .3, -.1)
prog(54.85, ['Am', 'Am', 'F', 'E'], 2.5, .5, 1300); pulse(54.85, 64.9, 33, .5, .5); tick8(58.35, 64.9, 88, .25, .14)   # the screen
prog(64.95, ['F', 'C', 'G', 'Am'], 1.8, .45, 1500)                                                     # the rooftop, the city
put(72.15, pad([33, 45, 52, 60], 6.8, .3, .6, 600), .6, 0); pulse(72.15, 78.8, 28, .7, .65)           # the giant
put(78.9, pad([69, 72, 76, 83], 13.4, 1.0, 1.0, 2400), .3, 0)                                          # the stones
for k, m in enumerate([83, 88, 84, 81, 83, 88, 91, 88]): put(79.2 + k * 1.6, mbox(m, 1.8), .26, .1)
prog(92.4, ['Am', 'F', 'Dm', 'E'], 1.7, .55, 1300); pulse(92.4, 99.1, 33, .2, .65); tick8(92.4, 99.1, 81, .2, .2)   # explosion, run
prog(99.15, ['Am', 'F', 'G', 'Am'], 1.7, .5, 1200); pulse(99.15, END - .3, 33, .5, .55)
