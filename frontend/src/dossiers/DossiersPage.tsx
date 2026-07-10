import { lazy, Suspense, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Dossier } from '../types/database'
import { DossierListPage } from './DossierListPage'
import { DossierDetailPage } from './DossierDetailPage'

const ActeComposerPage = lazy(() => import('./composer/ActeComposerPage').then((m) => ({ default: m.ActeComposerPage })))

interface DossiersPageProps {
  tenantId: string
  focusId?: string | null
  onFocusHandled?: () => void
  onSelectPersonne?: (id: string) => void
  onSelectImmeuble?: (id: string) => void
}

export function DossiersPage({ tenantId, focusId, onFocusHandled, onSelectPersonne, onSelectImmeuble }: DossiersPageProps) {
  const [selected, setSelected] = useState<Dossier | null>(null)
  const [composing, setComposing] = useState(false)

  useEffect(() => {
    if (!focusId) return
    supabase.from('dossiers').select('*').eq('id', focusId).single().then(({ data }) => {
      if (data) setSelected(data)
      onFocusHandled?.()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId])

  if (selected && composing) {
    return (
      <Suspense fallback={<p>Chargement…</p>}>
        <ActeComposerPage
          dossier={selected}
          onBack={() => setComposing(false)}
          onGenerated={() => setComposing(false)}
        />
      </Suspense>
    )
  }

  return selected
    ? (
      <DossierDetailPage
        dossier={selected}
        onBack={() => setSelected(null)}
        onUpdated={setSelected}
        onOpenComposer={() => setComposing(true)}
        onSelectPersonne={onSelectPersonne}
        onSelectImmeuble={onSelectImmeuble}
      />
    )
    : <DossierListPage tenantId={tenantId} onSelect={setSelected} />
}
