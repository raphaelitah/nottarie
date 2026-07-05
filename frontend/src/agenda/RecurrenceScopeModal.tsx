import { Modal, Button } from '../design-system'

export type RecurrenceScope = 'occurrence' | 'series'

interface RecurrenceScopeModalProps {
  open: boolean
  action: 'edit' | 'delete'
  onChoose: (scope: RecurrenceScope) => void
  onClose: () => void
}

export function RecurrenceScopeModal({ open, action, onChoose, onClose }: RecurrenceScopeModalProps) {
  const verb = action === 'edit' ? 'Modifier' : 'Supprimer'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${verb} un événement récurrent`}
      subtitle="Cet événement fait partie d'une série. Que voulez-vous faire ?"
      size="sm"
      footer={<Button variant="secondary" size="sm" onClick={onClose}>Annuler</Button>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <Button variant="secondary" fullWidth onClick={() => onChoose('occurrence')}>Cet événement seul</Button>
        <Button variant="primary" fullWidth onClick={() => onChoose('series')}>Toute la série</Button>
      </div>
    </Modal>
  )
}
