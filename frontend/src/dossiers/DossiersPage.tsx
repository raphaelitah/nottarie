import { lazy, Suspense, useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Acte, Dossier } from '../types/database'
import { DossierListPage } from './DossierListPage'
import { DossierDetailPage } from './DossierDetailPage'

const ActeComposerPage = lazy(() => import('./composer/ActeComposerPage').then((m) => ({ default: m.ActeComposerPage })))
const ActeRelecturePage = lazy(() => import('./composer/ActeRelecturePage').then((m) => ({ default: m.ActeRelecturePage })))

interface DossiersPageProps {
  tenantId: string
  onSelectPersonne?: (id: string) => void
  onSelectImmeuble?: (id: string) => void
  onOpenAgenda?: () => void
}

export function DossiersPage({ tenantId, onSelectPersonne, onSelectImmeuble, onOpenAgenda }: DossiersPageProps) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const focusComparants = !!(location.state as { focusComparants?: boolean } | null)?.focusComparants
  const [selected, setSelected] = useState<Dossier | null>(null)
  const [composerActe, setComposerActe] = useState<Acte | 'new' | null>(null)
  const [relectureActe, setRelectureActe] = useState<Acte | null>(null)

  useEffect(() => {
    setComposerActe(null)
    setRelectureActe(null)
    if (!id) { setSelected(null); return }
    supabase.from('dossiers').select('*').eq('id', id).single().then(({ data }) => {
      if (data) setSelected(data)
    })
  }, [id])

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

  if (selected && relectureActe) {
    return (
      <Suspense fallback={<p>Chargement…</p>}>
        <ActeRelecturePage
          dossier={selected}
          acte={relectureActe}
          onBack={() => setRelectureActe(null)}
        />
      </Suspense>
    )
  }

  return selected
    ? (
      <DossierDetailPage
        dossier={selected}
        focusComparants={focusComparants}
        onBack={() => navigate('/dossiers')}
        onUpdated={setSelected}
        onOpenComposer={() => setComposerActe('new')}
        onEditActe={(acte) => setComposerActe(acte)}
        onOpenRelecture={(acte) => setRelectureActe(acte)}
        onSelectPersonne={onSelectPersonne}
        onSelectImmeuble={onSelectImmeuble}
        onOpenAgenda={onOpenAgenda}
      />
    )
    : (
      <DossierListPage
        tenantId={tenantId}
        onSelect={(d, opts) => navigate(`/dossiers/${d.id}`, opts?.justCreated ? { state: { focusComparants: true } } : undefined)}
      />
    )
}
