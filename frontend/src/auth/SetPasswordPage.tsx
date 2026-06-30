import { useState } from 'react'
import { Button, Input } from '../design-system'

interface Props {
  onSubmit: (password: string) => Promise<{ error: string | null }>
}

export function SetPasswordPage({ onSubmit }: Props) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) { setError('Le mot de passe doit contenir au moins 8 caractères.'); return }
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas.'); return }
    setLoading(true)
    const { error } = await onSubmit(password)
    setLoading(false)
    if (error) setError(error)
  }

  return (
    <div style={{
      minHeight: '100svh',
      background: 'var(--surface-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-6)',
    }}>
      <div style={{
        background: 'var(--surface-base)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-8)',
        width: '100%',
        maxWidth: '400px',
        boxShadow: 'var(--shadow-md)',
      }}>
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--text-xl)',
            fontWeight: 700,
            color: 'var(--n-900)',
            letterSpacing: 'var(--tracking-tight)',
            marginBottom: 'var(--space-1)',
          }}>Définir votre mot de passe</div>
          <div style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-muted)',
          }}>Choisissez un mot de passe pour accéder à votre compte.</div>
        </div>

        {error && (
          <div style={{
            background: 'var(--color-danger-subtle, #FEF2F2)',
            border: '1px solid var(--color-danger-border, #FECACA)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-3) var(--space-4)',
            marginBottom: 'var(--space-4)',
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--text-sm)',
            color: 'var(--color-danger, #DC2626)',
          }}>{error}</div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div>
            <label style={labelStyle}>Nouveau mot de passe</label>
            <Input
              type="password"
              placeholder="8 caractères minimum"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>Confirmer le mot de passe</label>
            <Input
              type="password"
              placeholder="Répétez le mot de passe"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
            />
          </div>
          <Button type="submit" variant="primary" size="sm" disabled={loading}>
            {loading ? 'Enregistrement…' : 'Définir le mot de passe'}
          </Button>
        </form>
      </div>
    </div>
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
