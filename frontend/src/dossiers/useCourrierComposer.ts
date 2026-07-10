import { useEffect, useState } from 'react'
import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { CourrierFormResult } from './CourrierFormDrawer'
import { useAuth } from '../auth/useAuth'

export function useCourrierComposer(tenantId: string, dossierId: string, onSaved: () => void) {
  const { memberships } = useAuth()
  const membership = memberships.find((m) => m.tenant_id === tenantId) ?? null
  const [fromEmail, setFromEmail] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [initialDestinataireIds, setInitialDestinataireIds] = useState<string[]>([])
  const [initialDocumentIds, setInitialDocumentIds] = useState<string[]>([])
  const [initialObjet, setInitialObjet] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [noMailboxConnected, setNoMailboxConnected] = useState(false)

  useEffect(() => {
    if (!membership) { setFromEmail(null); return }
    supabase
      .from('mailbox_connections')
      .select('email_address, status')
      .eq('utilisateur_id', membership.id)
      .eq('provider', 'outlook')
      .maybeSingle()
      .then(({ data }) => setFromEmail(data && data.status === 'active' ? data.email_address : null))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [membership?.id])

  function openComposer(destinataireIds: string[] = [], documentIds: string[] = [], objet = '') {
    setInitialDestinataireIds(destinataireIds)
    setInitialDocumentIds(documentIds)
    setInitialObjet(objet)
    setDrawerOpen(true)
  }

  async function handleAdd(result: CourrierFormResult) {
    setSaving(true)
    setError(null)
    setNoMailboxConnected(false)
    const { data: courrier, error } = await supabase.from('courriers').insert({
      tenant_id: tenantId,
      dossier_id: dossierId,
      objet: result.objet,
      contenu: result.contenu || null,
      destinataire: result.destinataire,
      destinataires: result.destinataires,
    }).select().single()
    if (error) {
      setSaving(false)
      setError("Erreur lors de l'enregistrement du courrier : " + error.message)
      return
    }

    if (result.documentIds.length) {
      await supabase.from('courrier_documents').insert(
        result.documentIds.map((document_id) => ({ tenant_id: tenantId, courrier_id: courrier.id, document_id }))
      )
    }

    if (result.invitationCalendaire && result.destinataires.length > 0) {
      const { error: inviteError } = await supabase.functions.invoke('create-calendar-event', {
        body: {
          dossier_id: dossierId,
          titre: result.invitationCalendaire.titre,
          lieu: result.invitationCalendaire.lieu || null,
          debut: result.invitationCalendaire.debut,
          fin: result.invitationCalendaire.fin,
          attendees: result.destinataires,
        },
      })
      if (inviteError) {
        if (inviteError instanceof FunctionsHttpError && (await inviteError.context.json().catch(() => null))?.error === 'no_mailbox_connected') {
          setNoMailboxConnected(true)
        } else {
          setError("Le courrier a été enregistré, mais l'envoi de l'invitation calendaire a échoué : " + inviteError.message)
        }
      }
    }

    if (result.send) {
      const { error: sendError } = await supabase.functions.invoke('send-email', {
        body: {
          dossier_id: dossierId,
          courrier_id: courrier.id,
          to: result.destinataires,
          subject: result.objet,
          body_html: (result.contenu || '').replace(/\n/g, '<br>'),
          document_ids: result.documentIds,
        },
      })
      if (sendError) {
        setSaving(false)
        if (sendError instanceof FunctionsHttpError && (await sendError.context.json().catch(() => null))?.error === 'no_mailbox_connected') {
          setNoMailboxConnected(true)
        } else {
          setError("Le courrier a été enregistré, mais l'envoi par email a échoué : " + sendError.message)
          await supabase.from('courriers').update({
            dernier_envoi_echec_at: new Date().toISOString(),
            dernier_envoi_erreur: sendError.message,
          }).eq('id', courrier.id)
        }
        setDrawerOpen(false)
        onSaved()
        return
      }
    }

    setSaving(false)
    setDrawerOpen(false)
    onSaved()
  }

  return {
    fromEmail,
    drawerOpen,
    initialDestinataireIds,
    initialDocumentIds,
    initialObjet,
    saving,
    error,
    noMailboxConnected,
    openComposer,
    closeComposer: () => setDrawerOpen(false),
    handleAdd,
  }
}
