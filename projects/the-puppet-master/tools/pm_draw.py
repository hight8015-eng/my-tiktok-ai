# pm_draw.py (v8 M3, 2026-11-23): drawing primitives + head/body shapes shared by mk_pm.py, outfits.py and hair_library.py.
# Split out of mk_pm.py unchanged (the sprites must stay pixel-identical: tools test T3).
import sys, math
from PIL import Image, ImageDraw
K=3; W,H=1080*K,1920*K; GREEN=(0,177,64); INK=(34,24,38); LW=15*K  # v3: thick cartoon ink line
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
