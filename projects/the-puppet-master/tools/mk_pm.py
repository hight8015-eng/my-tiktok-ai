# python3 tools/mkchars.py <out_dir> : self-drawn head + costume sprites (C0x-F/Q/S/B.png on green) for tools/sprites.py
# New story: add a hat function + a costume function and list the cast in CH (bottom). Keep ball() (dented blob head) and LW (thick ink).
# See templates/engine-cheatsheet.md, section 'Self-drawn characters'.
# v8 M3 (2026-11-23): the drawing code lives in pm_draw.py (primitives), outfits.py (costumes) and hair_library.py (hair/hats + HAIR registry).
import sys
from pm_draw import *
from outfits import *
from hair_library import *
import os, hair3d
from styles3d import STYLES as STYLES3D
USE3D = os.environ.get('HAIR3D', '1') == '1'   # on: user chose the 3D turned views 2026-11-24 (HAIR3D=0 gives the old flat ones)
out=sys.argv[1]
CH={'C01':(hair_aren,villager,(hexc('#1b1820'),)),'C02':(cap_guard,villager,(hexc('#2c3a5c'),)),
    'C03':(hair_fire,villager,(hexc('#c8bfa8'),)),'C04':(hair_buzz,villager,(hexc('#6a5a4a'),)),
    'C05':(hair_mohawk,villager,(hexc('#2a2a30'),)),'C06':(hat_beanie,villager,(hexc('#4a4038'),)),
    'C07':(hat_bandana,villager,(hexc('#38404a'),)),'C08':(hood,villager,(hexc('#3a3448'),),back_hood),
    'C09':(hair_noah,villager,(hexc('#222a38'),)),
    'C10':(hair_curly,villager,(hexc('#8a5a34'),))}
for cid,spec in CH.items():
    hat,cos,args=spec[:3]; back=spec[3] if len(spec)>3 else None
    for v in 'FQSB':
        im=Image.new('RGB',(W,H),GREEN); d=ImageDraw.Draw(im)
        cos(im,d,v,*args); d=ImageDraw.Draw(im)
        if back and v!='B': back(d,v)
        SEED[0]=int(cid[1:])*7+3; ball(d,flip=(v=='B'))
        if USE3D and cid in STYLES3D and v!='F':   # front = the original drawing; turned views = the 3D model built from it
            for h in STYLES3D[cid](): hair3d.render(d,h,v)
        else: hat(d,v)
        im.resize((1080,1920),Image.LANCZOS).save(f'{out}/{cid}-{v}.png')
print('ok')
