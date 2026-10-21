import type { CSSProperties } from 'react'
import { ICONS_FILL, ICONS_REGULAR } from './icons.generated'
import { ICONS_EXTRA } from './icons.extra'

export type IconProps = {
  name: string
  fill?: boolean
  size?: number
  color?: string
  style?: CSSProperties
  title?: string
}

export function Icon({ name, fill = false, size = 24, color = 'currentColor', style, title }: IconProps) {
  const inner = (fill && ICONS_FILL[name]) || ICONS_REGULAR[name] || ICONS_EXTRA[name] || ''
  return (
    <svg
      viewBox="0 0 256 256"
      width={size}
      height={size}
      fill="currentColor"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      style={{ color, flexShrink: 0, display: 'block', ...style }}
      dangerouslySetInnerHTML={{ __html: inner }}
    />
  )
}
