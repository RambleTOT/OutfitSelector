import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { BottomSheet, Button, CtaPlate, Icon, IconButton, OutfitCard, TextInput } from '../../ui'
import { useApp } from '../../store/app'
import { toast } from '../../store/ui'
import { resolveSaved } from '../../lib/outfit'
import { occasionById, temp } from '../../lib/format'
import { useOutfitFlow } from '../../store/outfit'
import { LayoutView } from '../constructor/LayoutView'

/** FAV-04 SavedOutfitDetail: коллаж, название и заметка, Надеваю сегодня, редактировать, удалить */
export function SavedOutfitDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const outfit = useApp((s) => s.saved.find((o) => o.id === id))
  const items = useApp((s) => s.items)
  const updateSaved = useApp((s) => s.updateSaved)
  const deleteSaved = useApp((s) => s.deleteSaved)
  const [rename, setRename] = useState(false)
  const [menu, setMenu] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  if (!outfit) return <Navigate to="/favorites" replace />

  const res = resolveSaved(outfit, items)
  const occ = occasionById(outfit.occasion)
  const date = new Date(outfit.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
  const openRename = () => { setName(outfit.name); setNote(outfit.note ?? ''); setRename(true) }
  const edit = () => navigate('/constructor', { state: { savedId: outfit.id, itemIds: outfit.items } })
  const share = () => {
    // для картинки в сторис используем тот же экран, что и в Образе
    useOutfitFlow.setState({ result: { templateId: outfit.id, occasion: outfit.occasion, itemIds: outfit.items, explanation: outfit.explanation ?? '', missing: [], wish: '' } })
    navigate('/outfit/share')
  }

  return (
    <>
      <div className="screen screen--push" style={{ gap: 16, paddingBottom: 128 }}>
        <div className="nav-row">
          <IconButton icon="caret-left" label="Назад" variant="solid" onClick={() => navigate(-1)} />
          <div style={{ display: 'flex', gap: 8 }}>
            <IconButton icon="share-network" label="Поделиться" variant="solid" onClick={share} />
            <IconButton icon="dots-three" label="Ещё" variant="solid" onClick={() => setMenu(true)} />
          </div>
        </div>
        {outfit.layout
          ? <LayoutView layout={outfit.layout} items={res.map((r) => r.item)} bg={outfit.bg} deletedIds={res.filter((r) => r.deleted).map((r) => r.item.id)} />
          : <OutfitCard items={res.map((r) => r.item)} deletedIds={res.filter((r) => r.deleted).map((r) => r.item.id)} />}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 className="t-title2" style={{ flex: 1, minWidth: 0 }}>{outfit.name}</h2>
            <IconButton icon="pencil-simple" label="Переименовать" variant="plain" onClick={openRename} />
          </div>
          <span className="t-caption muted">{occ.emoji} {occ.label} · {temp()} · сохранён {date}</span>
          {outfit.explanation && <span className="t-callout" style={{ fontWeight: 400, textWrap: 'pretty' }}>{outfit.explanation}</span>}
          {outfit.note && (
            <div className="notice" style={{ marginTop: 6, padding: 12 }}>
              <Icon name="pencil-simple" size={20} color="var(--accent)" />
              <span className="t-callout" style={{ fontWeight: 400, textWrap: 'pretty' }}>{outfit.note}</span>
            </div>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
          <Button variant="secondary" size="sm" full icon="pencil-simple" onClick={edit}>Редактировать</Button>
          <Button variant="secondary" size="sm" full icon="trash" onClick={() => setConfirm(true)}>Удалить</Button>
        </div>
      </div>
      <CtaPlate>
        <Button full icon={outfit.worn ? 'check' : 't-shirt'} variant={outfit.worn ? 'secondary' : 'primary'} onClick={() => { updateSaved(outfit.id, { worn: !outfit.worn }); if (!outfit.worn) toast('Запомнил: сегодня носишь этот образ', 'success', { icon: 't-shirt' }) }}>
          Надеваю сегодня
        </Button>
      </CtaPlate>

      <BottomSheet open={rename} onClose={() => setRename(false)} title="Название и заметка" footer={<Button full disabled={!name.trim()} onClick={() => { updateSaved(outfit.id, { name: name.trim(), note: note.trim() || undefined }); setRename(false) }}>Сохранить</Button>}>
        <TextInput label="Название" value={name} onChange={setName} maxLength={40} />
        <label className="field">
          <span className="t-caption field__label">Заметка</span>
          <span className="field__box" style={{ height: 'auto', padding: '12px 16px', alignItems: 'flex-start' }}>
            <textarea className="field__input" rows={3} value={note} maxLength={160} placeholder="Куда надевал, с чем сочетать" onChange={(e) => setNote(e.target.value)} style={{ resize: 'none' }} />
          </span>
        </label>
      </BottomSheet>
      <BottomSheet open={menu} onClose={() => setMenu(false)}>
        <Button variant="secondary" full icon="pencil-simple" onClick={() => { setMenu(false); setTimeout(openRename, 260) }}>Переименовать</Button>
        <Button variant="secondary" full icon="hand-pointing" onClick={() => { setMenu(false); edit() }}>Редактировать в конструкторе</Button>
        <Button variant="secondary" full icon="trash" onClick={() => { setMenu(false); setTimeout(() => setConfirm(true), 260) }}>Удалить</Button>
      </BottomSheet>
      <BottomSheet open={confirm} onClose={() => setConfirm(false)} title="Удалить образ?" subtitle="Вещи из образа останутся в гардеробе">
        <Button variant="danger" full onClick={() => { deleteSaved(outfit.id); toast('Образ удалён', 'neutral'); navigate('/favorites', { replace: true }) }}>Удалить</Button>
        <Button variant="secondary" full onClick={() => setConfirm(false)}>Оставить</Button>
      </BottomSheet>
    </>
  )
}
