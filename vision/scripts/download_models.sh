#!/usr/bin/env bash
# Скачивает модели в vision/models (один раз, ~450 МБ). Запуск: bash scripts/download_models.sh
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p "${VISION_MODELS:-models}" && cd "${VISION_MODELS:-models}"
B=https://huggingface.co
get() { [ -s "$2" ] && { echo "есть $2"; return; }; echo "качаю $2"; curl -fL --retry 3 -o "$2.part" "$1" && mv "$2.part" "$2"; }

# разбор одежды на человеке: SegFormer B2 (датасет ATR). Лицензия на странице модели помечена как other: проверить до коммерческого запуска
get $B/Xenova/segformer_b2_clothes/resolve/main/onnx/model_quantized.onnx segformer.onnx
get $B/Xenova/segformer_b2_clothes/resolve/main/config.json segformer_config.json
# грубая маска для фото одной вещи: silueta (u2net, Apache-2.0), 43 МБ, 0,3 с на CPU
get https://github.com/danielgatis/rembg/releases/download/v0.0.0/silueta.onnx silueta.onnx
# необязательно, для сильных серверов или видеокарты: BiRefNet lite (MIT), bash scripts/download_models.sh --with-birefnet
if [ "${1:-}" = "--with-birefnet" ]; then get $B/onnx-community/BiRefNet_lite-ONNX/resolve/main/onnx/model.onnx birefnet.onnx; fi
# вид вещи: Marqo FashionSigLIP, Apache-2.0. Берём fp32: int8-версия не запускается на части процессоров (ConvInteger). Текстовая часть нужна только для сборки словаря
get $B/Marqo/marqo-fashionSigLIP/resolve/main/onnx/vision_model.onnx siglip_vision.onnx
# текстовая часть нужна только чтобы пересобрать словарь подписей (labels.npz лежит в репозитории): bash scripts/download_models.sh --with-text
if [ "${1:-}" = "--with-text" ]; then
  get $B/Marqo/marqo-fashionSigLIP/resolve/main/onnx/text_model_int8.onnx siglip_text.onnx
  get $B/Marqo/marqo-fashionSigLIP/resolve/main/tokenizer.json siglip_tokenizer.json
fi
echo "Готово"
