import { useEffect, useState } from 'react'
import { Coachmark, type CoachTarget } from '../ui'
import { useApp } from '../store/app'

interface Def { title: string; text: string; placement: 'above' | 'below'; radius: number }

const DEFS: Record<string, Def> = {
  outfit: { title: 'Здесь собираются образы', text: 'Выбери повод и нажми Собрать образ. Погоду подставлю сам', placement: 'above', radius: 999 },
  wardrobe: { title: 'Добавляй вещи здесь', text: 'Сфоткай вещь, фон уберу сам. Или выбери шаблон, это без лимита', placement: 'above', radius: 999 },
  favorites: { title: 'Твой первый образ здесь', text: 'Нажми, чтобы открыть, переименовать или доработать в конструкторе', placement: 'below', radius: 24 },
  profile: { title: 'Здесь видно, сколько осталось', text: 'Образы обновляются в понедельник. Ниже настроишь утреннее напоминание', placement: 'below', radius: 32 },
}

/** Коучмарк «с затемнением»: по одному на таб, при первом входе. Цель находится по `data-coach="<таб>"` */
export function CoachHost({ tab }: { tab: string }) {
  const seen = useApp((s) => s.seen)
  const markSeen = useApp((s) => s.markSeen)
  const key = `coach-${tab}`
  const [target, setTarget] = useState<CoachTarget | null>(null)
  const def = DEFS[tab]
  const firstOutfit = tab === 'outfit' && seen.firstOutfit

  useEffect(() => {
    setTarget(null)
    if (!def || seen[key]) return
    // подождать, пока экран отрисуется (скелетон гардероба, анимации входа)
    const t = setTimeout(() => {
      const app = document.querySelector('.app') as HTMLElement | null
      const el = document.querySelector(`[data-coach="${tab}"]`) as HTMLElement | null
      if (!app || !el) return
      const a = app.getBoundingClientRect()
      const r = el.getBoundingClientRect()
      const k = a.width / app.offsetWidth
      setTarget({ x: (r.left - a.left) / k, y: (r.top - a.top) / k, width: r.width / k, height: r.height / k, radius: def.radius })
    }, 1000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  if (!def || seen[key] || !target) return null
  return (
    <Coachmark
      target={target} placement={def.placement}
      title={firstOutfit ? 'Твой первый образ' : def.title}
      text={firstOutfit ? 'Повод уже выбран по анкете. Нажми Собрать образ, погоду подставлю сам' : def.text}
      onOk={() => markSeen(key)}
    />
  )
}
