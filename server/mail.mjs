import { config } from './config.mjs'
import { codeMessage } from './mail-template.mjs'

let transport
export async function sendCode(email, code, kind = 'user') {
  if (config.mail.mode === 'log') { console.log(`[mail] код${kind === 'admin' ? ' админки' : ''} для ${email}: ${code}`); return }
  if (!transport) {
    const { default: nodemailer } = await import('nodemailer')
    transport = nodemailer.createTransport({ host: config.mail.host, port: config.mail.port, secure: config.mail.port === 465, auth: { user: config.mail.user, pass: config.mail.pass } })
  }
  const m = kind === 'admin' ? codeMessage(code, { site: config.siteUrl || '', admin: true, minutes: 5 }) : codeMessage(code, { site: config.siteUrl || '' })
  await transport.sendMail({ from: config.mail.from, replyTo: process.env.MAIL_REPLY_TO || undefined, to: email, subject: m.subject, text: m.text, html: m.html })
}
