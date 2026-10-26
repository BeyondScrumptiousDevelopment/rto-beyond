import { useState } from 'react'
import type { CakeImage } from '@bs/core'
import { imageSrcSet, imageUrl } from '../sanity/fetchCatalogue'

const SHOWN_STATUS: Record<CakeImage['shownElements'][number]['status'], string> = {
  included: 'Included in the standard price',
  paidOption: 'Available as a paid option',
  customExample: 'Custom order example — not available to order here',
}

const VIEW_LABEL: Record<CakeImage['view'], string> = {
  main: 'Main view',
  side: 'Side view',
  top: 'Top view',
  crossSection: 'Cross-section',
  detail: 'Detail',
  other: 'Photo',
}

/**
 * Product photos with optional structural labels. "Overlay" labels are drawn
 * as small numbered markers only — their text is listed beneath the photo so
 * nothing obscures the cake and labels stay readable on small screens.
 */
export function Gallery({ images, designName }: { images: CakeImage[]; designName: string }) {
  const [index, setIndex] = useState(0)

  if (!images.length) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-[2rem] bg-navy-deep text-center text-cream/60">
        <p className="px-6">Photos of {designName} are coming soon.</p>
      </div>
    )
  }

  const current = images[Math.min(index, images.length - 1)]!
  const overlays = current.labels.filter((l) => l.placement === 'overlay' && l.x !== null && l.y !== null)
  const beside = current.labels.filter((l) => !overlays.includes(l))

  return (
    <div>
      <figure>
        <div className="relative overflow-hidden rounded-[2rem] bg-black shadow-2xl">
          <img
            src={imageUrl(current.url, 1200)}
            srcSet={imageSrcSet(current.url)}
            sizes="(min-width: 1024px) 55vw, 100vw"
            alt={current.alt}
            width={current.width ?? undefined}
            height={current.height ?? undefined}
            className="aspect-[4/3] h-full w-full object-contain"
          />
          {overlays.map((label, i) => (
            <span
              key={`${label.text}-${i}`}
              aria-hidden
              className="absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-navy text-xs font-bold text-cream shadow-lg"
              style={{ left: `${label.x}%`, top: `${label.y}%` }}
            >
              {i + 1}
            </span>
          ))}
        </div>

        <figcaption className="mt-4 space-y-3 text-sm text-cream/80">
          <p className="text-xs uppercase tracking-[0.2em] text-mist/60">
            {VIEW_LABEL[current.view]}
            {images.length > 1 && ` · ${index + 1} of ${images.length}`}
          </p>
          {current.caption && <p>{current.caption}</p>}
          {(overlays.length > 0 || beside.length > 0) && (
            <ul className="flex flex-wrap gap-2" aria-label="Photo labels">
              {overlays.map((label, i) => (
                <li key={`o-${i}`} className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cream text-[0.65rem] font-bold text-navy" aria-label={`Marker ${i + 1}`}>
                    {i + 1}
                  </span>
                  {label.text}
                </li>
              ))}
              {beside.map((label, i) => (
                <li key={`b-${i}`} className="rounded-full bg-white/10 px-3 py-1.5">
                  {label.text}
                </li>
              ))}
            </ul>
          )}
          {current.shownElements.length > 0 && (
            <div className="rounded-xl border border-gold/50 bg-gold/10 p-3 text-gold-light">
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.15em]">Shown in this photo</p>
              <ul className="space-y-1">
                {current.shownElements.map((el, i) => (
                  <li key={i}>
                    {el.description} — <span className="text-cream">{SHOWN_STATUS[el.status]}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </figcaption>
      </figure>

      {images.length > 1 && (
        <ul className="mt-4 flex gap-3 overflow-x-auto pb-2" aria-label="Choose a photo">
          {images.map((img, i) => (
            <li key={`${img.url}-${i}`} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show photo ${i + 1}: ${img.caption ?? VIEW_LABEL[img.view]}`}
                aria-current={i === index}
                className={`block overflow-hidden rounded-xl border-2 transition ${i === index ? 'border-cream' : 'border-transparent opacity-70 hover:opacity-100'}`}
              >
                <img src={imageUrl(img.url, 200)} alt="" className="h-16 w-20 bg-black object-cover" loading="lazy" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
