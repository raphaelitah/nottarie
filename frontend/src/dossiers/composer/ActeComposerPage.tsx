import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../auth/useAuth'
import { Button } from '../../design-system'
import type { Acte, Comparant, DocumentRow, Dossier, Etude, TrameSection } from '../../types/database'
import { acteTypeLabel } from '../../constants/acteTypes'
import { FillFieldNode } from './fillFieldNode'
import { createChampResolver, withResolvedValues, type ChampResolver, type TiptapNode } from './resolveChampValue'

interface ActeComposerPageProps {
  dossier: Dossier
  onBack: () => void
  onGenerated: (acte: Acte, document: DocumentRow) => void
}

export function ActeComposerPage({ dossier, onBack, onGenerated }: ActeComposerPageProps) {
  const { session, memberships } = useAuth()
  const [standard, setStandard] = useState<TrameSection | null>(null)
  const [optionalSections, setOptionalSections] = useState<TrameSection[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const resolveRef = useRef<ChampResolver>(() => null)

  const editor = useEditor({
    extensions: [StarterKit, FillFieldNode],
    content: { type: 'doc', content: [{ type: 'paragraph' }] },
  })

  useEffect(() => {
    if (!editor) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      const membership = memberships.find((m) => m.tenant_id === dossier.tenant_id)
      const notaireNom = [membership?.prenom, membership?.nom].filter(Boolean).join(' ')

      const [{ data: etude }, { data: sections, error: sectionsError }, { data: comparants, error: comparantsError }] = await Promise.all([
        supabase.from('etudes').select('*').eq('id', dossier.tenant_id).maybeSingle<Etude>(),
        supabase.from('trame_sections').select('*').eq('type_acte', dossier.type_acte).eq('is_published', true)
          .order('category').order('title'),
        supabase.from('comparants').select('*, personne:personnes(*)').eq('dossier_id', dossier.id).returns<Comparant[]>(),
      ])

      if (cancelled) return

      if (sectionsError || comparantsError) {
        setError('Impossible de charger les données : ' + (sectionsError?.message || comparantsError?.message))
        setLoading(false)
        return
      }

      resolveRef.current = createChampResolver(etude ?? null, notaireNom, comparants ?? [])

      const std = (sections ?? []).find((s) => s.is_standard) ?? null
      const optional = (sections ?? []).filter((s) => !s.is_standard)
      setStandard(std)
      setOptionalSections(optional)

      if (std) {
        const resolved = withResolvedValues(std.content as unknown as TiptapNode, resolveRef.current)
        editor.commands.setContent(resolved as never)
      }
      setLoading(false)
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
      body: JSON.stringify({ dossier_id: dossier.id, content: json }),
    })
    const resJson = await response.json()
    setSaving(false)
    if (!response.ok) { setError(resJson.error ?? 'Erreur lors de la génération.'); return }
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
        <Button variant="primary" size="sm" onClick={handleGenerate} disabled={saving || loading || !standard}>
          {saving ? 'Génération…' : 'Générer'}
        </Button>
      </div>

      {error && <div style={alertStyle}>{error}</div>}

      {loading ? (
        <p style={hint}>Chargement de la trame…</p>
      ) : !standard ? (
        <p style={hint}>Aucun modèle standard publié pour ce type d'acte.</p>
      ) : (
        <div style={{ display: 'flex', gap: 'var(--space-6)', flex: 1, alignItems: 'flex-start' }}>
          <div style={sidebar}>
            <div style={sidebarTitle}>Sections à insérer</div>
            <p style={sidebarHint}>Cliquez pour insérer à l'endroit du curseur dans le document.</p>
            {optionalSections.length === 0 ? (
              <p style={sidebarHint}>Aucune section optionnelle publiée.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {categories.map((category) => (
                  <div key={category}>
                    <div style={categoryLabel}>{category}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {optionalSections.filter((s) => (s.category ?? '') === category).map((s) => (
                        <button key={s.id} style={sectionBtn} onClick={() => insertSection(s)}>
                          + {s.title}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={documentColumn}>
            <div style={documentPage}>
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>
      )}
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

const alertStyle: CSSProperties = {
  background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-md)',
  padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-4)',
  fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: '#DC2626',
}
