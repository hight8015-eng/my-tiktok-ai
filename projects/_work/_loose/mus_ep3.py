# ===== EPISODE: "เกมเอาชีวิตรอด ตอน 3" =====
CH.update({'Dm': [50, 62, 65, 69], 'F': [41, 60, 65, 69], 'E': [40, 64, 68, 71], 'Gm': [43, 62, 67, 70], 'Bb': [46, 62, 65, 70]})
def pulse(t0, t1, m, step=.5, g=.5):
    k = 0
    while t0 + k * step < t1: put(t0 + k * step, bass(m, step + .1), g * (1 if k % 2 == 0 else .7)); k += 1
def tick8(t0, t1, m=81, step=.25, g=.18):
    k = 0
    while t0 + k * step < t1: put(t0 + k * step, pizz(m if k % 4 else m + 5, .2, .05), g, .3 * (1 if k % 2 else -1)); k += 1
def prog(t0, chords, dur, g=.45, bright=1000):
    for k, ch in enumerate(chords): put(t0 + k * dur, pad(CH[ch][1:], dur, .3, .5, bright), g, 0)
SIL = [(37.6, 38.9)]
t = waltz(0, THEME[:3], .58, mel_g=.28, pad_g=.35)                                                        # morning
prog(5.45, ['Am', 'F', 'Dm', 'E'], 2.0, .45, 1100); pulse(5.45, 20.0, 33, .5, .45); tick8(12.5, 20.0, 81, .25, .14)
prog(20.0, ['Am', 'C', 'G', 'Am'], 1.3, .4, 1300)
t = waltz(25.25, SLY[:4], .5, inst='pizz', mel_g=.55, pad_g=.25, bass_g=.5, pan=.1)                       # sneaking, room 12
put(32.8, pad([45, 57, 60, 63], 4.8, .2, .4, 900), .55, 0); pulse(32.8, 37.5, 33, .25, .55)
prog(39.0, ['Am', 'Bb', 'Am', 'E', 'Am', 'Bb', 'E'], 2.0, .5, 1200); pulse(39.0, 53.0, 33, .25, .6); tick8(44.5, 53.0, 84, .2, .18)   # gravity fight
put(53.1, pad([57, 60, 64, 71], 6.5, .8, .6, 1600), .35, 0)
for k, m in enumerate([76, 81, 83, 84, 83, 81]): put(53.4 + k * 1.0, mbox(m, 1.2), .25, -.1)                # Krai thinks
prog(59.6, ['Am', 'F', 'C', 'E'], 2.0, .5, 1400); pulse(59.6, 67.6, 33, .2, .65); tick8(59.6, 67.6, 88, .2, .2)
prog(67.7, ['A', 'D', 'E'], 1.8, .5, 1500); pulse(67.7, 72.9, 45, .3, .5)                                   # Bruno breaks free
put(72.95, pad([45, 57, 60, 64], 11.0, .2, .8, 900), .45, 0); pulse(72.95, 79.9, 33, .7, .4)               # retreat, why?
put(79.95, pad([57, 60, 64, 71], 4.0, .5, .5, 1500), .35, 0)
put(83.95, pad([33, 45, 51, 57], END - 83.95, .3, .3, 700), .6, 0); pulse(85.85, END - .3, 28, .6, .6)   # Victor on the screen
for k, m in enumerate([81, 80, 77, 76]): put(86.0 + k * 1.5, mbox(m, 1.6), .25, .1)
