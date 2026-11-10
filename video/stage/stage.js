/* Сцена ролика: телефон с приложением + текст и инфографика слева. Управляется из tools/record-video.mjs через window.stage */
const $ = (s) => document.querySelector(s)
const stageEl = $('#stage')
const content = $('#content')
const num = (n) => `<b>${n}</b>`

const I = (n, s = 32, f = false) => window.icon(n, s, f)
const chip = (ic, text, delay) => `<span class="chip" style="animation-delay:${delay}s">${I(ic, 26)}${text}</span>`

const SCENES = {
  wardrobe: {
    phone: 'right', n: 1, eyebrow: 'Гардероб',
    title: 'Все твои вещи <em>в одном месте</em>',
    sub: 'Фото, цвет, материал, теплота и формальность. Ищи по описанию и фильтруй',
    info: () => `
      <div class="stats">
        <div class="stat"><b data-count="24">0</b><span>вещи</span></div>
        <div class="stat"><b data-count="7">0</b><span>категорий</span></div>
        <div class="stat"><b data-count="3">0</b><span>фильтра</span></div>
      </div>
      <div class="chips">${chip('magnifying-glass', 'Поиск по описанию', 0.9)}${chip('drop', 'Цвет', 1.05)}${chip('cloud-sun', 'Сезон', 1.2)}${chip('briefcase', 'Формальность', 1.35)}${chip('drop', 'Недоступна сейчас', 1.5)}</div>`,
  },
  photo: {
    phone: 'right', n: 2, eyebrow: 'Добавь вещь',
    title: 'Сфоткай, остальное <em>сделаем сами</em>',
    sub: 'Вещь попадает в гардероб за пару секунд. Описание можно поправить',
    info: () => `
      <div class="ba">
        <div class="ph before"><img src="assets/before-i08.jpg" alt=""><i class="scan"></i><span>Фото</span></div>
        <div class="arrow">${I('sparkle', 40, true)}</div>
        <div class="ph after"><img src="assets/after-i08.png" alt=""><span>Вещь в гардеробе</span></div>
      </div>
      <div class="steps">
        <div class="step" style="animation-delay:.7s"><span class="ic" style="animation-delay:1.1s">${I('check-circle', 28, true)}</span>Убираем фон</div>
        <div class="step" style="animation-delay:1.1s"><span class="ic" style="animation-delay:1.6s">${I('check-circle', 28, true)}</span>Выравниваем свет и цвет</div>
        <div class="step" style="animation-delay:1.5s"><span class="ic" style="animation-delay:2.1s">${I('check-circle', 28, true)}</span>Заполняем описание</div>
        <div class="step" style="animation-delay:1.9s"><span class="ic" style="animation-delay:2.6s">${I('check-circle', 28, true)}</span>Шаблоном можно без лимита</div>
      </div>`,
  },
  outfit: {
    phone: 'left', n: 3, eyebrow: 'Образ',
    title: 'Образ под <em>погоду и повод</em>',
    sub: 'Собираем только из того, что уже есть в шкафу',
    info: () => `
      <div class="eq">
        <div class="t" style="animation-delay:.5s">${I('cloud-sun', 44)}<div><b>+8°</b><small>Москва, облачно</small></div></div>
        <span class="op" style="animation-delay:.8s">+</span>
        <div class="t" style="animation-delay:1s">${I('coat-hanger', 44)}<div><b>24 вещи</b><small>без недоступных</small></div></div>
        <span class="op" style="animation-delay:1.3s">+</span>
        <div class="t" style="animation-delay:1.5s">${I('briefcase', 44)}<div><b>Работа</b><small>повод и пожелание</small></div></div>
        <span class="op" style="animation-delay:1.8s">=</span>
        <div class="t res" style="animation-delay:2s">${I('sparkle', 44, true)}<div><b>Образ</b><small>и объяснение, почему</small></div></div>
      </div>
      <div class="rules">
        <div class="rule" style="animation-delay:2.6s">${I('arrows-clockwise', 40)}<b>Другой вариант</b><span class="tag minus">минус 1 образ</span></div>
        <div class="rule" style="animation-delay:2.85s">${I('swap', 40)}<b>Заменить вещь</b><span class="tag free">бесплатно</span></div>
        <div class="rule" style="animation-delay:3.1s">${I('check-circle', 40)}<b>Не получилось</b><span class="tag free">лимит не списан</span></div>
      </div>`,
  },
  favorites: {
    phone: 'right', n: 4, eyebrow: 'Избранное',
    title: 'Лучшие образы <em>всегда под рукой</em>',
    sub: 'Сохраняй, называй и дорабатывай. Заполнено? Заменим самый старый',
    info: () => {
      const hearts = (n, d) => Array.from({ length: n }, (_, i) => `<i style="animation-delay:${d + i * 0.07}s">${I('heart', 28, true)}</i>`).join('')
      return `<div class="slots">
        <div class="slot-row"><div class="plan"><span class="n">Free</span><span class="p">3 места</span></div><div class="hearts">${hearts(3, 0.6)}</div></div>
        <div class="slot-row"><div class="plan sub"><span class="n">Подписка</span><span class="p">10 мест</span></div><div class="hearts">${hearts(10, 1.0)}</div></div>
        <div class="slot-row"><div class="plan"><span class="n">Подписка+</span><span class="p">без лимита</span></div><div class="hearts"><i class="inf" style="animation-delay:1.9s">${I('heart', 28, true)}&nbsp;∞</i></div></div>
      </div>`
    },
  },
  constructor: {
    phone: 'left', n: 5, eyebrow: 'Конструктор',
    title: 'Собери образ <em>сам</em>',
    sub: 'Перетаскивай вещи на холст, масштабируй и поворачивай. Конструктор бесплатный на любом тарифе',
    info: () => `
      <div class="gest">
        <div class="gbox"><div class="gwrap"><span class="f f1"></span><img src="assets/after-i08.png" alt=""><span class="f f2"></span></div></div>
        <div class="gl">
          ${chip('hand-pointing', 'Двумя пальцами: масштаб и поворот', 0.6)}
          ${chip('stack-plus', 'Слои: вперёд и назад', 0.85)}
          ${chip('arrow-counter-clockwise', 'Отмена последнего действия', 1.1)}
          ${chip('bookmark-simple', 'Сохранение в избранное', 1.35)}
        </div>
      </div>`,
  },
  plans: {
    phone: 'right', n: 6, eyebrow: 'Тарифы',
    title: 'Понятные лимиты, <em>без сюрпризов</em>',
    sub: 'Вещи шаблоном, конструктор и все сохранённые образы остаются при любом тарифе',
    info: () => {
      const bar = (cls, w, text, d) => `<div class="bar ${cls}"><i style="--w:${w}%;animation-delay:${d}s">${text}</i></div>`
      return `<div class="card lim">
        <div class="lim-head"><div></div>
          <div class="plan"><span class="n">Free</span><span class="p">0 ₽</span></div>
          <div class="plan sub"><span class="n">Подписка</span><span class="p">299 ₽ в месяц</span></div>
          <div class="plan"><span class="n">Подписка+</span><span class="p">599 ₽ в месяц</span></div></div>
        <div class="lim-row"><div class="l">${I('sparkle', 30, true)}Образов в неделю</div>${bar('free', 33, '5', 0.6)}${bar('', 66, '10', 0.75)}${bar('inf', 100, '∞', 0.9)}</div>
        <div class="lim-row"><div class="l">${I('camera', 30, true)}Фото вещей</div>${bar('free', 12, '3', 1.1)}${bar('', 66, '30 в мес', 1.25)}${bar('inf', 100, '∞', 1.4)}</div>
        <div class="lim-row"><div class="l">${I('heart', 30, true)}Избранное</div>${bar('free', 33, '3', 1.6)}${bar('', 66, '10', 1.75)}${bar('inf', 100, '∞', 1.9)}</div>
      </div>
      <div class="note">${I('check-circle', 34, true)}Лимит образов обновляется в понедельник в 00:00 по Москве</div>`
    },
  },
}

let current = null

function countUp() {
  document.querySelectorAll('[data-count]').forEach((el) => {
    const to = Number(el.dataset.count)
    const t0 = performance.now()
    const tick = (t) => {
      const p = Math.min(1, (t - t0 - 300) / 1100)
      el.textContent = String(Math.round(to * (p < 0 ? 0 : 1 - Math.pow(1 - p, 3))))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
}

const stage = {
  /** показать сцену: двигает телефон и меняет текст с анимацией */
  go(name) {
    const s = SCENES[name]
    stageEl.classList.add('on')
    stageEl.classList.remove('phone-left', 'phone-right', 'phone-center', 'phone-hidden')
    stageEl.classList.add('phone-' + s.phone)
    content.classList.remove('in')
    content.classList.add('out')
    setTimeout(() => {
      $('#eyebrow').innerHTML = `<b>${s.n}</b>${s.eyebrow}`
      $('#title').innerHTML = s.title
      $('#sub').textContent = s.sub
      $('#info').innerHTML = s.info()
      content.classList.remove('out')
      void content.offsetWidth
      content.classList.add('in')
      countUp()
    }, 380)
    current = name
  },
  intro() { $('#intro').classList.add('show') },
  hideContent() { content.classList.remove('in'); content.classList.add('out') },
  outro() {
    stageEl.classList.add('dark')
    stageEl.classList.remove('phone-left', 'phone-center', 'phone-hidden')
    stageEl.classList.add('phone-right')
    stage.hideContent()
    $('#brand').style.opacity = 0
    $('#o1').innerHTML = I('coat-hanger', 30, true)
    $('#o2').innerHTML = I('cloud-sun', 30, true)
    $('#o3').innerHTML = I('heart', 30, true)
    $('#outro').classList.add('show')
  },
  darkApp(on) { stageEl.classList.toggle('dark-app', on) },
  tap(x, y) {
    const t = $('#tap')
    t.style.left = x + 'px'; t.style.top = y + 'px'
    t.classList.remove('go'); void t.offsetWidth; t.classList.add('go')
  },
  progress(p) { $('#progress i').style.width = (p * 100).toFixed(2) + '%' },
}
window.stage = stage
