import { useState, type ReactNode } from 'react'

interface HoverIconButtonProps {
  icon: (color: string) => ReactNode
  label: string
  onClick?: () => void
  disabled?: boolean
  danger?: boolean
}

export function HoverIconButton({ icon, label, onClick, disabled, danger = false }: HoverIconButtonProps) {
  const [hovered, setHovered] = useState(false)
  const activeColor = danger ? '#991B1B' : '#1E2D45'
  const showLabel = hovered && !disabled

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={label}
      aria-label={label}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        height: '32px',
        padding: showLabel ? '0 10px' : '0 8px',
        background: showLabel ? (danger ? '#FEF2F2' : 'var(--n-100)') : 'transparent',
        border: '1px solid',
        borderColor: showLabel ? (danger ? '#FECACA' : 'var(--border-default)') : 'transparent',
        borderRadius: 'var(--radius-md)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 120ms ease',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
      }}
    >
      {icon(showLabel ? activeColor : '#716E84')}
      {showLabel && (
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-xs)', fontWeight: 600, color: activeColor }}>
          {label}
        </span>
      )}
    </button>
  )
}
