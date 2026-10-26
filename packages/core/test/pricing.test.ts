import { describe, expect, it } from 'vitest'
import { estimate, isComplete, type Estimate, type EstimateResult } from '../src/estimate'
import { formatPence, priceFor } from '../src/money'
import { resolveGroups } from '../src/resolve'
import { catalogue, select } from './helpers'

const basicA = {
  configurationId: 'cfg-r6-3',
  flavour: ['flv-vanilla'],
  filling: ['fil-jam'],
  frosting: ['frs-butter'],
}

function ok(result: EstimateResult): Estimate {
  if (!result.ok) throw new Error(`Expected ok, got ${JSON.stringify(result.errors)}`)
  return result
}

function codes(result: EstimateResult): string[] {
  return result.ok ? [] : result.errors.map((e) => e.code)
}

describe('money', () => {
  it('formats integer pence as GBP', () => {
    expect(formatPence(7000)).toBe('£70')
    expect(formatPence(850)).toBe('£8.50')
    expect(formatPence(0)).toBe('£0')
    expect(formatPence(14500)).toBe('£145')
  })

  it('refuses non-integer money', () => {
    expect(() => formatPence(1.5)).toThrow()
  })

  it('prices bySize rules only for listed sizes', () => {
    const rule = { mode: 'bySize' as const, bySize: { a: 100 } }
    expect(priceFor(rule, 'a')).toBe(100)
    expect(priceFor(rule, 'b')).toBeNull()
    expect(priceFor(rule, null)).toBeNull()
    expect(priceFor(null, 'a')).toBeNull()
  })
})

describe('estimate — sizes and base prices', () => {
  it('prices each size and layer configuration from the catalogue', () => {
    const cat = catalogue()
    for (const [id, price] of [
      ['cfg-r6-3', 1000],
      ['cfg-r6-4', 2000],
      ['cfg-r8-2', 3000],
    ] as const) {
      const r = ok(estimate(cat, select('test-design-a', { ...basicA, configurationId: id })))
      expect(r.totalPence).toBe(price)
      expect(r.basePence).toBe(price)
      expect(isComplete(r)).toBe(true)
    }
  })

  it('asks for a size before giving a total', () => {
    const r = ok(estimate(catalogue(), select('test-design-a')))
    expect(r.totalPence).toBeNull()
    expect(r.incomplete.map((i) => i.code)).toEqual(['chooseSize'])
    expect(isComplete(r)).toBe(false)
  })

  it('rejects unpriced, inactive and unsupported configurations', () => {
    const cat = catalogue()
    expect(codes(estimate(cat, select('test-design-a', { ...basicA, configurationId: 'cfg-sq6-3' })))).toEqual(['sizeUnavailable'])
    expect(codes(estimate(cat, select('test-design-a', { ...basicA, configurationId: 'cfg-tiered' })))).toEqual(['sizeUnavailable'])
    expect(codes(estimate(cat, select('test-design-b', { configurationId: 'cfg-r8-2', flavour: ['flv-vanilla'] })))).toEqual(['sizeUnavailable'])
    expect(codes(estimate(cat, select('test-design-a', { ...basicA, configurationId: 'nope' })))).toEqual(['sizeUnavailable'])
  })

  it('uses product-specific base price overrides', () => {
    const r = ok(estimate(catalogue(), select('test-design-b', { configurationId: 'cfg-r6-3', flavour: ['flv-vanilla'], personalisation: { 'dec-name-charm': { name: 'Test' } } })))
    expect(r.totalPence).toBe(1200)
  })

  it('reflects catalogue price changes', () => {
    const cat = catalogue((raw) => {
      raw.configurations[0]!.basePricePence = 1100
    })
    expect(ok(estimate(cat, select('test-design-a', basicA))).totalPence).toBe(1100)
  })
})

describe('estimate — options', () => {
  it('distinguishes included and paid options', () => {
    const r = ok(estimate(catalogue(), select('test-design-a', { ...basicA, flavour: ['flv-premium'], frosting: ['frs-ganache'] })))
    expect(r.optionUpgradesPence).toBe(900)
    expect(r.totalPence).toBe(1900)
    expect(r.lines.find((l) => l.id === 'flv-premium')!.totalPence).toBe(500)
    expect(r.lines.find((l) => l.id === 'fil-jam')!.totalPence).toBe(0)
  })

  it('prices size-dependent options per size and refuses unpriced sizes', () => {
    const cat = catalogue()
    expect(ok(estimate(cat, select('test-design-a', { ...basicA, flavour: ['flv-sized'] }))).totalPence).toBe(1300)
    expect(ok(estimate(cat, select('test-design-a', { ...basicA, configurationId: 'cfg-r8-2', flavour: ['flv-sized'] }))).totalPence).toBe(3600)
    expect(codes(estimate(cat, select('test-design-a', { ...basicA, configurationId: 'cfg-r6-4', flavour: ['flv-sized'] })))).toEqual(['optionUnavailable'])
  })

  it('applies product-specific option price overrides', () => {
    const r = ok(estimate(catalogue(), select('test-design-b', { configurationId: 'cfg-r6-3', flavour: ['flv-vanilla', 'flv-premium'], personalisation: { 'dec-name-charm': { name: 'Test' } } })))
    expect(r.optionUpgradesPence).toBe(250)
    expect(r.totalPence).toBe(1450)
  })

  it('rejects inactive options and options not offered on the design', () => {
    const cat = catalogue()
    expect(codes(estimate(cat, select('test-design-a', { ...basicA, flavour: ['flv-inactive'] })))).toEqual(['optionUnavailable'])
    expect(codes(estimate(cat, select('test-design-a', { ...basicA, flavour: ['frs-ganache'] })))).toEqual(['optionUnavailable'])
  })

  it('rejects options with an invalid design price override', () => {
    const cat = catalogue()
    expect(codes(estimate(cat, select('test-design-noinherit', { configurationId: 'cfg-r6-3', flavour: ['flv-premium'] })))).toEqual(['optionUnavailable'])
  })

  it('enforces the maximum number of selections', () => {
    expect(codes(estimate(catalogue(), select('test-design-a', { ...basicA, flavour: ['flv-vanilla', 'flv-premium'] })))).toContain('tooManyOptions')
  })

  it('flags required groups as incomplete without blocking the estimate', () => {
    const r = ok(estimate(catalogue(), select('test-design-a', { configurationId: 'cfg-r6-3' })))
    expect(r.totalPence).toBe(1000)
    expect(r.incomplete.map((i) => i.field)).toEqual(['flavour', 'filling', 'frosting'])
  })

  it('offers every active option by default when a design does not list its own', () => {
    const cat = catalogue()
    const d = cat.designs.find((d) => d.slug === 'test-design-all-options')!
    const groups = resolveGroups(cat, d)
    expect(groups.flavour.choices.map((c) => c.option.id)).toEqual(['flv-vanilla', 'flv-premium', 'flv-sized'])
    expect(groups.frosting.choices.map((c) => c.option.id)).toEqual(['frs-butter', 'frs-ganache'])
    expect(groups.flavour.required).toBe(true)
    const r = ok(estimate(cat, select('test-design-all-options', { configurationId: 'cfg-r6-3', flavour: ['flv-sized'], filling: ['fil-jam'], frosting: ['frs-ganache'] })))
    expect(r.totalPence).toBe(1700)
  })

  it('ignores duplicate IDs in the selection', () => {
    const r = ok(estimate(catalogue(), select('test-design-a', { ...basicA, flavour: ['flv-premium', 'flv-premium'] })))
    expect(r.totalPence).toBe(1500)
  })
})

describe('estimate — decorations', () => {
  it('includes standard decorations at no charge', () => {
    const r = ok(estimate(catalogue(), select('test-design-a', basicA)))
    expect(r.includedDecorations.map((d) => d.id)).toEqual(['dec-balls'])
    expect(r.decorationsPence).toBe(0)
  })

  it('never charges for an included decoration selected again', () => {
    const r = ok(estimate(catalogue(), select('test-design-a', { ...basicA, decorationIds: ['dec-balls', 'dec-balls'] })))
    expect(r.totalPence).toBe(1000)
    expect(r.lines.filter((l) => l.kind === 'decoration')).toHaveLength(0)
  })

  it('charges paid decorations once each', () => {
    const r = ok(estimate(catalogue(), select('test-design-a', { ...basicA, decorationIds: ['dec-card-topper', 'dec-card-topper'] })))
    expect(r.decorationsPence).toBe(800)
    expect(r.totalPence).toBe(1800)
  })

  it('models upgrades explicitly, replacing the included item', () => {
    const r = ok(estimate(catalogue(), select('test-design-a', { ...basicA, decorationIds: ['dec-premium-balls'] })))
    expect(r.decorationsPence).toBe(700)
    expect(r.includedDecorations.map((d) => d.id)).toEqual([])
    expect(r.lines.find((l) => l.id === 'dec-premium-balls')!.detail).toBe('Upgrade from Test Balls')
  })

  it('uses product-specific decoration prices and inclusions', () => {
    const r = ok(
      estimate(
        catalogue(),
        select('test-design-b', {
          configurationId: 'cfg-r6-3',
          flavour: ['flv-vanilla'],
          decorationIds: ['dec-card-topper', 'dec-name-charm'],
          personalisation: { 'dec-name-charm': { name: 'Test' } },
        }),
      ),
    )
    expect(r.includedDecorations.map((d) => d.id)).toEqual(['dec-gold', 'dec-name-charm', 'dec-sparkler'])
    expect(r.decorationsPence).toBe(600) // name charm included on B, not charged
    expect(r.totalPence).toBe(1800)
  })

  it('rejects decorations excluded from the design or restricted to other sizes', () => {
    const cat = catalogue()
    expect(codes(estimate(cat, select('test-design-b', { configurationId: 'cfg-r6-3', flavour: ['flv-vanilla'], decorationIds: ['dec-premium-balls'] })))).toEqual(['decorationUnavailable'])
    expect(codes(estimate(cat, select('test-design-a', { ...basicA, decorationIds: ['dec-big-only'] })))).toEqual(['decorationUnavailable'])
    expect(ok(estimate(cat, select('test-design-a', { ...basicA, configurationId: 'cfg-r8-2', decorationIds: ['dec-big-only'] }))).totalPence).toBe(3400)
    expect(codes(estimate(cat, select('test-design-a', { ...basicA, decorationIds: ['dec-disabled'] })))).toEqual(['decorationUnavailable'])
  })

  it('rejects incompatible decorations', () => {
    expect(codes(estimate(catalogue(), select('test-design-a', { ...basicA, decorationIds: ['dec-card-topper', 'dec-acrylic-topper'] })))).toEqual(['decorationsIncompatible'])
  })

  it('requires personalisation for name and age decorations', () => {
    const cat = catalogue()
    const missing = ok(estimate(cat, select('test-design-a', { ...basicA, decorationIds: ['dec-name-age'] })))
    expect(missing.incomplete.map((i) => i.field)).toEqual(['personalisation.dec-name-age.name', 'personalisation.dec-name-age.age'])
    expect(missing.totalPence).toBe(1900)

    const given = ok(estimate(cat, select('test-design-a', { ...basicA, decorationIds: ['dec-name-age'], personalisation: { 'dec-name-age': { name: ' Test ', age: '5' } } })))
    expect(given.incomplete).toEqual([])
    expect(given.lines.find((l) => l.id === 'dec-name-age')!.detail).toBe('Name: "Test", Age: 5')

    expect(codes(estimate(cat, select('test-design-a', { ...basicA, decorationIds: ['dec-name-age'], personalisation: { 'dec-name-age': { name: 'Test', age: 'five' } } })))).toEqual(['personalisationInvalid'])
  })

  it('requires personalisation for included personalised decorations too', () => {
    const r = ok(estimate(catalogue(), select('test-design-b', { configurationId: 'cfg-r6-3', flavour: ['flv-vanilla'] })))
    expect(r.incomplete.map((i) => i.field)).toEqual(['personalisation.dec-name-charm.name'])
  })
})

describe('estimate — extras', () => {
  it('prices fixed and quantity-based extras', () => {
    const r = ok(estimate(catalogue(), select('test-design-a', { ...basicA, extras: { 'ext-candles': 3, 'ext-box': 1 } })))
    expect(r.extrasPence).toBe(900)
    expect(r.totalPence).toBe(1900)
    expect(r.lines.find((l) => l.id === 'ext-candles')).toMatchObject({ quantity: 3, unitPence: 200, totalPence: 600 })
  })

  it('rejects out-of-range quantities, unpriced and unknown extras', () => {
    const cat = catalogue()
    expect(codes(estimate(cat, select('test-design-a', { ...basicA, extras: { 'ext-candles': 6 } })))).toEqual(['extraQuantityInvalid'])
    expect(codes(estimate(cat, select('test-design-a', { ...basicA, extras: { 'ext-box': 2 } })))).toEqual(['extraQuantityInvalid'])
    expect(codes(estimate(cat, select('test-design-a', { ...basicA, extras: { 'ext-candles': 1.5 } })))).toEqual(['extraQuantityInvalid'])
    expect(codes(estimate(cat, select('test-design-a', { ...basicA, extras: { 'ext-broken': 1 } })))).toEqual(['extraUnavailable'])
    expect(codes(estimate(cat, select('test-design-a', { ...basicA, extras: { 'ext-nope': 1 } })))).toEqual(['extraUnavailable'])
  })

  it('ignores extras with zero quantity', () => {
    expect(ok(estimate(catalogue(), select('test-design-a', { ...basicA, extras: { 'ext-candles': 0 } }))).totalPence).toBe(1000)
  })
})

describe('estimate — combined and availability', () => {
  it('adds base, upgrades, decorations and extras', () => {
    const r = ok(
      estimate(
        catalogue(),
        select('test-design-a', {
          ...basicA,
          flavour: ['flv-premium'],
          frosting: ['frs-ganache'],
          decorationIds: ['dec-card-topper', 'dec-premium-balls'],
          extras: { 'ext-candles': 2 },
        }),
      ),
    )
    expect([r.basePence, r.optionUpgradesPence, r.decorationsPence, r.extrasPence]).toEqual([1000, 900, 1500, 400])
    expect(r.totalPence).toBe(3800)
    expect(r.lines.reduce((s, l) => s + l.totalPence, 0)).toBe(3800)
  })

  it('refuses paused, unknown designs and a disabled builder', () => {
    const cat = catalogue()
    expect(codes(estimate(cat, select('test-design-paused', { configurationId: 'cfg-r6-3' })))).toEqual(['designPaused'])
    expect(codes(estimate(cat, select('nope')))).toEqual(['designNotFound'])
    const off = catalogue((raw) => {
      raw.settings.builderEnabled = false
    })
    expect(codes(estimate(off, select('test-design-a', basicA)))).toEqual(['builderUnavailable'])
    const maintenance = catalogue((raw) => {
      ;(raw.settings as Record<string, unknown>).maintenanceNotice = 'Back soon'
    })
    const r = estimate(maintenance, select('test-design-a', basicA))
    expect(r.ok ? null : r.errors[0]!.message).toBe('Back soon')
  })
})
