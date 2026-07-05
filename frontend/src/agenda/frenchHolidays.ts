export interface FrenchHoliday {
  date: string // YYYY-MM-DD
  label: string
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`
}

function iso(date: Date): string {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

// Meeus/Jones/Butcher Gregorian algorithm for the date of Easter Sunday.
function computusEaster(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(Date.UTC(year, month - 1, day))
}

/** French public holidays for a given year: fixed dates plus Easter-derived ones. No DB storage — purely derived. */
export function frenchHolidays(year: number): FrenchHoliday[] {
  const easter = computusEaster(year)

  const holidays: FrenchHoliday[] = [
    { date: `${year}-01-01`, label: "Jour de l'An" },
    { date: `${year}-05-01`, label: 'Fête du Travail' },
    { date: `${year}-05-08`, label: 'Victoire 1945' },
    { date: `${year}-07-14`, label: 'Fête Nationale' },
    { date: `${year}-08-15`, label: 'Assomption' },
    { date: `${year}-11-01`, label: 'Toussaint' },
    { date: `${year}-11-11`, label: 'Armistice' },
    { date: `${year}-12-25`, label: 'Noël' },
    { date: iso(addDays(easter, 1)), label: 'Lundi de Pâques' },
    { date: iso(addDays(easter, 39)), label: 'Ascension' },
    { date: iso(addDays(easter, 50)), label: 'Lundi de Pentecôte' },
  ]

  return holidays.sort((a, b) => a.date.localeCompare(b.date))
}
