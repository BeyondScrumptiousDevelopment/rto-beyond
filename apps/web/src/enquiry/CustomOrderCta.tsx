import { FaWhatsapp } from 'react-icons/fa'
import { buildCustomEnquiryMessage, whatsappUrl, type Catalogue, type Design } from '@bs/core'
import { btnSecondary } from '../brand/ui'

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

  return (
    <section
      aria-labelledby="custom-cta-heading"
      className={compact ? 'rounded-2xl border border-white/15 p-5' : 'rounded-[2rem] bg-navy-deep p-8 text-center shadow-xl md:p-12'}
    >
      <h2 id="custom-cta-heading" className={compact ? 'heading-font mb-2 text-xl' : 'heading-font mb-4 text-3xl md:text-4xl'}>
        {settings.customOrderCtaText}
      </h2>
      <p className={`leading-7 text-cream/70 ${compact ? 'mb-4 text-sm' : 'mx-auto mb-8 max-w-2xl'}`}>
        {prompt ??
          'New designs, extra images, characters, logos, unlisted decorations or other sizes are quoted individually by Beyond Scrumptious — they are not priced here.'}
        {design && ' You can mention this design as a reference.'}
      </p>
      <div className={`flex flex-col gap-3 sm:flex-row ${compact ? '' : 'justify-center'}`}>
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
