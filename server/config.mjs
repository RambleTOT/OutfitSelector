import { randomBytes } from 'node:crypto'

const e = process.env

/** Доп. поля тела запроса к OpenAI-совместимому API. systemd при чтении .env съедает кавычки в JSON, поэтому есть простая переменная OPENAI_REASONING_EFFORT, а испорченный JSON чиним и не молчим */
function openaiExtra(env) {
  let extra = {}
  const raw = (env.OPENAI_EXTRA ?? '').trim()
  if (raw) {
    try { extra = JSON.parse(raw) } catch {
      try { extra = JSON.parse(raw.replace(/([{,]\s*)([A-Za-z_][\w]*)\s*:\s*([^,}"\s][^,}]*)/g, (_, a, k, v) => `${a}"${k}":${/^(-?\d+(\.\d+)?|true|false|null)$/.test(v.trim()) ? v.trim() : JSON.stringify(v.trim())}`)) }
      catch { console.warn('[config] OPENAI_EXTRA не разобран, пропускаю: пиши значение в одинарных кавычках или используй OPENAI_REASONING_EFFORT') }
    }
  }
  if (env.OPENAI_REASONING_EFFORT) extra = { ...extra, reasoning_effort: env.OPENAI_REASONING_EFFORT }
  return extra
}
const dev = e.NODE_ENV !== 'production'

export const config = {
  dev,
  supportAdminToken: e.SUPPORT_ADMIN_TOKEN ?? '',
  port: Number(e.PORT ?? 8787),
  corsOrigin: e.CORS_ORIGIN ?? '',
  // в разработке секрет случайный на каждый запуск: токены живут до перезапуска. В проде секрет обязателен
  tokenSecret: e.TOKEN_SECRET || (dev ? randomBytes(32).toString('hex') : ''),
  dataDir: e.DATA_DIR ?? './data',
  staticDir: e.STATIC_DIR ?? '',
  siteUrl: (e.SITE_URL ?? '').replace(/\/$/, ''),
  mail: {
    mode: e.MAIL_MODE ?? (dev ? 'log' : 'smtp'),
    host: e.SMTP_HOST, port: Number(e.SMTP_PORT ?? 465), user: e.SMTP_USER, pass: e.SMTP_PASS,
    from: e.MAIL_FROM ?? e.SMTP_USER,
  },
  ai: {
    provider: e.AI_PROVIDER ?? 'none',
    timeoutMs: Number(e.AI_TIMEOUT_MS ?? 20000),
    gigachat: { key: e.GIGACHAT_AUTH_KEY, scope: e.GIGACHAT_SCOPE ?? 'GIGACHAT_API_PERS', model: e.GIGACHAT_MODEL ?? 'GigaChat-2' },
    yandex: { key: e.YANDEX_API_KEY, folder: e.YANDEX_FOLDER_ID, model: e.YANDEX_MODEL ?? 'yandexgpt-lite/latest' },
    openai: { baseUrl: (e.OPENAI_BASE_URL ?? 'https://openrouter.ai/api/v1').replace(/\/$/, ''), key: e.OPENAI_API_KEY, model: e.OPENAI_MODEL,
      // у «думающих» моделей рассуждение тратит выходные токены: поднимай OPENAI_MAX_TOKENS или выключай рассуждение через OPENAI_EXTRA (JSON, сливается в тело запроса)
      maxTokens: Number(e.OPENAI_MAX_TOKENS ?? 400), temperature: Number(e.OPENAI_TEMPERATURE ?? 0.7), extra: openaiExtra(e) },
    visionUrl: (e.VISION_URL ?? '').replace(/\/$/, ''),
  },
  robokassa: {
    login: e.ROBOKASSA_LOGIN ?? '',
    algo: (e.ROBOKASSA_HASH ?? 'sha256').toLowerCase(),
    pass1: e.ROBOKASSA_PASS1 ?? '', pass2: e.ROBOKASSA_PASS2 ?? '',
    testPass1: e.ROBOKASSA_TEST_PASS1 ?? '', testPass2: e.ROBOKASSA_TEST_PASS2 ?? '',
    test: e.ROBOKASSA_TEST === 'on', // тестовый режим: IsTest=1 и тестовые пароли
  },
  pay: {
    publicId: e.CP_PUBLIC_ID ?? '',
    apiSecret: e.CP_API_SECRET ?? '',
    prices: { sub: Number(e.PRICE_SUB ?? 299), plus: Number(e.PRICE_PLUS ?? e.PRICE_SUBPLUS ?? 599) },
    // для самозанятого онлайн-касса не нужна: чек в «Мой налог» формирует сам продавец. Включай CP_RECEIPT=on только для ИП и юрлиц с CloudKassir
    receipt: e.CP_RECEIPT === 'on',
    taxation: Number(e.CP_TAXATION ?? 1),
    vat: e.CP_VAT === undefined || e.CP_VAT === '' ? null : Number(e.CP_VAT),
  },
}

export function assertConfig() {
  if (!config.tokenSecret) throw new Error('TOKEN_SECRET не задан (openssl rand -hex 32)')
  if (!config.dev && config.mail.mode === 'smtp' && !(config.mail.host && config.mail.user && config.mail.pass)) throw new Error('Почта не настроена: SMTP_HOST, SMTP_USER, SMTP_PASS')
}
