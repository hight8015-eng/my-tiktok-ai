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
# ---------- "นาฬิกาพกสีทอง" cast ----------
def hat_hood(d):
    h=hexc('#4fa3a0'); poly(d,[(CX-240,720),(CX-252,520)]+arc(CX,520,252,250,180,360)+[(CX+252,520),(CX+240,720),(CX+190,700),(CX+196,520)]+arc(CX,520,196,190,360,180)+[(CX-196,520),(CX-190,700)],h)
def hat_top(d):
    k=hexc('#24202c'); ell(d,CX,470,290,52,k); poly(d,[(CX-150,462),(CX-160,170),(CX+160,170),(CX+150,462)],k); ell(d,CX,170,160,30,shade(k,1.3))
    poly(d,[(CX-153,400),(CX+153,400),(CX+151,450),(CX-151,450)],hexc('#c8a030'),lw=9*K)
def hat_coronet(d):
    r=hexc('#9a2a3a'); g=hexc('#f2c230'); poly(d,arc(CX,470,222,44,180,0)+arc(CX,470,226,170,0,-180),r)
    poly(d,[(CX-226,480),(CX-226,410),(CX-170,360),(CX-110,410),(CX-55,340),(CX,410),(CX+55,340),(CX+110,410),(CX+170,360),(CX+226,410),(CX+226,480)],g,lw=10*K)
    for x in (-110,0,110): ell(d,CX+x,450,20,20,hexc('#3a8ae0'),lw=7*K)
def hat_combed(d):
    h=hexc('#5a5a66'); poly(d,[(CX-232,600),(CX-238,500)]+arc(CX,500,238,180,180,360)+[(CX+238,500),(CX+232,600),(CX+190,520),(CX+60,470),(CX-60,500),(CX-190,560)],h)
    line(d,[(CX-40,330),(CX+20,490)],lw=7*K,col=shade(h,.7))
def hat_tiara(d):
    h=hexc('#f0c050'); poly(d,[(CX-245,760),(CX-250,520)]+arc(CX,520,250,240,180,360)+[(CX+250,520),(CX+245,760),(CX+185,740),(CX+190,540),(CX+80,470),(CX-80,470),(CX-190,540),(CX-185,740)],h)
    poly(d,[(CX-90,330),(CX-60,260),(CX-30,300),(CX,230),(CX+30,300),(CX+60,260),(CX+90,330)],hexc('#e8e8f8'),lw=8*K); ell(d,CX,275,14,14,hexc('#ff6a9a'),lw=6*K)
def hat_helmet(d):
    m=hexc('#9aa4b4'); ell(d,CX,478,300,58,shade(m,.9)); poly(d,arc(CX,470,215,40,180,0)+arc(CX,470,218,210,0,-180),m); line(d,[(CX,262),(CX,450)],lw=9*K,col=shade(m,.7))
def coat(im,d,view,col,trim,shirt=True,tie=None,chain=False,ermine=False):
    m,k=body(d,col,160,240,70,bulge=22,view=view); apply_shade(im,m,col)
    if ermine: line(d,[(CX-240*k,1555),(CX+240*k,1555)],lw=34*K,col=(250,248,244)); [ell(d,CX+x*k,1555,8,10,INK,lw=0) for x in (-170,-90,0,90,170)]
    if view!='B':
        dx=dx_view(view)*.9
        if shirt: poly(d,[(CX+dx-80*k,892),(CX+dx,1110),(CX+dx+80*k,892)],(250,248,244),lw=9*K)
        if tie: poly(d,[(CX+dx-40*k,905),(CX+dx,935),(CX+dx+40*k,905),(CX+dx+40*k,965),(CX+dx,935),(CX+dx-40*k,965)],hexc(tie),lw=7*K)
        line(d,[(CX+dx-80*k,892),(CX+dx-20*k,1250)],lw=12*K,col=hexc(trim)); line(d,[(CX+dx+80*k,892),(CX+dx+20*k,1250)],lw=12*K,col=hexc(trim))
        for y in (1180,1300,1420): ell(d,CX+dx,y,16,16,hexc(trim),lw=7*K)
        if chain: line(d,arc(CX+dx+70*k,1200,70*k,60,0,180),lw=8*K,col=hexc('#f2c230')); ell(d,CX+dx+150*k,1215,26,26,hexc('#f2c230'),lw=7*K)
    body_redraw_outline(d,160,240,70,22,view)
def gown(im,d,view,col):
    m,k=body(d,col,150,262,70,bulge=18,view=view); apply_shade(im,m,col)
    line(d,[(CX-258*k,1550),(CX+258*k,1550)],lw=22*K,col=(250,240,248)); line(d,[(CX-150*k,1150),(CX+150*k,1150)],lw=18*K,col=shade(col,.8))
    if view!='B': dx=dx_view(view)*.9; poly(d,[(CX+dx-100*k,892),(CX+dx,980),(CX+dx+100*k,892)],(250,240,248),lw=9*K); ell(d,CX+dx,1150,22,22,hexc('#ff6a9a'),lw=7*K)
    body_redraw_outline(d,150,262,70,18,view)
def tunic(im,d,view,col):
    m,k=body(d,col,165,200,80,bulge=24,view=view); apply_shade(im,m,col)
    line(d,[(CX-180*k,1300),(CX+180*k,1300)],lw=24*K,col=hexc('#6a4226'))
    if view!='B': dx=dx_view(view); poly(d,[(CX+dx-70*k,1020),(CX+dx+70*k,1020),(CX+dx+70*k,1140),(CX+dx,1200),(CX+dx-70*k,1140)],hexc('#f2c230'),lw=8*K); poly(d,[(CX+dx-28*k,1060),(CX+dx+28*k,1060),(CX+dx,1130)],hexc('#c8483a'),lw=6*K)
    body_redraw_outline(d,165,200,80,24,view)
def jacket(im,d,view,col,zip_=True):
    m,k=body(d,col,165,200,80,bulge=24,view=view); apply_shade(im,m,col)
    line(d,[(CX-200*k,1560),(CX+200*k,1560)],lw=24*K,col=shade(col,.75)); line(d,[(CX-203*k,1544),(CX+203*k,1544)],lw=8*K)
    if view!='B':
        dx=dx_view(view)
        poly(d,[(CX+dx-75*k,892),(CX+dx,960),(CX+dx+75*k,892)],(247,236,214),lw=9*K)
        if zip_: line(d,[(CX+dx,960),(CX+dx,1540)],lw=9*K)
        for sx in (-1,1): poly(d,[(CX+dx+sx*40*k,1330),(CX+dx+sx*140*k,1330),(CX+dx+sx*140*k,1440),(CX+dx+sx*40*k,1440)],shade(col,.85),lw=8*K)
    body_redraw_outline(d,165,200,80,24,view)
# ---------- "เกมเอาชีวิตรอด" series cast ----------
def hair(d,col,top=262,side=560,spikes=None,fringe=None):
    h=hexc(col); pts=[(CX-236,side),(CX-244,500)]+arc(CX,500,244,top-40+200-200 if False else 238,180,360)+[(CX+244,500),(CX+236,side)]
    fr=fringe or [(CX+200,470),(CX+90,420),(CX+20,455),(CX-70,415),(CX-170,460),(CX-205,520)]
    poly(d,pts+fr,h)
    if spikes:
        for (x,y,dx) in spikes: poly(d,[(CX+x-55,y+70),(CX+x+dx,y-40),(CX+x+55,y+60)],h,lw=0)
        poly(d,pts+fr,h,lw=0); d2=d
        # redraw outline of the whole silhouette (spikes + cap)
        out=[(CX-236,side),(CX-244,500)]
        for (x,y,dx) in sorted(spikes): pass
def hat_spiky(d):
    h=hexc('#2a2a36'); sp=[(-170,330,-60),(-90,270,-30),(0,250,10),(90,265,40),(170,320,80)]
    for (x,y,dx) in sp: poly(d,[(CX+x-62,y+90),(CX+x+dx,y-55),(CX+x+62,y+80)],h)
    poly(d,[(CX-236,580),(CX-244,500)]+arc(CX,500,244,236,180,360)+[(CX+244,500),(CX+236,580),(CX+196,500),(CX+110,440),(CX+40,480),(CX-40,430),(CX-130,480),(CX-200,520)],h)
    line(d,[(CX+60,330),(CX+120,300)],lw=8*K,col=shade(h,1.8))
def hat_buzz(d):
    h=hexc('#6a4a32'); poly(d,[(CX-232,520),(CX-240,470)]+arc(CX,480,240,222,180,360)+[(CX+240,470),(CX+232,520),(CX+150,410),(CX,395),(CX-150,410)],h)
    for x in (-120,-40,40,120): line(d,[(CX+x,300),(CX+x*1.05,360)],lw=5*K,col=shade(h,.75))
def hat_goggles(d):
    h=hexc('#e07a2a'); poly(d,[(CX-240,600),(CX-262,470),(CX-200,330),(CX-120,268),(CX-30,240),(CX+60,250),(CX+160,275),(CX+235,350),(CX+262,470),(CX+240,600),(CX+196,500),(CX+120,450),(CX+60,480),(CX-20,440),(CX-110,480),(CX-200,520)],h)
    line(d,[(CX-250,400),(CX+250,400)],lw=26*K,col=hexc('#3a3a44'))
    for sx in (-1,1): ell(d,CX+sx*95,395,70,52,hexc('#7ad0f0')); ell(d,CX+sx*95,395,40,28,shade(hexc('#7ad0f0'),1.25),lw=0)
def hat_headband(d):
    h=hexc('#1e1e28'); poly(d,[(CX-236,560),(CX-244,500)]+arc(CX,500,244,236,180,360)+[(CX+244,500),(CX+236,560),(CX+200,500),(CX+120,452),(CX,470),(CX-120,452),(CX-200,500)],h)
    for (x,y) in ((-150,290),(-30,255),(100,268),(200,320)): poly(d,[(CX+x-50,y+60),(CX+x+20,y-40),(CX+x+50,y+50)],h)
    poly(d,arc(CX,455,250,40,180,360)+arc(CX,415,248,40,0,-180)[::-1][::-1],hexc('#d8283a'),lw=10*K)
    poly(d,[(CX+238,420),(CX+330,380),(CX+320,450),(CX+240,455)],hexc('#d8283a'),lw=9*K)
def hat_fedora(d):
    w=hexc('#f4f2ec'); ell(d,CX,470,300,58,w); poly(d,[(CX-170,462),(CX-180,300),(CX-60,250),(CX,280),(CX+60,250),(CX+180,300),(CX+170,462)],w)
    poly(d,[(CX-174,400),(CX+174,400),(CX+171,452),(CX-171,452)],hexc('#2a2a32'),lw=9*K)
def hat_tactical(d):
    m=hexc('#2c2f36'); ell(d,CX,478,268,52,shade(m,.9)); poly(d,arc(CX,470,252,44,180,0)+arc(CX,470,256,236,0,-180),m)
    poly(d,[(CX-190,330),(CX+190,330),(CX+180,400),(CX-180,400)],hexc('#e8452a'),lw=10*K)
    line(d,[(CX-150,365),(CX+150,365)],lw=6*K,col=shade(hexc('#e8452a'),1.3))
def hat_slick(d):
    h=hexc('#d8dce8'); poly(d,[(CX-236,600),(CX-246,480)]+arc(CX,490,246,240,180,360)+[(CX+246,480),(CX+236,600),(CX+210,470),(CX+80,410),(CX-100,420),(CX-190,480),(CX-218,590)],h)
    for k in range(3): line(d,arc(CX+40,520,200-k*40,200-k*50,200,300),lw=6*K,col=shade(h,.7))
def hat_bob(d):
    h=hexc('#5a3a2a'); poly(d,[(CX-262,760),(CX-270,500)]+arc(CX,500,270,262,180,360)+[(CX+270,500),(CX+262,760),(CX+190,760),(CX+196,520),(CX+60,440),(CX-60,440),(CX-196,520),(CX-190,760)],h)
    poly(d,[(CX+150,360),(CX+230,320),(CX+230,400)],hexc('#4a8ae0'),lw=8*K); poly(d,[(CX+150,360),(CX+90,320),(CX+90,400)],hexc('#4a8ae0'),lw=8*K)
def hat_cap(d):
    r=hexc('#d84a3a'); poly(d,arc(CX,470,232,44,180,0)+arc(CX,470,236,200,0,-180),r)
    poly(d,[(CX-60,470),(CX+330,470),(CX+340,500),(CX-60,505)],shade(r,.85)); ell(d,CX,272,22,16,shade(r,.8),lw=8*K)
def uniform(im,d,view,tie,bottom,skirt=False,badge=True):
    wh=hexc('#f6f6f2'); m,k=body(d,wh,165,200 if not skirt else 225,80,bulge=24,view=view); apply_shade(im,m,wh)
    bc=hexc(bottom); y0=1360 if not skirt else 1330
    poly(d,[(CX-260,y0),(CX+260,y0),(CX+260,1700),(CX-260,1700)],bc,lw=0); line(d,[(CX-260,y0),(CX+260,y0)],lw=10*K)
    if skirt:
        for x in (-140,-50,40,130): line(d,[(CX+x*k,y0+20),(CX+x*k*1.15,1610)],lw=6*K,col=shade(bc,.7))
    if view!='B':
        dx=dx_view(view)
        poly(d,[(CX+dx-70*k,892),(CX+dx-10*k,950),(CX+dx-90*k,990)],wh,lw=9*K); poly(d,[(CX+dx+70*k,892),(CX+dx+10*k,950),(CX+dx+90*k,990)],wh,lw=9*K)
        if skirt: poly(d,[(CX+dx,960),(CX+dx-60*k,1000),(CX+dx-50*k,940)],hexc(tie),lw=7*K); poly(d,[(CX+dx,960),(CX+dx+60*k,1000),(CX+dx+50*k,940)],hexc(tie),lw=7*K)
        else: poly(d,[(CX+dx-26*k,945),(CX+dx+26*k,945),(CX+dx+32*k,1180),(CX+dx,1225),(CX+dx-32*k,1180)],hexc(tie),lw=8*K)
        if badge: poly(d,[(CX+dx+70*k,1040),(CX+dx+150*k,1040),(CX+dx+150*k,1120),(CX+dx+70*k,1120)],shade(wh,.92),lw=7*K); ell(d,CX+dx+110*k,1075,18,18,hexc('#3a64b0'),lw=5*K)
    body_redraw_outline(d,165,200 if not skirt else 225,80,24,view)
def hoodie(im,d,view,col):
    c=hexc(col); m,k=body(d,c,195,232,85,bulge=30,view=view); apply_shade(im,m,c)
    line(d,[(CX-232*k,1560),(CX+232*k,1560)],lw=26*K,col=shade(c,.78))
    if view!='B':
        dx=dx_view(view); poly(d,[(CX+dx-120*k,1330),(CX+dx+120*k,1330),(CX+dx+150*k,1480),(CX+dx-150*k,1480)],shade(c,.86),lw=8*K)
        for sx in (-1,1): line(d,[(CX+dx+sx*45*k,905),(CX+dx+sx*50*k,1080)],lw=8*K); ell(d,CX+dx+sx*50*k,1090,12,12,hexc('#f2f2ea'),lw=5*K)
    else: poly(d,arc(CX,900,160,90,0,180),shade(c,.85),lw=9*K)
    body_redraw_outline(d,195,232,85,30,view)
def vest(im,d,view,col):
    sh=hexc('#f0ece0'); c=hexc(col); m,k=body(d,sh,160,198,80,bulge=24,view=view); apply_shade(im,m,sh)
    if view!='B':
        dx=dx_view(view)
        for sx in (-1,1): poly(d,[(CX+dx+sx*40*k,900),(CX+dx+sx*175*k,900),(CX+dx+sx*205*k,1560),(CX+dx+sx*40*k,1560)],c,lw=9*K)
        for sx in (-1,1):
            for y in (1180,1360): poly(d,[(CX+dx+sx*70*k,y),(CX+dx+sx*160*k,y),(CX+dx+sx*160*k,y+100),(CX+dx+sx*70*k,y+100)],shade(c,.84),lw=7*K)
        line(d,[(CX+dx+100*k,1180),(CX+dx+110*k,1120)],lw=10*K,col=hexc('#9aa4b4')); ell(d,CX+dx-110*k,1150,16,16,hexc('#f2c230'),lw=6*K)
    else: poly(d,[(CX-200,900),(CX+200,900),(CX+205,1560),(CX-205,1560)],c,lw=9*K)
    body_redraw_outline(d,160,198,80,24,view)
def track(im,d,view,col):
    c=hexc(col); m,k=body(d,c,165,200,80,bulge=24,view=view); apply_shade(im,m,c)
    line(d,[(CX-200*k,1560),(CX+200*k,1560)],lw=24*K,col=hexc('#f4f4f0'))
    if view!='B':
        dx=dx_view(view); poly(d,[(CX+dx-60*k,892),(CX+dx,950),(CX+dx+60*k,892)],hexc('#f4f4f0'),lw=9*K); line(d,[(CX+dx,950),(CX+dx,1540)],lw=9*K)
        for sx in (-1,1): line(d,[(CX+dx+sx*150*k,960),(CX+dx+sx*185*k,1540)],lw=16*K,col=hexc('#f4f4f0'))
        poly(d,star(CX+dx+95*k,1060,30),hexc('#f2c230'),lw=6*K)
    else:
        for sx in (-1,1): line(d,[(CX+sx*150,960),(CX+sx*185,1540)],lw=16*K,col=hexc('#f4f4f0'))
        ell(d,CX,1150,70,70,hexc('#f4f4f0'),lw=7*K); 
    body_redraw_outline(d,165,200,80,24,view)
def tactical(im,d,view):
    c=hexc('#2c2f36'); m,k=body(d,c,170,205,80,bulge=24,view=view); apply_shade(im,m,c)
    if view!='B':
        dx=dx_view(view); poly(d,[(CX+dx-120*k,960),(CX+dx+120*k,960),(CX+dx+130*k,1350),(CX+dx-130*k,1350)],hexc('#3e434c'),lw=8*K)
        for x in (-80,0,80): poly(d,[(CX+dx+(x-32)*k,1200),(CX+dx+(x+32)*k,1200),(CX+dx+(x+32)*k,1320),(CX+dx+(x-32)*k,1320)],hexc('#4a505a'),lw=6*K)
        poly(d,[(CX+dx-40*k,1000),(CX+dx+40*k,1000),(CX+dx+40*k,1060),(CX+dx-40*k,1060)],hexc('#e8452a'),lw=6*K)
    line(d,[(CX-205*k,1420),(CX+205*k,1420)],lw=26*K,col=hexc('#1a1c22'))
    body_redraw_outline(d,170,205,80,24,view)
CH={'C10':(hat_fedora,coat,(hexc('#26262e'),'#c8a030',True,'#c8283a'))}

for cid,(hat,cos,args) in CH.items():
    for v in 'FQSB':
        im=Image.new('RGB',(W,H),GREEN); d=ImageDraw.Draw(im)
        cos(im,d,v,*args); d=ImageDraw.Draw(im)
        SEED[0]=int(cid[1:])*7+3; ball(d,flip=(v=='B')); hat(d)
        im.resize((1080,1920),Image.LANCZOS).save(f'{out}/{cid}-{v}.png')
print('ok')
