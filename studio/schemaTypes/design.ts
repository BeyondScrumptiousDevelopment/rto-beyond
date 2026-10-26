import { defineField, defineType } from 'sanity'
import { checkUniqueRefs } from '../lib/rules'
import { priceOverrideField } from './objects/pricingRule'

/**
 * A ready-to-order cake design. Customers pick a design first, then
 * configure it with the sizes, options and decorations it offers.
 *
 * Sizes, flavours and standard decorations are inherited from the shared
 * libraries by default, so a design only needs to record its differences.
 */
export default defineType({
  name: 'cakeDesign',
  title: 'Cake Design',
  type: 'document',
  groups: [
    { name: 'basics', title: 'Basics', default: true },
    { name: 'photos', title: 'Photos' },
    { name: 'sizes', title: 'Sizes' },
    { name: 'options', title: 'Flavours & extras' },
    { name: 'decorations', title: 'Decorations' },
    { name: 'rules', title: 'Rules & info' },
  ],
  fields: [
    // Basics
    defineField({ name: 'name', title: 'Design name', type: 'string', group: 'basics', validation: (Rule) => Rule.required() }),
    defineField({ name: 'slug', title: 'Web address', description: 'Used in the page URL. Click "Generate".', type: 'slug', group: 'basics', options: { source: 'name' }, validation: (Rule) => Rule.required() }),
    defineField({
      name: 'reference',
      title: 'Design reference',
      description: 'Short code shown in enquiries so you can identify the design, e.g. "BS-DRIP-01".',
      type: 'string',
      group: 'basics',
      validation: (Rule) => Rule.required().max(30),
    }),
    defineField({ name: 'category', title: 'Category', type: 'reference', to: [{ type: 'cakeCategory' }], group: 'basics' }),
    defineField({ name: 'shortDescription', title: 'Short description', description: 'One or two sentences for the catalogue card.', type: 'text', rows: 2, group: 'basics', validation: (Rule) => Rule.required().max(200) }),
    defineField({ name: 'fullDescription', title: 'Full description', type: 'text', rows: 6, group: 'basics' }),
    defineField({ name: 'featured', title: 'Featured', description: 'Shown first in the catalogue.', type: 'boolean', initialValue: false, group: 'basics' }),
    defineField({ name: 'order', title: 'Display order', type: 'number', group: 'basics' }),
    defineField({ name: 'showOnWebsite', title: 'Show on website', type: 'boolean', initialValue: true, group: 'basics' }),

    // Photos
    defineField({ name: 'mainImage', title: 'Main photo', type: 'cakeImage', group: 'photos', validation: (Rule) => Rule.required().warning('Designs without a photo are hard for customers to judge.') }),
    defineField({
      name: 'gallery',
      title: 'More photos',
      description: 'Side, top, cross-section and detail photos help customers understand height, layers and structure.',
      type: 'array',
      group: 'photos',
      of: [{ type: 'cakeImage' }],
    }),
    defineField({
      name: 'structureNotes',
      title: 'Structure notes (optional)',
      description: 'Approved details about how this design is built, e.g. how the filling is layered.',
      type: 'text',
      rows: 3,
      group: 'photos',
    }),

    // Sizes
    defineField({
      name: 'useStandardConfigurations',
      title: 'Offer the standard size range',
      description: 'On: every size marked "Offer on every design" is available on this design.',
      type: 'boolean',
      initialValue: true,
      group: 'sizes',
    }),
    defineField({
      name: 'configurationOverrides',
      title: 'Size changes for this design',
      description: 'Only record differences: exclude a standard size, add a non-standard one, or change a price for this design.',
      type: 'array',
      group: 'sizes',
      validation: (Rule) => Rule.custom((rows) => checkUniqueRefs(rows as { configuration?: { _ref?: string } }[], (r) => r.configuration, 'size')),
      of: [
        {
          type: 'object',
          name: 'configurationOverride',
          fields: [
            defineField({ name: 'configuration', title: 'Size', type: 'reference', to: [{ type: 'cakeConfiguration' }], validation: (Rule) => Rule.required() }),
            defineField({
              name: 'action',
              title: 'Change',
              type: 'string',
              initialValue: 'offer',
              options: {
                list: [
                  { title: 'Offer this size', value: 'offer' },
                  { title: 'Do not offer this size', value: 'exclude' },
                ],
                layout: 'radio',
              },
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'basePriceOverridePence',
              title: 'Price for this design (pence, optional)',
              description: 'Leave empty to use the size\'s normal price.',
              type: 'number',
              hidden: ({ parent }) => parent?.action === 'exclude',
              validation: (Rule) => Rule.integer().positive(),
            }),
            defineField({ name: 'note', title: 'Note shown to customers (optional)', type: 'string', hidden: ({ parent }) => parent?.action === 'exclude' }),
          ],
          preview: {
            select: { title: 'configuration.label', action: 'action', price: 'basePriceOverridePence' },
            prepare: ({ title, action, price }) => ({
              title,
              subtitle: action === 'exclude' ? 'Not offered' : price ? `Offered at ${price}p on this design` : 'Offered',
            }),
          },
        },
      ],
    }),

    // Options
    defineField({ name: 'flavours', title: 'Sponge flavours', type: 'cakeFlavourGroup', group: 'options', initialValue: { includeAllActive: true, required: true, maxSelections: 1 } }),
    defineField({ name: 'fillings', title: 'Fillings', type: 'cakeFillingGroup', group: 'options', initialValue: { includeAllActive: true, required: true, maxSelections: 1 } }),
    defineField({ name: 'frostings', title: 'Frostings', type: 'cakeFrostingGroup', group: 'options', initialValue: { includeAllActive: true, required: true, maxSelections: 1 } }),
    defineField({
      name: 'extras',
      title: 'Extras offered',
      type: 'array',
      group: 'options',
      validation: (Rule) => Rule.custom((rows) => checkUniqueRefs(rows as { extra?: { _ref?: string } }[], (r) => r.extra, 'extra')),
      of: [
        {
          type: 'object',
          name: 'extraChoice',
          fields: [
            defineField({ name: 'extra', title: 'Extra', type: 'reference', to: [{ type: 'cakeExtra' }], validation: (Rule) => Rule.required() }),
            priceOverrideField("Leave empty to use the extra's normal price."),
          ],
          preview: { select: { title: 'extra.name', override: 'priceOverride.mode' }, prepare: ({ title, override }) => ({ title, subtitle: override ? 'Custom price on this design' : undefined }) },
        },
      ],
    }),

    // Decorations
    defineField({
      name: 'inheritStandardDecorations',
      title: 'Use the standard decorations',
      description: 'On: this design gets every decoration whose default rule applies to it (see the Decorations library). Turn off only if this design should start with none.',
      type: 'boolean',
      initialValue: true,
      group: 'decorations',
    }),
    defineField({
      name: 'decorationOverrides',
      title: 'Decoration changes for this design',
      description: 'Only record differences from the standard decorations: add one, remove one, include one in the price, or set a different price.',
      type: 'array',
      group: 'decorations',
      validation: (Rule) => Rule.custom((rows) => checkUniqueRefs(rows as { decoration?: { _ref?: string } }[], (r) => r.decoration, 'decoration')),
      of: [
        {
          type: 'object',
          name: 'decorationOverride',
          fields: [
            defineField({ name: 'decoration', title: 'Decoration', type: 'reference', to: [{ type: 'cakeDecoration' }], validation: (Rule) => Rule.required() }),
            defineField({
              name: 'action',
              title: 'On this design, this decoration is…',
              type: 'string',
              options: {
                list: [
                  { title: 'Included in the base price', value: 'include' },
                  { title: 'An optional paid add-on', value: 'optional' },
                  { title: 'Not available', value: 'exclude' },
                ],
                layout: 'radio',
              },
              validation: (Rule) => Rule.required(),
            }),
            { ...priceOverrideField("Leave empty to use the decoration's normal price."), hidden: ({ parent }: { parent?: { action?: string } }) => parent?.action !== 'optional' },
            defineField({
              name: 'restrictToConfigurations',
              title: 'Only on these sizes (optional)',
              type: 'array',
              of: [{ type: 'reference', to: [{ type: 'cakeConfiguration' }] }],
              hidden: ({ parent }) => parent?.action === 'exclude',
            }),
            defineField({ name: 'note', title: 'Note (optional)', description: 'e.g. why this design is different.', type: 'string' }),
          ],
          preview: {
            select: { title: 'decoration.name', action: 'action' },
            prepare: ({ title, action }) => ({
              title,
              subtitle: action === 'include' ? 'Included on this design' : action === 'optional' ? 'Optional add-on on this design' : 'Removed from this design',
            }),
          },
        },
      ],
    }),

    // Rules & info
    defineField({ name: 'acceptingEnquiries', title: 'Accepting enquiries', description: 'Off: customers can see the design but cannot send an enquiry.', type: 'boolean', initialValue: true, group: 'rules' }),
    defineField({
      name: 'leadTimeDaysOverride',
      title: 'Minimum notice for this design (days, optional)',
      description: 'Leave empty to use the default from Settings.',
      type: 'number',
      group: 'rules',
      validation: (Rule) => Rule.integer().min(0).max(365),
    }),
    defineField({ name: 'dietaryInfo', title: 'Dietary information', description: 'Approved wording only, e.g. "Eggless". Only mention vegan if confirmed for this design.', type: 'string', group: 'rules' }),
    defineField({ name: 'allergenInfo', title: 'Allergen information', description: 'Approved wording only.', type: 'text', rows: 3, group: 'rules' }),
    defineField({ name: 'showCustomCta', title: 'Show "Request a custom cake" link', type: 'boolean', initialValue: true, group: 'rules' }),
    defineField({ name: 'customPrompt', title: 'Custom request prompt (optional)', description: 'e.g. "Want a different character? Ask us for a custom quote."', type: 'string', group: 'rules' }),
  ],
  orderings: [{ title: 'Display order', name: 'order', by: [{ field: 'order', direction: 'asc' }] }],
  preview: {
    select: { title: 'name', reference: 'reference', show: 'showOnWebsite', accepting: 'acceptingEnquiries', media: 'mainImage.image' },
    prepare: ({ title, reference, show, accepting, media }) => ({
      title,
      subtitle: [reference, show === false ? 'Hidden' : null, accepting === false ? 'Not accepting enquiries' : null].filter(Boolean).join(' · '),
      media,
    }),
  },
})
