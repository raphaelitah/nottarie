import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { supabase } from '../lib/supabase'
import { HoverIconButton, SectionAddButton, Badge, trashIcon } from '../design-system'
import type { Personne, PersonneMoraleContact } from '../types/database'
import { personneDisplayName } from './personneForm'
import { FONCTION_CONTACT_OPTIONS } from '../constants/personneTypes'
import { PersonneMoraleContactFormDrawer, type PersonneMoraleContactFormResult } from './PersonneMoraleContactFormDrawer'

interface PersonneMoraleContactsSectionProps {
  tenantId: string
  personneMoraleId: string
}

function contactDisplayName(c: PersonneMoraleContact): string {
  return c.personne_physique ? personneDisplayName(c.personne_physique) : (c.nom_libre ?? 'Contact sans nom')
}

function fonctionLabel(fonction: string | null): string | null {
  return FONCTION_CONTACT_OPTIONS.find((f) => f.value === fonction)?.label ?? fonction
}

export function PersonneMoraleContactsSection({ tenantId, personneMoraleId }: PersonneMoraleContactsSectionProps) {
  const [contacts, setContacts] = useState<PersonneMoraleContact[]>([])
  const [personnesPhysiques, setPersonnesPhysiques] = useState<Personne[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)

  async function loadContacts() {
    setLoading(true)
    const { data, error } = await supabase
      .from('personne_morale_contacts')
      .select('*, personne_physique:personnes!personne_morale_contacts_personne_physique_id_fkey(*)')
      .eq('personne_morale_id', personneMoraleId)
      .order('created_at')
    if (error) setError('Impossible de charger les contacts : ' + error.message)
    else setError(null)
    setContacts(data ?? [])
    setLoading(false)
  }

  async function loadPersonnesPhysiques() {
    const { data } = await supabase
      .from('personnes')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('type', 'physique')
      .is('archived_at', null)
      .order('created_at', { ascending: false })
    setPersonnesPhysiques(data ?? [])
  }

  useEffect(() => {
    loadContacts(); loadPersonnesPhysiques()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, personneMoraleId])

  async function handleAdd(result: PersonneMoraleContactFormResult) {
    setSaving(true)
    setError(null)
    const { error } = await supabase.from('personne_morale_contacts').insert({
      tenant_id: tenantId,
      personne_morale_id: personneMoraleId,
      personne_physique_id: result.personnePhysiqueId,
      nom_libre: result.nomLibre,
      fonction: result.fonction || null,
      email: result.email.trim() || null,
      telephone: result.telephone.trim() || null,
      is_principal: result.isPrincipal,
    })
    setSaving(false)
    if (error) {
      setError(error.code === '23505'
        ? 'Cette personne est déjà contact pour cette personne morale.'
        : "Erreur lors de l'ajout du contact : " + error.message)
      return
    }
    setDrawerOpen(false)
    loadContacts()
  }

  async function handleRemove(contact: PersonneMoraleContact) {
    setRemovingId(contact.id)
    const { error } = await supabase.from('personne_morale_contacts').delete().eq('id', contact.id)
    setRemovingId(null)
    if (error) { setError('Erreur lors de la suppression : ' + error.message); return }
    loadContacts()
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
        <h3 style={h3}>Contacts</h3>
        <SectionAddButton label="Ajouter un contact" onClick={() => setDrawerOpen(true)} />
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
      ) : contacts.length === 0 ? (
        <div style={emptyCard}>Aucun contact rattaché à cette personne morale.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {contacts.map((c) => (
            <div key={c.id} style={row}>
              <div style={{ minWidth: 0 }}>
                <span style={name}>{contactDisplayName(c)}</span>
                {c.is_principal && <Badge status="signed" label="Principal" />}
                {fonctionLabel(c.fonction) && <span style={meta}>{fonctionLabel(c.fonction)}</span>}
                {c.email && <span style={meta}>{c.email}</span>}
                {c.telephone && <span style={meta}>{c.telephone}</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <HoverIconButton icon={trashIcon} label="Retirer" disabled={removingId === c.id} onClick={() => handleRemove(c)} />
              </div>
            </div>
          ))}
        </div>
      )}

      <PersonneMoraleContactFormDrawer
        open={drawerOpen}
        personnesPhysiques={personnesPhysiques}
        saving={saving}
        onSave={handleAdd}
        onClose={() => setDrawerOpen(false)}
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
  marginRight: 'var(--space-3)',
}

const meta: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xs)',
  color: 'var(--text-muted)',
  marginLeft: 'var(--space-3)',
}
