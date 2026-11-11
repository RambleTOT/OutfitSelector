# Наш сервер: что где стоит и как им пользоваться

Хостинг: AdminVPS (Micro: 2 vCPU, 4 ГБ, 60 ГБ NVMe, ~899 ₽ в месяц), Ubuntu 24.04. IP `152.228.113.55`, домен `atelierai.ru`. Решения по выбору тарифа и бюджету: `docs/TIMEWEB.md` (там про выбор размера), здесь только то, что реально настроено.

## Доступ
- Вход только по ключу: `ssh atelier` (запись в `~/.ssh/config`, ключ `~/.ssh/atelier_ed25519` лежит на Mac владельца). Пароль root отключён.
- Выложить изменения: `SSH_OPTS="-i ~/.ssh/atelier_ed25519 -o IdentitiesOnly=yes" ./deploy/deploy.sh atelier@152.228.113.55`
- Отозвать доступ ассистента: удалить строку `atelier-deploy@claude` из `/root/.ssh/authorized_keys` и `/home/atelier/.ssh/authorized_keys`.

## Что запущено
| Часть | Как |
|---|---|
| nginx | `/etc/nginx/sites-available/atelier`, сайт из `/var/www/atelier`, `/api/` на 127.0.0.1:8787 |
| API | `atelier-api` (systemd), `/opt/atelier/server`, слушает только 127.0.0.1 |
| Распознавание | `atelier-vision` (systemd), `/opt/atelier/vision`, 127.0.0.1:7100, модели ~450 МБ |
| Данные | `/opt/atelier/server/data` (db.json, photos/, events.jsonl) |
| Секреты | `/opt/atelier/server/.env` (права 600), заполняются скриптом `bash /opt/atelier/set-secrets.sh` (ввод не показывается) |
| Защита | ufw (открыты только SSH, 80, 443), fail2ban, вход по паролю отключён |
| Копии | cron пользователя `atelier`, 03:17 каждый день, `/home/atelier/atelier-backup-<день>.tgz`; **раз в неделю скачивай к себе**, на сервере они не защита от потери сервера |

## Полезные команды (после `ssh atelier`)
```
systemctl status atelier-api atelier-vision nginx
journalctl -u atelier-api -f
curl http://127.0.0.1:8787/api/health
curl http://127.0.0.1:7100/health
```

## Проверено при запуске (10 ноября 2026)
Сайт и приложение отдаются, вход по коду работает, распознавание вещей на тестовых фото отвечает (белая футболка 0,93, голубая рубашка в полоску 0,89), порты 465 (почта reg.ru) и 443 (Selectel, Метрика) с сервера доступны.

## Что осталось
1. ~~DNS и HTTPS~~ сделано 11 ноября 2026: A-записи на 152.228.113.55, сертификат Let's Encrypt (до 9 февраля 2027, продлевается сам), боевой nginx с редиректом http→https и www→основной адрес.
2. `bash /opt/atelier/set-secrets.sh`: пароль почты, ключ Selectel, CloudPayments.
3. Монитор доступности (UptimeRobot) на `https://atelierai.ru/api/health`.
