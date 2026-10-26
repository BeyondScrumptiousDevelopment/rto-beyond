import type { Catalogue, Design } from './types'

/**
 * Collection dates are plain calendar dates (YYYY-MM-DD) compared in
 * Europe/London. Working with calendar dates rather than timestamps means
 * BST/GMT changes can't shift a date by a day.
 *
 * Meeting the minimum notice does NOT mean a date is available — every date
 * remains subject to manual confirmation by Beyond Scrumptious.
 */

export const TIMEZONE = 'Europe/London'
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/
const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/

/** Today's calendar date in London for a given instant. */
export function londonDate(now: Date): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const get = (type: string) => parts.find((p) => p.type === type)?.value
  return `${get('year')}-${get('month')}-${get('day')}`
}

/** Parses YYYY-MM-DD; returns null for impossible dates such as 2026-02-30. */
export function parseIsoDate(value: string): { y: number; m: number; d: number } | null {
  const match = ISO_DATE.exec(value)
  if (!match) return null
  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])]
  const date = new Date(Date.UTC(y, m - 1, d))
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null
  return { y, m, d }
}

export function addDays(isoDate: string, days: number): string {
  const p = parseIsoDate(isoDate)
  if (!p) throw new Error(`Invalid date: ${isoDate}`)
  const date = new Date(Date.UTC(p.y, p.m - 1, p.d + days))
  return date.toISOString().slice(0, 10)
}

export function leadTimeDays(catalogue: Catalogue, design: Design): number {
  return design.leadTimeDaysOverride ?? catalogue.settings.defaultLeadTimeDays
}

export function earliestCollectionDate(catalogue: Catalogue, design: Design, now: Date): string {
  return addDays(londonDate(now), leadTimeDays(catalogue, design))
}

export type DateCheck =
  | { ok: true; date: string }
  | { ok: false; code: 'missing' | 'invalid' | 'past' | 'tooSoon' | 'tooFar'; message: string; earliest: string }

const MAX_MONTHS_AHEAD = 18

export function checkCollectionDate(
  requested: string,
  catalogue: Catalogue,
  design: Design,
  now: Date = new Date(),
): DateCheck {
  const today = londonDate(now)
  const days = leadTimeDays(catalogue, design)
  const earliest = addDays(today, days)
  if (!requested) return { ok: false, code: 'missing', message: 'Choose a collection date.', earliest }
  if (!parseIsoDate(requested)) {
    return { ok: false, code: 'invalid', message: 'Please enter a valid date.', earliest }
  }
  if (requested < today) {
    return { ok: false, code: 'past', message: 'That date has already passed.', earliest }
  }
  if (requested < earliest) {
    return {
      ok: false,
      code: 'tooSoon',
      message: `This cake needs at least ${days} days' notice. The earliest date you can request is ${formatDate(earliest)}.`,
      earliest,
    }
  }
  const latest = addDays(today, MAX_MONTHS_AHEAD * 31)
  if (requested > latest) {
    return { ok: false, code: 'tooFar', message: 'Please choose a date within the next 18 months.', earliest }
  }
  return { ok: true, date: requested }
}

export function checkCollectionTime(value: string): boolean {
  return value === '' || TIME.test(value)
}

/** "2026-11-07" → "Saturday 7 November 2026". */
export function formatDate(isoDate: string): string {
  const p = parseIsoDate(isoDate)
  if (!p) return isoDate
  const date = new Date(Date.UTC(p.y, p.m - 1, p.d))
  const weekday = new Intl.DateTimeFormat('en-GB', { weekday: 'long', timeZone: 'UTC' }).format(date)
  const month = new Intl.DateTimeFormat('en-GB', { month: 'long', timeZone: 'UTC' }).format(date)
  return `${weekday} ${p.d} ${month} ${p.y}`
}
