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
