import { EntityDocumentsSection } from '../documents/EntityDocumentsSection'

interface PersonneDocumentsSectionProps {
  tenantId: string
  personneId: string
}

export function PersonneDocumentsSection({ tenantId, personneId }: PersonneDocumentsSectionProps) {
  return (
    <EntityDocumentsSection
      tenantId={tenantId}
      entityColumn="personne_id"
      entityId={personneId}
      storageSegment="personnes"
      emptyLabel="Aucun document déposé pour cette personne."
    />
  )
}
