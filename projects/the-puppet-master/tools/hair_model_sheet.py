import sys; sys.path.insert(0,'.')
from PIL import Image, ImageDraw
from pm_draw import *
import hair3d, styles3d
out=sys.argv[1]; rows=[]
for cid in sys.argv[2].split(','):
    tiles=[]
    for view,mir,lab in [('F',False,'front'),('S',False,'left'),('B',False,'back'),('S',True,'right'),('Q',False,'3/4')]:
        im=Image.new('RGB',(W,H),GREEN); d=ImageDraw.Draw(im); SEED[0]=int(cid[1:])*7+3; ball(d,flip=(view=='B'))
        for h in styles3d.STYLES[cid](): hair3d.render(d,h,view,mirror=mir)
        tiles.append(im.crop((0,0,W,int(2600))).resize((300,240)))
    row=Image.new('RGB',(1500,240)); [row.paste(t,(i*300,0)) for i,t in enumerate(tiles)]; rows.append(row)
S=Image.new('RGB',(1500,240*len(rows))); [S.paste(r,(0,i*240)) for i,r in enumerate(rows)]; S.save(out)
