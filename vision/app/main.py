import asyncio
from contextlib import asynccontextmanager
from dataclasses import asdict

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from . import config, models

@asynccontextmanager
async def lifespan(_: FastAPI):
    # прогреваем модели при старте: первый запрос человека не должен ждать загрузку и разогрев
    def warm():
        import numpy as np
        from . import pipeline
        dummy = (np.random.default_rng(0).random((320, 240, 3)) * 255).astype("uint8")
        try:
            if models.available("segformer.onnx"):
                models.segment(dummy)
            if models.available("silueta.onnx"):
                models.salient_small(dummy)
            if models.available("siglip_vision.onnx"):
                models.embed(dummy)
            pipeline._labels()
        except Exception as e:  # сервис всё равно поднимется, а проблема будет видна в /health
            print("прогрев не удался:", repr(e))
    await asyncio.get_running_loop().run_in_executor(None, warm)
    yield


app = FastAPI(title="Atelier vision", docs_url=None, redoc_url=None, lifespan=lifespan)
_sem = asyncio.Semaphore(config.CONCURRENCY)
MAX_BYTES = 8_000_000


@app.get("/health")
def health():
    return {"ok": True, "models": {n: models.available(n) for n in ("segformer.onnx", "silueta.onnx", "siglip_vision.onnx", "labels.npz")}}


@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    data = await file.read()
    if not data or len(data) > MAX_BYTES:
        raise HTTPException(413 if data else 400, "bad_image")
    if _sem.locked():  # все слоты заняты: пусть клиент повторит позже, а не копит очередь в памяти
        raise HTTPException(503, "busy")
    async with _sem:
        from . import pipeline
        try:
            res = await asyncio.wait_for(asyncio.get_running_loop().run_in_executor(None, pipeline.analyze, data), timeout=90)
        except asyncio.TimeoutError:
            raise HTTPException(504, "timeout")
        except HTTPException:
            raise
        except Exception as e:  # битый файл, формат без поддержки
            raise HTTPException(422, f"bad_image: {type(e).__name__}")
    return JSONResponse(asdict(res))
