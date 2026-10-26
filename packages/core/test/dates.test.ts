import { describe, expect, it } from 'vitest'
import { addDays, checkCollectionDate, checkCollectionTime, earliestCollectionDate, formatDate, londonDate, parseIsoDate } from '../src/dates'
import { catalogue } from './helpers'

const cat = catalogue()
const designA = cat.designs.find((d) => d.slug === 'test-design-a')!
const designB = cat.designs.find((d) => d.slug === 'test-design-b')!
const NOW = new Date('2026-10-26T10:00:00Z')

describe('londonDate', () => {
  it('uses the London calendar date, not UTC', () => {
    // 23:30 UTC on 30 June is 00:30 BST on 1 July.
    expect(londonDate(new Date('2026-06-30T23:30:00Z'))).toBe('2026-07-01')
    // In winter London is on GMT, so the dates match.
    expect(londonDate(new Date('2026-12-31T23:30:00Z'))).toBe('2026-12-31')
  })

  it('handles the spring-forward transition (29 March 2026)', () => {
    expect(londonDate(new Date('2026-03-29T00:59:00Z'))).toBe('2026-03-29')
    expect(londonDate(new Date('2026-03-28T23:59:00Z'))).toBe('2026-03-28')
  })

  it('handles the fall-back transition (25 October 2026)', () => {
    // 23:30 UTC on 24 Oct is still BST → 00:30 on 25 Oct in London.
    expect(londonDate(new Date('2026-10-24T23:30:00Z'))).toBe('2026-10-25')
    expect(londonDate(new Date('2026-10-25T23:30:00Z'))).toBe('2026-10-25')
  })
})

describe('calendar arithmetic', () => {
  it('adds days across DST changes, months and years without drift', () => {
    expect(addDays('2026-03-25', 7)).toBe('2026-04-01')
    expect(addDays('2026-10-22', 7)).toBe('2026-10-29')
    expect(addDays('2026-12-28', 7)).toBe('2027-01-04')
    expect(addDays('2028-02-25', 7)).toBe('2028-03-03')
  })

  it('parses only real dates', () => {
    expect(parseIsoDate('2028-02-29')).not.toBeNull()
    expect(parseIsoDate('2026-02-29')).toBeNull()
    expect(parseIsoDate('2026-02-30')).toBeNull()
    expect(parseIsoDate('2026-13-01')).toBeNull()
    expect(parseIsoDate('26-11-01')).toBeNull()
    expect(parseIsoDate('not a date')).toBeNull()
  })
})

describe('checkCollectionDate', () => {
  it('applies the default seven-day minimum notice', () => {
    expect(earliestCollectionDate(cat, designA, NOW)).toBe('2026-11-02')
    expect(checkCollectionDate('2026-11-01', cat, designA, NOW)).toMatchObject({ ok: false, code: 'tooSoon', earliest: '2026-11-02' })
    expect(checkCollectionDate('2026-11-02', cat, designA, NOW)).toEqual({ ok: true, date: '2026-11-02' })
  })

  it('applies product-specific notice periods', () => {
    expect(checkCollectionDate('2026-11-08', cat, designB, NOW)).toMatchObject({ ok: false, code: 'tooSoon', earliest: '2026-11-09' })
    expect(checkCollectionDate('2026-11-09', cat, designB, NOW).ok).toBe(true)
    const r = checkCollectionDate('2026-11-08', cat, designB, NOW)
    expect(r.ok ? '' : r.message).toContain("at least 14 days' notice")
  })

  it('uses the configured default from settings', () => {
    const three = catalogue((raw) => {
      raw.settings.defaultLeadTimeDays = 3
    })
    expect(earliestCollectionDate(three, three.designs[0]!, NOW)).toBe('2026-10-29')
  })

  it('rejects missing, invalid, past and far-future dates', () => {
    expect(checkCollectionDate('', cat, designA, NOW)).toMatchObject({ ok: false, code: 'missing' })
    expect(checkCollectionDate('2026-02-30', cat, designA, NOW)).toMatchObject({ ok: false, code: 'invalid' })
    expect(checkCollectionDate('2026-10-01', cat, designA, NOW)).toMatchObject({ ok: false, code: 'past' })
    expect(checkCollectionDate('2029-01-01', cat, designA, NOW)).toMatchObject({ ok: false, code: 'tooFar' })
  })

  it('counts notice from the London date late in the evening during BST', () => {
    // 23:30 UTC on 30 June = 1 July in London, so the earliest date is 8 July.
    const late = new Date('2026-06-30T23:30:00Z')
    expect(earliestCollectionDate(cat, designA, late)).toBe('2026-07-08')
    expect(checkCollectionDate('2026-07-07', cat, designA, late).ok).toBe(false)
  })

  it('only validates notice — a valid date is not a confirmed or available date', () => {
    const r = checkCollectionDate('2026-12-25', cat, designA, NOW)
    expect(r).toEqual({ ok: true, date: '2026-12-25' })
    // The result carries no availability or booking information by design.
    expect(Object.keys(r)).toEqual(['ok', 'date'])
  })
})

describe('time and formatting', () => {
  it('accepts an empty or 24-hour time', () => {
    expect(checkCollectionTime('')).toBe(true)
    expect(checkCollectionTime('14:30')).toBe(true)
    expect(checkCollectionTime('24:00')).toBe(false)
    expect(checkCollectionTime('2pm')).toBe(false)
  })

  it('formats dates in British English', () => {
    expect(formatDate('2026-11-02')).toBe('Monday 2 November 2026')
  })
})
