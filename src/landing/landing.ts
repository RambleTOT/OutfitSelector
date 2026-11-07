import '../styles/fonts.css'
import '../styles/tokens.css'
import './landing.css'
import { initMetrika, track } from '../lib/analytics'
import { isNative } from '../lib/config'

// внутри APK для RuStore лендинг не нужен: сразу в приложение
if (isNative()) location.replace('app/')

// тема по системной
const mq = window.matchMedia('(prefers-color-scheme: dark)')
const applyTheme = () => document.documentElement.setAttribute('data-theme', mq.matches ? 'dark' : 'light')
applyTheme()
mq.addEventListener?.('change', applyTheme)

initMetrika()
track('landing_view', { ref: document.referrer ? new URL(document.referrer).hostname : '' })

// все кнопки «открыть» ведут в приложение, а мы считаем, какая сработала
document.querySelectorAll<HTMLAnchorElement>('[data-cta]').forEach((a) => {
  a.addEventListener('click', () => track('landing_cta', { place: a.dataset.cta }))
})

// липкая кнопка: после первого экрана и пока не виден финальный блок
const sticky = document.getElementById('sticky')
const hero = document.querySelector('.hero')
const final = document.querySelector('.final')
if (sticky && hero && final && 'IntersectionObserver' in window) {
  let heroGone = false
  let finalSeen = false
  const upd = () => {
    const on = heroGone && !finalSeen
    sticky.classList.toggle('is-on', on)
    sticky.setAttribute('aria-hidden', String(!on))
    sticky.querySelector('a')?.setAttribute('tabindex', on ? '0' : '-1')
  }
  new IntersectionObserver(([e]) => { heroGone = !e.isIntersecting; upd() }).observe(hero)
  new IntersectionObserver(([e]) => { finalSeen = e.isIntersecting; upd() }).observe(final)
}

// появление блоков при прокрутке (без JS всё видно сразу)
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
  document.documentElement.classList.add('js-reveal')
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } }), { threshold: 0.12 })
  document.querySelectorAll('.know li, .steps > li, .feat__list li, .plan, .faq details, .install .card').forEach((el) => io.observe(el))
}
