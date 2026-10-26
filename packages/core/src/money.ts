import type { PricingRule } from './types'

const whole = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})
const fractional = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' })

/** 7000 → "£70", 850 → "£8.50". */
export function formatPence(pence: number): string {
  if (!Number.isInteger(pence)) throw new Error(`Money must be integer pence, got ${pence}`)
  return pence % 100 === 0 ? whole.format(pence / 100) : fractional.format(pence / 100)
}

/**
 * Price of a rule for a given configuration.
 * Returns null when the rule doesn't price that configuration (or is missing),
 * which callers must treat as "unavailable" — never as free.
 */
export function priceFor(rule: PricingRule | null, configurationId: string | null): number | null {
  if (!rule) return null
  switch (rule.mode) {
    case 'included':
      return 0
    case 'fixed':
      return rule.amountPence
    case 'bySize': {
      if (!configurationId) return null
      const amount = rule.bySize[configurationId]
      return amount === undefined ? null : amount
    }
  }
}

/** Lowest price a rule can take across the given configurations (for "from" labels). */
export function lowestPrice(rule: PricingRule | null, configurationIds: string[]): number | null {
  const prices = configurationIds.map((id) => priceFor(rule, id)).filter((p): p is number => p !== null)
  return prices.length ? Math.min(...prices) : null
}
