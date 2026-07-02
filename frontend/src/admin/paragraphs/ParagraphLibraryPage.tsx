import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { supabase } from '../../lib/supabase'
import { Button, Input } from '../../design-system'
import type { TrameParagraph } from '../../types/database'
import { ACTE_TYPE_OPTIONS } from '../../constants/acteTypes'
import { ParagraphGroupedList } from './ParagraphGroupedList'
import { ParagraphFormDrawer, type ParagraphFormValues } from './ParagraphFormDrawer'

export function ParagraphLibraryPage() {
  const [paragraphs, setParagraphs] = useState<TrameParagraph[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<TrameParagraph | null>(null)
  const [saving, setSaving] = useState(false)

  async function loadParagraphs() {
    setLoading(true)
    const { data, error } = await supabase
      .from('trame_paragraphs')
      .select('*')
      .order('type_acte')
      .order('category')
      .order('title')
    if (error) setError('Impossible de charger la bibliothèque : ' + error.message)
    else setParagraphs(data ?? [])
    setLoading(false)
  }

  useEffect(() => { loadParagraphs() }, [])

  const categoriesByActeType: Record<string, string[]> = {}
  for (const p of paragraphs) {
    const set = new Set(categoriesByActeType[p.type_acte] ?? [])
    set.add(p.category)
    categoriesByActeType[p.type_acte] = Array.from(set)
  }

  function openCreate() {
    setEditing(null)
    setError(null)
    setDrawerOpen(true)
  }

  function openEdit(p: TrameParagraph) {
    setEditing(p)
    setError(null)
    setDrawerOpen(true)
  }

  async function handleSave(values: ParagraphFormValues) {
    setSaving(true)
    setError(null)
    const branche = ACTE_TYPE_OPTIONS.find((o) => o.value === values.type_acte)?.branche ?? 'famille'
    const payload = { ...values, branche }
    const { error } = editing
      ? await supabase.from('trame_paragraphs').update(payload).eq('id', editing.id)
      : await supabase.from('trame_paragraphs').insert(payload)
    setSaving(false)
    if (error) { setError("Erreur lors de l'enregistrement : " + error.message); return }
    setDrawerOpen(false)
    loadParagraphs()
  }

  async function handleDuplicate(p: TrameParagraph) {
    setError(null)
    const { error } = await supabase.from('trame_paragraphs').insert({
      branche: p.branche,
      type_acte: p.type_acte,
      category: p.category,
      title: `${p.title} (copie)`,
      content: p.content,
      variables: p.variables,
      is_published: false,
    })
    if (error) { setError('Erreur lors de la duplication : ' + error.message); return }
    loadParagraphs()
  }

  async function handleArchive(p: TrameParagraph) {
    setError(null)
    const { error } = await supabase.from('trame_paragraphs').update({ is_published: false }).eq('id', p.id)
    if (error) { setError("Erreur lors de l'archivage : " + error.message); return }
    loadParagraphs()
  }

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-6)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
        <div>
          <h1 style={h1}>Bibliothèque de paragraphes</h1>
          <p style={subtitle}>Modèles nationaux de paragraphes réutilisables dans les trames.</p>
        </div>
        <Button variant="primary" size="sm" onClick={openCreate}>+ Nouveau paragraphe</Button>
      </div>

      {error && <div style={alertStyle}>{error}</div>}

      <div style={{ marginBottom: 'var(--space-6)', maxWidth: '360px' }}>
        <Input placeholder="Rechercher un paragraphe…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Chargement…</div>
      ) : (
        <ParagraphGroupedList
          paragraphs={paragraphs}
          search={search}
          onEdit={openEdit}
          onDuplicate={handleDuplicate}
          onArchive={handleArchive}
        />
      )}

      <ParagraphFormDrawer
        open={drawerOpen}
        paragraph={editing}
        categoriesByActeType={categoriesByActeType}
        saving={saving}
        onSave={handleSave}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  )
}

const h1: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xl)',
  fontWeight: 700,
  color: 'var(--n-900)',
  letterSpacing: 'var(--tracking-tight)',
  margin: '0 0 var(--space-1)',
}

const subtitle: CSSProperties = {
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
  marginBottom: 'var(--space-4)',
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  color: '#DC2626',
}
