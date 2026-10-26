/**
 * Normalised catalogue types. These are what the pricing engine, the website
 * and the Studio overview work with — produced from Sanity data by
 * `parseCatalogue` (catalogue/parse.ts), never written by hand in the app.
 *
 * All money values are integer pence.
 */

export type PricingRule =
  | { mode: 'included' }
  | { mode: 'fixed'; amountPence: number }
  /** Price depends on the selected configuration; a missing entry means "not priced for that size". */
  | { mode: 'bySize'; bySize: Record<string, number> }

export interface Portions {
  min: number
  max: number
}

export interface Configuration {
  id: string
  label: string
  shape: string | null
  sizeInches: number | null
  /** Number of tiers (stacked cakes). Distinct from sponge layers. */
  tierCount: number
  /** Sponge layers within each tier. */
  spongeLayers: number
  approxHeightInches: number | null
  dessertPortions: Portions | null
  coffeePortions: Portions | null
  /** null = not priced, so the configuration can't be offered. */
  basePricePence: number | null
  /** Offered automatically on designs that use the standard size range. */
  offeredByDefault: boolean
  active: boolean
  order: number
}

export type OptionKind = 'flavour' | 'filling' | 'frosting'
export const OPTION_KINDS: readonly OptionKind[] = ['flavour', 'filling', 'frosting']

export interface CakeOption {
  id: string
  kind: OptionKind
  name: string
  description: string | null
  /** null = pricing rule is missing or invalid; the option is treated as unavailable. */
  pricing: PricingRule | null
  dietaryNotes: string | null
  active: boolean
  order: number
}

export interface Extra {
  id: string
  name: string
  description: string | null
  pricing: PricingRule | null
  /** When set, the customer chooses a quantity and the price is per unit. */
  quantity: { min: number; max: number } | null
  active: boolean
  order: number
}

export interface Personalisation {
  name: boolean
  age: boolean
}

export type DecorationStatus = 'included' | 'optional'

export interface Decoration {
  id: string
  name: string
  customerLabel: string | null
  description: string | null
  imageUrl: string | null
  pricing: PricingRule | null
  defaultRule: {
    appliesTo: 'none' | 'allDesigns' | 'categories'
    categoryIds: string[]
    status: DecorationStatus
  }
  restrictToConfigurationIds: string[]
  incompatibleWithIds: string[]
  /** This decoration replaces (upgrades) another one; its price is the upgrade charge. */
  upgradeOfId: string | null
  personalisation: Personalisation
  active: boolean
  order: number
}

export interface ImageLabel {
  text: string
  placement: 'beside' | 'overlay'
  /** Overlay position, percent from the left/top of the image. */
  x: number | null
  y: number | null
}

export interface ShownElement {
  description: string
  status: 'included' | 'paidOption' | 'customExample'
}

export interface CakeImage {
  url: string
  width: number | null
  height: number | null
  alt: string
  caption: string | null
  view: 'main' | 'side' | 'top' | 'crossSection' | 'detail' | 'other'
  labels: ImageLabel[]
  shownElements: ShownElement[]
}

export interface DesignChoice {
  optionId: string
  isDefault: boolean
  priceOverride: PricingRule | null
}

export interface OptionGroup {
  required: boolean
  maxSelections: number
  choices: DesignChoice[]
}

export interface ConfigurationOverride {
  configurationId: string
  action: 'offer' | 'exclude'
  basePriceOverridePence: number | null
  note: string | null
}

export interface DecorationOverride {
  decorationId: string
  action: 'include' | 'optional' | 'exclude'
  priceOverride: PricingRule | null
  restrictToConfigurationIds: string[]
  note: string | null
}

export interface Design {
  id: string
  slug: string
  name: string
  /** Short code quoted in enquiries so the owner can identify the design. */
  reference: string
  categoryId: string | null
  shortDescription: string
  fullDescription: string | null
  structureNotes: string | null
  mainImage: CakeImage | null
  gallery: CakeImage[]
  featured: boolean
  order: number
  acceptingEnquiries: boolean
  leadTimeDaysOverride: number | null
  useStandardConfigurations: boolean
  configurationOverrides: ConfigurationOverride[]
  groups: Record<OptionKind, OptionGroup>
  extras: { extraId: string; priceOverride: PricingRule | null }[]
  inheritStandardDecorations: boolean
  decorationOverrides: DecorationOverride[]
  dietaryInfo: string | null
  allergenInfo: string | null
  customRouting: { showCustomCta: boolean; customPrompt: string | null }
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  order: number
}

export interface Settings {
  businessName: string
  mainWebsiteUrl: string
  /** Digits only, international format without "+", e.g. 447933903000. */
  whatsappNumber: string
  contactEmail: string | null
  currency: 'GBP'
  timezone: 'Europe/London'
  defaultLeadTimeDays: number
  collectionInstructions: string | null
  quotationDisclaimer: string
  privacyNoticeUrl: string | null
  customOrderUrl: string
  customOrderCtaText: string
  servingsNote: string | null
  allergenInfoUrl: string | null
  maintenanceNotice: string | null
  builderEnabled: boolean
}

export interface Catalogue {
  settings: Settings
  categories: Category[]
  configurations: Configuration[]
  options: CakeOption[]
  extras: Extra[]
  decorations: Decoration[]
  designs: Design[]
  /** ISO timestamp of when the catalogue was fetched; quoted in enquiries. */
  fetchedAt: string
}

/** What the customer has chosen. IDs only — never prices. */
export interface Selection {
  designSlug: string
  configurationId: string | null
  options: Record<OptionKind, string[]>
  decorationIds: string[]
  /** Personalisation text keyed by decoration id. */
  personalisation: Record<string, { name?: string; age?: string }>
  /** Quantity keyed by extra id (1 for non-quantity extras). */
  extras: Record<string, number>
}

export function emptySelection(designSlug: string): Selection {
  return {
    designSlug,
    configurationId: null,
    options: { flavour: [], filling: [], frosting: [] },
    decorationIds: [],
    personalisation: {},
    extras: {},
  }
}
