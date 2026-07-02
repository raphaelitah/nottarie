// A "key" becomes a Jinja variable name for docxtpl, hence the strict snake_case constraint.
export const SNAKE_CASE_RE = /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/

const COMBINING_DIACRITICS_RE = /\p{Diacritic}/gu

export function slugifyKey(input: string): string {
  return input
    .normalize('NFD')
    .replace(COMBINING_DIACRITICS_RE, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}
