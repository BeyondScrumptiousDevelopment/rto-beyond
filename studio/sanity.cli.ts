import { defineCliConfig } from 'sanity/cli'

/**
 * The Cakes Studio is separate from the main website's Studio and uses its
 * own Sanity project (sxg9pxs1). studio/.env can override it.
 */
export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'sxg9pxs1',
    dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  },
  studioHost: process.env.SANITY_STUDIO_HOST || 'beyondscrumptious-cakes',
})
