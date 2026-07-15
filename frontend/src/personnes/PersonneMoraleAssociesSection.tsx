import { TitulairesDePartsSection } from '../shared/titulaires/TitulairesDePartsSection'
import type { Personne } from '../types/database'

interface PersonneMoraleAssociesSectionProps {
  tenantId: string
  personneMorale: Personne
  onNombrePartsTotalChange: (value: number | null) => void
  onSelectPersonne?: (id: string) => void
}

export function PersonneMoraleAssociesSection({ tenantId, personneMorale, onNombrePartsTotalChange, onSelectPersonne }: PersonneMoraleAssociesSectionProps) {
  return (
    <TitulairesDePartsSection
      tenantId={tenantId}
      parentId={personneMorale.id}
      titulaireTable="personne_morale_associes"
      parentIdColumn="personne_morale_id"
      personneIdColumn="titulaire_personne_id"
      parentTotalTable="personnes"
      sectionTitle="Associés"
      addButtonLabel="Ajouter un associé"
      drawerTitle="Ajouter un associé"
      emptyLabel="Aucun associé rattaché à cette personne morale."
      itemLabelSingular="associé"
      nombrePartsTotal={personneMorale.nombre_parts_total}
      onNombrePartsTotalChange={onNombrePartsTotalChange}
      onSelectPersonne={onSelectPersonne}
      excludePersonneId={personneMorale.id}
    />
  )
}
