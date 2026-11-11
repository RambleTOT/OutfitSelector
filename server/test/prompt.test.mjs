import test from 'node:test'
import assert from 'node:assert/strict'
import { parseOutfit, SYSTEM } from '../ai/prompt.mjs'

const items = [
  { id: 'a', category: 'top', title: 'Футболка' },
  { id: 'b', category: 'bottom', title: 'Джинсы' },
]
const reply = (explanation) => JSON.stringify({ ids: ['a', 'b'], name: 'Образ', explanation })

test('самокритика в пояснении убирается, обычное пояснение остаётся', () => {
  assert.equal(parseOutfit(reply('Тотал-лук выглядит целостно, но футболка слишком легка для 2°C'), items).explanation, '')
  assert.equal(parseOutfit(reply('Для такой погоды не хватает куртки'), items).explanation, '')
  assert.equal(parseOutfit(reply('Платье с пальто не даёт замёрзнуть'), items).explanation, 'Платье с пальто не даёт замёрзнуть')
  assert.match(SYSTEM, /не критикуй/)
})
