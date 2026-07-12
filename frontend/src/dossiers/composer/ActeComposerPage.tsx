import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { EditorContent, useEditor, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../auth/useAuth'
import { Button } from '../../design-system'
import type { Acte, Comparant, DocumentRow, Dossier, Etude, TrameSection } from '../../types/database'
import { acteTypeLabel } from '../../constants/acteTypes'
import { FillFieldNode } from './fillFieldNode'
import { createChampResolver, extractHeadingText, withResolvedValues, type ChampResolver, type TiptapNode } from './resolveChampValue'

// The title field above the editor and the document's own level-1 heading
// are the same title — this pushes an edit made in the field into the
// heading node so the two can never diverge.
function applyTitreToHeading(editor: Editor | null, value: string) {
  if (!editor) return
  const { doc } = editor.state
  let range: { from: number; to: number } | null = null
  doc.descendants((node, pos) => {
    if (range) return false
    if (node.type.name === 'heading' && Number(node.attrs.level ?? 1) === 1) {
      range = { from: pos + 1, to: pos + node.nodeSize - 1 }
      return false
    }
    return true
  })
  if (!range) return
  editor.chain().insertContentAt(range, value ? [{ type: 'text', text: value, marks: [{ type: 'bold' }] }] : []).run()
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

const AUTOSAVE_DELAY_MS = 1200

function formatSavedAt(date: Date) {
  const time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const day = date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  return `Acte mis à jour à ${time} le ${day}`
}

interface ActeComposerPageProps {
  dossier: Dossier
  acte?: Acte
  onBack: () => void
  onGenerated: (acte: Acte, document: DocumentRow) => void
  /** Whether the document can be edited. Defaults to true (the plain "Générer un acte" flow). */
  editable?: boolean
  /** 'drawer' collapses the optional-sections list instead of showing it as an always-visible sidebar — used by the relecture screen's edit mode. */
  sectionsLayout?: 'sidebar' | 'drawer'
  /** When set, the document is rendered in a scrollable container and this fires whenever the scrolled-to-bottom state changes — used to gate relecture actions on having read the whole document. */
  onScrolledToBottomChange?: (scrolledToBottom: boolean) => void
}

export function ActeComposerPage({ dossier, acte, onBack, onGenerated, editable = true, sectionsLayout = 'sidebar', onScrolledToBottomChange }: ActeComposerPageProps) {
  const { session, memberships } = useAuth()
  const [standard, setStandard] = useState<TrameSection | null>(null)
  const [optionalSections, setOptionalSections] = useState<TrameSection[]>([])
  const [sectionsDrawerOpen, setSectionsDrawerOpen] = useState(false)
  const [nom, setNom] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const resolveRef = useRef<ChampResolver>(() => null)
  const nomRef = useRef('')
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const readyForAutosave = useRef(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const editor = useEditor({
    extensions: [StarterKit, FillFieldNode],
    content: { type: 'doc', content: [{ type: 'paragraph' }] },
    editable,
    onUpdate: ({ editor }) => {
      scheduleAutosave()
      const heading = extractHeadingText(editor.getJSON() as TiptapNode)
      setNom(heading)
      nomRef.current = heading
    },
  })

  useEffect(() => {
    editor?.setEditable(editable)
  }, [editor, editable])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container || !onScrolledToBottomChange) return
    function handleScroll() {
      if (!container) return
      const scrolledToBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 24
      onScrolledToBottomChange!(scrolledToBottom)
    }
    handleScroll()
    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onScrolledToBottomChange, loading])

  function scheduleAutosave() {
    if (acte) return
    if (!readyForAutosave.current) return
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    setSaveStatus('saving')
    autosaveTimer.current = setTimeout(saveDraft, AUTOSAVE_DELAY_MS)
  }

  function handleNomChange(value: string) {
    setNom(value)
    nomRef.current = value
    applyTitreToHeading(editor, value)
    scheduleAutosave()
  }

  async function saveDraft() {
    if (!editor) return
    setSaveStatus('saving')
    const { error: saveError } = await supabase
      .from('acte_brouillons')
      .upsert(
        {
          tenant_id: dossier.tenant_id,
          dossier_id: dossier.id,
          nom: nomRef.current.trim() || null,
          content: editor.getJSON(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'dossier_id' },
      )
    if (saveError) {
      setSaveStatus('error')
      return
    }
    setLastSavedAt(new Date())
    setSaveStatus('saved')
  }

  useEffect(() => {
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    }
  }, [])

  useEffect(() => {
    if (!editor) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      readyForAutosave.current = false

      const membership = memberships.find((m) => m.tenant_id === dossier.tenant_id)
      const notaireNom = [membership?.prenom, membership?.nom].filter(Boolean).join(' ')

      const [{ data: etude }, { data: sections, error: sectionsError }, { data: comparants, error: comparantsError }, { data: brouillon }] = await Promise.all([
        supabase.from('etudes').select('*').eq('id', dossier.tenant_id).maybeSingle<Etude>(),
        supabase.from('trame_sections').select('*').eq('type_acte', dossier.type_acte).eq('is_published', true)
          .order('category').order('title'),
        supabase.from('comparants').select('*, personne:personnes(*)').eq('dossier_id', dossier.id).returns<Comparant[]>(),
        acte ? Promise.resolve({ data: null }) : supabase.from('acte_brouillons').select('*').eq('dossier_id', dossier.id).maybeSingle<{ nom: string | null; content: unknown; updated_at: string }>(),
      ])

      if (cancelled) return

      if (sectionsError || comparantsError) {
        setError('Impossible de charger les données : ' + (sectionsError?.message || comparantsError?.message))
        setLoading(false)
        return
      }

      resolveRef.current = createChampResolver(etude ?? null, notaireNom, comparants ?? [])
      editor.storage.champ.comparants = comparants ?? []

      const std = (sections ?? []).find((s) => s.is_standard) ?? null
      const optional = (sections ?? []).filter((s) => !s.is_standard)
      setStandard(std)
      setOptionalSections(optional)

      let initialContent: TiptapNode | null = null
      if (acte?.content) {
        initialContent = acte.content as unknown as TiptapNode
        editor.commands.setContent(acte.content as never)
      } else if (brouillon?.content) {
        initialContent = brouillon.content as unknown as TiptapNode
        editor.commands.setContent(brouillon.content as never)
        setLastSavedAt(new Date(brouillon.updated_at))
        setSaveStatus('saved')
      } else if (std) {
        const resolved = withResolvedValues(std.content as unknown as TiptapNode, resolveRef.current)
        initialContent = resolved
        editor.commands.setContent(resolved as never)
      }

      // The title mirrors the document's own heading, so it's read back out
      // of whichever content just got loaded rather than a separate field.
      const initialNom = initialContent ? extractHeadingText(initialContent) : ''
      setNom(initialNom)
      nomRef.current = initialNom

      setLoading(false)
      readyForAutosave.current = true
    }

    load()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, dossier.id])

  function insertSection(section: TrameSection) {
    if (!editor) return
    const resolved = withResolvedValues(section.content as unknown as TiptapNode, resolveRef.current)
    const { from } = editor.state.selection
    editor.chain().focus().insertContentAt(from, (resolved.content ?? []) as never).run()
  }

  async function handleGenerate() {
    if (!editor) return
    if (!nom.trim()) {
      setError("Le titre de l'acte est requis.")
      return
    }
    const json = editor.getJSON()
    const missing: string[] = []
    function walk(node: { type?: string; attrs?: Record<string, unknown>; content?: unknown[] }) {
      if (node.type === 'champ' && !String(node.attrs?.value ?? '').trim()) {
        missing.push(String(node.attrs?.label ?? node.attrs?.key ?? ''))
      }
      (node.content as typeof node[] | undefined)?.forEach(walk)
    }
    walk(json as never)
    if (missing.length > 0) {
      setError(`Champs manquants : ${missing.join(', ')}`)
      return
    }

    setSaving(true)
    setError(null)
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-acte`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ dossier_id: dossier.id, content: json, acte_id: acte?.id, nom: nom.trim() }),
    })
    const resJson = await response.json()
    setSaving(false)
    if (!response.ok) { setError(resJson.error ?? 'Erreur lors de la génération.'); return }
    if (!acte) {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
      await supabase.from('acte_brouillons').delete().eq('dossier_id', dossier.id)
    }
    onGenerated(resJson.acte, resJson.document)
  }

  const categories = Array.from(new Set(optionalSections.map((s) => s.category ?? '').filter(Boolean)))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <div style={topBar}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-3)', minWidth: 0 }}>
          <button onClick={onBack} style={backBtn}>‹ Annuler</button>
          <span style={title}>{dossier.numero || 'Dossier sans numéro'} — {acteTypeLabel(dossier.type_acte)}</span>
        </div>
        {editable ? (
          <input
            style={nomInput}
            type="text"
            placeholder="Titre de l'acte"
            value={nom}
            onChange={(e) => handleNomChange(e.target.value)}
          />
        ) : (
          <span style={nomReadOnly}>{nom}</span>
        )}
        {editable && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            {!acte && <SaveIndicator status={saveStatus} lastSavedAt={lastSavedAt} />}
            <Button variant="primary" size="sm" onClick={handleGenerate} disabled={saving || loading || !nom.trim() || (!standard && !acte?.content)}>
              {saving ? 'Enregistrement…' : acte ? 'Enregistrer les modifications' : 'Générer'}
            </Button>
          </div>
        )}
      </div>

      {error && <div style={alertStyle}>{error}</div>}

      {loading ? (
        <p style={hint}>Chargement de la trame…</p>
      ) : !standard && !acte?.content ? (
        <p style={hint}>Aucun modèle standard publié pour ce type d'acte.</p>
      ) : (
        <div style={{ display: 'flex', gap: 'var(--space-6)', flex: 1, alignItems: 'flex-start', minHeight: 0 }}>
          {editable && sectionsLayout === 'sidebar' && (
            <div style={sidebar}>
              <div style={sidebarTitle}>Sections à insérer</div>
              <p style={sidebarHint}>Cliquez pour insérer à l'endroit du curseur dans le document.</p>
              <OptionalSectionsList categories={categories} optionalSections={optionalSections} onInsert={insertSection} />
            </div>
          )}

          {editable && sectionsLayout === 'drawer' && (
            <div style={drawer}>
              <button style={drawerToggle} onClick={() => setSectionsDrawerOpen((v) => !v)}>
                {sectionsDrawerOpen ? '▾' : '▸'} Sections optionnelles
              </button>
              {sectionsDrawerOpen && (
                <div style={drawerContent}>
                  <OptionalSectionsList categories={categories} optionalSections={optionalSections} onInsert={insertSection} />
                </div>
              )}
            </div>
          )}

          <div ref={onScrolledToBottomChange ? scrollContainerRef : undefined} style={onScrolledToBottomChange ? scrollableDocumentColumn : documentColumn}>
            <div style={documentPage}>
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function OptionalSectionsList({ categories, optionalSections, onInsert }: { categories: string[]; optionalSections: TrameSection[]; onInsert: (section: TrameSection) => void }) {
  if (optionalSections.length === 0) {
    return <p style={sidebarHint}>Aucune section optionnelle publiée.</p>
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {categories.map((category) => (
        <div key={category}>
          <div style={categoryLabel}>{category}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {optionalSections.filter((s) => (s.category ?? '') === category).map((s) => (
              <button key={s.id} style={sectionBtn} onClick={() => onInsert(s)}>
                + {s.title}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

const topBar: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingBottom: 'var(--space-4)',
  marginBottom: 'var(--space-4)',
  borderBottom: '1px solid var(--border-default)',
}

const backBtn: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xs)',
  fontWeight: 600,
  color: 'var(--text-muted)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
}

const title: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-base)',
  fontWeight: 600,
  color: 'var(--n-900)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}

const nomInput: CSSProperties = {
  flex: 1,
  maxWidth: '360px',
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  color: 'var(--n-900)',
  background: 'var(--surface-base)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-md)',
  padding: '6px 10px',
}

const nomReadOnly: CSSProperties = {
  flex: 1,
  maxWidth: '360px',
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  fontWeight: 600,
  color: 'var(--n-900)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const hint: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  color: 'var(--text-muted)',
}

const sidebar: CSSProperties = {
  width: '260px',
  flexShrink: 0,
  position: 'sticky',
  top: 0,
}

const sidebarTitle: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xs)',
  fontWeight: 600,
  color: 'var(--text-muted)',
  letterSpacing: 'var(--tracking-caps)',
  textTransform: 'uppercase',
  marginBottom: 'var(--space-2)',
}

const sidebarHint: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xs)',
  color: 'var(--text-muted)',
  marginBottom: 'var(--space-4)',
  lineHeight: 'var(--leading-snug)',
}

const categoryLabel: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xs)',
  fontWeight: 600,
  color: 'var(--n-700)',
  marginBottom: '6px',
}

const sectionBtn: CSSProperties = {
  display: 'block',
  width: '100%',
  textAlign: 'left',
  padding: '8px 10px',
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xs)',
  color: 'var(--color-ink)',
  background: 'var(--surface-base)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
}

const documentColumn: CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: 'flex',
  justifyContent: 'center',
}

const scrollableDocumentColumn: CSSProperties = {
  ...documentColumn,
  overflowY: 'auto',
  maxHeight: 'calc(100vh - 220px)',
}

const drawer: CSSProperties = {
  width: '260px',
  flexShrink: 0,
}

const drawerToggle: CSSProperties = {
  display: 'block',
  width: '100%',
  textAlign: 'left',
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xs)',
  fontWeight: 600,
  color: 'var(--n-700)',
  letterSpacing: 'var(--tracking-caps)',
  textTransform: 'uppercase',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
  marginBottom: 'var(--space-2)',
}

const drawerContent: CSSProperties = {
  marginTop: 'var(--space-2)',
}

const documentPage: CSSProperties = {
  width: '100%',
  maxWidth: '760px',
  background: 'var(--surface-base)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-md)',
  padding: '64px 72px',
  fontFamily: 'var(--font-sans)',
  fontSize: '14px',
  lineHeight: 1.7,
  color: 'var(--n-900)',
  marginBottom: 'var(--space-8)',
}

function SaveIndicator({ status, lastSavedAt }: { status: SaveStatus; lastSavedAt: Date | null }) {
  if (status === 'idle') return null

  if (status === 'saving') {
    return (
      <span style={saveIndicatorStyle}>
        <span style={spinnerStyle} />
        Enregistrement…
      </span>
    )
  }

  if (status === 'error') {
    return <span style={{ ...saveIndicatorStyle, color: '#DC2626' }}>Échec de l'enregistrement automatique</span>
  }

  if (!lastSavedAt) return null
  return <span style={saveIndicatorStyle}>{formatSavedAt(lastSavedAt)}</span>
}

const saveIndicatorStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xs)',
  color: 'var(--text-muted)',
  whiteSpace: 'nowrap',
}

const spinnerStyle: CSSProperties = {
  width: '11px',
  height: '11px',
  borderRadius: '50%',
  border: '2px solid var(--border-default)',
  borderTopColor: 'var(--n-700)',
  animation: 'acte-composer-spin 0.7s linear infinite',
}

const alertStyle: CSSProperties = {
  background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-md)',
  padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-4)',
  fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: '#DC2626',
}
