import { formatPence, type EstimateLine, type EstimateResult } from '@bs/core'

const GROUPS: { kind: EstimateLine['kind']; title: string }[] = [
  { kind: 'base', title: 'Cake' },
  { kind: 'flavour', title: 'Sponge flavour' },
  { kind: 'filling', title: 'Filling' },
  { kind: 'frosting', title: 'Frosting' },
  { kind: 'decoration', title: 'Additional decorations' },
  { kind: 'extra', title: 'Extras' },
]

function price(line: EstimateLine) {
  return line.totalPence === 0 ? 'Included' : formatPence(line.totalPence)
}

/** Itemised estimate. Updates on every change; shows no total if anything can't be priced. */
export function PriceSummary({ result, customRequest = false }: { result: EstimateResult; customRequest?: boolean }) {
  if (!result.ok) {
    return (
      <div role="alert" className="rounded-none border border-alert/40 bg-alert-soft p-5 text-sm text-alert">
        <p className="mb-2 font-semibold">We can't calculate an estimate for this selection</p>
        <ul className="list-disc space-y-1 pl-5">
          {result.errors.map((e, i) => (
            <li key={i}>{e.message}</li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div aria-live="polite">
      {GROUPS.map(({ kind, title }) => {
        const lines = result.lines.filter((l) => l.kind === kind)
        if (!lines.length) return null
        return (
          <div key={kind} className="border-b border-navy/10 py-3">
            <p className="mb-1 text-xs uppercase tracking-[0.2em] text-slate">{title}</p>
            {lines.map((line) => (
              <div key={line.id} className="flex justify-between gap-4 text-sm">
                <span>
                  {line.kind === 'base' ? line.label.split(' — ').slice(1).join(' — ') || line.label : line.label}
                  {line.quantity > 1 && ` × ${line.quantity}`}
                  {line.detail && <span className="block text-xs text-navy/70">{line.detail}</span>}
                </span>
                <span className="shrink-0 tabular-nums">{price(line)}</span>
              </div>
            ))}
          </div>
        )
      })}

      {result.includedDecorations.length > 0 && (
        <div className="border-b border-navy/10 py-3">
          <p className="mb-1 text-xs uppercase tracking-[0.2em] text-slate">Included decorations</p>
          {result.includedDecorations.map((d) => (
            <div key={d.id} className="flex justify-between gap-4 text-sm">
              <span>
                {d.label}
                {d.detail && <span className="block text-xs text-navy/70">{d.detail}</span>}
              </span>
              <span className="shrink-0">Included</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-baseline justify-between gap-4 pt-4">
        <span className="text-sm uppercase tracking-[0.2em] text-slate">Estimated total</span>
        <span className="heading-font text-3xl tabular-nums" data-testid="estimated-total">
          {result.totalPence === null ? '—' : formatPence(result.totalPence)}
        </span>
      </div>
      <p className="mt-2 text-xs leading-5 text-navy/60">
        {customRequest
          ? 'Ready-to-order items only. Your custom request is not included and will be quoted separately.'
          : 'An estimate only. Beyond Scrumptious will confirm the final price.'}
      </p>
    </div>
  )
}
