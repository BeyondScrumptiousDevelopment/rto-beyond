import { defineField, defineType } from 'sanity'
import { formatPence } from '@bs/core'

/**
 * A size/structure customers can choose, e.g. "6-inch round, 3 layers".
 * Tiers and sponge layers are separate fields: a single-tier cake can have
 * several sponge layers.
 */
export default defineType({
  name: 'cakeConfiguration',
  title: 'Size & Layers',
  type: 'document',
  fields: [
    defineField({
      name: 'label',
      title: 'Name shown to customers',
      description: 'e.g. "6-inch round, 3 layers"',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'shape',
      title: 'Shape',
      type: 'string',
      options: { list: ['Round', 'Square'] },
    }),
    defineField({ name: 'sizeInches', title: 'Size (inches)', type: 'number', validation: (Rule) => Rule.positive() }),
    defineField({
      name: 'tierCount',
      title: 'Number of tiers',
      description: 'Stacked cakes. Most cakes are a single tier.',
      type: 'number',
      initialValue: 1,
      validation: (Rule) => Rule.required().integer().min(1),
    }),
    defineField({
      name: 'spongeLayers',
      title: 'Sponge layers (per tier)',
      type: 'number',
      validation: (Rule) => Rule.required().integer().min(1),
    }),
    defineField({
      name: 'approxHeightInches',
      title: 'Approx. finished height (inches, optional)',
      description: 'Only fill in if approved — leave empty rather than guessing.',
      type: 'number',
      validation: (Rule) => Rule.positive(),
    }),
    defineField({ name: 'dessertPortions', title: 'Approx. dessert portions', type: 'cakePortions' }),
    defineField({ name: 'coffeePortions', title: 'Approx. coffee portions', type: 'cakePortions' }),
    defineField({
      name: 'basePricePence',
      title: 'Base price (pence)',
      description: 'Whole number of pence, e.g. 7000 = £70. Leave empty if this size is not priced yet — it will not be offered.',
      type: 'number',
      validation: (Rule) =>
        Rule.integer().positive().custom((value, context) => {
          const active = (context.document as { active?: boolean } | undefined)?.active
          return active && value == null ? 'An active size needs a price.' : true
        }),
    }),
    defineField({
      name: 'offeredByDefault',
      title: 'Offer on every design',
      description: 'On: every design that uses the standard size range offers this size. Designs can still exclude it.',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({ name: 'active', title: 'Active', description: 'Off: not offered anywhere.', type: 'boolean', initialValue: true }),
    defineField({ name: 'order', title: 'Display order', type: 'number' }),
  ],
  orderings: [{ title: 'Display order', name: 'order', by: [{ field: 'order', direction: 'asc' }] }],
  preview: {
    select: { title: 'label', price: 'basePricePence', active: 'active', standard: 'offeredByDefault' },
    prepare: ({ title, price, active, standard }) => ({
      title,
      subtitle: [
        typeof price === 'number' && Number.isInteger(price) ? formatPence(price) : 'No price',
        active === false ? 'Inactive' : null,
        standard === false ? 'Not offered by default' : null,
      ]
        .filter(Boolean)
        .join(' · '),
    }),
  },
})
