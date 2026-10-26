import { formatPence } from './money'
import {
  choicesFor,
  decorationsFor,
  extrasFor,
  resolveDesign,
  type OfferedConfiguration,
  type ResolvedDecoration,
} from './resolve'
import type { Catalogue, Design, OptionKind, Selection } from './types'
import { OPTION_KINDS } from './types'

export interface Issue {
  code:
    | 'builderUnavailable'
    | 'designNotFound'
    | 'designPaused'
    | 'chooseSize'
    | 'sizeUnavailable'
    | 'optionUnavailable'
    | 'tooManyOptions'
    | 'optionRequired'
    | 'decorationUnavailable'
    | 'decorationsIncompatible'
    | 'personalisationMissing'
    | 'personalisationInvalid'
    | 'extraUnavailable'
    | 'extraQuantityInvalid'
  message: string
  /** Which part of the builder the issue relates to, for highlighting. */
  field?: string
}

export type LineKind = 'base' | OptionKind | 'decoration' | 'extra'

export interface EstimateLine {
  kind: LineKind
  id: string
  label: string
  /** Extra detail, e.g. personalisation text or "Upgrade from …". */
  detail: string | null
  quantity: number
  unitPence: number
  totalPence: number
}

export interface IncludedDecoration {
  id: string
  label: string
  detail: string | null
}

export interface Estimate {
  ok: true
  design: Design
  offered: OfferedConfiguration | null
  lines: EstimateLine[]
  includedDecorations: IncludedDecoration[]
  basePence: number
  optionUpgradesPence: number
  decorationsPence: number
  extrasPence: number
  /** null until a size is chosen. */
  totalPence: number | null
  /** Things the customer still needs to do before sending an enquiry. */
  incomplete: Issue[]
}

export interface EstimateFailure {
  ok: false
  errors: Issue[]
}

export type EstimateResult = Estimate | EstimateFailure

const KIND_LABEL: Record<OptionKind, string> = { flavour: 'flavour', filling: 'filling', frosting: 'frosting' }
const NAME_MAX = 40

export function decorationLabel(r: { decoration: { name: string; customerLabel: string | null } }): string {
  return r.decoration.customerLabel ?? r.decoration.name
}

/**
 * The single pricing engine.
 *
 * estimated total = configuration base price
 *                 + paid flavour / filling / frosting upgrades
 *                 + chargeable optional decorations (after upgrade replacement)
 *                 + extras × quantity
 *
 * Every price comes from the validated catalogue; the selection holds IDs
 * only. Anything that can't be priced exactly is an error, not a guess.
 */
export function estimate(catalogue: Catalogue, selection: Selection): EstimateResult {
  const { settings } = catalogue
  if (!settings.builderEnabled || settings.maintenanceNotice) {
    return fail('builderUnavailable', settings.maintenanceNotice ?? 'The cake builder is currently unavailable.')
  }

  const design = catalogue.designs.find((d) => d.slug === selection.designSlug)
  if (!design) return fail('designNotFound', 'This cake design is not currently available.')
  if (!design.acceptingEnquiries) {
    return fail('designPaused', `${design.name} is not taking enquiries at the moment.`)
  }

  const resolved = resolveDesign(catalogue, design)
  const empty: Estimate = {
    ok: true,
    design,
    offered: null,
    lines: [],
    includedDecorations: [],
    basePence: 0,
    optionUpgradesPence: 0,
    decorationsPence: 0,
    extrasPence: 0,
    totalPence: null,
    incomplete: [],
  }

  if (!selection.configurationId) {
    return { ...empty, incomplete: [{ code: 'chooseSize', message: 'Choose a size to see your estimate.', field: 'size' }] }
  }

  const offered = resolved.configurations.find((c) => c.configuration.id === selection.configurationId)
  if (!offered || !offered.available || offered.basePricePence === null) {
    return fail('sizeUnavailable', 'That size is not available for this design. Please choose another size.', 'size')
  }
  const configId = offered.configuration.id

  const errors: Issue[] = []
  const incomplete: Issue[] = []
  const lines: EstimateLine[] = [
    {
      kind: 'base',
      id: configId,
      label: `${design.name} — ${offered.configuration.label}`,
      detail: null,
      quantity: 1,
      unitPence: offered.basePricePence,
      totalPence: offered.basePricePence,
    },
  ]

  // Flavours, fillings, frostings
  let optionUpgradesPence = 0
  for (const kind of OPTION_KINDS) {
    const group = resolved.groups[kind]
    const available = new Map(choicesFor(group, configId).map((c) => [c.option.id, c]))
    const chosen = unique(selection.options[kind] ?? [])
    if (chosen.length > group.maxSelections) {
      errors.push({
        code: 'tooManyOptions',
        message: `Please choose no more than ${group.maxSelections} ${KIND_LABEL[kind]}${group.maxSelections > 1 ? 's' : ''}.`,
        field: kind,
      })
    }
    for (const id of chosen) {
      const choice = available.get(id)
      if (!choice) {
        errors.push({
          code: 'optionUnavailable',
          message: `A selected ${KIND_LABEL[kind]} is not available for this size. Please choose again.`,
          field: kind,
        })
        continue
      }
      optionUpgradesPence += choice.pricePence
      lines.push({
        kind,
        id,
        label: choice.option.name,
        detail: null,
        quantity: 1,
        unitPence: choice.pricePence,
        totalPence: choice.pricePence,
      })
    }
    if (group.required && chosen.length === 0) {
      incomplete.push({ code: 'optionRequired', message: `Choose a ${KIND_LABEL[kind]}.`, field: kind })
    }
  }

  // Decorations
  const { included, optional } = decorationsFor(resolved, configId)
  const includedById = new Map(included.map((r) => [r.decoration.id, r]))
  const optionalById = new Map(optional.map((r) => [r.decoration.id, r]))
  const effective = new Map<string, ResolvedDecoration>(includedById)
  const replaced = new Map<string, string>() // included id → upgrade id
  let decorationsPence = 0

  for (const id of unique(selection.decorationIds)) {
    // Selecting something already included never adds a charge.
    if (includedById.has(id)) continue
    const r = optionalById.get(id)
    if (!r) {
      errors.push({
        code: 'decorationUnavailable',
        message: 'A selected decoration is not available for this design and size. Please choose again.',
        field: 'decorations',
      })
      continue
    }
    const upgradeOf = r.decoration.upgradeOfId
    if (upgradeOf) {
      if (replaced.has(upgradeOf)) {
        errors.push({
          code: 'decorationsIncompatible',
          message: `Only one upgrade can be chosen for ${decorationLabel(includedById.get(upgradeOf)!)}.`,
          field: 'decorations',
        })
        continue
      }
      replaced.set(upgradeOf, id)
      effective.delete(upgradeOf)
    }
    effective.set(id, r)
    decorationsPence += r.pricePence
    lines.push({
      kind: 'decoration',
      id,
      label: decorationLabel(r),
      detail: upgradeOf ? `Upgrade from ${decorationLabel(includedById.get(upgradeOf)!)}` : null,
      quantity: 1,
      unitPence: r.pricePence,
      totalPence: r.pricePence,
    })
  }

  const effectiveList = [...effective.values()]
  for (let i = 0; i < effectiveList.length; i++) {
    for (let j = i + 1; j < effectiveList.length; j++) {
      const a = effectiveList[i]!.decoration
      const b = effectiveList[j]!.decoration
      if (a.incompatibleWithIds.includes(b.id) || b.incompatibleWithIds.includes(a.id)) {
        errors.push({
          code: 'decorationsIncompatible',
          message: `${decorationLabel(effectiveList[i]!)} can't be combined with ${decorationLabel(effectiveList[j]!)}.`,
          field: 'decorations',
        })
      }
    }
  }

  // Personalisation for every decoration that will be on the cake
  const personalisationDetail = new Map<string, string>()
  for (const r of effectiveList) {
    const p = r.decoration.personalisation
    if (!p.name && !p.age) continue
    const given = selection.personalisation[r.decoration.id] ?? {}
    const parts: string[] = []
    const label = decorationLabel(r)
    if (p.name) {
      const name = (given.name ?? '').trim()
      if (!name) {
        incomplete.push({ code: 'personalisationMissing', message: `Enter the name for ${label}.`, field: `personalisation.${r.decoration.id}.name` })
      } else if (name.length > NAME_MAX) {
        errors.push({ code: 'personalisationInvalid', message: `The name for ${label} must be ${NAME_MAX} characters or fewer.`, field: `personalisation.${r.decoration.id}.name` })
      } else parts.push(`Name: "${name}"`)
    }
    if (p.age) {
      const age = (given.age ?? '').trim()
      if (!age) {
        incomplete.push({ code: 'personalisationMissing', message: `Enter the age for ${label}.`, field: `personalisation.${r.decoration.id}.age` })
      } else if (!/^\d{1,3}$/.test(age) || Number(age) < 1 || Number(age) > 120) {
        errors.push({ code: 'personalisationInvalid', message: `The age for ${label} must be a whole number.`, field: `personalisation.${r.decoration.id}.age` })
      } else parts.push(`Age: ${Number(age)}`)
    }
    if (parts.length) personalisationDetail.set(r.decoration.id, parts.join(', '))
  }
  for (const line of lines) {
    if (line.kind !== 'decoration') continue
    const detail = personalisationDetail.get(line.id)
    if (detail) line.detail = line.detail ? `${line.detail} · ${detail}` : detail
  }

  const includedDecorations: IncludedDecoration[] = included
    .filter((r) => !replaced.has(r.decoration.id))
    .map((r) => ({ id: r.decoration.id, label: decorationLabel(r), detail: personalisationDetail.get(r.decoration.id) ?? null }))

  // Extras
  const extras = new Map(extrasFor(resolved.extras, configId).map((e) => [e.extra.id, e]))
  let extrasPence = 0
  for (const [id, rawQty] of Object.entries(selection.extras)) {
    if (!rawQty) continue
    const e = extras.get(id)
    if (!e) {
      errors.push({ code: 'extraUnavailable', message: 'A selected extra is not available for this design and size.', field: 'extras' })
      continue
    }
    const range = e.extra.quantity ?? { min: 1, max: 1 }
    if (!Number.isInteger(rawQty) || rawQty < range.min || rawQty > range.max) {
      errors.push({
        code: 'extraQuantityInvalid',
        message: `Please choose between ${range.min} and ${range.max} of ${e.extra.name}.`,
        field: 'extras',
      })
      continue
    }
    const total = e.pricePence * rawQty
    extrasPence += total
    lines.push({ kind: 'extra', id, label: e.extra.name, detail: null, quantity: rawQty, unitPence: e.pricePence, totalPence: total })
  }

  if (errors.length) return { ok: false, errors }

  const basePence = offered.basePricePence
  return {
    ok: true,
    design,
    offered,
    lines,
    includedDecorations,
    basePence,
    optionUpgradesPence,
    decorationsPence,
    extrasPence,
    totalPence: basePence + optionUpgradesPence + decorationsPence + extrasPence,
    incomplete,
  }
}

/** A ready-to-send estimate: priced and with nothing left to fill in. */
export function isComplete(result: EstimateResult): result is Estimate & { totalPence: number; offered: OfferedConfiguration } {
  return result.ok && result.totalPence !== null && result.offered !== null && result.incomplete.length === 0
}

export function describeLine(line: EstimateLine): string {
  const qty = line.quantity > 1 ? ` × ${line.quantity}` : ''
  return `${line.label}${qty}: ${line.totalPence === 0 ? 'Included' : formatPence(line.totalPence)}`
}

function unique(ids: string[]): string[] {
  return [...new Set(ids)]
}

function fail(code: Issue['code'], message: string, field?: string): EstimateFailure {
  return { ok: false, errors: [{ code, message, field }] }
}
