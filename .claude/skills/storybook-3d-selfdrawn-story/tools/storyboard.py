# v7.6 python3 tools/storyboard.py [project_root=.] : voice timing -> a shot table that already follows the house rules.
# Reads src/timing.json (islands + caps from make_ep's timing stage). Writes:
#   out/storyboard.md        the table to review/edit: id, t0-t1, line, shot size, transition, notes (rule hints)
#   out/shots_skeleton.js    one S(...) per row with the line, size and notes as comments, ready to fill in shots.js
# Rules built in (SKILL v7.3-7.5): hook = >= 5 framings in the first 10 s (lines split at caption-chunk boundaries, ~1.5-2.5 s);
# shot sizes never repeat back to back; emotion words -> CU, objects/numbers -> INSERT, places -> WIDE establishing;
# dialogue (quotes) -> OTS shot/reverse; thought words -> whisperAt; place/name first mentions -> label hints;
# transitions: cut by default, a place change gets sweep/push/fgwipe in turn, a time jump gets dis; no 4 same in a row.
import json, os, re, sys
R = sys.argv[1] if len(sys.argv) > 1 else '.'
T = json.load(open(f'{R}/src/timing.json', encoding='utf-8')); isl = T['islands']; caps = T.get('caps', []); END = T['end']
EMO = r'กะพริบ|จ้อง|สายตา|กลัว|โกรธ|ตกใจ|ร้องไห้|น้ำตา|ยิ้ม|หัวเราะ|เจ็บ|ปวด|สั่น|ช็อก|อึ้ง|แค้น|เกลียด|รัก|ตาย|ฆ่า|เสียใจ|สิ้นหวัง|ดีใจ|ช้ำ|หน้า'
OBJ = r'กระดาษ|ปืน|มีด|เงิน|บาท|ซอง|จดหมาย|โทรศัพท์|มือถือ|กุญแจ|ด้าย|เชือก|แหวน|นาฬิกา|ประตู|ป้าย|รูป|ภาพ|\d'
PLACE = r'ที่นี่|เขต|เมือง|โกดัง|ถนน|ตรอก|ซอย|ดาดฟ้า|ตึก|ห้อง|บ้าน|บาร์|สถานี|ฐาน|ZERO CITY'
TIME = r'ต่อมา|คืนนั้น|วันรุ่งขึ้น|หลังจากนั้น|ผ่านไป|เมื่อก่อน|ย้อนกลับ|ปีก่อน|เช้า|ค่ำ'
THINK = r'คิด(ใน|ว่า)|ในใจ|กระซิบ|ส่งความคิด|เสียงในหัว'
ACT = r'หมัด|พุ่ง|แตก|พัง|ระเบิด|ต่อย|ชก|ทุบ|ยิง|วิ่ง|เดิน|กระโดด|ล้ม|ผลัก|คว้า|ดึง|ขว้าง|เตะ|หนี|ไล่|นั่ง|ลุก|หัน'
def chunks_in(a, b): return [c for c in caps if c[0] >= a - .05 and c[1] <= b + .05]
rows = []
for a, b, txt in isl:
    cs = chunks_in(a, b); limit = 2.2 if a < 10 else 3.6                       # hook: short framings; later: ~one line a shot
    if b - a > limit and len(cs) > 1:
        cur = [cs[0]]
        for c in cs[1:]:
            if c[1] - cur[0][0] > limit: rows.append([cur[0][0], cur[-1][1], ''.join(x[2] for x in cur), txt]); cur = [c]
            else: cur.append(c)
        rows.append([cur[0][0], cur[-1][1], ''.join(x[2] for x in cur), txt])
    else: rows.append([a, b, txt, txt])
# merge slivers (< .8 s of speech) into the previous piece
m2 = []
for r in rows:
    if m2 and r[1] - r[0] < .8 and r[3] == m2[-1][3]: m2[-1][1] = r[1]; m2[-1][2] += r[2]
    else: m2.append(r)
rows = m2
# hook: a framing > 2.5 s inside the first 10 s is split at the caption chunk nearest its middle
h2 = []
for r in rows:
    cs = chunks_in(r[0], r[1])
    if r[0] < 10 and r[1] - r[0] > 2.5 and len(cs) > 1:
        mid = (r[0] + r[1]) / 2; k = min(range(1, len(cs)), key=lambda j: abs(cs[j][0] - mid))
        h2.append([r[0], cs[k][0], ''.join(c[2] for c in cs[:k]), r[3]]); h2.append([cs[k][0], r[1], ''.join(c[2] for c in cs[k:]), r[3]])
    else: h2.append(r)
rows = h2
# shots start at the line start; the gap before the next line belongs to the shot (reaction / breathing room)
for i in range(len(rows)): rows[i][1] = rows[i + 1][0] if i + 1 < len(rows) else END
rows[0][0] = 0
out = []; prev = None; trs = ['sweep', 'push', 'fgwipe']; tri = 0; seen_place = set(); trrun = []
for i, (a, b, piece, line) in enumerate(rows):
    p = piece.replace('*', ''); notes = []
    if re.search(r'["“”]|พูดว่า|บอกว่า|ถามว่า|ตะโกน', p): size = 'OTS'; notes.append('dialogue: otsPair shot/reverse, cut on speaker, listen() on the listener')
    elif re.search(OBJ, p): size = 'INSERT'; notes.append('insert the named object (prop to the lens)')
    elif re.search(EMO, p): size = 'CU'; notes.append('push in to CU on the emotional word; sob()/listen() if it fits')
    elif i == 0 or re.search(PLACE, p): size = 'WIDE'; notes.append('establish geography (rule 1)')
    elif re.search(ACT, p): size = 'MED'; notes.append('show the action literally (rule 4); walkAlong / sitMove / actPunch')
    else: size = None
    if size is None:
        size = ['MED', 'CU', 'MED', 'WIDE'][i % 4]
        if size == prev: size = next(x for x in ['MED', 'CU', 'WIDE', 'MED'][i % 2:] if x != prev)
    elif size == prev: notes.append('same size as before: change angle / side / height')
    tr = 'cut'
    if i and re.search(TIME, p): tr = 'dis'; notes.append('time jump')
    elif i and re.search(PLACE, p) and prev != 'WIDE': tr = trs[tri % 3]; tri += 1
    trrun.append(tr)
    if len(trrun) >= 4 and len(set(trrun[-4:])) == 1 and tr != 'cut': tr = 'cut'
    if re.search(THINK, p): notes.append('thought beat: whisperAt')
    m = re.search(PLACE, p)
    if m and m.group(0) not in seen_place: seen_place.add(m.group(0)); notes.append(f'place label? ({m.group(0)})')
    if '*' in piece: notes.append('highlighted word: name label if it is a new character')
    if b - a > 6: notes.append('long: add a camera move or split')
    out.append(dict(id=f'B{i + 1:02d}', t0=round(a, 2), t1=round(b, 2), text=piece, size=size, tr=tr if i else 'cut', notes='; '.join(notes))); prev = size
os.makedirs(f'{R}/out', exist_ok=True)
hook = sum(1 for r in out if r['t0'] < 10)
with open(f'{R}/out/storyboard.md', 'w', encoding='utf-8') as f:
    f.write(f'# Storyboard ({len(out)} shots, {END:.1f} s, hook framings in 10 s: {hook})\n\n| id | time | line | size | tr | notes |\n|---|---|---|---|---|---|\n')
    for r in out: f.write(f"| {r['id']} | {r['t0']:.2f}-{r['t1']:.2f} | {r['text']} | {r['size']} | {r['tr']} | {r['notes']} |\n")
with open(f'{R}/out/shots_skeleton.js', 'w', encoding='utf-8') as f:
    for r in out:
        f.write(f"// {r['id']} {r['t0']:.2f}-{r['t1']:.2f} [{r['size']}] {r['text']}  // {r['notes']}\n")
        f.write(f"S('{r['id']}', {r['t0']}, '{r['tr']}', SET, (lt, t) => {{ /* {r['size']} */ }}, {{ rain: false }});\n")
print(f'storyboard: {len(out)} shots, hook framings {hook} in the first 10 s -> {R}/out/storyboard.md, out/shots_skeleton.js')
