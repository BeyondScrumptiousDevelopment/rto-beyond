import { formatDate, type CustomerDetails, type DateCheck, type DetailsIssue, type Settings } from '@bs/core'
import { inputClass, labelClass } from '../brand/ui'

export function DetailsStep({
  customer,
  onChange,
  earliest,
  leadDays,
  dateCheck,
  timeValid,
  issues,
  showErrors,
  settings,
}: {
  customer: CustomerDetails
  onChange: (c: CustomerDetails) => void
  earliest: string
  leadDays: number
  dateCheck: DateCheck
  timeValid: boolean
  issues: DetailsIssue[]
  showErrors: boolean
  settings: Settings
}) {
  const set = <K extends keyof CustomerDetails>(key: K, value: CustomerDetails[K]) => onChange({ ...customer, [key]: value })
  const err = (field: keyof CustomerDetails) => (showErrors ? issues.find((i) => i.field === field)?.message : undefined)
  const dateError = showErrors && !dateCheck.ok ? dateCheck.message : undefined
  const timeError = showErrors && !timeValid ? 'Enter a time such as 14:30, or leave it empty.' : undefined

  const field = (
    id: keyof CustomerDetails,
    label: string,
    input: React.ReactNode,
    error?: string,
    hint?: string,
  ) => (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      {input}
      {hint && (
        <p id={`${id}-hint`} className="mt-2 text-sm text-cream/60">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-2 text-sm text-alert">
          {error}
        </p>
      )}
    </div>
  )

  const describedBy = (id: string, error?: string, hint?: string) =>
    [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') || undefined

  return (
    <div className="space-y-10">
      <fieldset className="space-y-6">
        <legend className="heading-font mb-2 text-2xl">Collection request</legend>
        <p className="text-sm leading-6 text-cream/60">
          This cake needs at least {leadDays} days' notice — the earliest date you can request is{' '}
          <strong className="text-cream">{formatDate(earliest)}</strong>. Meeting the notice period does not mean a date
          is available: every date is subject to confirmation by Beyond Scrumptious.
        </p>
        <div className="grid gap-6 sm:grid-cols-2">
          {field(
            'collectionDate',
            'Requested date',
            <input
              id="collectionDate"
              type="date"
              required
              min={earliest}
              className={inputClass}
              value={customer.collectionDate}
              onChange={(e) => set('collectionDate', e.target.value)}
              aria-invalid={!!dateError}
              aria-describedby={describedBy('collectionDate', dateError)}
            />,
            dateError,
          )}
          {field(
            'collectionTime',
            'Requested time (optional)',
            <input
              id="collectionTime"
              type="time"
              className={inputClass}
              value={customer.collectionTime}
              onChange={(e) => set('collectionTime', e.target.value)}
              aria-invalid={!!timeError}
              aria-describedby={describedBy('collectionTime', timeError)}
            />,
            timeError,
          )}
        </div>
        {settings.collectionInstructions && <p className="text-sm leading-6 text-cream/60">{settings.collectionInstructions}</p>}
      </fieldset>

      <fieldset className="space-y-6">
        <legend className="heading-font mb-2 text-2xl">Your details</legend>
        <div className="grid gap-6 sm:grid-cols-2">
          {field(
            'name',
            'Name',
            <input
              id="name"
              required
              autoComplete="name"
              className={inputClass}
              value={customer.name}
              maxLength={80}
              onChange={(e) => set('name', e.target.value)}
              aria-invalid={!!err('name')}
              aria-describedby={describedBy('name', err('name'))}
            />,
            err('name'),
          )}
          {field(
            'phone',
            'Contact number',
            <input
              id="phone"
              type="tel"
              required
              autoComplete="tel"
              className={inputClass}
              value={customer.phone}
              maxLength={20}
              onChange={(e) => set('phone', e.target.value)}
              aria-invalid={!!err('phone')}
              aria-describedby={describedBy('phone', err('phone'))}
            />,
            err('phone'),
          )}
        </div>
        {field(
          'occasion',
          'Occasion (optional)',
          <input
            id="occasion"
            className={inputClass}
            placeholder="e.g. Birthday"
            value={customer.occasion}
            maxLength={80}
            onChange={(e) => set('occasion', e.target.value)}
          />,
          err('occasion'),
        )}
        {field(
          'notes',
          'Notes (optional)',
          <textarea
            id="notes"
            rows={4}
            className={inputClass}
            value={customer.notes}
            maxLength={1000}
            onChange={(e) => set('notes', e.target.value)}
            aria-invalid={!!err('notes')}
            aria-describedby={describedBy('notes', err('notes'), 'notes')}
          />,
          err('notes'),
          'Anything else we should know. Notes are not priced.',
        )}

        <label className="flex gap-4 rounded-xl border border-white/20 bg-white/5 p-4">
          <input
            type="checkbox"
            checked={customer.customRequest}
            onChange={(e) => set('customRequest', e.target.checked)}
            className="mt-1 h-4 w-4 shrink-0 accent-gold"
          />
          <span className="text-sm leading-6">
            <span className="font-semibold">My request includes something not listed here</span>
            <span className="block text-cream/60">
              For example an extra image, a character or logo, a different decoration or a design change. Describe it in
              the notes — it will be marked as a custom request, reviewed and quoted separately by Beyond Scrumptious,
              and is <strong>not included in the estimate</strong>.
            </span>
          </span>
        </label>
      </fieldset>

      {settings.privacyNoticeUrl && (
        <p className="text-xs leading-5 text-cream/50">
          Your details are only used to prepare your WhatsApp message — they aren't saved by this website. See our{' '}
          <a href={settings.privacyNoticeUrl} className="underline hover:text-cream">
            privacy notice
          </a>
          .
        </p>
      )}
    </div>
  )
}
