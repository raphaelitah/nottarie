// A trame's "auto" champ fields declare where their value comes from, so acte
// generation can resolve them from the dossier's own data instead of asking the
// rédacteur to retype identity facts that already live on a comparant's personne.
// Trames are shared/national (no tenant_id), so a comparant source can only
// reference the fixed, well-known qualité vocabulary (QUALITE_SUGGESTIONS) —
// not a tenant's custom additions, which stay manual-fill for any trame.
import { QUALITE_SUGGESTIONS } from '../constants/personneTypes'

export const SESSION_ATTRIBUTE_OPTIONS: { value: string; label: string }[] = [
  { value: 'date_acte', label: "Date de signature de l'acte" },
  { value: 'notaire_nom', label: 'Nom du notaire rédacteur' },
]

export const ETUDE_ATTRIBUTE_OPTIONS: { value: string; label: string }[] = [
  { value: 'raison_sociale', label: "Raison sociale de l'étude" },
  { value: 'ville', label: "Ville de l'étude" },
  { value: 'adresse', label: "Adresse de l'étude" },
]

export const PERSONNE_ATTRIBUTE_OPTIONS: { value: string; label: string }[] = [
  { value: 'civilite', label: 'Civilité' },
  { value: 'nom', label: 'Nom' },
  { value: 'prenom', label: 'Prénom(s)' },
  { value: 'date_naissance', label: 'Date de naissance' },
  { value: 'lieu_naissance', label: 'Lieu de naissance' },
  { value: 'nationalite', label: 'Nationalité' },
  { value: 'adresse', label: 'Adresse' },
  { value: 'situation_matrimoniale', label: 'Situation matrimoniale' },
  { value: 'regime_matrimonial', label: 'Régime matrimonial' },
  { value: 'date_deces', label: 'Date de décès' },
  { value: 'lieu_deces', label: 'Lieu de décès' },
  { value: 'email', label: 'Email' },
  { value: 'telephone', label: 'Téléphone' },
]

export const COMPARANT_QUALITE_OPTIONS = QUALITE_SUGGESTIONS

export type ChampSourceKind = 'session' | 'etude' | 'comparant'

export interface ParsedChampSource {
  kind: ChampSourceKind
  qualite?: string
  attribute: string
}

export function parseChampSource(source: string | null | undefined): ParsedChampSource | null {
  if (!source) return null
  const parts = source.split(':')
  if (parts[0] === 'session' && parts[1]) return { kind: 'session', attribute: parts[1] }
  if (parts[0] === 'etude' && parts[1]) return { kind: 'etude', attribute: parts[1] }
  if (parts[0] === 'comparant' && parts[1] && parts[2]) return { kind: 'comparant', qualite: parts[1], attribute: parts[2] }
  return null
}

export function buildChampSource(parsed: ParsedChampSource): string {
  if (parsed.kind === 'comparant') return `comparant:${parsed.qualite}:${parsed.attribute}`
  return `${parsed.kind}:${parsed.attribute}`
}

export function champSourceLabel(source: string | null | undefined): string | null {
  const parsed = parseChampSource(source)
  if (!parsed) return null
  if (parsed.kind === 'session') return SESSION_ATTRIBUTE_OPTIONS.find((o) => o.value === parsed.attribute)?.label ?? parsed.attribute
  if (parsed.kind === 'etude') return `Étude — ${ETUDE_ATTRIBUTE_OPTIONS.find((o) => o.value === parsed.attribute)?.label ?? parsed.attribute}`
  const attrLabel = PERSONNE_ATTRIBUTE_OPTIONS.find((o) => o.value === parsed.attribute)?.label ?? parsed.attribute
  return `${parsed.qualite} — ${attrLabel}`
}
