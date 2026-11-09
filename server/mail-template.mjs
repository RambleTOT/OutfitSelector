// Письмо с кодом входа. Таблицы и инлайн-стили, чтобы выглядело одинаково в Gmail, Яндексе, mail.ru и Apple Mail.
// Цвета из src/styles/tokens.css (в письме переменных нет). Картинок нет: многие клиенты их блокируют.
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

export function codeMessage(code, { site = '' } = {}) {
  const c = esc(code)
  const digits = [...c].map(d => `<td class="digit" style="width:52px;height:64px;background:#F4F4F6;border-radius:14px;font:700 32px/64px Georgia,'Times New Roman',serif;color:#111114;text-align:center">${d}</td>`).join('<td style="width:8px"></td>')
  const subject = `Код для входа в Atelier: ${code}`
  const text = `Твой код для входа в Atelier: ${code}\n\nОн действует 10 минут.\nЕсли ты не запрашивал код, просто игнорируй это письмо: без кода в аккаунт не войти.\n\nAtelier, AI-стилист из твоего гардероба${site ? `\n${site}` : ''}`
  const html = `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark">
<title>${esc(subject)}</title>
<style>
@media (prefers-color-scheme: dark){
  .page{background:#0F0F11!important}.card{background:#1B1B1F!important}
  .ink{color:#F5F2EE!important}.muted{color:#A8A29C!important}
  .digit{background:#232328!important;color:#F5F2EE!important}
}
@media (max-width:480px){.card{padding:28px 20px!important}.digit{width:44px!important;font-size:28px!important}}
</style></head>
<body class="page" style="margin:0;padding:0;background:#F4F4F6;-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">Код действует 10 минут. Никому его не говори.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="page" style="background:#F4F4F6"><tr><td align="center" style="padding:32px 16px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px">
    <tr><td align="center" style="padding:0 0 20px;font:600 28px/1 Georgia,'Times New Roman',serif;letter-spacing:.5px;color:#BF3D37">Atelier</td></tr>
    <tr><td class="card" style="background:#FFFFFF;border-radius:24px;padding:36px 32px;font:16px/1.55 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:#111114">
      <p class="ink" style="margin:0 0 6px;font-size:20px;font-weight:700;color:#111114">Твой код для входа</p>
      <p class="muted" style="margin:0 0 24px;color:#6B6B74">Введи его в приложении, чтобы войти.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto 24px"><tr>${digits}</tr></table>
      <p class="muted" style="margin:0 0 4px;text-align:center;color:#6B6B74;font-size:14px">Действует 10 минут</p>
      <div style="height:1px;background:#ECECF0;margin:24px 0 18px"></div>
      <p class="muted" style="margin:0;color:#6B6B74;font-size:14px">Не запрашивал код? Просто игнорируй письмо: без кода в аккаунт не войти. Никому не сообщай код, мы его никогда не спрашиваем.</p>
    </td></tr>
    <tr><td align="center" class="muted" style="padding:20px 8px 0;font:12px/1.5 system-ui,-apple-system,'Segoe UI',sans-serif;color:#6B6B74">Atelier, AI-стилист из твоего гардероба${site ? `<br><a href="${esc(site)}" style="color:#BF3D37;text-decoration:none">${esc(site.replace(/^https?:\/\//, ''))}</a>` : ''}</td></tr>
  </table>
</td></tr></table>
</body></html>`
  return { subject, text, html }
}
