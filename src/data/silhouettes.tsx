import { useId } from 'react'
import type { Pattern, SilhouetteKind } from './types'

/* Плоские силуэты одежды на сетке 200×200. Заливка задаётся параметром color,
   тени и швы считаются от неё. Контур делает белые вещи читаемыми на подложке. */

function parse(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)]
}
function mix(hex: string, to: [number, number, number], t: number) {
  const [r, g, b] = parse(hex)
  const m = (a: number, z: number) => Math.round(a + (z - a) * t)
  return `rgb(${m(r, to[0])},${m(g, to[1])},${m(b, to[2])})`
}
const darken = (hex: string, t: number) => mix(hex, [0, 0, 0], t)
const lighten = (hex: string, t: number) => mix(hex, [255, 255, 255], t)

type Paint = { c: string; d1: string; d2: string; l1: string; line: string; strokeW: number }

type Def = {
  body: string[] // основные контуры (заливка color, по ним же клипуется узор)
  extra?: (p: Paint) => React.ReactNode // детали
  under?: (p: Paint) => React.ReactNode // детали под телом (капюшон, ручка)
}

const stroke = (p: Paint, w = 3) => ({ fill: 'none', stroke: p.d1, strokeWidth: w, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const })

const DEFS: Record<SilhouetteKind, Def> = {
  tshirt: {
    body: ['M62 28 L88 38 Q100 48 112 38 L138 28 L182 58 L164 90 L146 78 L146 172 Q146 176 142 176 L58 176 Q54 176 54 172 L54 78 L36 90 L18 58 Z'],
    extra: (p) => (
      <>
        <path d="M88 38 Q100 58 112 38 Q100 50 88 38 Z" fill={p.d2} />
        <path d="M54 78 L36 90 M146 78 L164 90" {...stroke(p, 2.5)} />
        <path d="M56 164 H144" {...stroke(p, 2.5)} />
      </>
    ),
  },
  shirt: {
    body: ['M64 26 L86 34 L100 46 L114 34 L136 26 L186 130 L164 140 L146 96 L146 176 L54 176 L54 96 L36 140 L14 130 Z'],
    extra: (p) => (
      <>
        <path d="M86 34 L100 62 L92 66 L78 42 Z M114 34 L100 62 L108 66 L122 42 Z" fill={p.l1} stroke={p.d1} strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M100 62 V176" {...stroke(p, 2.5)} />
        {[84, 104, 124, 144].map((y) => <circle key={y} cx="106" cy={y} r="2.4" fill={p.d1} />)}
        <path d="M54 96 L36 140 M146 96 L164 140" {...stroke(p, 2.5)} />
        <path d="M24 134 L40 128 M176 134 L160 128" {...stroke(p, 2.5)} />
      </>
    ),
  },
  sweater: {
    body: ['M66 28 Q100 52 134 28 L182 66 L180 144 L152 144 L148 98 L148 172 L52 172 L52 98 L48 144 L20 144 L18 66 Z'],
    extra: (p) => (
      <>
        <path d="M66 28 Q100 62 134 28" {...stroke(p, 5)} />
        <path d="M52 160 H148" {...stroke(p, 3)} />
        <path d="M20 134 H48 M152 134 H180" {...stroke(p, 3)} />
        {[66, 78, 90, 102, 114, 126, 138].map((x) => <path key={x} d={`M${x} 162 V172`} {...stroke(p, 1.8)} />)}
      </>
    ),
  },
  hoodie: {
    body: ['M64 36 Q100 56 136 36 L182 70 L180 146 L152 146 L148 100 L148 174 L52 174 L52 100 L48 146 L20 146 L18 70 Z'],
    under: (p) => <path d="M66 34 Q70 8 100 8 Q130 8 134 34 L120 50 Q100 60 80 50 Z" fill={p.d1} />,
    extra: (p) => (
      <>
        <path d="M64 36 Q100 66 136 36" {...stroke(p, 3)} />
        <path d="M92 58 V84 M108 58 V84" {...stroke(p, 2.5)} />
        <circle cx="92" cy="86" r="2.6" fill={p.d1} /><circle cx="108" cy="86" r="2.6" fill={p.d1} />
        <path d="M70 126 H130 L136 160 H64 Z" fill={p.l1} stroke={p.d1} strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M20 136 H48 M152 136 H180" {...stroke(p, 3)} />
        <path d="M52 164 H148" {...stroke(p, 3)} />
      </>
    ),
  },
  blazer: {
    body: ['M64 24 L88 22 L100 56 L112 22 L136 24 L184 62 L180 164 L152 164 L148 112 L148 178 L52 178 L52 112 L48 164 L20 164 L16 62 Z'],
    extra: (p) => (
      <>
        <path d="M88 22 L100 138 L112 22 L100 56 Z" fill={p.d2} />
        <path d="M88 22 L74 76 L96 112 L100 138 M112 22 L126 76 L104 112 L100 138" {...stroke(p, 2.5)} />
        <circle cx="100" cy="142" r="3" fill={p.d1} /><circle cx="100" cy="158" r="3" fill={p.d1} />
        <path d="M64 130 H84 M116 130 H136" {...stroke(p, 2.5)} />
        <path d="M52 112 L48 164 M148 112 L152 164" {...stroke(p, 2.5)} />
      </>
    ),
  },
  coat: {
    body: ['M64 20 L88 18 L100 52 L112 18 L136 20 L184 60 L178 166 L152 166 L150 104 L152 190 L48 190 L50 104 L48 166 L22 166 L16 60 Z'],
    extra: (p) => (
      <>
        <path d="M88 18 L100 150 L112 18 L100 52 Z" fill={p.d2} />
        <path d="M88 18 L72 70 L96 108 M112 18 L128 70 L104 108" {...stroke(p, 2.5)} />
        {[116, 134, 152].map((y) => <circle key={y} cx="108" cy={y} r="3" fill={p.d1} />)}
        <path d="M50 104 L48 166 M150 104 L152 166" {...stroke(p, 2.5)} />
        <path d="M62 150 H80 M120 150 H138" {...stroke(p, 2.5)} />
      </>
    ),
  },
  trench: {
    body: ['M64 20 L88 18 L100 52 L112 18 L136 20 L184 60 L178 166 L152 166 L150 104 L156 190 L44 190 L50 104 L48 166 L22 166 L16 60 Z'],
    extra: (p) => (
      <>
        <path d="M88 18 L100 150 L112 18 L100 52 Z" fill={p.d2} />
        <path d="M88 18 L72 70 L96 108 M112 18 L128 70 L104 108" {...stroke(p, 2.5)} />
        <path d="M50 104 H150 V120 H50 Z" fill={p.d1} />
        <rect x="94" y="102" width="12" height="20" rx="3" fill={p.l1} stroke={p.d2} strokeWidth="2" />
        {[132, 150, 168].map((y) => <circle key={y} cx="108" cy={y} r="3" fill={p.d1} />)}
        <path d="M30 150 H38 M162 150 H170" {...stroke(p, 2.5)} />
        <path d="M64 32 L50 50 M136 32 L150 50" {...stroke(p, 2.5)} />
      </>
    ),
  },
  jacket: {
    body: ['M66 28 L90 22 Q100 34 110 22 L134 28 L184 66 L178 144 L152 144 L150 98 L150 160 Q150 166 144 166 L56 166 Q50 166 50 160 L50 98 L48 144 L22 144 L16 66 Z'],
    extra: (p) => (
      <>
        <path d="M90 22 Q100 36 110 22 L110 40 Q100 50 90 40 Z" fill={p.d1} />
        <path d="M100 44 V166" {...stroke(p, 2.5)} />
        <path d="M50 150 H150" {...stroke(p, 3)} />
        <path d="M22 134 H48 M152 134 H178" {...stroke(p, 3)} />
        <path d="M66 112 L78 128 M134 112 L122 128" {...stroke(p, 2.5)} />
      </>
    ),
  },
  jeans: {
    body: ['M56 18 H144 L152 62 L160 188 H112 L100 82 L88 188 H40 L48 62 Z'],
    extra: (p) => (
      <>
        <path d="M56 18 H144 V32 H56 Z" fill={p.d2} />
        <path d="M100 32 V82" {...stroke(p, 2.5)} />
        <path d="M60 36 Q76 40 80 56 M140 36 Q124 40 120 56" {...stroke(p, 2.5)} />
        <path d="M44 176 H88 M112 176 H156" {...stroke(p, 2.5)} />
        <path d="M70 18 V32 M130 18 V32" {...stroke(p, 2.5)} />
      </>
    ),
  },
  trousers: {
    body: ['M58 18 H142 L148 64 L142 190 H108 L100 86 L92 190 H58 L52 64 Z'],
    extra: (p) => (
      <>
        <path d="M58 18 H142 V30 H58 Z" fill={p.d2} />
        <path d="M100 30 V86" {...stroke(p, 2.5)} />
        <path d="M75 60 V186 M125 60 V186" {...stroke(p, 1.8)} />
        <path d="M66 34 Q78 38 80 52 M134 34 Q122 38 120 52" {...stroke(p, 2.5)} />
      </>
    ),
  },
  skirt: {
    body: ['M64 26 H136 L176 170 Q100 190 24 170 Z'],
    extra: (p) => (
      <>
        <path d="M64 26 H136 V40 H64 Z" fill={p.d2} />
        <path d="M80 44 L58 176 M100 44 V182 M120 44 L142 176" {...stroke(p, 2)} />
      </>
    ),
  },
  shorts: {
    body: ['M50 36 H150 L162 134 H110 L100 88 L90 134 H38 Z'],
    extra: (p) => (
      <>
        <path d="M50 36 H150 V50 H50 Z" fill={p.d2} />
        <path d="M100 50 V88" {...stroke(p, 2.5)} />
        <path d="M44 124 H88 M112 124 H156" {...stroke(p, 2.5)} />
        <path d="M60 52 Q74 56 78 70 M140 52 Q126 56 122 70" {...stroke(p, 2.5)} />
      </>
    ),
  },
  dress: {
    body: ['M70 18 L84 18 Q100 46 116 18 L130 18 L138 72 L128 86 L176 184 Q100 198 24 184 L72 86 L62 72 Z'],
    extra: (p) => (
      <>
        <path d="M84 18 Q100 50 116 18" {...stroke(p, 2.5)} />
        <path d="M72 86 Q100 96 128 86" {...stroke(p, 3)} />
        <path d="M86 98 L60 184 M114 98 L140 184 M100 100 V190" {...stroke(p, 1.8)} />
      </>
    ),
  },
  sneakers: {
    body: ['M18 132 Q18 110 40 108 L62 102 Q74 100 84 106 L104 120 Q132 118 158 126 Q186 134 186 150 L186 156 Q186 160 182 160 L22 160 Q18 160 18 156 Z'],
    extra: (p) => (
      <>
        <path d="M18 148 H186 V162 Q186 166 182 166 L22 166 Q18 166 18 162 Z" fill="#F4F4F2" stroke={p.line} strokeWidth="2" />
        <path d="M68 108 L80 120 M78 104 L90 116 M88 110 L98 120" {...stroke(p, 2.5)} />
        <path d="M150 128 Q166 132 172 146" {...stroke(p, 2.5)} />
        <path d="M18 132 Q36 126 52 130" {...stroke(p, 2.5)} />
      </>
    ),
  },
  loafers: {
    body: ['M16 134 Q16 114 40 112 L70 110 Q86 110 96 116 Q132 120 162 130 Q186 138 186 152 L186 158 L16 158 Z'],
    extra: (p) => (
      <>
        <path d="M16 150 H186 V164 H16 Z" fill={p.d2} />
        <path d="M16 156 H56 V168 H16 Z" fill={p.d2} />
        <path d="M82 114 Q94 128 112 122 Q126 118 140 126" {...stroke(p, 2.5)} />
        <rect x="100" y="118" width="14" height="6" rx="2" fill={p.l1} stroke={p.d1} strokeWidth="1.5" />
      </>
    ),
  },
  boots: {
    body: ['M52 20 H108 V96 Q112 112 132 118 Q176 124 186 144 V164 H38 L42 116 Z'],
    extra: (p) => (
      <>
        <path d="M38 152 H186 V168 H38 Z" fill={p.d2} />
        <path d="M38 156 H80 V172 H38 Z" fill={p.d2} />
        <path d="M52 36 H108" {...stroke(p, 2.5)} />
        <path d="M56 62 H84 M56 78 H84 M56 94 H88" {...stroke(p, 2.5)} />
        <path d="M120 120 Q146 120 164 134" {...stroke(p, 2.5)} />
      </>
    ),
  },
  bag: {
    body: ['M36 80 H164 L174 176 Q174 182 168 182 H32 Q26 182 26 176 Z'],
    under: (p) => <path d="M68 82 V62 Q68 34 100 34 Q132 34 132 62 V82" fill="none" stroke={p.d1} strokeWidth="8" strokeLinecap="round" />,
    extra: (p) => (
      <>
        <path d="M36 80 H164 L158 112 Q100 134 42 112 Z" fill={p.d2} />
        <circle cx="100" cy="118" r="6" fill={p.l1} stroke={p.d1} strokeWidth="2" />
      </>
    ),
  },
  scarf: {
    body: ['M40 30 Q100 12 160 30 L164 58 Q100 40 36 58 Z', 'M54 52 H92 L98 184 H56 Z', 'M108 54 H146 L148 164 H106 Z'],
    extra: (p) => (
      <>
        <path d="M56 170 H98 M58 176 H98 M107 150 H148 M107 156 H148" {...stroke(p, 2)} />
        <path d="M62 66 H88 M62 80 H90 M114 66 H140 M114 80 H140" {...stroke(p, 2)} />
      </>
    ),
  },
  cap: {
    body: ['M30 122 Q28 54 100 50 Q168 52 170 122 Z', 'M118 112 Q178 98 198 124 Q152 140 118 130 Z'],
    extra: (p) => (
      <>
        <circle cx="100" cy="50" r="5" fill={p.d1} />
        <path d="M100 52 Q82 88 80 122 M100 52 Q118 88 120 118" {...stroke(p, 2.5)} />
        <path d="M30 122 H170" {...stroke(p, 3)} />
        <circle cx="64" cy="94" r="2.4" fill={p.d1} /><circle cx="136" cy="94" r="2.4" fill={p.d1} />
      </>
    ),
  },
}

export function Silhouette({
  kind,
  color,
  pattern = 'однотон',
  size = '100%',
  title,
}: {
  kind: SilhouetteKind
  color: string
  pattern?: Pattern
  size?: number | string
  title?: string
}) {
  const uid = useId().replace(/:/g, '')
  const def = DEFS[kind]
  const p: Paint = {
    c: color,
    d1: darken(color, 0.22),
    d2: darken(color, 0.12),
    l1: lighten(color, 0.18),
    line: 'rgba(17,17,20,0.16)',
    strokeW: 2,
  }
  const clip = `clip-${uid}`
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      style={{ display: 'block', overflow: 'visible' }}
    >
      <defs>
        <clipPath id={clip}>
          {def.body.map((d, i) => <path key={i} d={d} />)}
        </clipPath>
      </defs>
      {def.under?.(p)}
      {def.body.map((d, i) => (
        <path key={i} d={d} fill={p.c} stroke={p.line} strokeWidth={p.strokeW} strokeLinejoin="round" />
      ))}
      {pattern === 'полоска' && (
        <g clipPath={`url(#${clip})`} opacity="0.55">
          {Array.from({ length: 12 }, (_, i) => (
            <rect key={i} x="0" y={14 + i * 16} width="200" height="6" fill={p.d1} />
          ))}
        </g>
      )}
      {pattern === 'клетка' && (
        <g clipPath={`url(#${clip})`} opacity="0.4">
          {Array.from({ length: 10 }, (_, i) => (
            <g key={i}>
              <rect x="0" y={14 + i * 20} width="200" height="5" fill={p.d1} />
              <rect x={14 + i * 20} y="0" width="5" height="200" fill={p.d1} />
            </g>
          ))}
        </g>
      )}
      {def.extra?.(p)}
    </svg>
  )
}

export { darken, lighten }
