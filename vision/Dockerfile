# Сервис распознавания вещей и вырезания фона. Сборка: docker build -t atelier-vision vision/
# Модели в образ не вшиты (≈ 700 МБ): они лежат в томе /models и скачиваются один раз скриптом download_models.sh
FROM python:3.11-slim
ENV PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1 VISION_MODELS=/models
WORKDIR /srv
RUN apt-get update && apt-get install -y --no-install-recommends curl libglib2.0-0 && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY app app
COPY scripts scripts
EXPOSE 7100
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s CMD curl -fsS http://127.0.0.1:7100/health || exit 1
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7100", "--workers", "1"]
