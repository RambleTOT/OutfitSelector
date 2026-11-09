# Сервер на Timeweb Cloud: от нуля до работающего сайта на домене

Вся цепочка: купить домен на reg.ru → заказать сервер на Timeweb Cloud → привязать домен → поставить всё на сервер → выложить сайт → проверить. Время: 1–2 часа, из них ожидание DNS.

Названия кнопок в кабинетах меняются, ищи по смыслу. Если что-то выглядит иначе, чем здесь, не страшно: нужен результат, а не точный клик.

## 0. Что должно быть на руках

- Карта для оплаты сервера и домена.
- Доступ к почте (на неё придут письма от reg.ru и Timeweb).
- Терминал на твоём компьютере (macOS: приложение «Терминал»).
- Репозиторий Atelier на компьютере, `npm install` уже делался.

## 1. Домен на reg.ru (5 минут, ты)

1. Зайди на [reg.ru](https://www.reg.ru), зарегистрируйся или войди.
2. В поиске домена введи `atelierapp.ru` (свободность проверена 7 ноября 2026, но перепроверь). Запасные: `atelierai.ru`, `atelier-app.ru`.
3. Закажи на 1 год. В данных владельца пиши настоящие: ФИО или данные ИП, телефон, почта. Проверку почты владельца reg.ru делает письмом, подтверди его, иначе домен могут отключить.
4. **Отключи платные допы**, которые reg.ru добавляет в корзину (защита, почта, сертификат), если не нужны: сертификат мы выпустим бесплатно, почту заведём отдельно.

## 2. Сервер на Timeweb Cloud (10 минут, ты)

1. Зайди на [timeweb.cloud](https://timeweb.cloud), зарегистрируйся, пополни баланс на 500–1000 ₽.
2. «Облачные серверы» → «Создать сервер».
3. Параметры:
   - **Регион:** Москва или Санкт-Петербург (данные должны быть в РФ: это требование 152-ФЗ).
   - **Образ:** Ubuntu 24.04.
   - **Конфигурация:** сервис распознавания вещей и вырезания фона (`docs/VISION.md`) держит в памяти ~1,2 ГБ моделей. Для MVP (до 20 пользователей, бюджет до 2 000 ₽ в месяц) бери **2 vCPU, 4 ГБ памяти, 40–50 ГБ NVMe**: фото будут обрабатываться 15–40 секунд по одному, этого хватает. Меньше 4 ГБ нельзя. 4 vCPU и 8 ГБ нужны, когда пользователей станет заметно больше. Без сервиса распознавания хватило бы 2 vCPU и 2 ГБ.
   - **Публичный IPv4:** включить (обычно по умолчанию).
   - **SSH-ключ:** добавь свой публичный ключ (см. ниже). Это безопаснее пароля.
   - **Имя:** `atelier`.
   - **Бэкапы:** включи автоматические (платная опция в десятки рублей, окупается).
4. Нажми «Заказать». Через минуту будет IP-адрес. Запиши его.

**Как создать SSH-ключ**, если его нет (на твоём компьютере):

```bash
ssh-keygen -t ed25519 -C "atelier" -f ~/.ssh/atelier_ed25519 -N ""
cat ~/.ssh/atelier_ed25519.pub
```

Вторая команда печатает **публичный** ключ (строка `ssh-ed25519 AAAA...`). Его вставляют в Timeweb. Файл без `.pub` секретный, никому его не отправляй.

Проверка входа: `ssh -i ~/.ssh/atelier_ed25519 root@<IP>`. Если пустило, сервер готов.

## 3. Привязка домена к серверу (5 минут + ожидание, ты или агент)

Проще всего оставить DNS на reg.ru.

1. reg.ru → «Мои домены» → `atelierapp.ru` → «DNS-серверы и управление зоной».
2. Убедись, что используются DNS reg.ru (`ns1.reg.ru`, `ns2.reg.ru`).
3. Добавь записи:

| Тип | Имя | Значение |
|---|---|---|
| A | `@` | IP сервера |
| A | `www` | IP сервера |

4. Удали лишние A-записи, если reg.ru создал парковочные.
5. Подожди от 5 минут до пары часов. Проверка с компьютера:

```bash
dig +short atelierapp.ru
dig +short www.atelierapp.ru
```

Обе команды должны напечатать IP сервера. Пока печатают другое, сертификат не выпускай.

## 4. Подготовка сервера (10 минут)

Подключись `ssh -i ~/.ssh/atelier_ed25519 root@<IP>` и выполни:

```bash
apt update && apt -y upgrade
apt -y install nginx certbot python3-certbot-nginx ufw rsync curl git python3-venv python3-pip libglib2.0-0

curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt -y install nodejs

adduser --disabled-password --gecos "" atelier
mkdir -p /opt/atelier/server /opt/atelier/vision/models /var/www/atelier /home/atelier/.ssh
cp /root/.ssh/authorized_keys /home/atelier/.ssh/authorized_keys
chown -R atelier:atelier /opt/atelier /var/www/atelier /home/atelier/.ssh
chmod 700 /home/atelier/.ssh && chmod 600 /home/atelier/.ssh/authorized_keys
echo 'atelier ALL=(ALL) NOPASSWD: /bin/systemctl restart atelier-api, /bin/systemctl restart atelier-vision' > /etc/sudoers.d/atelier

ufw allow OpenSSH && ufw allow 'Nginx Full' && ufw --force enable
```

Проверка: `node -v` печатает `v22...`, `nginx -v` печатает версию, `ufw status` показывает активный файрвол с OpenSSH и Nginx Full. С компьютера: `ssh -i ~/.ssh/atelier_ed25519 atelier@<IP>` пускает.

## 5. Конфиги и сертификат (10 минут)

На своём компьютере, в папке репозитория:

```bash
scp -i ~/.ssh/atelier_ed25519 deploy/nginx.conf root@<IP>:/etc/nginx/sites-available/atelier
scp -i ~/.ssh/atelier_ed25519 deploy/atelier-api.service root@<IP>:/etc/systemd/system/atelier-api.service
scp -i ~/.ssh/atelier_ed25519 deploy/atelier-vision.service root@<IP>:/etc/systemd/system/atelier-vision.service
```

На сервере:

```bash
sed -i 's/your-domain.ru/atelierapp.ru/g' /etc/nginx/sites-available/atelier
```

Сертификат нельзя выпустить, пока в конфиге есть блок `443` с несуществующими файлами. Поэтому сначала временный конфиг:

```bash
cat > /etc/nginx/sites-available/atelier-temp <<'EOF'
server {
    listen 80;
    server_name atelierapp.ru www.atelierapp.ru;
    root /var/www/atelier;
}
EOF
ln -sf /etc/nginx/sites-available/atelier-temp /etc/nginx/sites-enabled/atelier
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

certbot certonly --webroot -w /var/www/atelier -d atelierapp.ru -d www.atelierapp.ru --agree-tos -m ТВОЯ@ПОЧТА --non-interactive

ln -sf /etc/nginx/sites-available/atelier /etc/nginx/sites-enabled/atelier
nginx -t && systemctl reload nginx
systemctl daemon-reload && systemctl enable atelier-api
```

Сертификат продлевается сам (таймер certbot). Проверь: `systemctl list-timers | grep certbot`.

## 5б. Сервис распознавания вещей и вырезания фона (15 минут, один раз)

Сервис выделяет вещи на фото, вырезает фон и определяет вид и цвет (`docs/VISION.md`). Модели (≈ 450 МБ) скачиваются на сервер один раз. С компьютера сначала залей код (`./deploy/deploy.sh` на шаге 7 делает это же, но модели и окружение нужно подготовить заранее):

```bash
rsync -az -e "ssh -i ~/.ssh/atelier_ed25519" --exclude .venv --exclude models --exclude __pycache__ vision/ atelier@<IP>:/opt/atelier/vision/
rsync -az -e "ssh -i ~/.ssh/atelier_ed25519" vision/models/labels.npz atelier@<IP>:/opt/atelier/vision/models/labels.npz
```

На сервере, под пользователем `atelier` (`ssh -i ~/.ssh/atelier_ed25519 atelier@<IP>`):

```bash
cd /opt/atelier/vision
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
VISION_MODELS=/opt/atelier/vision/models bash scripts/download_models.sh
```

Потом под root: `systemctl daemon-reload && systemctl enable --now atelier-vision`. Подождать 20 секунд на прогрев и проверить:

```bash
curl http://127.0.0.1:7100/health        # все четыре модели true
```

Снаружи сервис не открыт: порт 7100 слушает только `127.0.0.1`, файрвол его не пропускает. К нему ходит только наш API. В `/opt/atelier/server/.env` нужна строка `VISION_URL=http://127.0.0.1:7100`.

Проверка качества на живых фото: скопируй на сервер 5–10 своих фото и выполни `.venv/bin/python scripts/eval.py фото.jpg`: увидишь, что нашли, за сколько секунд и какой вид и цвет. Если время больше 30 секунд на фото, увеличь сервер или поставь `VISION_THREADS` по числу ядер.

## 6. Настройки сервера приложения (10 минут)

На своём компьютере подготовь `.env` для сервера (по образцу `server/.env.example`). Минимум:

```
NODE_ENV=production
PORT=8787
TOKEN_SECRET=<результат команды: openssl rand -hex 32>
DATA_DIR=./data
MAIL_MODE=smtp
SMTP_HOST=smtp.yandex.ru
SMTP_PORT=465
SMTP_USER=no-reply@atelierapp.ru
SMTP_PASS=<пароль приложения>
MAIL_FROM="Atelier <no-reply@atelierapp.ru>"
AI_PROVIDER=none
VISION_URL=http://127.0.0.1:7100
```

Положи на сервер и закрой права:

```bash
scp -i ~/.ssh/atelier_ed25519 server/.env atelier@<IP>:/opt/atelier/server/.env
ssh -i ~/.ssh/atelier_ed25519 atelier@<IP> "chmod 600 /opt/atelier/server/.env"
```

Секреты (пароль почты, ключи AI и CloudPayments) в чат, репозиторий и скриншоты не попадают. `.env` лежит только на сервере и у тебя.

Почта для кодов: самый простой путь, ящик `no-reply@atelierapp.ru` в Яндекс 360 для бизнеса (добавить домен, подтвердить его TXT-записью, прописать MX, создать ящик, включить «Пароли приложений»). Если не хочешь платить, возьми обычную почту хостинга. Без работающего SMTP кодов не будет, а значит и входа.

## 7. Первая выкладка (5 минут)

На компьютере:

```bash
cp .env.example .env.production                  # VITE_API_URL=same
node tools/set-domain.mjs atelierapp.ru <телеграм_поддержки> <почта_поддержки>
cp docs/legal/values.example.json docs/legal/values.json    # заполни своими данными
npm run legal
SSH_OPTS="-i ~/.ssh/atelier_ed25519" ./deploy/deploy.sh atelier@<IP>
```

Если скрипт не знает про ключ, добавь его в `~/.ssh/config`:

```
Host atelier-server
  HostName <IP>
  User atelier
  IdentityFile ~/.ssh/atelier_ed25519
```

и запускай `./deploy/deploy.sh atelier-server`.

## 8. Проверка, что всё живо

```bash
curl -I https://atelierapp.ru                     # 200, сертификат без ошибок
curl https://atelierapp.ru/api/health             # {"ok":true,...}
curl https://atelierapp.ru/api/config             # {"ai":false,"analyze":true,"pay":false}
curl -I https://atelierapp.ru/app/manifest.webmanifest   # 200, тип application/manifest+json
curl -I https://atelierapp.ru/legal/offer.html    # 200
```

В браузере: лендинг → «Попробовать бесплатно» → в приложении вход по почте с настоящим кодом → гардероб после перезагрузки не пропал. С телефона: экран «Поставь Atelier на экран».

Если что-то не так, смотри `journalctl -u atelier-api -n 100`, `nginx -t`, `tail -n 50 /var/log/nginx/error.log` и таблицу проблем в `docs/DEPLOY.md`.

## 9. Дальше по желанию

- Резервные копии и мониторинг: `docs/DEPLOY.md`, разделы 7 и 8.
- AI: ключ в `.env`, `AI_PROVIDER=gigachat`, перезапуск `sudo systemctl restart atelier-api` (`docs/AI.md`).
- Оплата: `docs/PAYMENTS.md`.
- Распознавание вещей и вырезание фона: `docs/VISION.md`.
