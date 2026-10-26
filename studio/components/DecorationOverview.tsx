import { useEffect, useState } from 'react'
import { Badge, Box, Card, Flex, Heading, Spinner, Stack, Text } from '@sanity/ui'
import { useClient } from 'sanity'
import {
  CATALOGUE_QUERY,
  CatalogueError,
  describePricingRule,
  parseCatalogue,
  resolveDecorations,
  type Catalogue,
} from '@bs/core'

/**
 * Read-only overview answering "which designs get which decoration, and
 * how?". Uses the same resolution code as the website, on PUBLISHED data,
 * so it shows exactly what customers see.
 */
export function DecorationOverview() {
  const client = useClient({ apiVersion: '2025-02-19' })
  const [state, setState] = useState<{ catalogue?: Catalogue; issues?: string[]; error?: string }>({})

  useEffect(() => {
    let cancelled = false
    client
      .withConfig({ perspective: 'published' })
      .fetch(CATALOGUE_QUERY)
      .then((raw) => {
        const { catalogue, issues } = parseCatalogue(raw)
        if (!cancelled) setState({ catalogue, issues })
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const message =
          err instanceof CatalogueError ? `${err.message} ${err.issues.join(' ')}` : 'Could not load the catalogue.'
        setState({ error: message })
      })
    return () => {
      cancelled = true
    }
  }, [client])

  if (state.error) {
    return (
      <Card padding={4} tone="critical">
        <Text>{state.error}</Text>
      </Card>
    )
  }
  if (!state.catalogue) {
    return (
      <Flex padding={5} justify="center">
        <Spinner />
      </Flex>
    )
  }

  const { catalogue, issues = [] } = state
  const perDesign = catalogue.designs.map((design) => ({ design, resolved: resolveDecorations(catalogue, design) }))

  return (
    <Box padding={4}>
      <Stack space={5}>
        <Text size={1} muted>
          Published content only. Publish changes to see them here and on the website.
        </Text>

        {issues.length > 0 && (
          <Card padding={3} tone="caution" radius={2}>
            <Stack space={2}>
              <Text weight="semibold">Items that customers can't see or order</Text>
              {issues.map((issue) => (
                <Text key={issue} size={1}>
                  {issue}
                </Text>
              ))}
            </Stack>
          </Card>
        )}

        {catalogue.decorations.map((decoration) => {
          const rows = perDesign.map(({ design, resolved }) => {
            const entry = resolved.find((r) => r.decoration.id === decoration.id)
            const override = design.decorationOverrides.find((o) => o.decorationId === decoration.id)
            return { design, entry, override }
          })
          return (
            <Card key={decoration.id} padding={3} radius={2} border>
              <Stack space={3}>
                <Flex gap={2} align="center" wrap="wrap">
                  <Heading size={1}>{decoration.name}</Heading>
                  {!decoration.active && <Badge tone="critical">Disabled</Badge>}
                  <Badge>{describePricingRule(decoration.pricing)}</Badge>
                  <Badge tone="primary">
                    {decoration.defaultRule.appliesTo === 'none'
                      ? 'Not applied by default'
                      : `Default: ${decoration.defaultRule.status === 'included' ? 'included' : 'optional add-on'}`}
                  </Badge>
                </Flex>
                {rows.length === 0 && <Text size={1} muted>No published designs yet.</Text>}
                {rows.map(({ design, entry, override }) => (
                  <Flex key={design.id} gap={2} align="center" wrap="wrap">
                    <Box flex={1}>
                      <Text size={1}>{design.name}</Text>
                    </Box>
                    {entry ? (
                      <Badge tone={entry.status === 'included' ? 'positive' : 'primary'}>
                        {entry.status === 'included' ? 'Included' : `Optional · ${describePricingRule(entry.pricing)}`}
                      </Badge>
                    ) : (
                      <Badge>Not on this design</Badge>
                    )}
                    <Badge mode="outline">{override ? 'Design override' : entry ? 'Inherited' : '—'}</Badge>
                  </Flex>
                ))}
              </Stack>
            </Card>
          )
        })}
      </Stack>
    </Box>
  )
}
