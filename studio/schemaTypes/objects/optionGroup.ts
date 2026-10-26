import { defineField, defineType } from 'sanity'
import { checkUniqueRefs } from '../../lib/rules'
import { priceOverrideField } from './pricingRule'

/**
 * One object type per option kind so each reference points at the right
 * library (flavours, fillings or frostings).
 */
function optionGroup(name: string, title: string, refType: string, noun: string) {
  return defineType({
    name,
    title,
    type: 'object',
    fields: [
      defineField({
        name: 'includeAllActive',
        title: `Offer every active ${noun}`,
        description: `Recommended. Any ${noun} you add or switch on in the library appears on this design automatically.`,
        type: 'boolean',
        initialValue: true,
      }),
      defineField({
        name: 'required',
        title: `Customer must choose a ${noun}`,
        type: 'boolean',
        initialValue: true,
      }),
      defineField({
        name: 'maxSelections',
        title: `Maximum ${noun}s a customer can choose`,
        type: 'number',
        initialValue: 1,
        validation: (Rule) => Rule.integer().min(1).max(10),
      }),
      defineField({
        name: 'choices',
        title: `Specific ${noun}s`,
        description: `If "Offer every active ${noun}" is off, only these are offered. You can also use this list to mark a default or set a different price for this design.`,
        type: 'array',
        validation: (Rule) =>
          Rule.custom((rows) => checkUniqueRefs(rows as { option?: { _ref?: string } }[], (r) => r.option, noun)),
        of: [
          {
            type: 'object',
            name: 'choice',
            fields: [
              defineField({ name: 'option', title: noun[0]!.toUpperCase() + noun.slice(1), type: 'reference', to: [{ type: refType }], validation: (Rule) => Rule.required() }),
              defineField({ name: 'isDefault', title: 'Pre-select this', type: 'boolean', initialValue: false }),
              priceOverrideField(`Leave empty to use the ${noun}'s normal price.`),
            ],
            preview: {
              select: { title: 'option.name', isDefault: 'isDefault', override: 'priceOverride.mode' },
              prepare: ({ title, isDefault, override }) => ({
                title,
                subtitle: [isDefault ? 'Pre-selected' : null, override ? 'Custom price on this design' : null].filter(Boolean).join(' · '),
              }),
            },
          },
        ],
      }),
    ],
  })
}

export const flavourGroup = optionGroup('cakeFlavourGroup', 'Sponge flavours', 'cakeFlavour', 'flavour')
export const fillingGroup = optionGroup('cakeFillingGroup', 'Fillings', 'cakeFilling', 'filling')
export const frostingGroup = optionGroup('cakeFrostingGroup', 'Frostings', 'cakeFrosting', 'frosting')
