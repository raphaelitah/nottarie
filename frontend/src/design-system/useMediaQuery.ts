import { useEffect, useState } from 'react'

// Below this width, a two-column layout (section grids, form field rows)
// no longer has room to stay side by side and should stack into one column.
export const STACK_QUERY = '(max-width: 900px)'

// Below this width, even a 2-3 column form row needs the full row per field.
export const MOBILE_QUERY = '(max-width: 640px)'

// Below this width, the persistent 220px sidebar nav no longer fits next to
// page content — replace it with a hamburger-triggered drawer.
export const NAV_QUERY = '(max-width: 768px)'

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const mql = window.matchMedia(query)
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    setMatches(mql.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [query])

  return matches
}
