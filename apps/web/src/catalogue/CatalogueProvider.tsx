import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { CatalogueError, type Catalogue } from '@bs/core'
import { fetchCatalogue } from '../sanity/fetchCatalogue'

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; catalogue: Catalogue }

const Context = createContext<{ state: State; retry: () => void }>({ state: { status: 'loading' }, retry: () => {} })

export function CatalogueProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading' })
    fetchCatalogue()
      .then(({ catalogue }) => !cancelled && setState({ status: 'ready', catalogue }))
      .catch((err: unknown) => {
        if (cancelled) return
        const message =
          err instanceof CatalogueError ? err.message : 'Something went wrong loading the cake catalogue.'
        setState({ status: 'error', message })
      })
    return () => {
      cancelled = true
    }
  }, [attempt])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])
  return <Context.Provider value={{ state, retry }}>{children}</Context.Provider>
}

export const useCatalogueState = () => useContext(Context)
