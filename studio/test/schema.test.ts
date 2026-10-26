import { describe, expect, it } from 'vitest'
import { builtinTypes, groupProblems, validateSchema } from '@sanity/schema/_internal'
import { schemaTypes } from '../schemaTypes'

describe('Studio schema', () => {
  it('compiles without errors or warnings', () => {
    const validated = validateSchema([...builtinTypes, ...schemaTypes] as never)
    const ours = new Set(schemaTypes.map((t) => t.name))
    const problems = groupProblems(validated.getTypes() as never)
      // Sanity's own built-ins report themselves as "reserved" in this standalone check.
      .filter((group) => ours.has(group.path[0]?.name ?? ''))
      .flatMap((group) => group.problems.map((p) => `${p.severity}: ${group.path.map((s) => s.name).join(' > ')} — ${p.message}`))
    expect(problems).toEqual([])
  })

  it('namespaces every type to avoid clashing with other content', () => {
    for (const type of schemaTypes) expect(type.name.startsWith('cake')).toBe(true)
  })
})
