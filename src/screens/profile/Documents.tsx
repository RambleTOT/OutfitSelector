import { useNavigate } from 'react-router-dom'
import { Icon, NavHeader } from '../../ui'
import { toast } from '../../store/ui'

const DOCS = [
  'Пользовательское соглашение',
  'Политика конфиденциальности',
  'Оферта на подписку',
  'Согласие на автоплатёж',
  'Согласие на обработку фото',
]

/** PRF-06 Documents: ссылки на веб-документы */
export function Documents() {
  const navigate = useNavigate()
  return (
    <div className="screen screen--push" style={{ gap: 20 }}>
      <NavHeader title="Документы" onBack={() => navigate(-1)} />
      <div className="list" style={{ padding: '0 16px' }}>
        {DOCS.map((d, i) => (
          <button key={d} type="button" className="row" style={{ minHeight: 64, padding: 0, borderTop: i ? '1px solid var(--line)' : 'none' }} onClick={() => toast('Документ откроется в браузере', 'neutral')}>
            <Icon name="file-text" size={22} color="var(--ink-secondary)" />
            <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'left' }}>
              <span className="t-body" style={{ textWrap: 'pretty' }}>{d}</span>
              <span className="t-caption muted">от 1 октября 2026</span>
            </span>
            <Icon name="caret-right" size={20} color="var(--ink-secondary)" />
          </button>
        ))}
      </div>
      <span className="t-caption muted" style={{ textAlign: 'center', lineHeight: '18px' }}>Atelier 1.0 · ИП Иванова К. А. · ИНН 770000000000</span>
    </div>
  )
}
