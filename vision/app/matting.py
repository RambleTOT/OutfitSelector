"""Чистое вырезание вещи: мягкая маска от нейросети -> резкий край по контуру самой вещи (направляемый фильтр)
-> очистка цвета на краю, чтобы вокруг вещи не оставалось светлой или тёмной каймы от старого фона."""
import cv2
import numpy as np


def _box(x: np.ndarray, r: int) -> np.ndarray:
    return cv2.boxFilter(x, -1, (2 * r + 1, 2 * r + 1), normalize=True, borderType=cv2.BORDER_REPLICATE)


def guided_filter(guide: np.ndarray, src: np.ndarray, r: int, eps: float) -> np.ndarray:
    """Направляющий фильтр (He и др.): прижимает границу маски src к границам на картинке guide. Оба 0..1, float32."""
    mi, mp = _box(guide, r), _box(src, r)
    cov = _box(guide * src, r) - mi * mp
    var = _box(guide * guide, r) - mi * mi
    a = cov / (var + eps)
    b = mp - a * mi
    return _box(a, r) * guide + _box(b, r)


def _keep_main(mask: np.ndarray, min_frac: float = 0.01) -> np.ndarray:
    """Оставляем крупные части (вещь целиком или пара обуви), мелкий мусор убираем; небольшие дыры закрываем."""
    n, lab, stats, _ = cv2.connectedComponentsWithStats(mask.astype(np.uint8), connectivity=8)
    out = np.zeros(mask.shape, np.uint8)
    if n <= 1:
        return out
    biggest = stats[1:, cv2.CC_STAT_AREA].max()
    for i in range(1, n):
        if stats[i, cv2.CC_STAT_AREA] >= max(min_frac * mask.size, biggest * 0.12):
            out[lab == i] = 1
    inv = 1 - out
    n2, lab2, st2, _ = cv2.connectedComponentsWithStats(inv, connectivity=4)
    border = set(np.unique(np.concatenate([lab2[0], lab2[-1], lab2[:, 0], lab2[:, -1]])))
    for i in range(1, n2):
        if i not in border and st2[i, cv2.CC_STAT_AREA] < 0.012 * out.size:
            out[lab2 == i] = 1
    return out


def alpha_from_prob(rgb: np.ndarray, prob: np.ndarray) -> np.ndarray:
    """prob: вероятность «вещь» 0..1 в размере фото. Возвращает альфа-канал uint8 с аккуратным краем."""
    h, w = prob.shape
    sure = _keep_main(prob > 0.5)
    if sure.sum() < 0.002 * h * w:
        return (prob > 0.5).astype(np.uint8) * 255
    # рабочий размер для фильтра: край уточняем не на 12 Мп, а на ~1,3 Мп
    s = min(1.0, 1400 / max(h, w))
    g = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY).astype(np.float32) / 255.0
    soft = np.clip((prob - 0.15) / 0.7, 0, 1).astype(np.float32)
    region = cv2.dilate(sure, np.ones((15, 15), np.uint8))  # всё, что далеко от найденной вещи, отбрасываем
    soft = soft * region
    if s < 1:
        g, soft = cv2.resize(g, None, fx=s, fy=s, interpolation=cv2.INTER_AREA), cv2.resize(soft, None, fx=s, fy=s, interpolation=cv2.INTER_AREA)
    r = max(3, int(max(soft.shape) * 0.004))
    a = np.clip(guided_filter(g, soft, r, 1e-3), 0, 1)
    a = np.clip((a - 0.35) / 0.4, 0, 1)  # край чуть жёстче: меньше полупрозрачной «пыли»
    if s < 1:
        a = cv2.resize(a, (w, h), interpolation=cv2.INTER_LINEAR)
    # убираем отдельные пятна, появившиеся после фильтра
    hard = _keep_main(a > 0.5)
    a = a * cv2.dilate(hard, np.ones((5, 5), np.uint8))
    return (np.clip(a, 0, 1) * 255).astype(np.uint8)


def decontaminate(rgb: np.ndarray, alpha: np.ndarray) -> np.ndarray:
    """На краю вещи цвет смешан с фоном (белая «потёртость»). Заменяем цвет полупрозрачных пикселей на цвет ближайшей внутренней части."""
    a = alpha.astype(np.float32) / 255.0
    core = (cv2.erode((a > 0.97).astype(np.uint8), np.ones((5, 5), np.uint8))).astype(np.float32)
    if core.sum() < 50:
        return rgb
    sig = max(3.0, 0.004 * max(rgb.shape[:2]))
    num = cv2.GaussianBlur(rgb.astype(np.float32) * core[..., None], (0, 0), sig)
    den = cv2.GaussianBlur(core, (0, 0), sig)[..., None]
    inner = num / np.maximum(den, 1e-4)
    edge = (a < 0.97).astype(np.float32)[..., None]
    wide = np.where(den > 0.02, inner, rgb.astype(np.float32))
    return np.clip(np.where(edge > 0, wide, rgb.astype(np.float32)), 0, 255).astype(np.uint8)


def studio_light(rgb: np.ndarray, alpha: np.ndarray) -> np.ndarray:
    """Лёгкая «студийная» подстройка: недоэкспонированную светлую вещь осветляем (белая рубашка не должна быть серой), тёмные не трогаем."""
    m = alpha > 200
    if m.sum() < 500:
        return rgb
    lab = cv2.cvtColor(rgb, cv2.COLOR_RGB2LAB).astype(np.float32)
    L = lab[..., 0][m] * (100.0 / 255.0)
    med, p98 = float(np.median(L)), float(np.percentile(L, 98))
    if med < 45 or p98 >= 96:
        return rgb
    gain = min(1.22, 96.0 / max(p98, 1.0))
    lab[..., 0] = np.clip(lab[..., 0] * gain, 0, 255)
    return cv2.cvtColor(lab.astype(np.uint8), cv2.COLOR_LAB2RGB)
