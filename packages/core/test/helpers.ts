import { rawTestCatalogue } from '../fixtures/testCatalogue'
import { parseCatalogue } from '../src/catalogue/parse'
import { emptySelection, type Selection } from '../src/types'

export const FETCHED_AT = '2026-10-26T10:00:00.000Z'

export function load(mutate?: (raw: ReturnType<typeof rawTestCatalogue>) => void) {
  const raw = rawTestCatalogue()
  mutate?.(raw)
  return parseCatalogue(raw, FETCHED_AT)
}

export function catalogue(mutate?: (raw: ReturnType<typeof rawTestCatalogue>) => void) {
  return load(mutate).catalogue
}

export function select(slug: string, patch: Partial<Selection> & { flavour?: string[]; filling?: string[]; frosting?: string[] } = {}): Selection {
  const base = emptySelection(slug)
  const { flavour, filling, frosting, ...rest } = patch
  return {
    ...base,
    ...rest,
    options: {
      flavour: flavour ?? base.options.flavour,
      filling: filling ?? base.options.filling,
      frosting: frosting ?? base.options.frosting,
    },
  }
}
