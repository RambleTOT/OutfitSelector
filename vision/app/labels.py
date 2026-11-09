"""Словарь видов вещей: русское название из каталога приложения -> английские подписи для FashionSigLIP.
Вектора подписей считаются один раз (scripts/build_labels.py) и лежат в models/labels.npz."""
import numpy as np

from . import config

# тип из каталога приложения (src/data/catalog.ts) -> (категория, подписи)
TYPES: dict[str, tuple[str, list[str]]] = {
    "футболка": ("top", ["a t-shirt", "a short sleeve tee", "a polo shirt"]),
    "рубашка": ("top", ["a button-up shirt", "a dress shirt with collar", "a blouse"]),
    "свитер": ("top", ["a knit sweater", "a wool jumper", "a cardigan"]),
    "худи": ("top", ["a hoodie", "a zip hoodie with hood"]),
    "лонгслив": ("top", ["a long sleeve t-shirt", "a long sleeve top"]),
    "свитшот": ("top", ["a crewneck sweatshirt"]),
    "тренч": ("outer", ["a trench coat"]),
    "пальто": ("outer", ["a wool coat", "a long overcoat", "a puffer coat"]),
    "куртка": ("outer", ["a jacket", "a bomber jacket", "a denim jacket", "a puffer jacket", "a leather jacket"]),
    "пиджак": ("outer", ["a blazer", "a suit jacket"]),
    "джинсы": ("bottom", ["a pair of jeans", "denim pants"]),
    "брюки": ("bottom", ["a pair of trousers", "dress pants", "chino pants", "sweatpants"]),
    "юбка": ("bottom", ["a skirt", "a pleated skirt"]),
    "шорты": ("bottom", ["a pair of shorts"]),
    "платье": ("dress", ["a dress", "a midi dress"]),
    "кеды": ("shoes", ["a pair of canvas sneakers", "a pair of low top sneakers"]),
    "кроссовки": ("shoes", ["a pair of running sneakers", "a pair of athletic shoes", "a pair of chunky sneakers"]),
    "лоферы": ("shoes", ["a pair of loafers", "a pair of leather dress shoes", "a pair of oxford shoes"]),
    "ботинки": ("shoes", ["a pair of boots", "a pair of leather boots", "a pair of ankle boots"]),
    "сумка": ("bag", ["a handbag", "a shoulder bag", "a backpack", "a tote bag"]),
    "шарф": ("accessory", ["a scarf"]),
    "кепка": ("accessory", ["a baseball cap"]),
    "шляпа": ("accessory", ["a hat", "a straw hat", "a beanie"]),
}

# что SegFormer может назвать «верхом»: допустимые виды (так модель не назовёт пиджак джинсами)
FAMILY = {
    "upper": ["футболка", "рубашка", "свитер", "худи", "лонгслив", "свитшот", "тренч", "пальто", "куртка", "пиджак"],
    "pants": ["джинсы", "брюки", "шорты"],
    "skirt": ["юбка"], "dress": ["платье"],
    "shoes": ["кеды", "кроссовки", "лоферы", "ботинки"],
    "hat": ["кепка", "шляпа"], "bag": ["сумка"], "scarf": ["шарф"],
    "any": list(TYPES),
}

# «не одежда»: если это похоже на картинку сильнее, чем на вещь, просим другое фото
NEGATIVE = ["a photo of a face", "a photo of food", "a photo of a cat or dog", "a photo of furniture", "a photo of a landscape",
            "a screenshot of a phone", "a photo of a car", "a photo of a document"]

# рисунок ткани
PATTERNS = {
    "однотон": ["a plain solid color garment"],
    "полоска": ["a striped garment"],
    "клетка": ["a plaid checkered garment"],
    "принт": ["a garment with a printed pattern", "a garment with a graphic print"],
}


def load():
    p = config.MODELS / "labels.npz"
    if not p.exists():
        raise FileNotFoundError("Нет models/labels.npz. Запусти scripts/build_labels.py")
    z = np.load(p, allow_pickle=True)
    return {k: z[k] for k in z.files}
