import { formatPence, priceFor, type OptionKind, type ResolvedGroup } from '@bs/core'
import { choiceClass } from '../brand/ui'

const TITLES: Record<OptionKind, { title: string; noun: string }> = {
  flavour: { title: 'Sponge flavour', noun: 'flavour' },
  filling: { title: 'Filling', noun: 'filling' },
  frosting: { title: 'Frosting', noun: 'frosting' },
}

export function OptionsStep({
  groups,
  configurationId,
  selected,
  onChange,
  issues,
}: {
  groups: Record<OptionKind, ResolvedGroup>
  configurationId: string
  selected: Record<OptionKind, string[]>
  onChange: (kind: OptionKind, ids: string[]) => void
  issues: { field?: string; message: string }[]
}) {
  const kinds = (Object.keys(TITLES) as OptionKind[]).filter((k) => groups[k].choices.length > 0)

  if (!kinds.length) {
    return <p className="text-cream/70">This design has no flavour choices to make — continue to the next step.</p>
  }

  return (
    <div className="space-y-10">
      {kinds.map((kind) => {
        const group = groups[kind]
        const { title, noun } = TITLES[kind]
        const multi = group.maxSelections > 1
        const chosen = selected[kind]
        const groupIssues = issues.filter((i) => i.field === kind)
        return (
          <fieldset key={kind} aria-describedby={groupIssues.length ? `${kind}-issues` : undefined}>
            <legend className="heading-font mb-2 text-2xl">
              {title}
              {!group.required && <span className="ml-2 text-sm text-cream/50">(optional)</span>}
            </legend>
            <p className="mb-4 text-sm text-cream/60">
              {multi ? `Choose up to ${group.maxSelections} ${noun}s.` : `Choose one ${noun}.`}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {group.choices.map((choice) => {
                const price = priceFor(choice.pricing, configurationId)
                const unavailable = price === null
                const isSelected = chosen.includes(choice.option.id)
                const atLimit = multi && !isSelected && chosen.length >= group.maxSelections
                const toggle = () => {
                  if (unavailable) return
                  if (!multi) return onChange(kind, [choice.option.id])
                  onChange(kind, isSelected ? chosen.filter((id) => id !== choice.option.id) : [...chosen, choice.option.id])
                }
                return (
                  <label key={choice.option.id} className={`${choiceClass(isSelected, unavailable || atLimit)} flex gap-4`}>
                    <input
                      type={multi ? 'checkbox' : 'radio'}
                      name={kind}
                      checked={isSelected}
                      disabled={unavailable || atLimit}
                      onChange={toggle}
                      className="mt-1 h-4 w-4 shrink-0 accent-navy"
                    />
                    <span className="flex-1">
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="font-semibold">{choice.option.name}</span>
                        <span className="shrink-0 text-sm tabular-nums">
                          {unavailable ? 'Not available in this size' : price === 0 ? 'Included' : `+${formatPence(price)}`}
                        </span>
                      </span>
                      {choice.option.description && (
                        <span className={`mt-1 block text-sm ${isSelected ? 'text-navy/70' : 'text-cream/60'}`}>{choice.option.description}</span>
                      )}
                      {choice.option.dietaryNotes && (
                        <span className={`mt-1 block text-xs ${isSelected ? 'text-navy/70' : 'text-mist/70'}`}>{choice.option.dietaryNotes}</span>
                      )}
                    </span>
                  </label>
                )
              })}
            </div>
            {groupIssues.length > 0 && (
              <p id={`${kind}-issues`} className="mt-3 text-sm text-alert">
                {groupIssues.map((i) => i.message).join(' ')}
              </p>
            )}
          </fieldset>
        )
      })}
    </div>
  )
}
