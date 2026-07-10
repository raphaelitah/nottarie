import type { Comparant, Personne } from '../types/database'
import { personneDisplayName } from '../personnes/personneForm'

function nomOf(p: Personne): string {
  return (p.nom || p.raison_sociale || '').toUpperCase()
}

// Suggests a dossier name from its comparants, following the qualité conventions
// in QUALITE_SUGGESTIONS (constants/personneTypes.ts). Editable by the user —
// this is only ever used as a fallback/placeholder, never persisted automatically.
export function suggestDossierNom(typeActe: string, comparants: Comparant[]): string | null {
  const withPersonne = comparants.filter((c): c is Comparant & { personne: Personne } => !!c.personne)

  if (typeActe === 'succession') {
    const defunt = withPersonne.find((c) => c.qualite.trim().toLowerCase().startsWith('défunt') || c.qualite.trim().toLowerCase().startsWith('defunt'))
    return defunt ? `Succession de ${personneDisplayName(defunt.personne)}` : null
  }

  if (typeActe === 'donation') {
    const donataires = withPersonne.filter((c) => c.qualite.trim().toLowerCase().startsWith('donataire'))
    const noms = Array.from(new Set(donataires.map((c) => nomOf(c.personne)).filter(Boolean)))
    if (noms.length === 0) return null
    return `Donation ${noms.join('-')}`
  }

  return null
}
