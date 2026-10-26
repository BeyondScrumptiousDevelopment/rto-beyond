import { defineField, defineType } from 'sanity'
import { DEFAULT_DISCLAIMER } from '@bs/core'
import { checkWhatsappNumber } from '../lib/rules'

export default defineType({
  name: 'cakeSiteSettings',
  title: 'Cake Builder Settings',
  type: 'document',
  groups: [
    { name: 'contact', title: 'Contact', default: true },
    { name: 'ordering', title: 'Ordering rules' },
    { name: 'wording', title: 'Customer wording' },
    { name: 'status', title: 'Site status' },
  ],
  fields: [
    defineField({ name: 'businessName', title: 'Business name', type: 'string', group: 'contact', initialValue: 'Beyond Scrumptious', validation: (Rule) => Rule.required() }),
    defineField({ name: 'mainWebsiteUrl', title: 'Main website URL', type: 'url', group: 'contact', initialValue: 'https://www.beyondscrumptious.com', validation: (Rule) => Rule.required() }),
    defineField({ name: 'cakeBuilderUrl', title: 'Cake builder URL', type: 'url', group: 'contact', initialValue: 'https://cakes.beyondscrumptious.com' }),
    defineField({
      name: 'whatsappNumber',
      title: 'WhatsApp number for enquiries',
      description: 'International format, e.g. +44 7933 903000. Every enquiry is sent to this number.',
      type: 'string',
      group: 'contact',
      validation: (Rule) => Rule.custom((v) => checkWhatsappNumber(v as string | undefined)),
    }),
    defineField({ name: 'contactEmail', title: 'Contact email', type: 'string', group: 'contact', validation: (Rule) => Rule.email() }),
    defineField({ name: 'privacyNoticeUrl', title: 'Privacy notice URL', type: 'url', group: 'contact' }),
    defineField({ name: 'allergenInfoUrl', title: 'Allergen information URL', type: 'url', group: 'contact' }),
    defineField({
      name: 'customOrderUrl',
      title: 'Custom order enquiry URL',
      description: 'Where "Request a custom cake" links to.',
      type: 'url',
      group: 'contact',
      validation: (Rule) => Rule.required(),
    }),

    defineField({ name: 'currency', title: 'Currency', type: 'string', group: 'ordering', initialValue: 'GBP', readOnly: true }),
    defineField({ name: 'timezone', title: 'Timezone', type: 'string', group: 'ordering', initialValue: 'Europe/London', readOnly: true }),
    defineField({
      name: 'defaultLeadTimeDays',
      title: 'Minimum notice (days)',
      description: 'Calendar days between today and the earliest collection date a customer can request. Individual designs can override this.',
      type: 'number',
      group: 'ordering',
      initialValue: 7,
      validation: (Rule) => Rule.required().integer().min(0).max(365),
    }),
    defineField({ name: 'collectionInstructions', title: 'Collection instructions', type: 'text', rows: 3, group: 'ordering' }),

    defineField({
      name: 'quotationDisclaimer',
      title: 'Enquiry disclaimer',
      description: 'Shown prominently before the WhatsApp button and included in every enquiry message.',
      type: 'text',
      rows: 5,
      group: 'wording',
      initialValue: DEFAULT_DISCLAIMER,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'customOrderCtaText',
      title: 'Custom order button text',
      type: 'string',
      group: 'wording',
      initialValue: 'Looking for something different? Request a custom cake.',
    }),
    defineField({
      name: 'servingsNote',
      title: 'Servings note',
      type: 'string',
      group: 'wording',
      initialValue: 'Serving numbers are estimates and depend on how the cake is sliced.',
    }),
    defineField({ name: 'dessertPortionsHelp', title: 'What "dessert portions" means', type: 'text', rows: 2, group: 'wording' }),
    defineField({ name: 'coffeePortionsHelp', title: 'What "coffee portions" means', type: 'text', rows: 2, group: 'wording' }),

    defineField({
      name: 'builderEnabled',
      title: 'Accept enquiries',
      description: 'Turn off to pause all enquiries. Customers can still browse.',
      type: 'boolean',
      group: 'status',
      initialValue: true,
    }),
    defineField({
      name: 'maintenanceNotice',
      title: 'Maintenance notice',
      description: 'If filled in, this message is shown and enquiries are paused until it is cleared.',
      type: 'text',
      rows: 2,
      group: 'status',
    }),
  ],
  preview: { prepare: () => ({ title: 'Cake Builder Settings' }) },
})
