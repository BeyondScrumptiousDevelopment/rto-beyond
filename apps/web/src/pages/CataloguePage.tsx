import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatPence, startingPrice, type Catalogue, type Design } from '@bs/core'
import { eyebrow } from '../brand/ui'
import { CustomOrderCta } from '../enquiry/CustomOrderCta'
import { imageSrcSet, imageUrl } from '../sanity/fetchCatalogue'
import { resolveConfigurations } from '@bs/core'

function sizeSummary(catalogue: Catalogue, design: Design): string | null {
  const sizes = resolveConfigurations(catalogue, design).filter((o) => o.available)
  if (!sizes.length) return null
  const inches = [...new Set(sizes.map((s) => s.configuration.sizeInches).filter(Boolean))].sort((a, b) => a! - b!)
  const layers = [...new Set(sizes.map((s) => s.configuration.spongeLayers))].sort((a, b) => a - b)
  const sizeText = inches.length ? `${inches.map((i) => `${i}"`).join(' / ')}` : `${sizes.length} sizes`
  return `${sizeText} · ${layers.join(', ')} layers`
}

function DesignCard({ catalogue, design }: { catalogue: Catalogue; design: Design }) {
  const from = startingPrice(catalogue, design)
  const sizes = sizeSummary(catalogue, design)
  const canEnquire = design.acceptingEnquiries && from !== null

  return (
    <li className="reveal">
      <Link
        to={`/cakes/${design.slug}`}
        className="group flex h-full flex-col overflow-hidden rounded-[2rem] bg-navy-deep shadow-xl transition hover:-translate-y-1 hover:shadow-2xl"
      >
        <div className="aspect-[4/3] overflow-hidden bg-black">
          {design.mainImage ? (
            <img
              src={imageUrl(design.mainImage.url, 800)}
              srcSet={imageSrcSet(design.mainImage.url, [400, 800, 1200])}
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              alt={design.mainImage.alt}
              loading="lazy"
              className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-cream/50">Photo coming soon</div>
          )}
        </div>
        <div className="flex flex-1 flex-col p-6 md:p-8">
          <h2 className="heading-font mb-3 text-2xl md:text-3xl">{design.name}</h2>
          {design.shortDescription && <p className="mb-5 leading-7 text-cream/70">{design.shortDescription}</p>}
          <div className="mt-auto space-y-2 text-sm">
            {sizes && <p className="text-mist/80">{sizes}</p>}
            {from !== null && (
              <p className="text-lg text-cream">
                From <span className="font-semibold">{formatPence(from)}</span>
              </p>
            )}
            <p className={`text-xs uppercase tracking-[0.2em] ${canEnquire ? 'text-gold' : 'text-cream/50'}`}>
              {canEnquire ? 'Available to enquire' : 'Not taking enquiries at the moment'}
            </p>
          </div>
        </div>
      </Link>
    </li>
  )
}

export default function CataloguePage({ catalogue }: { catalogue: Catalogue }) {
  const [category, setCategory] = useState<string | null>(null)
  const { settings } = catalogue

  const categories = useMemo(
    () => catalogue.categories.filter((c) => catalogue.designs.some((d) => d.categoryId === c.id)),
    [catalogue],
  )
  const designs = useMemo(
    () =>
      [...catalogue.designs]
        .filter((d) => !category || d.categoryId === category)
        .sort((a, b) => Number(b.featured) - Number(a.featured) || a.order - b.order),
    [catalogue, category],
  )

  return (
    <>
      <section className="px-6 pt-40 pb-16 text-center md:pt-48">
        <div className="reveal mx-auto max-w-4xl">
          <p className={`${eyebrow} mb-6`}>Eggless cakes · Harrow & London</p>
          <h1 className="heading-font mb-8 text-5xl leading-tight md:text-7xl">Ready-to-Order Cakes</h1>
          <p className="mx-auto max-w-3xl text-lg leading-8 text-cream/70 md:text-xl">
            Choose a design, pick your size, flavours and finishing touches, and see an estimated price. Then send us
            your enquiry on WhatsApp — we'll review it and confirm the details with you.
          </p>
          <p className="mx-auto mt-6 max-w-2xl text-sm text-cream/50">
            Please allow at least {settings.defaultLeadTimeDays} days' notice. Sending an enquiry does not confirm an
            order or reserve a date.
          </p>
        </div>
      </section>

      {settings.maintenanceNotice && (
        <div className="mx-auto mb-10 max-w-3xl px-6">
          <div role="status" className="rounded-2xl border border-gold/60 bg-gold/10 p-5 text-center text-gold-light">
            {settings.maintenanceNotice}
          </div>
        </div>
      )}

      <section aria-label="Cake designs" className="bg-mist/0 px-6 pb-24">
        <div className="mx-auto max-w-7xl">
          {categories.length > 1 && (
            <div className="mb-10 flex flex-wrap justify-center gap-3" role="group" aria-label="Filter by category">
              <button
                type="button"
                aria-pressed={category === null}
                onClick={() => setCategory(null)}
                className={`rounded-full px-5 py-2 text-sm uppercase tracking-[0.15em] transition ${category === null ? 'bg-cream text-navy' : 'border border-cream/30 hover:bg-cream/10'}`}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={category === c.id}
                  onClick={() => setCategory(c.id)}
                  className={`rounded-full px-5 py-2 text-sm uppercase tracking-[0.15em] transition ${category === c.id ? 'bg-cream text-navy' : 'border border-cream/30 hover:bg-cream/10'}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}

          {designs.length ? (
            <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {designs.map((d) => (
                <DesignCard key={d.id} catalogue={catalogue} design={d} />
              ))}
            </ul>
          ) : (
            <p className="py-16 text-center text-cream/60">
              New designs are on their way. In the meantime, ask us about a custom cake.
            </p>
          )}
        </div>
      </section>

      <section className="px-6 pb-28">
        <div className="mx-auto max-w-5xl">
          <CustomOrderCta catalogue={catalogue} />
        </div>
      </section>
    </>
  )
}
