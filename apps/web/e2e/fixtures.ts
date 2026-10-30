import type { Page } from '@playwright/test'
import { rawTestCatalogue } from '../../../packages/core/fixtures/testCatalogue'

export const NOW = new Date('2026-10-26T10:00:00Z')

// 1×1 PNG served for every catalogue image.
const PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
)

export async function mockSanity(
  page: Page,
  options: { catalogue?: unknown; status?: number; mutate?: (raw: ReturnType<typeof rawTestCatalogue>) => void } = {},
) {
  await page.clock.setFixedTime(NOW)
  const raw = rawTestCatalogue()
  options.mutate?.(raw)
  const requests: string[] = []
  await page.route('https://testproject.api.sanity.io/**', async (route) => {
    requests.push(route.request().url())
    if (options.status && options.status >= 400) return route.fulfill({ status: options.status, body: 'error' })
    await route.fulfill({ json: { result: options.catalogue ?? raw, ms: 1 } })
  })
  await page.route('https://cdn.sanity.io/**', (route) => route.fulfill({ body: PIXEL, contentType: 'image/png' }))
  return { requests }
}
