import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Immeuble } from '../types/database'
import { ImmeubleListPage } from './ImmeubleListPage'
import { ImmeubleDetailPage } from './ImmeubleDetailPage'

interface ImmeublesPageProps {
  tenantId: string
  onSelectDossier?: (id: string) => void
  onSelectPersonne?: (id: string) => void
}

export function ImmeublesPage({ tenantId, onSelectDossier, onSelectPersonne }: ImmeublesPageProps) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [selected, setSelected] = useState<Immeuble | null>(null)

  useEffect(() => {
    if (!id) { setSelected(null); return }
    supabase.from('immeubles').select('*').eq('id', id).single().then(({ data }) => {
      if (data) setSelected(data)
    })
  }, [id])

  return selected
    ? (
      <ImmeubleDetailPage
        immeuble={selected}
        onBack={() => navigate('/immeubles')}
        onUpdated={setSelected}
        onSelectDossier={onSelectDossier}
        onSelectPersonne={onSelectPersonne}
      />
    )
    : <ImmeubleListPage tenantId={tenantId} onSelect={(im) => navigate(`/immeubles/${im.id}`)} onSelectDossier={onSelectDossier} />
}
