import { type CSSProperties } from 'react'

export type BadgeStatus = 'signed' | 'ongoing' | 'pending' | 'draft' | 'refused' | 'archived' | 'published'
type BadgeSize = 'sm' | 'md'

const STATUS: Record<BadgeStatus, { label: string; bg: string; color: string }> = {
  signed:    { label: 'Signé',      bg: '#E6F4EC', color: '#14532D' },
  ongoing:   { label: 'En cours',   bg: '#DBEAFE', color: '#1E3A8A' },
  pending:   { label: 'En attente', bg: '#FEF9C3', color: '#713F12' },
  draft:     { label: 'Brouillon',  bg: '#EDECF2', color: '#575468' },
  refused:   { label: 'Refusé',     bg: '#FEE2E2', color: '#7F1D1D' },
  archived:  { label: 'Archivé',    bg: '#F5F5F8', color: '#9B98AC' },
  published: { label: 'Publié',     bg: '#E6F4EC', color: '#14532D' },
}

const SIZES: Record<BadgeSize, CSSProperties> = {
  sm: { fontSize: '11px', padding: '2px 7px', height: '20px' },
  md: { fontSize: '12px', padding: '3px 9px', height: '22px' },
}

interface BadgeProps {
  status: BadgeStatus | string
  label?: string
  size?: BadgeSize
  dot?: boolean
}

export function Badge({ status, label, size = 'md', dot = false }: BadgeProps) {
  const cfg = STATUS[status as BadgeStatus] ?? { label: status, bg: '#EDECF2', color: '#575468' }
  const displayLabel = label ?? cfg.label

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: dot ? '5px' : 0,
      borderRadius: '4px',
      fontFamily: "'Sora', system-ui, sans-serif",
      fontWeight: 500,
      letterSpacing: '0.01em',
      background: cfg.bg,
      color: cfg.color,
      ...(SIZES[size] ?? SIZES.md),
    }}>
      {dot && (
        <span style={{
          width: '5px', height: '5px',
          borderRadius: '50%',
          background: cfg.color,
          flexShrink: 0,
        }} />
      )}
      {displayLabel}
    </span>
  )
}
