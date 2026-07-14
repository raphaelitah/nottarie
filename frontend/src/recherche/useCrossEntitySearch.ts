import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Comparant, Dossier, DocumentRow, Immeuble, Personne } from '../types/database'

export type DossierSearchResult = Dossier & { comparants?: Comparant[] }
export type DocumentSearchResult = DocumentRow & { dossier: { id: string; nom: string | null; numero: string | null } | null }

export interface CrossEntitySearchResults {
  dossiers: DossierSearchResult[]
  personnes: Personne[]
  immeubles: Immeuble[]
  documents: DocumentSearchResult[]
}

// PostgREST's .or() filter uses "," to separate conditions and "()" for grouping —
// strip those from user input so a search containing them can't alter the filter
// shape, and escape ILIKE wildcards so they're matched literally.
function toSearchPattern(query: string): string {
  const cleaned = query.replace(/[,()]/g, ' ').trim()
  const escaped = cleaned.replace(/[%_\\]/g, '\\$&')
  return `%${escaped}%`
}

export function useCrossEntitySearch(tenantId: string, query: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<CrossEntitySearchResults | null>(null)

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) { setResults(null); setError(null); setLoading(false); return }

    let cancelled = false
    const timeout = setTimeout(async () => {
      setLoading(true)
      setError(null)
      const pattern = toSearchPattern(q)

      const [personnesRes, immeublesRes, dossiersByFieldsRes, documentsRes] = await Promise.all([
        supabase.from('personnes').select('*').eq('tenant_id', tenantId).is('archived_at', null)
          .or(`nom.ilike.${pattern},prenom.ilike.${pattern},raison_sociale.ilike.${pattern},email.ilike.${pattern}`),
        supabase.from('immeubles').select('*').eq('tenant_id', tenantId).is('archived_at', null)
          .or(`designation.ilike.${pattern},references_cadastrales.ilike.${pattern}`),
        supabase.from('dossiers').select('*, comparants(qualite, personne:personnes(*))').eq('tenant_id', tenantId).is('archived_at', null)
          .or(`numero.ilike.${pattern},nom.ilike.${pattern}`),
        supabase.from('documents').select('*, dossier:dossiers(id, nom, numero)').eq('tenant_id', tenantId).not('dossier_id', 'is', null)
          .ilike('nom', pattern),
      ])

      const firstError = personnesRes.error ?? immeublesRes.error ?? dossiersByFieldsRes.error ?? documentsRes.error
      if (firstError) {
        if (!cancelled) { setError('Erreur lors de la recherche : ' + firstError.message); setLoading(false) }
        return
      }

      const personnes = personnesRes.data ?? []
      const dossierMap = new Map<string, DossierSearchResult>()
      for (const d of dossiersByFieldsRes.data ?? []) dossierMap.set(d.id, d)

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
            .from('dossiers').select('*, comparants(qualite, personne:personnes(*))').eq('tenant_id', tenantId).is('archived_at', null).in('id', dossierIds)
          if (linkedError) {
            if (!cancelled) { setError('Erreur lors de la recherche : ' + linkedError.message); setLoading(false) }
            return
          }
          for (const d of linkedDossiers ?? []) dossierMap.set(d.id, d)
        }
      }

      if (!cancelled) {
        setResults({
          dossiers: [...dossierMap.values()],
          personnes,
          immeubles: immeublesRes.data ?? [],
          documents: (documentsRes.data ?? []) as DocumentSearchResult[],
        })
        setLoading(false)
      }
    }, 300)

    return () => { cancelled = true; clearTimeout(timeout) }
  }, [query, tenantId])

  return { loading, error, results }
}
