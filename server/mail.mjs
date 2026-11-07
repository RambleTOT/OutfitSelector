import { config } from './config.mjs'

let transport
export async function sendCode(email, code) {
  if (config.mail.mode === 'log') { console.log(`[mail] код для ${email}: ${code}`); return }
  if (!transport) {
    const { default: nodemailer } = await import('nodemailer')
    transport = nodemailer.createTransport({ host: config.mail.host, port: config.mail.port, secure: config.mail.port === 465, auth: { user: config.mail.user, pass: config.mail.pass } })
  }
  await transport.sendMail({
    from: config.mail.from, to: email, subject: `Код для входа в Atelier: ${code}`,
    text: `Твой код для входа в Atelier: ${code}\n\nОн действует 10 минут. Если ты не запрашивал код, просто игнорируй письмо.`,
    html: `<div style="font:16px/1.5 system-ui,sans-serif;color:#111114"><p>Твой код для входа в Atelier:</p><p style="font-size:36px;font-weight:800;letter-spacing:8px;margin:8px 0">${code}</p><p style="color:#6B6B74">Он действует 10 минут. Если ты не запрашивал код, просто игнорируй письмо.</p></div>`,
  })
}
