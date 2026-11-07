// Подставляет настоящий домен и контакты вместо заглушек: node tools/set-domain.mjs your-domain.ru @telegram_support support@your-domain.ru
import { readFileSync, writeFileSync } from 'node:fs'
const [domain, tg = 'atelier_support', mail] = process.argv.slice(2)
if (!domain) { console.error('Использование: node tools/set-domain.mjs your-domain.ru [telegram_без_@] [почта_поддержки]'); process.exit(1) }
const support = mail ?? `support@${domain}`
for (const f of ['index.html', 'public/robots.txt', 'public/sitemap.xml']) {
  const s = readFileSync(f, 'utf8').replaceAll('atelier.example', domain).replace('t.me/atelier_support', `t.me/${tg.replace(/^@/, '')}`).replaceAll(`support@${domain}`, support)
  writeFileSync(f, s)
  console.log('обновлён', f)
}
console.log('Реквизиты ИП в подвале лендинга (index.html, блок foot__req) заполни вручную')
