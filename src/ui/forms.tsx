import { useRef, type CSSProperties, type ReactNode } from 'react'
import { Icon } from './Icon'

export function Chip({
  label, icon, emoji, variant = 'occasion', selected = false, disabled, onClick, style,
}: {
  label: string; icon?: string; emoji?: string; variant?: 'occasion' | 'suggestion'; selected?: boolean; disabled?: boolean
  onClick?: () => void; style?: CSSProperties
}) {
  return (
    <button type="button" className={`chip ${variant === 'suggestion' ? 'chip--suggestion' : ''}`} aria-pressed={selected} disabled={disabled} onClick={onClick} style={style}>
      {emoji ? <span className="chip__emoji" aria-hidden="true">{emoji}</span> : icon ? <Icon name={icon} fill={selected} size={18} /> : null}
      {label}
    </button>
  )
}

export function AnswerCard({
  title, subtitle, icon, image, layout = 'list', selected = false, disabled, onClick, style,
}: {
  title: string; subtitle?: string; icon?: string; image?: ReactNode; layout?: 'list' | 'tile'; selected?: boolean; disabled?: boolean
  onClick?: () => void; style?: CSSProperties
}) {
  return (
    <button type="button" className={`answer ${layout === 'tile' ? 'answer--tile' : ''}`} aria-pressed={selected} disabled={disabled} onClick={onClick} style={style}>
      {(image || icon) && <span className="answer__media">{image ?? <Icon name={icon!} size={layout === 'tile' ? 40 : 24} />}</span>}
      <span className="answer__text">
        <span className="t-headline">{title}</span>
        {subtitle && <span className="t-caption answer__sub">{subtitle}</span>}
      </span>
      {selected && <span className="answer__check"><Icon name="check" size={15} /></span>}
    </button>
  )
}

export function BigTextField({
  value, onChange, placeholder, suggestions = [], onSuggestion, error, disabled, maxLength,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; suggestions?: string[]; onSuggestion?: (s: string) => void
  error?: string; disabled?: boolean; maxLength?: number
}) {
  return (
    <div className="bigfield" style={{ opacity: disabled ? 0.5 : 1 }}>
      <input
        className="bigfield__input" value={value} placeholder={placeholder} disabled={disabled} maxLength={maxLength}
        style={error ? { borderBottomColor: 'var(--error)' } : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <span className="t-caption" style={{ color: 'var(--error-text)', marginTop: -4 }}>{error}</span>}
      {suggestions.length > 0 && (
        <div className="bigfield__chips">
          {suggestions.map((s) => (
            <Chip key={s} label={s} variant="suggestion" disabled={disabled} onClick={() => { onChange(s); onSuggestion?.(s) }} />
          ))}
        </div>
      )}
    </div>
  )
}

export function TextInput({
  label, value, onChange, placeholder, type = 'text', icon, error, hint, disabled, inputMode, autoFocus, onEnter, maxLength, style,
}: {
  label?: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; icon?: string; error?: string
  hint?: string; disabled?: boolean; inputMode?: 'text' | 'email' | 'numeric' | 'tel'; autoFocus?: boolean; onEnter?: () => void
  maxLength?: number; style?: CSSProperties
}) {
  return (
    <label className={`field ${error ? 'field--error' : ''}`} style={{ opacity: disabled ? 0.5 : 1, ...style }}>
      {label && <span className="t-caption field__label">{label}</span>}
      <span className="field__box">
        {icon && <Icon name={icon} size={22} color="var(--ink-tertiary)" />}
        <input
          className="field__input" type={type} value={value} placeholder={placeholder} disabled={disabled} inputMode={inputMode}
          autoFocus={autoFocus} maxLength={maxLength} onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onEnter?.()}
        />
        {error && <Icon name="warning-circle" size={22} color="var(--error)" />}
      </span>
      {(error || hint) && <span className="t-caption field__msg">{error || hint}</span>}
    </label>
  )
}

export function Switch({
  checked, onChange, label, description, disabled,
}: { checked: boolean; onChange?: (v: boolean) => void; label?: string; description?: string; disabled?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-disabled={disabled} className="switch-row" onClick={() => !disabled && onChange?.(!checked)}>
      {(label || description) && (
        <span className="switch-row__text">
          {label && <span className="t-body">{label}</span>}
          {description && <span className="t-caption switch-row__desc">{description}</span>}
        </span>
      )}
      <span className="switch" data-on={checked} />
    </button>
  )
}

export function QuestionProgress({
  step, total, onBack, onSkip, skipLabel = 'Пропустить',
}: { step: number; total: number; onBack?: () => void; onSkip?: () => void; skipLabel?: string }) {
  return (
    <div className="qprog">
      <IconBack onBack={onBack} />
      <div className="qprog__segs" role="progressbar" aria-label="Прогресс анкеты" aria-valuemin={0} aria-valuemax={total} aria-valuenow={step}>
        {Array.from({ length: total }, (_, i) => <span key={i} className="qprog__seg" data-on={i < step} />)}
      </div>
      <button type="button" className="qprog__skip t-callout" onClick={onSkip} style={{ visibility: onSkip ? 'visible' : 'hidden' }}>{skipLabel}</button>
    </div>
  )
}

function IconBack({ onBack }: { onBack?: () => void }) {
  return (
    <button
      type="button" aria-label="Назад" onClick={onBack}
      style={{ width: 44, height: 44, border: 'none', background: 'transparent', color: 'var(--ink-primary)', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', visibility: onBack ? 'visible' : 'hidden' }}
    >
      <Icon name="caret-left" size={24} />
    </button>
  )
}

/** CodeInput: 4 ячейки, один скрытый input ловит ввод и вставку */
export function CodeInput({ value, onChange, error, length = 4 }: { value: string; onChange: (v: string) => void; error?: boolean; length?: number }) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <div className="code" onClick={() => ref.current?.focus()}>
      {Array.from({ length }, (_, i) => (
        <div key={i} className="code__cell" data-active={value.length === i} data-error={!!error}>{value[i] ?? ''}</div>
      ))}
      <input
        ref={ref} autoFocus inputMode="numeric" autoComplete="one-time-code" aria-label="Код из письма" value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, length))}
        style={{ position: 'absolute', opacity: 0, width: 1, height: 1, pointerEvents: 'none', fontSize: 16 }}
      />
    </div>
  )
}

export function Checkbox({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <button type="button" role="checkbox" aria-checked={checked} className="check" onClick={() => onChange(!checked)}>
      <span className="check__box">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8.5l3.2 3.2L13 4.8" /></svg>
      </span>
      <span className="t-caption check__text">{children}</span>
    </button>
  )
}
