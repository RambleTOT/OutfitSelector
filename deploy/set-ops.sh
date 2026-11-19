#!/usr/bin/env bash
# Запусти на сервере: bash /opt/atelier/set-ops.sh  (вводимое не отображается и никуда не отправляется, кроме Telegram)
# Подключает Telegram-бота для мониторинга, ежедневного бэкапа и уведомлений о входе в админку.
# Нужен токен бота: в Telegram найди @BotFather, команда /newbot, придумай имя, он пришлёт токен вида 123456:ABC...
set -e
ENV=/opt/atelier/server/.env
setv() { # имя значение
  local k="$1" v="$2"
  grep -q "^$k=" "$ENV" && sed -i "s|^$k=.*|$k=$(printf %s "$v" | sed -e "s/[|&\\\\]/\\\\&/g")|" "$ENV" || echo "$k=$v" >> "$ENV"
}
# запросы к Telegram: адрес с токеном передаём curl через stdin, чтобы токен не светился в списке процессов
tg() { # метод [параметры curl]
  local m="$1"; shift
  printf 'url = "https://api.telegram.org/bot%s/%s"\n' "$T" "$m" | curl -sS -m 20 -K - "$@"
}

read -rsp "Токен бота от @BotFather: " T; echo
[ -n "$T" ] || { echo "Токен не введён"; exit 1; }
ME=$(tg getMe) || { echo "Нет связи с Telegram"; exit 1; }
echo "$ME" | grep -q '"ok":true' || { echo "Telegram не принял токен, проверь, что скопировал его целиком"; exit 1; }
BOT=$(echo "$ME" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).result.username))')
echo "Бот найден: @$BOT"
echo
echo "Теперь открой Telegram, найди @$BOT и отправь ему сообщение /start (нажми «Запустить» или «Start»)."
read -rp "Когда отправишь, нажми Enter: " _
CHAT=$(tg getUpdates | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const r=(JSON.parse(s).result||[]).map(u=>u.message||u.my_chat_member).filter(m=>m&&m.chat&&m.chat.type==="private").pop();console.log(r?r.chat.id:"")})')
[ -n "$CHAT" ] || { echo "Сообщения боту не видно. Отправь ему /start ещё раз и запусти скрипт снова"; exit 1; }
setv ALERT_TG_BOT_TOKEN "$T"
setv ALERT_TG_CHAT_ID "$CHAT"
OKSEND=$(tg sendMessage --data-urlencode "chat_id=$CHAT" --data-urlencode "text=✅ Atelier: бот подключён. Сюда будут приходить тревоги мониторинга, ежедневный бэкап и уведомления о входе в админку" | grep -c '"ok":true' || true)
[ "$OKSEND" = "1" ] && echo "Тестовое сообщение отправлено, проверь Telegram" || echo "Не получилось отправить тестовое сообщение, проверь токен и повтори"

if grep -q '^BACKUP_PASSPHRASE=.\+' "$ENV"; then
  echo "Ключ шифрования бэкапов уже задан, не меняю"
else
  K=$(openssl rand -base64 33)
  setv BACKUP_PASSPHRASE "$K"
  echo
  echo "=================================================================="
  echo " КЛЮЧ ШИФРОВАНИЯ БЭКАПОВ (покажется только сейчас):"
  echo
  echo "   $K"
  echo
  echo " СОХРАНИ ЕГО В МЕНЕДЖЕР ПАРОЛЕЙ ПРЯМО СЕЙЧАС, вне этого сервера."
  echo " Бэкапы в Telegram зашифрованы. Если сервер погибнет, а ключа"
  echo " у тебя не будет, расшифровать их не сможет никто."
  echo " Посмотреть ключ позже можно на сервере: grep BACKUP_PASSPHRASE $ENV"
  echo "=================================================================="
  echo
  read -rp "Сохранил? Нажми Enter, чтобы продолжить: " _
fi

chown atelier:atelier "$ENV"; chmod 600 "$ENV"
sudo systemctl restart atelier-api 2>/dev/null || systemctl restart atelier-api
echo "Сервис перезапущен"
read -rp "Сделать первый бэкап сейчас и прислать его в Telegram? [Y/n]: " B
if [ "${B:-Y}" != "n" ] && [ "${B:-Y}" != "N" ]; then
  sudo systemctl start atelier-backup.service 2>/dev/null || systemctl start atelier-backup.service || true
  journalctl -u atelier-backup -n 3 --no-pager 2>/dev/null | sed 's/^/  /' || true
  echo "Файл бэкапа должен прийти в Telegram"
fi
echo "Готово"
