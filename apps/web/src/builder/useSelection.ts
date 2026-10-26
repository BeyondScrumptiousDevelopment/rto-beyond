import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { OPTION_KINDS, type OptionKind, type Selection } from '@bs/core'

/**
 * The cake selection is mirrored into the URL (IDs only), so a refresh, the
 * back button or a failed WhatsApp hand-off never loses the cake. Personal
 * details and personalisation text are NOT put in the URL.
 *
 * React state is the source of truth while the page is open so controls
 * respond immediately; the URL is updated alongside it and read back when
 * it changes from outside (back/forward, a shared link).
 */

export type Step = 'size' | 'options' | 'decorations' | 'details' | 'review'
export const STEPS: { id: Step; label: string }[] = [
  { id: 'size', label: 'Size & layers' },
  { id: 'options', label: 'Flavours & fillings' },
  { id: 'decorations', label: 'Decorations & extras' },
  { id: 'details', label: 'Collection & details' },
  { id: 'review', label: 'Review & send' },
]

interface State {
  selection: Selection
  step: Step
}

type Patch = {
  size?: string | null
  options?: Partial<Record<OptionKind, string[]>>
  decorationIds?: string[]
  extras?: Record<string, number>
  step?: Step
}

const list = (v: string | null) => (v ? v.split(',').filter(Boolean) : [])

function fromParams(params: URLSearchParams, designSlug: string): State {
  const extras: Record<string, number> = {}
  for (const entry of list(params.get('extras'))) {
    const [id, qty] = entry.split(':')
    const n = Number(qty)
    if (id && Number.isInteger(n) && n > 0) extras[id] = n
  }
  return {
    selection: {
      designSlug,
      configurationId: params.get('size'),
      options: { flavour: list(params.get('flavour')), filling: list(params.get('filling')), frosting: list(params.get('frosting')) },
      decorationIds: list(params.get('deco')),
      personalisation: {},
      extras,
    },
    step: (STEPS.find((s) => s.id === params.get('step'))?.id ?? 'size') as Step,
  }
}

function toParams({ selection, step }: State): URLSearchParams {
  const p = new URLSearchParams()
  if (selection.configurationId) p.set('size', selection.configurationId)
  for (const kind of OPTION_KINDS) if (selection.options[kind].length) p.set(kind, selection.options[kind].join(','))
  if (selection.decorationIds.length) p.set('deco', selection.decorationIds.join(','))
  const extras = Object.entries(selection.extras).filter(([, q]) => q > 0)
  if (extras.length) p.set('extras', extras.map(([id, q]) => `${id}:${q}`).join(','))
  if (step !== 'size') p.set('step', step)
  return p
}

function apply(state: State, patch: Patch): State {
  const s = state.selection
  return {
    step: patch.step ?? state.step,
    selection: {
      ...s,
      configurationId: patch.size !== undefined ? patch.size : s.configurationId,
      options: { ...s.options, ...patch.options },
      decorationIds: patch.decorationIds ?? s.decorationIds,
      extras: patch.extras ? Object.fromEntries(Object.entries(patch.extras).filter(([, q]) => q > 0)) : s.extras,
    },
  }
}

export function useSelection(designSlug: string) {
  const [params, setParams] = useSearchParams()
  const [state, setState] = useState<State>(() => fromParams(params, designSlug))
  const latest = useRef(state)
  latest.current = state

  // Follow URL changes made outside this hook (back/forward, pasted links).
  useEffect(() => {
    const fromUrl = fromParams(params, designSlug)
    if (toParams(fromUrl).toString() !== toParams(latest.current).toString()) setState(fromUrl)
  }, [params, designSlug])

  const update = useCallback(
    (patch: Patch) => {
      const next = apply(latest.current, patch)
      latest.current = next
      setState(next)
      // A step change is a new history entry; selection tweaks replace the current one.
      setParams(toParams(next), { replace: !patch.step })
    },
    [setParams],
  )

  return { selection: state.selection, step: state.step, update }
}
