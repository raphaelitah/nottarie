import { useEffect, useState } from 'react'
import { Drawer, Button, Input, Textarea } from '../design-system'

export interface CourrierFormResult {
  objet: string
  contenu: string
  destinataire: string | null
  send: boolean
}

interface CourrierFormDrawerProps {
  open: boolean
  saving: boolean
  onSave: (result: CourrierFormResult) => void
  onClose: () => void
}

export function CourrierFormDrawer({ open, saving, onSave, onClose }: CourrierFormDrawerProps) {
  const [objet, setObjet] = useState('')
  const [contenu, setContenu] = useState('')
  const [destinataire, setDestinataire] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setObjet('')
    setContenu('')
    setDestinataire('')
    setError(null)
  }, [open])

  function handleSubmit(send: boolean) {
    if (!objet.trim()) { setError("L'objet est obligatoire."); return }
    if (send && !destinataire.trim()) { setError("L'adresse du destinataire est obligatoire pour envoyer par email."); return }
    setError(null)
    onSave({ objet: objet.trim(), contenu: contenu.trim(), destinataire: destinataire.trim() || null, send })
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Nouveau courrier"
      size="lg"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>Annuler</Button>
          <Button variant="secondary" size="sm" onClick={() => handleSubmit(false)} disabled={saving}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
          <Button variant="primary" size="sm" onClick={() => handleSubmit(true)} disabled={saving}>
            {saving ? 'Envoi…' : 'Enregistrer et envoyer par email'}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {error && (
          <div style={{
            background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px',
            padding: '10px 14px', fontFamily: 'var(--font-sans)', fontSize: '13px', color: '#DC2626',
          }}>{error}</div>
        )}
        <Input
          label="Objet"
          required
          placeholder="ex. Demande de pièces complémentaires"
          value={objet}
          onChange={(e) => setObjet(e.target.value)}
        />
        <Input
          label="Destinataire"
          type="email"
          placeholder="ex. client@exemple.fr"
          value={destinataire}
          onChange={(e) => setDestinataire(e.target.value)}
        />
        <Textarea
          label="Contenu"
          rows={12}
          placeholder="Corps du courrier…"
          value={contenu}
          onChange={(e) => setContenu(e.target.value)}
        />
      </div>
    </Drawer>
  )
}
