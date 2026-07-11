import { useState, type CSSProperties, type ReactNode } from 'react'

interface TooltipProps {
  label: string
  children: ReactNode
  disabled?: boolean
  align?: 'center' | 'left' | 'right'
  side?: 'top' | 'bottom'
}

export function Tooltip({ label, children, disabled, align = 'center', side = 'top' }: TooltipProps) {
  const [hover, setHover] = useState(false)
  const show = hover && !disabled

  return (
    <span
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {children}
      {show && <span style={{ ...tooltipStyle, ...sideStyle[side], ...alignStyle[align] }}>{label}</span>}
    </span>
  )
}

const tooltipStyle: CSSProperties = {
  position: 'absolute',
  background: 'var(--color-ink, #1E2D45)',
  color: '#fff',
  fontFamily: 'var(--font-sans)',
  fontSize: '11px',
  fontWeight: 500,
  whiteSpace: 'nowrap',
  padding: '4px 8px',
  borderRadius: 'var(--radius-sm, 4px)',
  zIndex: 30,
  pointerEvents: 'none',
  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
}

const sideStyle: Record<'top' | 'bottom', CSSProperties> = {
  top: { bottom: '100%', marginBottom: '6px' },
  bottom: { top: '100%', marginTop: '6px' },
}

const alignStyle: Record<'center' | 'left' | 'right', CSSProperties> = {
  center: { left: '50%', transform: 'translateX(-50%)' },
  left: { left: 0 },
  right: { right: 0 },
}
