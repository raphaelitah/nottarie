import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Button, Modal } from '../design-system'
import type { MailboxConnection } from '../types/database'
import { startOutlookConnect, disconnectOutlook, handleMailboxOAuthCallbackIfPresent } from '../mailbox/mailboxOAuth'

export function MailboxConnectionSection({ tenantId, utilisateurId }: { tenantId: string; utilisateurId: string }) {
  const [connection, setConnection] = useState<MailboxConnection | null | undefined>(undefined)
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [confirmDisconnect, setConfirmDisconnect] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  function loadConnection() {
    supabase
      .from('mailbox_connections')
      .select('*')
      .eq('utilisateur_id', utilisateurId)
      .eq('provider', 'outlook')
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) { setError('Erreur lors du chargement de la connexion : ' + error.message); return }
        setConnection(data)
      })
  }

  useEffect(() => {
    loadConnection()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [utilisateurId])

  useEffect(() => {
    handleMailboxOAuthCallbackIfPresent().then((result) => {
      if (!result.handled) return
      if (result.error) { setError(result.error); return }
      setNotice(`Messagerie connectée : ${result.emailAddress}`)
      loadConnection()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleConnect() {
    setError(null)
    setConnecting(true)
    const { error } = await startOutlookConnect(tenantId)
    if (error) { setConnecting(false); setError(error) }
    // On success the browser navigates away to Microsoft's consent screen.
  }

  async function handleDisconnect() {
    setDisconnecting(true)
    const { error } = await disconnectOutlook(tenantId)
    setDisconnecting(false)
    setConfirmDisconnect(false)
    if (error) { setError('Erreur lors de la déconnexion : ' + error); return }
    setNotice(null)
    loadConnection()
  }

  return (
    <div style={card}>
      <div style={sectionLabel}>Messagerie</div>

      {error && <div style={alertStyle}>{error}</div>}
      {notice && <div style={noticeStyle}>{notice}</div>}

      {connection === undefined ? (
        <p style={mutedText}>Chargement…</p>
      ) : !connection || connection.status === 'revoked' ? (
        <>
          <p style={mutedText}>
            Connectez votre messagerie Outlook pour envoyer des emails et, bientôt, synchroniser votre agenda —
            directement depuis votre propre compte (les emails envoyés apparaissent dans vos éléments envoyés).
          </p>
          <Button variant="primary" size="sm" onClick={handleConnect} disabled={connecting}>
            {connecting ? 'Connexion…' : 'Connecter Outlook'}
          </Button>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
            <span style={connection.status === 'active' ? statusDotActive : statusDotError} />
            <div>
              <div style={valueStyle}>{connection.email_address}</div>
              <div style={mutedText}>
                {connection.status === 'active'
                  ? 'Connecté via Outlook'
                  : `Reconnexion nécessaire${connection.last_error ? ' — ' + connection.last_error : ''}`}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            {connection.status === 'error' && (
              <Button variant="primary" size="sm" onClick={handleConnect} disabled={connecting}>
                {connecting ? 'Connexion…' : 'Reconnecter'}
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={() => setConfirmDisconnect(true)}>
              Déconnecter
            </Button>
          </div>
        </>
      )}

      <Modal
        open={confirmDisconnect}
        onClose={() => setConfirmDisconnect(false)}
        title="Déconnecter votre messagerie ?"
        subtitle="Nottarie ne pourra plus envoyer d'emails en votre nom."
        size="sm"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setConfirmDisconnect(false)}>Annuler</Button>
            <Button variant="destructive" size="sm" onClick={handleDisconnect} disabled={disconnecting}>
              {disconnecting ? 'Déconnexion…' : 'Déconnecter'}
            </Button>
          </>
        }
      >
        Cela supprime la connexion côté Nottarie. Pour révoquer complètement l'accès, gérez vos applications
        connectées depuis votre compte Microsoft.
      </Modal>
    </div>
  )
}

const card: React.CSSProperties = {
  background: 'var(--surface-base)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--space-6)',
  boxShadow: 'var(--shadow-sm)',
}

const sectionLabel: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xs)',
  fontWeight: 700,
  color: 'var(--text-muted)',
  letterSpacing: 'var(--tracking-caps)',
  textTransform: 'uppercase',
  marginBottom: 'var(--space-3)',
}

const valueStyle: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  fontWeight: 600,
  color: 'var(--n-900)',
}

const mutedText: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  color: 'var(--text-muted)',
  margin: '0 0 var(--space-4)',
  lineHeight: 'var(--leading-normal)',
}

const statusDotActive: React.CSSProperties = {
  width: '10px', height: '10px', borderRadius: '50%', background: '#16A34A', flexShrink: 0,
}

const statusDotError: React.CSSProperties = {
  width: '10px', height: '10px', borderRadius: '50%', background: '#DC2626', flexShrink: 0,
}

const alertStyle: React.CSSProperties = {
  background: '#FEF2F2',
  border: '1px solid #FECACA',
  borderRadius: 'var(--radius-md)',
  padding: 'var(--space-3) var(--space-4)',
  marginBottom: 'var(--space-4)',
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  color: '#DC2626',
}

const noticeStyle: React.CSSProperties = {
  background: '#E6F4EC',
  border: '1px solid #BBE5CC',
  borderRadius: 'var(--radius-md)',
  padding: 'var(--space-3) var(--space-4)',
  marginBottom: 'var(--space-4)',
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  color: '#14532D',
}
