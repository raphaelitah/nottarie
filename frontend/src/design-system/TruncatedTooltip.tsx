import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { Tooltip } from './Tooltip'

interface TruncatedTooltipProps {
  text: string
  style?: CSSProperties
  align?: 'center' | 'left' | 'right'
}

export function TruncatedTooltip({ text, style, align = 'left' }: TruncatedTooltipProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [truncated, setTruncated] = useState(false)

  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const check = () => setTruncated(el.scrollWidth > el.clientWidth)
    check()
    const observer = new ResizeObserver(check)
    observer.observe(el)
    return () => observer.disconnect()
  }, [text])

  return (
    <Tooltip label={text} disabled={!truncated} align={align}>
      <div ref={wrapRef} style={{ ...truncateStyle, ...style }}>{text}</div>
    </Tooltip>
  )
}

const truncateStyle: CSSProperties = {
  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  flex: 1, minWidth: 0, width: '100%',
}
