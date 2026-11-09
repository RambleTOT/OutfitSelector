"""Считает векторы подписей (виды вещей, рисунок, «не одежда») текстовой частью FashionSigLIP и сохраняет models/labels.npz.
После этого текстовая модель серверу не нужна. Запуск: python scripts/build_labels.py"""
import sys
from pathlib import Path

import numpy as np
import onnxruntime as ort
from tokenizers import Tokenizer

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from app import config, labels as lb  # noqa: E402

tok = Tokenizer.from_file(str(config.MODELS / "siglip_tokenizer.json"))
sess = ort.InferenceSession(str(config.MODELS / "siglip_text.onnx"), providers=["CPUExecutionProvider"])
in_names = [i.name for i in sess.get_inputs()]
out_names = [o.name for o in sess.get_outputs()]
print("входы", in_names, "выходы", out_names)

pad_id = tok.token_to_id("</s>") or 1
tok.enable_padding(length=64, pad_id=pad_id, pad_token="</s>")
tok.enable_truncation(max_length=64)


def embed(prompts: list[str]) -> np.ndarray:
    """Среднее по нескольким подписям одной вещи, нормированное."""
    vecs = []
    for p in prompts:
        ids = np.array([tok.encode(p.lower()).ids], np.int64)
        feed = {in_names[0]: ids}
        out = sess.run(None, feed)
        v = out[out_names.index("text_embeds")] if "text_embeds" in out_names else out[-1]
        v = v.reshape(-1).astype(np.float32)
        vecs.append(v / (np.linalg.norm(v) + 1e-9))
    m = np.mean(vecs, axis=0)
    return m / (np.linalg.norm(m) + 1e-9)


type_names = list(lb.TYPES)
pat_names = list(lb.PATTERNS)
np.savez(
    config.MODELS / "labels.npz",
    type_names=np.array(type_names), type_emb=np.stack([embed(lb.TYPES[n][1]) for n in type_names]),
    pat_names=np.array(pat_names), pat_emb=np.stack([embed(lb.PATTERNS[n]) for n in pat_names]),
    neg_emb=np.stack([embed([p]) for p in lb.NEGATIVE]),
)
print("labels.npz готов:", len(type_names), "видов,", len(pat_names), "рисунков,", len(lb.NEGATIVE), "«не одежда»")
