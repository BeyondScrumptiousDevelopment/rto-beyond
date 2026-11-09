import { FaWhatsapp } from 'react-icons/fa'
import { buildCustomEnquiryMessage, whatsappUrl, type Catalogue, type Design } from '@bs/core'
import { btnOnNavy, btnOnNavySecondary, btnSecondary } from '../brand/ui'
import { BrandRipple } from '../brand/patterns'

/**
 * Routes anything outside the ready-to-order catalogue to a custom enquiry.
 * No price is ever attached to a custom request.
 */
export function CustomOrderCta({
  catalogue,
  design,
  compact = false,
}: {
  catalogue: Catalogue
  design?: Design
  compact?: boolean
}) {
  const { settings } = catalogue
  const whatsapp = whatsappUrl(
    settings.whatsappNumber,
    buildCustomEnquiryMessage(catalogue, design?.name ?? null, design?.reference ?? null),
  )
  const prompt = design?.customRouting.customPrompt

  const text =
    prompt ??
    'New designs, extra images, characters, logos, unlisted decorations or other sizes are quoted individually by Beyond Scrumptious — they are not priced here.'

  if (compact) {
    return (
      <section aria-labelledby="custom-cta-heading" className="rounded-none border border-slate/20 bg-mist p-5">
        <h2 id="custom-cta-heading" className="heading-font mb-2 text-xl">
          {settings.customOrderCtaText}
        </h2>
        <p className="mb-4 text-sm leading-7 text-navy/75">
          {text}
          {design && ' You can mention this design as a reference.'}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <a href={settings.customOrderUrl} className={btnSecondary}>
            Request a custom cake
          </a>
          <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={btnSecondary}>
            <FaWhatsapp aria-hidden className="text-lg" /> Ask on WhatsApp
          </a>
        </div>
      </section>
    )
  }

  // Full-width navy band with the ripple pattern, as on the main site's homepage.
  return (
    <section aria-labelledby="custom-cta-heading" className="on-navy relative overflow-hidden bg-navy px-6 py-24 text-center text-mist md:py-28">
      <BrandRipple />
      <div className="relative mx-auto max-w-3xl">
        <h2 id="custom-cta-heading" className="heading-font mb-6 text-3xl md:text-5xl">
          {settings.customOrderCtaText}
        </h2>
        <p className="mx-auto mb-10 max-w-2xl leading-8 text-mist/80">{text}</p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <a href={settings.customOrderUrl} className={btnOnNavy}>
            Request a custom cake
          </a>
          <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={btnOnNavySecondary}>
            <FaWhatsapp aria-hidden className="text-lg" /> Ask on WhatsApp
          </a>
        </div>
      </div>
    </section>
  )
}
