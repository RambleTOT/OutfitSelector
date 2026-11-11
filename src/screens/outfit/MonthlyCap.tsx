import { openSupport } from '../../lib/support'
import { useNavigate } from 'react-router-dom'
import { Button, CtaPlate, IconButton, PlanBadge } from '../../ui'
import { firstOfNextMonthLabel, MONTHLY_CAP } from '../../store/limits'

/** OUT-09 MonthlyCapReached: потолок безлимита 300 образов в месяц на Подписке+ */
export function MonthlyCap({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  return (
    <>
      <div className="screen screen--fade" style={{ gap: 16, paddingBottom: 200 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}><IconButton icon="x" label="Закрыть" variant="solid" onClick={onClose} /></div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, textAlign: 'center' }}>
          <PlanBadge plan="plus" />
          <span style={{ font: '800 var(--type-hero-size)/1 var(--font-ui)', letterSpacing: '-0.03em' }}>{MONTHLY_CAP}</span>
          <h2 className="t-title1" style={{ textWrap: 'pretty' }}>Ты собрал {MONTHLY_CAP} образов в этом месяце</h2>
          <span className="t-body muted" style={{ textWrap: 'pretty' }}>
            Новые будут доступны с {firstOfNextMonthLabel()}. Конструктор и сохранённые образы работают как обычно
          </span>
        </div>
      </div>
      <CtaPlate>
        <Button full icon="hand-pointing" onClick={() => navigate('/constructor')}>Собрать самому</Button>
        <Button variant="text" full icon="chat-circle" onClick={() => openSupport('Месячный лимит образов')}>Написать в поддержку</Button>
      </CtaPlate>
    </>
  )
}
