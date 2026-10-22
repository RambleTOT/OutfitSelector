// Приёмник на localhost для данных из страницы браузера (там нельзя fetch из-за CSP, поэтому GET-картинки кусками).
// node tools/receiver.mjs <файл> [порт]   GET /?i=<номер>&t=<всего>&d=<кусок>
import http from 'node:http'
import { writeFileSync } from 'node:fs'
const file = process.argv[2]
const parts = new Map()
http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Content-Type', 'image/gif')
  if (u.searchParams.has('d')) {
    parts.set(Number(u.searchParams.get('i')), u.searchParams.get('d'))
    const total = Number(u.searchParams.get('t'))
    if (parts.size === total) {
      const data = [...parts.keys()].sort((a, b) => a - b).map((k) => parts.get(k)).join('')
      writeFileSync(file, Buffer.from(data, 'base64').toString('utf8'))
      console.log('saved', data.length)
      parts.clear()
    }
  }
  res.end(Buffer.from('R0lGODlhAQABAAAAACw=', 'base64'))
}).listen(Number(process.argv[3] ?? 4190), '127.0.0.1')
