import { defineField, defineType } from 'sanity'
import { checkPortions } from '../../lib/rules'

export default defineType({
  name: 'cakePortions',
  title: 'Portions',
  type: 'object',
  options: { columns: 2 },
  fields: [
    defineField({ name: 'min', title: 'From', type: 'number', validation: (Rule) => Rule.integer().positive() }),
    defineField({ name: 'max', title: 'To', type: 'number', validation: (Rule) => Rule.integer().positive() }),
  ],
  validation: (Rule) => Rule.custom((value) => checkPortions(value as { min?: number; max?: number })),
})
