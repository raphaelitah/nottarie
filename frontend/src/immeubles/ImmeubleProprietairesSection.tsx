import { TitulairesDePartsSection } from '../shared/titulaires/TitulairesDePartsSection'

interface ImmeubleProprietairesSectionProps {
  tenantId: string
  immeubleId: string
  nombrePartsTotal: number | null
  onNombrePartsTotalChange: (value: number | null) => void
  onSelectPersonne?: (id: string) => void
}

export function ImmeubleProprietairesSection({ tenantId, immeubleId, nombrePartsTotal, onNombrePartsTotalChange, onSelectPersonne }: ImmeubleProprietairesSectionProps) {
  return (
    <TitulairesDePartsSection
      tenantId={tenantId}
      parentId={immeubleId}
      titulaireTable="immeuble_proprietaires"
      parentIdColumn="immeuble_id"
      personneIdColumn="personne_id"
      parentTotalTable="immeubles"
      sectionTitle="Propriétaires"
      addButtonLabel="Ajouter un propriétaire"
      drawerTitle="Ajouter un propriétaire"
      emptyLabel="Aucun propriétaire rattaché à ce bien."
      itemLabelSingular="propriétaire"
      nombrePartsTotal={nombrePartsTotal}
      onNombrePartsTotalChange={onNombrePartsTotalChange}
      onSelectPersonne={onSelectPersonne}
    />
  )
}
