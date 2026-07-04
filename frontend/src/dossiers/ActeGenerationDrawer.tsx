import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthContext'
import { Drawer, Button, Input } from '../design-system'
import type { Acte, DocumentRow, Dossier, Etude, SectionVariable, TrameSection } from '../types/database'
import { acteTypeLabel } from '../constants/acteTypes'

// Variables the notaire/rédacteur shouldn't have to type by hand every time —
// pre-filled from étude/session data, but still editable before generating.
function autoDefaults(etude: Etude | null, notaireNom: string): Record<string, string> {
  return {
    date_acte: new Date().toLocaleDateString('fr-FR'),
    lieu_acte: etude?.ville ?? '',
    notaire_nom: notaireNom,
    etude_raison_sociale: etude?.raison_sociale ?? '',
    etude_ville: etude?.ville ?? '',
    etude_adresse: etude?.adresse_ligne1 ?? '',
  }
}

interface ActeGenerationDrawerProps {
  open: boolean
  dossier: Dossier
  onClose: () => void
  onGenerated: (acte: Acte, document: DocumentRow) => void
}

export function ActeGenerationDrawer({ open, dossier, onClose, onGenerated }: ActeGenerationDrawerProps) {
  const { session, memberships } = useAuth()
  const [standard, setStandard] = useState<TrameSection | null>(null)
  const [optionalSections, setOptionalSections] = useState<TrameSection[]>([])
  const [selectedSectionIds, setSelectedSectionIds] = useState<string[]>([])
  const [values, setValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setError(null)
    setLoading(true)
    setSelectedSectionIds([])

    async function load() {
      const membership = memberships.find((m) => m.tenant_id === dossier.tenant_id)
      const notaireNom = [membership?.prenom, membership?.nom].filter(Boolean).join(' ')

      const [{ data: etude }, { data: sections, error: sectionsError }] = await Promise.all([
        supabase.from('etudes').select('*').eq('id', dossier.tenant_id).maybeSingle(),
        supabase.from('trame_sections').select('*').eq('type_acte', dossier.type_acte).eq('is_published', true)
          .order('category').order('title'),
      ])

      if (sectionsError) { setError('Impossible de charger la trame : ' + sectionsError.message); setLoading(false); return }

      const std = (sections ?? []).find((s) => s.is_standard) ?? null
      const optional = (sections ?? []).filter((s) => !s.is_standard)
      setStandard(std)
      setOptionalSections(optional)
      setValues(autoDefaults(etude, notaireNom))
      setLoading(false)
    }

    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, dossier.id])

  const activeSections = [standard, ...optionalSections.filter((s) => selectedSectionIds.includes(s.id))].filter(
    (s): s is TrameSection => s !== null
  )
  const variables: SectionVariable[] = (() => {
    const byKey = new Map<string, SectionVariable>()
    for (const section of activeSections) {
      for (const v of section.variables) byKey.set(v.key, v)
    }
    return Array.from(byKey.values())
  })()

  function toggleSection(id: string) {
    setSelectedSectionIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const categories = Array.from(new Set(optionalSections.map((s) => s.category ?? '').filter(Boolean)))

  async function handleGenerate() {
    const missing = variables.filter((v) => !values[v.key]?.trim())
    if (missing.length > 0) {
      setError(`Champs manquants : ${missing.map((v) => v.label).join(', ')}`)
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
      body: JSON.stringify({
        dossier_id: dossier.id,
        section_ids: selectedSectionIds,
        values,
      }),
    })
    const json = await response.json()
    setSaving(false)
    if (!response.ok) { setError(json.error ?? 'Erreur lors de la génération.'); return }
    onGenerated(json.acte, json.document)
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={`Générer un acte — ${acteTypeLabel(dossier.type_acte)}`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>Annuler</Button>
          <Button variant="primary" size="sm" onClick={handleGenerate} disabled={saving || loading || !standard}>
            {saving ? 'Génération…' : 'Générer'}
          </Button>
        </>
      }
    >
      {loading ? (
        <p style={hint}>Chargement de la trame…</p>
      ) : !standard ? (
        <p style={hint}>Aucun modèle standard publié pour ce type d'acte.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {error && <div style={alertStyle}>{error}</div>}

          {optionalSections.length > 0 && (
            <div>
              <div style={groupTitle}>Sections optionnelles</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {categories.map((category) => (
                  <div key={category}>
                    <div style={categoryLabel}>{category}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {optionalSections.filter((s) => (s.category ?? '') === category).map((s) => (
                        <label key={s.id} style={checkboxRow}>
                          <input
                            type="checkbox"
                            checked={selectedSectionIds.includes(s.id)}
                            onChange={() => toggleSection(s.id)}
                          />
                          {s.title}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <div style={groupTitle}>Informations à renseigner</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {variables.map((v) => (
                <Input
                  key={v.key}
                  label={v.label}
                  required
                  value={values[v.key] ?? ''}
                  onChange={(e) => setValues((prev) => ({ ...prev, [v.key]: e.target.value }))}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </Drawer>
  )
}

const hint: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  color: 'var(--text-muted)',
}

const groupTitle: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xs)',
  fontWeight: 600,
  color: 'var(--text-muted)',
  letterSpacing: 'var(--tracking-caps)',
  textTransform: 'uppercase',
  marginBottom: 'var(--space-3)',
}

const categoryLabel: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xs)',
  fontWeight: 600,
  color: 'var(--n-700)',
  marginBottom: '6px',
}

const checkboxRow: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  color: 'var(--n-900)',
  cursor: 'pointer',
}

const alertStyle: CSSProperties = {
  background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-md)',
  padding: 'var(--space-3) var(--space-4)',
  fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: '#DC2626',
}
