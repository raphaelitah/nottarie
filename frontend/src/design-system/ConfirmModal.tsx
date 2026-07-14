import { Button } from './Button'
import { Modal } from './Modal'

interface ConfirmModalProps {
  open: boolean
  title: string
  subtitle?: string
  children: React.ReactNode
  confirmLabel?: string
  confirmingLabel?: string
  confirming?: boolean
  onConfirm: () => void
  onClose: () => void
}

// Shared confirm-before-destroying dialog, factored out of the pattern
// already used for dossier deletion so every delete/unlink/revoke action
// gets the same "are you sure" step instead of firing on a single click.
export function ConfirmModal({
  open,
  title,
  subtitle,
  children,
  confirmLabel = 'Supprimer',
  confirmingLabel = 'Suppression…',
  confirming = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      size="sm"
      footer={(
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>Annuler</Button>
          <Button variant="destructive" size="sm" disabled={confirming} onClick={onConfirm}>
            {confirming ? confirmingLabel : confirmLabel}
          </Button>
        </>
      )}
    >
      {children}
    </Modal>
  )
}
