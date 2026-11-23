# hair_library.py (v8 M3): hair and hat drawers, split out of mk_pm.py unchanged, plus the HAIR registry at the end.
from pm_draw import *
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
    poly(d,cr(AREN,6),c); hl(d,[(CX-150,365),(CX-40,330),(CX+70,342),(CX-20,370)],hexc('#3b4a78'))   # cold blue sheen (the ep1-3 look, restored 2026-11-24)
    strands(d,[[(CX-120,330),(CX-80,430),(CX-90,540)],[(CX+20,250),(CX+40,380),(CX+60,560)],[(CX+150,300),(CX+170,420),(CX+170,560)],[(CX-210,420),(CX-205,520),(CX-205,590)]],hexc('#2a2a3c'),4)
# ---- Guard (C02): navy peaked cap, black visor, gold badge ----
def cap_guard(d,view='F'):
    navy=hexc('#1f2c4a'); gold=hexc('#e2b23c'); blk=hexc('#121018'); band=hexc('#111827')
    # one connected cap: visor (drawn first, its top edge hides under the band) -> crown -> curved hat band -> badge (no wedge of face between the pieces, crown no wider than the skull + a little)
    if view!='B': poly(d,cr([(CX-204,520),(CX-100,508),(CX,503),(CX+100,508),(CX+204,520),(CX+178,553),(CX+90,570),(CX,576),(CX-90,570),(CX-178,553)],5),blk)
    poly(d,cr([(CX-246,505),(CX-258,412),(CX-196,326),(CX-90,288),(CX,280),(CX+90,288),(CX+196,326),(CX+258,412),(CX+246,505),(CX+150,492),(CX,478),(CX-150,492)],5),navy)
    poly(d,cr([(CX-246,505),(CX-150,492),(CX,478),(CX+150,492),(CX+246,505),(CX+242,540),(CX+150,528),(CX,514),(CX-150,528),(CX-242,540)],4),band)
    if view!='B': poly(d,[(CX-40,352),(CX,322),(CX+40,352),(CX+32,418),(CX,436),(CX-32,418)],gold,lw=7*K)
# ---- Fire man (C03): tall orange flame spikes with yellow tips ----
FIRE=[(CX-236,600),(CX-250,470),(CX-300,330),(CX-200,380),(CX-210,200),(CX-110,320),(CX-60,120),(CX+10,300),(CX+90,110),(CX+120,310),(CX+230,190),(CX+200,370),(CX+300,320),(CX+250,470),(CX+236,600),(CX+190,500),(CX+110,450),(CX,470),(CX-110,450),(CX-190,500)]
def hair_fire(d,view='F'):
    c=hexc('#ee7a22')
    if view=='B': back_cap(d,c,700)
    poly(d,cr(FIRE,5),c)
    for tip in [(CX-210,215),(CX-62,140),(CX+88,130),(CX+226,205)]: poly(d,cr([(tip[0]-28,tip[1]+90),(tip[0],tip[1]),(tip[0]+28,tip[1]+90),(tip[0],tip[1]+60)],4),hexc('#ffd04a'),lw=0)
    if view!='B': strands(d,[[(CX-140,330),(CX-120,420)],[(CX+20,330),(CX+10,430)],[(CX+150,340),(CX+140,430)]],c,4)
def skull_cap(d,col,hair_y=474,lw=None):
    """hair that hugs the head: outer edge follows the skull (centre CX,600), hairline across the forehead - one connected piece (fixes the flat floating band / temple gaps)"""
    outer=arc(CX,600,236,232,193,347,36); inner=[(CX+198,548),(CX+140,505),(CX+62,hair_y+6),(CX,hair_y),(CX-62,hair_y+6),(CX-140,505),(CX-198,548)]
    poly(d,outer+inner,col)
# ---- Strong man (C04): very short dark buzz cut ----
def hair_buzz(d,view='F'):
    c=hexc('#3a3236')
    if view=='B': back_cap(d,c,700); return
    skull_cap(d,c,470)
    import random; r=random.Random(4)
    for _ in range(26):
        x=CX+r.uniform(-170,170); y=r.uniform(400,500)
        if (x-CX)**2/225**2+(y-600)**2/200**2<1 and y<530-abs(x-CX)*.12: ell(d,x,y,4,4,shade(c,1.5),lw=0)
# ---- Thug leader (C05): magenta mohawk fin, shaved sides ----
def hair_mohawk(d,view='F'):
    c=hexc('#c2348a'); g=hexc('#4a3a40')
    if view=='B': back_cap(d,g,700)
    skull_cap(d,g,476)
    fin=[(CX-66,520),(CX-84,380),(CX-124,258),(CX-44,282),(CX-32,168),(CX+20,262),(CX+62,156),(CX+72,268),(CX+142,236),(CX+86,370),(CX+68,520),(CX+10,500),(CX-30,510)]
    if view=='S': fin=[(x-40,y) for x,y in fin]
    poly(d,cr(fin,5),c); hl(d,[(CX-30,300),(CX+10,262),(CX+20,282),(CX-20,322)],c)
# ---- Thug 2 (C06): knit beanie with a folded band ----
def hat_beanie(d,view='F'):
    c=hexc('#5c6b4e')
    # one connected beanie: dome that follows the skull -> curved folded cuff (same curve as the dome's rim, no overhang) -> pom-pom overlapping the crown
    poly(d,cr([(CX-244,505),(CX-252,410),(CX-190,330),(CX-90,296),(CX,288),(CX+90,296),(CX+190,330),(CX+252,410),(CX+244,505),(CX+150,492),(CX,478),(CX-150,492)],5),c)
    poly(d,cr([(CX-244,505),(CX-150,492),(CX,478),(CX+150,492),(CX+244,505),(CX+240,548),(CX+150,536),(CX,522),(CX-150,536),(CX-240,548)],4),shade(c,.82))
    for x in range(-210,231,42):
        yt=478+(x/244.0)**2*27; line(d,[(CX+x,yt+6),(CX+x,yt+40)],lw=4*K,col=shade(c,.6))
    ell(d,CX,284,36,32,shade(c,1.15),lw=8*K)
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
# ---- Noah (C09, ep4 the invisible hunter): ash-silver slicked-back hair, ONE continuous outline (like Aren's): swept spikes on top, a long fringe lock on the left, sideburns ----
NOAH=[(CX-236,600),(CX-254,490),(CX-228,395),(CX-150,345),(CX-70,320),(CX-26,236),(CX+28,318),(CX+92,252),(CX+122,336),(CX+206,292),(CX+192,384),(CX+276,382),(CX+242,474),(CX+248,610),
      (CX+198,545),(CX+152,490),(CX+60,466),(CX-34,478),(CX-104,532),(CX-148,610),(CX-182,540),(CX-204,590)]
def hair_noah(d,view='F'):
    c=hexc('#cdd0da')
    if view=='B':
        back_cap(d,c,720); poly(d,cr([(CX-170,350),(CX-166,250),(CX-60,320),(CX-12,232),(CX+60,312),(CX+176,262),(CX+170,350)],4),c)
        poly(d,cr([(CX-40,690),(CX-26,740),(CX+8,785),(CX+40,740),(CX+56,690)],5),c); return
    poly(d,cr(NOAH,6),c)
    hl(d,[(CX+10,340),(CX+110,352),(CX+160,390),(CX+70,376)],hexc('#f4f6fb'))
    strands(d,[[(CX-80,350),(CX-86,440),(CX-96,540)],[(CX+30,330),(CX+40,420),(CX+50,490)],[(CX+150,350),(CX+170,430),(CX+176,500)],[(CX-200,440),(CX-210,520),(CX-206,570)]],hexc('#8f93a6'),4)

# ---- Prisoner p1 (C10, ep4): brown curly mop, ONE connected bumpy outline that sits on the skull (the gossip scene needs a silhouette
#      that differs from the beanie thug: round curly cloud vs a flat cuffed dome) ----
def _curls(cx, cy, rx, ry, a0, a1, n, amp):
    pts = []
    for i in range(n + 1):
        t = math.radians(a0 + (a1 - a0) * i / n); k = 1 + (amp if i % 2 else 0)
        pts.append((cx + rx * k * math.cos(t), cy + ry * k * math.sin(t)))
    return pts
def hair_curly(d, view='F'):
    c = hexc('#6b4630')
    if view == 'B':
        poly(d, cr(_curls(CX, 520, 262, 250, 0, 360, 22, .07)[:-1], 5), c); return
    # user rule 2026-11-23: hair flows down the sides and JOINS the head (curly sideburns to the ear line), never a cap sitting on top
    left = [(CX - 232, 628), (CX - 262, 566), (CX - 248, 512), (CX - 276, 452)]
    top = _curls(CX, 470, 268, 215, 196, 344, 14, .08)                     # bumpy crown from the left temple over to the right temple
    right = [(CX + 276, 452), (CX + 248, 512), (CX + 264, 566), (CX + 234, 628)]
    fringe = [(CX + 206, 592), (CX + 196, 520), (CX + 150, 470), (CX + 96, 500), (CX + 40, 456), (CX - 20, 496), (CX - 80, 458), (CX - 140, 502), (CX - 194, 522), (CX - 206, 592)]
    poly(d, cr(left + top + right + fringe, 5), c)
    hl(d, [(CX - 120, 345), (CX - 40, 318), (CX + 30, 330), (CX - 50, 352)], c)
    for x, y in [(CX - 150, 390), (CX - 60, 360), (CX + 40, 372), (CX + 130, 396), (CX - 100, 430), (CX + 90, 436)]:
        line(d, arc(x, y, 26, 20, 200, 340, 8), lw=4 * K, col=shade(c, .62))

# ---------- registry (v8 M3): what charsheet.py shows as the Hair Library. silhouette = the outline family (characters in one scene
# must differ by SILHOUETTE, not only colour - SKILL.md "HAIR LIBRARY" rule); back = how the B view is drawn.
HAIR = {
    'aren_bangs':    dict(fn=hair_aren,   name='ผมดำยุ่ง หน้าม้ายาวปิดตาขวา', silhouette='spiky-bangs',  back='own'),
    'guard_cap':     dict(fn=cap_guard,   name='หมวกตำรวจ กระบังดำ ตรา',      silhouette='peaked-cap',   back='own'),
    'fire_spikes':   dict(fn=hair_fire,   name='ผมเปลวไฟส้ม ปลายเหลือง',       silhouette='flame-tall',   back='own'),
    'buzz':          dict(fn=hair_buzz,   name='ผมเกรียนสั้นติดหนังหัว',        silhouette='skull-tight',  back='own'),
    'mohawk':        dict(fn=hair_mohawk, name='โมฮอว์กชมพูม่วง ข้างโกน',       silhouette='fin',          back='own'),
    'beanie':        dict(fn=hat_beanie,  name='หมวกไหมพรม พับขอบ ปอมปอม',     silhouette='dome-cuff',    back='own'),
    'bandana':       dict(fn=hat_bandana, name='หัวโล้น ผ้าโพกแดง ปมข้าง',      silhouette='bald-wrap',    back='own'),
    'hood':          dict(fn=hood,        name='ฮู้ดลึก หน้าอยู่ในเงา',         silhouette='hood',         back='back_hood'),
    'curly':         dict(fn=hair_curly,  name='ผมหยิกฟูสีน้ำตาล',              silhouette='curly-cloud',  back='own'),
    'noah_swept':    dict(fn=hair_noah,   name='ผมเงินหวีเสย ปอยหน้าซ้าย',      silhouette='swept-spikes', back='own'),
    'boater':        dict(fn=hat_boater,  name='หมวกฟางปีกแบน (LAST VILLAIN)', silhouette='flat-brim',    back='none', args='band'),
    'cone':          dict(fn=hat_cone,    name='หมวกงอบ (LAST VILLAIN)',       silhouette='cone',         back='none', args='band'),
    'chief':         dict(fn=hat_chief,   name='หมวกหัวหน้า (LAST VILLAIN)',    silhouette='crown-cap',    back='none', args='col'),
}
