/** Monday-based week helpers (ISO-like weekday 0 = Mon). */

export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function formatISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Get Monday of the calendar week containing `date` (local). */
export function startOfWeekMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay() // 0 Sun .. 6 Sat
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

export function weekDatesFromMonday(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
}

export function todayISO(): string {
  return formatISO(new Date())
}

export function weekdayIndexFromDate(d: Date): 0 | 1 | 2 | 3 | 4 | 5 | 6 {
  const day = d.getDay()
  const mon0 = day === 0 ? 6 : (day - 1) as 0 | 1 | 2 | 3 | 4 | 5 | 6
  return mon0
}
