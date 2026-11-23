# outfits.py (v8 M3): costume drawers (outfit library), split out of mk_pm.py unchanged.
from pm_draw import *
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
