import type { Immeuble, RegimeBien } from '../types/database'

export interface ImmeubleFormValues {
  type_bien: string
  designation: string
  references_cadastrales: string
  regime: RegimeBien | ''
  adresse: string
  ville: string
  code_postal: string
  pays: string
  valeur_declaree: string
  nombre_parts_total: string
}

export const EMPTY_IMMEUBLE_FORM: ImmeubleFormValues = {
  type_bien: '',
  designation: '',
  references_cadastrales: '',
  regime: '',
  adresse: '',
  ville: '',
  code_postal: '',
  pays: 'France',
  valeur_declaree: '',
  nombre_parts_total: '',
}

export function immeubleToForm(i: Immeuble): ImmeubleFormValues {
  return {
    type_bien: i.type_bien ?? '',
    designation: i.designation ?? '',
    references_cadastrales: i.references_cadastrales ?? '',
    regime: i.regime ?? '',
    adresse: i.adresse ?? '',
    ville: i.ville ?? '',
    code_postal: i.code_postal ?? '',
    pays: i.pays ?? 'France',
    valeur_declaree: i.valeur_declaree != null ? String(i.valeur_declaree) : '',
    nombre_parts_total: i.nombre_parts_total != null ? String(i.nombre_parts_total) : '',
  }
}

export function immeubleDisplayName(i: Pick<Immeuble, 'designation' | 'adresse' | 'references_cadastrales'>): string {
  return i.designation || i.adresse || i.references_cadastrales || 'Bien sans désignation'
}

export function immeubleFormError(values: ImmeubleFormValues): string | null {
  if (!values.designation.trim() && !values.adresse.trim() && !values.references_cadastrales.trim()) {
    return 'Renseignez au moins la désignation, l\'adresse ou les références cadastrales.'
  }
  return null
}

export function immeubleFormToInsertPayload(values: ImmeubleFormValues, tenantId: string) {
  return {
    tenant_id: tenantId,
    type_bien: values.type_bien || null,
    designation: values.designation.trim() || null,
    references_cadastrales: values.references_cadastrales.trim() || null,
    regime: values.regime || null,
    adresse: values.adresse.trim() || null,
    ville: values.ville.trim() || null,
    code_postal: values.code_postal.trim() || null,
    pays: values.pays.trim() || 'France',
    valeur_declaree: values.valeur_declaree.trim() ? Number(values.valeur_declaree) : null,
    nombre_parts_total: values.nombre_parts_total.trim() ? Number(values.nombre_parts_total) : null,
  }
}
