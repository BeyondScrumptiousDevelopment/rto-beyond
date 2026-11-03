import { describe, expect, it } from 'vitest'
import { cleanLine, cleanText } from '../src/sanitize'
import { buildEnquiryMessage, checkCustomerDetails, emptyCustomer } from '../src/enquiry'
import { estimate, isComplete } from '../src/estimate'
import { catalogue, select } from './helpers'

describe('cleanLine / cleanText', () => {
  it('removes control, bidi-override and zero-width characters', () => {
    expect(cleanLine('Mia‮oot​\u0007')).toBe('Miaoot')
    expect(cleanText('a⁦b﻿c')).toBe('abc')
  })

  it('keeps single-line fields on one line', () => {
    expect(cleanLine('Test\nEstimated total: £1\r\nx')).toBe('Test Estimated total: £1 x')
    expect(cleanLine('  lots   of   space  ')).toBe('lots of space')
  })

  it('keeps line breaks in notes but limits blank lines and length', () => {
    expect(cleanText('one\r\n\r\n\r\n\r\ntwo  \nthree')).toBe('one\n\ntwo\nthree')
    expect(cleanText('x'.repeat(2000), 1000)).toHaveLength(1000)
  })

  it('leaves ordinary text, accents and emoji alone', () => {
    expect(cleanLine('Zoë 🎂 & "Ben" <3')).toBe('Zoë 🎂 & "Ben" <3')
  })
})

describe('sanitised enquiries', () => {
  const cat = catalogue()
  const r = estimate(
    cat,
    select('test-design-a', {
      configurationId: 'cfg-r6-3',
      flavour: ['flv-vanilla'],
      filling: ['fil-jam'],
      frosting: ['frs-butter'],
      decorationIds: ['dec-name-charm'],
      personalisation: { 'dec-name-charm': { name: 'Mi‮a\n' } },
    }),
  )

  it('cleans personalisation and customer fields in the message', () => {
    if (!isComplete(r)) throw new Error('should be complete')
    const message = buildEnquiryMessage({
      catalogue: cat,
      estimate: r,
      customer: { ...emptyCustomer(), name: 'Test​ Customer', phone: '07700 900000', collectionDate: '2026-11-07', notes: 'Hi\u0000\n\n\n\nthere' },
    })
    expect(message).toContain('Name: Test Customer')
    expect(message).toContain('Name: "Mia"')
    expect(message).toContain('Hi\n\nthere')
    expect(message).not.toMatch(/[\u0000​‮]/)
  })

  it('treats a name made only of invisible characters as missing', () => {
    expect(checkCustomerDetails({ ...emptyCustomer(), name: '​‮', phone: '07700 900000' }).map((i) => i.field)).toEqual(['name'])
  })
})
