# python3 tools/strip.py <dir> <out.jpg> [w=300]: time-sorted stills side by side
import sys, os
from PIL import Image
d, o = sys.argv[1], sys.argv[2]; w = int(sys.argv[3]) if len(sys.argv) > 3 else 300; h = int(w * 16 / 9)
fs = sorted([f for f in os.listdir(d) if f.endswith('.jpg')], key=lambda f: float(f[1:-4]))
S = Image.new('RGB', (w * len(fs), h))
for i, f in enumerate(fs): S.paste(Image.open(os.path.join(d, f)).resize((w, h)), (i * w, 0))
S.save(o)
