import { Navigate, useNavigate } from 'react-router-dom'
import { Button, CtaPlate, IconButton, OutfitCard } from '../../ui'
import { useApp } from '../../store/app'
import { useOutfitFlow } from '../../store/outfit'
import { toast } from '../../store/ui'
import { OCCASION_FOR } from '../../lib/format'
import type { Item } from '../../data/types'

/** OUT-07 ShareStory: картинка с логотипом Atelier. Выкладывание имитируется */
export function ShareStory() {
  const navigate = useNavigate()
  const items = useApp((s) => s.items)
  const result = useOutfitFlow((s) => s.result)
  if (!result) return <Navigate to="/outfit" replace />
  const outfit = result.itemIds.map((id) => items.find((i) => i.id === id)).filter((i): i is Item => !!i)
  const date = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })

  const share = async () => {
    try {
      if (navigator.share) { await navigator.share({ title: 'Atelier', text: OCCASION_FOR[result.occasion] + '. Собран из моих вещей' }); return }
    } catch { /* пользователь закрыл системное окно */ }
    toast('Откроется выбор приложения', 'neutral')
  }

  return (
    <>
      <div className="screen screen--push" style={{ alignItems: 'center', gap: 20, paddingBottom: 190 }}>
        <div className="nav-row" style={{ alignSelf: 'stretch' }}>
          <IconButton icon="x" label="Закрыть" variant="solid" onClick={() => navigate(-1)} />
          <span className="t-headline">Поделиться</span>
          <span style={{ width: 44 }} />
        </div>
        <div style={{
          width: 312, maxWidth: '100%', borderRadius: 32, background: 'var(--gradient-sunset-soft), var(--bg-elevated)',
          boxShadow: '0 20px 50px rgba(17,17,20,.14)', padding: '28px 20px 24px', display: 'flex', flexDirection: 'column', gap: 18,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span className="t-serif" style={{ fontSize: 30, lineHeight: 1 }}>Atelier</span>
            <span className="t-caption muted">{date}</span>
          </div>
          <OutfitCard items={outfit} aspect="1 / 1.3" style={{ padding: 10 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="t-title2">{OCCASION_FOR[result.occasion]}</span>
            <span className="t-callout muted">Собран из моих вещей</span>
          </div>
        </div>
      </div>
      <CtaPlate>
        <Button full icon="instagram-logo" onClick={share}>Выложить в сторис</Button>
        <Button variant="text" full icon="download-simple" onClick={() => toast('Картинка сохранена')}>Сохранить картинку</Button>
      </CtaPlate>
    </>
  )
}
