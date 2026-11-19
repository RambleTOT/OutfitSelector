// Расшифровка бэкапа: node backup-decrypt.mjs atelier-20261120-0400.tar.gz.enc восстановленное.tar.gz
// Пароль берётся из BACKUP_PASSPHRASE или спрашивается скрыто. Дальше: tar -xzf восстановленное.tar.gz -C /opt/atelier/server/data (docs/OPS.md)
import { readFileSync, writeFileSync } from 'node:fs'
import { decrypt } from './backup.mjs'

const ask = (q) => new Promise((resolve, reject) => {
  if (!process.stdin.isTTY) return reject(new Error('Задай пароль в BACKUP_PASSPHRASE или запусти в терминале'))
  process.stdout.write(q)
  const stdin = process.stdin
  let s = ''
  stdin.setRawMode(true); stdin.resume(); stdin.setEncoding('utf8')
  const onData = (ch) => {
    for (const c of ch) {
      if (c === '\r' || c === '\n') { stdin.setRawMode(false); stdin.pause(); stdin.off('data', onData); process.stdout.write('\n'); return resolve(s) }
      if (c === '\u0003') process.exit(130)
      if (c === '\u007f' || c === '\b') s = s.slice(0, -1)
      else s += c
    }
  }
  stdin.on('data', onData)
})

const [src, dst] = process.argv.slice(2)
if (!src || !dst) { console.error('Использование: node backup-decrypt.mjs файл.enc выход.tar.gz'); process.exit(1) }
try {
  const pass = process.env.BACKUP_PASSPHRASE || (await ask('Пароль шифрования (ввод не отображается): '))
  writeFileSync(dst, decrypt(readFileSync(src), pass), { mode: 0o600 })
  console.log(`Готово: ${dst}`)
} catch (e) { console.error('Ошибка:', e.message); process.exit(1) }
