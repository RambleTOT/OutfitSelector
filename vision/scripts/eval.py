"""Прогон конвейера по фото: python scripts/eval.py фото1.jpg фото2.jpg ... Печатает, что нашли, и пишет контактный лист в /tmp/vision-out/"""
import io, sys, time, base64
from pathlib import Path
from PIL import Image
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from app import pipeline  # noqa: E402

out = Path("/tmp/vision-out"); out.mkdir(exist_ok=True)
for f in sys.argv[1:]:
    t = time.time()
    r = pipeline.analyze(Path(f).read_bytes())
    print(Path(f).name, r.mode, "НЕ ОДЕЖДА" if r.notClothing else "", r.warnings, f"{time.time()-t:.1f}s", flush=True)
    tiles = []
    for i in r.items:
        print("   ", i.source, i.category, i.type, i.colorName, i.pattern, "уверенность", i.confidence, "доля", i.area, "КБ", len(i.studio) * 3 // 4096, flush=True)
        tiles.append(Image.open(io.BytesIO(base64.b64decode(i.studio.split(",", 1)[1]))).resize((256, 256)))
    src = Image.open(f).convert("RGB"); src.thumbnail((360, 256))
    sheet = Image.new("RGB", (360 + 256 * max(1, len(tiles)), 256), "white"); sheet.paste(src, (0, 0))
    for k, t_ in enumerate(tiles): sheet.paste(t_, (360 + 256 * k, 0))
    sheet.save(out / (Path(f).stem + "_full.jpg"))
