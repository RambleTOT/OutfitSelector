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
# мониторинг и бэкапы: unit-файлы, таймеры и скрипт подключения Telegram-бота (docs/OPS.md)
if [ -f deploy/atelier-monitor.service ] && [ -f deploy/atelier-backup.service ]; then
  rsync -az -e "$SSH" deploy/atelier-monitor.service deploy/atelier-monitor.timer deploy/atelier-backup.service deploy/atelier-backup.timer deploy/set-ops.sh deploy/set-admins.sh "$HOST:/tmp/atelier-ops/" 2>/dev/null \
    || { $SSH "$HOST" "mkdir -p /tmp/atelier-ops"; rsync -az -e "$SSH" deploy/atelier-monitor.service deploy/atelier-monitor.timer deploy/atelier-backup.service deploy/atelier-backup.timer deploy/set-ops.sh deploy/set-admins.sh "$HOST:/tmp/atelier-ops/"; }
  # пользователь atelier без sudo: если установка не прошла, выполни этот блок под root (docs/OPS.md), выкладка к этому моменту уже завершена
  $SSH "$HOST" "sudo -n true" 2>/dev/null && $SSH "$HOST" "sudo mkdir -p /opt/atelier/backups && sudo chown atelier:atelier /opt/atelier/backups && sudo chmod 700 /opt/atelier/backups \
    && sudo install -m 644 /tmp/atelier-ops/atelier-monitor.service /tmp/atelier-ops/atelier-monitor.timer /tmp/atelier-ops/atelier-backup.service /tmp/atelier-ops/atelier-backup.timer /etc/systemd/system/ \
    && sudo install -m 755 -o atelier -g atelier /tmp/atelier-ops/set-ops.sh /tmp/atelier-ops/set-admins.sh /opt/atelier/ \
    && sudo systemctl daemon-reload && sudo systemctl enable --now atelier-monitor.timer atelier-backup.timer && rm -rf /tmp/atelier-ops" \
    || echo "Таймеры мониторинга и бэкапа не установлены (нужен root): ssh atelier, затем команды из docs/OPS.md, раздел «Установка»"
fi
echo "Готово"
