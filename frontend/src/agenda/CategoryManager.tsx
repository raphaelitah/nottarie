import { useState } from 'react'
import type { CSSProperties } from 'react'
import { supabase } from '../lib/supabase'
import { Button, Modal } from '../design-system'
import type { EvenementCategorie } from '../types/database'
import { CategoryFormDrawer, type CategoryFormResult } from './CategoryFormDrawer'

interface CategoryManagerProps {
  open: boolean
  tenantId: string
  categories: EvenementCategorie[]
  canManage: boolean
  onClose: () => void
  onChanged: () => void
}

export function CategoryManager({ open, tenantId, categories, canManage, onClose, onChanged }: CategoryManagerProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<EvenementCategorie | null>(null)
  const [saving, setSaving] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSave(result: CategoryFormResult) {
    setSaving(true)
    setError(null)
    const { error } = editing
      ? await supabase.from('evenement_categories').update({ nom: result.nom, couleur: result.couleur }).eq('id', editing.id)
      : await supabase.from('evenement_categories').insert({ tenant_id: tenantId, nom: result.nom, couleur: result.couleur })
    setSaving(false)
    if (error) { setError("Erreur lors de l'enregistrement : " + error.message); return }
    setDrawerOpen(false)
    setEditing(null)
    onChanged()
  }

  async function handleRemove(categorie: EvenementCategorie) {
    setRemovingId(categorie.id)
    const { error } = await supabase.from('evenement_categories').delete().eq('id', categorie.id)
    setRemovingId(null)
    if (error) { setError('Erreur lors de la suppression : ' + error.message); return }
    onChanged()
  }

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title="Catégories"
        subtitle="Catégories colorées partagées par l'étude"
        size="md"
        footer={<Button variant="secondary" size="sm" onClick={onClose}>Fermer</Button>}
      >
        {canManage && (
          <div style={{ marginBottom: '16px' }}>
            <Button variant="primary" size="sm" onClick={() => { setEditing(null); setDrawerOpen(true) }}>+ Nouvelle catégorie</Button>
          </div>
        )}

        {error && <div style={errorBanner}>{error}</div>}

        {categories.length === 0 ? (
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            Aucune catégorie pour le moment.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {categories.map((cat) => (
              <div key={cat.id} style={row}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: cat.couleur, flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: 'var(--n-900)' }}>{cat.nom}</span>
                </div>
                {canManage && (
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <Button variant="ghost" size="sm" onClick={() => { setEditing(cat); setDrawerOpen(true) }}>Modifier</Button>
                    <Button variant="ghost" size="sm" disabled={removingId === cat.id} onClick={() => handleRemove(cat)}>
                      {removingId === cat.id ? '…' : 'Supprimer'}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>

      <CategoryFormDrawer
        open={drawerOpen}
        initialValues={editing}
        saving={saving}
        onSave={handleSave}
        onClose={() => { setDrawerOpen(false); setEditing(null) }}
      />
    </>
  )
}

const row: CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '10px 14px', background: 'var(--surface-base)',
  border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)',
}

const errorBanner: CSSProperties = {
  background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px',
  padding: '10px 14px', marginBottom: '16px',
  fontFamily: 'var(--font-sans)', fontSize: '13px', color: '#DC2626',
}
