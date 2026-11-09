"""Смотрим результат вырезания без классификации: python scripts/try_cutout.py фото.jpg [...] -> /tmp/vision-out/"""
import sys, time
from pathlib import Path
import numpy as np
from PIL import Image
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from app import pipeline, models  # noqa: E402

out = Path("/tmp/vision-out"); out.mkdir(exist_ok=True)
for f in sys.argv[1:]:
    t = time.time()
    rgb = pipeline.load_image(Path(f).read_bytes())
    seg = models.segment(rgb)
    t1 = time.time() - t
    person = pipeline.is_person(seg)
    cands = []
    if person:
        for name, mask in pipeline.person_masks(seg).items():
            cands.append((name, pipeline.refine_mask(rgb, mask)))
    else:
        cands.append(("flat", pipeline.flat_alpha(rgb)))
    print(Path(f).name, "person" if person else "flat", [(n, round((a > 128).mean(), 3)) for n, a in cands], f"seg {t1:.1f}s total {time.time()-t:.1f}s")
    tiles = []
    for name, a in cands:
        if (a > 128).sum() < 100: continue
        c, s, _ = pipeline.compose(rgb, a)
        tiles.append(s.resize((256, 256)))
    sheet = Image.new("RGB", (256 * max(1, len(tiles)) + 360, 256), "white")
    th = Image.fromarray(rgb); th.thumbnail((360, 256)); sheet.paste(th, (0, 0))
    for i, t_ in enumerate(tiles): sheet.paste(t_, (360 + i * 256, 0))
    sheet.save(out / (Path(f).stem + ".jpg"))
