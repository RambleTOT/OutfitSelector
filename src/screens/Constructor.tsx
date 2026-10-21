import { useNavigate } from 'react-router-dom'
import { EmptyState, IconButton } from '../ui'

/** Заглушка CON-01/CON-02, настоящий экран в P8 */
export function Constructor() {
  const navigate = useNavigate()
  return (
    <div className="screen screen--push">
      <div className="nav-row"><IconButton icon="caret-left" label="Назад" variant="solid" onClick={() => navigate(-1)} /></div>
      <EmptyState icon="hand-pointing" title="Конструктор" text="Экран CON-01 появится в P8" />
    </div>
  )
}
