import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MODELS = Path(os.environ.get("VISION_MODELS", ROOT / "models"))
THREADS = int(os.environ.get("VISION_THREADS", os.cpu_count() or 2))
CONCURRENCY = int(os.environ.get("VISION_CONCURRENCY", 1))
MAX_SIDE = int(os.environ.get("VISION_MAX_SIDE", 1600))   # большая сторона входного фото
OUT_SIZE = int(os.environ.get("VISION_OUT_SIZE", 768))    # сторона итоговой картинки вещи
MAX_ITEMS = int(os.environ.get("VISION_MAX_ITEMS", 6))
# Что выделяет вещь на фото одной вещи: silueta (быстро, 320 px, край потом уточняет GrabCut), birefnet (точнее, но на CPU десятки секунд,
# нужна видеокарта или сильный сервер), grabcut (без модели)
FLAT_MATTING = os.environ.get("VISION_FLAT_MATTING", "isnet")  # silueta | isnet | birefnet | grabcut
POLISH = os.environ.get("VISION_POLISH", "1") == "1"
