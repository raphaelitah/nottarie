import { Button } from './Button'
import { useMediaQuery } from './useMediaQuery'

// Below this width, a two-column section grid (e.g. Comparants/Immeubles,
// Actes/Documents on the dossier page) no longer has room for "+ <label>"
// next to the section heading without the two crowding into each other.
const COMPACT_QUERY = '(max-width: 900px)'

interface SectionAddButtonProps {
  label: string
  busyLabel?: string
  disabled?: boolean
  onClick?: () => void
}

export function SectionAddButton({ label, busyLabel, disabled, onClick }: SectionAddButtonProps) {
  const compact = useMediaQuery(COMPACT_QUERY)
  const busy = Boolean(busyLabel)

  if (compact) {
    return (
      <Button variant="primary" size="sm" disabled={disabled} onClick={onClick} title={busy ? busyLabel : label}>
        {busy ? '…' : '+'}
      </Button>
    )
  }

  return (
    <Button variant="primary" size="sm" disabled={disabled} onClick={onClick}>
      {busy ? busyLabel : `+ ${label}`}
    </Button>
  )
}
