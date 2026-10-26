import { describe, expect, it } from 'vitest'
import { checkPortions, checkPricing, checkUniqueRefs, checkWhatsappNumber, describePricing } from '../lib/rules'

describe('checkPricing', () => {
  it('requires a mode unless the rule is an optional override', () => {
    expect(checkPricing(undefined)).not.toBe(true)
    expect(checkPricing(undefined, true)).toBe(true)
    expect(checkPricing({ mode: 'included' })).toBe(true)
  })

  it('requires whole pence for fixed prices', () => {
    expect(checkPricing({ mode: 'fixed', amountPence: 800 })).toBe(true)
    expect(checkPricing({ mode: 'fixed' })).not.toBe(true)
    expect(checkPricing({ mode: 'fixed', amountPence: 8.5 })).not.toBe(true)
    expect(checkPricing({ mode: 'fixed', amountPence: -1 })).not.toBe(true)
  })

  it('requires unique, priced sizes for size-based prices', () => {
    const a = { _ref: 'a' }
    expect(checkPricing({ mode: 'bySize', bySize: [{ configuration: a, amountPence: 100 }] })).toBe(true)
    expect(checkPricing({ mode: 'bySize', bySize: [] })).not.toBe(true)
    expect(checkPricing({ mode: 'bySize', bySize: [{ configuration: a, amountPence: 100 }, { configuration: a, amountPence: 200 }] })).not.toBe(true)
    expect(checkPricing({ mode: 'bySize', bySize: [{ configuration: a }] })).not.toBe(true)
  })
})

describe('describePricing', () => {
  it('shows prices in pounds', () => {
    expect(describePricing({ mode: 'fixed', amountPence: 1500 })).toBe('£15')
    expect(describePricing({ mode: 'included' })).toBe('Included (no charge)')
    expect(describePricing(undefined)).toBe('No price set')
  })
})

describe('checkUniqueRefs', () => {
  it('flags duplicate decorations on a design', () => {
    const rows = [{ decoration: { _ref: 'x' } }, { decoration: { _ref: 'x' } }]
    expect(checkUniqueRefs(rows, (r) => r.decoration, 'decoration')).toMatch(/more than once/)
    expect(checkUniqueRefs([rows[0]!], (r) => r.decoration, 'decoration')).toBe(true)
  })
})

describe('checkWhatsappNumber', () => {
  it('accepts international formats only', () => {
    expect(checkWhatsappNumber('+44 7933 903000')).toBe(true)
    expect(checkWhatsappNumber('447933903000')).toBe(true)
    expect(checkWhatsappNumber('07933 903000')).not.toBe(true)
    expect(checkWhatsappNumber(undefined)).not.toBe(true)
  })
})

describe('checkPortions', () => {
  it('needs both ends of a range in order', () => {
    expect(checkPortions({ min: 12, max: 14 })).toBe(true)
    expect(checkPortions(undefined)).toBe(true)
    expect(checkPortions({ min: 12 })).not.toBe(true)
    expect(checkPortions({ min: 14, max: 12 })).not.toBe(true)
  })
})
