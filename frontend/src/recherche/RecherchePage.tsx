import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { supabase } from '../lib/supabase'
import { Input } from '../design-system'
import type { Dossier, Immeuble, Personne } from '../types/database'
import { acteTypeLabel } from '../constants/acteTypes'
import { personneDisplayName } from '../personnes/PersonneFields'
import { immeubleDisplayName } from '../immeubles/ImmeubleFields'

interface SearchResults {
  dossiers: Dossier[]
  personnes: Personne[]
  immeubles: Immeuble[]
}

// PostgREST's .or() filter uses "," to separate conditions and "()" for grouping —
// strip those from user input so a search containing them can't alter the filter
// shape, and escape ILIKE wildcards so they're matched literally.
function toSearchPattern(query: string): string {
  const cleaned = query.replace(/[,()]/g, ' ').trim()
  const escaped = cleaned.replace(/[%_\\]/g, '\\$&')
  return `%${escaped}%`
}

interface RecherchePageProps {
  tenantId: string
  onSelectDossier: (id: string) => void
  onSelectPersonne: (id: string) => void
  onSelectImmeuble: (id: string) => void
}

export function RecherchePage({ tenantId, onSelectDossier, onSelectPersonne, onSelectImmeuble }: RecherchePageProps) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<SearchResults | null>(null)

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) { setResults(null); setError(null); return }

    let cancelled = false
    const timeout = setTimeout(async () => {
      setLoading(true)
      setError(null)
      const pattern = toSearchPattern(q)

      const [personnesRes, immeublesRes, dossiersByNumeroRes] = await Promise.all([
        supabase.from('personnes').select('*').eq('tenant_id', tenantId)
          .or(`nom.ilike.${pattern},prenom.ilike.${pattern},raison_sociale.ilike.${pattern},email.ilike.${pattern}`),
        supabase.from('immeubles').select('*').eq('tenant_id', tenantId)
          .or(`designation.ilike.${pattern},references_cadastrales.ilike.${pattern}`),
        supabase.from('dossiers').select('*').eq('tenant_id', tenantId).ilike('numero', pattern),
      ])

      const firstError = personnesRes.error ?? immeublesRes.error ?? dossiersByNumeroRes.error
      if (firstError) {
        if (!cancelled) { setError('Erreur lors de la recherche : ' + firstError.message); setLoading(false) }
        return
      }

      const personnes = personnesRes.data ?? []
      const dossierMap = new Map<string, Dossier>()
      for (const d of dossiersByNumeroRes.data ?? []) dossierMap.set(d.id, d)

      if (personnes.length > 0) {
        const { data: comparants, error: comparantsError } = await supabase
          .from('comparants')
          .select('dossier_id')
          .eq('tenant_id', tenantId)
          .in('personne_id', personnes.map((p) => p.id))
        if (comparantsError) {
          if (!cancelled) { setError('Erreur lors de la recherche : ' + comparantsError.message); setLoading(false) }
          return
        }
        const dossierIds = [...new Set((comparants ?? []).map((c) => c.dossier_id))]
        if (dossierIds.length > 0) {
          const { data: linkedDossiers, error: linkedError } = await supabase
            .from('dossiers').select('*').eq('tenant_id', tenantId).in('id', dossierIds)
          if (linkedError) {
            if (!cancelled) { setError('Erreur lors de la recherche : ' + linkedError.message); setLoading(false) }
            return
          }
          for (const d of linkedDossiers ?? []) dossierMap.set(d.id, d)
        }
      }

      if (!cancelled) {
        setResults({ dossiers: [...dossierMap.values()], personnes, immeubles: immeublesRes.data ?? [] })
        setLoading(false)
      }
    }, 300)

    return () => { cancelled = true; clearTimeout(timeout) }
  }, [query, tenantId])

  const totalCount = results ? results.dossiers.length + results.personnes.length + results.immeubles.length : null

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1 style={h1}>Recherche</h1>
        <p style={subtitle}>Retrouvez un dossier, une personne ou un immeuble.</p>
      </div>

      <div style={{ maxWidth: '480px', marginBottom: 'var(--space-6)' }}>
        <Input
          placeholder="Nom, numéro de dossier, référence cadastrale…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {error && <div style={alertStyle}>{error}</div>}

      {query.trim().length < 2 ? (
        <p style={hint}>Saisissez au moins 2 caractères pour lancer la recherche.</p>
      ) : loading ? (
        <p style={hint}>Recherche…</p>
      ) : totalCount === 0 ? (
        <p style={hint}>Aucun résultat pour « {query.trim()} ».</p>
      ) : results ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {results.dossiers.length > 0 && (
            <ResultGroup title="Dossiers">
              {results.dossiers.map((d) => (
                <ResultRow
                  key={d.id}
                  title={d.numero || 'Dossier sans numéro'}
                  subtitle={acteTypeLabel(d.type_acte)}
                  onClick={() => onSelectDossier(d.id)}
                />
              ))}
            </ResultGroup>
          )}
          {results.personnes.length > 0 && (
            <ResultGroup title="Personnes">
              {results.personnes.map((p) => (
                <ResultRow
                  key={p.id}
                  title={personneDisplayName(p)}
                  subtitle={p.email ?? undefined}
                  onClick={() => onSelectPersonne(p.id)}
                />
              ))}
            </ResultGroup>
          )}
          {results.immeubles.length > 0 && (
            <ResultGroup title="Immeubles">
              {results.immeubles.map((i) => (
                <ResultRow
                  key={i.id}
                  title={immeubleDisplayName(i)}
                  subtitle={i.references_cadastrales ?? undefined}
                  onClick={() => onSelectImmeuble(i.id)}
                />
              ))}
            </ResultGroup>
          )}
        </div>
      ) : null}
    </div>
  )
}

function ResultGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={groupTitle}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>{children}</div>
    </div>
  )
}

function ResultRow({ title, subtitle, onClick }: { title: string; subtitle?: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={row}>
      <span style={rowTitle}>{title}</span>
      {subtitle && <span style={rowSubtitle}>{subtitle}</span>}
    </button>
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
  marginBottom: 'var(--space-2)',
}

const row: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 'var(--space-4)',
  width: '100%',
  padding: 'var(--space-3) var(--space-4)',
  background: 'var(--surface-base)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
  textAlign: 'left',
}

const rowTitle: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  fontWeight: 600,
  color: 'var(--n-900)',
}

const rowSubtitle: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xs)',
  color: 'var(--text-muted)',
}

const alertStyle: CSSProperties = {
  background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-md)',
  padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-4)',
  fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: '#DC2626',
}
