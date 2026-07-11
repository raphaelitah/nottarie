import { useState, type ReactNode } from 'react'
import { Tooltip } from './Tooltip'

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
  const active = hovered && !disabled

  return (
    <Tooltip label={label} disabled={disabled}>
      <button
        type="button"
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label={label}
        disabled={disabled}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '32px',
          height: '32px',
          background: active ? (danger ? '#FEF2F2' : 'var(--n-100)') : 'transparent',
          border: '1px solid',
          borderColor: active ? (danger ? '#FECACA' : 'var(--border-default)') : 'transparent',
          borderRadius: 'var(--radius-md)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          transition: 'all 120ms ease',
        }}
      >
        {icon(active ? activeColor : '#716E84')}
      </button>
    </Tooltip>
  )
}
