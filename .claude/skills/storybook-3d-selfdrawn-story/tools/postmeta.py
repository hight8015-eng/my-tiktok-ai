# python3 tools/postmeta.py [root=.] [out_dir] : writes <out_dir>/โพสต์.txt with a ready-to-paste TikTok/Shorts post
# (title, hook line, description, hashtags) from src/project.json + src/timing.json.
# project.json (optional): "post": { "title", "hook", "desc", "tags": [...], "series", "part" }, "hook": { "text" }, "cover": { "l1", "l2" }
import json, os, sys

root = sys.argv[1] if len(sys.argv) > 1 else '.'
out = sys.argv[2] if len(sys.argv) > 2 else os.path.join(root, 'out')
pj = json.load(open(os.path.join(root, 'src/project.json'), encoding='utf-8'))
tm = json.load(open(os.path.join(root, 'src/timing.json'), encoding='utf-8'))
P = pj.get('post', {}); cv = pj.get('cover', {})

words = [c[2].replace('*', '') for c in tm.get('caps', [])]
first = ''.join(w for c, w in zip(tm.get('caps', []), words) if c[0] < 3.2).strip()   # what is said in the first ~3 s
title = P.get('title') or ' '.join(x for x in (cv.get('l1'), cv.get('l2')) if x) or 'เรื่องเล่า'
hook = P.get('hook') or (pj.get('hook') or {}).get('text') or first
series = P.get('series') or cv.get('sub', '')
part = P.get('part', '')

base_tags = ['การ์ตูน', 'เล่าเรื่อง', 'animation', 'นิทาน', 'fyp', 'foryou', 'viral', 'tiktokuni', 'เรื่องสั้น']
tags = []
for t in P.get('tags', []) + base_tags:
    t = t.strip().lstrip('#').replace(' ', '')
    if t and t not in tags: tags.append(t)
tags = tags[:12]

lines = [f'{hook} 😳' if hook else title, '']
if series: lines.append(f'{series}{(" " + part) if part else ""}')
if P.get('desc'): lines.append(P['desc'])
q = P.get('question') or 'คิดว่าตอนต่อไปจะเป็นยังไง? คอมเมนต์บอกหน่อย 👇'   # a question in the caption drives comments
lines += [q, 'ติดตามตอนต่อไป 👉 กดติดตามไว้เลย', '', ' '.join('#' + t for t in tags)]
os.makedirs(out, exist_ok=True)
path = os.path.join(out, 'โพสต์.txt')
open(path, 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
print('ok', path)
