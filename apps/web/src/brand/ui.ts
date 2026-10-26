/** Shared class names, matching the main site's buttons, cards and form fields. */

export const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-full bg-cream px-8 py-4 text-sm uppercase tracking-[0.2em] text-navy transition hover:bg-mist active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-cream'

export const btnSecondary =
  'inline-flex items-center justify-center gap-2 rounded-full border border-cream/30 px-8 py-4 text-sm uppercase tracking-[0.2em] text-cream transition hover:bg-cream/10 active:scale-[0.97]'

export const btnWhatsapp =
  'inline-flex items-center justify-center gap-3 rounded-full bg-whatsapp px-8 py-4 text-sm font-semibold uppercase tracking-[0.15em] text-navy transition hover:brightness-95 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50'

export const eyebrow = 'uppercase tracking-[0.4em] text-xs md:text-sm text-mist/70'

export const card = 'rounded-[2rem] bg-navy-deep p-6 md:p-10 shadow-xl'

export const inputClass =
  'w-full rounded-xl bg-white/95 px-5 py-4 text-navy placeholder:text-navy/40 focus:outline-none focus:ring-2 focus:ring-gold-light aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-alert'

export const labelClass = 'mb-2 block text-sm uppercase tracking-[0.15em] text-mist'

export const choiceClass = (selected: boolean, disabled = false) =>
  [
    'w-full rounded-xl border px-4 py-4 text-left transition',
    selected ? 'border-gold-light bg-cream text-navy' : 'border-white/20 bg-white/5 text-cream hover:bg-white/10',
    disabled ? 'cursor-not-allowed opacity-50 hover:bg-white/5' : 'cursor-pointer',
  ].join(' ')
