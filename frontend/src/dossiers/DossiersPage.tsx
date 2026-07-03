import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Dossier } from '../types/database'
import { DossierListPage } from './DossierListPage'
import { DossierDetailPage } from './DossierDetailPage'

interface DossiersPageProps {
  tenantId: string
  focusId?: string | null
  onFocusHandled?: () => void
}

export function DossiersPage({ tenantId, focusId, onFocusHandled }: DossiersPageProps) {
  const [selected, setSelected] = useState<Dossier | null>(null)

  useEffect(() => {
    if (!focusId) return
    supabase.from('dossiers').select('*').eq('id', focusId).single().then(({ data }) => {
      if (data) setSelected(data)
      onFocusHandled?.()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId])

  return selected
    ? (
      <DossierDetailPage
        dossier={selected}
        onBack={() => setSelected(null)}
        onUpdated={setSelected}
      />
    )
    : <DossierListPage tenantId={tenantId} onSelect={setSelected} />
}
