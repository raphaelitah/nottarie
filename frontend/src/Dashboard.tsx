import { useAuth } from './auth/AuthContext'

export function Dashboard() {
  const { user, memberships, signOut } = useAuth()

  return (
    <div className="dashboard">
      <header>
        <h1>Nottarie</h1>
        <div>
          <span>{user?.email}</span>
          <button type="button" onClick={signOut}>
            Se déconnecter
          </button>
        </div>
      </header>

      {memberships.length === 0 ? (
        <p>
          Votre compte n'est rattaché à aucune étude pour le moment. Demandez à
          l'administrateur de votre étude de vous ajouter.
        </p>
      ) : (
        <ul>
          {memberships.map((m) => (
            <li key={m.id}>
              Étude {m.tenant_id} — rôles : {m.roles.join(', ') || 'aucun'}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
