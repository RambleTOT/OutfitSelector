import { config } from './config.mjs'
import { codeMessage } from './mail-template.mjs'

let transport
export async function sendCode(email, code) {
  if (config.mail.mode === 'log') { console.log(`[mail] код для ${email}: ${code}`); return }
  if (!transport) {
    const { default: nodemailer } = await import('nodemailer')
    transport = nodemailer.createTransport({ host: config.mail.host, port: config.mail.port, secure: config.mail.port === 465, auth: { user: config.mail.user, pass: config.mail.pass } })
  }
  const m = codeMessage(code, { site: config.siteUrl || '' })
  await transport.sendMail({ from: config.mail.from, to: email, subject: m.subject, text: m.text, html: m.html })
}
