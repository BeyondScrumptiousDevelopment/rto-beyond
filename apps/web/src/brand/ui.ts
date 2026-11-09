/**
 * Shared class names, matching the main site's rebranded design system:
 * powder-blue surface, navy text and buttons, mist cards, sharp shapes.
 */

export const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-[2px] bg-navy px-8 py-4 text-sm uppercase tracking-[0.2em] text-mist transition hover:bg-slate active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-navy'

export const btnSecondary =
  'inline-flex items-center justify-center gap-2 rounded-[2px] border border-navy/30 px-8 py-4 text-sm uppercase tracking-[0.2em] text-navy transition hover:bg-navy/5 active:scale-[0.97]'

/** Buttons on a navy band. */
export const btnOnNavy =
  'inline-flex items-center justify-center gap-2 rounded-[2px] bg-mist px-8 py-4 text-sm uppercase tracking-[0.2em] text-navy transition hover:bg-surface active:scale-[0.97]'
export const btnOnNavySecondary =
  'inline-flex items-center justify-center gap-2 rounded-[2px] border border-mist/40 px-8 py-4 text-sm uppercase tracking-[0.2em] text-mist transition hover:bg-mist/10 active:scale-[0.97]'

export const btnWhatsapp =
  'inline-flex items-center justify-center gap-3 rounded-[2px] bg-whatsapp px-8 py-4 text-sm font-semibold uppercase tracking-[0.15em] text-navy transition hover:brightness-95 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50'

export const eyebrow = 'uppercase tracking-[0.4em] text-xs md:text-sm text-slate'

export const card = 'rounded-none border border-slate/20 bg-mist p-6 md:p-10'

export const inputClass =
  'w-full rounded-[2px] border border-slate/20 bg-mist px-5 py-4 text-navy placeholder:text-navy/40 focus:outline-none focus:ring-2 focus:ring-navy/30 aria-[invalid=true]:border-alert aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-alert/40'

export const labelClass = 'mb-2 block text-sm uppercase tracking-[0.15em] text-slate'

export const choiceClass = (selected: boolean, disabled = false) =>
  [
    'w-full rounded-[2px] border px-4 py-4 text-left transition',
    selected ? 'border-navy bg-navy text-mist' : 'border-navy/20 bg-navy/5 text-navy hover:bg-navy/10',
    disabled ? 'cursor-not-allowed opacity-50 hover:bg-navy/5' : 'cursor-pointer',
  ].join(' ')

/** Secondary text inside a choice card, readable whether selected (navy) or not. */
export const choiceSubtext = (selected: boolean) => (selected ? 'text-mist/80' : 'text-navy/70')
