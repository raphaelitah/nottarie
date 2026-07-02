import { useAuth } from './auth/AuthContext'
import { Button } from './design-system/Button'
import { Badge } from './design-system/Badge'
import { Select } from './design-system/Select'
import { ROLE_OPTIONS } from './constants/roles'
import type { RoleNotarial } from './types/database'

export function Dashboard({ onSwitchToAdmin }: { onSwitchToAdmin?: () => void }) {
  const { user, memberships, signOut, activeRoles, setActiveRole } = useAuth()

  // A user belongs to a single étude in practice — the membership query is
  // scoped to auth_user_id, so this is just "my" row (if any).
  const membership = memberships[0] ?? null
  const isAdmin = membership?.roles.includes('administrateur') ?? false
  const activeRole = membership
    ? activeRoles[membership.tenant_id] ?? (isAdmin ? 'administrateur' : membership.roles[0])
    : null

  return (
    <div style={{ minHeight: '100svh', background: 'var(--surface-subtle)', display: 'flex', flexDirection: 'column' }}>
      {/* Top nav */}
      <header style={{
        background: 'var(--color-ink)',
        padding: '0 var(--space-8)',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        boxShadow: 'var(--shadow-md)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <img src="/favicon.png" alt="" style={{ width: '28px', height: '28px' }} />
          <span style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--text-md)',
            fontWeight: 700,
            color: '#fff',
            letterSpacing: 'var(--tracking-tight)',
          }}>Nottarie</span>
          {membership?.etude && (
            <>
              <span style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.15)' }} />
              <span style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                color: 'var(--n-400)',
              }}>{membership.etude.raison_sociale}</span>
            </>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          {isAdmin && membership && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-xs)', color: 'var(--n-400)', whiteSpace: 'nowrap' }}>
                Voir en tant que
              </span>
              <div style={{ width: '160px' }}>
                <Select
                  value={activeRole ?? undefined}
                  options={ROLE_OPTIONS}
                  onChange={e => setActiveRole(membership.tenant_id, e.target.value as RoleNotarial)}
                />
              </div>
            </div>
          )}
          <span style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--text-xs)',
            color: 'var(--n-400)',
          }}>{user?.email}</span>
          {onSwitchToAdmin && (
            <Button variant="secondary" size="sm" onClick={onSwitchToAdmin}>
              Administration
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={signOut}>
            Se déconnecter
          </Button>
        </div>
      </header>

      {/* Content */}
      <main style={{
        flex: 1,
        padding: 'var(--space-8)',
        maxWidth: 'var(--content-width)',
        width: '100%',
        margin: '0 auto',
      }}>
        <div style={{
          marginBottom: 'var(--space-8)',
        }}>
          <h1 style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--text-xl)',
            fontWeight: 700,
            color: 'var(--n-900)',
            letterSpacing: 'var(--tracking-tight)',
            margin: '0 0 var(--space-1)',
          }}>Tableau de bord</h1>
          <p style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-muted)',
            margin: 0,
          }}>Bienvenue dans votre espace Nottarie.</p>
        </div>

        {!membership ? (
          <div style={{
            background: 'var(--surface-base)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-10)',
            textAlign: 'center',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{
              width: '48px', height: '48px',
              background: 'var(--n-100)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto var(--space-4)',
              fontSize: '22px',
            }}>🏛️</div>
            <div style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--text-base)',
              fontWeight: 600,
              color: 'var(--n-900)',
              marginBottom: 'var(--space-2)',
            }}>Aucune étude associée</div>
            <p style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-muted)',
              maxWidth: '320px',
              margin: '0 auto',
              lineHeight: 'var(--leading-normal)',
            }}>
              Votre compte n'est rattaché à aucune étude. Demandez à l'administrateur de vous ajouter.
            </p>
          </div>
        ) : (
          <div style={{
            background: 'var(--surface-base)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-4) var(--space-5)',
            boxShadow: 'var(--shadow-xs)',
          }}>
            <div style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              color: 'var(--text-muted)',
              letterSpacing: 'var(--tracking-caps)',
              textTransform: 'uppercase',
              marginBottom: 'var(--space-2)',
            }}>Mon rôle</div>
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              {membership.roles.length === 0
                ? <Badge status="archived" label="Aucun rôle" />
                : membership.roles.map((r: string) => (
                    <Badge key={r} status={isAdmin && r !== activeRole ? 'archived' : 'ongoing'} label={r} />
                  ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
