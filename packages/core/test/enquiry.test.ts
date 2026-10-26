import { describe, expect, it } from 'vitest'
import {
  buildCustomEnquiryMessage,
  buildEnquiryMessage,
  checkCustomerDetails,
  DEFAULT_DISCLAIMER,
  describeStructure,
  DISCLAIMER_HEADING,
  emptyCustomer,
  whatsappUrl,
  WHATSAPP_CTA,
  type CustomerDetails,
} from '../src/enquiry'
import { estimate, isComplete } from '../src/estimate'
import { findBannedPhrases } from '../src/wording'
import { TEST_WHATSAPP } from '../fixtures/testCatalogue'
import { catalogue, select } from './helpers'

const cat = catalogue()

const customer: CustomerDetails = {
  ...emptyCustomer(),
  name: 'Test Customer',
  phone: '07700 900000',
  occasion: 'Test birthday',
  collectionDate: '2026-11-07',
  collectionTime: '14:00',
  notes: 'Please write "Happy 5th" & add 🎉 — thanks #1',
}

function completeEstimate() {
  const r = estimate(
    cat,
    select('test-design-a', {
      configurationId: 'cfg-r6-3',
      flavour: ['flv-premium'],
      filling: ['fil-jam'],
      frosting: ['frs-butter'],
      decorationIds: ['dec-card-topper', 'dec-name-age'],
      personalisation: { 'dec-name-age': { name: 'Test', age: '5' } },
      extras: { 'ext-candles': 2 },
    }),
  )
  if (!isComplete(r)) throw new Error('fixture estimate should be complete')
  return r
}

describe('buildEnquiryMessage', () => {
  const message = buildEnquiryMessage({ catalogue: cat, estimate: completeEstimate(), customer })

  it('contains the customer details', () => {
    expect(message).toContain('Name: Test Customer')
    expect(message).toContain('Contact number: 07700 900000')
    expect(message).toContain('Occasion: Test birthday')
  })

  it('contains the design, reference, size and structure', () => {
    expect(message).toContain('*BEYOND SCRUMPTIOUS — CAKE ENQUIRY*')
    expect(message).toContain('Cake: Test Design A')
    expect(message).toContain('Design reference: TEST-A')
    expect(message).toContain('Size: 6-inch round, 3 layers')
    expect(message).toContain('Layers: 3 sponge layers (single tier)')
    expect(message).toContain('Approx. 10–12 dessert portions')
    expect(message).toContain('Approx. 15–18 coffee portions')
  })

  it('contains the selections, decorations and extras', () => {
    expect(message).toContain('Sponge flavour: Test Premium (+£5)')
    expect(message).toContain('Filling: Test Jam')
    expect(message).toContain('Frosting: Test Buttercream')
    expect(message).toContain('Included decorations: Test Balls')
    expect(message).toContain('• Test Card Topper — £8')
    expect(message).toContain('• Test Name and Age (Name: "Test", Age: 5) — £9')
    expect(message).toContain('• Test Candles × 2 — £4')
  })

  it('contains the collection request, marked as not confirmed', () => {
    expect(message).toContain('Requested date: Saturday 7 November 2026')
    expect(message).toContain('Requested time: 14:00')
    expect(message).toContain('(Requested only — not yet confirmed or reserved)')
  })

  it('contains the itemised estimate with the correct total', () => {
    // 1000 base + 500 flavour + 800 + 900 decorations + 400 extras
    expect(message).toContain('Base price (6-inch round, 3 layers): £10')
    expect(message).toContain('Paid upgrades: £5')
    expect(message).toContain('Additional decorations: £17')
    expect(message).toContain('Extras: £4')
    expect(message).toContain('*Estimated total: £36*')
  })

  it('contains customer notes and the mandatory disclaimer', () => {
    expect(message).toContain('Please write "Happy 5th" & add 🎉 — thanks #1')
    expect(message).toContain(DISCLAIMER_HEADING)
    expect(message).toContain(DEFAULT_DISCLAIMER)
    expect(message).toContain('Catalogue prices as of 2026-10-26')
  })

  it('never claims the order is confirmed', () => {
    expect(findBannedPhrases(message)).toEqual([])
  })

  it('labels custom requests as not priced', () => {
    const custom = buildEnquiryMessage({
      catalogue: cat,
      estimate: completeEstimate(),
      customer: { ...customer, customRequest: true, notes: 'A test character topper' },
    })
    expect(custom).toContain('*CUSTOM REQUEST — NOT INCLUDED IN ESTIMATE*')
    expect(custom).toContain('(Ready-to-order items only — the custom request below is not included)')
    expect(custom).toContain('A test character topper')
    expect(custom).toContain('*Estimated total: £36*')
  })

  it('builds a custom enquiry message with the reference design', () => {
    const m = buildCustomEnquiryMessage(cat, 'Test Design A', 'TEST-A')
    expect(m).toContain('Reference design: Test Design A (TEST-A)')
    expect(m).toContain(DISCLAIMER_HEADING)
    expect(m).not.toMatch(/£/)
  })
})

describe('whatsappUrl', () => {
  it('uses the configured destination number', () => {
    expect(whatsappUrl(cat.settings.whatsappNumber, 'hi')).toBe(`https://wa.me/${TEST_WHATSAPP}?text=hi`)
  })

  it('URL-encodes the whole message so it round-trips exactly', () => {
    const message = buildEnquiryMessage({ catalogue: cat, estimate: completeEstimate(), customer })
    const url = new URL(whatsappUrl(cat.settings.whatsappNumber, message))
    expect(url.origin + url.pathname).toBe(`https://wa.me/${TEST_WHATSAPP}`)
    expect([...url.searchParams.keys()]).toEqual(['text'])
    expect(url.searchParams.get('text')).toBe(message)
    expect(url.search).not.toMatch(/[ \n#]/)
  })

  it('refuses an invalid number', () => {
    expect(() => whatsappUrl('0', 'hi')).toThrow()
  })
})

describe('checkCustomerDetails', () => {
  it('requires a name and a valid phone number', () => {
    expect(checkCustomerDetails(emptyCustomer()).map((i) => i.field)).toEqual(['name', 'phone'])
    expect(checkCustomerDetails({ ...customer, phone: 'call me' }).map((i) => i.field)).toEqual(['phone'])
    expect(checkCustomerDetails(customer)).toEqual([])
  })

  it('requires a description for a custom request', () => {
    expect(checkCustomerDetails({ ...customer, notes: '', customRequest: true }).map((i) => i.field)).toEqual(['notes'])
  })
})

describe('wording', () => {
  it('the CTA and disclaimer use enquiry language', () => {
    expect(WHATSAPP_CTA).toBe('Send Cake Enquiry via WhatsApp')
    expect(findBannedPhrases(WHATSAPP_CTA)).toEqual([])
    expect(findBannedPhrases(`${DISCLAIMER_HEADING} ${DEFAULT_DISCLAIMER}`)).toEqual([])
  })

  it('detects misleading order language', () => {
    expect(findBannedPhrases('Confirm Order')).toEqual(['confirm order'])
    expect(findBannedPhrases('Pay now to Book My Cake')).toEqual(['book my cake', 'pay now'])
  })
})

describe('describeStructure', () => {
  it('keeps tiers and sponge layers distinct', () => {
    const single = cat.configurations.find((c) => c.id === 'cfg-r6-3')!
    const tiered = cat.configurations.find((c) => c.id === 'cfg-tiered')!
    expect(describeStructure(single)).toEqual(['6-inch Round', 'Single tier', '3 sponge layers'])
    expect(describeStructure(tiered)).toEqual(['8-inch Round', '2 tiers', '2 sponge layers per tier', 'Approx. 9-inch finished height'])
  })
})
