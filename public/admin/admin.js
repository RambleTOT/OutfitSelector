// Админка Atelier: одна страница без сборки. Вход: код из письма + код из приложения-аутентификатора, сессия в HttpOnly-cookie (JS её не видит).
const $ = (s, r = document) => r.querySelector(s)
const root = $('#root')
let me = '' // почта вошедшего админа

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const PLAN = { free: 'Free', sub: 'Подписка', plus: 'Подписка+' }
const rub = (n) => `${Math.round(n || 0).toLocaleString('ru-RU')} ₽`
const fDate = (t) => (t ? new Date(t).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }) : '—')
const fShort = (t) => (t ? new Date(t).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) : '—')
const fTime = (t) => (t ? new Date(t).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—')
const ago = (t) => {
  const m = Math.round((Date.now() - t) / 60000)
  if (m < 1) return 'только что'
  if (m < 60) return `${m} мин назад`
  const h = Math.round(m / 60)
  if (h < 24) return `${h} ч назад`
  const d = Math.round(h / 24)
  return d < 30 ? `${d} дн назад` : fShort(t)
}

const IC = {
  grid: '<rect x="4" y="4" width="6.5" height="6.5" rx="2"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="2"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="2"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="2"/>',
  users: '<circle cx="9" cy="8.5" r="3.5"/><path d="M2.5 19c.6-3.3 3.1-5 6.5-5s5.9 1.7 6.5 5"/><path d="M16 5.2a3.4 3.4 0 0 1 0 6.6M18 14.3c2 .5 3.2 2 3.5 4.7"/>',
  card: '<rect x="3" y="5.5" width="18" height="13" rx="3"/><path d="M3 10h18M7 15h3"/>',
  chat: '<path d="M4 12a8 8 0 1 1 3.4 6.5L4 20l1.2-3.6A7.9 7.9 0 0 1 4 12z"/><path d="M9 11.5h6M9 14.5h4"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/>',
  out: '<path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M10 8l-4 4 4 4M6 12h10"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6"/>',
  cal: '<rect x="4" y="5.5" width="16" height="14.5" rx="3"/><path d="M8 3.5v4M16 3.5v4M4 10h16"/>',
  trash: '<path d="M5 7h14M10 7V4.5h4V7M7 7l.8 12.5h8.4L17 7"/>',
  crown: '<path d="M4 18h16l1.5-10-5 3.5L12 5 7.5 11.5l-5-3.5z"/>',
  wallet: '<path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3"/><rect x="3.5" y="8" width="17" height="11.5" rx="3"/><circle cx="16.5" cy="13.8" r="1.1"/>',
  send: '<path d="M20 4 10 14M20 4l-6 16-4-6-6-4z"/>',
  shield: '<path d="M12 3.5 5 6v5.5c0 4.2 2.8 7.4 7 9 4.2-1.6 7-4.8 7-9V6z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
}
const icon = (n) => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${IC[n]}</svg>`

function toast(text, err) {
  const el = document.createElement('div')
  el.className = 'toast' + (err ? ' err' : '')
  el.textContent = text
  $('#toasts').append(el)
  setTimeout(() => el.remove(), 3200)
}

class AuthError extends Error {}
const HDR = { 'X-Requested-With': 'atelier-admin' }
async function api(path, method = 'GET', body) {
  const r = await fetch('/api/admin' + path, { method, credentials: 'same-origin', headers: { ...HDR, ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined })
  const j = await r.json().catch(() => ({}))
  if (r.status === 401) throw new AuthError()
  if (r.status === 429) throw new Error('Слишком много запросов, подожди минуту')
  if (!r.ok) throw new Error(ERR[j.error] ?? j.error ?? `Ошибка ${r.status}`)
  return j
}
// шаги входа: ответы 401 и 429 здесь не значат «сессия закончилась», это ошибки ввода
async function authApi(step, body) {
  const r = await fetch('/api/admin/auth/' + step, { method: 'POST', credentials: 'same-origin', headers: { ...HDR, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  return { status: r.status, body: await r.json().catch(() => ({})) }
}
const ERR = { no_plan: 'У человека нет платного тарифа', bad_days: 'Срок: от 1 до 3650 дней', bad_plan: 'Выбери тариф', cancel_failed: 'Платёжная система не отменила автопродление', no_user: 'Пользователь не найден', forbidden: 'Запрос отклонён, обнови страницу' }

// ---------- вход
const lg = { step: 'email', email: '', ticket: '', secret: '', otpauth: '', recovery: [], useRecovery: false, error: '' }
const loginCard = (title, sub, body) => `<div class="login"><form class="card" id="lf" autocomplete="off">
  <div class="brand"><img src="../favicon.svg" alt="" /><b>Atelier</b></div>
  <div><h1 style="font:800 24px/30px var(--font-ui)">${title}</h1>${sub ? `<p class="muted" style="margin-top:6px">${sub}</p>` : ''}</div>
  ${body}<div class="err" id="er" role="alert">${esc(lg.error)}</div></form></div>`
const codeInput = (id, ph, mode = 'numeric') => `<input type="text" id="${id}" inputmode="${mode}" autocomplete="one-time-code" placeholder="${ph}" aria-label="${ph}" maxlength="${mode === 'numeric' ? 6 : 9}" class="codefield" required />`
const submitBtn = (t) => `<button class="btn primary" style="justify-content:center;height:52px" type="submit">${t}</button>`

function renderLogin(msg = '') {
  if (msg) lg.error = msg
  const st = lg.step
  if (st === 'email') {
    root.innerHTML = loginCard('Вход в админку', 'Введи свою почту, пришлём код', `<input type="email" id="em" placeholder="name@mail.ru" autocomplete="username" aria-label="Почта" value="${esc(lg.email)}" required />${submitBtn('Получить код')}`)
    $('#em').focus()
  } else if (st === 'code') {
    root.innerHTML = loginCard('Код из письма', `Отправили на ${esc(lg.email)}. Если письма нет, проверь спам. Код действует 5 минут`, `${codeInput('cd', '123456')}${submitBtn('Дальше')}<button type="button" class="btn" data-lg="back" style="justify-content:center">Другая почта</button>`)
    $('#cd').focus()
  } else if (st === 'totp') {
    root.innerHTML = loginCard('Код из приложения', lg.useRecovery ? 'Введи один из резервных кодов, он сработает один раз' : 'Открой приложение-аутентификатор и введи шестизначный код для Atelier', `${lg.useRecovery ? codeInput('cd', 'xxxx-xxxx', 'text') : codeInput('cd', '123456')}${submitBtn('Войти')}<button type="button" class="btn" data-lg="recovery" style="justify-content:center">${lg.useRecovery ? 'Ввести код из приложения' : 'Нет доступа к приложению'}</button>`)
    $('#cd').focus()
  } else if (st === 'setup') {
    root.innerHTML = loginCard('Настрой аутентификатор', 'Двухфакторный вход обязателен. Отсканируй код в приложении (Google Authenticator, Яндекс Ключ, 1Password), затем введи код из него',
      `<div class="qr" id="qr" aria-label="QR-код для приложения-аутентификатора"></div><p class="muted" style="font-size:12px;text-align:center">Нет камеры? Введи ключ вручную:<br><code class="key">${esc(lg.secret.match(/.{1,4}/g).join(' '))}</code></p>${codeInput('cd', '123456')}${submitBtn('Проверить и включить')}`)
    try { const q = window.qrcode(0, 'M'); q.addData(lg.otpauth); q.make(); $('#qr').innerHTML = q.createSvgTag({ cellSize: 5, margin: 2, scalable: true }) } catch { $('#qr').textContent = 'Не удалось нарисовать QR, введи ключ вручную' }
    $('#cd').focus()
  } else if (st === 'recovery') {
    root.innerHTML = loginCard('Резервные коды', 'Если потеряешь телефон, зайдёшь по одному из них. Каждый работает один раз. Сохрани их сейчас, больше мы их не покажем', `<pre class="rec" id="rc">${lg.recovery.map(esc).join('\n')}</pre><div class="acts"><button type="button" class="btn" data-lg="copy">Скопировать</button></div><label class="chk"><input type="checkbox" id="ok" /> Я сохранил(а) коды в надёжном месте</label><button class="btn primary" style="justify-content:center;height:52px" type="submit" id="go" disabled>Открыть админку</button>`)
    $('#ok').onchange = (e) => { $('#go').disabled = !e.target.checked }
  }
  const f = $('#lf'); if (f) f.onsubmit = onLogin
}

async function onLogin(e) {
  e.preventDefault()
  lg.error = ''
  const st = lg.step
  const val = ($('#cd')?.value ?? '').trim()
  const fail = (t) => { lg.error = t; $('#er').textContent = t }
  const btn = e.submitter; if (btn) btn.disabled = true
  try {
    if (st === 'email') {
      lg.email = $('#em').value.trim().toLowerCase()
      const r = await authApi('request', { email: lg.email })
      if (r.status !== 200) return fail(r.status === 429 ? 'Слишком много попыток, подожди немного' : 'Проверь почту')
      lg.step = 'code'; return renderLogin()
    }
    if (st === 'code') {
      const r = await authApi('verify', { email: lg.email, code: val })
      if (r.status === 401) return fail('Неверный код или он устарел')
      if (r.status !== 200) return fail('Слишком много попыток, подожди немного')
      Object.assign(lg, { step: r.body.step, ticket: r.body.ticket, secret: r.body.secret ?? '', otpauth: r.body.otpauth ?? '', useRecovery: false })
      return renderLogin()
    }
    if (st === 'totp' || st === 'setup') {
      const r = await authApi('totp', { ticket: lg.ticket, code: val })
      if (r.status === 429) return fail('Слишком много неверных кодов, вход закрыт на 15 минут')
      if (r.status === 401 && r.body.error === 'ticket_invalid') { lg.step = 'email'; return renderLogin('Время вышло, начни заново') }
      if (r.status !== 200) return fail('Неверный код')
      me = r.body.email
      if (r.body.recovery) { lg.recovery = r.body.recovery; lg.step = 'recovery'; return renderLogin() }
      return start()
    }
    if (st === 'recovery') return start()
  } catch { fail('Нет связи с сервером') } finally { if (btn) btn.disabled = false }
}
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-lg]')
  if (!t) return
  if (t.dataset.lg === 'back') { lg.step = 'email'; lg.error = ''; renderLogin() }
  if (t.dataset.lg === 'recovery') { lg.useRecovery = !lg.useRecovery; lg.error = ''; renderLogin() }
  if (t.dataset.lg === 'copy') navigator.clipboard?.writeText(lg.recovery.join('\n')).then(() => toast('Скопировано'), () => toast('Выдели и скопируй вручную', true))
})
async function logout(msg, all) {
  try { await fetch(all ? '/api/admin/logout-all' : '/api/admin/auth/logout', { method: 'POST', credentials: 'same-origin', headers: HDR }) } catch { /* всё равно выходим */ }
  me = ''; Object.assign(lg, { step: 'email', ticket: '', secret: '', recovery: [], error: '' })
  renderLogin(typeof msg === 'string' ? msg : '')
}

// ---------- оболочка
let page = 'home'
let counts = { support: 0 }
const NAV = [['home', 'grid', 'Обзор'], ['users', 'users', 'Пользователи'], ['payments', 'card', 'Платежи'], ['support', 'chat', 'Поддержка'], ['admins', 'shield', 'Админы']]

function shell(title, sub, body, actions = '') {
  const nav = NAV.map(([id, ic, name]) => `<a class="nav ${page === id ? 'on' : ''}" href="#/${id === 'home' ? '' : id}">${icon(ic)}<span class="t">${name}</span>${id === 'support' && counts.support ? `<span class="badge hot">${counts.support}</span>` : ''}</a>`).join('')
  root.innerHTML = `<div class="shell">
    <aside class="side">
      <div class="brand"><img src="../favicon.svg" alt="" /><b>Atelier</b></div>
      <div class="group">Меню</div>${nav}
      <div class="spacer"></div>
      <div class="me"><b>Админка</b><span>${esc(me)}</span><button data-act="logout">${icon('out')}Выйти</button><button data-act="logout-all" class="ghost">Выйти на всех устройствах</button></div>
    </aside>
    <main class="main">
      <div class="top"><h1>${title}${sub ? ` <span>${sub}</span>` : ''}</h1><div class="grow"></div>${actions}</div>
      ${body}
    </main></div>`
}

// ---------- обзор
let ov = null
let chartKey = 'signupsByDay'
const CHARTS = { signupsByDay: 'Регистрации', outfitsByDay: 'Образы', photosByDay: 'Фото' }

function planTag(r) {
  if (r.plan === 'free') return r.ended ? '<span class="tag warn">Закончился</span>' : '<span class="tag">Free</span>'
  return `<span class="tag ${r.plan}">${r.plan === 'plus' ? icon('crown').replace('class="i"', 'class="i" style="width:14px;height:14px"') : ''}${PLAN[r.plan]}</span>`
}
const until = (r) => (r.plan === 'free' ? '—' : `${fDate(r.endsAt)}${r.cancelled ? ' · без продления' : ''}`)
const av = (r) => `<div class="av">${esc((r.name || r.email)[0] ?? '?')}</div>`

function chart() {
  const data = ov[chartKey]
  const max = Math.max(...data.map((x) => x.n))
  const top = Math.max(4, Math.ceil(max / 4) * 4)
  const peak = max > 0 ? data.findIndex((x) => x.n === max) : -1
  const lines = [4, 3, 2, 1, 0].map((k) => `<i><b>${Math.round((top / 4) * k)}</b></i>`).join('')
  const bars = data.map((x, i) => `<div class="bar ${i === peak ? 'on' : ''}" style="--h:${(x.n / top) * 100}%" title="${fShort(Date.parse(x.d))}: ${x.n}"><span class="tip">${fShort(Date.parse(x.d))} · ${x.n}</span><i style="height:${(x.n / top) * 100}%"></i></div>`).join('')
  const axis = data.map((x, i) => `<span>${i % 5 === 4 || i === 0 ? new Date(x.d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'numeric' }) : ''}</span>`).join('')
  const sum = data.reduce((s, x) => s + x.n, 0)
  return `<div class="bars"><div class="grid-lines">${lines}</div>${bars}</div><div class="axis">${axis}</div><p class="muted" style="margin-top:12px">За 30 дней: <b style="color:var(--ink-primary)">${sum}</b></p>`
}

function funnelHtml(f) {
  const base = f.find((x) => x.key === 'reg').n || 1
  return `<div class="funnel">${f.map((x) => {
    const w = x.key === 'visits' || x.key === 'start' ? Math.min(100, (x.n / Math.max(f[0].n, 1)) * 100) : (x.n / base) * 100
    const pct = x.key === 'visits' || x.key === 'start' ? '' : `${Math.round((x.n / base) * 100)}%`
    return `<div class="step"><span class="lbl">${x.label}${x.note ? `<small>${x.note}</small>` : ''}</span><span class="val num">${x.n}${pct ? ` <span class="pct">${pct}</span>` : ''}</span><div class="track"><i style="width:${w}%"></i></div></div>`
  }).join('')}</div>`
}

async function renderHome() {
  ov = await api('/overview')
  counts.support = ov.totals.supportOpen
  const t = ov.totals, m = ov.money
  const kpi = (ic, title, big, chips, acc) => `<div class="card kpi"><div style="display:flex;align-items:center;gap:12px"><div class="ico ${acc ? 'acc' : ''}">${icon(ic)}</div><h2>${title}</h2></div><div class="big num">${big}</div><div style="display:flex;gap:6px;flex-wrap:wrap">${chips}</div></div>`
  const body = `
  <div class="grid kpis">
    ${kpi('users', 'Пользователи', t.users, `<span class="delta up">+${t.today} сегодня</span><span class="delta">+${t.week} за 7 дней</span><span class="delta">${t.activeWeek} активны</span>`)}
    ${kpi('crown', 'С тарифом', `${t.paid} <small>из ${t.users}</small>`, `<span class="delta hot">Подписка ${t.sub}</span><span class="delta hot">Подписка+ ${t.plus}</span>${t.endingSoon ? `<span class="delta warn">Срок на исходе: ${t.endingSoon}</span>` : ''}`, true)}
    ${kpi('wallet', 'Выручка за месяц', rub(m.month), `<span class="delta">всего ${rub(m.total)}</span><span class="delta">${m.count} оплат</span>${m.testCount ? `<span class="delta warn">${m.testCount} тестовых</span>` : ''}`)}
    ${kpi('chat', 'Ждут ответа', t.supportOpen, `<a class="delta ${t.supportOpen ? 'hot' : ''}" href="#/support" style="text-decoration:none">${t.supportOpen ? 'Открыть чат' : 'Всё отвечено'}</a>`)}
  </div>
  <div class="grid row2">
    <div class="card"><div class="card-head"><div class="ico acc">${icon('grid')}</div><div class="grow"><h2 id="ct">${CHARTS[chartKey]}</h2><p class="sub">По дням, московское время</p></div>
      <div class="seg" role="tablist">${Object.entries(CHARTS).map(([k, n]) => `<button class="${k === chartKey ? 'on' : ''}" data-chart="${k}">${n}</button>`).join('')}</div></div>
      <div id="chart">${chart()}</div></div>
    <div class="card"><div class="card-head"><div class="grow"><h2>Путь пользователя</h2><p class="sub">Где люди отваливаются</p></div></div>${funnelHtml(ov.funnel)}</div>
  </div>
  <div class="grid row3">
    <div class="card"><div class="card-head"><div class="grow"><h2>Новые пользователи</h2><p class="sub">Последние регистрации</p></div><a class="pill btn" href="#/users" style="text-decoration:none">Все</a></div>
      ${ov.recentUsers.length ? `<div class="tbl-wrap"><table style="min-width:0"><tbody>${ov.recentUsers.map((r) => `<tr class="click" data-open="${r.id}"><td><div class="who">${av(r)}<div><b>${esc(r.email)}</b><span>${ago(r.createdAt)}</span></div></div></td><td style="text-align:right">${planTag(r)}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">Пока никого</div>'}</div>
    <div class="card"><div class="card-head"><div class="grow"><h2>Платежи</h2><p class="sub">Последние оплаты</p></div><a class="pill btn" href="#/payments" style="text-decoration:none">Все</a></div>
      ${ov.recentPayments.length ? `<div class="tbl-wrap"><table style="min-width:0"><tbody>${ov.recentPayments.map((p) => `<tr><td><div class="who"><div class="av">₽</div><div><b>${esc(p.email)}</b><span>${fTime(p.at)}</span></div></div></td><td>${payTag(p)}</td><td class="num" style="text-align:right;font-weight:700">${rub(p.amount)}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">Оплат ещё не было</div>'}</div>
  </div>
  <div class="card"><div class="card-head"><div class="grow"><h2>Журнал действий</h2><p class="sub">Что менялось вручную через админку</p></div></div>
    ${ov.log.length ? `<div class="list">${ov.log.map((l) => `<div class="logrow"><small>${fTime(l.at)}</small><span><b>${esc(l.email)}</b> · ${esc(l.text)}${l.by ? ` <span class="muted">· ${esc(l.by)}</span>` : ''}</span></div>`).join('')}</div>` : '<div class="empty">Пока пусто</div>'}</div>`
  shell('Привет, команда', '', body, `<span class="pill">${icon('cal')}${new Date().toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}</span><button class="pill dark" data-act="reload">${icon('refresh')}Обновить</button>`)
}
const payTag = (p) => (p.status === 'refunded' ? '<span class="tag bad">Возврат</span>' : p.test ? '<span class="tag warn">Тест</span>' : '<span class="tag ok"><i class="dot"></i>Оплачен</span>')

// ---------- пользователи
const F = { q: '', plan: '', sort: 'new' }
const FILTERS = [['', 'Все'], ['paid', 'С тарифом'], ['free', 'Free'], ['sub', 'Подписка'], ['plus', 'Подписка+'], ['ended', 'Закончился'], ['waiting', 'Ждут ответа']]
async function renderUsers(keepFocus) {
  const { total, users } = await api(`/users?q=${encodeURIComponent(F.q)}&plan=${F.plan}&sort=${F.sort}`)
  const rows = users.map((r) => `<tr class="click" data-open="${r.id}">
    <td><div class="who">${av(r)}<div><b>${esc(r.email)}</b><span>${esc(r.name) || 'без имени'}${r.waiting ? ' · ждёт ответа' : ''}</span></div></div></td>
    <td>${planTag(r)}</td><td>${until(r)}</td><td class="num">${r.items}</td><td class="num">${r.outfitsWeek}</td><td>${fDate(r.createdAt)}</td><td>${ago(r.activeAt)}</td></tr>`).join('')
  const body = `<div class="card">
    <div class="tools"><div class="search">${icon('search')}<input id="q" type="search" placeholder="Почта или имя" value="${esc(F.q)}" aria-label="Поиск" /></div>
      <select class="sel" id="sort" aria-label="Сортировка">${[['new', 'Сначала новые'], ['active', 'По активности'], ['items', 'По вещам'], ['ends', 'По сроку тарифа']].map(([v, n]) => `<option value="${v}" ${F.sort === v ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
    <div class="chips" style="margin-bottom:18px">${FILTERS.map(([v, n]) => `<button class="chip ${F.plan === v ? 'on' : ''}" data-filter="${v}">${n}</button>`).join('')}</div>
    ${users.length ? `<div class="tbl-wrap"><table><thead><tr><th>Пользователь</th><th>Тариф</th><th>Действует до</th><th>Вещи</th><th>Образы за неделю</th><th>Регистрация</th><th>Активность</th></tr></thead><tbody>${rows}</tbody></table></div>` : '<div class="empty">Никого не нашли</div>'}</div>`
  shell('Пользователи', `<span>${total}</span>`, body)
  if (keepFocus) { const q = $('#q'); q.focus(); q.setSelectionRange(q.value.length, q.value.length) }
}

// ---------- платежи
async function renderPayments() {
  const { payments } = await api('/payments')
  const body = `<div class="card">${payments.length ? `<div class="tbl-wrap"><table><thead><tr><th>Дата</th><th>Пользователь</th><th>Тариф</th><th>Сумма</th><th>Статус</th><th>Касса</th></tr></thead><tbody>${payments.map((p) => `<tr><td>${fTime(p.at)}</td><td>${esc(p.email)}</td><td>${PLAN[p.plan] ?? esc(p.plan)}</td><td class="num" style="font-weight:700">${rub(p.amount)}</td><td>${payTag(p)}</td><td>${esc(p.provider ?? 'CloudPayments')}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">Оплат ещё не было. Тариф можно выдать вручную в карточке пользователя</div>'}</div>`
  shell('Платежи', `<span>${payments.length}</span>`, body)
}

// ---------- поддержка
let sel = ''
async function renderSupport() {
  const { threads } = await api('/support')
  counts.support = threads.filter((t) => t.waiting).length
  if (!sel && threads[0]) sel = threads[0].email
  let msgs = []
  if (sel) { try { msgs = (await api(`/support?email=${encodeURIComponent(sel)}`)).messages } catch { sel = '' } }
  const list = threads.length ? threads.map((t) => `<button class="thread ${t.email === sel ? 'on' : ''}" data-thread="${esc(t.email)}"><b>${t.waiting ? '● ' : ''}${esc(t.email)}</b><span>${esc(t.last.text)}</span><span>${ago(t.last.at)} · ${PLAN[t.plan] ?? t.plan}</span></button>`).join('') : '<div class="empty">Сообщений нет</div>'
  const conv = sel ? `<div class="msgs" id="msgs">${msgs.map((m) => `<div class="msg ${m.from}">${esc(m.text)}<small>${m.from === 'team' ? 'Мы' : 'Он'} · ${fTime(m.at)}</small></div>`).join('')}</div>
    <div class="reply"><textarea id="rt" placeholder="Ответ, человек увидит его в приложении" rows="1"></textarea><button class="btn primary" data-act="reply">${icon('send')}Отправить</button></div>`
    : '<div class="empty">Выбери переписку слева</div>'
  shell('Поддержка', '', `<div class="card"><div class="chat"><div class="threads">${list}</div><div>${conv}</div></div></div>`)
  const m = $('#msgs'); if (m) m.scrollTop = m.scrollHeight
}

// ---------- админы
async function renderAdmins() {
  const { admins } = await api('/admins')
  const rows = admins.map((a) => `<tr><td><div class="who"><div class="av">${esc(a.email[0])}</div><div><b>${esc(a.email)}</b><span>${a.email === me ? 'это ты' : ''}</span></div></div></td>
    <td>${a.locked ? '<span class="tag bad">Заблокирован</span>' : a.totp ? '<span class="tag ok"><i class="dot"></i>Включена</span>' : '<span class="tag warn">Не настроена</span>'}</td>
    <td class="num">${a.totp ? a.recoveryLeft : '—'}</td><td>${a.lastLoginAt ? fTime(a.lastLoginAt) : 'не входил'}${a.lastIp ? ` <span class="muted">· ${esc(a.lastIp)}</span>` : ''}</td><td class="num">${a.sessions}</td></tr>`).join('')
  shell('Админы', `<span>${admins.length}</span>`, `<div class="card"><div class="card-head"><div class="ico acc">${icon('shield')}</div><div class="grow"><h2>Кто может входить</h2><p class="sub">Список задаётся на сервере (ADMIN_EMAILS). Вход: код из письма и код из приложения-аутентификатора</p></div></div>
    <div class="tbl-wrap"><table><thead><tr><th>Админ</th><th>Двухфакторный вход</th><th>Резервных кодов</th><th>Последний вход</th><th>Сессий</th></tr></thead><tbody>${rows}</tbody></table></div>
    <p class="muted" style="margin-top:16px">Сессия закрывается через 30 минут без действий и через 8 часов в любом случае. О каждом входе и блокировке приходит сообщение в Telegram.</p></div>`)
}

// ---------- карточка пользователя
let drawer = null
async function openUser(id) {
  const d = await api(`/users/${id}`)
  drawer = d
  closeDrawer(true)
  const cats = Object.entries(d.itemCounts).map(([k, n]) => `${({ top: 'верх', bottom: 'низ', dress: 'платья', outer: 'верхняя', shoes: 'обувь', bag: 'сумки', accessory: 'аксессуары' })[k] ?? k} ${n}`).join(', ') || 'нет'
  const el = document.createElement('div')
  el.id = 'dw'
  el.innerHTML = `<div class="scrim" data-act="close"></div>
  <aside class="drawer" role="dialog" aria-label="Карточка пользователя">
    <div class="head">${av(d)}<div style="min-width:0"><h2>${esc(d.email)}</h2><p class="muted">${esc(d.name) || 'без имени'} · ${d.id.slice(0, 8)}</p></div><button class="x" data-act="close" aria-label="Закрыть">${icon('x')}</button></div>
    <div class="sect"><h3>Тариф</h3>
      <dl class="kv"><dt>Сейчас</dt><dd>${planTag(d)}</dd><dt>Действует до</dt><dd>${d.plan === 'free' ? '—' : fDate(d.endsAt)}</dd><dt>Автопродление</dt><dd>${d.plan === 'free' ? '—' : d.cancelled ? 'Выключено' : 'Включено'}</dd>${d.manual ? '<dt>Источник</dt><dd>Выдан вручную</dd>' : ''}${d.ended ? '<dt>Прошлый тариф</dt><dd>' + (PLAN[d.paidPlan] ?? d.paidPlan) + ' закончился</dd>' : ''}</dl>
      <div class="form"><select id="gp" aria-label="Тариф"><option value="sub">Подписка</option><option value="plus">Подписка+</option></select><input id="gd" type="number" min="1" max="3650" value="30" aria-label="Дней" /><span class="muted">дней</span><button class="btn primary" data-act="grant">Выдать</button></div>
      <div class="acts"><button class="btn" data-extend="7" ${d.plan === 'free' ? 'disabled' : ''}>+7 дней</button><button class="btn" data-extend="30" ${d.plan === 'free' ? 'disabled' : ''}>+30 дней</button><button class="btn" data-act="cancel" ${d.plan === 'free' || d.cancelled ? 'disabled' : ''}>Отключить автопродление</button><button class="btn danger" data-act="revoke" ${d.plan === 'free' ? 'disabled' : ''}>Снять тариф</button></div></div>
    <div class="sect"><h3>Активность</h3><dl class="kv"><dt>Регистрация</dt><dd>${fTime(d.createdAt)}</dd><dt>Последняя синхронизация</dt><dd>${ago(d.activeAt)}</dd><dt>Согласие на обработку данных</dt><dd>${d.consent ? `${fTime(d.consent.at)} · редакция ${esc(d.consent.version)}` : 'нет записи'}</dd><dt>Анкета и первые вещи</dt><dd>${d.onboarded ? 'Пройдены' : 'Не завершены'}</dd><dt>Вещей в гардеробе</dt><dd>${d.items}</dd><dt>По категориям</dt><dd>${cats}</dd><dt>Сохранённых образов</dt><dd>${d.saved}</dd><dt>Образов за неделю</dt><dd>${d.usage.outfitsWeek}</dd><dt>Образов за месяц</dt><dd>${d.usage.outfitsMonth}</dd><dt>Фото распознано</dt><dd>${d.usage.photosTotal}</dd></dl>
      <div class="acts"><button class="btn" data-act="reset">Обнулить лимиты</button></div></div>
    <div class="sect"><h3>Платежи</h3>${d.payments.length ? `<div class="hist">${d.payments.map((p) => `<div><span>${fShort(p.at)} · ${PLAN[p.plan] ?? p.plan} ${payTag(p)}</span><b class="num">${rub(p.amount)}</b></div>`).join('')}</div>` : '<p class="muted">Оплат не было</p>'}</div>
    <div class="sect"><h3>Поддержка</h3>${d.messages.length ? `<div class="hist">${d.messages.slice(-3).map((m) => `<div><span>${m.from === 'team' ? 'Мы: ' : ''}${esc(m.text.slice(0, 90))}</span><small>${ago(m.at)}</small></div>`).join('')}</div><div class="acts"><a class="btn" href="#/support" data-sup="${esc(d.email)}" style="text-decoration:none">Открыть чат</a></div>` : '<p class="muted">Переписки нет</p>'}</div>
    ${d.log.length ? `<div class="sect"><h3>Что менялось вручную</h3><div class="hist">${d.log.map((l) => `<div><span>${esc(l.text)}${l.by ? ` <span class="muted">· ${esc(l.by)}</span>` : ''}</span><small>${fTime(l.at)}</small></div>`).join('')}</div></div>` : ''}
    <div class="sect"><h3>Опасная зона</h3><p class="muted">Удалит аккаунт, гардероб и фото. Вернуть нельзя</p><div class="acts"><button class="btn danger" data-act="delete">${icon('trash')}Удалить аккаунт</button></div></div>
  </aside>`
  document.body.append(el)
}
function closeDrawer(silent) { $('#dw')?.remove(); if (!silent) drawer = null }

async function sub(body, ok) {
  try { drawer = await api(`/users/${drawer.id}/sub`, 'POST', body); toast(ok); await openUser(drawer.id); refresh() } catch (e) { handle(e) }
}

// ---------- события
document.addEventListener('click', async (e) => {
  const t = e.target.closest('[data-act],[data-open],[data-filter],[data-chart],[data-thread],[data-extend],[data-sup]')
  if (!t) return
  try {
    if (t.dataset.sup) { sel = t.dataset.sup; closeDrawer(); return }
    if (t.dataset.open) return openUser(t.dataset.open)
    if (t.dataset.filter !== undefined) { F.plan = t.dataset.filter; return renderUsers() }
    if (t.dataset.chart) { chartKey = t.dataset.chart; $('#chart').innerHTML = chart(); $('#ct').textContent = CHARTS[chartKey]; document.querySelectorAll('[data-chart]').forEach((b) => b.classList.toggle('on', b.dataset.chart === chartKey)); return }
    if (t.dataset.thread) { sel = t.dataset.thread; return renderSupport() }
    if (t.dataset.extend) return sub({ action: 'extend', days: Number(t.dataset.extend) }, `Продлено на ${t.dataset.extend} дн.`)
    const a = t.dataset.act
    if (a === 'logout') return logout()
    if (a === 'logout-all') return logout('', true)
    if (a === 'reload') { await refresh(); return toast('Обновлено') }
    if (a === 'close') return closeDrawer()
    if (a === 'grant') return sub({ action: 'grant', plan: $('#gp').value, days: Number($('#gd').value) }, 'Тариф выдан')
    if (a === 'cancel') return sub({ action: 'cancel' }, 'Автопродление отключено')
    if (a === 'revoke') { if (confirm(`Снять тариф у ${drawer.email}? Человек сразу вернётся на Free`)) return sub({ action: 'revoke' }, 'Тариф снят'); return }
    if (a === 'reset') { if (confirm('Обнулить счётчики образов и фото?')) return sub({ action: 'reset_usage' }, 'Лимиты обнулены'); return }
    if (a === 'delete') {
      if (!confirm(`Удалить аккаунт ${drawer.email} вместе с гардеробом и фото? Это нельзя отменить`)) return
      await api(`/users/${drawer.id}`, 'DELETE'); closeDrawer(); toast('Аккаунт удалён'); return refresh()
    }
    if (a === 'reply') {
      const text = $('#rt').value.trim()
      if (!text) return
      await api('/support', 'POST', { email: sel, text }); toast('Отправлено'); return renderSupport()
    }
  } catch (er) { handle(er) }
})
document.addEventListener('input', (e) => {
  if (e.target.id === 'q') { F.q = e.target.value; clearTimeout(window.__qt); window.__qt = setTimeout(() => renderUsers(true).catch(handle), 250) }
})
document.addEventListener('change', (e) => { if (e.target.id === 'sort') { F.sort = e.target.value; renderUsers().catch(handle) } })
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer() })

function handle(e) {
  if (e instanceof AuthError) { me = ''; lg.step = 'email'; return renderLogin('Сессия закончилась, войди снова') }
  console.error(e)
  toast(e.message || 'Не получилось', true)
}

async function refresh() {
  const r = location.hash.replace(/^#\/?/, '').split('?')[0] || 'home'
  page = ['users', 'payments', 'support', 'admins'].includes(r) ? r : 'home'
  try {
    if (page === 'users') await renderUsers()
    else if (page === 'payments') await renderPayments()
    else if (page === 'support') await renderSupport()
    else if (page === 'admins') await renderAdmins()
    else await renderHome()
  } catch (e) { handle(e) }
}

async function start() {
  window.onhashchange = () => { closeDrawer(); refresh() }
  if (!me) {
    try { me = (await api('/auth/me')).email } catch { return renderLogin() }
  }
  refresh()
  clearInterval(window.__poll)
  // раз в минуту обновляем счётчик «Ждут ответа» в меню, остальное по запросу
  window.__poll = setInterval(async () => { try { const o = await api('/overview'); const n = o.totals.supportOpen; if (n !== counts.support) { counts.support = n; if (!$('#dw') && page === 'home') refresh() } } catch (e) { if (e instanceof AuthError) handle(e) } }, 60000)
}

start()
