import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Button, Input, MOBILE_QUERY, Select, useMediaQuery, HoverIconButton } from '../design-system'
import type { RoleNotarial, Utilisateur } from '../types/database'
import { ROLE_OPTIONS } from '../constants/roles'

interface InviteForm {
  email: string
  prenom: string
  nom: string
  role: RoleNotarial
}

const EMPTY_INVITE: InviteForm = {
  email: '',
  prenom: '',
  nom: '',
  role: 'assistant',
}

export function EtudeUsersSection({ etudeId }: { etudeId: string }) {
  const mobile = useMediaQuery(MOBILE_QUERY)
  const [users, setUsers] = useState<Utilisateur[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [inviteForm, setInviteForm] = useState<InviteForm>(EMPTY_INVITE)
  const [inviting, setInviting] = useState(false)
  const [showInvite, setShowInvite] = useState(false)

  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [editingRoles, setEditingRoles] = useState<RoleNotarial[]>([])
  const [savingUserId, setSavingUserId] = useState<string | null>(null)
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null)
  const [confirmDisableId, setConfirmDisableId] = useState<string | null>(null)
  const [resettingPasswordId, setResettingPasswordId] = useState<string | null>(null)
  const [resendingInviteId, setResendingInviteId] = useState<string | null>(null)

  async function loadUsers() {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-etude-users?tenant_id=${etudeId}`,
      { headers: { Authorization: `Bearer ${session?.access_token}` } }
    )
    const json = await response.json()
    setUsers(json.users ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etudeId])

  async function invokeUserAction(body: object) {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-user-action`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    )
    return res.json()
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!inviteForm.email.trim()) { setError('L\'email est obligatoire.'); return }
    setInviting(true)
    const { data: { session } } = await supabase.auth.getSession()
    const res = await supabase.functions.invoke('invite-user', {
      body: {
        email: inviteForm.email.trim(),
        prenom: inviteForm.prenom.trim() || null,
        nom: inviteForm.nom.trim() || null,
        role: inviteForm.role,
        tenant_id: etudeId,
      },
      headers: { Authorization: `Bearer ${session?.access_token}` },
    })
    setInviting(false)
    if (res.error || res.data?.error) {
      setError('Invitation impossible : ' + (res.data?.error ?? res.error?.message))
      return
    }
    setSuccess(`Invitation envoyée à ${inviteForm.email}. L'utilisateur recevra un email pour définir son mot de passe.`)
    setInviteForm(EMPTY_INVITE)
    setShowInvite(false)
    loadUsers()
  }

  async function handleSaveRoles(u: Utilisateur) {
    setSavingUserId(u.id)
    setError(null)
    const json = await invokeUserAction({ action: 'update_roles', utilisateur_id: u.id, roles: editingRoles })
    setSavingUserId(null)
    if (json.error) { setError('Erreur : ' + json.error); return }
    setEditingUserId(null)
    setSuccess('Rôle mis à jour.')
    loadUsers()
  }

  async function handleToggleActif(u: Utilisateur) {
    setTogglingUserId(u.id)
    setError(null)
    const json = await invokeUserAction({ action: 'set_actif', utilisateur_id: u.id, actif: !u.actif })
    setTogglingUserId(null)
    setConfirmDisableId(null)
    if (json.error) { setError('Erreur : ' + json.error); return }
    const name = [u.prenom, u.nom].filter(Boolean).join(' ') || u.email || 'L\'utilisateur'
    setSuccess(u.actif ? `${name} a été désactivé.` : `${name} a été réactivé.`)
    loadUsers()
  }

  async function handleResendInvite(u: Utilisateur) {
    if (!u.email) return
    setResendingInviteId(u.id)
    setError(null)
    const json = await invokeUserAction({ action: 'resend_invite', email: u.email })
    setResendingInviteId(null)
    if (json.error) { setError('Erreur : ' + json.error); return }
    setSuccess(`Invitation renvoyée à ${u.email}.`)
  }

  async function handleResetPassword(u: Utilisateur) {
    if (!u.email) return
    setResettingPasswordId(u.id)
    setError(null)
    const json = await invokeUserAction({ action: 'reset_password', email: u.email })
    setResettingPasswordId(null)
    if (json.error) { setError('Erreur : ' + json.error); return }
    setSuccess(`Email de réinitialisation envoyé à ${u.email}.`)
  }

  return (
    <div>
      {error && <div style={alertStyle('danger')}>{error}</div>}
      {success && <div style={alertStyle('success')}>{success}</div>}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
        <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--n-900)', margin: 0 }}>Utilisateurs</h3>
        {!showInvite && (
          <Button variant="primary" size="sm" onClick={() => { setShowInvite(true); setError(null) }}>+ Inviter un utilisateur</Button>
        )}
      </div>

      {showInvite && (
        <div style={{ ...card, marginBottom: 'var(--space-4)', padding: 'var(--space-5)' }}>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--n-900)', marginBottom: 'var(--space-4)' }}>Inviter un utilisateur</div>
          <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div>
              <label style={labelStyle}>Email *</label>
              <Input type="email" placeholder="ex. m.dupont@etude.fr" value={inviteForm.email} onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div style={grid2(mobile)}>
              <div>
                <label style={labelStyle}>Prénom</label>
                <Input placeholder="ex. Marie" value={inviteForm.prenom} onChange={e => setInviteForm(f => ({ ...f, prenom: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Nom</label>
                <Input placeholder="ex. Dupont" value={inviteForm.nom} onChange={e => setInviteForm(f => ({ ...f, nom: e.target.value }))} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Rôle *</label>
              <Select
                value={inviteForm.role}
                options={ROLE_OPTIONS}
                onChange={e => setInviteForm(f => ({ ...f, role: e.target.value as RoleNotarial }))}
              />
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <Button type="submit" variant="primary" size="sm" disabled={inviting}>{inviting ? 'Invitation…' : 'Envoyer l\'invitation'}</Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => { setShowInvite(false); setInviteForm(EMPTY_INVITE); setError(null) }}>Annuler</Button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)', padding: 'var(--space-4)' }}>Chargement…</div>
      ) : users.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', padding: 'var(--space-8)' }}>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Aucun utilisateur rattaché à cette étude.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {users.map(u => {
            const isEditing = editingUserId === u.id
            const isConfirmDisable = confirmDisableId === u.id
            const displayName = [u.prenom, u.nom].filter(Boolean).join(' ') || '—'
            const inactive = !u.actif
            const invited = !!u.invited && !inactive
            return (
              <div key={u.id} style={{ ...card, padding: 'var(--space-4) var(--space-5)', opacity: inactive ? 0.7 : 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', fontWeight: 600, color: inactive ? 'var(--n-400)' : 'var(--n-900)' }}>
                      {displayName}
                      {inactive && <span style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 500, color: 'var(--n-400)', marginLeft: '8px' }}>Désactivé</span>}
                      {invited && <span style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 500, color: 'var(--color-accent)', marginLeft: '8px' }}>Invité</span>}
                    </div>
                    {u.email && (
                      <a href={`mailto:${u.email}`} style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-xs)', color: inactive ? 'var(--n-400)' : 'var(--color-accent)', marginTop: '2px', display: 'block', textDecoration: 'none', pointerEvents: inactive ? 'none' : 'auto' }}>
                        {u.email}
                      </a>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexShrink: 0 }}>
                    {!isEditing && !inactive && (
                      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {u.roles.map(r => (
                          <span key={r} style={roleBadge}>{ROLE_OPTIONS.find(o => o.value === r)?.label ?? r}</span>
                        ))}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                      {inactive ? (
                        <IconButton icon="refresh" label="Réactiver" onClick={() => handleToggleActif(u)} disabled={togglingUserId === u.id} />
                      ) : (
                        <>
                          {invited && (
                            <IconButton icon="refresh" label="Renvoyer l'invitation" onClick={() => handleResendInvite(u)} disabled={resendingInviteId === u.id} />
                          )}
                          <IconButton icon="pencil" label="Modifier le rôle" onClick={() => { setEditingUserId(u.id); setEditingRoles([...u.roles]); setConfirmDisableId(null); setError(null) }} />
                          {!invited && (
                            <IconButton icon="key" label="Réinitialiser le mot de passe" onClick={() => handleResetPassword(u)} disabled={resettingPasswordId === u.id} />
                          )}
                          <IconButton icon="ban" label="Désactiver" onClick={() => { setConfirmDisableId(u.id); setEditingUserId(null); setError(null) }} />
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <label style={{ ...labelStyle, marginBottom: 0, whiteSpace: 'nowrap' }}>Rôle</label>
                    <Select
                      value={editingRoles[0] ?? 'assistant'}
                      options={ROLE_OPTIONS}
                      onChange={e => setEditingRoles([e.target.value as RoleNotarial])}
                    />
                    <Button size="sm" variant="primary" disabled={savingUserId === u.id} onClick={() => handleSaveRoles(u)}>
                      {savingUserId === u.id ? 'Enregistrement…' : 'Enregistrer'}
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setEditingUserId(null)}>Annuler</Button>
                  </div>
                )}

                {isConfirmDisable && (
                  <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-xs)', color: 'var(--n-700)', flex: 1 }}>
                      Désactiver <strong>{displayName}</strong> ? Il ne pourra plus se connecter.
                    </span>
                    <Button size="sm" variant="destructive" disabled={togglingUserId === u.id} onClick={() => handleToggleActif(u)}>
                      {togglingUserId === u.id ? 'Désactivation…' : 'Désactiver'}
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setConfirmDisableId(null)}>Annuler</Button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const ICON_SVGS: Record<string, (color: string) => React.JSX.Element> = {
  pencil: (c) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
    </svg>
  ),
  key: (c) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7.5" cy="15.5" r="5.5"/>
      <path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>
    </svg>
  ),
  ban: (c) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="m4.9 4.9 14.2 14.2"/>
    </svg>
  ),
  refresh: (c) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 12a9 9 0 0 1-15 6.7L3 16"/>
      <path d="M21 3v5h-5M3 21v-5h5"/>
    </svg>
  ),
}

function IconButton({ icon, label, onClick, disabled }: { icon: keyof typeof ICON_SVGS; label: string; onClick: () => void; disabled?: boolean }) {
  const isDanger = icon === 'ban'
  return (
    <HoverIconButton icon={(c) => ICON_SVGS[icon](c)} label={label} onClick={onClick} disabled={disabled} danger={isDanger} />
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xs)',
  fontWeight: 600,
  color: 'var(--n-700)',
  marginBottom: 'var(--space-1)',
}

const card: React.CSSProperties = {
  background: 'var(--surface-base)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--space-4) var(--space-5)',
  boxShadow: 'var(--shadow-xs)',
}

function grid2(mobile: boolean): React.CSSProperties {
  return {
    display: 'grid',
    gridTemplateColumns: mobile ? '1fr' : '1fr 1fr',
    gap: 'var(--space-4)',
  }
}

const roleBadge: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: '11px',
  fontWeight: 600,
  color: 'var(--n-700)',
  background: 'var(--n-100)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-full)',
  padding: '2px 8px',
}

function alertStyle(type: 'danger' | 'success'): React.CSSProperties {
  return {
    background: type === 'danger' ? 'var(--color-danger-subtle, #FEF2F2)' : 'var(--color-success-subtle, #F0FDF4)',
    border: `1px solid ${type === 'danger' ? 'var(--color-danger-border, #FECACA)' : 'var(--color-success-border, #BBF7D0)'}`,
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-3) var(--space-4)',
    marginBottom: 'var(--space-4)',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-sm)',
    color: type === 'danger' ? 'var(--color-danger, #DC2626)' : 'var(--color-success, #16A34A)',
  }
}
