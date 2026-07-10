import type { Comparant } from '../../types/database'

function formatDate(value: string | null): string | null {
  if (!value) return null
  return new Date(value).toLocaleDateString('fr-FR')
}

// Full identification sentence for one comparant — the phrasing a clerc would
// otherwise type by hand (civilité, nom/prénom, naissance, adresse, qualité).
export function formatComparantIdentification(comparant: Comparant): string {
  const p = comparant.personne
  if (!p) return ''

  if (p.type === 'morale') {
    const parts = [p.raison_sociale, p.adresse ? `dont le siège est ${p.adresse}` : null]
    return [parts.filter(Boolean).join(', '), comparant.qualite].filter(Boolean).join(', ')
  }

  const identity = [p.civilite, [p.prenom, p.nom].filter(Boolean).join(' ')].filter(Boolean).join(' ')
  const naissance = formatDate(p.date_naissance)
  const isFeminine = p.civilite?.toLowerCase().startsWith('mme') || p.civilite?.toLowerCase().startsWith('madame')
  const bornSegment = naissance ? `né${isFeminine ? 'e' : ''} le ${naissance}${p.lieu_naissance ? ` à ${p.lieu_naissance}` : ''}` : null
  const adresseSegment = p.adresse ? `demeurant ${[p.adresse, p.code_postal, p.ville].filter(Boolean).join(' ')}` : null

  return [identity, bornSegment, adresseSegment, comparant.qualite].filter(Boolean).join(', ')
}

export function formatComparantsList(comparants: Comparant[]): string {
  return comparants.map(formatComparantIdentification).filter(Boolean).join(' ; ')
}

export function comparantDisplayName(comparant: Comparant): string {
  const p = comparant.personne
  if (!p) return comparant.qualite
  const name = p.type === 'morale' ? p.raison_sociale : [p.prenom, p.nom].filter(Boolean).join(' ')
  return `${name || 'Sans nom'} (${comparant.qualite})`
}
