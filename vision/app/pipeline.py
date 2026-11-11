"""Конвейер: фото -> список вещей с вырезанным фоном, видом, цветом и рисунком.

Режимы:
  worn: на фото человек в одежде. SegFormer находит верх, низ, платье, обувь, сумку, головной убор, шарф;
        каждая вещь вырезается отдельно (маска + уточнение края GrabCut).
  flat: вещь отдельно (на кровати, полу, вешалке). Вырезание BiRefNet, одна вещь.
Дальше для каждой вещи: картинка на прозрачном фоне и на белом студийном, вид (FashionSigLIP), цвет, рисунок.
Исходное фото нигде не сохраняется."""
from __future__ import annotations

import base64
import io
from dataclasses import dataclass, field

import cv2
import numpy as np
from PIL import Image, ImageOps

from . import config, labels as lb, matting, models
from .colors import dominant_color

_LAB = None


def _labels():
    global _LAB
    if _LAB is None:
        _LAB = lb.load()
    return _LAB


@dataclass
class Item:
    category: str
    type: str
    colorName: str
    colorHex: str
    pattern: str
    confidence: float
    area: float
    cutout: str = ""     # data:image/webp, прозрачный фон (для приложения)
    studio: str = ""     # data:image/webp, белый студийный фон (для шеринга)
    source: str = ""     # какой частью фото получена: upper, pants, shoes, flat...


@dataclass
class Result:
    mode: str = "flat"
    notClothing: bool = False
    warnings: list[str] = field(default_factory=list)
    items: list[Item] = field(default_factory=list)


# ---------------------------------------------------------------- подготовка
def load_image(data: bytes) -> np.ndarray:
    img = Image.open(io.BytesIO(data))
    img = ImageOps.exif_transpose(img).convert("RGB")
    w, h = img.size
    s = config.MAX_SIDE / max(w, h)
    if s < 1:
        img = img.resize((round(w * s), round(h * s)), Image.LANCZOS)
    return np.asarray(img)


def _dither(img: np.ndarray) -> np.ndarray:
    """Едва заметный шум: на однотонной картинке GrabCut зацикливается (GMM на одинаковых пикселях), с шумом нет."""
    noise = np.random.default_rng(1).integers(-2, 3, img.shape, dtype=np.int16)
    return np.clip(img.astype(np.int16) + noise, 0, 255).astype(np.uint8)


def quality(rgb: np.ndarray) -> list[str]:
    g = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    g = cv2.resize(g, (640, int(640 * g.shape[0] / g.shape[1])))
    warns = []
    if cv2.Laplacian(g, cv2.CV_64F).var() < 25:
        warns.append("blurry")
    if g.mean() < 45:
        warns.append("dark")
    return warns


# ---------------------------------------------------------------- маски
def _components(mask: np.ndarray, min_area: float) -> np.ndarray:
    """Оставляет крупные связные области (мелкий шум убираем)."""
    n, lab, stats, _ = cv2.connectedComponentsWithStats(mask.astype(np.uint8), connectivity=8)
    out = np.zeros_like(mask, bool)
    if n <= 1:
        return out
    biggest = stats[1:, cv2.CC_STAT_AREA].max()
    for i in range(1, n):
        if stats[i, cv2.CC_STAT_AREA] >= max(min_area, biggest * 0.12):
            out |= lab == i
    return out


def main_person(seg: np.ndarray) -> np.ndarray:
    """Область самого крупного человека на фото (одежду прохожих на фоне не берём)."""
    fg = cv2.dilate((seg != models.L["Background"]).astype(np.uint8), np.ones((9, 9), np.uint8))
    n, lab, stats, _ = cv2.connectedComponentsWithStats(fg, connectivity=8)
    if n <= 1:
        return np.ones(seg.shape, bool)
    return lab == (1 + int(stats[1:, cv2.CC_STAT_AREA].argmax()))


def person_masks(seg: np.ndarray) -> dict[str, np.ndarray]:
    L = models.L
    total = seg.size
    region = main_person(seg)
    m = lambda *names: np.isin(seg, [L[n] for n in names]) & region
    raw = {
        "upper": (m("Upper-clothes"), 0.006), "pants": (m("Pants"), 0.006), "skirt": (m("Skirt"), 0.004),
        "dress": (m("Dress"), 0.01), "shoes": (m("Left-shoe", "Right-shoe"), 0.0015),
        "hat": (m("Hat"), 0.002), "bag": (m("Bag"), 0.003), "scarf": (m("Scarf"), 0.003),
    }
    out = {}
    for name, (mask, frac) in raw.items():
        if mask.sum() < frac * total:
            continue
        mask = cv2.morphologyEx(mask.astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8)).astype(bool)
        mask = _components(mask, frac * total)
        if mask.sum() >= frac * total:
            out[name] = mask
    # платье вытесняет верх и низ, если они вместе меньше платья: модель часто делит платье на куски
    if "dress" in out:
        da = out["dress"].sum()
        if out.get("upper") is not None and out["upper"].sum() < da * 0.6 and out["upper"].sum() > 0:
            out["dress"] |= out.pop("upper")
        if out.get("skirt") is not None and out["skirt"].sum() < da * 0.6:
            out["dress"] |= out.pop("skirt")
    return out


def is_person(seg: np.ndarray) -> bool:
    L = models.L
    body = np.isin(seg, [L[n] for n in ("Face", "Hair", "Left-arm", "Right-arm", "Left-leg", "Right-leg")]).sum()
    return body > 0.012 * seg.size


# ---------------------------------------------------------------- уточнение края
def refine_mask(rgb: np.ndarray, mask: np.ndarray) -> np.ndarray:
    """Маска вещи -> чистый альфа-канал: GrabCut вокруг границы маски, самая большая область, небольшие дыры закрыты."""
    ys, xs = np.where(mask)
    if len(ys) == 0:
        return mask.astype(np.uint8) * 255
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    pad = int(0.08 * max(y1 - y0, x1 - x0)) + 6
    y0, x0 = max(0, y0 - pad), max(0, x0 - pad)
    y1, x1 = min(mask.shape[0], y1 + pad), min(mask.shape[1], x1 + pad)
    crop, m = rgb[y0:y1, x0:x1], mask[y0:y1, x0:x1].astype(np.uint8)
    scale = min(1.0, 640 / max(crop.shape[:2]))
    if scale < 1:
        crop = cv2.resize(crop, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
        m = cv2.resize(m, (crop.shape[1], crop.shape[0]), interpolation=cv2.INTER_NEAREST)
    k = max(2, int(max(m.shape) * 0.012))
    sure_fg = cv2.erode(m, np.ones((k * 2 + 1, k * 2 + 1), np.uint8))
    band = cv2.dilate(m, np.ones((k * 3 + 1, k * 3 + 1), np.uint8))
    gc = np.full(m.shape, cv2.GC_BGD, np.uint8)
    gc[band > 0] = cv2.GC_PR_BGD
    gc[m > 0] = cv2.GC_PR_FGD
    gc[sure_fg > 0] = cv2.GC_FGD
    result = m.copy()
    try:
        bgd, fgd = np.zeros((1, 65)), np.zeros((1, 65))
        cv2.grabCut(cv2.cvtColor(_dither(crop), cv2.COLOR_RGB2BGR), gc, None, bgd, fgd, 3, cv2.GC_INIT_WITH_MASK)
        gcm = ((gc == cv2.GC_FGD) | (gc == cv2.GC_PR_FGD)).astype(np.uint8)
        ratio = gcm.sum() / max(1, m.sum())
        if 0.75 < ratio < 1.25:  # GrabCut «съел» вещь или раздул её: оставляем маску модели
            result = gcm
    except cv2.error:
        pass
    result = _components(result.astype(bool), 20).astype(np.uint8)
    # небольшие дыры (блики, пуговицы) закрываем, большие (рука, ручка сумки) оставляем
    inv = (1 - result).astype(np.uint8)
    n, lab, stats, _ = cv2.connectedComponentsWithStats(inv, connectivity=4)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])))
    for i in range(1, n):
        if i not in border and stats[i, cv2.CC_STAT_AREA] < 0.015 * result.size:
            result[lab == i] = 1
    result = cv2.erode(result, np.ones((3, 3), np.uint8))  # убираем ореол фона на краю
    alpha = cv2.GaussianBlur(result * 255, (0, 0), 1.0)
    full = np.zeros(mask.shape, np.uint8)
    out = cv2.resize(alpha, (x1 - x0, y1 - y0), interpolation=cv2.INTER_LINEAR) if scale < 1 else alpha
    full[y0:y1, x0:x1] = out
    return full


def flat_alpha(rgb: np.ndarray) -> np.ndarray:
    """Одна вещь на любом фоне: грубая маска нейросетью, затем уточнение края на полном разрешении."""
    h, w = rgb.shape[:2]
    mode = config.FLAT_MATTING
    p = None
    if mode == "isnet" and models.available("isnet-general-use.onnx"):
        p = models.salient_isnet(rgb)
        if (p > 0.5).sum() > 0.01 * h * w:
            return matting.alpha_from_prob(rgb, p)
    if mode == "birefnet" and models.available("birefnet.onnx"):
        p = models.salient_alpha(rgb)
        mask = _components(p > 0.5, 0.01 * h * w)
        if mask.sum() > 0.01 * h * w:
            return cv2.GaussianBlur(mask.astype(np.uint8) * 255, (0, 0), 1.0)
    elif mode in ("silueta", "birefnet") and models.available("silueta.onnx"):
        p = models.salient_small(rgb)
        mask = _components(p > 0.45, 0.01 * h * w)
        if mask.sum() > 0.01 * h * w:
            return refine_mask(rgb, mask)
    # запасной путь без модели: GrabCut с прямоугольником по центру
    small = 640 / max(h, w)
    img = cv2.cvtColor(_dither(cv2.resize(rgb, None, fx=small, fy=small) if small < 1 else rgb), cv2.COLOR_RGB2BGR)
    gcs = np.zeros(img.shape[:2], np.uint8)
    ih, iw = img.shape[:2]
    cv2.grabCut(img, gcs, (int(iw * 0.06), int(ih * 0.06), int(iw * 0.88), int(ih * 0.88)), np.zeros((1, 65)), np.zeros((1, 65)), 4, cv2.GC_INIT_WITH_RECT)
    m = _components(((gcs == cv2.GC_FGD) | (gcs == cv2.GC_PR_FGD)), 20).astype(np.uint8) * 255
    return cv2.resize(m, (w, h), interpolation=cv2.INTER_LINEAR)


def pack_pair(rgb: np.ndarray, alpha: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Пара обуви: два ботинка далеко друг от друга ставим рядом на одной высоте, чтобы пара читалась как одна вещь."""
    n, lab, stats, _ = cv2.connectedComponentsWithStats((alpha > 128).astype(np.uint8), connectivity=8)
    order = sorted(range(1, n), key=lambda i: -stats[i, cv2.CC_STAT_AREA])[:2]
    if len(order) < 2:
        return rgb, alpha
    parts = []
    for i in order:
        x, y, w, h = stats[i, :4]
        parts.append((rgb[y:y + h, x:x + w], np.where(lab[y:y + h, x:x + w] == i, alpha[y:y + h, x:x + w], 0).astype(np.uint8)))
    parts.sort(key=lambda p: -p[0].shape[0] * p[0].shape[1])
    H = max(p[0].shape[0] for p in parts)
    gap = max(6, int(H * 0.06))
    cols_rgb, cols_a = [], []
    for c, a in parts:
        s = H / c.shape[0]
        cols_rgb.append(cv2.resize(c, (max(1, round(c.shape[1] * s)), H), interpolation=cv2.INTER_AREA))
        cols_a.append(cv2.resize(a, (cols_rgb[-1].shape[1], H), interpolation=cv2.INTER_AREA))
    W = sum(c.shape[1] for c in cols_rgb) + gap
    out_rgb, out_a = np.full((H, W, 3), 255, np.uint8), np.zeros((H, W), np.uint8)
    x = 0
    for c, a in zip(cols_rgb, cols_a):
        out_rgb[:, x:x + c.shape[1]], out_a[:, x:x + c.shape[1]] = c, a
        x += c.shape[1] + gap
    return out_rgb, out_a


# ---------------------------------------------------------------- сборка картинок
def _webp(img: Image.Image, q: int) -> str:
    b = io.BytesIO()
    img.save(b, "WEBP", quality=q, method=4)
    return "data:image/webp;base64," + base64.b64encode(b.getvalue()).decode()


def compose(rgb: np.ndarray, alpha: np.ndarray) -> tuple[Image.Image, Image.Image, tuple[int, int, int, int]]:
    """Вещь по центру квадрата: прозрачный вариант и белый студийный с мягкой тенью."""
    ys, xs = np.where(alpha > 12)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    rgba = np.dstack([rgb, alpha])[y0:y1, x0:x1]
    # цвет под прозрачными пикселями берём с ближайшей вещи, чтобы не было светлой каймы при сжатии
    S = config.OUT_SIZE
    h, w = rgba.shape[:2]
    scale = min((S * 0.86) / max(h, w), 2.0)
    nh, nw = max(1, round(h * scale)), max(1, round(w * scale))
    item = Image.fromarray(rgba, "RGBA").resize((nw, nh), Image.LANCZOS)
    canvas = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    ox, oy = (S - nw) // 2, (S - nh) // 2
    canvas.alpha_composite(item, (ox, oy))
    # студия: белый фон, тень под вещью
    a = np.asarray(canvas.split()[3]).astype(np.float32) / 255.0
    shadow = cv2.GaussianBlur(np.roll(a, int(S * 0.012), axis=0), (0, 0), S * 0.018) * 0.22
    studio = Image.new("RGB", (S, S), (255, 255, 255))
    sh = Image.fromarray((255 - shadow * 255).astype(np.uint8)).convert("RGB")
    studio = Image.blend(studio, sh, 1.0)
    studio.paste(canvas.convert("RGB"), (0, 0), canvas.split()[3])
    return canvas, studio, (int(x0), int(y0), int(x1), int(y1))


# ---------------------------------------------------------------- классификация
def _softmax(x: np.ndarray, t: float = 100.0) -> np.ndarray:
    z = x * t
    z = z - z.max()
    e = np.exp(z)
    return e / e.sum()


def classify(canvas: Image.Image, family: str) -> tuple[str, str, float, str, bool]:
    """Возвращает (категория, вид, уверенность, рисунок, это_одежда)."""
    L = _labels()
    flat = Image.new("RGB", canvas.size, (238, 238, 242))
    flat.paste(canvas, (0, 0), canvas.split()[3])
    v = models.embed(np.asarray(flat))
    names = [str(n) for n in L["type_names"]]
    allowed = [n for n in lb.FAMILY[family] if n in names]
    idx = [names.index(n) for n in allowed]
    sims = L["type_emb"][idx] @ v
    neg = L["neg_emb"] @ v
    probs = _softmax(np.concatenate([sims, neg]))
    p_types, p_neg = probs[: len(idx)], probs[len(idx):]
    is_clothing = family != "any" or p_neg.sum() < 0.5
    best = int(p_types.argmax())
    typ = allowed[best]
    pat_names = [str(n) for n in L["pat_names"]]
    pp = _softmax(L["pat_emb"] @ v)
    # рисунок называем только когда модель уверена: рваные джинсы и складки не должны становиться «полоской»
    pat = pat_names[int(pp.argmax())] if pp.max() > 0.7 else "однотон"
    conf = float(p_types[best] / max(p_types.sum(), 1e-9))
    return lb.TYPES[typ][0], typ, conf, pat, bool(is_clothing)


# ---------------------------------------------------------------- главная функция
def analyze(data: bytes) -> Result:
    rgb = load_image(data)
    res = Result(warnings=quality(rgb))
    if rgb.std() < 4:  # однотонная картинка: вещей нет, а дальнейшая обработка бессмысленна
        res.notClothing = True
        return res
    H, W = rgb.shape[:2]

    seg = models.segment(rgb) if models.available("segformer.onnx") else None
    person = seg is not None and is_person(seg)
    candidates: list[tuple[str, np.ndarray, str]] = []  # (семейство, альфа, источник)

    if person:
        res.mode = "worn"
        for name, mask in person_masks(seg).items():
            candidates.append((name, refine_mask(rgb, mask), name))
        if not candidates:
            res.notClothing = False
            res.warnings.append("no_garments")
    if not candidates:
        res.mode = "flat"
        alpha = flat_alpha(rgb)
        if (alpha > 128).sum() > 0.01 * H * W:
            candidates.append(("any", alpha, "flat"))

    if not candidates:
        res.notClothing = True
        return res

    for family, alpha, src in candidates:
        mask = alpha > 128
        if mask.sum() < 0.0015 * H * W:
            continue
        img, a2 = (pack_pair(rgb, alpha) if family == "shoes" else (rgb, alpha))
        if config.POLISH:  # чистый край без каймы старого фона и аккуратный свет, как на студийном фото
            img = matting.studio_light(matting.decontaminate(img, a2), a2)
        canvas, studio, _ = compose(img, a2)
        cat, typ, conf, pat, ok = classify(canvas, family)
        if not ok:
            continue
        cname, chex, _share = dominant_color(img, a2 > 128)
        res.items.append(Item(category=cat, type=typ, colorName=cname, colorHex=chex, pattern=pat, confidence=round(conf, 3),
                              area=round(mask.sum() / (H * W), 4), cutout=_webp(canvas, 90), studio=_webp(studio, 85), source=src))

    res.items.sort(key=lambda i: -i.area)
    res.items = res.items[: config.MAX_ITEMS]
    if not res.items:
        res.notClothing = True
    return res
