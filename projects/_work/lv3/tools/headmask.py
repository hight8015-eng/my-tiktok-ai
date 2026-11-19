# python3 tools/headmask.py : ivory ball mask for each head sprite -> src/sprites/C0x-V-mask.png, ball fit -> sprites.json[...]['ballH'] (head-png coords)
import os, json, glob, numpy as np
from PIL import Image
from scipy import ndimage as nd
d = os.path.join(os.path.dirname(__file__), '..', 'src', 'sprites'); meta = json.load(open(f'{d}/sprites.json'))
for k in sorted(meta):
    im = np.asarray(Image.open(f'{d}/{k}-head.png').convert('RGBA')).astype(int)
    rgb, a = im[:, :, :3], im[:, :, 3]
    iv = (rgb.min(2) > 170) & ((rgb[:, :, 0] - rgb[:, :, 2]) < 70) & (a > 230)
    if iv.sum() < 200:  # back view fully covered by hair: no face area; empty mask, ball from the head box
        h, w = a.shape; A = np.zeros((h, w), np.uint8); Image.fromarray(np.dstack([np.full_like(A, 255), A]), 'LA').save(f'{d}/{k}-mask.png')
        meta[k]['ballH'] = [w / 2, h - w * .45, w * .45]; print(k, 'covered'); continue
    lab, n = nd.label(iv); sizes = nd.sum(iv, lab, range(1, n + 1)); big = lab == (1 + int(np.argmax(sizes)))
    big = nd.binary_fill_holes(big); big = nd.binary_erosion(big, iterations=5)
    ys, xs = np.where(big); cx = (xs.min() + xs.max()) / 2; r = (xs.max() - xs.min()) / 2 + 5; bot = ys.max() + 5; cy = bot - r
    m = nd.gaussian_filter(big.astype(float), 1.2)
    A = (m * 255).astype(np.uint8); Image.fromarray(np.dstack([np.full_like(A, 255), A]), 'LA').save(f'{d}/{k}-mask.png', optimize=True)
    meta[k]['ballH'] = [round(float(cx), 1), round(float(cy), 1), round(float(r), 1)]
    print(k, meta[k]['ballH'], im.shape[:2])
json.dump(meta, open(f'{d}/sprites.json', 'w'), indent=0)
