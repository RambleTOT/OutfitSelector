import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { isMobileDevice, isStandalone } from '../../lib/platform'
import { DEMO } from '../../lib/config'
import { useApp, useLimits } from '../../store/app'
import { toast } from '../../store/ui'
import type { SavedOutfit } from '../../data/types'
import { PaywallSheet } from '../paywall/PaywallSheet'
import { FavoritesFullSheet } from './FavoritesFullSheet'
import { RegisterSheet } from '../onboarding/RegisterSheet'

type Draft = Omit<SavedOutfit, 'id' | 'createdAt'>

/**
 * Сохранение в избранное для Образа и Конструктора.
 * Есть место: сохраняем. Заполнено (FAV-02): шторка «какой образ заменить». Больше лимита после окончания подписки (FAV-05): новые не сохраняются, предлагаем подписку.
 * Возвращает `save(draft, onSaved)` и `sheets`, которые надо отрисовать на экране.
 */
export function useSaveOutfit(): { save: (d: Draft, onSaved?: (id: string) => void) => void; sheets: ReactNode } {
  const saveOutfit = useApp((s) => s.saveOutfit)
  const replaceSaved = useApp((s) => s.replaceSaved)
  const lim = useLimits()
  const navigate = useNavigate()
  const markSeen = useApp((s) => s.markSeen)
  const [pending, setPending] = useState<{ draft: Draft; done?: (id: string) => void } | null>(null)
  const [full, setFull] = useState(false)
  const [pay, setPay] = useState<'full' | 'over' | null>(null)
  const [reg, setReg] = useState(false)

  const save = (draft: Draft, done?: (id: string) => void) => {
    const r = saveOutfit(draft)
    if (r === 'saved') {
      done?.(useApp.getState().saved[0].id)
      toast('Образ сохранён', 'success', { icon: 'heart' })
      const st = useApp.getState()
      // гостю после первого сохранения предлагаем войти по почте, чтобы не потерять гардероб
      if (st.via === 'guest' && !st.seen['register-offered']) {
        markSeen('register-offered')
        setTimeout(() => setReg(true), 1200)
      } else if (!st.seen['install-offered'] && !isStandalone() && (DEMO || (isMobileDevice() && !st.gateDone))) {
        // не ставил иконку на старте: после первого сохранения предлагаем ещё раз (ON-10…ON-12), затем уведомления
        markSeen('install-offered')
        setTimeout(() => navigate('/install', { state: { flow: 'first' } }), 1500)
      }
    } else {
      setPending({ draft, done })
      if (r === 'full') setFull(true)
      else setPay('over')
    }
  }

  const sheets = (
    <>
      <RegisterSheet open={reg} onClose={() => setReg(false)} />
      <FavoritesFullSheet
        open={full} onClose={() => setFull(false)}
        buyLabel={lim.plan === 'free' ? '10 мест за 300 ₽' : 'Без лимита за 600 ₽'}
        onBuy={() => { setFull(false); setTimeout(() => setPay('full'), 260) }}
        onReplace={(old) => {
          if (!pending) return
          replaceSaved(old.id, pending.draft)
          pending.done?.(useApp.getState().saved[0].id)
          setFull(false)
          toast('Образ сохранён', 'success', { icon: 'heart' })
        }}
      />
      <PaywallSheet
        open={pay !== null} onClose={() => setPay(null)}
        title={pay === 'over' ? 'Избранное переполнено' : 'Больше мест в избранном'}
        subtitle={pay === 'over' ? `Новые образы не сохранятся, пока их больше ${lim.favLimit}. Удали лишние или продли подписку` : 'Образы останутся на месте, ничего не удаляется'}
        onPaid={() => {
          // после оплаты лимит снят: сохраняем отложенный образ
          const p = pending
          if (p) { const r = saveOutfit(p.draft); if (r === 'saved') { p.done?.(useApp.getState().saved[0].id); setPending(null) } }
        }}
      />
    </>
  )
  return { save, sheets }
}
