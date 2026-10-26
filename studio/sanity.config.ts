import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { schemaTypes, SINGLETONS } from './schemaTypes'
import { structure } from './structure'

export default defineConfig({
  name: 'cakes',
  title: 'Beyond Scrumptious — Cake Builder',
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'missing-project-id',
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  plugins: [structureTool({ structure })],
  schema: {
    types: schemaTypes,
    // Settings is a singleton: hide it from "Create new".
    templates: (templates) => templates.filter(({ schemaType }) => !SINGLETONS.has(schemaType)),
  },
  document: {
    actions: (actions, { schemaType }) =>
      SINGLETONS.has(schemaType)
        ? actions.filter(({ action }) => action && ['publish', 'discardChanges', 'restore'].includes(action))
        : actions,
  },
})
