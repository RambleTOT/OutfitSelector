import { useEffect, useState } from 'react'
import { useApp } from '../store/app'

export function useMedia(query: string): boolean {
  const [m, setM] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const h = () => setM(mq.matches)
    mq.addEventListener('change', h)
    h()
    return () => mq.removeEventListener('change', h)
  }, [query])
  return m
}

/** Масштаб рамки, чтобы она помещалась по высоте на ноутбуке */
export function useFrameScale(frameHeight = 868, margin = 32) {
  const [s, setS] = useState(1)
  useEffect(() => {
    const f = () => setS(Math.max(0.55, Math.min(1, (window.innerHeight - margin) / frameHeight)))
    f()
    window.addEventListener('resize', f)
    return () => window.removeEventListener('resize', f)
  }, [frameHeight, margin])
  return s
}

/** Тема: Как в системе / Светлая / Тёмная → data-theme на <html> */
export function useTheme() {
  const pref = useApp((s) => s.theme)
  const sysDark = useMedia('(prefers-color-scheme: dark)')
  const resolved = pref === 'system' ? (sysDark ? 'dark' : 'light') : pref
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolved)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'dark' ? '#0F0F11' : '#F4F4F6')
  }, [resolved])
  return resolved
}

/** Настоящее состояние сети: событие offline/online включает оффлайн-режим приложения (кнопка демо делает то же вручную) */
export function useRealNetwork() {
  useEffect(() => {
    const set = (offline: boolean) => {
      const was = useApp.getState().offline
      if (was === offline) return
      useApp.setState({ offline })
      if (!offline) window.dispatchEvent(new Event('atelier:online'))
    }
    if (!navigator.onLine) set(true)
    const off = () => set(true)
    const on = () => set(false)
    window.addEventListener('offline', off)
    window.addEventListener('online', on)
    return () => { window.removeEventListener('offline', off); window.removeEventListener('online', on) }
  }, [])
}

/**
 * iPhone Safari при открытой клавиатуре сдвигает всю страницу вверх (логотип уезжает под часы).
 * Пока клавиатура открыта, подгоняем высоту экрана под видимую область и возвращаем экран на место (--vvh, --vvt в .phone).
 * Без клавиатуры (адресная строка, поворот) ничего не меняем
 */
export function useKeyboardViewport(enabled: boolean) {
  useEffect(() => {
    const vv = window.visualViewport
    if (!enabled || !vv) return
    const root = document.documentElement
    const update = () => {
      const open = window.innerHeight - vv.height > 120 // клавиатура
      if (open) {
        root.style.setProperty('--vvh', `${Math.round(vv.height)}px`)
        root.style.setProperty('--vvt', `${Math.round(vv.offsetTop)}px`)
        root.setAttribute('data-kb', '')
      } else {
        root.style.removeProperty('--vvh')
        root.style.removeProperty('--vvt')
        root.removeAttribute('data-kb')
      }
    }
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    update()
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
      root.style.removeProperty('--vvh')
      root.style.removeProperty('--vvt')
      root.removeAttribute('data-kb')
    }
  }, [enabled])
}
