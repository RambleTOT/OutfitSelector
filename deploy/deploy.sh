#!/usr/bin/env bash
# Выкладка на сервер одной командой (с твоего компьютера): ./deploy/deploy.sh user@IP
# Собирает сайт, кладёт dist в /var/www/atelier, копирует сервер в /opt/atelier/server и перезапускает его.
# Первый раз сервер нужно подготовить по docs/DEPLOY.md (шаги 1–8).
set -euo pipefail
HOST="${1:?Укажи сервер: ./deploy/deploy.sh user@IP}"

npm run build -- --mode production            # VITE_* берутся из .env.production
rsync -az --delete dist/ "$HOST:/var/www/atelier/"
rsync -az --delete --exclude node_modules --exclude data --exclude .env server/ "$HOST:/opt/atelier/server/"
ssh "$HOST" "cd /opt/atelier/server && npm ci --omit=dev --silent && sudo systemctl restart atelier-api && sleep 1 && curl -fsS http://127.0.0.1:8787/api/health && echo"
echo "Готово"
