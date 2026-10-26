import { z } from 'zod'
import type {
  CakeImage,
  CakeOption,
  Catalogue,
  Category,
  Configuration,
  Decoration,
  Design,
  Extra,
  OptionGroup,
  PricingRule,
  Settings,
} from '../types'

/**
 * Validates the raw result of CATALOGUE_QUERY and normalises it.
 *
 * Strategy:
 * - Settings are essential (WhatsApp number, disclaimer, lead time). If they
 *   are missing or invalid the whole catalogue is rejected — the site shows an
 *   error instead of quoting.
 * - Every other document is validated individually. An invalid document is
 *   dropped and reported in `issues`, so one bad record can't take the site
 *   down — but it also can't be quoted.
 * - An invalid or missing pricing rule becomes `null` ("unpriced"), which the
 *   pricing engine treats as unavailable. Prices are never guessed.
 */

export class CatalogueError extends Error {
  constructor(
    message: string,
    readonly issues: string[] = [],
  ) {
    super(message)
    this.name = 'CatalogueError'
  }
}

export interface ParseResult {
  catalogue: Catalogue
  issues: string[]
}

const text = z.string().trim().min(1)
const optText = z.string().nullish().transform((v) => (v && v.trim() ? v.trim() : null))
const pence = z.number().int().nonnegative()
const positiveInt = z.number().int().positive()
const bool = (fallback: boolean) => z.boolean().nullish().transform((v) => v ?? fallback)
const order = z.number().nullish().transform((v) => v ?? 1000)
const ids = z
  .array(z.string().nullish())
  .nullish()
  .transform((v) => (v ?? []).filter((x): x is string => !!x))

const rawPricing = z
  .object({
    mode: z.string().nullish(),
    amountPence: z.unknown(),
    bySize: z.unknown(),
  })
  .nullish()

const fixedPricing = z.object({ mode: z.literal('fixed'), amountPence: pence })
const bySizePricing = z.object({
  mode: z.literal('bySize'),
  bySize: z.array(z.object({ configurationId: text, amountPence: pence })).min(1),
})

/** Returns null when the rule is missing or invalid (= unpriced). */
export function toPricingRule(raw: unknown): PricingRule | null {
  const parsed = rawPricing.safeParse(raw)
  if (!parsed.success || !parsed.data) return null
  const mode = parsed.data.mode
  if (mode === 'included') return { mode: 'included' }
  if (mode === 'fixed') {
    const r = fixedPricing.safeParse(parsed.data)
    return r.success ? { mode: 'fixed', amountPence: r.data.amountPence } : null
  }
  if (mode === 'bySize') {
    const r = bySizePricing.safeParse(parsed.data)
    if (!r.success) return null
    const bySize: Record<string, number> = {}
    for (const entry of r.data.bySize) {
      // A size listed twice is ambiguous — refuse to price it.
      if (entry.configurationId in bySize) return null
      bySize[entry.configurationId] = entry.amountPence
    }
    return { mode: 'bySize', bySize }
  }
  return null
}

/** Like toPricingRule, but "no override set" (no mode) is distinct from an invalid override. */
function toPriceOverride(raw: unknown): PricingRule | null | 'invalid' {
  const parsed = rawPricing.safeParse(raw)
  if (!parsed.success || !parsed.data || !parsed.data.mode) return null
  return toPricingRule(raw) ?? 'invalid'
}

const settingsSchema = z.object({
  businessName: text,
  mainWebsiteUrl: z.string().url(),
  whatsappNumber: z
    .string()
    .transform((v) => v.replace(/[\s()+-]/g, ''))
    .pipe(z.string().regex(/^[1-9]\d{7,14}$/, 'WhatsApp number must be in international format, e.g. 447933903000')),
  contactEmail: optText,
  currency: z.literal('GBP').nullish().transform(() => 'GBP' as const),
  timezone: z.literal('Europe/London').nullish().transform(() => 'Europe/London' as const),
  defaultLeadTimeDays: z.number().int().min(0).max(365),
  collectionInstructions: optText,
  quotationDisclaimer: text,
  privacyNoticeUrl: z.string().url().nullish().transform((v) => v ?? null),
  customOrderUrl: z.string().url(),
  customOrderCtaText: optText.transform((v) => v ?? 'Looking for something different? Request a custom cake.'),
  servingsNote: optText,
  dessertPortionsHelp: optText,
  coffeePortionsHelp: optText,
  allergenInfoUrl: z.string().url().nullish().transform((v) => v ?? null),
  maintenanceNotice: optText,
  builderEnabled: bool(true),
})

const portions = z
  .object({ min: z.number().int().positive().nullish(), max: z.number().int().positive().nullish() })
  .nullish()
  .transform((p) => (p && p.min && p.max && p.min <= p.max ? { min: p.min, max: p.max } : null))

const configurationSchema = z.object({
  id: text,
  label: text,
  shape: optText,
  sizeInches: z.number().positive().nullish().transform((v) => v ?? null),
  tierCount: positiveInt.nullish().transform((v) => v ?? 1),
  spongeLayers: positiveInt,
  approxHeightInches: z.number().positive().nullish().transform((v) => v ?? null),
  dessertPortions: portions,
  coffeePortions: portions,
  basePricePence: z
    .number()
    .nullish()
    .transform((v) => (typeof v === 'number' && Number.isInteger(v) && v > 0 ? v : null)),
  offeredByDefault: bool(false),
  active: bool(false),
  order,
})

const optionSchema = z.object({
  id: text,
  kind: z.enum(['flavour', 'filling', 'frosting']),
  name: text,
  description: optText,
  pricing: z.unknown(),
  dietaryNotes: optText,
  active: bool(false),
  order,
})

const extraSchema = z.object({
  id: text,
  name: text,
  description: optText,
  pricing: z.unknown(),
  allowQuantity: bool(false),
  minQuantity: positiveInt.nullish(),
  maxQuantity: positiveInt.nullish(),
  active: bool(false),
  order,
})

const decorationSchema = z.object({
  id: text,
  name: text,
  customerLabel: optText,
  description: optText,
  imageUrl: optText,
  pricing: z.unknown(),
  defaultAppliesTo: z.enum(['none', 'allDesigns', 'categories']).nullish().transform((v) => v ?? 'none'),
  defaultCategoryIds: ids,
  defaultStatus: z.enum(['included', 'optional']).nullish().transform((v) => v ?? 'optional'),
  restrictToConfigurationIds: ids,
  incompatibleWithIds: ids,
  upgradeOfId: optText,
  requiresName: bool(false),
  requiresAge: bool(false),
  active: bool(false),
  order,
})

const categorySchema = z.object({
  id: text,
  name: text,
  slug: text,
  description: optText,
  order,
})

const imageSchema = z
  .object({
    url: z.string().url(),
    width: z.number().nullish().transform((v) => v ?? null),
    height: z.number().nullish().transform((v) => v ?? null),
    alt: optText,
    caption: optText,
    view: z
      .enum(['main', 'side', 'top', 'crossSection', 'detail', 'other'])
      .nullish()
      .transform((v) => v ?? 'other'),
    labels: z
      .array(
        z.object({
          text: text,
          placement: z.enum(['beside', 'overlay']).nullish().transform((v) => v ?? 'beside'),
          x: z.number().min(0).max(100).nullish().transform((v) => v ?? null),
          y: z.number().min(0).max(100).nullish().transform((v) => v ?? null),
        }),
      )
      .nullish()
      .transform((v) => v ?? []),
    shownElements: z
      .array(
        z.object({
          description: text,
          status: z.enum(['included', 'paidOption', 'customExample']),
        }),
      )
      .nullish()
      .transform((v) => v ?? []),
  })

const rawGroup = z
  .object({
    includeAllActive: z.boolean().nullish(),
    required: z.boolean().nullish(),
    maxSelections: z.number().int().positive().nullish(),
    choices: z
      .array(
        z.object({
          optionId: z.string().nullish(),
          isDefault: z.boolean().nullish(),
          priceOverride: z.unknown(),
        }),
      )
      .nullish(),
  })
  .nullish()

const designSchema = z.object({
  id: text,
  name: text,
  slug: text,
  reference: optText,
  categoryId: optText,
  shortDescription: optText,
  fullDescription: optText,
  structureNotes: optText,
  mainImage: z.unknown(),
  gallery: z.array(z.unknown()).nullish(),
  featured: bool(false),
  order,
  acceptingEnquiries: bool(true),
  leadTimeDaysOverride: z.number().int().min(0).max(365).nullish().transform((v) => v ?? null),
  useStandardConfigurations: bool(true),
  configurationOverrides: z
    .array(
      z.object({
        configurationId: z.string().nullish(),
        action: z.enum(['offer', 'exclude']).nullish(),
        basePriceOverridePence: z.number().nullish(),
        note: optText,
      }),
    )
    .nullish(),
  flavours: rawGroup,
  fillings: rawGroup,
  frostings: rawGroup,
  extras: z.array(z.object({ extraId: z.string().nullish(), priceOverride: z.unknown() })).nullish(),
  inheritStandardDecorations: bool(true),
  decorationOverrides: z
    .array(
      z.object({
        decorationId: z.string().nullish(),
        action: z.enum(['include', 'optional', 'exclude']).nullish(),
        priceOverride: z.unknown(),
        restrictToConfigurationIds: ids,
        note: optText,
      }),
    )
    .nullish(),
  dietaryInfo: optText,
  allergenInfo: optText,
  showCustomCta: bool(true),
  customPrompt: optText,
})

const rootSchema = z.object({
  settings: z.unknown(),
  categories: z.array(z.unknown()).nullish(),
  configurations: z.array(z.unknown()).nullish(),
  options: z.array(z.unknown()).nullish(),
  extras: z.array(z.unknown()).nullish(),
  decorations: z.array(z.unknown()).nullish(),
  designs: z.array(z.unknown()).nullish(),
})

function describe(error: z.ZodError): string {
  return error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ')
}

function label(raw: unknown): string {
  if (raw && typeof raw === 'object') {
    const r = raw as Record<string, unknown>
    return String(r.name ?? r.label ?? r.id ?? 'unknown')
  }
  return 'unknown'
}

function parseEach<S extends z.ZodTypeAny>(
  kind: string,
  list: unknown[] | null | undefined,
  schema: S,
  issues: string[],
): z.output<S>[] {
  const out: z.output<S>[] = []
  for (const raw of list ?? []) {
    const id = raw && typeof raw === 'object' ? (raw as { id?: unknown }).id : undefined
    // Drafts must never reach customers, even if a query is misconfigured.
    if (typeof id === 'string' && id.startsWith('drafts.')) continue
    const r = schema.safeParse(raw)
    if (r.success) out.push(r.data)
    else issues.push(`${kind} "${label(raw)}" was skipped — ${describe(r.error)}`)
  }
  return out
}

function parseImage(raw: unknown, fallbackAlt: string, issues: string[], where: string): CakeImage | null {
  if (raw == null) return null
  const r = imageSchema.safeParse(raw)
  if (!r.success) {
    issues.push(`An image on ${where} was skipped — ${describe(r.error)}`)
    return null
  }
  return { ...r.data, alt: r.data.alt ?? fallbackAlt }
}

export function parseCatalogue(raw: unknown, fetchedAt: string = new Date().toISOString()): ParseResult {
  const issues: string[] = []
  const root = rootSchema.safeParse(raw)
  if (!root.success) throw new CatalogueError('The cake catalogue response was not in the expected format.')

  if (root.data.settings == null) {
    throw new CatalogueError('Cake builder settings have not been published yet.')
  }
  const settingsResult = settingsSchema.safeParse(root.data.settings)
  if (!settingsResult.success) {
    throw new CatalogueError('Cake builder settings are incomplete or invalid.', [describe(settingsResult.error)])
  }
  const settings: Settings = settingsResult.data

  const categories: Category[] = parseEach('Category', root.data.categories, categorySchema, issues)
  const configurations: Configuration[] = parseEach('Size', root.data.configurations, configurationSchema, issues)

  const options: CakeOption[] = parseEach('Option', root.data.options, optionSchema, issues).map((o) => {
    const pricing = toPricingRule(o.pricing)
    if (!pricing && o.active) issues.push(`Option "${o.name}" has no valid price and will not be offered.`)
    return { ...o, pricing }
  })

  const extras: Extra[] = parseEach('Extra', root.data.extras, extraSchema, issues).map((e) => {
    const pricing = toPricingRule(e.pricing)
    if (!pricing && e.active) issues.push(`Extra "${e.name}" has no valid price and will not be offered.`)
    let quantity: Extra['quantity'] = null
    if (e.allowQuantity) {
      const min = e.minQuantity ?? 1
      const max = e.maxQuantity ?? min
      quantity = max >= min ? { min, max } : null
    }
    return {
      id: e.id,
      name: e.name,
      description: e.description,
      pricing,
      quantity,
      active: e.active,
      order: e.order,
    }
  })

  const decorations: Decoration[] = parseEach('Decoration', root.data.decorations, decorationSchema, issues).map(
    (d) => {
      const pricing = toPricingRule(d.pricing)
      if (!pricing && d.active) issues.push(`Decoration "${d.name}" has no valid price and will not be offered.`)
      return {
        id: d.id,
        name: d.name,
        customerLabel: d.customerLabel,
        description: d.description,
        imageUrl: d.imageUrl,
        pricing,
        defaultRule: { appliesTo: d.defaultAppliesTo, categoryIds: d.defaultCategoryIds, status: d.defaultStatus },
        restrictToConfigurationIds: d.restrictToConfigurationIds,
        incompatibleWithIds: d.incompatibleWithIds,
        upgradeOfId: d.upgradeOfId,
        personalisation: { name: d.requiresName, age: d.requiresAge },
        active: d.active,
        order: d.order,
      }
    },
  )

  const designs: Design[] = []
  const seenSlugs = new Set<string>()
  for (const d of parseEach('Design', root.data.designs, designSchema, issues)) {
    if (seenSlugs.has(d.slug)) {
      issues.push(`Design "${d.name}" was skipped — another design already uses the slug "${d.slug}".`)
      continue
    }
    const designIssues: string[] = []

    const group = (raw: z.output<typeof rawGroup>, kind: string): OptionGroup => {
      const choices: OptionGroup['choices'] = []
      const seen = new Set<string>()
      for (const c of raw?.choices ?? []) {
        if (!c.optionId) continue
        if (seen.has(c.optionId)) {
          designIssues.push(`the same ${kind} is listed twice`)
          continue
        }
        seen.add(c.optionId)
        const override = toPriceOverride(c.priceOverride)
        if (override === 'invalid') {
          designIssues.push(`a ${kind} price override is invalid, so that ${kind} will not be offered`)
          // Keep the choice but make it unpriced so it can't be quoted.
          choices.push({ optionId: c.optionId, isDefault: !!c.isDefault, priceOverride: INVALID_OVERRIDE })
          continue
        }
        choices.push({ optionId: c.optionId, isDefault: !!c.isDefault, priceOverride: override })
      }
      return {
        // Default: every active option is offered and one must be chosen.
        includeAllActive: raw?.includeAllActive ?? true,
        required: raw?.required ?? true,
        maxSelections: raw?.maxSelections ?? 1,
        choices,
      }
    }

    const decorationOverrides: Design['decorationOverrides'] = []
    const seenDecorations = new Set<string>()
    for (const o of d.decorationOverrides ?? []) {
      if (!o.decorationId || !o.action) continue
      if (seenDecorations.has(o.decorationId)) {
        designIssues.push('a decoration has more than one override; only the first is used')
        continue
      }
      seenDecorations.add(o.decorationId)
      const override = toPriceOverride(o.priceOverride)
      if (override === 'invalid') designIssues.push('a decoration price override is invalid, so it will not be offered')
      decorationOverrides.push({
        decorationId: o.decorationId,
        action: o.action,
        priceOverride: override === 'invalid' ? INVALID_OVERRIDE : override,
        restrictToConfigurationIds: o.restrictToConfigurationIds,
        note: o.note,
      })
    }

    const configurationOverrides: Design['configurationOverrides'] = []
    const seenConfigs = new Set<string>()
    for (const o of d.configurationOverrides ?? []) {
      if (!o.configurationId || !o.action || seenConfigs.has(o.configurationId)) continue
      seenConfigs.add(o.configurationId)
      const priceOverride = o.basePriceOverridePence
      if (priceOverride != null && !(Number.isInteger(priceOverride) && priceOverride > 0)) {
        designIssues.push('a size price override is invalid, so that size will not be offered')
      }
      configurationOverrides.push({
        configurationId: o.configurationId,
        action: o.action,
        basePriceOverridePence:
          priceOverride == null ? null : Number.isInteger(priceOverride) && priceOverride > 0 ? priceOverride : -1,
        note: o.note,
      })
    }

    const extrasList: Design['extras'] = []
    for (const e of d.extras ?? []) {
      if (!e.extraId) continue
      const override = toPriceOverride(e.priceOverride)
      if (override === 'invalid') designIssues.push('an extra price override is invalid, so it will not be offered')
      extrasList.push({ extraId: e.extraId, priceOverride: override === 'invalid' ? INVALID_OVERRIDE : override })
    }

    const mainImage = parseImage(d.mainImage, d.name, issues, `design "${d.name}"`)
    const gallery = (d.gallery ?? [])
      .map((g) => parseImage(g, d.name, issues, `design "${d.name}"`))
      .filter((g): g is CakeImage => g !== null)

    const groups = {
      flavour: group(d.flavours, 'flavour'),
      filling: group(d.fillings, 'filling'),
      frosting: group(d.frostings, 'frosting'),
    }

    for (const msg of designIssues) issues.push(`Design "${d.name}": ${msg}.`)
    seenSlugs.add(d.slug)

    designs.push({
      id: d.id,
      slug: d.slug,
      name: d.name,
      reference: d.reference ?? d.slug.toUpperCase(),
      categoryId: d.categoryId,
      shortDescription: d.shortDescription ?? '',
      fullDescription: d.fullDescription,
      structureNotes: d.structureNotes,
      mainImage,
      gallery,
      featured: d.featured,
      order: d.order,
      acceptingEnquiries: d.acceptingEnquiries,
      leadTimeDaysOverride: d.leadTimeDaysOverride,
      useStandardConfigurations: d.useStandardConfigurations,
      configurationOverrides,
      groups,
      extras: extrasList,
      inheritStandardDecorations: d.inheritStandardDecorations,
      decorationOverrides,
      dietaryInfo: d.dietaryInfo,
      allergenInfo: d.allergenInfo,
      customRouting: { showCustomCta: d.showCustomCta, customPrompt: d.customPrompt },
    })
  }

  return {
    catalogue: { settings, categories, configurations, options, extras, decorations, designs, fetchedAt },
    issues,
  }
}

/**
 * Sentinel for an override the owner set but filled in incorrectly.
 * A bySize rule with no sizes never prices anything, so anything using it
 * is treated as unpriced rather than silently falling back to the default.
 */
export const INVALID_OVERRIDE: PricingRule = Object.freeze({ mode: 'bySize', bySize: Object.freeze({}) }) as PricingRule
