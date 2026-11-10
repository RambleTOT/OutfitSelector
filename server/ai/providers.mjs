import { randomUUID } from 'node:crypto'
import { config } from '../config.mjs'
import { fetchJson } from './prompt.mjs'

/**
 * Три провайдера с одним интерфейсом chat(system, user) -> строка.
 * Переключается переменной AI_PROVIDER, остальной код не меняется.
 */

// GigaChat (Сбер). Токен живёт 30 минут. Сертификат Минцифры: на сервере нужен NODE_EXTRA_CA_CERTS (см. docs/AI.md)
let gcToken = { v: '', exp: 0 }
async function gigachat(system, user) {
  const c = config.ai.gigachat
  if (!c.key) throw new Error('GIGACHAT_AUTH_KEY не задан')
  if (gcToken.exp < Date.now() + 60000) {
    const body = new URLSearchParams({ scope: c.scope })
    const j = await fetchJson('https://ngw.devices.sberbank.ru:9443/api/v2/oauth', {
      method: 'POST', body,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json', RqUID: randomUUID(), Authorization: `Basic ${c.key}` },
    }, config.ai.timeoutMs)
    gcToken = { v: j.access_token, exp: j.expires_at }
  }
  const j = await fetchJson('https://gigachat.devices.sberbank.ru/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${gcToken.v}` },
    body: JSON.stringify({ model: c.model, temperature: 0.7, max_tokens: 400, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] }),
  }, config.ai.timeoutMs)
  return j.choices?.[0]?.message?.content ?? ''
}

// YandexGPT через Yandex AI Studio (Foundation Models API)
async function yandex(system, user) {
  const c = config.ai.yandex
  if (!c.key || !c.folder) throw new Error('YANDEX_API_KEY и YANDEX_FOLDER_ID не заданы')
  const j = await fetchJson('https://llm.api.cloud.yandex.net/foundationModels/v1/completion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Api-Key ${c.key}`, 'x-folder-id': c.folder },
    body: JSON.stringify({
      modelUri: `gpt://${c.folder}/${c.model}`,
      completionOptions: { stream: false, temperature: 0.6, maxTokens: '400' },
      messages: [{ role: 'system', text: system }, { role: 'user', text: user }],
    }),
  }, config.ai.timeoutMs)
  return j.result?.alternatives?.[0]?.message?.text ?? ''
}

// Любой OpenAI-совместимый API: OpenRouter, DeepSeek, Groq, Together, локальный Ollama (http://localhost:11434/v1)
async function openai(system, user) {
  const c = config.ai.openai
  if (!c.model) throw new Error('OPENAI_MODEL не задан')
  const j = await fetchJson(`${c.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(c.key ? { Authorization: `Bearer ${c.key}` } : {}) },
    body: JSON.stringify({ model: c.model, temperature: c.temperature, max_tokens: c.maxTokens, ...c.extra, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] }),
  }, config.ai.timeoutMs)
  return j.choices?.[0]?.message?.content ?? ''
}

export const PROVIDERS = { gigachat, yandex, openai }
export const aiEnabled = () => config.ai.provider in PROVIDERS
export const chat = (system, user) => PROVIDERS[config.ai.provider](system, user)
