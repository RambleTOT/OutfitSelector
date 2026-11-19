#!/usr/bin/env bash
# Запусти на сервере: bash /opt/atelier/set-admins.sh
# Задаёт, чьи почты могут входить в админку (https://atelierai.ru/admin/). Вход: код из письма + приложение-аутентификатор.
# Список можно менять в любой момент: убранная почта теряет доступ сразу, открытые сессии закрываются.
set -e
ENV=/opt/atelier/server/.env
setv() { local k="$1" v="$2"; grep -q "^$k=" "$ENV" && sed -i "s|^$k=.*|$k=$(printf %s "$v" | sed -e "s/[|&\\\\]/\\\\&/g")|" "$ENV" || echo "$k=$v" >> "$ENV"; }
CUR=$(grep -E '^ADMIN_EMAILS=' "$ENV" | cut -d= -f2- || true)
[ -n "$CUR" ] && echo "Сейчас админы: $CUR"
read -rp "Почты админов через запятую: " E
E=$(printf %s "$E" | tr 'A-Z' 'a-z' | tr -d ' ')
[ -z "$E" ] && { echo "Список пустой, ничего не меняю"; exit 1; }
IFS=',' read -ra LIST <<< "$E"
for x in "${LIST[@]}"; do [[ "$x" =~ ^[^@,]+@[^@,]+\.[^@,]+$ ]] || { echo "Не похоже на почту: $x"; exit 1; }; done
setv ADMIN_EMAILS "$E"
chown atelier:atelier "$ENV"; chmod 600 "$ENV"
sudo systemctl restart atelier-api 2>/dev/null || systemctl restart atelier-api
echo "Готово. Админы: $E"
echo "Дальше: https://atelierai.ru/admin/ → введи почту → код из письма → настрой аутентификатор и сохрани резервные коды"
