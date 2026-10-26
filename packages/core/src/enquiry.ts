import { formatDate } from './dates'
import { formatPence } from './money'
import type { Estimate, EstimateLine } from './estimate'
import type { OfferedConfiguration } from './resolve'
import type { Catalogue, Configuration } from './types'

/**
 * The mandatory enquiry-only disclaimer (spec §12.1). The wording shown to
 * customers comes from Sanity settings; this constant is the seed value and
 * the wording tests check for.
 */
export const DISCLAIMER_HEADING = 'IMPORTANT: THIS DOES NOT CONFIRM YOUR ORDER.'
export const DEFAULT_DISCLAIMER =
  'Submitting this enquiry sends your selected cake details to Beyond Scrumptious for review. It does not confirm your order, reserve your collection date or guarantee availability. Your order will only be confirmed once Beyond Scrumptious has reviewed your enquiry and explicitly confirmed the final details, price and booking arrangements.'

export const WHATSAPP_CTA = 'Send Cake Enquiry via WhatsApp'

export interface CustomerDetails {
  name: string
  phone: string
  occasion: string
  collectionDate: string
  collectionTime: string
  notes: string
  /** Customer says the request includes something not in the catalogue. */
  customRequest: boolean
}

export const emptyCustomer = (): CustomerDetails => ({
  name: '',
  phone: '',
  occasion: '',
  collectionDate: '',
  collectionTime: '',
  notes: '',
  customRequest: false,
})

export interface DetailsIssue {
  field: keyof CustomerDetails
  message: string
}

const PHONE = /^\+?[\d\s()-]{7,20}$/

export function checkCustomerDetails(c: CustomerDetails): DetailsIssue[] {
  const issues: DetailsIssue[] = []
  if (!c.name.trim()) issues.push({ field: 'name', message: 'Enter your name.' })
  else if (c.name.trim().length > 80) issues.push({ field: 'name', message: 'Name must be 80 characters or fewer.' })
  if (!c.phone.trim()) issues.push({ field: 'phone', message: 'Enter a contact number.' })
  else if (!PHONE.test(c.phone.trim()) || c.phone.replace(/\D/g, '').length < 7) {
    issues.push({ field: 'phone', message: 'Enter a valid phone number.' })
  }
  if (c.occasion.length > 80) issues.push({ field: 'occasion', message: 'Occasion must be 80 characters or fewer.' })
  if (c.notes.length > 1000) issues.push({ field: 'notes', message: 'Notes must be 1000 characters or fewer.' })
  if (c.customRequest && !c.notes.trim()) {
    issues.push({ field: 'notes', message: 'Describe the custom request so Beyond Scrumptious can quote for it.' })
  }
  return issues
}

/** Human-readable structure summary — keeps tiers and sponge layers distinct. */
export function describeStructure(c: Configuration): string[] {
  const parts: string[] = []
  const size = [c.sizeInches ? `${c.sizeInches}-inch` : null, c.shape].filter(Boolean).join(' ')
  if (size) parts.push(size)
  parts.push(c.tierCount === 1 ? 'Single tier' : `${c.tierCount} tiers`)
  parts.push(`${c.spongeLayers} sponge layer${c.spongeLayers === 1 ? '' : 's'}${c.tierCount > 1 ? ' per tier' : ''}`)
  if (c.approxHeightInches) parts.push(`Approx. ${c.approxHeightInches}-inch finished height`)
  return parts
}

export function describePortions(c: Configuration): string[] {
  const parts: string[] = []
  if (c.dessertPortions) parts.push(`Approx. ${c.dessertPortions.min}–${c.dessertPortions.max} dessert portions`)
  if (c.coffeePortions) parts.push(`Approx. ${c.coffeePortions.min}–${c.coffeePortions.max} coffee portions`)
  return parts
}

function lineText(line: EstimateLine): string {
  const qty = line.quantity > 1 ? ` × ${line.quantity}` : ''
  const price = line.totalPence === 0 ? 'Included' : formatPence(line.totalPence)
  return `• ${line.label}${qty}${line.detail ? ` (${line.detail})` : ''} — ${price}`
}

export interface EnquiryInput {
  catalogue: Catalogue
  estimate: Estimate & { totalPence: number; offered: OfferedConfiguration }
  customer: CustomerDetails
}

/**
 * Plain-text WhatsApp message. Uses only characters WhatsApp renders well;
 * *bold* is WhatsApp's own markup.
 */
export function buildEnquiryMessage({ catalogue, estimate, customer }: EnquiryInput): string {
  const { design, offered } = estimate
  const c = offered.configuration
  const out: string[] = []
  const add = (...l: string[]) => out.push(...l)

  add('*BEYOND SCRUMPTIOUS — CAKE ENQUIRY*', '')

  add('*Customer details*')
  add(`Name: ${customer.name.trim()}`)
  add(`Contact number: ${customer.phone.trim()}`)
  add(`Occasion: ${customer.occasion.trim() || 'Not specified'}`, '')

  add('*Selected design*')
  add(`Cake: ${design.name}`)
  add(`Design reference: ${design.reference}`)
  add(`Size: ${c.label}`)
  add(`Layers: ${c.spongeLayers} sponge layer${c.spongeLayers === 1 ? '' : 's'}${c.tierCount > 1 ? ` per tier, ${c.tierCount} tiers` : ' (single tier)'}`)
  if (c.approxHeightInches) add(`Approx. finished height: ${c.approxHeightInches} inches`)
  for (const p of describePortions(c)) add(p)
  add('')

  add('*Selections*')
  const ofKind = (kind: EstimateLine['kind']) => estimate.lines.filter((l) => l.kind === kind)
  const names = (kind: EstimateLine['kind']) =>
    ofKind(kind)
      .map((l) => (l.totalPence ? `${l.label} (+${formatPence(l.totalPence)})` : l.label))
      .join(', ') || 'None'
  add(`Sponge flavour: ${names('flavour')}`)
  add(`Filling: ${names('filling')}`)
  add(`Frosting: ${names('frosting')}`)
  const included = estimate.includedDecorations.map((d) => (d.detail ? `${d.label} (${d.detail})` : d.label))
  add(`Included decorations: ${included.join(', ') || 'None'}`)
  const decorations = ofKind('decoration')
  add(`Additional decorations: ${decorations.length ? '' : 'None'}`)
  for (const l of decorations) add(lineText(l))
  const extras = ofKind('extra')
  add(`Extras: ${extras.length ? '' : 'None'}`)
  for (const l of extras) add(lineText(l))
  add('')

  add('*Collection request*')
  add(`Requested date: ${formatDate(customer.collectionDate)}`)
  add(`Requested time: ${customer.collectionTime || 'Not specified'}`)
  add('(Requested only — not yet confirmed or reserved)', '')

  add('*Estimated price*')
  add(`Base price (${c.label}): ${formatPence(estimate.basePence)}`)
  add(`Paid upgrades: ${formatPence(estimate.optionUpgradesPence)}`)
  add(`Additional decorations: ${formatPence(estimate.decorationsPence)}`)
  add(`Extras: ${formatPence(estimate.extrasPence)}`)
  add(`*Estimated total: ${formatPence(estimate.totalPence)}*`)
  if (customer.customRequest) add('(Ready-to-order items only — the custom request below is not included)')
  add('')

  if (customer.customRequest) {
    add('*CUSTOM REQUEST — NOT INCLUDED IN ESTIMATE*')
    add('(To be reviewed and quoted by Beyond Scrumptious)')
  } else {
    add('*Additional notes*')
  }
  add(customer.notes.trim() || 'None', '')

  add(`Catalogue prices as of ${catalogue.fetchedAt.slice(0, 10)}`, '')
  add(DISCLAIMER_HEADING)
  add(catalogue.settings.quotationDisclaimer)

  return out.join('\n')
}

/** Message for customers who want something outside the catalogue. */
export function buildCustomEnquiryMessage(catalogue: Catalogue, designName: string | null, reference: string | null): string {
  const lines = ['*BEYOND SCRUMPTIOUS — CUSTOM CAKE ENQUIRY*', '']
  lines.push("Hello, I'd like to ask about a custom cake.")
  if (designName) lines.push(`Reference design: ${designName}${reference ? ` (${reference})` : ''}`)
  lines.push('', 'What I have in mind:', '', 'Requested collection date:', '')
  lines.push(DISCLAIMER_HEADING, catalogue.settings.quotationDisclaimer)
  return lines.join('\n')
}

export function whatsappUrl(number: string, message: string): string {
  const digits = number.replace(/\D/g, '')
  if (!/^[1-9]\d{7,14}$/.test(digits)) throw new Error('Invalid WhatsApp number')
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}
