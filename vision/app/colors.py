"""Цвет вещи: доминирующий цвет маски в Lab, ближайшее имя из палитры приложения.
Имена подобраны так, чтобы фильтр цвета в приложении (colorGroup) сводил их к 9 базовым группам."""
import cv2
import numpy as np

PALETTE = [
    ("Белый", "#F3F3F0"), ("Чёрный", "#2A2B30"), ("Серый", "#8E9097"), ("Светло-серый", "#C9CBD0"),
    ("Бежевый", "#D9C7AE"), ("Синий", "#3D5A99"), ("Тёмно-синий", "#24304F"), ("Голубой", "#8FB4E3"), ("Светло-голубой", "#A9C3E2"), ("Синий", "#5F7FA8"),
    ("Красный", "#C4453F"), ("Бордовый", "#6E2230"), ("Розовый", "#E8A5B3"), ("Зелёный", "#5E8C61"),
    ("Оливковый", "#6B6B3A"), ("Коричневый", "#7A5A43"), ("Рыжий", "#B5652F"), ("Жёлтый", "#E8B923"),
    ("Оранжевый", "#E8792B"), ("Фиолетовый", "#6B4A8C"),
]


def _lab(hexes):
    arr = np.array([[int(h[i:i + 2], 16) for i in (1, 3, 5)] for h in hexes], np.uint8).reshape(-1, 1, 3)
    return cv2.cvtColor(arr, cv2.COLOR_RGB2LAB).reshape(-1, 3).astype(np.float32)


_PAL_LAB = _lab([h for _, h in PALETTE])


def dominant_color(rgb: np.ndarray, mask: np.ndarray) -> tuple[str, str, float]:
    """rgb HxWx3 uint8, mask HxW bool (только вещь). Возвращает (имя, hex, доля доминирующего кластера)."""
    m = cv2.erode(mask.astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool)
    if m.sum() < 200:
        m = mask
    px = rgb[m]
    if len(px) > 20000:
        px = px[np.random.default_rng(0).choice(len(px), 20000, replace=False)]
    lab = cv2.cvtColor(px.reshape(-1, 1, 3), cv2.COLOR_RGB2LAB).reshape(-1, 3).astype(np.float32)
    k = 3 if len(lab) > 300 else 1
    crit = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 15, 1.0)
    _, labels, centers = cv2.kmeans(lab, k, None, crit, 3, cv2.KMEANS_PP_CENTERS)
    counts = np.bincount(labels.ravel(), minlength=k)
    # блики и тени дают крайние по светлоте кластеры: берём самый большой
    main = int(counts.argmax())
    c = centers[main]
    # нейтральные цвета (белый, серый, чёрный): тень на складках делает белую вещь «серой», поэтому смотрим на светлую часть вещи, а не на среднюю
    chroma = float(np.hypot(c[1] - 128, c[2] - 128))
    if chroma < 8:
        L = lab[:, 0] * (100.0 / 255.0)
        top, mid = float(np.percentile(L, 85)), float(np.median(L))
        # чёрная кожа и ткань блестят: по светлой части она «серая», поэтому для тёмных смотрим и на середину
        name = "Белый" if top >= 84 else "Светло-серый" if top >= 70 else "Чёрный" if (top < 38 or mid < 30) else "Серый"
        hexv = next(h for n, h in PALETTE if n == name)
        return name, hexv, float(counts[main] / counts.sum())
    d = np.linalg.norm(_PAL_LAB - c, axis=1)
    i = int(d.argmin())
    return PALETTE[i][0], PALETTE[i][1], float(counts[main] / counts.sum())
