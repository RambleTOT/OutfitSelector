import type { CSSProperties, ReactNode } from 'react'
import { Icon } from './Icon'

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'text' | 'danger'
  size?: 'md' | 'sm'
  icon?: string
  iconRight?: string
  disabled?: boolean
  loading?: boolean
  full?: boolean
  glass?: boolean
  onClick?: () => void
  children?: ReactNode
  style?: CSSProperties
  className?: string
  type?: 'button' | 'submit'
  'aria-label'?: string
}

export function Button({
  variant = 'primary', size = 'md', icon, iconRight, disabled, loading, full, glass, onClick, children, style, className, type = 'button', ...rest
}: ButtonProps) {
  const cls = ['btn', `btn--${variant}`, size === 'sm' && 'btn--sm', full && 'btn--full', glass && 'glass btn--glass', className].filter(Boolean).join(' ')
  return (
    <button type={type} className={cls} disabled={disabled || loading} onClick={onClick} style={style} aria-label={rest['aria-label']}>
      {loading ? <Icon name="circle-notch" size={20} style={{ animation: 'at-spin 0.9s linear infinite' }} /> : icon ? <Icon name={icon} size={22} /> : null}
      {children}
      {iconRight && <Icon name={iconRight} size={20} />}
    </button>
  )
}

export interface IconButtonProps {
  icon: string
  label: string // aria-label обязателен
  variant?: 'glass' | 'solid' | 'plain'
  selected?: boolean
  disabled?: boolean
  size?: number
  pop?: boolean
  onClick?: () => void
  style?: CSSProperties
}

export function IconButton({ icon, label, variant = 'glass', selected = false, disabled, size = 44, pop, onClick, style }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={['icon-btn', `icon-btn--${variant}`, variant === 'glass' && 'glass', pop && 'pop'].filter(Boolean).join(' ')}
      style={{ width: size, height: size, ...style }}
    >
      <Icon name={icon} fill={selected} size={Math.round(size * 0.5)} />
    </button>
  )
}
