import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { supabase } from '../lib/supabase'
import { Badge, Button, ConfirmModal, EditPenButton } from '../design-system'
import type { Personne } from '../types/database'
import { PERSONNE_TYPE_OPTIONS } from '../constants/personneTypes'
import { useAuth } from '../auth/useAuth'
import { PersonneFields } from './PersonneFields'
import { PersonneDocumentsSection } from './PersonneDocumentsSection'
import { PersonneDossiersSection } from './PersonneDossiersSection'
import { PersonneImmeublesSection } from './PersonneImmeublesSection'
import { PersonneMoraleContactsSection } from './PersonneMoraleContactsSection'
import { PersonneMoraleAssociesSection } from './PersonneMoraleAssociesSection'
import {
  personneToForm,
  personneFormError,
  personneFormToInsertPayload,
  personneDisplayName,
  type PersonneFormValues,
} from './personneForm'

const TABS = [
  { key: 'informations', label: 'Informations' },
  { key: 'dossiers', label: 'Dossiers' },
  { key: 'immeubles', label: 'Immeubles' },
  { key: 'associes', label: 'Associés' },
  { key: 'contacts', label: 'Contacts' },
  { key: 'documents', label: 'Documents' },
] as const

type TabKey = typeof TABS[number]['key']

function personneTypeLabel(type: string): string {
  return PERSONNE_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type
}

interface PersonneDetailPageProps {
  personne: Personne
  onBack: () => void
  onUpdated: (personne: Personne) => void
  onSelectDossier?: (id: string) => void
  onSelectImmeuble?: (id: string) => void
}

export function PersonneDetailPage({ personne, onBack, onUpdated, onSelectDossier, onSelectImmeuble }: PersonneDetailPageProps) {
  const { memberships } = useAuth()
  const membership = memberships.find((m) => m.tenant_id === personne.tenant_id) ?? null
  const canArchive = membership?.roles.some((r) => r === 'administrateur' || r === 'notaire') ?? false

  const [tab, setTab] = useState<TabKey>('informations')
  const [editing, setEditing] = useState(false)
  const [values, setValues] = useState<PersonneFormValues>(() => personneToForm(personne))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [archiving, setArchiving] = useState(false)

  useEffect(() => {
    setValues(personneToForm(personne))
    setEditing(false)
    setTab('informations')
  }, [personne])

  function handleStartEdit() {
    setValues(personneToForm(personne))
    setError(null)
    setEditing(true)
  }

  async function handleSave() {
    const err = personneFormError(values)
    if (err) { setError(err); return }
    setSaving(true)
    setError(null)
    const payload = personneFormToInsertPayload(values, personne.tenant_id)
    const { data, error } = await supabase.from('personnes').update(payload).eq('id', personne.id).select().single()
    setSaving(false)
    if (error) { setError("Erreur lors de l'enregistrement : " + error.message); return }
    setEditing(false)
    onUpdated(data)
  }

  async function handleArchive() {
    setArchiving(true)
    const { error } = await supabase.from('personnes').update({ archived_at: new Date().toISOString() }).eq('id', personne.id)
    setArchiving(false)
    if (error) { setError("Erreur lors de l'archivage : " + error.message); return }
    setArchiveOpen(false)
    onBack()
  }

  return (
    <div>
      <button onClick={onBack} style={breadcrumbBtn}>‹ Personnes</button>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-1)' }}>
            <h1 style={h1}>{personneDisplayName(personne)}</h1>
            <Badge status="ongoing" label={personneTypeLabel(personne.type)} />
          </div>
          {personne.email && <p style={subtitle}>{personne.email}</p>}
        </div>
        {canArchive && (
          <Button variant="destructive" size="sm" onClick={() => setArchiveOpen(true)}>Archiver la personne</Button>
        )}
      </div>

      {error && (
        <div style={{
          background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-md)',
          padding: 'var(--space-3) var(--space-4)', margin: 'var(--space-4) 0',
          fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: '#DC2626',
        }}>{error}</div>
      )}

      <div style={tabBar}>
        {TABS.filter((t) => (t.key !== 'contacts' && t.key !== 'associes') || personne.type === 'morale').map((t) => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)} style={tabBtn(tab === t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'informations' && (
        <div style={{ ...card, marginTop: 'var(--space-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
            <div style={sectionLabel}>Informations</div>
            {editing ? (
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <Button size="sm" variant="secondary" onClick={() => setEditing(false)}>Annuler</Button>
                <Button size="sm" variant="primary" disabled={saving} onClick={handleSave}>
                  {saving ? '…' : 'Enregistrer'}
                </Button>
              </div>
            ) : (
              <EditPenButton label="Modifier les informations" onClick={handleStartEdit} />
            )}
          </div>
          {editing ? (
            <PersonneFields values={values} onChange={setValues} />
          ) : (
            <ReadonlyInformations personne={personne} />
          )}
        </div>
      )}

      {tab === 'dossiers' && (
        <div style={{ marginTop: 'var(--space-6)' }}>
          <PersonneDossiersSection personneId={personne.id} onSelectDossier={onSelectDossier} />
        </div>
      )}

      {tab === 'immeubles' && (
        <div style={{ marginTop: 'var(--space-6)' }}>
          <PersonneImmeublesSection tenantId={personne.tenant_id} personneId={personne.id} onSelectImmeuble={onSelectImmeuble} />
        </div>
      )}

      {tab === 'associes' && personne.type === 'morale' && (
        <div style={{ marginTop: 'var(--space-6)' }}>
          <PersonneMoraleAssociesSection
            tenantId={personne.tenant_id}
            personneMorale={personne}
            onNombrePartsTotalChange={(nombre_parts_total) => onUpdated({ ...personne, nombre_parts_total })}
          />
        </div>
      )}

      {tab === 'contacts' && personne.type === 'morale' && (
        <div style={{ marginTop: 'var(--space-6)' }}>
          <PersonneMoraleContactsSection tenantId={personne.tenant_id} personneMoraleId={personne.id} />
        </div>
      )}

      {tab === 'documents' && (
        <div style={{ marginTop: 'var(--space-6)' }}>
          <PersonneDocumentsSection tenantId={personne.tenant_id} personneId={personne.id} />
        </div>
      )}

      <ConfirmModal
        open={archiveOpen}
        onClose={() => setArchiveOpen(false)}
        title="Archiver la personne"
        subtitle={personneDisplayName(personne)}
        confirmLabel="Archiver"
        confirmingLabel="Archivage…"
        confirming={archiving}
        onConfirm={handleArchive}
      >
        Cette personne n'apparaîtra plus dans la liste. Elle restera consultable et restaurable depuis l'onglet Archive de l'Administration de l'étude.
      </ConfirmModal>
    </div>
  )
}

function ReadonlyInformations({ personne }: { personne: Personne }) {
  const isPhysique = personne.type === 'physique'
  return (
    <div style={grid3}>
      {isPhysique ? (
        <>
          <Field label="Civilité" value={personne.civilite} />
          <Field label="Prénom" value={personne.prenom} />
          <Field label="Nom" value={personne.nom} />
        </>
      ) : (
        <>
          <Field label="Raison sociale" value={personne.raison_sociale} />
          {personne.type === 'morale' && (
            <>
              <Field label="Forme juridique" value={personne.forme_juridique} />
              <Field label="SIREN" value={personne.siren} />
              <Field label="SIRET" value={personne.siret} />
              <Field label="Capital social" value={personne.capital_social != null ? `${personne.capital_social.toLocaleString('fr-FR')} €` : null} />
            </>
          )}
        </>
      )}
      <Field label="Email" value={personne.email} />
      <Field label="Téléphone" value={personne.telephone} />
      <Field label="Adresse" value={personne.adresse} />
      <Field label="Code postal" value={personne.code_postal} />
      <Field label="Ville" value={personne.ville} />
      <Field label="Pays" value={personne.pays} />
      {isPhysique && (
        <>
          <Field label="Date de naissance" value={personne.date_naissance ? new Date(personne.date_naissance).toLocaleDateString('fr-FR') : null} />
          <Field label="Lieu de naissance" value={personne.lieu_naissance} />
          <Field label="Nationalité" value={personne.nationalite} />
          <Field label="Situation matrimoniale" value={personne.situation_matrimoniale} />
          <Field label="Régime matrimonial" value={personne.regime_matrimonial} />
          {personne.date_deces && <Field label="Date de décès" value={new Date(personne.date_deces).toLocaleDateString('fr-FR')} />}
          {personne.lieu_deces && <Field label="Lieu de décès" value={personne.lieu_deces} />}
        </>
      )}
    </div>
  )
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={valueStyle}>{value || '—'}</div>
    </div>
  )
}

const h1: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xl)',
  fontWeight: 700,
  color: 'var(--n-900)',
  letterSpacing: 'var(--tracking-tight)',
  margin: 0,
}

const subtitle: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  color: 'var(--text-muted)',
  margin: 0,
}

const card: CSSProperties = {
  background: 'var(--surface-base)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--space-6)',
  boxShadow: 'var(--shadow-sm)',
}

const tabBar: CSSProperties = {
  display: 'flex',
  gap: 'var(--space-1)',
  borderBottom: '1px solid var(--border-default)',
  marginTop: 'var(--space-6)',
}

function tabBtn(active: boolean): CSSProperties {
  return {
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-sm)',
    fontWeight: 600,
    color: active ? 'var(--n-900)' : 'var(--text-muted)',
    background: 'none',
    border: 'none',
    borderBottom: active ? '2px solid var(--n-900)' : '2px solid transparent',
    padding: 'var(--space-3) var(--space-1)',
    marginBottom: '-1px',
    cursor: 'pointer',
  }
}

const sectionLabel: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-2xs)',
  fontWeight: 600,
  color: 'var(--n-500)',
  letterSpacing: 'var(--tracking-caps)',
  textTransform: 'uppercase',
}

const labelStyle: CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xs)',
  fontWeight: 500,
  color: 'var(--n-700)',
  marginBottom: 'var(--space-1-5)',
}

const valueStyle: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  color: 'var(--n-900)',
}

const grid3: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr',
  gap: 'var(--space-4)',
}

const breadcrumbBtn: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xs)',
  fontWeight: 600,
  color: 'var(--text-muted)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
  marginBottom: 'var(--space-4)',
  display: 'inline-block',
}
