import { useEffect, useState } from 'react'
import { Icon } from '../ui'

/** Справа от рамки на компьютере: QR-код, чтобы открыть Atelier на телефоне и поставить иконку на экран */
export function DesktopAside() {
  const [svg, setSvg] = useState('')
  useEffect(() => {
    let alive = true
    const url = `${location.origin}/app/?from=qr`
    import('qrcode').then((q) => q.toString(url, { type: 'svg', margin: 0, width: 168, color: { dark: '#111114', light: '#FFFFFF' } })).then((s) => { if (alive) setSvg(s) }).catch(() => {})
    return () => { alive = false }
  }, [])
  return (
    <aside className="demo" aria-label="Открыть на телефоне">
      <div className="demo__card" style={{ alignItems: 'center', textAlign: 'center', gap: 14 }}>
        <span className="wordmark" style={{ fontSize: 30 }}>Atelier</span>
        <p className="t-headline" style={{ textWrap: 'balance' }}>Лучше на телефоне</p>
        <div style={{ width: 192, height: 192, padding: 12, borderRadius: 20, background: '#fff', boxShadow: 'var(--shadow-card)' }} dangerouslySetInnerHTML={{ __html: svg }} aria-label="QR-код со ссылкой на Atelier" role="img" />
        <p className="t-caption demo__hint" style={{ textWrap: 'pretty' }}>Наведи камеру телефона на код. Откроется Atelier, и подскажем, как поставить иконку на экран</p>
        <span className="t-caption demo__hint" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="device-mobile" size={16} />Слева можно попробовать сразу</span>
      </div>
    </aside>
  )
}
