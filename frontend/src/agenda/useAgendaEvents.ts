import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Evenement } from '../types/database'

// Reads go through the evenements_agenda view (not the evenements table
// directly) so that private-event titre/description/lieu/categorie_id/couleur
// are redacted server-side for anyone who isn't the organizer, an invited
// participant, or admin/notaire — see the "evenements_agenda" migration.
// The category can't be embedded through the view (its categorie_id column is
// a CASE expression, so PostgREST can't trace the FK through it); AgendaPage
// resolves it client-side from the tenant's already-loaded category list.
const SELECT = `
  *,
  organisateur:utilisateurs!organisateur_id(*),
  participants:evenement_participants(*, utilisateur:utilisateurs(*)),
  dossiers:evenement_dossiers(*, dossier:dossiers(*))
`

export function useAgendaEvents(tenantId: string) {
  const [events, setEvents] = useState<Evenement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('evenements_agenda')
      .select(SELECT)
      .eq('tenant_id', tenantId)
      .order('debut', { ascending: true })
    if (error) setError('Impossible de charger les événements : ' + error.message)
    else setError(null)
    setEvents((data ?? []) as unknown as Evenement[])
    setLoading(false)
  }, [tenantId])

  useEffect(() => { reload() }, [reload])

  return { events, loading, error, reload }
}
