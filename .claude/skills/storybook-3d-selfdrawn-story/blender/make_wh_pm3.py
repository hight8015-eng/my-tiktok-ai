# Generates warehouse_pm3.json: THE PUPPET MASTER ep3 warehouse (ZERO CITY), same coordinates as the old procedural set in zc.js
# (room x -8..8, z -12..12, door at z 11.75, throne on a dais at z -9.6, hole spots in the side walls at (-7.8, 1.75, -3) and (7.77, 1.6, 4)).
# The table, fire drums, hanging-lamp geometry, crowd, hole/crack and door-light plane stay in the engine (they animate); this file is the static room.
# usage: python make_wh_pm3.py > warehouse_pm3.json
import json, random
R = random.Random(7); O = []; L = []; FP = []                              # FP = footprints for the engine (x, z, w, d, h): crowd + walk paths must stay out of these
def fp(x, z, w, d, h=2): FP.append([round(x, 2), round(z, 2), round(w, 2), round(d, 2), h])
def box(name, size, pos, color, group=None, emit=0, rot=None, rough=.7, nobevel=False, tex=None):
    o = {'kind': 'box', 'name': name, 'size': size, 'pos': pos, 'color': color, 'rough': rough}
    if tex: o['tex'] = tex
    if group: o['group'] = group
    if emit: o['emit'] = emit
    if rot: o['rot'] = rot
    if nobevel: o['nobevel'] = True
    O.append(o)
def cyl(name, r, h, pos, color, axis='y', group=None, emit=0, seg=16, tex=None):
    o = {'kind': 'cyl', 'name': name, 'r': r, 'h': h, 'pos': pos, 'color': color, 'axis': axis, 'seg': seg}
    if tex: o['tex'] = tex
    if group: o['group'] = group
    if emit: o['emit'] = emit
    O.append(o)
n = [0]
def nm(p): n[0] += 1; return f'{p}{n[0]}'
WOOD = ['#7a4f2c', '#5e3a20', '#8c6236', '#6c4526']
HOLE_ZONES = [(-8.2, -5.0, -4.6, -1.4), (5.0, 8.2, 2.4, 5.6)]      # keep clear: the punch hole + crack are drawn on these wall spots
LANE = (-3.6, 3.6)                                                   # Aren walks the centre aisle from the door (z 11.5) to the table (z -6)
def free(x, z, w, d):
    if LANE[0] - w / 2 < x < LANE[1] + w / 2 and -8 < z < 12: return False
    for a, b, c, e in HOLE_ZONES:
        if a - w / 2 < x < b + w / 2 and c - d / 2 < z < e + d / 2: return False
    return True

# ---- shell: floor, walls, roof with a broken skylight over the throne, columns, dado, windows
box('floor', [16, .1, 24], [0, -.05, 0], '#2a2436', rough=.85, nobevel=True, tex='concrete')
box('wall_back', [16.8, 9, .4], [0, 4.5, -12.2], '#5a3a40', rough=.9, tex='brick'); box('wall_front', [16.8, 9, .4], [0, 4.5, 12.2], '#5a3a40', rough=.9, tex='brick')
box('wall_left', [.4, 9, 24], [-8.2, 4.5, 0], '#5a3a40', rough=.9, tex='brick'); box('wall_right', [.4, 9, 24], [8.2, 4.5, 0], '#5a3a40', rough=.9, tex='brick')
# roof slabs around a 6 x 5 gap centred (0, -6)
for nme, s, p in [('roof_a', [16.8, .3, 3.5], [0, 9.15, -10.25]), ('roof_b', [16.8, .3, 15.5], [0, 9.15, 4.25]), ('roof_c', [5, .3, 5], [-5.5, 9.15, -6]), ('roof_d', [5, .3, 5], [5.5, 9.15, -6])]:
    box(nme, s, p, '#3a3640', rough=.9)
for x in (-7.7, 7.7):                                               # steel columns
    for z in (-10.5, -6, -1.5, 3, 7.5, 11):
        fp(x, z, .75, .75, 9); box(nm('col'), [.55, 9, .55], [x, 4.5, z], '#3a3f58', group='steel', tex='metal')
for z in range(-11, 12, 4): box(nm('beam'), [16, .4, .4], [0, 8.6, z], '#170f1c', group='steel')   # cross beams
for x in (-6, 6): box(nm('girder'), [.5, .5, 24], [x, 8.4, 0], '#170f1c', group='steel')
for sgn in (-1, 1):                                                  # dado (dark lower wall) + hazard band + high windows
    box(nm('dado'), [.12, 2.2, 24], [sgn * 7.94, 1.1, 0], '#2a1c2c', group='walls', nobevel=True)
    box(nm('haz'), [.14, .22, 24], [sgn * 7.93, 2.3, 0], '#a8861a', group='walls', nobevel=True)
    for gz in range(-11, 12, 1):                                      # high band of small neon windows (the city outside, like the earlier eps' rooftops)
        for gy in (5.6, 6.5, 7.4):
            if R.random() < .42: box(nm('win'), [.08, .5, .62], [sgn * 7.96, gy, gz + .2], R.choice(['#ff4fa0', '#5ac8ff', '#ffb050', '#8a6aff', '#ff4fa0']), group='win', emit=1.6, nobevel=True)
box('dado_back', [16, 2.2, .12], [0, 1.1, -11.94], '#2a1c2c', group='walls', nobevel=True); box('dado_front', [16, 2.2, .12], [0, 1.1, 11.94], '#2a1c2c', group='walls', nobevel=True)
for x in (-3.8, 3.8): box(nm('lane'), [.14, .02, 20], [x, .01, 0], '#a8861a', group='floor_marks', nobevel=True)   # yellow walking-lane lines
box('lane_end', [7.6, .02, .14], [0, .01, -7.4], '#a8861a', group='floor_marks', nobevel=True)
# ---- door (the engine adds the glowing light plane) + frame + exit sign
for sx in (-1.55, 1.55): box(nm('jamb'), [.3, 4.2, .4], [sx, 2.1, 11.85], '#170f1c', group='steel')
box('lintel', [3.4, .3, .4], [0, 4.2, 11.85], '#170f1c', group='steel')
box('exit_sign', [1.3, .42, .12], [0, 4.85, 11.9], '#37e07a', group='signs', emit=2.2)
# ---- throne dais, throne, drapes, banner
fp(0, -9.6, 4.9, 3.5, 5); box('dais', [4.8, .4, 3.4], [0, .2, -9.6], '#4a4658', group='throne'); box('dais_step', [3.2, .2, .8], [0, .1, -7.6], '#4a4658', group='throne')
box('dais_trim', [4.9, .08, 3.5], [0, .42, -9.6], '#a8863a', group='throne', nobevel=True)
box('seat', [1.7, .5, 1.3], [0, .85, -9.7], '#4a2f27', group='throne'); box('seat_cushion', [1.5, .15, 1.1], [0, 1.15, -9.65], '#8a1e28', group='throne')
box('t_back', [1.9, 3.4, .3], [0, 2.6, -10.35], '#4a2f27', group='throne'); box('t_back_red', [1.5, 2.7, .08], [0, 2.55, -10.17], '#8a1e28', group='throne')
box('t_top', [2.3, .35, .4], [0, 4.4, -10.35], '#a8863a', group='throne'); box('t_crest', [.5, .6, .3], [0, 4.8, -10.35], '#a8863a', group='throne')
for s in (-1, 1):
    box(nm('t_arm'), [.25, .55, 1.3], [s * .95, 1.35, -9.7], '#4a2f27', group='throne'); box(nm('t_post'), [.3, 4.6, .3], [s * 1.0, 2.5, -10.35], '#a8863a', group='throne')
    box(nm('drape'), [.9, 7.2, .2], [s * 3.1, 5.2, -11.8], '#6a0e22', group='drapes'); box(nm('drape_in'), [.5, 6, .15], [s * 2.55, 5.3, -11.75], '#5b0c18', group='drapes')
box('drape_rod', [7.6, .22, .22], [0, 8.7, -11.8], '#a8863a', group='drapes')
box('banner', [4, 4.5, .1], [0, 5.9, -11.9], '#2a0610', group='drapes'); box('banner_emblem', [1.1, 1.6, .06], [0, 5.9, -11.82], '#a8861a', group='signs', emit=.5)
for s in (-1, 1):                                                    # skulls-and-bones style wall braziers' brackets
    box(nm('bracket'), [.3, .1, .5], [s * 5.2, 2.6, -11.75], '#170f1c', group='steel')
# ---- catwalk along the right wall (y 4.2) + rails + stair, and left-wall pipes
box('catwalk', [2.2, .15, 13], [6.5, 4.2, -5.0], '#343848', group='catwalk')
for z in range(-11, 2, 3): fp(5.45, z, .4, .4, 4.2); box(nm('cw_post'), [.18, 4.2, .18], [5.45, 2.1, z], '#272a38', group='catwalk')
box('cw_rail_top', [.1, .1, 13], [5.45, 5.3, -5], '#a8861a', group='catwalk'); box('cw_rail_mid', [.08, .08, 13], [5.45, 4.75, -5], '#a8861a', group='catwalk')
for z in range(-11, 2, 2): box(nm('cw_bal'), [.06, 1.1, .06], [5.45, 4.75, z], '#a8861a', group='catwalk')
for sx in (-.28, .28): box(nm('ladder_rail'), [.07, 4.2, .07], [6.5 + sx, 2.1, 1.75], '#a8861a', group='catwalk')       # ladder at the catwalk's front end (clear of the right-wall punch spot)
for k in range(13): box(nm('ladder_rung'), [.6, .05, .05], [6.5, .3 + k * .32, 1.75], '#a8861a', group='catwalk')
for y, c in ((7.6, '#8a2a42'), (7.1, '#2a4a7a'), (6.6, '#8a8f9a')): cyl(nm('pipe'), .16, 22, [-7.5, y, 0], c, axis='z', group='pipes')
for z in (-9, -3, 3, 9): box(nm('pipe_clamp'), [.5, 1.3, .12], [-7.5, 7.1, z], '#170f1c', group='pipes')
# ---- chains + hooks hanging from the beams, a hoist
for x, z in ((-4.5, -2), (4.2, -9), (-4.8, 6), (3.5, 5)):
    cyl(nm('chain'), .035, 4.2, [x, 6.4, z], '#2b2b30', group='chains', seg=6); box(nm('hook'), [.3, .3, .1], [x, 4.2, z], '#d4d6dc', group='chains')
    for k in range(7): box(nm('link'), [.14, .09, .06], [x, 4.4 + k * .27, z], '#6b6e78', group='chains', rot=[0, 90 if k % 2 else 0, 0])
# ---- shelving racks (back corners) stocked with boxes
def rack(cx, cz, w=3.2, d=1.1, h=4.2, tiers=3):
    fp(cx, cz, w + .2, d + .2, h)
    for sx in (-w / 2, w / 2):
        for sz in (-d / 2, d / 2): box(nm('rk_post'), [.12, h, .12], [cx + sx, h / 2, cz + sz], '#26407a', group='racks')
    for t in range(tiers + 1):
        y = .25 + t * (h - .35) / tiers; box(nm('rk_beam'), [w, .1, d], [cx, y, cz], '#a85a2a', group='racks')
        if t < tiers:
            x = -w / 2 + .45
            while x < w / 2 - .3:
                bw = .5 + R.random() * .4; bh = .4 + R.random() * .45
                box(nm('rk_box'), [bw, bh, d * .8], [cx + x, y + .05 + bh / 2, cz], R.choice(WOOD + ['#3f5a80', '#4a6a45']), group='cargo'); x += bw + .12
rack(-5.9, -11.0); rack(5.9, -11.0); rack(-5.9, 9.8, 3.2, 1.1, 4.2, 3); rack(-2.2, -11.0, 2.4, 1.1, 4.2, 3)
# ---- pallets + crate stacks along the walls and in the corners (never in the walking lane or the wall-hole spots)
def pallet(x, z, ry=0):
    box(nm('pal'), [1.2, .14, 1.0], [x, .22, z], '#6a5836', group='crates', rot=[0, ry, 0])
    for s in (-.45, 0, .45): box(nm('pal_f'), [.18, .15, 1.0], [x + s * (1 if not ry else 0), .075, z + (s if ry else 0)], '#54442a', group='crates')
def stack(x, z, nx, nz, ny, s=.8, ry=0):
    pallet(x, z, 0); fp(x, z, nx * s * 1.04 + .1, nz * s * 1.04 + .1, ny * s + .3)
    for iy in range(ny):
        for ix in range(nx):
            for iz in range(nz):
                if R.random() < .12 and iy > 0: continue
                bx, bz = x + (ix - (nx - 1) / 2) * s * 1.02, z + (iz - (nz - 1) / 2) * s * 1.02; h = s * (.85 + R.random() * .25)
                box(nm('crate'), [s * .98, h, s * .98], [bx, .29 + iy * s + h / 2, bz], R.choice(WOOD), group='crates', rot=[0, R.uniform(-6, 6), 0], tex='wood')
SP = [(-6.6, -8.2, 2, 2, 3), (-6.6, 1.4, 2, 1, 2), (-6.7, 8.2, 2, 2, 2), (6.7, -7.4, 2, 2, 3), (6.6, 9.2, 2, 2, 3), (-6.5, -11.1 + 3.4, 1, 1, 4), (4.9, 5.9, 1, 1, 3), (-5.0, 6.2, 1, 1, 2)]
for (x, z, nx, nz, ny) in SP:
    if free(x, z, nx * .9 + .3, nz * .9 + .3): stack(x, z, nx, nz, ny)
for _ in range(10):                                                  # loose scatter
    x, z = R.uniform(-7, 7), R.uniform(-11, 11)
    if free(x, z, 1, 1) and abs(x) > 4.2: fp(x, z, .9, .9, .6); box(nm('crate'), [.6, .6, .6], [x, .3, z], R.choice(WOOD), group='crates', rot=[0, R.uniform(0, 90), 0])
# ---- oil barrels, tyres
for x, z, c in ((-4.8, -11.2, '#8a2a42'), (-4.4, -10.5, '#2a4a7a'), (7.2, -9.0, '#8a2a42'), (7.3, 6.9, '#2a6a4a'), (6.9, 7.6, '#8a2a42'), (-7.2, 10.6, '#2a4a7a'), (-6.8, 11.2, '#8a2a42'), (4.3, -11.1, '#2a4a7a')):
    if free(x, z, .8, .8): fp(x, z, .8, .8, .9); cyl(nm('barrel'), .34, .9, [x, .45, z], c, group='barrels', seg=14); cyl(nm('ring'), .355, .06, [x, .6, z], '#222222', group='barrels', seg=14)
# ---- forklift (right side, parked at a slant, facing the aisle)
FX, FZ = 5.6, 7.4; fp(FX, FZ - .4, 1.7, 3.6, 2.8)
box('fk_body', [1.3, .8, 2.0], [FX, .75, FZ], '#c27a1a', group='forklift', rough=.35); box('fk_hood', [1.2, .5, .9], [FX, 1.3, FZ + .6], '#c27a1a', group='forklift', rough=.35)
box('fk_cw', [1.3, .9, .6], [FX, .9, FZ + 1.1], '#170f1c', group='forklift')
for sx in (-.55, .55): box(nm('fk_cab'), [.07, 1.6, .07], [FX + sx, 2.0, FZ - .3], '#170f1c', group='forklift'); box(nm('fk_mast'), [.12, 2.8, .12], [FX + sx * .7, 1.6, FZ - 1.15], '#170f1c', group='forklift')
box('fk_roof', [1.3, .07, 1.3], [FX, 2.8, FZ - .15], '#170f1c', group='forklift'); box('fk_seat', [.5, .12, .5], [FX, 1.2, FZ - .1], '#2a2a30', group='forklift')
for sx in (-.4, .4): box(nm('fk_fork'), [.14, .06, 1.2], [FX + sx, .35, FZ - 1.7], '#6b6e78', group='forklift')
for sx in (-.62, .62):
    for sz in (-.6, .75): cyl(nm('fk_wheel'), .32, .26, [FX + sx, .32, FZ + sz], '#17151a', axis='x', group='forklift', seg=14)
box('fk_light', [.5, .12, .12], [FX, 2.6, FZ - .75], '#fff1b0', group='signs', emit=3)
# ---- story signs (emissive, replaced by lettered signs from the sign maker later)
box('sign_no7', [2.6, .8, .08], [-7.9 + .2, 5.2, -9.5], '#a8861a', group='signs', emit=.5, rot=[0, 90, 0])
box('sign_danger', [1.8, .7, .08], [7.88, 3.4, -6.5], '#ff2e63', group='signs', emit=2.4, rot=[0, 90, 0])
box('sign_stripe_back', [3.4, .3, .08], [-5.2, 4.8, -11.9], '#ff2e63', group='signs', emit=1.2)

# ---- story props (the user's refs: every set tells the plot) : key board, red-string case board, ground clutter, cables, oil, cracks
box('keyboard_board', [2.2, 1.4, .1], [-7.86, 2.9, 2.2], '#5a3a22', group='boards', rot=[0, 90, 0], tex='wood')
for r_ in range(2):
    for c_ in range(5): box(nm('key'), [.1, .3, .06], [-7.78, 3.25 - r_ * .6, 1.4 + c_ * .4], '#e8b830', group='keys', emit=.5, rot=[0, 90, 0], nobevel=True)
box('case_board', [2.6, 1.7, .1], [7.86, 3.0, -3.4], '#6a5236', group='boards', rot=[0, 90, 0])
for i_, (dz, dy) in enumerate([(-.9, .45), (-.2, .5), (.6, .35), (-.5, -.35), (.3, -.4)]):
    box(nm('card'), [.07, .34, .26], [7.78, 3.0 + dy, -3.4 + dz], '#e8e0d0', group='cards', rot=[R.uniform(-8, 8), 90, 0], nobevel=True)
for dz, dy, ln, ang in [(-.1, .1, 1.0, 20), (.2, -.05, 1.1, -25), (0, .2, .9, 70)]:
    box(nm('string'), [.03, .03, ln], [7.76, 3.0 + dy, -3.4 + dz], '#e02848', group='cards', emit=.8, rot=[ang, 90, 0], nobevel=True)
for _ in range(70):                                                    # pebbles, bolts, paper scraps, rubble
    x, z = R.uniform(-7.5, 7.5), R.uniform(-11.5, 11.5); s = R.uniform(.05, .16)
    if free(x, z, .3, .3) or abs(x) > 4: box(nm('peb'), [s, s * .7, s], [x, s * .35, z], R.choice(['#4a4658', '#3a3748', '#5a5468', '#d8d0c0']), group='debris', rot=[0, R.uniform(0, 90), 0])
for _ in range(7):
    x, z = R.uniform(-3, 3), R.uniform(-5, 10); box(nm('paper'), [.32, .01, .24], [x, .012, z], '#e8e0d0', group='debris', rot=[0, R.uniform(0, 180), 0], nobevel=True)
for z_, x_ in ((8.6, -6.2), (-4, 6.9), (-9, -6.5)): cyl(nm('cable'), .045, 6, [x_, .05, z_], '#121018', axis='x', group='debris', seg=8)
for x_, z_, w_, d_ in ((-2.5, 4.5, 1.6, 1.0), (2.8, -3.4, 1.3, .8), (-1.2, -9.3, 1.1, .7)): box(nm('oil'), [w_, .004, d_], [x_, .006, z_], '#0e0c18', group='oil', rough=.12, nobevel=True)
for x_, z_, ln, ang in ((-1.5, 7.5, 2.2, 25), (2.3, 0, 1.8, -40), (-2.2, -4.5, 1.5, 70)): box(nm('crack'), [.05, .01, ln], [x_, .011, z_], '#14121c', group='oil', rot=[0, ang, 0], nobevel=True)
# ---- lights: 5 hanging lamps (same spots as the engine lamps), two fire drums, the skylight sun
LAMPS = [(-3, 6.2, -6), (3, 6.2, -6), (-3, 6.2, 1), (3, 6.2, 1), (0, 6.2, 7)]
for i, (x, y, z) in enumerate(LAMPS): L.append({'name': f'lamp{i}', 'type': 'point', 'pos': [x, y, z], 'color': '#ffa24a', 'power': 150})
for i, x in enumerate((-2.6, 2.6)): L.append({'name': f'fire{i}', 'type': 'point', 'pos': [x, 1.4, -8.6], 'color': '#ff6a2a', 'power': 80})
L.append({'name': 'sun', 'type': 'sun', 'rot': [18, 0, 0], 'color': '#8a5cff', 'power': 3})
for i, (x, z) in enumerate(((-7.0, -6), (7.0, -6), (-7.0, 5), (7.0, 5))): L.append({'name': f'neon{i}', 'type': 'point', 'pos': [x, 5.2, z], 'color': '#ff2e6a', 'power': 160})
L.append({'name': 'back_magenta', 'type': 'point', 'pos': [0, 6.5, -10.5], 'color': '#ff3a8a', 'power': 120})
L.append({'name': 'door_glow', 'type': 'point', 'pos': [0, 2.2, 10.8], 'color': '#ffb070', 'power': 90})
# ---- camera marks + colliders (walk paths must avoid these)
C = [{'name': 'cam_door', 'pos': [0, 1.5, 11], 'look': [0, 1.4, -6]}, {'name': 'cam_throne', 'pos': [0, 1.6, -3.5], 'look': [0, 1.9, -9.7]}, {'name': 'cam_high', 'pos': [-6.5, 7.5, 10], 'look': [0, 1, -4]}]
COL = [{'name': 'col_dais', 'size': [4.8, .8, 3.4], 'pos': [0, .4, -9.6]}, {'name': 'col_forklift', 'size': [1.6, 3, 3.4], 'pos': [5.6, 1.5, 6.9]},
       {'name': 'col_rack_bl', 'size': [3.2, 4.2, 1.2], 'pos': [-5.9, 2.1, -11]}, {'name': 'col_rack_br', 'size': [3.2, 4.2, 1.2], 'pos': [5.9, 2.1, -11]}]
import sys
if len(sys.argv) > 1: json.dump({'footprints': FP}, open(sys.argv[1], 'w'))                    # python make_wh_pm3.py wh_pm3_colliders.json > warehouse_pm3.json
print(json.dumps({'name': 'warehouse_pm3', 'style': {'bevel': .045}, 'lowres': ['keys', 'cards', 'debris', 'oil', 'boards', 'signs', 'win', 'floor_marks', 'chains', 'pipes'], 'objects': O, 'lights': L, 'world': {'color': '#4a1030', 'strength': .22}, 'cams': C, 'colliders': COL}, indent=0))
