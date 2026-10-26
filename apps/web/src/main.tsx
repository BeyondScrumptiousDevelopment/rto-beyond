import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Layout from './brand/Layout'
import { CatalogueProvider, useCatalogueState } from './catalogue/CatalogueProvider'
import { LoadError, Loading } from './catalogue/Status'
import CataloguePage from './pages/CataloguePage'
import DesignPage from './pages/DesignPage'
import './index.css'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    // Braces matter: newer browsers return a Promise from scrollTo, which must not become the cleanup.
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function App() {
  const { state, retry } = useCatalogueState()
  return (
    <Layout>
      <ScrollToTop />
      {state.status === 'loading' && <Loading />}
      {state.status === 'error' && <LoadError message={state.message} onRetry={retry} />}
      {state.status === 'ready' && (
        <Routes>
          <Route path="/" element={<CataloguePage catalogue={state.catalogue} />} />
          <Route path="/cakes/:slug" element={<DesignPage catalogue={state.catalogue} />} />
          <Route path="*" element={<CataloguePage catalogue={state.catalogue} />} />
        </Routes>
      )}
    </Layout>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <CatalogueProvider>
        <App />
      </CatalogueProvider>
    </BrowserRouter>
  </StrictMode>,
)
