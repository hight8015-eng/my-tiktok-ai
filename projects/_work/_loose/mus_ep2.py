# ===== EPISODE: "เกมเอาชีวิตรอด ตอน 2" =====
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
SIL = [(58.75, 62.25)]
darkbar(0, 5.8)                                                                                              # back in the room
put(5.8, pad([45, 57, 60, 64], 5.8, .4, .5, 900), .4, 0); pulse(5.8, 11.6, 33, .5, .4); tick8(5.8, 11.6, 81, .3, .12)   # roof search
prog(11.6, ['Am', 'F', 'Dm', 'E'], 2.75, .45, 1100); pulse(11.6, 17.0, 33, .5, .45); pulse(17.0, 22.7, 33, .25, .6)       # Bruno's power
prog(22.7, ['Am', 'C', 'G', 'E'], 1.75, .4, 1300); tick8(25.45, 29.7, 88, .125, .16)                       # Ace's speed
prog(29.7, ['F', 'C', 'Dm', 'E'], 2.05, .4, 1300); tick8(33.0, 37.8, 84, .25, .14)                         # Neo builds
put(37.85, pad([57, 60, 64, 71], 10.8, .8, .6, 1600), .35, 0)
for k, m in enumerate([76, 81, 83, 84, 83, 81, 79, 76]): put(38.2 + k * 1.25, mbox(m, 1.3), .22, -.1)     # Krai's eye
put(48.7, pad([33, 45, 51, 57], 10.0, .3, .3, 700), .6, 0); pulse(50.9, 58.6, 28, .6, .6)                  # exposed
prog(62.3, ['Am', 'Bb', 'Am', 'E', 'Am', 'Bb', 'E'], 2.0, .5, 1200); pulse(62.3, 76.3, 33, .25, .6); tick8(68.1, 76.3, 84, .2, .18)   # the fight
prog(76.3, ['Dm', 'Bb', 'E', 'E'], 2.0, .5, 1000); pulse(76.3, 84.3, 28, .4, .65)                          # the rock wall
prog(84.3, ['Am', 'F', 'E', 'E'], 1.1, .5, 1400); pulse(84.3, 88.6, 33, .2, .6)
prog(88.6, ['A', 'D', 'E', 'A'], 1.7, .5, 1500); pulse(88.6, 95.2, 45, .3, .5)                             # they win
put(95.25, pad([45, 57, 60, 64], 2.0, .3, .6, 900), .35, 0)
put(97.2, pad([33, 45, 51, 57], END - 97.2, .3, .3, 700), .6, 0); pulse(98.0, END - .3, 28, .6, .6)       # high-value target
for k, m in enumerate([81, 80, 77, 76]): put(100.0 + k * 1.6, mbox(m, 1.7), .25, .1)
put(0, pad([28, 40, 47], END, 2.0, 1.0, 300), .25, 0)
