// Управление входом в админку с сервера:
//   node server/admin-cli.mjs list                 кто админ, настроена ли 2FA, когда входил
//   node server/admin-cli.mjs reset-2fa почта      потерян телефон: сбросить аутентификатор и закрыть сессии
// Работает через API сервера (по умолчанию http://127.0.0.1:8787), поэтому запускать на сервере. Нужен SUPPORT_ADMIN_TOKEN из .env:
//   set -a; . /opt/atelier/server/.env; set +a; node /opt/atelier/server/admin-cli.mjs list
const base = process.env.API_URL ?? 'http://127.0.0.1:8787'
const token = process.env.SUPPORT_ADMIN_TOKEN
if (!token) { console.error('Задай SUPPORT_ADMIN_TOKEN (тот же, что в .env сервера)'); process.exit(1) }
const call = async (method, path, body) => {
  const r = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token, 'X-Requested-With': 'atelier-admin' }, body: body ? JSON.stringify(body) : undefined })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(`${r.status} ${j.error ?? ''}`)
  return j
}
const [cmd, who] = process.argv.slice(2)
try {
  if (cmd === 'list') {
    const { admins } = await call('GET', '/api/admin/admins')
    for (const a of admins) console.log(`${a.email}  2FA: ${a.totp ? 'включена' : 'не настроена'}${a.locked ? '  ЗАБЛОКИРОВАН' : ''}  резервных кодов: ${a.recoveryLeft}  вход: ${a.lastLoginAt ? new Date(a.lastLoginAt).toLocaleString('ru-RU') : 'не входил'}`)
    if (!admins.length) console.log('ADMIN_EMAILS пуст: в админку никто не войдёт')
  } else if (cmd === 'reset-2fa' && who) {
    await call('POST', '/api/admin/reset-2fa', { email: who })
    console.log('Готово: при следующем входе человек настроит аутентификатор заново')
  } else console.log('list | reset-2fa <почта>')
} catch (e) { console.error('Ошибка:', e.message); process.exit(1) }
