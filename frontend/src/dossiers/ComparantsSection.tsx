import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { supabase } from '../lib/supabase'
import { Button, HoverIconButton, SectionAddButton, sendIcon, trashIcon } from '../design-system'
import type { Comparant, Personne } from '../types/database'
import { personneDisplayName, personneFormToInsertPayload } from '../personnes/personneForm'
import { ComparantFormDrawer, type ComparantFormResult } from './ComparantFormDrawer'
import { SendComparantsEmailModal, type EmailRecipient } from './SendComparantsEmailModal'

interface ComparantsSectionProps {
  tenantId: string
  dossierId: string
  onSelectPersonne?: (id: string) => void
}

export function ComparantsSection({ tenantId, dossierId, onSelectPersonne }: ComparantsSectionProps) {
  const [comparants, setComparants] = useState<Comparant[]>([])
  const [personnes, setPersonnes] = useState<Personne[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [emailRecipients, setEmailRecipients] = useState<EmailRecipient[] | null>(null)

  async function loadComparants() {
    setLoading(true)
    const { data, error } = await supabase
      .from('comparants')
      .select('*, personne:personnes(*)')
      .eq('dossier_id', dossierId)
      .order('created_at')
    if (error) setError('Impossible de charger les comparants : ' + error.message)
    else setError(null)
    setComparants(data ?? [])
    setLoading(false)
  }

  async function loadPersonnes() {
    const { data } = await supabase.from('personnes').select('*').eq('tenant_id', tenantId).is('archived_at', null).order('created_at', { ascending: false })
    setPersonnes(data ?? [])
  }

  useEffect(() => {
    loadComparants(); loadPersonnes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, dossierId])

  async function handleAdd(result: ComparantFormResult) {
    setSaving(true)
    setError(null)

    let personneId = result.personneId
    if (!personneId && result.newPersonne) {
      const { data, error } = await supabase
        .from('personnes')
        .insert(personneFormToInsertPayload(result.newPersonne, tenantId))
        .select()
        .single()
      if (error) { setSaving(false); setError('Erreur lors de la création de la personne : ' + error.message); return }
      personneId = data.id
    }

    const { error } = await supabase.from('comparants').insert({
      tenant_id: tenantId,
      dossier_id: dossierId,
      personne_id: personneId,
      qualite: result.qualite,
    })
    setSaving(false)
    if (error) { setError("Erreur lors de l'ajout du comparant : " + error.message); return }
    setDrawerOpen(false)
    loadComparants()
    loadPersonnes()
  }

  async function handleRemove(comparant: Comparant) {
    setRemovingId(comparant.id)
    const { error } = await supabase.from('comparants').delete().eq('id', comparant.id)
    setRemovingId(null)
    if (error) { setError('Erreur lors de la suppression : ' + error.message); return }
    loadComparants()
  }

  function isEmailable(c: Comparant): boolean {
    return !!c.personne?.email && !c.personne.date_deces
  }

  function toEmailRecipient(c: Comparant): EmailRecipient {
    return { email: c.personne!.email as string, label: personneDisplayName(c.personne!) }
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function handleSent() {
    setEmailRecipients(null)
    setSelectedIds([])
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
        <h3 style={h3}>Comparants</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          {selectedIds.length > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setEmailRecipients(
                comparants.filter((c) => selectedIds.includes(c.id) && isEmailable(c)).map(toEmailRecipient)
              )}
            >
              Envoyer un email ({selectedIds.length})
            </Button>
          )}
          <SectionAddButton label="Ajouter un comparant" onClick={() => setDrawerOpen(true)} />
        </div>
      </div>

      {error && (
        <div style={{
          background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-md)',
          padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-4)',
          fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: '#DC2626',
        }}>{error}</div>
      )}

      {loading ? (
        <div style={emptyCard}>Chargement…</div>
      ) : comparants.length === 0 ? (
        <div style={emptyCard}>Aucun comparant rattaché à ce dossier.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {comparants.map((c) => (
            <div
              key={c.id}
              style={{ ...row, cursor: c.personne && onSelectPersonne ? 'pointer' : 'default' }}
              onClick={() => { if (c.personne && onSelectPersonne) onSelectPersonne(c.personne.id) }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', minWidth: 0 }}>
                {isEmailable(c) && (
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(c.id)}
                    onChange={(e) => { e.stopPropagation(); toggleSelected(c.id) }}
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
                <div style={{ minWidth: 0 }}>
                  <span style={name}>{c.personne ? personneDisplayName(c.personne) : 'Personne inconnue'}</span>
                  <span style={qualite}>{c.qualite}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                {isEmailable(c) && (
                  <HoverIconButton icon={sendIcon} label="Envoyer un email" onClick={() => setEmailRecipients([toEmailRecipient(c)])} />
                )}
                <HoverIconButton icon={trashIcon} label="Retirer" disabled={removingId === c.id} onClick={() => handleRemove(c)} />
              </div>
            </div>
          ))}
        </div>
      )}

      <ComparantFormDrawer
        open={drawerOpen}
        tenantId={tenantId}
        personnes={personnes}
        saving={saving}
        onSave={handleAdd}
        onClose={() => setDrawerOpen(false)}
      />

      <SendComparantsEmailModal
        dossierId={dossierId}
        recipients={emailRecipients}
        onClose={() => setEmailRecipients(null)}
        onSent={handleSent}
      />
    </div>
  )
}

const h3: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-base)',
  fontWeight: 600,
  color: 'var(--n-900)',
  margin: 0,
}

const emptyCard: CSSProperties = {
  background: 'var(--surface-base)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-lg)',
  minHeight: '60px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 'var(--space-3) var(--space-6)',
  textAlign: 'center',
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  color: 'var(--text-muted)',
}

const row: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 'var(--space-4)',
  minHeight: '60px',
  padding: 'var(--space-3) var(--space-4)',
  background: 'var(--surface-base)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-md)',
}

const name: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  fontWeight: 600,
  color: 'var(--n-900)',
}

const qualite: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xs)',
  color: 'var(--text-muted)',
  marginLeft: 'var(--space-3)',
}
