import React, { useEffect, type ReactNode } from 'react'

interface DrawerProps {
  open?: boolean
  onClose?: () => void
  title?: string
  subtitle?: string
  children?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  side?: 'left' | 'right'
  footer?: ReactNode
  step?: number
  stepTotal?: number
}

export function Drawer({
  open = false,
  onClose,
  title,
  subtitle,
  children,
  size = 'md',
  side = 'right',
  footer,
  step,
  stepTotal,
}: DrawerProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  const widths = { sm: '360px', md: '480px', lg: '640px' }
  const width = widths[size] ?? widths.md
  const translateOut = side === 'right' ? 'translateX(100%)' : 'translateX(-100%)'

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: open ? 'rgba(26,25,36,0.35)' : 'rgba(26,25,36,0)',
        pointerEvents: open ? 'all' : 'none',
        transition: 'background 200ms ease',
      }}
    >
      <div style={{
        position: 'absolute',
        top: 0, bottom: 0,
        [side]: 0,
        width,
        background: '#FFFFFF',
        boxShadow: '0 8px 20px rgba(30,45,69,.10)',
        display: 'flex',
        flexDirection: 'column',
        transform: open ? 'translateX(0)' : translateOut,
        transition: 'transform 200ms ease',
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
          <div style={{ flex: 1, minWidth: 0 }}>
            {step != null && stepTotal != null && (
              <div style={{
                fontFamily: "'Sora', system-ui, sans-serif",
                fontSize: '11px', fontWeight: 600,
                color: '#A07600', letterSpacing: '0.06em',
                textTransform: 'uppercase', marginBottom: '4px',
              }}>
                Étape {step} sur {stepTotal}
              </div>
            )}
            <div style={{
              fontFamily: "'Sora', system-ui, sans-serif",
              fontSize: '16px', fontWeight: 600,
              color: '#1A1924', letterSpacing: '-0.02em',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{title}</div>
            {subtitle && (
              <div style={{
                fontFamily: "'Sora', system-ui, sans-serif",
                fontSize: '13px', color: '#716E84', marginTop: '3px',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
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

        {step != null && stepTotal != null && (
          <div style={{ height: '2px', background: '#E0DFE8', flexShrink: 0 }}>
            <div style={{
              height: '100%',
              width: `${(step / stepTotal) * 100}%`,
              background: '#A07600',
              transition: 'width 200ms ease',
            }} />
          </div>
        )}

        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
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
