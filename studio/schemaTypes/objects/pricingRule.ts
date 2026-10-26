import { defineField, defineType } from 'sanity'
import { checkPricing, describePricing, type PricingValue } from '../../lib/rules'

/**
 * How something is priced. All prices are stored in PENCE (whole numbers):
 * £8 = 800, £15.50 = 1550.
 */
export default defineType({
  name: 'cakePricingRule',
  title: 'Pricing',
  type: 'object',
  fields: [
    defineField({
      name: 'mode',
      title: 'How is this priced?',
      type: 'string',
      options: {
        list: [
          { title: 'Included — no extra charge', value: 'included' },
          { title: 'Fixed price', value: 'fixed' },
          { title: 'Price depends on the cake size', value: 'bySize' },
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'amountPence',
      title: 'Price (pence)',
      description: 'Whole number of pence, e.g. 800 = £8.00, 1550 = £15.50.',
      type: 'number',
      hidden: ({ parent }) => parent?.mode !== 'fixed',
    }),
    defineField({
      name: 'bySize',
      title: 'Price for each size',
      description: 'Sizes not listed here cannot be chosen with this item.',
      type: 'array',
      hidden: ({ parent }) => parent?.mode !== 'bySize',
      of: [
        {
          type: 'object',
          name: 'sizePrice',
          fields: [
            defineField({ name: 'configuration', title: 'Size', type: 'reference', to: [{ type: 'cakeConfiguration' }] }),
            defineField({ name: 'amountPence', title: 'Price (pence)', type: 'number' }),
          ],
          preview: {
            select: { title: 'configuration.label', amount: 'amountPence' },
            prepare: ({ title, amount }) => ({
              title: title ?? 'Choose a size',
              subtitle: describePricing({ mode: 'fixed', amountPence: amount }),
            }),
          },
        },
      ],
    }),
  ],
  validation: (Rule) => Rule.custom((value) => checkPricing(value as PricingValue | undefined, true)),
  preview: {
    select: { mode: 'mode', amountPence: 'amountPence', bySize: 'bySize' },
    prepare: (value) => ({ title: describePricing(value as PricingValue) }),
  },
})

/** A required pricing field. */
export const pricingField = (overrides: Record<string, unknown> = {}) =>
  defineField({
    name: 'pricing',
    title: 'Price',
    type: 'cakePricingRule',
    validation: (Rule) => Rule.custom((value) => checkPricing(value as PricingValue | undefined)),
    ...overrides,
  })

/** An optional price override used on a design. */
export const priceOverrideField = (description: string) =>
  defineField({
    name: 'priceOverride',
    title: 'Price for this design only (optional)',
    description,
    type: 'cakePricingRule',
  })
