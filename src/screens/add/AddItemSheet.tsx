import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnswerCard, BottomSheet, Button } from '../../ui'
import { useLimits } from '../../store/app'
import { useUi } from '../../store/ui'
import { PaywallSheet } from '../paywall/PaywallSheet'

/** ADD-01 AddItemSheet: сфоткать или найти в каталоге. Монтируется один раз в AppShell, открывается из любого экрана.
 *  Когда фото закончились (Состояния#st5), «Сфоткать» недоступно, а ниже предложение подписки (PAY-01) */
export function AddItemSheet() {
  const navigate = useNavigate()
  const { open } = useUi((s) => s.addSheet)
  const close = useUi((s) => s.closeAddSheet)
  const lim = useLimits()
  const [pay, setPay] = useState(false)
  const noPhotos = lim.photosLeft === 0

  const photoSub = lim.photosLimit === null
    ? 'Без лимита. Неудачные фото не считаются'
    : lim.photosPeriod === 'total'
      ? noPhotos ? `${lim.photosLimit} из ${lim.photosLimit} фото во Free использованы. Удаление место не вернёт` : `Осталось ${lim.photosLeft} из ${lim.photosLimit} фото. Неудачные не считаются, удаление место не вернёт`
      : noPhotos ? `${lim.photosLimit} из ${lim.photosLimit} фото в этом месяце использованы` : `Осталось ${lim.photosLeft} из ${lim.photosLimit} фото в этом месяце`

  const go = (to: string) => { close(); navigate(to) }
  const upsell = lim.plan === 'free'
    ? { title: '30 фото в месяц с подпиской', text: '299 ₽ в месяц, отменить можно в любой момент' }
    : { title: 'Фото без лимита с Подпиской+', text: '599 ₽ в месяц, отменить можно в любой момент' }

  return (
    <>
      <BottomSheet open={open} onClose={close} title="Как добавим вещь" subtitle={noPhotos ? undefined : 'Вещь появится в гардеробе через пару секунд'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <AnswerCard title="Сфоткать" subtitle={photoSub} icon="camera" disabled={noPhotos} onClick={() => go('/add/photo')} />
          <AnswerCard title="Найти в каталоге" subtitle="Красивые готовые фото: черная футболка, белые кеды · без лимита" icon="magnifying-glass" onClick={() => go('/add/catalog')} />
        </div>
        {noPhotos && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 16, borderRadius: 'var(--radius-tile)', background: 'var(--accent-soft)' }}>
              <span className="t-callout" style={{ fontWeight: 700 }}>{upsell.title}</span>
              <span className="t-callout" style={{ fontWeight: 400 }}>{upsell.text}</span>
            </div>
            <Button full onClick={() => { close(); setTimeout(() => setPay(true), 260) }}>Больше фото</Button>
          </>
        )}
      </BottomSheet>
      <PaywallSheet
        open={pay} onClose={() => setPay(false)}
        title="Фото закончились" subtitle="Из каталога можно добавлять без лимита"
      />
    </>
  )
}
