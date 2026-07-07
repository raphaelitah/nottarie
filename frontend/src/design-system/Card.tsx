import { type BadgeStatus } from './Badge'

type ActType = 'vente' | 'succession' | 'bail' | 'procuration' | 'donation' | 'hypotheque'

const ACT_TYPES: Record<string, { label: string; bg: string; color: string }> = {
  vente:       { label: 'Acte de vente',   bg: '#DBEAFE', color: '#1E3A8A' },
  succession:  { label: 'Succession',      bg: '#E6F4EC', color: '#14532D' },
  bail:        { label: 'Bail commercial', bg: '#FEF9C3', color: '#713F12' },
  procuration: { label: 'Procuration',     bg: '#EDECF2', color: '#575468' },
  donation:    { label: 'Donation',        bg: '#FEE2E2', color: '#7F1D1D' },
  hypotheque:  { label: 'Hypothèque',      bg: '#F3E8FF', color: '#6B21A8' },
}

const STATUS: Record<string, { label: string; bg: string; color: string }> = {
  signed:   { label: 'Signé',      bg: '#E6F4EC', color: '#14532D' },
  ongoing:  { label: 'En cours',   bg: '#DBEAFE', color: '#1E3A8A' },
  pending:  { label: 'En attente', bg: '#FEF9C3', color: '#713F12' },
  draft:    { label: 'Brouillon',  bg: '#EDECF2', color: '#575468' },
  refused:  { label: 'Refusé',     bg: '#FEE2E2', color: '#7F1D1D' },
  archived: { label: 'Archivé',    bg: '#F5F5F8', color: '#9B98AC' },
}

interface CardProps {
  reference?: string
  actType?: ActType | string
  parties?: string
  notary?: string
  date?: string
  status?: BadgeStatus | string
  selected?: boolean
  onClick?: () => void
}

export function Card({ reference, actType, parties, notary, date, status, selected = false, onClick }: CardProps) {
  const act = (actType ? ACT_TYPES[actType] : undefined) ?? { label: actType ?? '', bg: '#EDECF2', color: '#575468' }
  const st  = (status ? STATUS[status] : undefined) ?? STATUS.ongoing

  return (
    <div
      onClick={onClick}
      style={{
        background: selected ? '#F6F3EE' : '#FFFFFF',
        border: selected ? '1.5px solid #1E2D45' : '1px solid #E0DFE8',
        borderRadius: '10px',
        padding: '16px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 150ms ease, border-color 150ms ease',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center',
          padding: '3px 8px', borderRadius: '4px',
          fontSize: '12px', fontWeight: 500,
          fontFamily: "'Sora', system-ui, sans-serif",
          background: act.bg, color: act.color,
          letterSpacing: '-0.01em',
        }}>{act.label}</span>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '11px', fontWeight: 500,
          color: '#9B98AC', letterSpacing: '0.02em',
        }}>{reference}</span>
      </div>

      <div>
        <div style={{
          fontFamily: "'Sora', system-ui, sans-serif",
          fontSize: '15px', fontWeight: 600,
          color: '#1A1924', letterSpacing: '-0.02em',
          whiteSpace: 'nowrap', overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>{parties}</div>
        {notary && (
          <div style={{
            fontFamily: "'Sora', system-ui, sans-serif",
            fontSize: '12px', color: '#716E84', marginTop: '2px',
          }}>Me. {notary}</div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: "'Sora', system-ui, sans-serif", fontSize: '12px', color: '#9B98AC' }}>{date}</span>
        <span style={{
          display: 'inline-flex', alignItems: 'center',
          padding: '3px 8px', borderRadius: '4px',
          fontSize: '12px', fontWeight: 500,
          fontFamily: "'Sora', system-ui, sans-serif",
          background: st.bg, color: st.color,
        }}>{st.label}</span>
      </div>
    </div>
  )
}
