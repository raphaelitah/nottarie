import React, { useEffect, type ReactNode } from 'react'

interface ModalProps {
  open?: boolean
  onClose?: () => void
  title?: string
  subtitle?: string
  children?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  footer?: ReactNode
}

export function Modal({ open = false, onClose, title, subtitle, children, size = 'md', footer }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const widths = { sm: '400px', md: '560px', lg: '720px' }

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(26,25,36,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div style={{
        background: '#FFFFFF',
        borderRadius: '14px',
        boxShadow: '0 8px 20px rgba(30,45,69,.10)',
        width: '100%',
        maxWidth: widths[size] ?? widths.md,
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 'calc(100vh - 48px)',
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: '20px 24px 16px',
          borderBottom: '1px solid #E0DFE8',
          gap: '16px',
          flexShrink: 0,
        }}>
          <div>
            <div style={{
              fontFamily: "'Sora', system-ui, sans-serif",
              fontSize: '16px', fontWeight: 600,
              color: '#1A1924', letterSpacing: '-0.02em',
            }}>{title}</div>
            {subtitle && (
              <div style={{
                fontFamily: "'Sora', system-ui, sans-serif",
                fontSize: '13px', color: '#716E84', marginTop: '3px',
              }}>{subtitle}</div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '28px', height: '28px', borderRadius: '6px',
              border: 'none', background: 'transparent',
              cursor: 'pointer', color: '#716E84', flexShrink: 0,
              transition: 'background 150ms ease',
              fontSize: '18px', lineHeight: 1,
            }}
            aria-label="Fermer"
          >×</button>
        </div>

        <div style={{
          padding: '20px 24px',
          overflowY: 'auto',
          flex: 1,
          fontFamily: "'Sora', system-ui, sans-serif",
          fontSize: '14px',
          color: '#2D2C3C',
          lineHeight: 1.6,
        }}>
          {children}
        </div>

        {footer && (
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
            padding: '16px 24px',
            borderTop: '1px solid #E0DFE8',
            flexShrink: 0,
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
