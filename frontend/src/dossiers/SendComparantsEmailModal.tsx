import { useEffect, useState } from 'react'
import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { Button, Input, Modal, Textarea } from '../design-system'

export interface EmailRecipient {
  email: string
  label: string
}

interface SendComparantsEmailModalProps {
  dossierId: string
  recipients: EmailRecipient[] | null
  onClose: () => void
  onSent: () => void
}

export function SendComparantsEmailModal({ dossierId, recipients, onClose, onSent }: SendComparantsEmailModalProps) {
  const [objet, setObjet] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [noMailboxConnected, setNoMailboxConnected] = useState(false)

  useEffect(() => {
    if (!recipients) return
    setObjet('')
    setMessage('')
    setError(null)
    setNoMailboxConnected(false)
  }, [recipients])

  if (!recipients) return null

  async function handleSend() {
    if (!recipients) return
    if (!objet.trim()) { setError("L'objet est requis."); return }
    setSending(true)
    setError(null)
    setNoMailboxConnected(false)
    const { error: sendError } = await supabase.functions.invoke('send-email', {
      body: {
        dossier_id: dossierId,
        to: recipients.map((r) => r.email),
        subject: objet.trim(),
        body_html: message.trim() ? `<p>${message.trim().replace(/\n/g, '<br/>')}</p>` : '',
      },
    })
    setSending(false)
    if (sendError) {
      if (sendError instanceof FunctionsHttpError && (await sendError.context.json().catch(() => null))?.error === 'no_mailbox_connected') {
        setNoMailboxConnected(true)
      } else {
        setError("L'envoi a échoué : " + sendError.message)
      }
      return
    }
    onSent()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={recipients.length === 1 ? `Envoyer un email à ${recipients[0].label}` : `Envoyer un email à ${recipients.length} comparants`}
      size="sm"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>Annuler</Button>
          <Button variant="primary" size="sm" disabled={sending} onClick={handleSend}>
            {sending ? 'Envoi…' : 'Envoyer'}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {error && (
          <div style={{
            background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px',
            padding: '10px 14px', fontFamily: 'var(--font-sans)', fontSize: '13px', color: '#DC2626',
          }}>{error}</div>
        )}
        {noMailboxConnected && (
          <div style={{
            background: '#FEF9C3', border: '1px solid #FDE68A', borderRadius: '6px',
            padding: '10px 14px', fontFamily: 'var(--font-sans)', fontSize: '13px', color: '#713F12',
          }}>Aucune messagerie Outlook n'est connectée. Rendez-vous dans « Mon compte » pour la connecter.</div>
        )}

        <div>
          <div style={sectionLabel}>Destinataires</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {recipients.map((r) => (
              <span key={r.email} style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: '#716E84' }}>
                {r.label} — {r.email}
              </span>
            ))}
          </div>
        </div>

        <Input
          label="Objet"
          value={objet}
          onChange={(e) => setObjet(e.target.value)}
        />

        <Textarea
          label="Message"
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>
    </Modal>
  )
}

const sectionLabel = {
  fontFamily: 'var(--font-sans)',
  fontSize: '13px',
  fontWeight: 600,
  color: 'var(--n-900)',
  marginBottom: '8px',
} as const
