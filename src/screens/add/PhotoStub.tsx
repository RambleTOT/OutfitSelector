import { useNavigate } from 'react-router-dom'
import { EmptyState, IconButton } from '../../ui'

/** Заглушка ADD-02…ADD-04, настоящие экраны в P5 */
export function PhotoStub() {
  const navigate = useNavigate()
  return (
    <div className="flow" style={{ padding: '56px 20px' }}>
      <IconButton icon="x" label="Закрыть" variant="solid" onClick={() => navigate(-1)} />
      <EmptyState icon="camera" title="Камера" text="Экраны ADD-02…ADD-04 появятся в P5" />
    </div>
  )
}
