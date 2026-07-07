import { type ReactNode, type CSSProperties } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'accent' | 'destructive'
type Size = 'sm' | 'md' | 'lg'

const SIZES: Record<Size, CSSProperties> = {
  sm: { padding: '0 10px', fontSize: '13px', height: '30px', gap: '5px' },
  md: { padding: '0 14px', fontSize: '14px', height: '36px', gap: '6px' },
  lg: { padding: '0 18px', fontSize: '16px', height: '42px', gap: '7px' },
}

const VARIANTS: Record<Variant, CSSProperties> = {
  primary:     { background: '#1E2D45', color: '#FFFFFF', border: '1px solid #1E2D45' },
  secondary:   { background: '#FFFFFF', color: '#1E2D45', border: '1px solid #C5C3CF' },
  ghost:       { background: 'transparent', color: '#413F52', border: '1px solid transparent' },
  accent:      { background: '#A07600', color: '#FFFFFF', border: '1px solid #A07600' },
  destructive: { background: '#7F1D1D', color: '#FFFFFF', border: '1px solid #7F1D1D' },
}

interface ButtonProps {
  children?: ReactNode
  variant?: Variant
  size?: Size
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  onClick?: () => void
  iconLeft?: ReactNode
  iconRight?: ReactNode
  fullWidth?: boolean
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  type = 'button',
  onClick,
  iconLeft,
  iconRight,
  fullWidth = false,
}: ButtonProps) {
  const base: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Sora', system-ui, sans-serif",
    fontWeight: 500,
    letterSpacing: '-0.01em',
    borderRadius: '6px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    transition: 'background 150ms ease, box-shadow 150ms ease, border-color 150ms ease',
    outline: 'none',
    whiteSpace: 'nowrap',
    width: fullWidth ? '100%' : undefined,
    lineHeight: 1,
    ...(SIZES[size] ?? SIZES.md),
    ...(VARIANTS[variant] ?? VARIANTS.primary),
  }

  return (
    <button type={type} style={base} disabled={disabled} onClick={onClick}>
      {iconLeft && <span style={{ display: 'flex', alignItems: 'center' }}>{iconLeft}</span>}
      {children}
      {iconRight && <span style={{ display: 'flex', alignItems: 'center' }}>{iconRight}</span>}
    </button>
  )
}
