/**
 * Phrases that would suggest an order is placed, confirmed or paid for.
 * The builder only sends enquiries, so none of these may appear in the UI
 * (checked by unit and end-to-end tests). The disclaimer's own
 * "does not confirm your order" is the one permitted use and is stripped
 * before checking.
 */
export const BANNED_PHRASES = [
  'confirm order',
  'confirm your order',
  'place order',
  'place your order',
  'book my cake',
  'book your cake',
  'complete purchase',
  'pay now',
  'checkout',
  'order confirmed',
  'order placed',
  'order has been',
  'booking confirmed',
  'add to basket',
  'add to cart',
]

const ALLOWED = [/does not confirm your order/gi, /only be confirmed once/gi]

export function findBannedPhrases(text: string): string[] {
  let t = text.toLowerCase().replace(/\s+/g, ' ')
  for (const a of ALLOWED) t = t.replace(a, '')
  return BANNED_PHRASES.filter((p) => t.includes(p))
}
