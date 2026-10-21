import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Button, CtaPlate, EmptyState, Icon, IconButton, OutfitCard } from '../../ui'
import { useApp, useLimits } from '../../store/app'
import { useOutfitFlow } from '../../store/outfit'
import { toast, useUi } from '../../store/ui'
import { occasionById, temp } from '../../lib/format'
import type { Item } from '../../data/types'
import { PaywallSheet } from '../paywall/PaywallSheet'
import { useSaveOutfit } from '../favorites/useSaveOutfit'
import { snapshotOf } from '../../lib/outfit'
import { ReplaceItemSheet } from './ReplaceItemSheet'
import { Waiting } from './Waiting'

/** OUT-04 результат, OUT-05 без обуви, OUT-06 ошибка. Ожидание после «Другой вариант» (OUT-02) */
export function OutfitResult() {
  const phase = useOutfitFlow((s) => s.phase)
  if (phase === 'idle') return <Navigate to="/outfit" replace />
  if (phase === 'waiting') return <Waiting withTabBar={false} />
  if (phase === 'error') return <ErrorView />
  return <ResultView />
}

function ErrorView() {
  const navigate = useNavigate()
  const lim = useLimits()
  const { start, back } = useOutfitFlow()
  const left = lim.outfitsLeft === null ? 'Лимит не списан' : `Лимит не списан, у тебя всё ещё ${lim.outfitsLeft} из ${lim.outfitsLimit}`
  return (
    <>
      <div className="screen screen--push" style={{ gap: 16 }}>
        <div className="nav-row"><IconButton icon="caret-left" label="Назад" variant="solid" onClick={() => { back(); navigate('/outfit', { replace: true }) }} /></div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <EmptyState icon="cloud-warning" title="Не получилось собрать образ" text={left} />
        </div>
      </div>
      <CtaPlate>
        <Button full icon="arrows-clockwise" onClick={() => { if (start('new') === 'offline') toast('Нет интернета', 'offline') }}>Попробовать ещё</Button>
      </CtaPlate>
    </>
  )
}

function ResultView() {
  const navigate = useNavigate()
  const items = useApp((s) => s.items)
  const lim = useLimits()
  const flow = useOutfitFlow()
  const { result, liked, worn } = flow
  const { save: saveFav, sheets: favSheets } = useSaveOutfit()
  const [replace, setReplace] = useState(false)
  const [paywall, setPaywall] = useState(false)
  if (!result) return <Navigate to="/outfit" replace />

  const outfitItems = result.itemIds.map((id) => items.find((i) => i.id === id)).filter((i): i is Item => !!i)
  const occ = occasionById(result.occasion)
  const saved = flow.savedId !== null
  const unlimited = lim.outfitsLeft === null
  const missingShoes = result.missing.some((m) => m.category === 'shoes')

  const another = () => {
    const r = flow.start('another')
    if (r === 'limit') setPaywall(true)
    else if (r === 'offline') toast('Нет интернета', 'offline')
  }

  const save = () => saveFav(
    { name: occ.label, occasion: result.occasion, items: result.itemIds, snap: snapshotOf(outfitItems), explanation: result.explanation, worn },
    (id) => flow.setSaved(id),
  )

  return (
    <>
      <div className="screen screen--push" style={{ gap: 16, paddingBottom: 128 }}>
        <div className="nav-row">
          <IconButton icon="caret-left" label="Назад" variant="solid" onClick={() => { flow.back(); navigate('/outfit', { replace: true }) }} />
          <span className="t-headline">{occ.emoji} {occ.label} · {temp()}</span>
          <IconButton icon="share-network" label="Поделиться" variant="solid" onClick={() => navigate('/outfit/share')} />
        </div>
        <OutfitCard
          key={result.itemIds.join('-')}
          items={outfitItems} liked={liked}
          onLike={() => flow.setLiked(liked === true ? null : true)}
          onDislike={() => flow.setLiked(liked === false ? null : false)}
          explanation={result.explanation}
          hint={missingShoes ? 'Добавь обувь, чтобы образ был полным' : undefined}
        />
        {missingShoes ? (
          <Button variant="text" full icon="plus" onClick={() => useUi.getState().openAddSheet('/outfit/result')}>Добавить обувь</Button>
        ) : (
          <div className="tools">
            <Tool icon="arrows-clockwise" label="Другой вариант" note={unlimited ? 'без лимита' : 'минус 1 образ'} onClick={another} />
            <Tool icon="swap" label="Заменить вещь" note="бесплатно" onClick={() => setReplace(true)} />
            <Tool icon="pencil-simple" label="Редактировать" note="в конструкторе" onClick={() => navigate('/constructor', { state: { itemIds: result.itemIds } })} />
          </div>
        )}
      </div>
      <CtaPlate>
        <div className="cta-plate__row">
          <Button variant="secondary" icon={worn ? 'check' : 't-shirt'} className="btn--shrink" onClick={flow.toggleWorn}>Надеваю</Button>
          <Button icon={saved ? 'check' : 'bookmark-simple'} disabled={saved} onClick={save}>{saved ? 'Сохранено' : 'Сохранить'}</Button>
        </div>
      </CtaPlate>
      {favSheets}
      <ReplaceItemSheet
        open={replace} onClose={() => setReplace(false)} outfitItems={outfitItems} wardrobe={items}
        onReplace={(o, n) => flow.replaceItem(o, n)}
      />
      <PaywallSheet
        open={paywall} onClose={() => setPaywall(false)}
        title="Образы закончились" subtitle={`Новые ${lim.outfitsLimit ?? ''} появятся в понедельник`}
        onPaid={() => toast('Подписка подключена', 'success')}
      />
    </>
  )
}

function Tool({ icon, label, note, onClick }: { icon: string; label: string; note: string; onClick: () => void }) {
  return (
    <button type="button" className="tool" onClick={onClick}>
      <Icon name={icon} size={24} />
      <span className="t-caption">{label}</span>
      <span className="tool__note">{note}</span>
    </button>
  )
}
