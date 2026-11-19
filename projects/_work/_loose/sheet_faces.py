import sys
from PIL import Image, ImageDraw, ImageFont
F=open('faces.txt').read().split()
TH={'neutral':'ปกติ','smileReal':'ยิ้มจริงใจ','smilePolite':'ยิ้มมารยาท','smileSad':'ยิ้มเศร้า','laugh':'หัวเราะ','relieved':'โล่งใจ','touched':'ซึ้งใจ','awe':'ทึ่ง','hopeful':'มีหวัง','pleading':'อ้อนวอน','surprised':'ประหลาดใจ','terror':'สยองสุดขีด','dread':'หวาดผวา','anxious':'กังวล','hurt':'เจ็บใจ','despair':'สิ้นหวัง','guilty':'รู้สึกผิด','ashamed':'อับอาย','embarrassed':'เขินจนเหงื่อตก','shy':'เขินอาย','annoyed':'รำคาญ','bored':'เบื่อ','skeptical':'ไม่เชื่อ','suspicious':'ระแวง','contempt':'ดูถูก','disgust':'ขยะแขยง','annoyedHard':'หงุดหงิดมาก','rage':'โกรธจัด','coldFury':'โกรธเงียบ','menace':'ข่มขู่','glare':'จ้องเขม็ง','focused':'จดจ่อ','thinking':'ครุ่นคิด','realize':'เพิ่งรู้ตัว','confused':'งง','exhausted':'หมดแรง','pain':'เจ็บปวด','mocking':'เยาะเย้ย','sinister':'ร้ายลึก','stoic':'นิ่งเฉย','determinedHard':'มุ่งมั่น'}
fn=ImageFont.truetype('/root/.claude/skills/storybook-3d-selfdrawn-story/src/fonts/Prompt-SemiBold.ttf',26)
W,H,C=300,250,6; R=(len(F)+C-1)//C
out=Image.new('RGB',(C*W,R*(H+44)),(24,20,36)); d=ImageDraw.Draw(out)
box=tuple(map(int,sys.argv[1].split(','))) if len(sys.argv)>1 else (130,1020,950,1700)
for i,f in enumerate(F):
    im=Image.open(f'f_{i}.jpg').crop(box).resize((W,H)); x,y=(i%C)*W,(i//C)*(H+44); out.paste(im,(x,y))
    t=f'{TH.get(f,f)}  {f}'; tw=d.textlength(t,font=fn); d.text((x+(W-tw)/2,y+H+6),t,font=fn,fill=(240,236,250))
out.save('faces_sheet.jpg',quality=90); print(out.size)
