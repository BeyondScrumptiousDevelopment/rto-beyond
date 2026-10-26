import { describePortions, describeStructure, formatPence, type OfferedConfiguration, type Settings } from '@bs/core'
import { choiceClass } from '../brand/ui'

export function SizeStep({
  offered,
  selectedId,
  onSelect,
  settings,
}: {
  offered: OfferedConfiguration[]
  selectedId: string | null
  onSelect: (id: string) => void
  settings: Settings
}) {
  const available = offered.filter((o) => o.available)

  return (
    <fieldset>
      <legend className="heading-font mb-2 text-2xl md:text-3xl">Choose a size</legend>
      <p className="mb-6 text-sm text-cream/60">Only the sizes and layer options made for this design are shown.</p>

      {available.length === 0 ? (
        <p className="text-cream/70">No sizes are currently available for this design.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {available.map(({ configuration: c, basePricePence, note }) => {
            const selected = c.id === selectedId
            const structure = describeStructure(c)
            const portions = describePortions(c)
            return (
              <label key={c.id} className={`${choiceClass(selected)} flex gap-4`}>
                <input
                  type="radio"
                  name="size"
                  value={c.id}
                  checked={selected}
                  onChange={() => onSelect(c.id)}
                  className="mt-1 h-4 w-4 shrink-0 accent-navy"
                />
                <span className="flex-1">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="font-semibold">{c.label}</span>
                    <span className="shrink-0 tabular-nums">{formatPence(basePricePence!)}</span>
                  </span>
                  <span className={`mt-1 block text-sm ${selected ? 'text-navy/70' : 'text-cream/60'}`}>
                    {structure.slice(1).join(' · ')}
                  </span>
                  {portions.length > 0 && (
                    <span className={`mt-1 block text-sm ${selected ? 'text-navy/70' : 'text-cream/60'}`}>
                      {portions.join(' · ')}
                    </span>
                  )}
                  {note && <span className={`mt-1 block text-sm italic ${selected ? 'text-navy/70' : 'text-cream/60'}`}>{note}</span>}
                </span>
              </label>
            )
          })}
        </div>
      )}

      {(settings.servingsNote || settings.dessertPortionsHelp || settings.coffeePortionsHelp) && (
        <div className="mt-6 space-y-2 text-sm leading-6 text-cream/60">
          {settings.dessertPortionsHelp && (
            <p>
              <strong className="text-cream/80">Dessert portions:</strong> {settings.dessertPortionsHelp}
            </p>
          )}
          {settings.coffeePortionsHelp && (
            <p>
              <strong className="text-cream/80">Coffee portions:</strong> {settings.coffeePortionsHelp}
            </p>
          )}
          {settings.servingsNote && <p className="italic">{settings.servingsNote}</p>}
        </div>
      )}
    </fieldset>
  )
}
