#!/usr/bin/env bash
# Запусти на сервере: bash /opt/atelier/set-robokassa.sh  (вводимое не отображается и никуда не отправляется)
# Пароли берутся в личном кабинете Robokassa: «Технические настройки» магазина. Боевые: Пароль #1 и #2 вверху формы,
# тестовые: Пароль #1 и #2 в блоке «Параметры проведения тестовых платежей».
set -e
ENV=/opt/atelier/server/.env
setv() { # имя значение
  local k="$1" v="$2"
  grep -q "^$k=" "$ENV" && sed -i "s|^$k=.*|$k=$(printf %s "$v" | sed -e "s/[|&\\\\]/\\\\&/g")|" "$ENV" || echo "$k=$v" >> "$ENV"
}
read -rp "Идентификатор магазина (Robokassa) [Atelierai]: " L; L="${L:-Atelierai}"
setv ROBOKASSA_LOGIN "$L"
setv ROBOKASSA_HASH sha256
read -rsp "Тестовый пароль #1: " T1; echo; setv ROBOKASSA_TEST_PASS1 "$T1"
read -rsp "Тестовый пароль #2: " T2; echo; setv ROBOKASSA_TEST_PASS2 "$T2"
read -rsp "Боевой пароль #1 (Enter, чтобы пропустить): " P1; echo
if [ -n "$P1" ]; then setv ROBOKASSA_PASS1 "$P1"; read -rsp "Боевой пароль #2: " P2; echo; setv ROBOKASSA_PASS2 "$P2"; fi
read -rp "Включить тестовый режим (платежи не настоящие)? [Y/n]: " M
if [ "${M:-Y}" = "n" ] || [ "${M:-Y}" = "N" ]; then setv ROBOKASSA_TEST off; echo "режим: боевой"; else setv ROBOKASSA_TEST on; echo "режим: тестовый"; fi
chown atelier:atelier "$ENV"; chmod 600 "$ENV"
sudo systemctl restart atelier-api 2>/dev/null || systemctl restart atelier-api
echo "Готово, сервис перезапущен"
