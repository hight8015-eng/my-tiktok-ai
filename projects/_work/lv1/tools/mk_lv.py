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
    p=P(pts)
    if lw and close and fill!=INK:  # v4.19 weighted ink: heavier on the shadow side (lower right), thin where light hits
        o=(lw*.55,lw*.5); d.polygon([(a+o[0],b+o[1]) for a,b in p],fill=INK)
    d.polygon(p,fill=fill)
    if lw: d.line(p+([p[0],p[1]] if close else []),fill=INK,width=int(lw*.6) if close else lw,joint='curve')
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
    import random; rd=random.Random(SEED[0]); p1,p2,p3=[rd.uniform(0,6.28) for _ in range(3)]; a2,a3,a5=rd.uniform(.011,.017),rd.uniform(.008,.013),rd.uniform(.004,.007); sk=rd.uniform(-.025,.025)
    pts=[]
    for i in range(120):
        th=6.2832*i/120; c,s_=math.cos(th),math.sin(th)
        r=(R+grow)*(1+a2*math.cos(2*th+p1)+a3*math.cos(3*th+p2)+a5*math.cos(5*th+p3))
        x=r*c*1.03*(1-.035*max(0,s_)); y=r*s_*(.96 if s_<0 else .985)+R*.02; x+=sk*y
        pts.append((cx+(-x if flip else x)+off[0],cy+y+off[1]))
    return pts
def ball(d,flip=False):
    d.polygon(P(blob(grow=12,off=(7,8),flip=flip)),fill=INK)      # ink line, a little heavier on the lower right
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
# ---------- THE LAST VILLAIN: hair / hats (view aware: B covers the back of the head) ----------
def cr(pts,n=8,closed=True):  # Catmull-Rom smooth outline through the points
    P_=pts+pts[:3] if closed else [pts[0]]+pts+[pts[-1]]; out=[]
    for k in range(len(P_)-3):
        p0,p1,p2,p3=P_[k:k+4]
        for i in range(n):
            t=i/n; t2,t3=t*t,t*t*t
            out.append(tuple(.5*((2*p1[c])+(-p0[c]+p2[c])*t+(2*p0[c]-5*p1[c]+4*p2[c]-p3[c])*t2+(-p0[c]+3*p1[c]-3*p2[c]+p3[c])*t3) for c in (0,1)))
    return out
def hl(d,pts,col):  # soft hair highlight streak
    poly(d,cr(pts,6),shade(col,1.35),lw=0)
def strands(d,curves,col,w=5):  # flowing strand lines (refs): darker curved lines along the hair
    for c in curves: line(d,cr(c,6,closed=False),lw=w*K,col=shade(col,.62))
def back_cap(d,col,lo=760): poly(d,cr([(CX-238,560),(CX-232,420),(CX-150,345),(CX,320),(CX+150,345),(CX+232,420),(CX+238,560),(CX+220,lo),(CX,lo+30),(CX-220,lo)]),col)
# ---- Kael: dark swept villain hair, sharp layered bangs over one eye ----
KAEL=[(CX-236,610),(CX-246,500),(CX-300,430),(CX-210,410),(CX-250,330),(CX-150,345),(CX-150,250),(CX-50,315),(CX+10,215),(CX+70,310),(CX+170,250),(CX+165,340),(CX+270,330),(CX+215,410),(CX+262,470),(CX+232,520),
      (CX+238,600),(CX+190,520),(CX+150,560),(CX+120,480),(CX+40,545),(CX+10,470),(CX-60,600),(CX-90,500),(CX-170,640),(CX-180,520)]
def hair_kael(d,view='F'):
    c=hexc('#1f1a2e')
    if view=='B': back_cap(d,c,700); poly(d,cr([(CX-150,350),(CX-150,250),(CX-50,315),(CX+10,215),(CX+70,310),(CX+170,250),(CX+165,340)]),c); return
    poly(d,cr(KAEL,6),c); hl(d,[(CX-150,360),(CX-40,330),(CX+60,345),(CX-30,365)],shade(c,1.6))
    strands(d,[[(CX-120,330),(CX-70,420),(CX-60,560)],[(CX+20,260),(CX+30,380),(CX+20,500)],[(CX+140,300),(CX+150,400),(CX+130,500)],[(CX-200,420),(CX-190,520),(CX-180,600)]],shade(c,1.9),4)
# ---- Elena: long violet hair with a centre part, soft waves to the shoulders, small tiara ----
EL=[(CX-250,600),(CX-250,450),(CX-170,355),(CX,330),(CX+170,355),(CX+250,450),(CX+250,600),(CX+232,560),(CX+190,480),(CX+90,425),(CX,410),(CX-90,425),(CX-190,480),(CX-232,560)]
def back_elena(d,view='F'):
    c=shade(hexc('#5a2f72'),.82)
    poly(d,cr([(CX-262,470),(CX-200,350),(CX,320),(CX+200,350),(CX+262,470),(CX+285,690),(CX+262,815),(CX+180,835),(CX,820),(CX-180,835),(CX-262,815),(CX-285,690)]),c)
def hair_elena(d,view='F'):
    c=hexc('#5a2f72'); gold=hexc('#f2c94c'); gem=hexc('#e2445a')
    if view=='B': poly(d,cr([(CX-262,470),(CX-200,350),(CX,320),(CX+200,350),(CX+262,470),(CX+285,690),(CX+262,820),(CX,835),(CX-262,820),(CX-285,690)]),c); return
    poly(d,cr(EL,8),c)
    for sg in (-1,1): poly(d,cr([(CX+sg*215,520),(CX+sg*262,600),(CX+sg*268,740),(CX+sg*240,825),(CX+sg*205,740),(CX+sg*215,640)],6),c)  # front locks
    hl(d,[(CX-150,380),(CX-60,350),(CX-20,365),(CX-120,400)],c); line(d,[(CX,330),(CX,405)],lw=5*K,col=shade(c,.7))
    strands(d,[[(CX-30,345),(CX-120,390),(CX-205,470)],[(CX+30,345),(CX+120,390),(CX+205,470)],[(CX-60,360),(CX-150,420),(CX-215,520)],[(CX+60,360),(CX+150,420),(CX+215,520)]],c)
    for sg in (-1,1): strands(d,[[(CX+sg*230,560),(CX+sg*245,680),(CX+sg*238,800)]],c,4)
    poly(d,[(CX-75,350),(CX-50,300),(CX-25,335),(CX,280),(CX+25,335),(CX+50,300),(CX+75,350)],gold,lw=7*K); ell(d,CX,318,14,14,gem,lw=5*K)
# ---- Lucien: golden side-parted hair with a heroic front quiff ----
LU=[(CX-240,590),(CX-246,450),(CX-180,360),(CX-60,320),(CX+80,300),(CX+190,330),(CX+250,420),(CX+246,560),(CX+215,500),(CX+150,450),(CX+60,470),(CX+20,420),(CX-60,455),(CX-150,470),(CX-200,520)]
def hair_lucien(d,view='F'):
    c=hexc('#f0c75a')
    if view=='B': back_cap(d,c,690); return
    poly(d,cr(LU,8),c); poly(d,cr([(CX-60,330),(CX+10,250),(CX+120,265),(CX+150,320),(CX+60,320)],6),c)  # quiff
    hl(d,[(CX-120,380),(CX-20,345),(CX+60,330),(CX-40,375)],c); line(d,arc(CX-70,470,90,40,200,320),lw=5*K,col=shade(c,.72))
    strands(d,[[(CX-180,400),(CX-60,370),(CX+60,380),(CX+170,430)],[(CX-200,470),(CX-80,420),(CX+60,420),(CX+200,470)],[(CX+30,270),(CX+90,290),(CX+120,320)]],c)
def hat_arcus(d,view='F'):
    white=hexc('#efe9dc'); gold=hexc('#e2b23c'); purple=hexc('#6a3b8c')
    poly(d,cr([(CX-170,470),(CX-150,300),(CX-90,170),(CX,100),(CX+90,170),(CX+150,300),(CX+170,470)],6),white)
    poly(d,[(CX-170,470),(CX-163,415),(CX+163,415),(CX+170,470)],gold,lw=10*K)
    if view!='B': line(d,[(CX,140),(CX,400)],lw=22*K,col=gold); ell(d,CX,270,34,34,purple,lw=8*K)
def helm_knight(d,view='F'):
    steel=hexc('#9aa4b4'); poly(d,cr([(CX-240,560),(CX-236,440),(CX-150,355),(CX,325),(CX+150,355),(CX+236,440),(CX+240,560)],6)+[(CX+240,560),(CX-240,560)],steel)
    poly(d,[(CX-242,565),(CX-242,520),(CX+242,520),(CX+242,565)],shade(steel,.8),lw=10*K)
    hl(d,[(CX-150,400),(CX-60,360),(CX-30,375),(CX-130,420)],steel)
    if view!='B': line(d,[(CX,350),(CX,515)],lw=18*K,col=shade(steel,.85))
    poly(d,cr([(CX-25,345),(CX-60,250),(CX,200),(CX+60,250),(CX+25,345)],5),hexc('#d8483e'),lw=8*K)
CH={'C01':(hair_kael,villager,(hexc('#2a2238'),)),'C02':(hair_elena,villager,(hexc('#efe6f4'),),back_elena),
    'C03':(hair_lucien,villager,(hexc('#f4f1e6'),)),'C04':(hat_arcus,villager,(hexc('#efe9dc'),)),
    'C05':(hair_kael,villager,(hexc('#8a6a48'),)),'C06':(helm_knight,villager,(hexc('#7a8496'),))}
for cid,spec in CH.items():
    hat,cos,args=spec[:3]; back=spec[3] if len(spec)>3 else None
    for v in 'FQSB':
        im=Image.new('RGB',(W,H),GREEN); d=ImageDraw.Draw(im)
        cos(im,d,v,*args); d=ImageDraw.Draw(im)
        if back and v!='B': back(d,v)
        SEED[0]=int(cid[1:])*7+3; ball(d,flip=(v=='B')); hat(d,v)
        im.resize((1080,1920),Image.LANCZOS).save(f'{out}/{cid}-{v}.png')
print('ok')
