# python3 tools/mkchars.py <out_dir> : self-drawn head + costume sprites (C0x-F/Q/S/B.png on green) for tools/sprites.py
# New story: add a hat function + a costume function and list the cast in CH (bottom). Keep ball() (dented blob head) and LW (thick ink).
# See templates/engine-cheatsheet.md, section 'Self-drawn characters'.
import sys, math
from PIL import Image, ImageDraw
K=3; W,H=1080*K,1920*K; GREEN=(0,177,64); INK=(34,24,38); LW=15*K  # v3: thick cartoon ink line
out=sys.argv[1]
YS=.6
def YM(y): return y if y<=890 else 890+(y-890)*YS
def P(pts): return [(x*K,YM(y)*K) for x,y in pts]
def poly(d,pts,fill,lw=LW,close=True):
    p=P(pts); d.polygon(p,fill=fill)
    if lw: d.line(p+([p[0],p[1]] if close else []),fill=INK,width=lw,joint='curve')
def line(d,pts,lw=LW,col=INK):
    p=P(pts); d.line(p,fill=col,width=lw,joint='curve')
    for q in (p[0],p[-1]): d.ellipse([q[0]-lw/2,q[1]-lw/2,q[0]+lw/2,q[1]+lw/2],fill=col)
def ell(d,cx,cy,rx,ry,fill,lw=LW):
    cy=YM(cy); d.ellipse([(cx-rx)*K,(cy-ry)*K,(cx+rx)*K,(cy+ry)*K],fill=fill,outline=INK if lw else None,width=lw)
def arc(cx,cy,rx,ry,a0,a1,n=40): return [(cx+rx*math.cos(math.radians(a0+(a1-a0)*i/n)),cy+ry*math.sin(math.radians(a0+(a1-a0)*i/n))) for i in range(n+1)]
def shade(c,k): return tuple(max(0,min(255,int(v*k))) for v in c)
def hexc(h): h=h.lstrip('#'); return tuple(int(h[i:i+2],16) for i in (0,2,4))
CX=540; BY0,BY1=890,1630
def body_outline(wt,wb,r=70,cx=CX,bulge=0):
    # rounded trapezoid: top half-width wt, bottom half-width wb
    pts=[]; n=24
    def w(u): return wt+(wb-wt)*u+bulge*math.sin(math.pi*u)
    pts+=arc(cx-wt+r,BY0+r,r,r,180,270,10); pts+=arc(cx+wt-r,BY0+r,r,r,270,360,10)
    for i in range(1,n): u=i/n; pts.append((cx+w(u),BY0+r+(BY1-r-BY0-r)*u))
    pts+=arc(cx+wb-r,BY1-r,r,r,0,90,10); pts+=arc(cx-wb+r,BY1-r,r,r,90,180,10)
    for i in range(n-1,0,-1): u=i/n; pts.append((cx-w(u),BY0+r+(BY1-r-BY0-r)*u))
    return pts
def body(d,col,wt,wb,r=70,bulge=0,view='F'):
    k={'F':1,'B':1,'Q':.93,'S':.74}[view]; o=body_outline(wt*k,wb*k,r*min(1,k+.1),bulge=bulge*k); poly(d,o,col)
    # soft shade band on the right side (inside the outline)
    m=Image.new('L',(W,H),0); ImageDraw.Draw(m).polygon(P(o),fill=255)
    s=Image.new('L',(W,H),0); ImageDraw.Draw(s).polygon(P([(x+wt*k*.62,y) for x,y in o]),fill=255)
    from PIL import ImageChops
    return (ImageChops.multiply(m,s),m),k
CLIP={}
def apply_shade(im,mask,col):
    im.paste(Image.new('RGB',(W,H),shade(col,.84)),(0,0),mask[0]); CLIP['m']=mask[1]; CLIP['base']=im.copy()
def clip(im):
    b=CLIP['base']; b.paste(im,(0,0),CLIP['m']); im.paste(b)
SEED=[0]
def blob(R=205,cx=CX,cy=600,grow=0,off=(0,0),flip=False):
    # v3: the head is not a perfect circle: wider than tall, flattish top, slightly narrower chin, small hand-drawn dents (per character seed)
    import random; rd=random.Random(SEED[0]); p1,p2,p3=[rd.uniform(0,6.28) for _ in range(3)]; a2,a3,a5=rd.uniform(.011,.017),rd.uniform(.008,.013),rd.uniform(.004,.007); sk=rd.uniform(-.025,.025)  # v4: rounder (user asked)
    pts=[]
    for i in range(120):
        th=6.2832*i/120; c,s_=math.cos(th),math.sin(th)
        r=(R+grow)*(1+a2*math.cos(2*th+p1)+a3*math.cos(3*th+p2)+a5*math.cos(5*th+p3))
        x=r*c*1.03*(1-.035*max(0,s_)); y=r*s_*(.96 if s_<0 else .985)+R*.02; x+=sk*y
        pts.append((cx+(-x if flip else x)+off[0],cy+y+off[1]))
    return pts
def ball(d,flip=False):
    d.polygon(P(blob(grow=15,off=(3,5),flip=flip)),fill=INK)      # ink line, a little heavier on the lower right
    d.polygon(P(blob(grow=-1,flip=flip)),fill=(247,242,232))
# ---------- hats ----------
def hat_boater(d,band):
    straw=hexc('#ecc96a'); ell(d,CX,470,300,62,straw)
    poly(d,arc(CX,455,178,40,180,0)+[(CX+170,330)]+arc(CX,330,170,34,0,-180),straw)
    poly(d,arc(CX,455,178,40,180,0)+arc(CX,405,176,38,0,180),band)
    ell(d,CX,330,170,34,shade(straw,1.06))
def hat_cone(d,band):
    straw=hexc('#e9c877'); poly(d,[(CX,285),(CX+330,470)]+arc(CX,470,330,56,0,180),straw)
    for dx in (-150,-60,60,150): line(d,[(CX,300),(CX+dx*1.6,500-abs(dx)*.12)],lw=3*K,col=shade(straw,.72))
    poly(d,arc(CX,372,150,24,0,180)+arc(CX,340,96,16,180,0),band,lw=9*K)
    line(d,[(CX-330,470),(CX,285),(CX+330,470)]); line(d,arc(CX,470,330,56,0,180))
def hat_chief(d,col):
    gold=hexc('#f2c230'); ell(d,CX,236,34,34,gold)
    poly(d,arc(CX,470,196,44,180,0)+[(CX+190,410)]+arc(CX,330,150,90,0,-180)+[(CX-190,410)],col)
    poly(d,arc(CX,470,196,44,180,0)+arc(CX,410,190,40,0,180),gold)
# ---------- costumes ----------
def dx_view(view): return {'F':0,'Q':-70,'S':-150,'B':0}[view]
def carpenter(im,d,view):
    shirt=hexc('#7f9a52'); apron=hexc('#c9905a'); m,k=body(d,shirt,170,205,80,bulge=22,view=view); apply_shade(im,m,shirt)
    if view!='B':
        dx=dx_view(view); w=150*k
        poly(d,[(CX+dx-w*.62,1010),(CX+dx+w*.62,1010),(CX+dx+w,1140),(CX+dx+w*1.05,1560),(CX+dx-w*1.05,1560),(CX+dx-w,1140)],apron)
        line(d,[(CX+dx-w*.62,1010),(CX+dx-w*.8,900)]); line(d,[(CX+dx+w*.62,1010),(CX+dx+w*.8,900)]) if view!='S' else None
        poly(d,[(CX+dx-w*.5,1300),(CX+dx+w*.5,1300),(CX+dx+w*.5,1440),(CX+dx-w*.5,1440)],shade(apron,.9))
        poly(d,[(CX+dx+w*.12,1230),(CX+dx+w*.26,1230),(CX+dx+w*.26,1330),(CX+dx+w*.12,1330)],hexc('#f0c23c'),lw=8*K)
        poly(d,[(CX+dx+w*.12,1230),(CX+dx+w*.19,1196),(CX+dx+w*.26,1230)],hexc('#f3dfb8'),lw=8*K)
    else:
        line(d,[(CX-120,900),(CX+110,1140)]); line(d,[(CX+120,900),(CX-110,1140)]); line(d,[(CX-200,1140),(CX+200,1140)])
    body_redraw_outline(d,170,205,80,22,view)
def chief(im,d,view,col):
    gold=hexc('#f2c230'); m,k=body(d,col,160,250,70,bulge=24,view=view); apply_shade(im,m,col)
    # collar + hem
    poly(d,[(CX-150*k+14,1560),(CX+150*k-14+110*k*0+0,1560)]+[(CX+252*k,1560),(CX+258*k,1600)]+arc(CX,1600,258*k,30,0,180)+[(CX-252*k,1560)],gold) if False else None
    line(d,[(CX-250*k,1548),(CX+250*k,1548)],lw=26*K,col=gold); line(d,[(CX-255*k,1530),(CX+255*k,1530)],lw=8*K); line(d,[(CX-258*k,1566),(CX+258*k,1566)],lw=8*K)
    if view!='B':
        dx=dx_view(view)*.9
        line(d,[(CX+dx,930),(CX+dx,1520)],lw=30*K,col=shade(col,.78)); line(d,[(CX+dx-17,930),(CX+dx-17,1520)],lw=8*K); line(d,[(CX+dx+17,930),(CX+dx+17,1520)],lw=8*K)
        for y in (1040,1200,1360): ell(d,CX+dx,y,20,20,gold,lw=8*K)
        poly(d,[(CX+dx-105*k,892),(CX+dx,985),(CX+dx+105*k,892),(CX+dx+70*k,888),(CX+dx,940),(CX+dx-70*k,888)],gold,lw=9*K)
    else:
        poly(d,[(CX-150,895),(CX,1040),(CX+150,895)],shade(col,.8),lw=9*K)
    body_redraw_outline(d,160,250,70,24,view)
def villager(im,d,view,col):
    rope=hexc('#d9b26a'); m,k=body(d,col,165,195,80,bulge=24,view=view); apply_shade(im,m,col)
    line(d,[(CX-178*k,1290),(CX+178*k,1290)],lw=24*K,col=rope); line(d,[(CX-180*k,1275),(CX+180*k,1275)],lw=8*K); line(d,[(CX-182*k,1306),(CX+182*k,1306)],lw=8*K)
    if view!='B':
        dx=dx_view(view)
        poly(d,[(CX+dx-60*k,892),(CX+dx,990),(CX+dx+60*k,892)],(247,236,214),lw=9*K)
        line(d,[(CX+dx+30*k,1300),(CX+dx+24*k,1400)],lw=14*K,col=rope); line(d,[(CX+dx-10*k,1300),(CX+dx-20*k,1380)],lw=14*K,col=rope)
        poly(d,[(CX+dx-120*k,1420),(CX+dx-40*k,1420),(CX+dx-40*k,1500),(CX+dx-120*k,1500)],shade(col,.8),lw=8*K)
    body_redraw_outline(d,165,195,80,24,view)
def body_redraw_outline(d,wt,wb,r,bulge,view):
    clip(d._image)
    k={'F':1,'B':1,'Q':.93,'S':.74}[view]; o=body_outline(wt*k,wb*k,r*min(1,k+.1),bulge=bulge*k); p=P(o); d.line(p+[p[0],p[1]],fill=INK,width=LW,joint='curve')
# ---------- "ต้นไม้ผลทองคำ" cast ----------
def star(cx,cy,r,ri=None):
    ri=ri or r*.45; return [(cx+(r if i%2==0 else ri)*math.cos(math.radians(-90+36*i)),cy+(r if i%2==0 else ri)*math.sin(math.radians(-90+36*i))) for i in range(10)]
def hat_traveler(d):
    cap=hexc('#6f8f3a'); band=hexc('#8a5a36')
    poly(d,arc(CX,470,228,44,180,0)+arc(CX+18,470,236,196,0,-180),cap)
    poly(d,arc(CX,470,230,44,180,0)+arc(CX,428,226,40,0,180),band,lw=10*K)
    line(d,arc(CX+40,470,150,150,-150,-110),lw=8*K,col=shade(cap,.75))
    poly(d,[(CX+150,420),(CX+205,300),(CX+250,250),(CX+232,330),(CX+180,420)],hexc('#f2c230'),lw=9*K)   # a little gold leaf
    line(d,[(CX+165,415),(CX+238,265)],lw=5*K,col=shade(hexc('#f2c230'),.7))
def hat_witch(d):
    pur=hexc('#5b3aa8'); band=hexc('#e85a9a'); gold=hexc('#f2c230')
    ell(d,CX,468,318,62,shade(pur,.9))
    poly(d,[(CX-178,455),(CX-120,330),(CX-50,215),(CX+30,135),(CX+150,88),(CX+205,120),(CX+120,150),(CX+90,230),(CX+120,330),(CX+178,455)]+arc(CX,455,178,30,0,180),pur)
    poly(d,[(CX-172,452),(CX-146,392),(CX+150,392),(CX+174,452)]+arc(CX,452,173,26,0,180)[1:-1],band,lw=10*K)
    poly(d,star(CX+10,422,30),gold,lw=7*K)
    poly(d,star(CX+190,108,24),gold,lw=7*K)
def youth(im,d,view):
    col=hexc('#e0683a'); belt=hexc('#6a4226'); m,k=body(d,col,165,198,80,bulge=24,view=view); apply_shade(im,m,col)
    line(d,[(CX-180*k,1300),(CX+180*k,1300)],lw=26*K,col=belt); line(d,[(CX-182*k,1284),(CX+182*k,1284)],lw=8*K); line(d,[(CX-184*k,1316),(CX+184*k,1316)],lw=8*K)
    if view!='B':
        dx=dx_view(view)
        poly(d,[(CX+dx-62*k,892),(CX+dx,980),(CX+dx+62*k,892)],(247,236,214),lw=9*K)
        poly(d,[(CX+dx-26*k,1278),(CX+dx+26*k,1278),(CX+dx+26*k,1322),(CX+dx-26*k,1322)],hexc('#f2c230'),lw=8*K)
        line(d,[(CX+dx-140*k,905),(CX+dx+150*k,1270)],lw=22*K,col=hexc('#a8703e')); line(d,[(CX+dx-150*k,920),(CX+dx+140*k,1288)],lw=6*K)
        poly(d,[(CX+dx+40*k,1420),(CX+dx+125*k,1420),(CX+dx+125*k,1505),(CX+dx+40*k,1505)],shade(col,.82),lw=8*K)
    else:
        line(d,[(CX+140,905),(CX-150,1270)],lw=22*K,col=hexc('#a8703e'))
    body_redraw_outline(d,165,198,80,24,view)
def witch(im,d,view):
    col=hexc('#7a52c8'); gold=hexc('#f2c230'); pink=hexc('#e85a9a'); m,k=body(d,col,150,255,70,bulge=20,view=view); apply_shade(im,m,col)
    line(d,[(CX-252*k,1556),(CX+252*k,1556)],lw=24*K,col=pink); line(d,[(CX-255*k,1540),(CX+255*k,1540)],lw=8*K)
    for x in (-170,-60,60,170): poly(d,star(CX+x*k,1460,22),gold,lw=6*K)
    if view!='B':
        dx=dx_view(view)*.9
        poly(d,[(CX+dx-150*k,895),(CX+dx-40*k,1010),(CX+dx,970),(CX+dx+40*k,1010),(CX+dx+150*k,895)],pink,lw=9*K)
        for y in (1100,1230,1360): poly(d,star(CX+dx,y,24),gold,lw=7*K)
    else:
        poly(d,[(CX-150,895),(CX,1060),(CX+150,895)],shade(col,.8),lw=9*K)
    body_redraw_outline(d,150,255,70,20,view)
CH={'C01':(hat_traveler,youth,()),'C02':(hat_witch,witch,())}
for cid,(hat,cos,args) in CH.items():
    for v in 'FQSB':
        im=Image.new('RGB',(W,H),GREEN); d=ImageDraw.Draw(im)
        cos(im,d,v,*args); d=ImageDraw.Draw(im)
        SEED[0]=int(cid[1:])*7+3; ball(d,flip=(v=='B')); hat(d)
        im.resize((1080,1920),Image.LANCZOS).save(f'{out}/{cid}-{v}.png')
print('ok')
