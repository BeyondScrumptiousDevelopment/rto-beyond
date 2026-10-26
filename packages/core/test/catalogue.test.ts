import { describe, expect, it } from 'vitest'
import { CatalogueError, parseCatalogue, toPricingRule } from '../src/catalogue/parse'
import { rawTestCatalogue } from '../fixtures/testCatalogue'
import { load } from './helpers'

describe('parseCatalogue', () => {
  it('parses the fixture and normalises settings', () => {
    const { catalogue } = load()
    expect(catalogue.settings.whatsappNumber).toBe('447000000000')
    expect(catalogue.settings.currency).toBe('GBP')
    expect(catalogue.settings.timezone).toBe('Europe/London')
    expect(catalogue.settings.defaultLeadTimeDays).toBe(7)
  })

  it('keeps valid designs and skips invalid ones with an issue', () => {
    const { catalogue, issues } = load()
    expect(catalogue.designs.map((d) => d.slug)).toEqual([
      'test-design-a',
      'test-design-b',
      'test-design-paused',
      'test-design-noinherit',
      'test-design-all-options',
    ])
    expect(issues.some((i) => i.startsWith('Design') && i.includes('skipped'))).toBe(true)
  })

  it('never includes draft documents', () => {
    const { catalogue } = load()
    expect(catalogue.designs.some((d) => d.id.startsWith('drafts.'))).toBe(false)
    expect(catalogue.designs.some((d) => d.slug === 'test-design-draft')).toBe(false)
  })

  it('rejects the whole catalogue when settings are missing', () => {
    const raw = rawTestCatalogue() as Record<string, unknown>
    raw.settings = null
    expect(() => parseCatalogue(raw)).toThrow(CatalogueError)
  })

  it('rejects an invalid WhatsApp number', () => {
    const raw = rawTestCatalogue()
    raw.settings.whatsappNumber = '07933 903000'
    expect(() => parseCatalogue(raw)).toThrow(/settings/i)
  })

  it('rejects a malformed response', () => {
    expect(() => parseCatalogue(null)).toThrow(CatalogueError)
    expect(() => parseCatalogue({ settings: {}, designs: 'nope' })).toThrow(CatalogueError)
  })

  it('treats missing and invalid prices as unpriced and reports them', () => {
    const { catalogue, issues } = load()
    expect(catalogue.extras.find((e) => e.id === 'ext-broken')!.pricing).toBeNull()
    expect(issues).toContain('Extra "Test Unpriced Extra" has no valid price and will not be offered.')
    expect(catalogue.configurations.find((c) => c.id === 'cfg-sq6-3')!.basePricePence).toBeNull()
  })

  it('reports invalid design-level price overrides', () => {
    const { issues } = load()
    expect(issues.some((i) => i.includes('Test Design No Inherit') && i.includes('price override is invalid'))).toBe(true)
  })

  it('parses images, captions, labels and shown elements', () => {
    const { catalogue } = load()
    const a = catalogue.designs.find((d) => d.slug === 'test-design-a')!
    expect(a.mainImage?.alt).toBe('Test Design A front view')
    expect(a.mainImage?.labels).toEqual([{ text: 'Test label beside', placement: 'beside', x: null, y: null }])
    expect(a.gallery).toHaveLength(2)
    expect(a.gallery[0]!.caption).toBe('Side view')
    expect(a.gallery[0]!.labels[0]).toMatchObject({ placement: 'overlay', x: 30, y: 40 })
    expect(a.gallery[1]!.shownElements).toEqual([{ description: 'Test drip', status: 'paidOption' }])
  })

  it('handles a design with no images', () => {
    const { catalogue } = load()
    const d = catalogue.designs.find((d) => d.slug === 'test-design-paused')!
    expect(d.mainImage).toBeNull()
    expect(d.gallery).toEqual([])
  })

  it('falls back to the design name for missing alt text', () => {
    const { catalogue } = load()
    const b = catalogue.designs.find((d) => d.slug === 'test-design-b')!
    expect(b.mainImage?.alt).toBe('Test Design B')
  })

  it('skips an image without a URL and reports it', () => {
    const { catalogue, issues } = load((raw) => {
      ;(raw.designs[0] as Record<string, unknown>).gallery = [{ url: null, alt: 'x' }]
    })
    expect(catalogue.designs[0]!.gallery).toEqual([])
    expect(issues.some((i) => i.includes('An image on design "Test Design A" was skipped'))).toBe(true)
  })

  it('keeps missing structural information as null rather than inventing it', () => {
    const { catalogue } = load()
    const c = catalogue.configurations.find((c) => c.id === 'cfg-r6-4')!
    expect(c.approxHeightInches).toBeNull()
    expect(c.dessertPortions).toBeNull()
    expect(c.coffeePortions).toBeNull()
    expect(c.tierCount).toBe(1)
  })

  it('rejects duplicate slugs', () => {
    const { catalogue, issues } = load((raw) => {
      ;(raw.designs[1] as Record<string, unknown>).slug = 'test-design-a'
    })
    expect(catalogue.designs.filter((d) => d.slug === 'test-design-a')).toHaveLength(1)
    expect(issues.some((i) => i.includes('already uses the slug'))).toBe(true)
  })
})

describe('toPricingRule', () => {
  it('accepts valid rules', () => {
    expect(toPricingRule({ mode: 'included' })).toEqual({ mode: 'included' })
    expect(toPricingRule({ mode: 'fixed', amountPence: 800 })).toEqual({ mode: 'fixed', amountPence: 800 })
    expect(
      toPricingRule({ mode: 'bySize', bySize: [{ configurationId: 'a', amountPence: 100 }] }),
    ).toEqual({ mode: 'bySize', bySize: { a: 100 } })
  })

  it('returns null for missing, negative, fractional or ambiguous prices', () => {
    expect(toPricingRule(null)).toBeNull()
    expect(toPricingRule({ mode: 'fixed' })).toBeNull()
    expect(toPricingRule({ mode: 'fixed', amountPence: -1 })).toBeNull()
    expect(toPricingRule({ mode: 'fixed', amountPence: 8.5 })).toBeNull()
    expect(toPricingRule({ mode: 'bySize', bySize: [] })).toBeNull()
    expect(
      toPricingRule({
        mode: 'bySize',
        bySize: [
          { configurationId: 'a', amountPence: 100 },
          { configurationId: 'a', amountPence: 200 },
        ],
      }),
    ).toBeNull()
    expect(toPricingRule({ mode: 'mystery', amountPence: 100 })).toBeNull()
  })
})
