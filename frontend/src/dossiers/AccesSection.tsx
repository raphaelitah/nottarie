import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { supabase } from '../lib/supabase'
import { Button } from '../design-system'
import type { Dossier, DossierAcces, Utilisateur } from '../types/database'
import { utilisateurLabel } from '../utilisateurs/utilisateurLabel'
import { AccesGrantDrawer } from './AccesGrantDrawer'

interface AccesSectionProps {
  dossier: Dossier
  canManage: boolean
  onUpdated: (dossier: Dossier) => void
}

export function AccesSection({ dossier, canManage, onUpdated }: AccesSectionProps) {
  const [grants, setGrants] = useState<DossierAcces[]>([])
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [togglingRestriction, setTogglingRestriction] = useState(false)

  async function loadGrants() {
    setLoading(true)
    const { data, error } = await supabase
      .from('dossier_acces')
      .select('*, utilisateur:utilisateurs(*)')
      .eq('dossier_id', dossier.id)
    if (error) setError('Impossible de charger les accès : ' + error.message)
    else setError(null)
    setGrants(data ?? [])
    setLoading(false)
  }

  async function loadUtilisateurs() {
    const { data } = await supabase
      .from('utilisateurs')
      .select('*')
      .eq('tenant_id', dossier.tenant_id)
      .eq('actif', true)
    setUtilisateurs(data ?? [])
  }

  useEffect(() => {
    loadGrants(); loadUtilisateurs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossier.id, dossier.tenant_id])

  async function handleToggleRestriction() {
    setTogglingRestriction(true)
    setError(null)
    const { data, error } = await supabase
      .from('dossiers')
      .update({ acces_restreint: !dossier.acces_restreint })
      .eq('id', dossier.id)
      .select()
      .single()
    setTogglingRestriction(false)
    if (error) { setError('Erreur lors de la mise à jour : ' + error.message); return }
    onUpdated(data)
  }

  async function handleGrant(utilisateurId: string) {
    setSaving(true)
    setError(null)
    const { error } = await supabase.from('dossier_acces').insert({
      tenant_id: dossier.tenant_id,
      dossier_id: dossier.id,
      utilisateur_id: utilisateurId,
    })
    setSaving(false)
    if (error) { setError("Erreur lors de l'ajout : " + error.message); return }
    setDrawerOpen(false)
    loadGrants()
  }

  async function handleRevoke(grant: DossierAcces) {
    setRemovingId(grant.id)
    setError(null)
    const { error } = await supabase.from('dossier_acces').delete().eq('id', grant.id)
    setRemovingId(null)
    if (error) { setError('Erreur lors du retrait : ' + error.message); return }
    loadGrants()
  }

  // Administrateurs and notaires always see a restricted dossier regardless
  // of dossier_acces (RLS bypass), as does whoever created it — show them as
  // implied access, not offer them again in the "donner accès" picker.
  const implied: { utilisateur: Utilisateur; tags: string[] }[] = []
  for (const u of utilisateurs) {
    const tags: string[] = []
    if (u.id === dossier.notaire_id) tags.push('Notaire du dossier')
    else if (u.roles.includes('notaire')) tags.push('Notaire')
    if (u.roles.includes('administrateur')) tags.push('Administrateur')
    if (u.id === dossier.clerc_attitre_id) tags.push('Clerc attitré')
    if (u.id === dossier.cree_par) tags.push('Créateur')
    if (tags.length > 0) implied.push({ utilisateur: u, tags })
  }
  const impliedIds = implied.map((i) => i.utilisateur.id)
  const additionalGrants = grants.filter((g) => !impliedIds.includes(g.utilisateur_id))
  const excludedIds = [...impliedIds, ...grants.map((g) => g.utilisateur_id)]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
        <h3 style={h3}>Accès au dossier</h3>
        {canManage && (
          <Button variant="secondary" size="sm" disabled={togglingRestriction} onClick={handleToggleRestriction}>
            {dossier.acces_restreint ? "Ouvrir à toute l'étude" : "Restreindre l'accès"}
          </Button>
        )}
      </div>

      {!canManage && (
        <p style={subtitle}>Seuls les notaires, les administrateurs et le clerc attitré peuvent modifier ces accès.</p>
      )}

      {error && (
        <div style={{
          background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-md)',
          padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-4)',
          fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: '#DC2626',
        }}>{error}</div>
      )}

      {!dossier.acces_restreint ? (
        <div style={emptyCard}>Ce dossier est visible par tous les membres de l'étude.</div>
      ) : (
        <>
          <div style={subheading}>Accès de droit</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
            {implied.map(({ utilisateur, tags }) => (
              <div key={utilisateur.id} style={row}>
                <div style={{ minWidth: 0 }}>
                  <span style={name}>{utilisateurLabel(utilisateur)}</span>
                  {tags.map((t) => <span key={t} style={meta}>{t}</span>)}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
            <div style={subheading}>Accès supplémentaire</div>
            {canManage && (
              <Button variant="primary" size="sm" onClick={() => setDrawerOpen(true)}>+ Donner accès</Button>
            )}
          </div>

          {loading ? (
            <div style={emptyCard}>Chargement…</div>
          ) : additionalGrants.length === 0 ? (
            <div style={emptyCard}>Aucun accès supplémentaire pour l'instant.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {additionalGrants.map((g) => (
                <div key={g.id} style={row}>
                  <span style={name}>{utilisateurLabel(g.utilisateur)}</span>
                  {canManage && (
                    <Button variant="ghost" size="sm" disabled={removingId === g.id} onClick={() => handleRevoke(g)}>
                      {removingId === g.id ? '…' : 'Retirer'}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {canManage && (
        <AccesGrantDrawer
          open={drawerOpen}
          utilisateurs={utilisateurs}
          grantedIds={excludedIds}
          saving={saving}
          onSave={handleGrant}
          onClose={() => setDrawerOpen(false)}
        />
      )}
    </div>
  )
}

const h3: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-base)',
  fontWeight: 600,
  color: 'var(--n-900)',
  margin: 0,
}

const subtitle: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  color: 'var(--text-muted)',
  margin: '0 0 var(--space-4)',
}

const subheading: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-2xs)',
  fontWeight: 600,
  color: 'var(--n-500)',
  letterSpacing: 'var(--tracking-caps)',
  textTransform: 'uppercase',
  marginBottom: 'var(--space-2)',
}

const emptyCard: CSSProperties = {
  background: 'var(--surface-base)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--space-6)',
  textAlign: 'center',
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  color: 'var(--text-muted)',
}

const row: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 'var(--space-4)',
  padding: 'var(--space-3) var(--space-4)',
  background: 'var(--surface-base)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-md)',
}

const name: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  fontWeight: 600,
  color: 'var(--n-900)',
}

const meta: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xs)',
  color: 'var(--text-muted)',
  marginLeft: 'var(--space-3)',
}
