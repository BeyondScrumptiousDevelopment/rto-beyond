import { priceFor } from './money'
import { INVALID_OVERRIDE } from './catalogue/parse'
import type {
  CakeOption,
  Catalogue,
  Configuration,
  Decoration,
  DecorationStatus,
  Design,
  Extra,
  OptionKind,
  PricingRule,
} from './types'
import { OPTION_KINDS } from './types'

/**
 * Resolution turns a design plus the shared libraries (sizes, options,
 * decorations) into exactly what that design offers. The website, the
 * pricing engine and the Studio overview all use these functions, so they
 * can't disagree.
 */

export interface OfferedConfiguration {
  configuration: Configuration
  /** Effective base price for this design, or null if unpriced/invalid. */
  basePricePence: number | null
  /** Active and priced: can be selected by customers. */
  available: boolean
  note: string | null
}

export interface ResolvedChoice {
  option: CakeOption
  pricing: PricingRule | null
  isDefault: boolean
}

export interface ResolvedGroup {
  required: boolean
  maxSelections: number
  choices: ResolvedChoice[]
}

export interface ResolvedExtra {
  extra: Extra
  pricing: PricingRule | null
}

export interface ResolvedDecoration {
  decoration: Decoration
  status: DecorationStatus
  pricing: PricingRule | null
  restrictToConfigurationIds: string[]
  /** Where the effective rule came from. */
  source: 'standard' | 'design'
  note: string | null
}

export interface ResolvedDesign {
  design: Design
  configurations: OfferedConfiguration[]
  groups: Record<OptionKind, ResolvedGroup>
  extras: ResolvedExtra[]
  decorations: ResolvedDecoration[]
}

const byOrder = <T extends { order: number }>(a: T, b: T) => a.order - b.order

export function resolveConfigurations(catalogue: Catalogue, design: Design): OfferedConfiguration[] {
  const byId = new Map(catalogue.configurations.map((c) => [c.id, c]))
  const offered = new Map<string, { override: number | null; note: string | null }>()

  if (design.useStandardConfigurations) {
    for (const c of catalogue.configurations) {
      if (c.offeredByDefault) offered.set(c.id, { override: null, note: null })
    }
  }
  for (const o of design.configurationOverrides) {
    if (o.action === 'exclude') offered.delete(o.configurationId)
    else offered.set(o.configurationId, { override: o.basePriceOverridePence, note: o.note })
  }

  const result: OfferedConfiguration[] = []
  for (const [id, { override, note }] of offered) {
    const configuration = byId.get(id)
    if (!configuration) continue
    // An override of -1 (or any non-positive value) marks an invalid override — never fall back to the default.
    const price = override !== null ? (override > 0 ? override : null) : configuration.basePricePence
    result.push({
      configuration,
      basePricePence: price,
      available: configuration.active && price !== null && price > 0,
      note,
    })
  }
  return result.sort((a, b) => byOrder(a.configuration, b.configuration))
}

export function resolveGroups(catalogue: Catalogue, design: Design): Record<OptionKind, ResolvedGroup> {
  const byId = new Map(catalogue.options.map((o) => [o.id, o]))
  const groups = {} as Record<OptionKind, ResolvedGroup>
  for (const kind of OPTION_KINDS) {
    const g = design.groups[kind]
    const choices: ResolvedChoice[] = []
    const listed = new Set<string>()
    for (const c of g.choices) {
      const option = byId.get(c.optionId)
      if (!option || !option.active || option.kind !== kind) continue
      listed.add(option.id)
      choices.push({ option, pricing: c.priceOverride ?? option.pricing, isDefault: c.isDefault })
    }
    if (g.includeAllActive) {
      for (const option of catalogue.options) {
        if (option.kind !== kind || !option.active || listed.has(option.id)) continue
        choices.push({ option, pricing: option.pricing, isDefault: false })
      }
      choices.sort((a, b) => byOrder(a.option, b.option))
    }
    groups[kind] = {
      required: g.required && choices.length > 0,
      maxSelections: Math.max(1, g.maxSelections),
      choices,
    }
  }
  return groups
}

export function resolveExtras(catalogue: Catalogue, design: Design): ResolvedExtra[] {
  const byId = new Map(catalogue.extras.map((e) => [e.id, e]))
  const result: ResolvedExtra[] = []
  const seen = new Set<string>()
  for (const e of design.extras) {
    const extra = byId.get(e.extraId)
    if (!extra || !extra.active || seen.has(extra.id)) continue
    seen.add(extra.id)
    result.push({ extra, pricing: e.priceOverride ?? extra.pricing })
  }
  return result.sort((a, b) => byOrder(a.extra, b.extra))
}

/**
 * Decoration inheritance:
 * 1. Inherit standard decorations whose default rule applies to this design.
 * 2. Apply the design's overrides (exclude / include / optional / price / sizes).
 * 3. Drop decorations that are disabled in the library — disabling always wins.
 * The result is keyed by decoration id, so each decoration appears once.
 */
export function resolveDecorations(catalogue: Catalogue, design: Design): ResolvedDecoration[] {
  const library = new Map(catalogue.decorations.map((d) => [d.id, d]))
  const resolved = new Map<string, ResolvedDecoration>()

  if (design.inheritStandardDecorations) {
    for (const d of catalogue.decorations) {
      const rule = d.defaultRule
      const applies =
        rule.appliesTo === 'allDesigns' ||
        (rule.appliesTo === 'categories' && design.categoryId !== null && rule.categoryIds.includes(design.categoryId))
      if (!applies) continue
      resolved.set(d.id, {
        decoration: d,
        status: rule.status,
        pricing: d.pricing,
        restrictToConfigurationIds: d.restrictToConfigurationIds,
        source: 'standard',
        note: null,
      })
    }
  }

  for (const o of design.decorationOverrides) {
    if (o.action === 'exclude') {
      resolved.delete(o.decorationId)
      continue
    }
    const d = library.get(o.decorationId)
    if (!d) continue
    resolved.set(d.id, {
      decoration: d,
      status: o.action === 'include' ? 'included' : 'optional',
      pricing: o.priceOverride ?? d.pricing,
      restrictToConfigurationIds: o.restrictToConfigurationIds.length
        ? o.restrictToConfigurationIds
        : d.restrictToConfigurationIds,
      source: 'design',
      note: o.note,
    })
  }

  return [...resolved.values()].filter((r) => r.decoration.active).sort((a, b) => byOrder(a.decoration, b.decoration))
}

export function resolveDesign(catalogue: Catalogue, design: Design): ResolvedDesign {
  return {
    design,
    configurations: resolveConfigurations(catalogue, design),
    groups: resolveGroups(catalogue, design),
    extras: resolveExtras(catalogue, design),
    decorations: resolveDecorations(catalogue, design),
  }
}

const fitsConfiguration = (restrict: string[], configurationId: string) =>
  restrict.length === 0 || restrict.includes(configurationId)

export interface DecorationsForConfiguration {
  included: ResolvedDecoration[]
  /** Optional decorations offered for this size, each with a known price. */
  optional: (ResolvedDecoration & { pricePence: number })[]
}

/** What decorations a design offers once a size is chosen. */
export function decorationsFor(resolved: ResolvedDesign, configurationId: string): DecorationsForConfiguration {
  const applicable = resolved.decorations.filter((r) =>
    fitsConfiguration(r.restrictToConfigurationIds, configurationId),
  )
  const included = applicable.filter((r) => r.status === 'included')
  const includedIds = new Set(included.map((r) => r.decoration.id))

  const optional: DecorationsForConfiguration['optional'] = []
  for (const r of applicable) {
    if (r.status !== 'optional') continue
    // An upgrade only makes sense when the item it upgrades is included.
    if (r.decoration.upgradeOfId && !includedIds.has(r.decoration.upgradeOfId)) continue
    const pricePence = priceFor(r.pricing, configurationId)
    if (pricePence === null) continue
    optional.push({ ...r, pricePence })
  }
  return { included, optional }
}

/** Choices in a group that can be priced for a configuration. */
export function choicesFor(group: ResolvedGroup, configurationId: string) {
  return group.choices
    .map((c) => ({ ...c, pricePence: priceFor(c.pricing, configurationId) }))
    .filter((c): c is ResolvedChoice & { pricePence: number } => c.pricePence !== null)
}

export function extrasFor(extras: ResolvedExtra[], configurationId: string) {
  return extras
    .map((e) => ({ ...e, pricePence: priceFor(e.pricing, configurationId) }))
    .filter((e): e is ResolvedExtra & { pricePence: number } => e.pricePence !== null)
}

/**
 * The lowest price a customer could actually be quoted for this design:
 * base price plus the cheapest choice in every required group. Returns null
 * when no size can be completed — the card then shows no price at all.
 */
export function startingPrice(catalogue: Catalogue, design: Design): number | null {
  const resolved = resolveDesign(catalogue, design)
  let best: number | null = null
  for (const offered of resolved.configurations) {
    if (!offered.available || offered.basePricePence === null) continue
    const configId = offered.configuration.id
    let total = offered.basePricePence
    let completable = true
    for (const kind of OPTION_KINDS) {
      const group = resolved.groups[kind]
      if (!group.required) continue
      const prices = choicesFor(group, configId).map((c) => c.pricePence)
      if (!prices.length) {
        completable = false
        break
      }
      total += Math.min(...prices)
    }
    if (completable && (best === null || total < best)) best = total
  }
  return best
}

export function isInvalidOverride(rule: PricingRule | null): boolean {
  return rule === INVALID_OVERRIDE
}
