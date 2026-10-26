import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { checkPricing, checkWhatsappNumber } from '../lib/rules'
import { schemaTypes } from '../schemaTypes'

const docs = readFileSync(new URL('../seed/catalogue.ndjson', import.meta.url), 'utf8')
  .trim()
  .split('\n')
  .map((line) => JSON.parse(line) as Record<string, any>)

describe('seed catalogue', () => {
  it('only uses fields that exist in the schema', () => {
    for (const doc of docs) {
      const type = schemaTypes.find((t) => t.name === doc._type) as { fields?: { name: string }[] } | undefined
      expect(type, doc._type).toBeDefined()
      const fields = new Set(type!.fields!.map((f) => f.name))
      for (const key of Object.keys(doc)) if (!key.startsWith('_')) expect(fields.has(key), `${doc._type}.${key}`).toBe(true)
    }
  })

  it("matches the owner's size and price table", () => {
    const prices = Object.fromEntries(
      docs.filter((d) => d._type === 'cakeConfiguration').map((d) => [d.label, [d.basePricePence ?? null, d.active]]),
    )
    expect(prices).toEqual({
      '6-inch round, 2 layers': [5500, false],
      '6-inch round, 3 layers': [7000, true],
      '6-inch round, 4 layers': [8500, true],
      '8-inch round, 2 layers': [9500, true],
      '8-inch round, 3 layers': [12000, true],
      '8-inch round, 4 layers': [14500, true],
      '6-inch square, 3 layers': [null, false],
      '6-inch square, 4 layers': [null, false],
    })
  })

  it("matches the owner's topper prices", () => {
    const toppers = Object.fromEntries(
      docs.filter((d) => d._type === 'cakeDecoration').map((d) => [d.name, d.pricing.amountPence]),
    )
    expect(toppers).toEqual({
      'Card topper': 800,
      'Acrylic topper': 1500,
      'Name charm (card)': 500,
      'Name charm (acrylic)': 800,
      'Name and age topper (card)': 900,
      'Name and age topper (acrylic)': 1500,
    })
  })

  it('has valid settings and prices', () => {
    const settings = docs.find((d) => d._type === 'cakeSiteSettings')!
    expect(checkWhatsappNumber(settings.whatsappNumber)).toBe(true)
    expect(settings.defaultLeadTimeDays).toBe(7)
    for (const d of docs) if (d.pricing) expect(checkPricing(d.pricing)).toBe(true)
  })
})
