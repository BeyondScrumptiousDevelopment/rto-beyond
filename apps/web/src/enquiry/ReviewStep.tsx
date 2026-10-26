import { useState } from 'react'
import { FaCopy, FaWhatsapp } from 'react-icons/fa'
import {
  describePortions,
  describeStructure,
  formatDate,
  WHATSAPP_CTA,
  type Catalogue,
  type CustomerDetails,
  type Estimate,
} from '@bs/core'
import { btnSecondary, btnWhatsapp } from '../brand/ui'
import { PriceSummary } from '../builder/PriceSummary'
import { imageUrl } from '../sanity/fetchCatalogue'
import { copyText } from '../lib/clipboard'
import { Disclaimer } from './Disclaimer'

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-3 border-b border-white/10 py-2 text-sm sm:grid-cols-[11rem_1fr]">
      <dt className="text-mist/70">{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

export function ReviewStep({
  catalogue,
  estimate,
  customer,
  message,
  url,
}: {
  catalogue: Catalogue
  estimate: Estimate & { totalPence: number }
  customer: CustomerDetails
  message: string
  url: string
}) {
  const [opened, setOpened] = useState(false)
  const [copied, setCopied] = useState<'idle' | 'done' | 'failed'>('idle')
  const { design, offered } = estimate
  const c = offered!.configuration
  const names = (kind: string) =>
    estimate.lines
      .filter((l) => l.kind === kind)
      .map((l) => l.label)
      .join(', ') || '—'

  return (
    <div className="space-y-10">
      <section aria-labelledby="spec-heading">
        <h3 id="spec-heading" className="heading-font mb-4 text-2xl">
          Your cake
        </h3>
        <div className="grid gap-6 md:grid-cols-[minmax(0,14rem)_1fr]">
          {design.mainImage && (
            <figure>
              <img
                src={imageUrl(design.mainImage.url, 600)}
                alt={design.mainImage.alt}
                className="aspect-square w-full rounded-2xl bg-black object-cover"
              />
              <figcaption className="mt-2 text-xs text-cream/50">
                Reference photo of the design. Your selections are listed alongside.
              </figcaption>
            </figure>
          )}
          <dl>
            <Row label="Design" value={`${design.name} (${design.reference})`} />
            <Row label="Size" value={c.label} />
            <Row label="Structure" value={describeStructure(c).slice(1).join(' · ')} />
            {describePortions(c).length > 0 && <Row label="Portions" value={describePortions(c).join(' · ')} />}
            <Row label="Sponge flavour" value={names('flavour')} />
            <Row label="Filling" value={names('filling')} />
            <Row label="Frosting" value={names('frosting')} />
            <Row
              label="Included decorations"
              value={estimate.includedDecorations.map((d) => (d.detail ? `${d.label} (${d.detail})` : d.label)).join(', ') || '—'}
            />
            <Row
              label="Additional decorations"
              value={
                estimate.lines
                  .filter((l) => l.kind === 'decoration')
                  .map((l) => (l.detail ? `${l.label} (${l.detail})` : l.label))
                  .join(', ') || '—'
              }
            />
            <Row
              label="Extras"
              value={
                estimate.lines
                  .filter((l) => l.kind === 'extra')
                  .map((l) => (l.quantity > 1 ? `${l.label} × ${l.quantity}` : l.label))
                  .join(', ') || '—'
              }
            />
            <Row
              label="Requested date"
              value={`${formatDate(customer.collectionDate)}${customer.collectionTime ? `, ${customer.collectionTime}` : ''} — not yet confirmed`}
            />
            <Row label="Name" value={customer.name} />
            <Row label="Contact number" value={customer.phone} />
            {customer.occasion && <Row label="Occasion" value={customer.occasion} />}
            {customer.notes && (
              <Row
                label={customer.customRequest ? 'Custom request (not priced)' : 'Notes'}
                value={<span className="whitespace-pre-line">{customer.notes}</span>}
              />
            )}
          </dl>
        </div>
      </section>

      <section aria-labelledby="estimate-heading" className="rounded-2xl bg-white/5 p-5 md:p-6">
        <h3 id="estimate-heading" className="heading-font mb-2 text-2xl">
          Estimated price
        </h3>
        <PriceSummary result={estimate} customRequest={customer.customRequest} />
      </section>

      <div className="space-y-6">
        <Disclaimer id="disclaimer-final" text={catalogue.settings.quotationDisclaimer} />

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpened(true)}
            className={btnWhatsapp}
            aria-describedby="disclaimer-final"
          >
            <FaWhatsapp aria-hidden className="text-xl" />
            {WHATSAPP_CTA}
          </a>
          <button
            type="button"
            className={btnSecondary}
            onClick={async () => setCopied((await copyText(message)) ? 'done' : 'failed')}
          >
            <FaCopy aria-hidden /> Copy enquiry
          </button>
        </div>

        <div aria-live="polite" className="space-y-2 text-sm">
          {opened && (
            <p className="text-cream/80">
              WhatsApp should now open with your message. Please check it and <strong>press send in WhatsApp</strong> —
              we only receive your enquiry once you send it. If WhatsApp didn't open, copy the enquiry and send it to
              us yourself.
            </p>
          )}
          {copied === 'done' && <p className="text-mist">Enquiry copied. Paste it into WhatsApp or a message to us.</p>}
          {copied === 'failed' && (
            <p className="text-alert">Copying didn't work on this device — select the text below and copy it instead.</p>
          )}
        </div>

        <details className="rounded-2xl border border-white/15 p-4" open={copied === 'failed'}>
          <summary className="cursor-pointer text-sm uppercase tracking-[0.15em] text-mist">
            Preview the message we'll prepare
          </summary>
          <textarea
            readOnly
            value={message}
            rows={14}
            aria-label="Enquiry message"
            className="mt-4 w-full rounded-xl bg-white/95 p-4 font-mono text-xs text-navy"
            onFocus={(e) => e.currentTarget.select()}
          />
        </details>
      </div>
    </div>
  )
}
