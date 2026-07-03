import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { supabase } from '../../lib/supabase'
import { Badge, Button, Input } from '../../design-system'
import type { TrameSection } from '../../types/database'
import { ACTE_TYPE_OPTIONS, acteTypeLabel } from '../../constants/acteTypes'
import { SectionList } from './SectionList'
import { SectionFormDrawer, STANDARD_MODEL_TITLE, type SectionFormValues } from './SectionFormDrawer'

interface TrameDetailPageProps {
  typeActe: string
  onBack: () => void
}

export function TrameDetailPage({ typeActe, onBack }: TrameDetailPageProps) {
  const [sections, setSections] = useState<TrameSection[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<TrameSection | null>(null)
  const [isStandardMode, setIsStandardMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [drawerKey, setDrawerKey] = useState(0)

  async function loadSections() {
    setLoading(true)
    const { data, error } = await supabase
      .from('trame_sections')
      .select('*')
      .eq('type_acte', typeActe)
      .order('category')
      .order('title')
    if (error) setError('Impossible de charger la trame : ' + error.message)
    else setSections(data ?? [])
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadSections() }, [typeActe])

  const standard = sections.find((s) => s.is_standard) ?? null
  const regularSections = sections.filter((s) => !s.is_standard)
  const categoryOptions = Array.from(new Set(regularSections.map((s) => s.category ?? '').filter(Boolean)))

  function openCreateSection() {
    setEditing(null)
    setIsStandardMode(false)
    setError(null)
    setDrawerKey((k) => k + 1)
    setDrawerOpen(true)
  }

  function openEditSection(s: TrameSection) {
    setEditing(s)
    setIsStandardMode(false)
    setError(null)
    setDrawerKey((k) => k + 1)
    setDrawerOpen(true)
  }

  function openStandardModel() {
    setEditing(standard)
    setIsStandardMode(true)
    setError(null)
    setDrawerKey((k) => k + 1)
    setDrawerOpen(true)
  }

  async function handleSave(values: SectionFormValues) {
    setSaving(true)
    setError(null)
    const branche = ACTE_TYPE_OPTIONS.find((o) => o.value === typeActe)?.branche ?? 'famille'
    const payload = { ...values, branche, type_acte: typeActe, is_standard: isStandardMode }
    const { error } = editing
      ? await supabase.from('trame_sections').update(payload).eq('id', editing.id)
      : await supabase.from('trame_sections').insert(payload)
    setSaving(false)
    if (error) { setError("Erreur lors de l'enregistrement : " + error.message); return }
    setDrawerOpen(false)
    loadSections()
  }

  async function handleDuplicate(s: TrameSection) {
    setError(null)
    const { error } = await supabase.from('trame_sections').insert({
      branche: s.branche,
      type_acte: s.type_acte,
      category: s.category,
      title: `${s.title} (copie)`,
      content: s.content,
      variables: s.variables,
      is_published: false,
      is_standard: false,
    })
    if (error) { setError('Erreur lors de la duplication : ' + error.message); return }
    loadSections()
  }

  async function handleArchive(s: TrameSection) {
    setError(null)
    const { error } = await supabase.from('trame_sections').update({ is_published: false }).eq('id', s.id)
    if (error) { setError("Erreur lors de l'archivage : " + error.message); return }
    loadSections()
  }

  return (
    <div>
      <button onClick={onBack} style={breadcrumbBtn}>‹ Bibliothèque de Trames</button>

      <h1 style={h1}>{acteTypeLabel(typeActe)}</h1>
      <p style={subtitle}>Tout nouvel acte de ce type commence avec le modèle standard ci-dessous ; les sections peuvent ensuite être ajoutées selon le dossier.</p>

      {error && <div style={alertStyle}>{error}</div>}

      {!loading && (
        <>
          <div style={{ marginTop: 'var(--space-7)', marginBottom: 'var(--space-3)' }}>
            <h2 style={h2}>Modèle d'acte standard</h2>
          </div>

          {standard ? (
            <div style={card}>
              <button onClick={openStandardModel} style={cardTitleBtn}>
                <span style={cardTitle}>{STANDARD_MODEL_TITLE}</span>
                <Badge status={standard.is_published ? 'published' : 'draft'} size="sm" />
              </button>
              <Button variant="ghost" size="sm" onClick={openStandardModel}>Modifier</Button>
            </div>
          ) : (
            <div style={emptyCard}>
              <p style={emptyText}>Aucun modèle standard défini pour ce type d'acte.</p>
              <Button variant="primary" size="sm" onClick={openStandardModel}>+ Créer le modèle d'acte standard</Button>
            </div>
          )}

          <div style={{ marginTop: 'var(--space-8)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={h2}>Sections</h2>
            <Button variant="primary" size="sm" onClick={openCreateSection}>+ Nouvelle section</Button>
          </div>

          <div style={{ marginBottom: 'var(--space-5)' }}>
            <Input placeholder="Rechercher une section…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          <SectionList
            sections={regularSections}
            search={search}
            onEdit={openEditSection}
            onDuplicate={handleDuplicate}
            onArchive={handleArchive}
          />
        </>
      )}

      <SectionFormDrawer
        key={drawerKey}
        open={drawerOpen}
        section={editing}
        isStandard={isStandardMode}
        categoryOptions={categoryOptions}
        saving={saving}
        onSave={handleSave}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  )
}

const breadcrumbBtn: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xs)',
  color: 'var(--color-ink)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
  fontWeight: 500,
  marginBottom: 'var(--space-4)',
  display: 'block',
}

const h1: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xl)',
  fontWeight: 700,
  color: 'var(--n-900)',
  letterSpacing: 'var(--tracking-tight)',
  margin: '0 0 var(--space-1)',
}

const h2: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-base)',
  fontWeight: 700,
  color: 'var(--n-900)',
  margin: 0,
}

const subtitle: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  color: 'var(--text-muted)',
  margin: 0,
}

const card: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 'var(--space-4)',
  padding: 'var(--space-4) var(--space-5)',
  background: 'var(--surface-base)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-lg)',
}

const cardTitleBtn: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-3)',
  minWidth: 0,
  background: 'none',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  textAlign: 'left',
}

const cardTitle: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  fontWeight: 600,
  color: 'var(--n-900)',
}

const emptyCard: CSSProperties = {
  textAlign: 'center',
  padding: 'var(--space-7)',
  background: 'var(--surface-base)',
  border: '1px dashed var(--border-strong)',
  borderRadius: 'var(--radius-lg)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 'var(--space-3)',
}

const emptyText: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  color: 'var(--text-muted)',
  margin: 0,
}

const alertStyle: CSSProperties = {
  background: '#FEF2F2',
  border: '1px solid #FECACA',
  borderRadius: 'var(--radius-md)',
  padding: 'var(--space-3) var(--space-4)',
  margin: 'var(--space-4) 0',
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  color: '#DC2626',
}
