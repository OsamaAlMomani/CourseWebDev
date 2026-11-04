import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './shared/ErrorBoundary'
import { initTheme } from './lib/theme'
import { initInkwellFx } from './lib/inkwellFx'
import { initQuality } from './lib/quality'
import { CatalogProvider } from './context/CatalogContext'
import { ShopProvider } from './context/ShopContext'

// light or dark? decided before anything is drawn
initTheme()

// how heavy the effects are (full / lite / min): weak devices start light, slow frames step it down
initQuality()

// reveal-on-scroll, card tilt, magnetic buttons (the INKWELL behaviour that has no component)
initInkwellFx()

// Providers = "global memory" that any component below can read.
// Catalog first (books never depend on the user), Shop second (cart, wishlist, sign-in).
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CatalogProvider>
      <ShopProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </ShopProvider>
    </CatalogProvider>
  </StrictMode>,
)
