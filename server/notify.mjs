// Сообщения команде в Telegram: мониторинг, бэкапы, вход в админку. Бот и чат задаёт deploy/set-ops.sh (ALERT_TG_BOT_TOKEN, ALERT_TG_CHAT_ID).
// Если отдельного бота нет, берётся бот поддержки (SUPPORT_TG_*). Без настроек ничего не отправляется, сервер от этого не падает.
const creds = (env) => ({
  token: env.ALERT_TG_BOT_TOKEN || env.SUPPORT_TG_BOT_TOKEN || '',
  chat: env.ALERT_TG_CHAT_ID || env.SUPPORT_TG_CHAT_ID || '',
})
export const opsEnabled = (env = process.env) => { const c = creds(env); return !!(c.token && c.chat) }

/** Текстовое сообщение. Возвращает true, если Telegram принял */
export async function notifyOps(text, { env = process.env, fetchImpl = fetch } = {}) {
  const { token, chat } = creds(env)
  if (!token || !chat) return false
  try {
    const r = await fetchImpl(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text: String(text).slice(0, 3900), disable_web_page_preview: true }),
      signal: AbortSignal.timeout(10000),
    })
    return r.ok
  } catch { return false }
}

/** Файл (бэкап) с подписью. Лимит Telegram для ботов: 50 МБ */
export async function sendOpsFile(buffer, filename, caption = '', { env = process.env, fetchImpl = fetch } = {}) {
  const { token, chat } = creds(env)
  if (!token || !chat) return false
  try {
    const form = new FormData()
    form.append('chat_id', chat)
    form.append('caption', String(caption).slice(0, 900))
    form.append('document', new Blob([buffer]), filename)
    const r = await fetchImpl(`https://api.telegram.org/bot${token}/sendDocument`, { method: 'POST', body: form, signal: AbortSignal.timeout(60000) })
    return r.ok
  } catch { return false }
}
