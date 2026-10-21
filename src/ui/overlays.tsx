import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Button } from './buttons'
import { Icon } from './Icon'
import { useUi } from '../store/ui'

/** Корень оверлеев внутри рамки приложения: шторки и подсказки живут в рамке, а не на всей странице */
export const OverlayContext = createContext<HTMLElement | null>(null)

/** Держит компонент смонтированным на время анимации закрытия */
function usePresence(open: boolean, ms = 250) {
  const [mounted, setMounted] = useState(open)
  useEffect(() => {
    if (open) { setMounted(true); return }
    const t = setTimeout(() => setMounted(false), ms)
    return () => clearTimeout(t)
  }, [open, ms])
  return mounted
}

export function BottomSheet({
  open, onClose, title, subtitle, children, footer, dismissible = true,
}: {
  open: boolean; onClose: () => void; title?: string; subtitle?: string; children?: ReactNode; footer?: ReactNode; dismissible?: boolean
}) {
  const root = useContext(OverlayContext)
  const mounted = usePresence(open)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  useEffect(() => {
    if (!open || !dismissible) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, dismissible])
  if (!root || !mounted) return null
  return createPortal(
    <>
      <div className="scrim" data-closing={!open} onClick={dismissible ? onClose : undefined} />
      <div className="sheet glass" role="dialog" aria-modal="true" aria-label={title} data-closing={!open}>
        <button type="button" className="sheet__grab" aria-label="Закрыть" onClick={dismissible ? onClose : undefined} />
        {(title || subtitle) && (
          <div className="sheet__head">
            {title && <h3 className="t-title2" style={{ textWrap: 'pretty' }}>{title}</h3>}
            {subtitle && <p className="t-callout sheet__sub" style={{ textWrap: 'pretty' }}>{subtitle}</p>}
          </div>
        )}
        <div className="sheet__body">{children}</div>
        {footer && <div className="sheet__foot">{footer}</div>}
      </div>
    </>,
    root,
  )
}

export function CtaPlate({ children }: { children: ReactNode }) {
  return <div className="cta-plate glass">{children}</div>
}

export function EmptyState({
  icon = 'coat-hanger', illustration, title, text, actionLabel, actionVariant = 'secondary', onAction,
}: { icon?: string; illustration?: ReactNode; title?: string; text?: string; actionLabel?: string; actionVariant?: 'primary' | 'secondary'; onAction?: () => void }) {
  return (
    <div className="empty">
      <div className="empty__art">{illustration ?? <Icon name={icon} size={56} />}</div>
      {title && <h3 className="t-title2 empty__title">{title}</h3>}
      {text && <p className="t-body empty__text">{text}</p>}
      {actionLabel && <Button variant={actionVariant} onClick={onAction}>{actionLabel}</Button>}
    </div>
  )
}

export interface CoachTarget { x: number; y: number; width: number; height: number; radius: number }

export function Coachmark({
  target, title, text, step, okLabel = 'Понятно', placement = 'above', onOk,
}: { target: CoachTarget; title?: string; text?: string; step?: string; okLabel?: string; placement?: 'above' | 'below'; onOk: () => void }) {
  const root = useContext(OverlayContext)
  if (!root) return null
  const card = placement === 'above' ? { bottom: `calc(100% - ${target.y - 16}px)` } : { top: target.y + target.height + 16 }
  return createPortal(
    <div className="coach" role="dialog" aria-label={title}>
      <div className="coach__hole" style={{ left: target.x, top: target.y, width: target.width, height: target.height, borderRadius: target.radius }} />
      <div className="coach__card glass" style={card}>
        {step && <span className="t-micro coach__step">{step}</span>}
        {title && <span className="t-headline">{title}</span>}
        {text && <span className="t-callout coach__text">{text}</span>}
        <div className="coach__act"><Button variant="secondary" size="sm" onClick={onOk}>{okLabel}</Button></div>
      </div>
    </div>,
    root,
  )
}

const TONES = {
  success: { icon: 'check-circle', color: 'var(--success)' },
  error: { icon: 'warning-circle', color: 'var(--error)' },
  offline: { icon: 'wifi-slash', color: 'var(--ink-secondary)' },
  neutral: { icon: 'info', color: 'var(--accent)' },
} as const

/** Один тост на экране, скрывается через --dur-toast (3 с) */
export function ToastHost() {
  const toast = useUi((s) => s.toast)
  const hide = useUi((s) => s.hideToast)
  const [shown, setShown] = useState(toast)
  const [leaving, setLeaving] = useState(false)
  useEffect(() => {
    if (!toast) return
    setShown(toast)
    setLeaving(false)
    const a = setTimeout(() => setLeaving(true), 3000)
    const b = setTimeout(() => hide(), 3200)
    return () => { clearTimeout(a); clearTimeout(b) }
  }, [toast, hide])
  if (!toast || !shown) return null
  const t = TONES[shown.tone]
  return (
    <div className="toast-host">
      <div key={shown.id} className="toast glass" role="status" data-leaving={leaving}>
        <Icon name={shown.icon || t.icon} fill size={22} color={t.color} />
        <span className="t-callout toast__text">{shown.text}</span>
        {shown.action && (
          <button type="button" className="toast__action" onClick={() => { shown.onAction?.(); hide() }}>{shown.action}</button>
        )}
      </div>
    </div>
  )
}
