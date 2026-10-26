/**
 * Pure validation helpers used by the schema definitions. Kept free of
 * Sanity imports so they can be unit-tested (studio/test/rules.test.ts).
 * Each returns `true` when valid or a message for the editor.
 */
import { formatPence } from '@bs/core'

type Ref = { _ref?: string } | undefined | null

export interface PricingValue {
  mode?: 'included' | 'fixed' | 'bySize'
  amountPence?: number
  bySize?: { configuration?: Ref; amountPence?: number }[]
}

const isPence = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0

/** Validates a pricing rule. `optional` is for price overrides, which may be left empty. */
export function checkPricing(value: PricingValue | undefined, optional = false): true | string {
  if (!value || !value.mode) return optional ? true : 'Choose how this is priced.'
  if (value.mode === 'fixed' && !isPence(value.amountPence)) {
    return 'Enter the price in pence as a whole number (e.g. 800 for £8).'
  }
  if (value.mode === 'bySize') {
    const rows = value.bySize ?? []
    if (!rows.length) return 'Add a price for at least one size.'
    const seen = new Set<string>()
    for (const row of rows) {
      const id = row.configuration?._ref
      if (!id) return 'Every row needs a size.'
      if (seen.has(id)) return 'Each size can only be listed once.'
      seen.add(id)
      if (!isPence(row.amountPence)) return 'Every size needs a price in pence as a whole number.'
    }
  }
  return true
}

export function describePricing(value: PricingValue | undefined): string {
  if (!value?.mode) return 'No price set'
  if (value.mode === 'included') return 'Included (no charge)'
  if (value.mode === 'fixed') return isPence(value.amountPence) ? formatPence(value.amountPence) : 'Price missing'
  const n = value.bySize?.length ?? 0
  return `Priced by size (${n} size${n === 1 ? '' : 's'})`
}

/** Finds a reference that appears more than once in an array of rows. */
export function checkUniqueRefs<T>(rows: T[] | undefined, getRef: (row: T) => Ref, label: string): true | string {
  const seen = new Set<string>()
  for (const row of rows ?? []) {
    const id = getRef(row)?._ref
    if (!id) continue
    if (seen.has(id)) return `The same ${label} is listed more than once. Remove the duplicate.`
    seen.add(id)
  }
  return true
}

export function checkWhatsappNumber(value: string | undefined): true | string {
  if (!value) return 'Required.'
  const digits = value.replace(/[\s()+-]/g, '')
  if (!/^[1-9]\d{7,14}$/.test(digits)) {
    return 'Use international format without the leading 0, e.g. 447933903000 or +44 7933 903000.'
  }
  return true
}

export function checkPortions(value: { min?: number; max?: number } | undefined): true | string {
  if (!value || (value.min == null && value.max == null)) return true
  if (value.min == null || value.max == null) return 'Enter both the minimum and maximum, or leave both empty.'
  if (value.min > value.max) return 'The minimum must not be larger than the maximum.'
  return true
}
