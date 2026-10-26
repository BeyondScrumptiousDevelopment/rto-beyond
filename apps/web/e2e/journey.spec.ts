import { expect, test, type Page } from '@playwright/test'
import { DEFAULT_DISCLAIMER, DISCLAIMER_HEADING, findBannedPhrases } from '../../../packages/core/src/index'
import { mockSanity } from './fixtures'

async function expectNoOrderLanguage(page: Page) {
  const text = await page.locator('body').innerText()
  expect(findBannedPhrases(text)).toEqual([])
}

test.describe('catalogue', () => {
  test('lists published designs with starting prices and a custom CTA', async ({ page }) => {
    await mockSanity(page)
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Ready-to-Order Cakes' })).toBeVisible()

    const cardA = page.locator('a[href="/cakes/test-design-a"]')
    await expect(cardA).toContainText('From £10')
    await expect(cardA).toContainText('Available to enquire')
    await expect(page.locator('a[href="/cakes/test-design-b"]')).toContainText('From £12')
    await expect(page.locator('a[href="/cakes/test-design-paused"]')).toContainText('Not taking enquiries')

    // Invalid and draft documents never appear.
    await expect(page.getByText('Test Draft')).toHaveCount(0)
    await expect(page.getByText('test-design-invalid')).toHaveCount(0)

    await expect(page.getByRole('heading', { name: 'Looking for something different? Request a custom cake.' })).toBeVisible()
    await expectNoOrderLanguage(page)
  })

  test('shows an error and no prices when the catalogue cannot load', async ({ page }) => {
    await mockSanity(page, { status: 500 })
    await page.goto('/')
    await expect(page.getByRole('alert')).toContainText("the catalogue isn't available")
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible()
    expect(await page.locator('main').innerText()).not.toContain('£')
  })

  test('shows an error when settings are missing', async ({ page }) => {
    await mockSanity(page, { mutate: (raw) => ((raw as Record<string, unknown>).settings = null) })
    await page.goto('/')
    await expect(page.getByRole('alert')).toContainText('settings have not been published')
  })
})

test.describe('design page', () => {
  test('shows photos, captions, labels and items not included in the price', async ({ page }) => {
    await mockSanity(page)
    await page.goto('/cakes/test-design-a')
    await expect(page.getByRole('heading', { level: 1, name: 'Test Design A' })).toBeVisible()
    await expect(page.getByRole('img', { name: 'Test Design A front view' })).toBeVisible()
    await expect(page.getByLabel('Photo labels')).toContainText('Test label beside')

    await page.getByRole('button', { name: 'Show photo 2: Side view' }).click()
    await expect(page.getByText('Side view').first()).toBeVisible()
    await expect(page.getByLabel('Photo labels')).toContainText('Test overlay')

    await page.getByRole('button', { name: 'Show photo 3: Cross-section' }).click()
    await expect(page.getByText('Test drip — Available as a paid option')).toBeVisible()
  })

  test('paused designs cannot be enquired about', async ({ page }) => {
    await mockSanity(page)
    await page.goto('/cakes/test-design-paused')
    await expect(page.getByText('Test Design Paused is not taking enquiries at the moment.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Continue' })).toHaveCount(0)
  })

  test('only offers supported sizes', async ({ page }) => {
    await mockSanity(page)
    await page.goto('/cakes/test-design-a')
    const sizes = page.getByRole('group', { name: 'Choose a size' }).getByRole('radio')
    await expect(sizes).toHaveCount(3)
    await expect(page.getByText('6-inch square, 3 layers')).toHaveCount(0)
    await expect(page.getByText('Two-tier test')).toHaveCount(0)
  })

  test('an unsupported size in the URL cannot be quoted', async ({ page }) => {
    await mockSanity(page)
    await page.goto('/cakes/test-design-a?size=cfg-sq6-3&step=review')
    await expect(page.getByText('Step 1 of 5')).toBeVisible()
    await expect(page.getByText("We can't calculate an estimate for this selection")).toBeVisible()
    await expect(page.getByRole('link', { name: /Send Cake Enquiry via WhatsApp/ })).toHaveCount(0)
  })

  test('rejects incompatible decorations', async ({ page }) => {
    await mockSanity(page)
    await page.goto('/cakes/test-design-a?size=cfg-r6-3&flavour=flv-vanilla&filling=fil-jam&frosting=frs-butter&step=decorations')
    await page.getByLabel(/Test Card Topper/).check()
    await page.getByLabel(/Test Acrylic Topper/).check()
    await expect(page.getByText("Test Card Topper can't be combined with Test Acrylic Topper.").first()).toBeVisible()
  })

  test('applies product-specific notice periods', async ({ page }) => {
    await mockSanity(page)
    await page.goto('/cakes/test-design-b')
    await page.getByLabel(/6-inch round, 3 layers/).check()
    await expect(page.getByTestId('estimated-total').first()).toHaveText('£12')
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByLabel('Name for Test Name Charm').fill('Test')
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByText("This cake needs at least 14 days' notice")).toBeVisible()
    await expect(page.getByLabel('Requested date')).toHaveAttribute('min', '2026-11-09')
  })
})

test('full journey: configure, enter details and send the enquiry via WhatsApp', async ({ page, context, browserName }) => {
  await mockSanity(page)
  if (browserName === 'chromium') await context.grantPermissions(['clipboard-read', 'clipboard-write'])

  await page.goto('/')
  await page.locator('a[href="/cakes/test-design-a"]').click()
  await expect(page).toHaveURL(/\/cakes\/test-design-a/)

  // Step 1 — size
  await page.getByLabel(/6-inch round, 3 layers/).check()
  const total = page.getByTestId('estimated-total').first()
  await expect(total).toHaveText('£10')
  await page.getByRole('button', { name: 'Continue' }).click()

  // Step 2 — options (defaults are pre-selected; choose a paid upgrade)
  await expect(page.getByLabel(/Test Vanilla/)).toBeChecked()
  await page.getByLabel(/Test Premium/).check()
  await expect(total).toHaveText('£15')
  await page.getByRole('button', { name: 'Continue' }).click()

  // Step 3 — decorations: included vs paid, with personalisation
  await expect(page.getByRole('heading', { name: 'Included with this design' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Included with this design' })).toContainText('Test Balls')
  await page.getByLabel(/Test Name and Age/).check()
  await expect(total).toHaveText('£24')
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByText('Enter the name for Test Name and Age.').first()).toBeVisible()
  await page.getByLabel('Name for Test Name and Age').fill('Mia')
  await page.getByLabel('Age for Test Name and Age').fill('5')
  await page.getByRole('button', { name: 'Continue' }).click()

  // Step 4 — details, with minimum-notice validation
  await expect(page.getByText(/not mean a date is available/)).toBeVisible()
  await page.getByLabel('Requested date').fill('2026-11-01')
  await page.getByLabel('Name', { exact: true }).fill('Test Customer')
  await page.getByLabel('Contact number').fill('07700 900000')
  await page.getByRole('button', { name: 'Review enquiry' }).click()
  await expect(page.getByText(/The earliest date you can request is Monday 2 November 2026/)).toBeVisible()
  await page.getByLabel('Requested date').fill('2026-11-07')
  await page.getByLabel('Requested time (optional)').fill('14:00')
  await page.getByLabel('Occasion (optional)').fill('Birthday')
  await page.getByLabel('Notes (optional)').fill('Blue & gold please #5')
  await page.getByRole('button', { name: 'Review enquiry' }).click()

  // Step 5 — review: specification, estimate, prominent disclaimer, WhatsApp
  await expect(page.getByText('Step 5 of 5')).toBeVisible()
  const review = page.locator('#builder-heading').locator('..')
  await expect(review.getByText('Test Design A (TEST-A)')).toBeVisible()
  await expect(review.getByText('Saturday 7 November 2026, 14:00 — not yet confirmed')).toBeVisible()
  const disclaimer = page.locator('#disclaimer-final')
  await expect(disclaimer).toBeVisible()
  await expect(disclaimer).toContainText(DISCLAIMER_HEADING)
  await expect(disclaimer).toContainText(DEFAULT_DISCLAIMER)

  const cta = page.getByRole('link', { name: 'Send Cake Enquiry via WhatsApp' })
  const href = await cta.getAttribute('href')
  const url = new URL(href!)
  expect(url.origin + url.pathname).toBe('https://wa.me/447000000000')
  const message = url.searchParams.get('text')!
  expect(message).toContain('Cake: Test Design A')
  expect(message).toContain('Design reference: TEST-A')
  expect(message).toContain('Size: 6-inch round, 3 layers')
  expect(message).toContain('Sponge flavour: Test Premium (+£5)')
  expect(message).toContain('Included decorations: Test Balls')
  expect(message).toContain('• Test Name and Age (Name: "Mia", Age: 5) — £9')
  expect(message).toContain('Requested date: Saturday 7 November 2026')
  expect(message).toContain('*Estimated total: £24*')
  expect(message).toContain('Blue & gold please #5')
  expect(message).toContain(DEFAULT_DISCLAIMER)
  expect(href).not.toContain(' ')

  // The site never claims anything was sent or confirmed.
  await cta.evaluate((a) => a.setAttribute('target', '_self'))
  await page.route('https://wa.me/**', (route) => route.fulfill({ body: 'wa' }))
  const [popup] = await Promise.all([page.waitForURL('https://wa.me/**'), cta.click()])
  void popup
  await page.goBack()

  await expectNoOrderLanguage(page)
})

test('copy fallback and custom requests', async ({ page, context, browserName }) => {
  await mockSanity(page)
  if (browserName === 'chromium') await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/cakes/test-design-a?size=cfg-r6-3&flavour=flv-vanilla&filling=fil-jam&frosting=frs-butter&step=details')
  await page.getByLabel('Requested date').fill('2026-11-07')
  await page.getByLabel('Name', { exact: true }).fill('Test Customer')
  await page.getByLabel('Contact number').fill('07700 900000')
  await page.getByLabel(/My request includes something not listed here/).check()
  await page.getByRole('button', { name: 'Review enquiry' }).click()
  await expect(page.getByText('Describe the custom request so Beyond Scrumptious can quote for it.')).toBeVisible()
  await page.getByLabel('Notes (optional)').fill('A test character topper')
  await page.getByRole('button', { name: 'Review enquiry' }).click()

  await expect(page.getByText('Custom request (not priced)')).toBeVisible()
  await expect(page.getByText(/Your custom request is not included and will be quoted separately/).first()).toBeVisible()

  await page.getByRole('button', { name: 'Copy enquiry' }).click()
  await expect(page.getByText(/Enquiry copied|select the text below/)).toBeVisible()
  const preview = await page.getByLabel('Enquiry message').inputValue()
  expect(preview).toContain('*CUSTOM REQUEST — NOT INCLUDED IN ESTIMATE*')
  expect(preview).toContain('A test character topper')
  expect(preview).toContain('*Estimated total: £10*')
  if (browserName === 'chromium') {
    const clip = await page.evaluate(() => navigator.clipboard.readText()).catch(() => null)
    if (clip !== null) expect(clip).toBe(preview)
  }
})
