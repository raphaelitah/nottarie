import { EntityDocumentsSection } from '../documents/EntityDocumentsSection'

interface ImmeubleDocumentsSectionProps {
  tenantId: string
  immeubleId: string
}

export function ImmeubleDocumentsSection({ tenantId, immeubleId }: ImmeubleDocumentsSectionProps) {
  return (
    <EntityDocumentsSection
      tenantId={tenantId}
      entityColumn="immeuble_id"
      entityId={immeubleId}
      storageSegment="immeubles"
      emptyLabel="Aucun document déposé pour cet immeuble."
    />
  )
}
