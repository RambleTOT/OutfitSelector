import { Navigate, useNavigate } from 'react-router-dom'
import { ItemDetail } from '../wardrobe/ItemDetail'
import { addPhotoItem, usePhotoFlow } from '../../store/photo'
import { toast, useUi } from '../../store/ui'

/** ADD-06 после обработки: карточка с предзаполненными полями, которые можно править, затем «Сохранить» кладёт вещь в гардероб */
export function PhotoCard() {
  const navigate = useNavigate()
  const item = usePhotoFlow((s) => s.item)
  const returnTo = useUi((s) => s.addSheet.returnTo)
  if (!item) return <Navigate to={returnTo} replace />
  return (
    <ItemDetail
      isNew itemOverride={item}
      onSaved={(draft) => {
        addPhotoItem(draft)
        usePhotoFlow.getState().reset()
        toast('Вещь добавлена')
        navigate(returnTo, { replace: true })
      }}
    />
  )
}
