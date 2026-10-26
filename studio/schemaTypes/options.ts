/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineField, defineType } from 'sanity'
import { describePricing, type PricingValue } from '../lib/rules'
import { pricingField } from './objects/pricingRule'

const commonFields = [
  defineField({ name: 'name', title: 'Name', type: 'string', validation: (Rule) => Rule.required() }),
  defineField({ name: 'description', title: 'Description (optional)', type: 'text', rows: 2 }),
  defineField({ name: 'image', title: 'Image (optional)', type: 'image', options: { hotspot: true } }),
  pricingField({ initialValue: { mode: 'included' } }),
  defineField({
    name: 'dietaryNotes',
    title: 'Dietary notes (optional)',
    description: 'Only approved information, e.g. "Vegan option available". Do not mark as vegan unless confirmed.',
    type: 'string',
  }),
  defineField({ name: 'active', title: 'Active', description: 'Off: hidden from every design.', type: 'boolean', initialValue: true }),
  defineField({ name: 'order', title: 'Display order', type: 'number' }),
]

const preview = {
  select: { title: 'name', pricing: 'pricing', active: 'active', media: 'image' },
  prepare: ({ title, pricing, active, media }: { title?: string; pricing?: PricingValue; active?: boolean; media?: any }) => ({
    title,
    subtitle: [describePricing(pricing), active === false ? 'Inactive' : null].filter(Boolean).join(' · '),
    media,
  }),
}

const orderings = [{ title: 'Display order', name: 'order', by: [{ field: 'order', direction: 'asc' as const }] }]

export const flavour = defineType({ name: 'cakeFlavour', title: 'Sponge Flavour', type: 'document', fields: commonFields, preview, orderings })
export const filling = defineType({ name: 'cakeFilling', title: 'Filling', type: 'document', fields: commonFields, preview, orderings })
export const frosting = defineType({ name: 'cakeFrosting', title: 'Frosting', type: 'document', fields: commonFields, preview, orderings })

export const extra = defineType({
  name: 'cakeExtra',
  title: 'Extra',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'description', title: 'Description (optional)', type: 'text', rows: 2 }),
    defineField({ name: 'image', title: 'Image (optional)', type: 'image', options: { hotspot: true } }),
    pricingField(),
    defineField({
      name: 'allowQuantity',
      title: 'Customer chooses a quantity',
      description: 'The price above is then per item.',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({ name: 'minQuantity', title: 'Minimum quantity', type: 'number', initialValue: 1, hidden: ({ parent }) => !parent?.allowQuantity, validation: (Rule) => Rule.integer().min(1) }),
    defineField({ name: 'maxQuantity', title: 'Maximum quantity', type: 'number', hidden: ({ parent }) => !parent?.allowQuantity, validation: (Rule) => Rule.integer().min(1) }),
    defineField({ name: 'active', title: 'Active', type: 'boolean', initialValue: true }),
    defineField({ name: 'order', title: 'Display order', type: 'number' }),
  ],
  preview,
  orderings,
})
