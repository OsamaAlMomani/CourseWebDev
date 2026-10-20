import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { CatalogProvider } from './context/CatalogContext'
import { ShopProvider } from './context/ShopContext'

// Providers = "global memory" that any component below can read.
// Catalog first (books never depend on the user), Shop second (cart, wishlist, sign-in).
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CatalogProvider>
      <ShopProvider>
        <App />
      </ShopProvider>
    </CatalogProvider>
  </StrictMode>,
)
