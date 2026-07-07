import { Input, Select } from '../design-system'
import type { PersonneType } from '../types/database'
import {
  PERSONNE_TYPE_OPTIONS,
  CIVILITE_OPTIONS,
  SITUATION_MATRIMONIALE_OPTIONS,
  REGIME_MATRIMONIAL_OPTIONS,
} from '../constants/personneTypes'
import { PAYS_OPTIONS, DEPARTEMENTS_OPTIONS, ETRANGER } from '../constants/geo'
import type { PersonneFormValues } from './personneForm'

interface PersonneFieldsProps {
  values: PersonneFormValues
  onChange: (values: PersonneFormValues) => void
}

export function PersonneFields({ values, onChange }: PersonneFieldsProps) {
  const set = (patch: Partial<PersonneFormValues>) => onChange({ ...values, ...patch })

  function setPaysNaissance(pays: string) {
    if (pays === 'France') {
      set({ pays_naissance: pays, departement_naissance: values.departement_naissance === ETRANGER ? '' : values.departement_naissance })
    } else {
      set({ pays_naissance: pays, departement_naissance: ETRANGER })
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Select
        label="Type"
        required
        options={PERSONNE_TYPE_OPTIONS}
        value={values.type}
        onChange={(e) => set({ type: e.target.value as PersonneType })}
      />

      {values.type === 'physique' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 2fr', gap: '16px' }}>
          <Select
            label="Civilité"
            options={CIVILITE_OPTIONS}
            value={values.civilite}
            onChange={(e) => set({ civilite: e.target.value })}
          />
          <Input label="Prénom" value={values.prenom} onChange={(e) => set({ prenom: e.target.value })} />
          <Input label="Nom" required value={values.nom} onChange={(e) => set({ nom: e.target.value })} />
        </div>
      ) : (
        <Input
          label="Raison sociale"
          required
          placeholder={values.type === 'morale' ? 'ex. SCI Les Tilleuls' : 'ex. Crédit Agricole'}
          value={values.raison_sociale}
          onChange={(e) => set({ raison_sociale: e.target.value })}
        />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Input label="Email" type="email" value={values.email} onChange={(e) => set({ email: e.target.value })} />
        <Input label="Téléphone" value={values.telephone} onChange={(e) => set({ telephone: e.target.value })} />
      </div>

      <Input label="Adresse" value={values.adresse} onChange={(e) => set({ adresse: e.target.value })} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 2fr', gap: '16px' }}>
        <Input label="Code postal" value={values.code_postal} onChange={(e) => set({ code_postal: e.target.value })} />
        <Input label="Ville" value={values.ville} onChange={(e) => set({ ville: e.target.value })} />
        <Select
          label="Pays"
          options={PAYS_OPTIONS}
          value={values.pays}
          onChange={(e) => set({ pays: e.target.value })}
        />
      </div>

      {values.type === 'physique' && (
        <>
          <div style={sectionLabelStyle}>État civil</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input
              label="Date de naissance"
              type="date"
              value={values.date_naissance}
              onChange={(e) => set({ date_naissance: e.target.value })}
            />
            <Select
              label="Pays de naissance"
              options={PAYS_OPTIONS}
              value={values.pays_naissance}
              onChange={(e) => setPaysNaissance(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: values.pays_naissance === 'France' ? '1fr 1fr' : '1fr', gap: '16px' }}>
            {values.pays_naissance === 'France' && (
              <Select
                label="Département de naissance"
                options={DEPARTEMENTS_OPTIONS}
                value={values.departement_naissance}
                onChange={(e) => set({ departement_naissance: e.target.value })}
              />
            )}
            <Input
              label="Lieu de naissance"
              value={values.lieu_naissance}
              onChange={(e) => set({ lieu_naissance: e.target.value })}
            />
          </div>

          <Select
            label="Nationalité"
            options={PAYS_OPTIONS}
            value={values.nationalite}
            onChange={(e) => set({ nationalite: e.target.value })}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Select
              label="Situation matrimoniale"
              options={SITUATION_MATRIMONIALE_OPTIONS}
              value={values.situation_matrimoniale}
              onChange={(e) => set({ situation_matrimoniale: e.target.value })}
            />
            <Select
              label="Régime matrimonial"
              options={REGIME_MATRIMONIAL_OPTIONS}
              value={values.regime_matrimonial}
              onChange={(e) => set({ regime_matrimonial: e.target.value })}
            />
          </div>

          <div style={sectionLabelStyle}>Décès (le cas échéant)</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input
              label="Date de décès"
              type="date"
              value={values.date_deces}
              onChange={(e) => set({ date_deces: e.target.value })}
            />
            <Input
              label="Lieu de décès"
              value={values.lieu_deces}
              onChange={(e) => set({ lieu_deces: e.target.value })}
            />
          </div>
        </>
      )}
    </div>
  )
}

const sectionLabelStyle = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xs)',
  fontWeight: 600,
  color: 'var(--text-muted)',
  letterSpacing: 'var(--tracking-caps)',
  textTransform: 'uppercase' as const,
  marginTop: '4px',
}
