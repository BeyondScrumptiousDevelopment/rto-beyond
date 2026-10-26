import {
  decorationLabel,
  formatPence,
  type DecorationsForConfiguration,
  type ResolvedDecoration,
  type ResolvedExtra,
} from '@bs/core'
import { choiceClass, inputClass, labelClass } from '../brand/ui'

type Personalisation = Record<string, { name?: string; age?: string }>

function PersonalisationFields({
  r,
  value,
  onChange,
  issues,
}: {
  r: ResolvedDecoration
  value: { name?: string; age?: string }
  onChange: (v: { name?: string; age?: string }) => void
  issues: { field?: string; message: string }[]
}) {
  const p = r.decoration.personalisation
  if (!p.name && !p.age) return null
  const id = r.decoration.id
  const issueFor = (f: string) => issues.find((i) => i.field === `personalisation.${id}.${f}`)
  return (
    <div className="mt-3 grid gap-4 rounded-xl bg-white/5 p-4 sm:grid-cols-2">
      {p.name && (
        <div>
          <label className={labelClass} htmlFor={`${id}-name`}>
            Name for {decorationLabel(r)}
          </label>
          <input
            id={`${id}-name`}
            className={inputClass}
            value={value.name ?? ''}
            maxLength={40}
            autoComplete="off"
            aria-invalid={!!issueFor('name')}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
          />
        </div>
      )}
      {p.age && (
        <div>
          <label className={labelClass} htmlFor={`${id}-age`}>
            Age for {decorationLabel(r)}
          </label>
          <input
            id={`${id}-age`}
            className={inputClass}
            inputMode="numeric"
            value={value.age ?? ''}
            maxLength={3}
            autoComplete="off"
            aria-invalid={!!issueFor('age')}
            onChange={(e) => onChange({ ...value, age: e.target.value.replace(/\D/g, '') })}
          />
        </div>
      )}
    </div>
  )
}

export function DecorationsStep({
  decorations,
  extras,
  selectedDecorations,
  onDecorationsChange,
  selectedExtras,
  onExtrasChange,
  personalisation,
  onPersonalisationChange,
  issues,
}: {
  decorations: DecorationsForConfiguration
  extras: (ResolvedExtra & { pricePence: number })[]
  selectedDecorations: string[]
  onDecorationsChange: (ids: string[]) => void
  selectedExtras: Record<string, number>
  onExtrasChange: (extras: Record<string, number>) => void
  personalisation: Personalisation
  onPersonalisationChange: (p: Personalisation) => void
  issues: { field?: string; message: string }[]
}) {
  const replaced = new Set(
    decorations.optional.filter((o) => selectedDecorations.includes(o.decoration.id)).map((o) => o.decoration.upgradeOfId),
  )
  const decorationIssues = issues.filter((i) => i.field === 'decorations')
  const extraIssues = issues.filter((i) => i.field === 'extras')
  const setPersonalisation = (id: string, v: { name?: string; age?: string }) =>
    onPersonalisationChange({ ...personalisation, [id]: v })

  return (
    <div className="space-y-10">
      {decorations.included.length > 0 && (
        <section aria-labelledby="included-heading">
          <h3 id="included-heading" className="heading-font mb-2 text-2xl">
            Included with this design
          </h3>
          <p className="mb-4 text-sm text-cream/60">These are part of the price shown — no extra charge.</p>
          <ul className="space-y-3">
            {decorations.included.map((r) => (
              <li key={r.decoration.id} className="rounded-xl border border-white/15 bg-white/5 px-4 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className={replaced.has(r.decoration.id) ? 'text-cream/50 line-through' : ''}>{decorationLabel(r)}</span>
                  <span className="text-sm text-mist">{replaced.has(r.decoration.id) ? 'Upgraded' : 'Included'}</span>
                </div>
                {r.decoration.description && <p className="mt-1 text-sm text-cream/60">{r.decoration.description}</p>}
                {!replaced.has(r.decoration.id) && (
                  <PersonalisationFields
                    r={r}
                    value={personalisation[r.decoration.id] ?? {}}
                    onChange={(v) => setPersonalisation(r.decoration.id, v)}
                    issues={issues}
                  />
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <fieldset aria-describedby={decorationIssues.length ? 'decoration-issues' : undefined}>
        <legend className="heading-font mb-2 text-2xl">Additional decorations</legend>
        {decorations.optional.length === 0 ? (
          <p className="text-sm text-cream/60">No additional decorations are offered for this design and size.</p>
        ) : (
          <>
            <p className="mb-4 text-sm text-cream/60">Optional. Prices are added to your estimate.</p>
            <div className="grid gap-3">
              {decorations.optional.map((r) => {
                const id = r.decoration.id
                const isSelected = selectedDecorations.includes(id)
                return (
                  <div key={id}>
                    <label className={`${choiceClass(isSelected)} flex gap-4`}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() =>
                          onDecorationsChange(isSelected ? selectedDecorations.filter((d) => d !== id) : [...selectedDecorations, id])
                        }
                        className="mt-1 h-4 w-4 shrink-0 accent-navy"
                      />
                      <span className="flex-1">
                        <span className="flex items-baseline justify-between gap-3">
                          <span className="font-semibold">{decorationLabel(r)}</span>
                          <span className="shrink-0 text-sm tabular-nums">+{formatPence(r.pricePence)}</span>
                        </span>
                        {r.decoration.description && (
                          <span className={`mt-1 block text-sm ${isSelected ? 'text-navy/70' : 'text-cream/60'}`}>{r.decoration.description}</span>
                        )}
                        {r.note && <span className={`mt-1 block text-sm italic ${isSelected ? 'text-navy/70' : 'text-cream/60'}`}>{r.note}</span>}
                        {(r.decoration.personalisation.name || r.decoration.personalisation.age) && (
                          <span className={`mt-1 block text-xs ${isSelected ? 'text-navy/60' : 'text-mist/70'}`}>
                            Personalised with {[r.decoration.personalisation.name && 'a name', r.decoration.personalisation.age && 'an age'].filter(Boolean).join(' and ')}
                          </span>
                        )}
                      </span>
                    </label>
                    {isSelected && (
                      <PersonalisationFields
                        r={r}
                        value={personalisation[id] ?? {}}
                        onChange={(v) => setPersonalisation(id, v)}
                        issues={issues}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
        {decorationIssues.length > 0 && (
          <div id="decoration-issues" className="mt-3 space-y-1 text-sm text-alert" role="alert">
            {decorationIssues.map((i, n) => (
              <p key={n}>{i.message}</p>
            ))}
          </div>
        )}
      </fieldset>

      {extras.length > 0 && (
        <fieldset>
          <legend className="heading-font mb-2 text-2xl">Extras</legend>
          <p className="mb-4 text-sm text-cream/60">Optional.</p>
          <div className="grid gap-3">
            {extras.map(({ extra, pricePence }) => {
              const qty = selectedExtras[extra.id] ?? 0
              const range = extra.quantity
              const setQty = (n: number) => onExtrasChange({ ...selectedExtras, [extra.id]: n })
              return (
                <div key={extra.id} className={`${choiceClass(qty > 0)} flex items-center gap-4`}>
                  {range ? (
                    <div className="flex shrink-0 items-center gap-2" role="group" aria-label={`Quantity of ${extra.name}`}>
                      <button
                        type="button"
                        aria-label={`Fewer ${extra.name}`}
                        disabled={qty === 0}
                        onClick={() => setQty(qty <= range.min ? 0 : qty - 1)}
                        className="h-9 w-9 rounded-full border border-current text-lg disabled:opacity-30"
                      >
                        −
                      </button>
                      <span className="w-6 text-center tabular-nums" aria-live="polite">
                        {qty}
                      </span>
                      <button
                        type="button"
                        aria-label={`More ${extra.name}`}
                        disabled={qty >= range.max}
                        onClick={() => setQty(qty === 0 ? range.min : qty + 1)}
                        className="h-9 w-9 rounded-full border border-current text-lg disabled:opacity-30"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <input
                      type="checkbox"
                      aria-label={extra.name}
                      checked={qty > 0}
                      onChange={() => setQty(qty > 0 ? 0 : 1)}
                      className="h-4 w-4 shrink-0 accent-navy"
                    />
                  )}
                  <span className="flex-1">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="font-semibold">{extra.name}</span>
                      <span className="shrink-0 text-sm tabular-nums">
                        {pricePence === 0 ? 'Included' : `+${formatPence(pricePence)}${range ? ' each' : ''}`}
                      </span>
                    </span>
                    {extra.description && <span className={`mt-1 block text-sm ${qty > 0 ? 'text-navy/70' : 'text-cream/60'}`}>{extra.description}</span>}
                  </span>
                </div>
              )
            })}
          </div>
          {extraIssues.length > 0 && (
            <p className="mt-3 text-sm text-alert" role="alert">
              {extraIssues.map((i) => i.message).join(' ')}
            </p>
          )}
        </fieldset>
      )}
    </div>
  )
}
