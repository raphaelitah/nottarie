import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Personne } from '../types/database'
import { PersonneListPage } from './PersonneListPage'
import { PersonneDetailPage } from './PersonneDetailPage'

interface PersonnesPageProps {
  tenantId: string
  focusId?: string | null
  onFocusHandled?: () => void
  onSelectDossier?: (id: string) => void
  onSelectImmeuble?: (id: string) => void
}

export function PersonnesPage({ tenantId, focusId, onFocusHandled, onSelectDossier, onSelectImmeuble }: PersonnesPageProps) {
  const [selected, setSelected] = useState<Personne | null>(null)

  useEffect(() => {
    if (!focusId) return
    supabase.from('personnes').select('*').eq('id', focusId).single().then(({ data }) => {
      if (data) setSelected(data)
      onFocusHandled?.()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId])

  return selected
    ? (
      <PersonneDetailPage
        personne={selected}
        onBack={() => setSelected(null)}
        onUpdated={setSelected}
        onSelectDossier={onSelectDossier}
        onSelectImmeuble={onSelectImmeuble}
      />
    )
    : <PersonneListPage tenantId={tenantId} onSelect={setSelected} onSelectDossier={onSelectDossier} />
}
