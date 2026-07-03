import { useState } from 'react'
import type { Dossier } from '../types/database'
import { DossierListPage } from './DossierListPage'
import { DossierDetailPage } from './DossierDetailPage'

interface DossiersPageProps {
  tenantId: string
}

export function DossiersPage({ tenantId }: DossiersPageProps) {
  const [selected, setSelected] = useState<Dossier | null>(null)

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
