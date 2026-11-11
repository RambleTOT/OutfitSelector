"""Загрузка и запуск моделей ONNX на CPU. Модели грузятся один раз при старте."""
import json
import threading

import cv2
import numpy as np
import onnxruntime as ort

from . import config

_lock = threading.Lock()
_cache: dict[str, ort.InferenceSession] = {}
_LEAN = {"isnet-general-use.onnx", "birefnet.onnx"}

IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], np.float32)
IMAGENET_STD = np.array([0.229, 0.224, 0.225], np.float32)


def session(name: str) -> ort.InferenceSession:
    with _lock:
        if name not in _cache:
            opts = ort.SessionOptions()
            opts.intra_op_num_threads = config.THREADS
            opts.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
            if name in _LEAN:  # крупная модель на 1024 px: без пула памяти пик ниже в 2 раза, а сервер небольшой
                opts.enable_cpu_mem_arena = False
                opts.enable_mem_pattern = False
            path = config.MODELS / name
            if not path.exists():
                raise FileNotFoundError(f"Нет модели {path}. Запусти scripts/download_models.sh")
            _cache[name] = ort.InferenceSession(str(path), opts, providers=["CPUExecutionProvider"])
        return _cache[name]


def available(name: str) -> bool:
    return (config.MODELS / name).exists()


# ---------- разбор одежды на человеке (SegFormer B2, датасет ATR)
SEG_LABELS = {int(k): v for k, v in json.loads((config.MODELS / "segformer_config.json").read_text())["id2label"].items()} \
    if (config.MODELS / "segformer_config.json").exists() else {}
L = {v: k for k, v in SEG_LABELS.items()}


def segment(rgb: np.ndarray) -> np.ndarray:
    """Карта классов HxW (uint8) для всего фото."""
    h, w = rgb.shape[:2]
    s = session("segformer.onnx")
    x = cv2.resize(rgb, (512, 512), interpolation=cv2.INTER_LINEAR).astype(np.float32) / 255.0
    x = ((x - IMAGENET_MEAN) / IMAGENET_STD).transpose(2, 0, 1)[None]
    logits = s.run(None, {s.get_inputs()[0].name: x})[0][0]  # (C, 128, 128)
    up = np.stack([cv2.resize(logits[c], (w, h), interpolation=cv2.INTER_LINEAR) for c in range(logits.shape[0])])
    return up.argmax(0).astype(np.uint8)


# ---------- вырезание фона для фото одной вещи (BiRefNet lite, MIT)
def salient_small(rgb: np.ndarray) -> np.ndarray:
    """Лёгкая модель (silueta, 320 px): грубая маска вещи. Край потом уточняется GrabCut на полном разрешении."""
    h, w = rgb.shape[:2]
    s = session("silueta.onnx")
    x = cv2.resize(rgb, (320, 320), interpolation=cv2.INTER_AREA).astype(np.float32)
    x = x / max(float(x.max()), 1e-6)
    x = ((x - IMAGENET_MEAN) / IMAGENET_STD).transpose(2, 0, 1)[None]
    out = s.run(None, {s.get_inputs()[0].name: x})[0].reshape(320, 320)
    out = (out - out.min()) / max(float(out.max() - out.min()), 1e-6)
    return cv2.resize(out, (w, h), interpolation=cv2.INTER_LINEAR)


def salient_alpha(rgb: np.ndarray) -> np.ndarray:
    """BiRefNet: вероятность «передний план» 0..1 в размере входного фото (точно, но тяжело)."""
    h, w = rgb.shape[:2]
    s = session("birefnet.onnx")
    x = cv2.resize(rgb, (1024, 1024), interpolation=cv2.INTER_LINEAR).astype(np.float32) / 255.0
    x = ((x - IMAGENET_MEAN) / IMAGENET_STD).transpose(2, 0, 1)[None]
    out = s.run(None, {s.get_inputs()[0].name: x})[0]
    p = 1.0 / (1.0 + np.exp(-out.reshape(out.shape[-2], out.shape[-1])))
    return cv2.resize(p, (w, h), interpolation=cv2.INTER_LINEAR)


def salient_isnet(rgb: np.ndarray) -> np.ndarray:
    """isnet-general-use (rembg, Apache-2.0), 1024 px: вероятность «вещь» 0..1 в размере входного фото. Резче silueta, на CPU около секунды."""
    h, w = rgb.shape[:2]
    s = session("isnet-general-use.onnx")
    x = cv2.resize(rgb, (1024, 1024), interpolation=cv2.INTER_AREA).astype(np.float32)
    x = x / max(float(x.max()), 1e-6)
    x = (x - IMAGENET_MEAN).transpose(2, 0, 1)[None]  # у isnet std = 1
    out = s.run(None, {s.get_inputs()[0].name: x})[0].reshape(1024, 1024)
    out = (out - out.min()) / max(float(out.max() - out.min()), 1e-6)
    return cv2.resize(out, (w, h), interpolation=cv2.INTER_LINEAR)


# ---------- что за вещь (FashionSigLIP, Apache-2.0): картинка -> вектор
def embed(rgb: np.ndarray) -> np.ndarray:
    s = session("siglip_vision.onnx")
    x = cv2.resize(rgb, (224, 224), interpolation=cv2.INTER_CUBIC).astype(np.float32) / 255.0
    x = ((x - 0.5) / 0.5).transpose(2, 0, 1)[None]
    outs = s.run(None, {s.get_inputs()[0].name: x})
    names = [o.name for o in s.get_outputs()]
    v = outs[names.index("image_embeds")] if "image_embeds" in names else outs[-1]
    v = v.reshape(-1).astype(np.float32)
    return v / (np.linalg.norm(v) + 1e-9)
