import { CATALOGUE_QUERY, CatalogueError, parseCatalogue, type ParseResult } from '@bs/core'

const API_VERSION = 'v2025-02-19'
// Collapsing whitespace keeps the GET URL well under Sanity's size limit.
const QUERY = CATALOGUE_QUERY.replace(/\s+/g, ' ').trim()
const TIMEOUT_MS = 12_000

// The cake builder's own Sanity project (public ID). An env var can point elsewhere, e.g. in tests.
const projectId = (import.meta.env.VITE_SANITY_PROJECT_ID as string | undefined) || 'sxg9pxs1'
const dataset = (import.meta.env.VITE_SANITY_DATASET as string | undefined) || 'production'

/**
 * Fetches the published catalogue from Sanity's live API. No token is used,
 * so drafts and private data are never returned.
 *
 * Any failure throws — the UI then shows an error rather than stale or
 * guessed prices. Nothing is cached in the browser.
 */
export async function fetchCatalogue(): Promise<ParseResult> {
  if (!projectId) throw new CatalogueError('The cake builder has not been connected to its catalogue yet.')

  // The live API (not the API CDN) so published changes show on the next page load.
  const url = `https://${projectId}.api.sanity.io/${API_VERSION}/data/query/${dataset}?query=${encodeURIComponent(QUERY)}&perspective=published`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  let response: Response
  try {
    response = await fetch(url, { signal: controller.signal, cache: 'no-store' })
  } catch {
    throw new CatalogueError('We could not load the cake catalogue. Please check your connection and try again.')
  } finally {
    clearTimeout(timer)
  }
  if (!response.ok) {
    throw new CatalogueError(`The cake catalogue is temporarily unavailable (error ${response.status}). Please try again shortly.`)
  }

  let body: unknown
  try {
    body = await response.json()
  } catch {
    throw new CatalogueError('The cake catalogue response could not be read.')
  }
  const result = (body as { result?: unknown } | null)?.result
  const parsed = parseCatalogue(result, new Date().toISOString())
  if (parsed.issues.length && import.meta.env.DEV) console.warn('Catalogue issues:', parsed.issues)
  return parsed
}

/** Responsive Sanity image URL. */
export function imageUrl(url: string, width: number): string {
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}w=${width}&auto=format&fit=max&q=80`
}

export function imageSrcSet(url: string, widths: number[] = [480, 800, 1200, 1600]): string {
  return widths.map((w) => `${imageUrl(url, w)} ${w}w`).join(', ')
}
