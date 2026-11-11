import test from 'node:test'
import assert from 'node:assert/strict'

// systemd съедает кавычки в OPENAI_EXTRA из .env: {"reasoning_effort":"none"} превращается в {reasoning_effort:none}
const load = async (env) => {
  const keep = { ...process.env }
  for (const k of ['OPENAI_EXTRA', 'OPENAI_REASONING_EFFORT']) delete process.env[k]
  Object.assign(process.env, env)
  const m = await import(`../config.mjs?${Math.random()}`)
  process.env = keep
  return m.config.ai.openai?.extra ?? m.config.ai.extra
}

test('OPENAI_EXTRA: обычный JSON', async () => {
  assert.deepEqual(await load({ OPENAI_EXTRA: '{"reasoning_effort":"none"}' }), { reasoning_effort: 'none' })
})
test('OPENAI_EXTRA: JSON без кавычек после systemd', async () => {
  assert.deepEqual(await load({ OPENAI_EXTRA: '{reasoning_effort:none}' }), { reasoning_effort: 'none' })
})
test('OPENAI_REASONING_EFFORT работает отдельно', async () => {
  assert.deepEqual(await load({ OPENAI_REASONING_EFFORT: 'none' }), { reasoning_effort: 'none' })
})
