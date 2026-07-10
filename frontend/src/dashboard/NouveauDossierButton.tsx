import { useState } from 'react'
import type { CSSProperties } from 'react'
import { supabase } from '../lib/supabase'
import { Button } from '../design-system'
import { ACTE_TYPE_OPTIONS } from '../constants/acteTypes'
import type { Dossier, Utilisateur } from '../types/database'
import { DossierFormDrawer, type DossierFormValues } from '../dossiers/DossierFormDrawer'

interface NouveauDossierButtonProps {
  tenantId: string
  defaultClercId?: string
  onCreated: (dossierId: string) => void
}

export function NouveauDossierButton({ tenantId, defaultClercId, onCreated }: NouveauDossierButtonProps) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notaires, setNotaires] = useState<Utilisateur[]>([])
  const [clercs, setClercs] = useState<Utilisateur[]>([])
  const [dossiers, setDossiers] = useState<Dossier[]>([])
  const [error, setError] = useState<string | null>(null)

  async function openDrawer() {
    setError(null)
    setOpen(true)
    const [{ data: notairesData }, { data: clercsData }, { data: dossiersData }] = await Promise.all([
      supabase.from('utilisateurs').select('*').eq('tenant_id', tenantId).eq('actif', true).contains('roles', ['notaire']),
      supabase.from('utilisateurs').select('*').eq('tenant_id', tenantId).eq('actif', true).contains('roles', ['redacteur']),
      supabase.from('dossiers').select('*').eq('tenant_id', tenantId).is('archived_at', null),
    ])
    setNotaires(notairesData ?? [])
    setClercs(clercsData ?? [])
    setDossiers(dossiersData ?? [])
  }

  async function handleCreate(values: DossierFormValues) {
    setSaving(true)
    const branche = ACTE_TYPE_OPTIONS.find((o) => o.value === values.type_acte)?.branche ?? 'famille'
    const { data, error } = await supabase
      .from('dossiers')
      .insert({
        tenant_id: tenantId,
        branche,
        type_acte: values.type_acte,
        nom: values.nom.trim() || null,
        notaire_id: values.notaire_id,
        clerc_attitre_id: values.clerc_attitre_id,
        dossier_parent_id: values.dossier_parent_id,
      })
      .select('id')
      .single()
    setSaving(false)
    if (error) {
      setError(error.code === '23505' ? 'Un dossier avec ce numéro existe déjà.' : 'Erreur lors de la création : ' + error.message)
      return
    }
    setOpen(false)
    if (data) onCreated(data.id)
  }

  return (
    <div style={{ position: 'relative' }}>
      <Button variant="primary" size="sm" onClick={openDrawer}>+ Nouveau dossier</Button>
      {error && <div style={errorBanner}>{error}</div>}

      <DossierFormDrawer
        open={open}
        saving={saving}
        notaires={notaires}
        clercs={clercs}
        dossiers={dossiers}
        defaultClercId={defaultClercId}
        onSave={handleCreate}
        onClose={() => setOpen(false)}
      />
    </div>
  )
}

const errorBanner: CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 6px)',
  right: 0,
  width: '260px',
  background: '#FEF2F2',
  border: '1px solid #FECACA',
  borderRadius: 'var(--radius-md)',
  padding: 'var(--space-2) var(--space-3)',
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xs)',
  color: '#DC2626',
  zIndex: 10,
}
