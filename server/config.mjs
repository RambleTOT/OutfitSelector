import { randomBytes } from 'node:crypto'

const e = process.env
const dev = e.NODE_ENV !== 'production'

export const config = {
  dev,
  port: Number(e.PORT ?? 8787),
  corsOrigin: e.CORS_ORIGIN ?? '',
  // в разработке секрет случайный на каждый запуск: токены живут до перезапуска. В проде секрет обязателен
  tokenSecret: e.TOKEN_SECRET || (dev ? randomBytes(32).toString('hex') : ''),
  dataDir: e.DATA_DIR ?? './data',
  staticDir: e.STATIC_DIR ?? '',
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
    openai: { baseUrl: (e.OPENAI_BASE_URL ?? 'https://openrouter.ai/api/v1').replace(/\/$/, ''), key: e.OPENAI_API_KEY, model: e.OPENAI_MODEL, visionModel: e.OPENAI_VISION_MODEL },
    cutoutUrl: e.CUTOUT_URL ?? '',
  },
  pay: {
    publicId: e.CP_PUBLIC_ID ?? '',
    apiSecret: e.CP_API_SECRET ?? '',
    prices: { sub: Number(e.PRICE_SUB ?? 300), plus: Number(e.PRICE_SUBPLUS ?? 600) },
    taxation: Number(e.CP_TAXATION ?? 1),
    vat: e.CP_VAT === undefined || e.CP_VAT === '' ? null : Number(e.CP_VAT),
  },
}

export function assertConfig() {
  if (!config.tokenSecret) throw new Error('TOKEN_SECRET не задан (openssl rand -hex 32)')
  if (!config.dev && config.mail.mode === 'smtp' && !(config.mail.host && config.mail.user && config.mail.pass)) throw new Error('Почта не настроена: SMTP_HOST, SMTP_USER, SMTP_PASS')
}
