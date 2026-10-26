import { DISCLAIMER_HEADING } from '@bs/core'

/** The mandatory enquiry-only disclaimer (spec §12.1). Never hide or shrink this. */
export function Disclaimer({ text, id }: { text: string; id?: string }) {
  return (
    <section
      id={id}
      aria-labelledby={id ? `${id}-heading` : undefined}
      className="rounded-2xl border-2 border-gold bg-gold/10 p-5 md:p-6"
    >
      <h3 id={id ? `${id}-heading` : undefined} className="mb-3 text-base font-bold tracking-wide text-gold-light md:text-lg">
        {DISCLAIMER_HEADING}
      </h3>
      <p className="leading-7 text-cream">{text}</p>
    </section>
  )
}
