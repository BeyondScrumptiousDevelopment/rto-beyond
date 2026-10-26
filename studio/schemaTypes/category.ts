import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'cakeCategory',
  title: 'Category',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'name' }, validation: (Rule) => Rule.required() }),
    defineField({ name: 'description', title: 'Description', type: 'text', rows: 2 }),
    defineField({ name: 'image', title: 'Image (optional)', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'order', title: 'Display order', description: 'Lower numbers appear first.', type: 'number' }),
    defineField({ name: 'showOnWebsite', title: 'Show on website', type: 'boolean', initialValue: true }),
  ],
  orderings: [{ title: 'Display order', name: 'order', by: [{ field: 'order', direction: 'asc' }] }],
  preview: {
    select: { title: 'name', show: 'showOnWebsite', media: 'image' },
    prepare: ({ title, show, media }) => ({ title, subtitle: show === false ? 'Hidden' : undefined, media }),
  },
})
