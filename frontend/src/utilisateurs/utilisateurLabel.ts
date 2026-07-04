import type { Utilisateur } from '../types/database'

export function utilisateurLabel(u?: Utilisateur | null): string {
  if (!u) return 'Utilisateur inconnu'
  const name = [u.prenom, u.nom].filter(Boolean).join(' ')
  return name || u.email || 'Utilisateur sans nom'
}
