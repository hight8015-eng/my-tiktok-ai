from PIL import Image, ImageDraw, ImageFont
F=open('poses.txt').read().split()
TH={'neutral':'ปกติ','relaxed':'สบายๆ','confident':'มั่นใจ','handsOnHips':'เท้าเอว','armsCrossed':'กอดอก','handsBehind':'ไขว้หลัง','proud':'ภูมิใจ','thinking':'ครุ่นคิด','chinRub':'ลูบคาง','headScratch':'เกาหัว','realize':'นึกออก','facepalm':'กุมขมับ','explain':'อธิบาย','shrug':'ยักไหล่','point':'ชี้','accuse':'ชี้กล่าวหา','stopHand':'ห้าม','offer':'ยื่นให้','beckon':'กวักมือ','wave':'โบกมือ','whisper':'กระซิบ','leanIn':'โน้มเข้า','leanBack':'เอนหนี','laugh':'หัวเราะ','cheer':'ดีใจสุดๆ','fistPump':'กำหมัดเย้','thumbsUp':'ยกนิ้ว','relief':'โล่งอก','recoil':'ผงะ','gasp':'ปิดปาก','defend':'ยกแขนกัน','cower':'หมอบกลัว','frozen':'ตัวแข็ง','handsUp':'ยอมแพ้','anxious':'บีบมือกังวล','selfHug':'กอดตัวเอง','slump':'คอตก','heartbreak':'กุมหัวใจ','ashamed':'หลบตา','exhausted':'เท้าเข่าหอบ','fists':'กำหมัดสั่น','menace':'ก้มหน้าข่ม','guard':'ตั้งการ์ด','grabCollar':'กระชากคอเสื้อ','coldStare':'จ้องนิ่ง','sneak':'ย่อง','peek':'ชะโงกแอบดู'}
fn=ImageFont.truetype('/root/.claude/skills/storybook-3d-selfdrawn-story/src/fonts/Prompt-SemiBold.ttf',22)
W,H,C=230,420,8; R=(len(F)+C-1)//C
out=Image.new('RGB',(C*W,R*(H+60)),(24,20,36)); d=ImageDraw.Draw(out)
for i,f in enumerate(F):
    im=Image.open(f'p_{i}.jpg').crop((90,80,990,1724)).resize((W,H)); x,y=(i%C)*W,(i//C)*(H+60); out.paste(im,(x,y))
    for j,t in enumerate([TH.get(f,f),f]):
        tw=d.textlength(t,font=fn); d.text((x+(W-tw)/2,y+H+2+j*27),t,font=fn,fill=(240,236,250))
out.save('poses_sheet.jpg',quality=88); print(out.size)
