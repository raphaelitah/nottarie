import { useEffect, useMemo, useState } from 'react'
import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { Button, HoverIconButton, Input, Modal, MultiSelect, trashIcon } from '../design-system'
import type { MultiSelectOption } from '../design-system'
import type { Comparant, DocumentRow, Utilisateur } from '../types/database'
import { personneDisplayName } from '../personnes/personneForm'

interface SendDocumentsModalProps {
  tenantId: string
  dossierId: string
  documents: DocumentRow[] | null
  onClose: () => void
  onSent: () => void
}

export function SendDocumentsModal({ tenantId, dossierId, documents, onClose, onSent }: SendDocumentsModalProps) {
  const [objet, setObjet] = useState('')
  const [comparants, setComparants] = useState<Comparant[]>([])
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([])
  const [selectedEmails, setSelectedEmails] = useState<string[]>([])
  const [manualEmails, setManualEmails] = useState<string[]>([])
  const [manualEmailInput, setManualEmailInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [noMailboxConnected, setNoMailboxConnected] = useState(false)
  const [recipientsPickerOpen, setRecipientsPickerOpen] = useState(false)

  useEffect(() => {
    if (!documents) return
    setObjet(documents.length === 1 ? documents[0].nom : `${documents.length} documents`)
    setSelectedEmails([])
    setManualEmails([])
    setManualEmailInput('')
    setError(null)
    setNoMailboxConnected(false)
    supabase
      .from('comparants')
      .select('*, personne:personnes(*)')
      .eq('dossier_id', dossierId)
      .then(({ data }) => setComparants(data ?? []))
    supabase
      .from('utilisateurs')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('actif', true)
      .then(({ data }) => setUtilisateurs(data ?? []))
  }, [documents, dossierId, tenantId])

  const contactOptions: MultiSelectOption[] = useMemo(() => [
    ...comparants
      .filter((c) => c.personne?.email)
      .map((c) => ({
        value: c.personne!.email as string,
        label: personneDisplayName(c.personne!),
        sublabel: c.personne!.email as string,
        group: 'Comparants du dossier',
      })),
    ...utilisateurs
      .filter((u) => u.email)
      .map((u) => ({
        value: u.email as string,
        label: [u.prenom, u.nom].filter(Boolean).join(' ') || 'Sans nom',
        sublabel: u.email as string,
        group: "Personnel de l'étude",
      })),
  ], [comparants, utilisateurs])

  if (!documents) return null

  function addManualEmail() {
    const email = manualEmailInput.trim()
    if (!email) return
    if (!manualEmails.includes(email)) setManualEmails((prev) => [...prev, email])
    setManualEmailInput('')
  }

  function removeManualEmail(email: string) {
    setManualEmails((prev) => prev.filter((e) => e !== email))
  }

  const recipients = Array.from(new Set([...selectedEmails, ...manualEmails]))

  async function handleSend() {
    if (!documents) return
    if (recipients.length === 0) { setError("Au moins un destinataire est requis."); return }
    setSending(true)
    setError(null)
    setNoMailboxConnected(false)
    const { error: sendError } = await supabase.functions.invoke('send-email', {
      body: {
        dossier_id: dossierId,
        to: recipients,
        subject: objet.trim() || 'Documents',
        body_html: '',
        document_ids: documents.map((d) => d.id),
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
      title={documents.length === 1 ? `Envoyer « ${documents[0].nom} »` : `Envoyer ${documents.length} documents`}
      size="sm"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>Annuler</Button>
          <Button
            variant="primary"
            size="sm"
            disabled={sending || recipientsPickerOpen}
            title={recipientsPickerOpen ? 'Terminez la sélection des destinataires avant d\'envoyer.' : undefined}
            onClick={handleSend}
          >
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

        <Input
          label="Objet"
          value={objet}
          onChange={(e) => setObjet(e.target.value)}
        />

        <div>
          <MultiSelect
            label="Destinataires"
            placeholder="Comparants, personnel de l'étude…"
            options={contactOptions}
            value={selectedEmails}
            onChange={setSelectedEmails}
            onOpenChange={setRecipientsPickerOpen}
          />

          <div style={{ ...subLabel, marginTop: '12px' }}>Autre adresse email</div>
          {manualEmails.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
              {manualEmails.map((email) => (
                <div key={email} style={fileRow}>
                  <span>{email}</span>
                  <HoverIconButton icon={trashIcon} label="Retirer" danger onClick={() => removeManualEmail(email)} />
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <Input
                type="email"
                placeholder="ex. client@exemple.fr"
                value={manualEmailInput}
                onChange={(e) => setManualEmailInput(e.target.value)}
              />
            </div>
            <Button variant="secondary" size="sm" onClick={addManualEmail}>Ajouter</Button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={sectionLabel}>Pièces jointes</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {documents.map((d) => (
              <span key={d.id} style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: '#716E84' }}>{d.nom}</span>
            ))}
          </div>
        </div>
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

const subLabel = {
  fontFamily: 'var(--font-sans)',
  fontSize: '12px',
  fontWeight: 500,
  color: '#716E84',
  marginBottom: '2px',
} as const

const fileRow = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  fontFamily: 'var(--font-sans)',
  fontSize: '13px',
  color: 'var(--n-900)',
} as const
