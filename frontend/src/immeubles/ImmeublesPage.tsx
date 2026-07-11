import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Immeuble } from '../types/database'
import { ImmeubleListPage } from './ImmeubleListPage'
import { ImmeubleDetailPage } from './ImmeubleDetailPage'

interface ImmeublesPageProps {
  tenantId: string
  focusId?: string | null
  onFocusHandled?: () => void
  onSelectDossier?: (id: string) => void
  onSelectPersonne?: (id: string) => void
}

export function ImmeublesPage({ tenantId, focusId, onFocusHandled, onSelectDossier, onSelectPersonne }: ImmeublesPageProps) {
  const [selected, setSelected] = useState<Immeuble | null>(null)

  useEffect(() => {
    if (!focusId) return
    supabase.from('immeubles').select('*').eq('id', focusId).single().then(({ data }) => {
      if (data) setSelected(data)
      onFocusHandled?.()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId])

  return selected
    ? (
      <ImmeubleDetailPage
        immeuble={selected}
        onBack={() => setSelected(null)}
        onUpdated={setSelected}
        onSelectDossier={onSelectDossier}
        onSelectPersonne={onSelectPersonne}
      />
    )
    : <ImmeubleListPage tenantId={tenantId} onSelect={setSelected} onSelectDossier={onSelectDossier} />
}
