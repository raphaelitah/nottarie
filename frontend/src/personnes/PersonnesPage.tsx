import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Personne } from '../types/database'
import { PersonneListPage } from './PersonneListPage'
import { PersonneDetailPage } from './PersonneDetailPage'

interface PersonnesPageProps {
  tenantId: string
  onSelectDossier?: (id: string) => void
  onSelectImmeuble?: (id: string) => void
}

export function PersonnesPage({ tenantId, onSelectDossier, onSelectImmeuble }: PersonnesPageProps) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [selected, setSelected] = useState<Personne | null>(null)

  useEffect(() => {
    if (!id) { setSelected(null); return }
    supabase.from('personnes').select('*').eq('id', id).single().then(({ data }) => {
      if (data) setSelected(data)
    })
  }, [id])

  return selected
    ? (
      <PersonneDetailPage
        personne={selected}
        onBack={() => navigate('/personnes')}
        onUpdated={setSelected}
        onSelectDossier={onSelectDossier}
        onSelectImmeuble={onSelectImmeuble}
      />
    )
    : <PersonneListPage tenantId={tenantId} onSelect={(p) => navigate(`/personnes/${p.id}`)} onSelectDossier={onSelectDossier} />
}
