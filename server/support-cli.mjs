// Ответы в поддержке с сервера:
//   node server/support-cli.mjs list                      кто ждёт ответа и последние сообщения
//   node server/support-cli.mjs show почта@пример.ру      вся переписка
//   node server/support-cli.mjs reply почта@пример.ру "текст ответа"
//   node server/support-cli.mjs clear почта@пример.ру     удалить переписку (например, тестовую)
// Работает через API сервера (по умолчанию http://127.0.0.1:8787), поэтому запускать на сервере. Нужен SUPPORT_ADMIN_TOKEN из .env сервера:
//   set -a; . /opt/atelier/server/.env; set +a; node /opt/atelier/server/support-cli.mjs list
const base = process.env.API_URL ?? 'http://127.0.0.1:8787'
const token = process.env.SUPPORT_ADMIN_TOKEN
if (!token) { console.error('Задай SUPPORT_ADMIN_TOKEN (тот же, что в .env сервера)'); process.exit(1) }
const call = async (method, path, body) => {
  const r = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token }, body: body ? JSON.stringify(body) : undefined })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(`${r.status} ${j.error ?? ''}`)
  return j
}
const [cmd, who, ...rest] = process.argv.slice(2)
const fmt = (m) => `${new Date(m.at).toLocaleString('ru-RU')}  ${m.from === 'team' ? 'МЫ  ' : 'ОН   '} ${m.text}`
try {
  if (cmd === 'list') {
    const { threads } = await call('GET', '/api/admin/support')
    for (const t of threads) console.log(`${t.waiting ? '● ждёт ответа' : '  отвечено   '}  ${t.email}  ${t.plan}\n    ${fmt(t.last)}`)
    if (!threads.length) console.log('Сообщений нет')
  } else if (cmd === 'show' && who) {
    const { messages } = await call('GET', `/api/admin/support?email=${encodeURIComponent(who)}`)
    messages.forEach((m) => console.log(fmt(m)))
  } else if (cmd === 'reply' && who && rest.length) {
    await call('POST', '/api/admin/support', { email: who, text: rest.join(' ') })
    console.log('Отправлено, человек увидит ответ в приложении')
  } else if (cmd === 'clear' && who) {
    await call('DELETE', `/api/admin/support?email=${encodeURIComponent(who)}`)
    console.log('Переписка удалена')
  } else console.log('list | show <почта> | reply <почта> "текст" | clear <почта>')
} catch (e) { console.error('Ошибка:', e.message); process.exit(1) }
