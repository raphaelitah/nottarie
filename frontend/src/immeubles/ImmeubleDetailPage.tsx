import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { supabase } from '../lib/supabase'
import { Badge, Button, ConfirmModal, EditPenButton } from '../design-system'
import type { Immeuble } from '../types/database'
import { regimeBienLabel } from '../constants/regimeBien'
import { typeBienLabel } from '../constants/typeBien'
import { useAuth } from '../auth/useAuth'
import { ImmeubleFields } from './ImmeubleFields'
import { ImmeubleDocumentsSection } from './ImmeubleDocumentsSection'
import { ImmeubleDossiersSection } from './ImmeubleDossiersSection'
import { ImmeubleProprietairesSection } from './ImmeubleProprietairesSection'
import {
  immeubleToForm,
  immeubleFormError,
  immeubleFormToInsertPayload,
  immeubleDisplayName,
  type ImmeubleFormValues,
} from './immeubleForm'

const TABS = [
  { key: 'informations', label: 'Informations' },
  { key: 'dossiers', label: 'Dossiers' },
  { key: 'proprietaires', label: 'Propriétaires' },
  { key: 'documents', label: 'Documents' },
] as const

type TabKey = typeof TABS[number]['key']

interface ImmeubleDetailPageProps {
  immeuble: Immeuble
  onBack: () => void
  onUpdated: (immeuble: Immeuble) => void
  onSelectDossier?: (id: string) => void
  onSelectPersonne?: (id: string) => void
}

export function ImmeubleDetailPage({ immeuble, onBack, onUpdated, onSelectDossier, onSelectPersonne }: ImmeubleDetailPageProps) {
  const { memberships } = useAuth()
  const membership = memberships.find((m) => m.tenant_id === immeuble.tenant_id) ?? null
  const canArchive = membership?.roles.some((r) => r === 'administrateur' || r === 'notaire') ?? false

  const [tab, setTab] = useState<TabKey>('informations')
  const [editing, setEditing] = useState(false)
  const [values, setValues] = useState<ImmeubleFormValues>(() => immeubleToForm(immeuble))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [archiving, setArchiving] = useState(false)

  useEffect(() => {
    setValues(immeubleToForm(immeuble))
    setEditing(false)
    setTab('informations')
  }, [immeuble])

  function handleStartEdit() {
    setValues(immeubleToForm(immeuble))
    setError(null)
    setEditing(true)
  }

  async function handleSave() {
    const err = immeubleFormError(values)
    if (err) { setError(err); return }
    setSaving(true)
    setError(null)
    const payload = immeubleFormToInsertPayload(values, immeuble.tenant_id)
    const { data, error } = await supabase.from('immeubles').update(payload).eq('id', immeuble.id).select().single()
    setSaving(false)
    if (error) { setError("Erreur lors de l'enregistrement : " + error.message); return }
    setEditing(false)
    onUpdated(data)
  }

  async function handleArchive() {
    setArchiving(true)
    const { error } = await supabase.from('immeubles').update({ archived_at: new Date().toISOString() }).eq('id', immeuble.id)
    setArchiving(false)
    if (error) { setError("Erreur lors de l'archivage : " + error.message); return }
    setArchiveOpen(false)
    onBack()
  }

  return (
    <div>
      <button onClick={onBack} style={breadcrumbBtn}>‹ Immeubles</button>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-1)' }}>
            <h1 style={h1}>{immeubleDisplayName(immeuble)}</h1>
            {immeuble.type_bien && <Badge status="ongoing" label={typeBienLabel(immeuble.type_bien)} />}
          </div>
          <p style={subtitle}>
            {immeuble.ville || 'Ville non renseignée'}
            {immeuble.regime && ` · ${regimeBienLabel(immeuble.regime)}`}
          </p>
        </div>
        {canArchive && (
          <Button variant="destructive" size="sm" onClick={() => setArchiveOpen(true)}>Archiver l'immeuble</Button>
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
        {TABS.map((t) => (
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
            <ImmeubleFields values={values} onChange={setValues} />
          ) : (
            <ReadonlyInformations immeuble={immeuble} />
          )}
        </div>
      )}

      {tab === 'dossiers' && (
        <div style={{ marginTop: 'var(--space-6)' }}>
          <ImmeubleDossiersSection immeubleId={immeuble.id} onSelectDossier={onSelectDossier} />
        </div>
      )}

      {tab === 'proprietaires' && (
        <div style={{ marginTop: 'var(--space-6)' }}>
          <ImmeubleProprietairesSection
            tenantId={immeuble.tenant_id}
            immeubleId={immeuble.id}
            nombrePartsTotal={immeuble.nombre_parts_total}
            onNombrePartsTotalChange={(nombre_parts_total) => onUpdated({ ...immeuble, nombre_parts_total })}
            onSelectPersonne={onSelectPersonne}
          />
        </div>
      )}

      {tab === 'documents' && (
        <div style={{ marginTop: 'var(--space-6)' }}>
          <ImmeubleDocumentsSection tenantId={immeuble.tenant_id} immeubleId={immeuble.id} />
        </div>
      )}

      <ConfirmModal
        open={archiveOpen}
        onClose={() => setArchiveOpen(false)}
        title="Archiver l'immeuble"
        subtitle={immeubleDisplayName(immeuble)}
        confirmLabel="Archiver"
        confirmingLabel="Archivage…"
        confirming={archiving}
        onConfirm={handleArchive}
      >
        Cet immeuble n'apparaîtra plus dans la liste. Il restera consultable et restaurable depuis l'onglet Archive de l'Administration de l'étude.
      </ConfirmModal>
    </div>
  )
}

function ReadonlyInformations({ immeuble }: { immeuble: Immeuble }) {
  return (
    <div style={grid3}>
      <Field label="Type de bien" value={immeuble.type_bien ? typeBienLabel(immeuble.type_bien) : null} />
      <Field label="Régime du bien" value={immeuble.regime ? regimeBienLabel(immeuble.regime) : null} />
      <Field label="Désignation" value={immeuble.designation} />
      <Field label="Adresse" value={immeuble.adresse} />
      <Field label="Code postal" value={immeuble.code_postal} />
      <Field label="Ville" value={immeuble.ville} />
      <Field label="Pays" value={immeuble.pays} />
      <Field label="Références cadastrales" value={immeuble.references_cadastrales} />
      <Field label="Valeur déclarée" value={immeuble.valeur_declaree != null ? `${immeuble.valeur_declaree.toLocaleString('fr-FR')} €` : null} />
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
