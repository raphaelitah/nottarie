import type { ReactNode } from 'react'

export function AppFooter({ children }: { children: ReactNode }) {
  return (
    <footer style={{
      background: 'var(--color-ink)',
      padding: '0 var(--space-8)',
      height: '48px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 'var(--space-4)',
      flexShrink: 0,
      boxShadow: '0 -1px 0 rgba(255,255,255,0.06)',
    }}>
      {children}
    </footer>
  )
}
