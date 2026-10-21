import { useLocation, useNavigate } from 'react-router-dom'
import { AnswerCard, BottomSheet } from '../../ui'
import { useLimits } from '../../store/app'
import { useUi } from '../../store/ui'

/** ADD-01 AddItemSheet: сфоткать или выбрать из шаблона. Монтируется один раз в AppShell, открывается из любого экрана */
export function AddItemSheet() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { open } = useUi((s) => s.addSheet)
  const close = useUi((s) => s.closeAddSheet)
  const lim = useLimits()
  void pathname

  const photoSub = lim.photosLimit === null
    ? 'Без лимита. Неудачные фото не считаются'
    : lim.photosPeriod === 'total'
      ? lim.photosLeft ? `Осталось ${lim.photosLeft} из ${lim.photosLimit} фото. Неудачные не считаются, удаление место не вернёт` : `${lim.photosLimit} из ${lim.photosLimit} фото использованы. Шаблоном без лимита`
      : lim.photosLeft ? `Осталось ${lim.photosLeft} из ${lim.photosLimit} фото в этом месяце` : `${lim.photosLimit} из ${lim.photosLimit} фото в этом месяце использованы. Шаблоном без лимита`

  const go = (to: string) => { close(); navigate(to) }

  return (
    <BottomSheet open={open} onClose={close} title="Как добавим вещь" subtitle="Вещь появится в гардеробе через пару секунд">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <AnswerCard title="Сфоткать" subtitle={photoSub} icon="camera" onClick={() => go('/add/photo')} />
        <AnswerCard title="Выбрать из шаблона" subtitle="Категория, тип и цвет · без лимита" icon="shapes" onClick={() => go('/add/template')} />
      </div>
    </BottomSheet>
  )
}
