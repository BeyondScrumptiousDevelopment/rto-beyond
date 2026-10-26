import { defineCliConfig } from 'sanity/cli'

/**
 * The Cakes Studio is separate from the main website's Studio and uses its
 * own Sanity project. Set the project ID in studio/.env (see .env.example).
 */
export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID,
    dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  },
  studioHost: process.env.SANITY_STUDIO_HOST || 'beyondscrumptious-cakes',
})
