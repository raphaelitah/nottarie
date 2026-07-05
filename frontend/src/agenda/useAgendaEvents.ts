import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Evenement } from '../types/database'

const SELECT = `
  *,
  categorie:evenement_categories(*),
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
      .from('evenements')
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
