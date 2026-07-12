import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

interface TooltipProps {
  label: string
  children: ReactNode
  disabled?: boolean
  align?: 'center' | 'left' | 'right'
  side?: 'top' | 'bottom'
  /** Stretch the wrapper to the parent's width instead of shrinking to
   *  content — needed when wrapping a truncated block (e.g. a table cell)
   *  so its own width:100% resolves against something meaningful. */
  fullWidth?: boolean
}

const VIEWPORT_MARGIN = 8

export function Tooltip({ label, children, disabled, align = 'center', side = 'top', fullWidth }: TooltipProps) {
  const [hover, setHover] = useState(false)
  const [shift, setShift] = useState(0)
  const bubbleRef = useRef<HTMLSpanElement>(null)
  const show = hover && !disabled

  useLayoutEffect(() => {
    if (!show) return
    const el = bubbleRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const overflowRight = rect.right - (window.innerWidth - VIEWPORT_MARGIN)
    const overflowLeft = VIEWPORT_MARGIN - rect.left
    if (overflowRight > 0) {
      setShift((prev) => prev - overflowRight)
    } else if (overflowLeft > 0) {
      setShift((prev) => prev + overflowLeft)
    }
  }, [show])

  useLayoutEffect(() => {
    if (!show) setShift(0)
  }, [show])

  return (
    <span
      style={{
        position: 'relative',
        display: fullWidth ? 'block' : 'inline-flex',
        width: fullWidth ? '100%' : undefined,
        minWidth: fullWidth ? 0 : undefined,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {children}
      {show && (
        <span
          ref={bubbleRef}
          style={{
            ...tooltipStyle,
            ...sideStyle[side],
            ...alignStyle[align],
            transform: `${alignStyle[align].transform ?? ''} translateX(${shift}px)`.trim(),
          }}
        >
          {label}
        </span>
      )}
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
