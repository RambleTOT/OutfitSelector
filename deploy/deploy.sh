#!/usr/bin/env bash
# Выкладка на сервер одной командой (с твоего компьютера): ./deploy/deploy.sh user@IP
# Ключ или алиас из ~/.ssh/config подхватываются сами; свой ключ можно передать: SSH_OPTS="-i ~/.ssh/atelier_ed25519" ./deploy/deploy.sh atelier@IP
# Собирает сайт, кладёт dist в /var/www/atelier, копирует сервер в /opt/atelier/server и перезапускает его.
# Первый раз сервер нужно подготовить по docs/TIMEWEB.md.
set -euo pipefail
HOST="${1:?Укажи сервер: ./deploy/deploy.sh user@IP}"
SSH_OPTS="${SSH_OPTS:-}"
SSH="ssh $SSH_OPTS"

npm run build -- --mode production            # VITE_* берутся из .env.production
rsync -az --delete -e "$SSH" dist/ "$HOST:/var/www/atelier/"
rsync -az --delete -e "$SSH" --exclude node_modules --exclude data --exclude .env server/ "$HOST:/opt/atelier/server/"
# сервис распознавания: код и словарь подписей (модели скачиваются на сервере один раз, см. docs/TIMEWEB.md)
$SSH "$HOST" "mkdir -p /opt/atelier/vision/models"
rsync -az --delete -e "$SSH" --exclude .venv --exclude models --exclude __pycache__ vision/ "$HOST:/opt/atelier/vision/"
rsync -az -e "$SSH" vision/models/labels.npz "$HOST:/opt/atelier/vision/models/labels.npz"
$SSH "$HOST" "cd /opt/atelier/vision && .venv/bin/pip install -q -r requirements.txt && sudo systemctl restart atelier-vision" || echo "Сервис распознавания ещё не настроен на сервере, пропускаю (docs/TIMEWEB.md, шаг 5б)"
$SSH "$HOST" "cd /opt/atelier/server && npm ci --omit=dev --silent && sudo systemctl restart atelier-api && sleep 1 && curl -fsS http://127.0.0.1:8787/api/health && echo"
echo "Готово"
