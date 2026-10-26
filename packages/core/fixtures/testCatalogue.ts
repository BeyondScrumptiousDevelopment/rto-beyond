/**
 * FICTITIOUS test catalogue in the raw shape returned by CATALOGUE_QUERY.
 * Names and prices are deliberately fake ("Test Design A", round numbers)
 * and must never be used as real catalogue data.
 *
 * Shared by unit tests and the Playwright end-to-end tests.
 */
import { DEFAULT_DISCLAIMER } from '../src/enquiry'

const img = (id: string, extra: Record<string, unknown> = {}) => ({
  url: `https://cdn.sanity.io/images/testproject/production/${id}-800x600.jpg`,
  width: 800,
  height: 600,
  alt: null,
  caption: null,
  view: 'main',
  labels: null,
  shownElements: null,
  ...extra,
})

const fixed = (amountPence: number) => ({ mode: 'fixed', amountPence, bySize: null })
const included = { mode: 'included', amountPence: null, bySize: null }
const choice = (optionId: string, isDefault = false, priceOverride: unknown = null) => ({
  optionId,
  isDefault,
  priceOverride,
})

export const TEST_WHATSAPP = '447000000000'

export function rawTestCatalogue() {
  return {
    settings: {
      businessName: 'Beyond Scrumptious',
      mainWebsiteUrl: 'https://www.beyondscrumptious.com',
      whatsappNumber: '+44 7000 000000',
      contactEmail: 'test@example.com',
      currency: 'GBP',
      timezone: 'Europe/London',
      defaultLeadTimeDays: 7,
      collectionInstructions: 'Test collection instructions.',
      quotationDisclaimer: DEFAULT_DISCLAIMER,
      privacyNoticeUrl: 'https://www.beyondscrumptious.com/privacy-policy',
      customOrderUrl: 'https://www.beyondscrumptious.com/contact',
      customOrderCtaText: 'Looking for something different? Request a custom cake.',
      servingsNote: 'Serving numbers are estimates and depend on how the cake is sliced.',
      allergenInfoUrl: 'https://www.beyondscrumptious.com/allergen-information',
      maintenanceNotice: null,
      builderEnabled: true,
    },
    categories: [
      { id: 'cat-birthday', name: 'Test Birthday', slug: 'test-birthday', description: null, order: 1 },
      { id: 'cat-celebration', name: 'Test Celebration', slug: 'test-celebration', description: null, order: 2 },
    ],
    configurations: [
      cfg('cfg-r6-3', '6-inch round, 3 layers', 'Round', 6, 3, 1000, { order: 1, dessertPortions: { min: 10, max: 12 }, coffeePortions: { min: 15, max: 18 } }),
      cfg('cfg-r6-4', '6-inch round, 4 layers', 'Round', 6, 4, 2000, { order: 2 }),
      cfg('cfg-r8-2', '8-inch round, 2 layers', 'Round', 8, 2, 3000, { order: 3 }),
      cfg('cfg-sq6-3', '6-inch square, 3 layers', 'Square', 6, 3, null, { order: 4, active: false }),
      cfg('cfg-tiered', 'Two-tier test', 'Round', 8, 2, 9000, { order: 5, tierCount: 2, offeredByDefault: false, approxHeightInches: 9 }),
    ],
    options: [
      opt('flv-vanilla', 'flavour', 'Test Vanilla', included, 1),
      opt('flv-premium', 'flavour', 'Test Premium', fixed(500), 2),
      opt('flv-sized', 'flavour', 'Test Sized', { mode: 'bySize', amountPence: null, bySize: [{ configurationId: 'cfg-r6-3', amountPence: 300 }, { configurationId: 'cfg-r8-2', amountPence: 600 }] }, 3),
      opt('flv-inactive', 'flavour', 'Test Inactive', included, 4, false),
      opt('fil-jam', 'filling', 'Test Jam', included, 1),
      opt('frs-butter', 'frosting', 'Test Buttercream', included, 1),
      opt('frs-ganache', 'frosting', 'Test Ganache', fixed(400), 2),
    ],
    extras: [
      { id: 'ext-candles', name: 'Test Candles', description: null, pricing: fixed(200), allowQuantity: true, minQuantity: 1, maxQuantity: 5, active: true, order: 1 },
      { id: 'ext-box', name: 'Test Box', description: null, pricing: fixed(300), allowQuantity: false, minQuantity: null, maxQuantity: null, active: true, order: 2 },
      { id: 'ext-broken', name: 'Test Unpriced Extra', description: null, pricing: { mode: 'fixed', amountPence: null, bySize: null }, allowQuantity: false, minQuantity: null, maxQuantity: null, active: true, order: 3 },
    ],
    decorations: [
      dec('dec-balls', 'Test Balls', fixed(300), { defaultAppliesTo: 'allDesigns', defaultStatus: 'included', order: 1 }),
      dec('dec-gold', 'Test Gold Leaf', fixed(500), { defaultAppliesTo: 'categories', defaultCategoryIds: ['cat-celebration'], defaultStatus: 'included', order: 2 }),
      dec('dec-card-topper', 'Test Card Topper', fixed(800), { order: 3 }),
      dec('dec-acrylic-topper', 'Test Acrylic Topper', fixed(1500), { order: 4, incompatibleWithIds: ['dec-card-topper'] }),
      dec('dec-name-charm', 'Test Name Charm', fixed(500), { order: 5, requiresName: true }),
      dec('dec-name-age', 'Test Name and Age', fixed(900), { order: 6, requiresName: true, requiresAge: true }),
      dec('dec-premium-balls', 'Test Premium Balls', fixed(700), { order: 7, upgradeOfId: 'dec-balls' }),
      dec('dec-disabled', 'Test Disabled', fixed(100), { order: 8, defaultStatus: 'included', active: false }),
      dec('dec-sparkler', 'Test Sparkler', fixed(250), { order: 9, defaultAppliesTo: 'none' }),
      dec('dec-big-only', 'Test Big Only', fixed(400), { order: 10, restrictToConfigurationIds: ['cfg-r8-2'] }),
    ],
    designs: [
      design('des-a', 'test-design-a', 'Test Design A', {
        reference: 'TEST-A',
        categoryId: 'cat-birthday',
        order: 1,
        featured: true,
        mainImage: img('main-a', { alt: 'Test Design A front view', labels: [{ text: 'Test label beside', placement: 'beside', x: null, y: null }] }),
        gallery: [
          img('side-a', { view: 'side', caption: 'Side view', labels: [{ text: 'Test overlay', placement: 'overlay', x: 30, y: 40 }] }),
          img('cut-a', { view: 'crossSection', caption: 'Cross-section', shownElements: [{ description: 'Test drip', status: 'paidOption' }] }),
        ],
        flavours: { required: true, maxSelections: 1, choices: [choice('flv-vanilla', true), choice('flv-premium'), choice('flv-sized'), choice('flv-inactive')] },
        fillings: { required: true, maxSelections: 1, choices: [choice('fil-jam', true)] },
        frostings: { required: true, maxSelections: 1, choices: [choice('frs-butter', true), choice('frs-ganache')] },
        extras: [
          { extraId: 'ext-candles', priceOverride: null },
          { extraId: 'ext-box', priceOverride: null },
          { extraId: 'ext-broken', priceOverride: null },
        ],
      }),
      design('des-b', 'test-design-b', 'Test Design B', {
        reference: 'TEST-B',
        categoryId: 'cat-celebration',
        order: 2,
        leadTimeDaysOverride: 14,
        mainImage: img('main-b'),
        configurationOverrides: [
          { configurationId: 'cfg-r8-2', action: 'exclude', basePriceOverridePence: null, note: null },
          { configurationId: 'cfg-tiered', action: 'offer', basePriceOverridePence: null, note: 'Test tier note' },
          { configurationId: 'cfg-r6-3', action: 'offer', basePriceOverridePence: 1200, note: null },
        ],
        flavours: { required: true, maxSelections: 2, choices: [choice('flv-vanilla', true), choice('flv-premium', false, fixed(250))] },
        fillings: null,
        frostings: null,
        decorationOverrides: [
          { decorationId: 'dec-balls', action: 'exclude', priceOverride: null, restrictToConfigurationIds: null, note: null },
          { decorationId: 'dec-sparkler', action: 'include', priceOverride: null, restrictToConfigurationIds: null, note: 'Test note' },
          { decorationId: 'dec-card-topper', action: 'optional', priceOverride: fixed(600), restrictToConfigurationIds: null, note: null },
          { decorationId: 'dec-name-charm', action: 'include', priceOverride: null, restrictToConfigurationIds: null, note: null },
        ],
      }),
      design('des-paused', 'test-design-paused', 'Test Design Paused', {
        order: 3,
        acceptingEnquiries: false,
        flavours: { required: true, maxSelections: 1, choices: [choice('flv-vanilla', true)] },
      }),
      design('des-noinherit', 'test-design-noinherit', 'Test Design No Inherit', {
        order: 4,
        inheritStandardDecorations: false,
        flavours: { required: true, maxSelections: 1, choices: [choice('flv-premium', false, { mode: 'fixed', amountPence: -5, bySize: null })] },
        decorationOverrides: [
          { decorationId: 'dec-gold', action: 'include', priceOverride: null, restrictToConfigurationIds: null, note: null },
        ],
      }),
      // Invalid: no name — must be skipped and reported.
      { ...design('des-invalid', 'test-design-invalid', '', {}), name: null },
      // A draft that slipped through must never be shown.
      design('drafts.des-a', 'test-design-draft', 'Test Draft', {}),
    ],
  }
}

function cfg(
  id: string,
  label: string,
  shape: string,
  sizeInches: number,
  spongeLayers: number,
  basePricePence: number | null,
  extra: Record<string, unknown> = {},
) {
  return {
    id,
    label,
    shape,
    sizeInches,
    tierCount: 1,
    spongeLayers,
    approxHeightInches: null,
    dessertPortions: null,
    coffeePortions: null,
    basePricePence,
    offeredByDefault: true,
    active: true,
    order: 0,
    ...extra,
  }
}

function opt(id: string, kind: string, name: string, pricing: unknown, order: number, active = true) {
  return { id, kind, name, description: null, pricing, dietaryNotes: null, active, order }
}

function dec(id: string, name: string, pricing: unknown, extra: Record<string, unknown> = {}) {
  return {
    id,
    name,
    customerLabel: null,
    description: null,
    imageUrl: null,
    pricing,
    defaultAppliesTo: 'allDesigns',
    defaultCategoryIds: null,
    defaultStatus: 'optional',
    restrictToConfigurationIds: null,
    incompatibleWithIds: null,
    upgradeOfId: null,
    requiresName: false,
    requiresAge: false,
    active: true,
    order: 0,
    ...extra,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function design(id: string, slug: string, name: string, extra: Record<string, unknown>): Record<string, any> {
  return {
    id,
    name,
    slug,
    reference: null,
    categoryId: null,
    shortDescription: `${name} short description.`,
    fullDescription: null,
    structureNotes: null,
    mainImage: null,
    gallery: null,
    featured: false,
    order: 0,
    acceptingEnquiries: true,
    leadTimeDaysOverride: null,
    useStandardConfigurations: true,
    configurationOverrides: null,
    flavours: null,
    fillings: null,
    frostings: null,
    extras: null,
    inheritStandardDecorations: true,
    decorationOverrides: null,
    dietaryInfo: null,
    allergenInfo: null,
    showCustomCta: true,
    customPrompt: null,
    ...extra,
  }
}
