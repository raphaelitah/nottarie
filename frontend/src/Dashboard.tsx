import { useAuth } from './auth/AuthContext'
import { Button } from './design-system/Button'
import { Badge } from './design-system/Badge'
import { Select } from './design-system/Select'
import { ROLE_OPTIONS } from './constants/roles'
import type { RoleNotarial } from './types/database'

export function Dashboard() {
  const { user, memberships, signOut, activeRoles, setActiveRole } = useAuth()

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <img src="/favicon.png" alt="" style={{ width: '28px', height: '28px' }} />
          <span style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--text-md)',
            fontWeight: 700,
            color: '#fff',
            letterSpacing: 'var(--tracking-tight)',
          }}>Nottarie</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <span style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--text-xs)',
            color: 'var(--n-400)',
          }}>{user?.email}</span>
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

        {memberships.length === 0 ? (
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <h2 style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              color: 'var(--text-muted)',
              letterSpacing: 'var(--tracking-caps)',
              textTransform: 'uppercase',
              margin: '0 0 var(--space-2)',
            }}>Mes études</h2>
            {memberships.map((m) => {
              const isAdmin = m.roles.includes('administrateur')
              const activeRole = activeRoles[m.tenant_id] ?? (isAdmin ? 'administrateur' : m.roles[0])
              return (
                <div key={m.id} style={{
                  background: 'var(--surface-base)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-4) var(--space-5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 'var(--space-4)',
                  boxShadow: 'var(--shadow-xs)',
                }}>
                  <div>
                    <div style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--text-xs)',
                      color: 'var(--text-muted)',
                      marginBottom: 'var(--space-1)',
                    }}>{m.tenant_id}</div>
                    <div style={{
                      display: 'flex',
                      gap: 'var(--space-2)',
                      flexWrap: 'wrap',
                    }}>
                      {m.roles.length === 0
                        ? <Badge status="archived" label="Aucun rôle" />
                        : m.roles.map((r: string) => (
                            <Badge key={r} status={isAdmin && r !== activeRole ? 'archived' : 'ongoing'} label={r} />
                          ))}
                    </div>
                  </div>
                  {isAdmin && (
                    <div style={{ minWidth: '180px', flexShrink: 0 }}>
                      <Select
                        label="Voir en tant que"
                        value={activeRole}
                        options={ROLE_OPTIONS}
                        onChange={e => setActiveRole(m.tenant_id, e.target.value as RoleNotarial)}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
