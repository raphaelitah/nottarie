import { lazy, Suspense, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Acte, Dossier } from '../types/database'
import { DossierListPage } from './DossierListPage'
import { DossierDetailPage } from './DossierDetailPage'

const ActeComposerPage = lazy(() => import('./composer/ActeComposerPage').then((m) => ({ default: m.ActeComposerPage })))

interface DossiersPageProps {
  tenantId: string
  focusId?: string | null
  onFocusHandled?: () => void
  onSelectPersonne?: (id: string) => void
  onSelectImmeuble?: (id: string) => void
  onOpenAgenda?: () => void
}

export function DossiersPage({ tenantId, focusId, onFocusHandled, onSelectPersonne, onSelectImmeuble, onOpenAgenda }: DossiersPageProps) {
  const [selected, setSelected] = useState<Dossier | null>(null)
  const [composerActe, setComposerActe] = useState<Acte | 'new' | null>(null)

  useEffect(() => {
    if (!focusId) return
    supabase.from('dossiers').select('*').eq('id', focusId).single().then(({ data }) => {
      if (data) setSelected(data)
      onFocusHandled?.()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId])

  if (selected && composerActe) {
    return (
      <Suspense fallback={<p>Chargement…</p>}>
        <ActeComposerPage
          dossier={selected}
          acte={composerActe === 'new' ? undefined : composerActe}
          onBack={() => setComposerActe(null)}
          onGenerated={() => setComposerActe(null)}
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
        onOpenComposer={() => setComposerActe('new')}
        onEditActe={(acte) => setComposerActe(acte)}
        onSelectPersonne={onSelectPersonne}
        onSelectImmeuble={onSelectImmeuble}
        onOpenAgenda={onOpenAgenda}
      />
    )
    : <DossierListPage tenantId={tenantId} onSelect={setSelected} />
}
