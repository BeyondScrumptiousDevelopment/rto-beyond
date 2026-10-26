import { defineField, defineType } from 'sanity'

/**
 * A product photograph with optional structural labels and a note of any
 * elements shown that aren't included in the standard price.
 */
export default defineType({
  name: 'cakeImage',
  title: 'Photograph',
  type: 'object',
  fields: [
    defineField({
      name: 'image',
      title: 'Photo',
      type: 'image',
      options: { hotspot: true },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'alt',
      title: 'Alternative text',
      description: 'Describe the photo for customers using screen readers, e.g. "Two-layer 6-inch cake with gold drip, side view".',
      type: 'string',
      validation: (Rule) => Rule.required().warning('Alternative text helps customers using screen readers.'),
    }),
    defineField({ name: 'caption', title: 'Caption (optional)', type: 'string' }),
    defineField({
      name: 'view',
      title: 'What does this photo show?',
      type: 'string',
      initialValue: 'main',
      options: {
        list: [
          { title: 'Main / front view', value: 'main' },
          { title: 'Side view', value: 'side' },
          { title: 'Top view', value: 'top' },
          { title: 'Cross-section / layers', value: 'crossSection' },
          { title: 'Detail', value: 'detail' },
          { title: 'Other', value: 'other' },
        ],
      },
    }),
    defineField({
      name: 'labels',
      title: 'Labels (optional)',
      description:
        'Short facts that help customers understand the cake, e.g. "Two sponge layers". Use only where they genuinely help. "Beside" labels are listed under the photo; "On the photo" labels show a numbered marker at the position you set.',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'imageLabel',
          fields: [
            defineField({ name: 'text', title: 'Label text', type: 'string', validation: (Rule) => Rule.required().max(60) }),
            defineField({
              name: 'placement',
              title: 'Where to show it',
              type: 'string',
              initialValue: 'beside',
              options: {
                list: [
                  { title: 'Beside the photo', value: 'beside' },
                  { title: 'On the photo (numbered marker)', value: 'overlay' },
                ],
                layout: 'radio',
              },
            }),
            defineField({
              name: 'x',
              title: 'Marker position from the left (%)',
              type: 'number',
              hidden: ({ parent }) => parent?.placement !== 'overlay',
              validation: (Rule) => Rule.min(0).max(100),
            }),
            defineField({
              name: 'y',
              title: 'Marker position from the top (%)',
              type: 'number',
              hidden: ({ parent }) => parent?.placement !== 'overlay',
              validation: (Rule) => Rule.min(0).max(100),
            }),
          ],
          preview: { select: { title: 'text', subtitle: 'placement' } },
        },
      ],
    }),
    defineField({
      name: 'shownElements',
      title: 'Items shown that are NOT in the standard price',
      description:
        'If the photo shows a decoration that costs extra or was a one-off custom request, list it here so customers are not misled.',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'shownElement',
          fields: [
            defineField({ name: 'description', title: 'What is shown', type: 'string', validation: (Rule) => Rule.required() }),
            defineField({
              name: 'status',
              title: 'Status',
              type: 'string',
              validation: (Rule) => Rule.required(),
              options: {
                list: [
                  { title: 'Included in the standard price', value: 'included' },
                  { title: 'Available as a paid option', value: 'paidOption' },
                  { title: 'Example of a custom order (not available to order here)', value: 'customExample' },
                ],
                layout: 'radio',
              },
            }),
          ],
          preview: { select: { title: 'description', subtitle: 'status' } },
        },
      ],
    }),
  ],
  preview: {
    select: { title: 'caption', subtitle: 'view', media: 'image', alt: 'alt' },
    prepare: ({ title, subtitle, media, alt }) => ({ title: title || alt || 'Photo', subtitle, media }),
  },
})
