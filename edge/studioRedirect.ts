/** Hosted Studio address, matching studioHost in studio/sanity.cli.ts. */
export const DEFAULT_STUDIO_URL = 'https://beyondscrumptious-cakes.sanity.studio'

/**
 * Where /studio (and anything under it) should go, or null for other paths.
 * Sub-paths are kept, so /studio/structure/cakeDesign opens that screen.
 */
export function studioRedirect(url: URL, studioUrl: string = DEFAULT_STUDIO_URL): string | null {
  const match = /^\/studio(\/.*)?$/.exec(url.pathname)
  if (!match) return null
  const base = (studioUrl || DEFAULT_STUDIO_URL).replace(/\/+$/, '')
  const rest = match[1] && match[1] !== '/' ? match[1] : ''
  return `${base}${rest}${url.search}`
}
