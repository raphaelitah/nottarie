import { useState, type CSSProperties, type ReactNode } from 'react'

interface IconButtonProps {
  icon: ReactNode
  title: string
  onClick?: () => void
}

export function IconButton({ icon, title, onClick }: IconButtonProps) {
  const [hover, setHover] = useState(false)

  const style: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '30px',
    height: '30px',
    borderRadius: 'var(--radius-md, 6px)',
    border: '1px solid transparent',
    background: hover ? 'rgba(255,255,255,0.10)' : 'transparent',
    color: hover ? '#fff' : 'var(--n-400)',
    cursor: 'pointer',
    transition: 'background 150ms ease, color 150ms ease',
  }

  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={style}
    >
      {icon}
    </button>
  )
}
