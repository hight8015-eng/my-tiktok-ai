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
# ================= THE PUPPET MASTER cast (hair silhouettes all different: swoop / cap / flame spikes / buzz / mohawk / beanie / bandana / hood) =================
# ---- Aren (C01): black messy hair, long layered bangs falling over the right eye (his "hidden" look) ----
AREN=[(CX-238,620),(CX-252,500),(CX-310,440),(CX-222,415),(CX-262,330),(CX-160,350),(CX-170,245),(CX-60,318),(CX-10,205),(CX+60,300),(CX+175,240),(CX+168,335),(CX+285,320),(CX+222,405),(CX+272,470),(CX+240,530),
      (CX+246,640),(CX+196,560),(CX+170,620),(CX+120,500),(CX+70,600),(CX+30,480),(CX-40,560),(CX-80,470),(CX-150,580),(CX-175,500),(CX-200,600)]
def hair_aren(d,view='F'):
    c=hexc('#16131d')
    if view=='B': back_cap(d,c,720); poly(d,cr([(CX-170,350),(CX-170,245),(CX-60,318),(CX-10,205),(CX+60,300),(CX+175,240),(CX+168,335)]),c); return
    poly(d,cr(AREN,6),c)
    strands(d,[[(CX-120,330),(CX-80,430),(CX-90,540)],[(CX+20,250),(CX+40,380),(CX+60,560)],[(CX+150,300),(CX+170,420),(CX+170,560)],[(CX-210,420),(CX-205,520),(CX-205,590)]],hexc('#2a2a3c'),4)
# ---- Guard (C02): navy peaked cap, black visor, gold badge ----
def cap_guard(d,view='F'):
    navy=hexc('#1f2c4a'); gold=hexc('#e2b23c'); blk=hexc('#121018')
    poly(d,cr([(CX-232,470),(CX-262,370),(CX-150,300),(CX,285),(CX+150,300),(CX+262,370),(CX+232,470)],6)+[(CX+232,470),(CX-232,470)],navy)
    poly(d,[(CX-236,475),(CX-236,440),(CX+236,440),(CX+236,475)],hexc('#111827'),lw=9*K)
    if view!='B':
        poly(d,cr([(CX-215,470),(CX,445),(CX+215,470),(CX+150,540),(CX,555),(CX-150,540)],6),blk)
        poly(d,[(CX-40,330),(CX,300),(CX+40,330),(CX+30,395),(CX,410),(CX-30,395)],gold,lw=7*K)
        hl(d,[(CX-160,330),(CX-70,305),(CX-60,320),(CX-150,345)],navy)
# ---- Fire man (C03): tall orange flame spikes with yellow tips ----
FIRE=[(CX-236,600),(CX-250,470),(CX-300,330),(CX-200,380),(CX-210,200),(CX-110,320),(CX-60,120),(CX+10,300),(CX+90,110),(CX+120,310),(CX+230,190),(CX+200,370),(CX+300,320),(CX+250,470),(CX+236,600),(CX+190,500),(CX+110,450),(CX,470),(CX-110,450),(CX-190,500)]
def hair_fire(d,view='F'):
    c=hexc('#ee7a22')
    if view=='B': back_cap(d,c,700)
    poly(d,cr(FIRE,5),c)
    for tip in [(CX-210,215),(CX-62,140),(CX+88,130),(CX+226,205)]: poly(d,cr([(tip[0]-28,tip[1]+90),(tip[0],tip[1]),(tip[0]+28,tip[1]+90),(tip[0],tip[1]+60)],4),hexc('#ffd04a'),lw=0)
    if view!='B': strands(d,[[(CX-140,330),(CX-120,420)],[(CX+20,330),(CX+10,430)],[(CX+150,340),(CX+140,430)]],c,4)
# ---- Strong man (C04): very short dark buzz cut ----
def hair_buzz(d,view='F'):
    c=hexc('#3a3236'); lo=600 if view=='B' else 470
    poly(d,cr([(CX-224,lo+70),(CX-226,440),(CX-155,385),(CX,368),(CX+155,385),(CX+226,440),(CX+224,lo+70),(CX+196,lo+18),(CX,lo),(CX-196,lo+18)]),c)
    import random; r=random.Random(4)
    for _ in range(26): x=CX+r.uniform(-180,180); y=r.uniform(395,lo-10); ell(d,x,y,4,4,shade(c,1.5),lw=0)
# ---- Thug leader (C05): magenta mohawk fin, shaved sides ----
def hair_mohawk(d,view='F'):
    c=hexc('#c2348a'); g=hexc('#4a3a40')
    poly(d,cr([(CX-224,540),(CX-226,440),(CX-155,385),(CX,368),(CX+155,385),(CX+226,440),(CX+224,540),(CX+196,490),(CX,476),(CX-196,490)]),shade(g,1.0))
    fin=[(CX-60,470),(CX-80,330),(CX-120,250),(CX-40,270),(CX-30,160),(CX+20,250),(CX+60,150),(CX+70,260),(CX+140,230),(CX+80,340),(CX+60,470)]
    if view=='S': fin=[(x-40,y) for x,y in fin]
    poly(d,cr(fin,5),c); hl(d,[(CX-30,280),(CX+10,240),(CX+20,260),(CX-20,300)],c)
# ---- Thug 2 (C06): knit beanie with a folded band ----
def hat_beanie(d,view='F'):
    c=hexc('#5c6b4e')
    poly(d,cr([(CX-240,520),(CX-236,400),(CX-150,320),(CX,295),(CX+150,320),(CX+236,400),(CX+240,520)],6)+[(CX+240,520),(CX-240,520)],c)
    poly(d,[(CX-246,525),(CX-246,455),(CX+246,455),(CX+246,525)],shade(c,.82),lw=10*K)
    for x in range(-210,231,42): line(d,[(CX+x,462),(CX+x,518)],lw=4*K,col=shade(c,.6))
    ell(d,CX,292,34,30,shade(c,1.15),lw=8*K)
# ---- Thug 3 (C07): bald with a red bandana, knot tails at the side ----
def hat_bandana(d,view='F'):
    r=hexc('#c83a3a')
    poly(d,cr([(CX-238,500),(CX-232,410),(CX-150,345),(CX,325),(CX+150,345),(CX+232,410),(CX+238,500),(CX,470)],6),r)
    for x,y in [(CX-120,400),(CX+40,380),(CX+150,430),(CX-30,440)]: ell(d,x,y,10,10,(245,235,225),lw=0)
    if view!='B': poly(d,cr([(CX+232,450),(CX+320,430),(CX+300,500),(CX+250,480)],4),r); poly(d,cr([(CX+232,470),(CX+300,540),(CX+250,560)],4),shade(r,.85))
# ---- Hooded gunman (C08): deep hood, face mostly in shadow ----
def back_hood(d,view='F'):
    c=hexc('#3a3448'); poly(d,cr([(CX-300,820),(CX-290,560),(CX-230,380),(CX,300),(CX+230,380),(CX+290,560),(CX+300,820)],6),c)
def hood(d,view='F'):
    c=hexc('#3a3448')
    if view=='B': poly(d,cr([(CX-290,800),(CX-285,520),(CX-220,370),(CX,300),(CX+220,370),(CX+285,520),(CX+290,800)],6),c); return
    poly(d,cr([(CX-280,760),(CX-275,520),(CX-210,380),(CX,320),(CX+210,380),(CX+275,520),(CX+280,760),(CX+215,700),(CX+215,520),(CX+150,470),(CX,455),(CX-150,470),(CX-215,520),(CX-215,700)],6),c)
    hl(d,[(CX-200,420),(CX-120,370),(CX-100,385),(CX-185,440)],c)
CH={'C01':(hair_aren,villager,(hexc('#1b1820'),)),'C02':(cap_guard,villager,(hexc('#2c3a5c'),)),
    'C03':(hair_fire,villager,(hexc('#c8bfa8'),)),'C04':(hair_buzz,villager,(hexc('#6a5a4a'),)),
    'C05':(hair_mohawk,villager,(hexc('#2a2a30'),)),'C06':(hat_beanie,villager,(hexc('#4a4038'),)),
    'C07':(hat_bandana,villager,(hexc('#38404a'),)),'C08':(hood,villager,(hexc('#3a3448'),),back_hood)}
for cid,spec in CH.items():
    hat,cos,args=spec[:3]; back=spec[3] if len(spec)>3 else None
    for v in 'FQSB':
        im=Image.new('RGB',(W,H),GREEN); d=ImageDraw.Draw(im)
        cos(im,d,v,*args); d=ImageDraw.Draw(im)
        if back and v!='B': back(d,v)
        SEED[0]=int(cid[1:])*7+3; ball(d,flip=(v=='B')); hat(d,v)
        im.resize((1080,1920),Image.LANCZOS).save(f'{out}/{cid}-{v}.png')
print('ok')
