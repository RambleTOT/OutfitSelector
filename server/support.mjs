// Поддержка внутри приложения, без почты: человек пишет в чат на экране «Поддержка», сообщения лежат на сервере,
// мы отвечаем командой server/support-cli.mjs (или через Telegram-бота, если задан SUPPORT_TG_BOT_TOKEN и SUPPORT_TG_CHAT_ID),
// ответ человек видит в том же экране.
const MAX_THREAD = 200

export function thread(store, userId) {
  store.db.support ??= {}
  return (store.db.support[userId] ??= { messages: [], seen: 0 })
}

export function addMessage(store, userId, from, text) {
  const t = thread(store, userId)
  const m = { id: store.id(), from, text: String(text).slice(0, 1500), at: Date.now() }
  t.messages.push(m)
  if (t.messages.length > MAX_THREAD) t.messages.splice(0, t.messages.length - MAX_THREAD)
  store.save()
  return m
}

/** Что отдаём клиенту: сообщения и сколько ответов команды он ещё не видел */
export function view(store, userId, markSeen = false) {
  const t = thread(store, userId)
  const unread = t.messages.filter((m) => m.from === 'team' && m.at > t.seen).length
  if (markSeen && unread) { t.seen = Date.now(); store.save() }
  return { messages: t.messages.map(({ id, from, text, at }) => ({ id, from, text, at })), unread }
}

/** Сообщить команде: в Telegram, если настроен бот, и всегда в журнал сервера (journalctl -u atelier-api) */
export async function notifyTeam({ email, plan, text }, env = process.env, fetchImpl = fetch) {
  console.log(`[support] ${email} (${plan}): ${text.slice(0, 300).replace(/\s+/g, ' ')}`)
  const token = env.SUPPORT_TG_BOT_TOKEN
  const chat = env.SUPPORT_TG_CHAT_ID
  if (!token || !chat) return
  try {
    await fetchImpl(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text: `Atelier, поддержка\n${email} · ${plan}\n\n${text.slice(0, 1500)}\n\nОтветить: node server/support-cli.mjs reply ${email} "текст"` }),
      signal: AbortSignal.timeout(8000),
    })
  } catch { /* уведомление не должно мешать человеку отправить сообщение */ }
}
