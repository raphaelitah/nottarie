import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Drawer, Button, Input, MultiSelect, Textarea, HoverIconButton, trashIcon } from '../design-system'
import type { Comparant, Utilisateur } from '../types/database'
import { personneDisplayName } from '../personnes/personneForm'
import { ROLE_OPTIONS } from '../constants/roles'

export interface CourrierInvitationCalendaire {
  titre: string
  lieu: string
  debut: string
  fin: string
}

export interface CourrierFormResult {
  objet: string
  contenu: string
  destinataire: string | null
  destinataires: string[]
  send: boolean
  documentIds: string[]
  invitationCalendaire: CourrierInvitationCalendaire | null
}

interface CourrierFormDrawerProps {
  open: boolean
  saving: boolean
  tenantId: string
  dossierId: string
  fromEmail: string | null
  onSave: (result: CourrierFormResult) => void
  onClose: () => void
}

export function CourrierFormDrawer({ open, saving, tenantId, dossierId, fromEmail, onSave, onClose }: CourrierFormDrawerProps) {
  const [objet, setObjet] = useState('')
  const [contenu, setContenu] = useState('')
  const [destinataireIds, setDestinataireIds] = useState<string[]>([])
  const [customEmail, setCustomEmail] = useState('')
  const [customEmails, setCustomEmails] = useState<string[]>([])
  const [comparants, setComparants] = useState<Comparant[]>([])
  const [etudeUsers, setEtudeUsers] = useState<Utilisateur[]>([])
  const [error, setError] = useState<string | null>(null)
  const [existingDocuments, setExistingDocuments] = useState<{ id: string; nom: string }[]>([])
  const [selectedExistingIds, setSelectedExistingIds] = useState<string[]>([])
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [addInvitation, setAddInvitation] = useState(false)
  const [inviteLieu, setInviteLieu] = useState('')
  const [inviteDebut, setInviteDebut] = useState('')
  const [inviteFin, setInviteFin] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setObjet('')
    setContenu('')
    setDestinataireIds([])
    setCustomEmail('')
    setCustomEmails([])
    setError(null)
    setSelectedExistingIds([])
    setNewFiles([])
    setAddInvitation(false)
    setInviteLieu('')
    setInviteDebut('')
    setInviteFin('')
    supabase
      .from('documents')
      .select('id, nom')
      .eq('dossier_id', dossierId)
      .is('acte_id', null)
      .order('created_at', { ascending: false })
      .then(({ data }) => setExistingDocuments(data ?? []))
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
      .order('nom', { ascending: true })
      .then(({ data }) => setEtudeUsers(data ?? []))
  }, [open, dossierId, tenantId])

  const destinataireOptions = useMemo(() => {
    const comparantOptions = comparants
      .filter((c) => c.personne)
      .map((c) => ({
        value: `personne:${c.personne!.id}`,
        label: personneDisplayName(c.personne!),
        sublabel: c.personne!.email ?? undefined,
        group: 'Comparants du dossier',
        disabled: !c.personne!.email,
      }))
    const userOptions = etudeUsers.map((u) => ({
      value: `user:${u.id}`,
      label: `${u.prenom ?? ''} ${u.nom ?? ''}`.trim() || 'Utilisateur',
      sublabel: u.email ?? undefined,
      badges: u.roles.map((r) => ROLE_OPTIONS.find((o) => o.value === r)?.label ?? r),
      group: 'Personnes de l\'étude',
      disabled: !u.email,
    }))
    return [...comparantOptions, ...userOptions]
  }, [comparants, etudeUsers])

  const destinataireEmails = useMemo(() => {
    const fromSelection = destinataireIds
      .map((id) => {
        if (id.startsWith('personne:')) return comparants.find((c) => c.personne_id === id.slice('personne:'.length))?.personne?.email
        if (id.startsWith('user:')) return etudeUsers.find((u) => u.id === id.slice('user:'.length))?.email
        return undefined
      })
      .filter((e): e is string => !!e)
    return [...new Set([...fromSelection, ...customEmails])]
  }, [destinataireIds, customEmails, comparants, etudeUsers])

  function addCustomEmail() {
    const email = customEmail.trim()
    if (!email) return
    if (!customEmails.includes(email)) setCustomEmails((prev) => [...prev, email])
    setCustomEmail('')
  }

  function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length) setNewFiles((prev) => [...prev, ...files])
  }

  function removeNewFile(index: number) {
    setNewFiles((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(send: boolean) {
    if (!objet.trim()) { setError("L'objet est obligatoire."); return }
    if (send && destinataireEmails.length === 0) { setError("Au moins un destinataire est obligatoire pour envoyer par email."); return }
    if (addInvitation && (!inviteDebut || !inviteFin)) { setError("La date de début et de fin de l'invitation calendaire sont obligatoires."); return }
    if (addInvitation && destinataireEmails.length === 0) { setError("Un destinataire est requis pour envoyer une invitation calendaire."); return }
    setError(null)

    let uploadedIds: string[] = []
    if (newFiles.length) {
      setUploading(true)
      try {
        uploadedIds = await Promise.all(newFiles.map(async (file) => {
          const storagePath = `${tenantId}/dossiers/${dossierId}/documents/${crypto.randomUUID()}-${file.name}`
          const { error: uploadError } = await supabase.storage.from('documents').upload(storagePath, file)
          if (uploadError) throw new Error(uploadError.message)
          const { data: doc, error: insertError } = await supabase.from('documents').insert({
            tenant_id: tenantId,
            dossier_id: dossierId,
            nom: file.name,
            storage_path: storagePath,
          }).select().single()
          if (insertError) throw new Error(insertError.message)
          return doc.id as string
        }))
      } catch (err) {
        setUploading(false)
        setError("Erreur lors de l'envoi d'une pièce jointe : " + (err instanceof Error ? err.message : String(err)))
        return
      }
      setUploading(false)
    }

    onSave({
      objet: objet.trim(),
      contenu: contenu.trim(),
      destinataire: destinataireEmails[0] ?? null,
      destinataires: destinataireEmails,
      send,
      documentIds: [...selectedExistingIds, ...uploadedIds],
      invitationCalendaire: addInvitation
        ? { titre: objet.trim(), lieu: inviteLieu.trim(), debut: inviteDebut, fin: inviteFin }
        : null,
    })
  }

  const busy = saving || uploading

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Nouveau courrier"
      size="lg"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>Annuler</Button>
          <Button variant="secondary" size="sm" onClick={() => handleSubmit(false)} disabled={busy}>
            {busy ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
          <Button variant="primary" size="sm" onClick={() => handleSubmit(true)} disabled={busy}>
            {busy ? 'Envoi…' : 'Enregistrer et envoyer par email'}
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
        <Input label="De" value={fromEmail ?? 'Aucune messagerie connectée'} disabled />
        <Input
          label="Objet"
          required
          placeholder="ex. Demande de pièces complémentaires"
          value={objet}
          onChange={(e) => setObjet(e.target.value)}
        />
        <MultiSelect
          label="Destinataires"
          placeholder="Choisir des comparants ou des personnes de l'étude…"
          options={destinataireOptions}
          value={destinataireIds}
          onChange={setDestinataireIds}
        />
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <Input
              label="Adresse email supplémentaire"
              type="email"
              placeholder="ex. client@exemple.fr"
              value={customEmail}
              onChange={(e) => setCustomEmail(e.target.value)}
            />
          </div>
          <Button variant="secondary" size="sm" onClick={addCustomEmail}>Ajouter</Button>
        </div>
        {customEmails.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {customEmails.map((email) => (
              <span key={email} style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                background: '#EFEEF6', borderRadius: '4px', padding: '2px 6px',
                fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--n-900)', cursor: 'pointer',
              }} onClick={() => setCustomEmails((prev) => prev.filter((e) => e !== email))}>
                {email} <span style={{ color: '#716E84' }}>×</span>
              </span>
            ))}
          </div>
        )}
        <Textarea
          label="Contenu"
          rows={12}
          placeholder="Corps du courrier…"
          value={contenu}
          onChange={(e) => setContenu(e.target.value)}
        />

        <div>
          {existingDocuments.length > 0 && (
            <div style={{ marginBottom: '10px' }}>
              <MultiSelect
                label="Pièces jointes du dossier"
                placeholder="Choisir des documents existants du dossier…"
                options={existingDocuments.map((d) => ({ value: d.id, label: d.nom }))}
                value={selectedExistingIds}
                onChange={setSelectedExistingIds}
              />
            </div>
          )}

          {newFiles.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
              {newFiles.map((f, i) => (
                <div key={i} style={fileRow}>
                  <span>{f.name}</span>
                  <HoverIconButton icon={trashIcon} label="Retirer" danger onClick={() => removeNewFile(i)} />
                </div>
              ))}
            </div>
          )}

          <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
            Joindre un fichier
          </Button>
          <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} onChange={handleFilesSelected} />
        </div>

        <div>
          <label style={checkboxRow}>
            <input type="checkbox" checked={addInvitation} onChange={(e) => setAddInvitation(e.target.checked)} />
            <span style={label}>Ajouter une invitation calendaire</span>
          </label>
          {addInvitation && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
              <Input
                label="Lieu"
                placeholder="ex. À l'étude"
                value={inviteLieu}
                onChange={(e) => setInviteLieu(e.target.value)}
              />
              <div style={{ display: 'flex', gap: '14px' }}>
                <div style={{ flex: 1 }}>
                  <Input
                    label="Début"
                    type="datetime-local"
                    required
                    value={inviteDebut}
                    onChange={(e) => setInviteDebut(e.target.value)}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Input
                    label="Fin"
                    type="datetime-local"
                    required
                    value={inviteFin}
                    onChange={(e) => setInviteFin(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Drawer>
  )
}

const label = {
  fontFamily: 'var(--font-sans)',
  fontSize: '13px',
  fontWeight: 600,
  color: 'var(--n-900)',
  marginBottom: '8px',
} as const

const checkboxRow = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontFamily: 'var(--font-sans)',
  fontSize: '13px',
  color: 'var(--n-900)',
} as const

const fileRow = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  fontFamily: 'var(--font-sans)',
  fontSize: '13px',
  color: 'var(--n-900)',
} as const
