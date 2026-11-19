import { useNavigate } from 'react-router-dom'
import { Icon, NavHeader } from '../../ui'

const DOCS: [string, string][] = [
  ['Политика конфиденциальности', '/legal/privacy.html'],
  ['Оферта и условия оплаты', '/legal/offer.html'],
  ['Согласие на обработку данных', '/legal/consent.html'],
]

/** PRF-06 Documents: ссылки на веб-документы */
export function Documents() {
  const navigate = useNavigate()
  return (
    <div className="screen screen--push" style={{ gap: 20 }}>
      <NavHeader title="Документы" onBack={() => navigate(-1)} />
      <div className="list" style={{ padding: '0 16px' }}>
        {DOCS.map(([d, href], i) => (
          <button key={d} type="button" className="row" style={{ minHeight: 64, padding: 0, borderTop: i ? '1px solid var(--line)' : 'none' }} onClick={() => { if (!window.open(href, '_blank', 'noopener')) location.href = href }}>
            <Icon name="file-text" size={22} color="var(--ink-secondary)" />
            <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'left' }}>
              <span className="t-body" style={{ textWrap: 'pretty' }}>{d}</span>
              <span className="t-caption muted">от 19 ноября 2026</span>
            </span>
            <Icon name="caret-right" size={20} color="var(--ink-secondary)" />
          </button>
        ))}
      </div>
      <span className="t-caption muted" style={{ textAlign: 'center', lineHeight: '18px' }}>Atelier 1.0</span>
    </div>
  )
}
