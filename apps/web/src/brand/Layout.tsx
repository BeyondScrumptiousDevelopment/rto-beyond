import type { ReactNode } from 'react'
import { useCatalogueState } from '../catalogue/CatalogueProvider'
import Footer from './Footer'
import Navbar from './Navbar'

export default function Layout({ children }: { children: ReactNode }) {
  const { state } = useCatalogueState()
  const settings = state.status === 'ready' ? state.catalogue.settings : undefined

  return (
    <div className="flex min-h-screen flex-col bg-navy text-cream">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:rounded-full focus:bg-cream focus:px-6 focus:py-3 focus:text-navy"
      >
        Skip to content
      </a>
      <Navbar customOrderUrl={settings?.customOrderUrl} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer settings={settings} />
    </div>
  )
}
