import { describe, expect, it } from 'vitest'
import { decorationsFor, resolveConfigurations, resolveDecorations, resolveDesign, startingPrice } from '../src/resolve'
import { catalogue } from './helpers'

const ids = (list: { decoration: { id: string } }[]) => list.map((r) => r.decoration.id)

describe('decoration inheritance', () => {
  it('inherits standard decorations that apply to all designs', () => {
    const cat = catalogue()
    const a = cat.designs.find((d) => d.slug === 'test-design-a')!
    const resolved = resolveDecorations(cat, a)
    expect(ids(resolved)).toEqual([
      'dec-balls',
      'dec-card-topper',
      'dec-acrylic-topper',
      'dec-name-charm',
      'dec-name-age',
      'dec-premium-balls',
      'dec-big-only',
    ])
    expect(resolved.find((r) => r.decoration.id === 'dec-balls')).toMatchObject({ status: 'included', source: 'standard' })
  })

  it('applies category-scoped defaults only to designs in that category', () => {
    const cat = catalogue()
    const a = cat.designs.find((d) => d.slug === 'test-design-a')!
    const b = cat.designs.find((d) => d.slug === 'test-design-b')!
    expect(ids(resolveDecorations(cat, a))).not.toContain('dec-gold')
    expect(ids(resolveDecorations(cat, b))).toContain('dec-gold')
  })

  it('applies product-level exclusions, additions, status changes and price overrides', () => {
    const cat = catalogue()
    const b = cat.designs.find((d) => d.slug === 'test-design-b')!
    const resolved = resolveDecorations(cat, b)
    expect(ids(resolved)).not.toContain('dec-balls') // excluded
    expect(resolved.find((r) => r.decoration.id === 'dec-sparkler')).toMatchObject({
      status: 'included',
      source: 'design',
      note: 'Test note',
    }) // added (default rule "none")
    expect(resolved.find((r) => r.decoration.id === 'dec-name-charm')!.status).toBe('included') // status changed
    expect(resolved.find((r) => r.decoration.id === 'dec-card-topper')!.pricing).toEqual({ mode: 'fixed', amountPence: 600 })
  })

  it('does not inherit when a design opts out, but keeps its own additions', () => {
    const cat = catalogue()
    const d = cat.designs.find((d) => d.slug === 'test-design-noinherit')!
    expect(ids(resolveDecorations(cat, d))).toEqual(['dec-gold'])
  })

  it('never offers a disabled decoration, even when a design includes it', () => {
    const cat = catalogue((raw) => {
      ;(raw.designs[1] as { decorationOverrides: unknown[] }).decorationOverrides.push({
        decorationId: 'dec-disabled',
        action: 'include',
        priceOverride: null,
        restrictToConfigurationIds: null,
        note: null,
      })
    })
    const b = cat.designs.find((d) => d.slug === 'test-design-b')!
    expect(ids(resolveDecorations(cat, b))).not.toContain('dec-disabled')
  })

  it('reflects central library price changes on inheriting designs only', () => {
    const cat = catalogue((raw) => {
      const topper = raw.decorations.find((d) => d.id === 'dec-card-topper')!
      topper.pricing = { mode: 'fixed', amountPence: 850, bySize: null }
    })
    const a = cat.designs.find((d) => d.slug === 'test-design-a')!
    const b = cat.designs.find((d) => d.slug === 'test-design-b')!
    const forA = decorationsFor(resolveDesign(cat, a), 'cfg-r6-3')
    const forB = decorationsFor(resolveDesign(cat, b), 'cfg-r6-3')
    expect(forA.optional.find((r) => r.decoration.id === 'dec-card-topper')!.pricePence).toBe(850)
    expect(forB.optional.find((r) => r.decoration.id === 'dec-card-topper')!.pricePence).toBe(600)
  })

  it('restricts decorations to particular sizes', () => {
    const cat = catalogue()
    const a = resolveDesign(cat, cat.designs.find((d) => d.slug === 'test-design-a')!)
    expect(ids(decorationsFor(a, 'cfg-r6-3').optional)).not.toContain('dec-big-only')
    expect(ids(decorationsFor(a, 'cfg-r8-2').optional)).toContain('dec-big-only')
  })

  it('only offers an upgrade when the item it upgrades is included', () => {
    const cat = catalogue()
    const a = resolveDesign(cat, cat.designs.find((d) => d.slug === 'test-design-a')!)
    const b = resolveDesign(cat, cat.designs.find((d) => d.slug === 'test-design-b')!)
    expect(ids(decorationsFor(a, 'cfg-r6-3').optional)).toContain('dec-premium-balls')
    expect(ids(decorationsFor(b, 'cfg-r6-3').optional)).not.toContain('dec-premium-balls')
  })

  it('lists each decoration once', () => {
    const cat = catalogue()
    for (const d of cat.designs) {
      const list = ids(resolveDecorations(cat, d))
      expect(new Set(list).size).toBe(list.length)
    }
  })
})

describe('configurations', () => {
  it('offers the standard sizes, marking unpriced/inactive ones unavailable', () => {
    const cat = catalogue()
    const a = cat.designs.find((d) => d.slug === 'test-design-a')!
    const offered = resolveConfigurations(cat, a)
    expect(offered.map((o) => [o.configuration.id, o.available, o.basePricePence])).toEqual([
      ['cfg-r6-3', true, 1000],
      ['cfg-r6-4', true, 2000],
      ['cfg-r8-2', true, 3000],
      ['cfg-sq6-3', false, null],
    ])
  })

  it('applies size exclusions, additions and price overrides per design', () => {
    const cat = catalogue()
    const b = cat.designs.find((d) => d.slug === 'test-design-b')!
    const offered = resolveConfigurations(cat, b)
    expect(offered.map((o) => [o.configuration.id, o.basePricePence])).toEqual([
      ['cfg-r6-3', 1200],
      ['cfg-r6-4', 2000],
      ['cfg-sq6-3', null],
      ['cfg-tiered', 9000],
    ])
    expect(offered.find((o) => o.configuration.id === 'cfg-tiered')!.note).toBe('Test tier note')
  })

  it('treats an invalid size price override as unavailable rather than falling back', () => {
    const cat = catalogue((raw) => {
      ;(raw.designs[1] as { configurationOverrides: { basePriceOverridePence: number | null }[] }).configurationOverrides[2]!.basePriceOverridePence = 0
    })
    const b = cat.designs.find((d) => d.slug === 'test-design-b')!
    const r63 = resolveConfigurations(cat, b).find((o) => o.configuration.id === 'cfg-r6-3')!
    expect(r63.available).toBe(false)
  })
})

describe('startingPrice', () => {
  it('is the cheapest completable configuration including required choices', () => {
    const cat = catalogue()
    expect(startingPrice(cat, cat.designs.find((d) => d.slug === 'test-design-a')!)).toBe(1000)
    expect(startingPrice(cat, cat.designs.find((d) => d.slug === 'test-design-b')!)).toBe(1200)
  })

  it('accounts for a required group whose cheapest option is paid', () => {
    const cat = catalogue((raw) => {
      const flavours = (raw.designs[0] as { flavours: { choices: { optionId: string }[] } }).flavours
      flavours.choices = flavours.choices.filter((c) => c.optionId === 'flv-premium')
    })
    expect(startingPrice(cat, cat.designs.find((d) => d.slug === 'test-design-a')!)).toBe(1500)
  })

  it('is null when no configuration can be completed', () => {
    const cat = catalogue()
    expect(startingPrice(cat, cat.designs.find((d) => d.slug === 'test-design-noinherit')!)).toBeNull()
  })
})
