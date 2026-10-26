import { defineField, defineType } from 'sanity'
import { describePricing, type PricingValue } from '../lib/rules'
import { pricingField } from './objects/pricingRule'

/**
 * The central decoration library. Each decoration exists once; its price
 * and default rule apply to every design that inherits it. Designs only
 * record differences (see "Decorations on this design" on a design).
 */
export default defineType({
  name: 'cakeDecoration',
  title: 'Decoration',
  type: 'document',
  groups: [
    { name: 'details', title: 'Details', default: true },
    { name: 'defaults', title: 'Default rule' },
    { name: 'limits', title: 'Limits' },
  ],
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string', group: 'details', validation: (Rule) => Rule.required() }),
    defineField({ name: 'customerLabel', title: 'Name shown to customers (optional)', description: 'Leave empty to use the name above.', type: 'string', group: 'details' }),
    defineField({ name: 'description', title: 'Description (optional)', type: 'text', rows: 2, group: 'details' }),
    defineField({ name: 'image', title: 'Reference image (optional)', type: 'image', options: { hotspot: true }, group: 'details' }),
    pricingField({
      group: 'details',
      description: 'The default price. When this decoration is included on a design, it is part of the base price and not charged.',
    }),
    defineField({
      name: 'requiresName',
      title: 'Customer must enter a name',
      type: 'boolean',
      group: 'details',
      initialValue: false,
    }),
    defineField({
      name: 'requiresAge',
      title: 'Customer must enter an age',
      type: 'boolean',
      group: 'details',
      initialValue: false,
    }),
    defineField({ name: 'notes', title: 'Internal notes (not shown to customers)', type: 'text', rows: 2, group: 'details' }),

    defineField({
      name: 'defaultAppliesTo',
      title: 'Which designs get this automatically?',
      type: 'string',
      group: 'defaults',
      initialValue: 'allDesigns',
      options: {
        list: [
          { title: 'All designs', value: 'allDesigns' },
          { title: 'Designs in particular categories', value: 'categories' },
          { title: 'None — only designs that add it themselves', value: 'none' },
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'defaultCategories',
      title: 'Categories',
      type: 'array',
      group: 'defaults',
      of: [{ type: 'reference', to: [{ type: 'cakeCategory' }] }],
      hidden: ({ parent }) => parent?.defaultAppliesTo !== 'categories',
    }),
    defineField({
      name: 'defaultStatus',
      title: 'On those designs, this decoration is…',
      type: 'string',
      group: 'defaults',
      initialValue: 'optional',
      hidden: ({ parent }) => parent?.defaultAppliesTo === 'none',
      options: {
        list: [
          { title: 'Included in the base price', value: 'included' },
          { title: 'An optional paid add-on', value: 'optional' },
        ],
        layout: 'radio',
      },
    }),

    defineField({
      name: 'restrictToConfigurations',
      title: 'Only available on these sizes (optional)',
      description: 'Leave empty for all sizes.',
      type: 'array',
      group: 'limits',
      of: [{ type: 'reference', to: [{ type: 'cakeConfiguration' }] }],
    }),
    defineField({
      name: 'incompatibleWith',
      title: "Can't be combined with",
      type: 'array',
      group: 'limits',
      of: [{ type: 'reference', to: [{ type: 'cakeDecoration' }] }],
    }),
    defineField({
      name: 'upgradeOf',
      title: 'This is an upgrade of… (optional)',
      description:
        'If set, choosing this replaces the included decoration you pick here, and the price above is the upgrade charge. It is only offered where that decoration is included.',
      type: 'reference',
      group: 'limits',
      to: [{ type: 'cakeDecoration' }],
    }),
    defineField({ name: 'active', title: 'Active', description: 'Off: removed from every design, whatever their settings.', type: 'boolean', initialValue: true, group: 'details' }),
    defineField({ name: 'order', title: 'Display order', type: 'number', group: 'details' }),
  ],
  orderings: [{ title: 'Display order', name: 'order', by: [{ field: 'order', direction: 'asc' }] }],
  preview: {
    select: { title: 'name', pricing: 'pricing', appliesTo: 'defaultAppliesTo', status: 'defaultStatus', active: 'active', media: 'image' },
    prepare: ({ title, pricing, appliesTo, status, active, media }) => {
      const scope =
        appliesTo === 'allDesigns' ? 'All designs' : appliesTo === 'categories' ? 'Some categories' : 'Not applied by default'
      const how = appliesTo === 'none' ? null : status === 'included' ? 'included' : 'optional add-on'
      return {
        title,
        subtitle: [active === false ? 'DISABLED' : null, describePricing(pricing as PricingValue), how ? `${scope}: ${how}` : scope]
          .filter(Boolean)
          .join(' · '),
        media,
      }
    },
  },
})
